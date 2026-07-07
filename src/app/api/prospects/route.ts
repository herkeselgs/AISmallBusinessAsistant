import { NextResponse } from "next/server";
import { z } from "zod";
import { blankProspect, type Prospect } from "@/lib/folvra/prospects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Prospect finder. Real data only — never fabricates businesses.
 * Provider order:
 *   1. Google Places (if GOOGLE_PLACES_API_KEY is set) — richest data.
 *   2. OpenStreetMap (Nominatim + Overpass) — free, no key, coverage varies.
 * Returns { ok:false, reason } on any failure so the UI can fall back to
 * manual entry / CSV paste.
 */

const Body = z.object({
  city: z.string().min(2),
  trade: z.string().min(1),
  max: z.number().int().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, reason: "Enter a city and a trade." }, { status: 400 });
  }
  const max = input.max ?? 30;

  try {
    if (process.env.GOOGLE_PLACES_API_KEY) {
      const prospects = await fromGooglePlaces(input.trade, input.city, max);
      return NextResponse.json({ ok: true, provider: "Google Places", prospects });
    }
    const prospects = await fromOpenStreetMap(input.trade, input.city, max);
    if (!prospects.length) {
      return NextResponse.json({
        ok: true,
        provider: "OpenStreetMap",
        prospects: [],
        note: "No results from the free source for that trade/area — coverage is thin. Add a Google Places key for full results, or use CSV/paste import.",
      });
    }
    return NextResponse.json({ ok: true, provider: "OpenStreetMap", prospects });
  } catch (err) {
    console.error("prospect finder failed", err);
    return NextResponse.json(
      {
        ok: false,
        reason:
          "Automatic search is unavailable right now (no Google Places key, or outbound blocked). Use CSV / paste import — it always works.",
      },
      { status: 200 }
    );
  }
}

/* ------------------------- Google Places (New) ------------------------- */

async function fromGooglePlaces(trade: string, city: string, max: number): Promise<Prospect[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY!;
  const results: Prospect[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3 && results.length < max; page++) {
    const body: Record<string, unknown> = { textQuery: `${trade} in ${city}` };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.nationalPhoneNumber,places.websiteUri,places.formattedAddress,places.rating,places.userRatingCount,nextPageToken",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Places ${res.status}`);
    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        nationalPhoneNumber?: string;
        websiteUri?: string;
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
      }>;
      nextPageToken?: string;
    };
    for (const pl of data.places ?? []) {
      results.push(
        blankProspect({
          business: pl.displayName?.text ?? "",
          trade,
          phone: pl.nationalPhoneNumber ?? "",
          website: pl.websiteUri ?? "",
          address: pl.formattedAddress ?? "",
          rating: pl.rating != null ? String(pl.rating) : "",
          reviews: pl.userRatingCount != null ? String(pl.userRatingCount) : "",
          owner: "Unknown",
          source: "Google Places",
        })
      );
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return results.slice(0, max);
}

/* ------------------------- OpenStreetMap (free) ------------------------ */

const TRADE_TAGS: { match: string[]; filters: string[] }[] = [
  { match: ["hvac", "heating", "cooling", "air condition", "furnace"], filters: ['craft~"hvac|heating_engineer"'] },
  { match: ["plumb"], filters: ['craft="plumber"'] },
  { match: ["electric"], filters: ['craft="electrician"'] },
  { match: ["roof"], filters: ['craft="roofer"'] },
  { match: ["landscap", "lawn", "garden", "yard"], filters: ['craft~"gardener"', 'shop="garden_centre"'] },
  { match: ["paint"], filters: ['craft="painter"'] },
  { match: ["clean"], filters: ['craft~"cleaning"', 'office="cleaning"'] },
  { match: ["remodel", "contractor", "construction", "builder", "renovat", "carpen"], filters: ['craft~"builder|carpenter"', 'office="construction_company"'] },
];

function tradeFilters(trade: string): string[] {
  const t = trade.toLowerCase();
  for (const row of TRADE_TAGS) {
    if (row.match.some((m) => t.includes(m))) return row.filters;
  }
  // Unknown trade: broad craft net.
  return ['craft~"hvac|plumber|electrician|roofer|gardener|painter|builder|carpenter"'];
}

async function fromOpenStreetMap(trade: string, city: string, max: number): Promise<Prospect[]> {
  const ua = "FolvraProspectFinder/1.0 (folvra.com)";

  // 1) Geocode the city to a bounding box.
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`,
    { headers: { "User-Agent": ua, "Accept-Language": "en" } }
  );
  if (!geoRes.ok) throw new Error(`Nominatim ${geoRes.status}`);
  const geo = (await geoRes.json()) as Array<{ boundingbox?: [string, string, string, string] }>;
  const bb = geo[0]?.boundingbox;
  if (!bb) return [];
  // Nominatim bbox = [south, north, west, east]; Overpass wants (south,west,north,east).
  const [south, north, west, east] = bb;
  const bbox = `${south},${west},${north},${east}`;

  // 2) Overpass query for the trade's tags within the bbox.
  const filters = tradeFilters(trade);
  const clauses = filters.map((f) => `nwr[${f}](${bbox});`).join("\n");
  const query = `[out:json][timeout:25];(${clauses});out center tags ${max * 2};`;

  const opRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": ua },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!opRes.ok) throw new Error(`Overpass ${opRes.status}`);
  const op = (await opRes.json()) as {
    elements?: Array<{ tags?: Record<string, string> }>;
  };

  const out: Prospect[] = [];
  for (const el of op.elements ?? []) {
    const t = el.tags ?? {};
    const name = t.name || t["operator"] || "";
    if (!name) continue;
    const addr = [t["addr:housenumber"], t["addr:street"], t["addr:city"], t["addr:state"]]
      .filter(Boolean)
      .join(" ");
    out.push(
      blankProspect({
        business: name,
        trade,
        phone: t.phone || t["contact:phone"] || "",
        email: t.email || t["contact:email"] || "",
        website: t.website || t["contact:website"] || "",
        address: addr,
        owner: "Unknown",
        source: "OpenStreetMap",
      })
    );
    if (out.length >= max) break;
  }
  return out;
}
