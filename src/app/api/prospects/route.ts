import { NextResponse } from "next/server";
import { z } from "zod";
import { blankProspect, type Prospect } from "@/lib/folvra/prospects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Prospect finder. Real data only — never fabricates businesses.
 * Provider order:
 *   1. Google Places (key from request OR GOOGLE_PLACES_API_KEY env) — this is
 *      Google Maps' own business data (name, phone, website, address, rating,
 *      review count). Best by far.
 *   2. OpenStreetMap (Nominatim + Overpass) — free, no key, US SMB coverage is thin.
 * Returns { ok:false, reason } (or ok:true with needsKey) so the UI can fall back
 * to entering a key / CSV paste.
 */

const Body = z.object({
  city: z.string().min(2),
  trade: z.string().min(1),
  max: z.number().int().min(1).max(60).optional(),
  apiKey: z.string().trim().optional(),
});

export async function POST(req: Request) {
  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, reason: "Enter a city and a trade." }, { status: 400 });
  }
  const max = input.max ?? 30;
  const key = input.apiKey || process.env.GOOGLE_PLACES_API_KEY || "";

  // Prefer Google Places whenever we have a key.
  if (key) {
    try {
      const prospects = await fromGooglePlaces(key, input.trade, input.city, max);
      return NextResponse.json({ ok: true, provider: "Google Maps (Places)", prospects });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "error";
      let reason: string;
      if (/API key not valid|API_KEY_INVALID/i.test(raw)) {
        reason = "That Google Maps key isn't valid. Double-check you copied it fully.";
      } else if (/PERMISSION_DENIED|not enabled|SERVICE_DISABLED|has not been used/i.test(raw)) {
        reason = 'Enable "Places API (New)" for this key in Google Cloud (APIs & Services → Library).';
      } else if (/billing/i.test(raw)) {
        reason = "Turn on billing for the Google Cloud project (free $200/mo covers thousands of searches).";
      } else if (/quota|RESOURCE_EXHAUSTED|429/i.test(raw)) {
        reason = "Google quota hit — wait a minute and try again, or check quotas in Google Cloud.";
      } else {
        reason = "Google Maps search failed. Check the key, that Places API (New) is enabled, and billing is on.";
      }
      return NextResponse.json({ ok: false, reason }, { status: 200 });
    }
  }

  // No key → free OSM fallback (thin), then nudge to add a key.
  try {
    const prospects = await fromOpenStreetMap(input.trade, input.city, max);
    return NextResponse.json({
      ok: true,
      provider: "OpenStreetMap (free)",
      prospects,
      needsKey: true,
      note:
        "Free source coverage is thin for US trades. Paste a Google Maps (Places) API key above for full results — or use CSV/paste import.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: true,
        provider: "OpenStreetMap (free)",
        prospects: [],
        needsKey: true,
        note:
          "Automatic search needs a Google Maps (Places) API key (free) — paste one above. Meanwhile, CSV / paste import always works.",
      },
      { status: 200 }
    );
  }
}

/* ------------------------- Google Places (New) ------------------------- */

async function fromGooglePlaces(
  key: string,
  trade: string,
  city: string,
  max: number
): Promise<Prospect[]> {
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
          "places.displayName,places.nationalPhoneNumber,places.websiteUri,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,nextPageToken",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${t ? ` ${t.slice(0, 120)}` : ""}`);
    }
    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        nationalPhoneNumber?: string;
        websiteUri?: string;
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
        googleMapsUri?: string;
      }>;
      nextPageToken?: string;
    };
    for (const pl of data.places ?? []) {
      results.push(
        blankProspect({
          business: pl.displayName?.text ?? "",
          trade,
          phone: pl.nationalPhoneNumber ?? "",
          website: pl.websiteUri ?? pl.googleMapsUri ?? "",
          address: pl.formattedAddress ?? "",
          rating: pl.rating != null ? String(pl.rating) : "",
          reviews: pl.userRatingCount != null ? String(pl.userRatingCount) : "",
          owner: "Unknown",
          source: "Google Maps",
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
  return ['craft~"hvac|plumber|electrician|roofer|gardener|painter|builder|carpenter"'];
}

async function fromOpenStreetMap(trade: string, city: string, max: number): Promise<Prospect[]> {
  const ua = "FolvraProspectFinder/1.0 (folvra.com)";
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`,
    { headers: { "User-Agent": ua, "Accept-Language": "en" } }
  );
  if (!geoRes.ok) throw new Error(`Nominatim ${geoRes.status}`);
  const geo = (await geoRes.json()) as Array<{ boundingbox?: [string, string, string, string] }>;
  const bb = geo[0]?.boundingbox;
  if (!bb) return [];
  const [south, north, west, east] = bb;
  const bbox = `${south},${west},${north},${east}`;

  const filters = tradeFilters(trade);
  const clauses = filters.map((f) => `nwr[${f}](${bbox});`).join("\n");
  const query = `[out:json][timeout:25];(${clauses});out center tags ${max * 2};`;

  const opRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": ua },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!opRes.ok) throw new Error(`Overpass ${opRes.status}`);
  const op = (await opRes.json()) as { elements?: Array<{ tags?: Record<string, string> }> };

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
