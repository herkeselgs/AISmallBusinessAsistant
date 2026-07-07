/**
 * Prospect + outreach spreadsheet model and pure helpers (CSV/TSV, dedupe,
 * import parsing, summary, YC sync). No network here — all deterministic and
 * unit-tested. Business data is only ever what a real source/user provides;
 * nothing is fabricated.
 */

export type ProspectStatus =
  | "New"
  | "Contacted"
  | "Replied"
  | "Demo booked"
  | "Demo done"
  | "Pilot"
  | "Paying"
  | "Dead";

export const STATUSES: ProspectStatus[] = [
  "New",
  "Contacted",
  "Replied",
  "Demo booked",
  "Demo done",
  "Pilot",
  "Paying",
  "Dead",
];

export interface Prospect {
  id: string;
  business: string;
  trade: string;
  owner: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  rating: string;
  reviews: string;
  source: string;
  status: ProspectStatus;
  contacted: boolean;
  called: boolean;
  emailed: boolean;
  sms: boolean;
  replied: boolean;
  demoBooked: boolean;
  demoCompleted: boolean;
  pilotOffered: boolean;
  pilotStarted: boolean;
  paying: boolean;
  followUp: string;
  nextAction: string;
  notes: string;
}

type ColKind = "text" | "bool" | "status" | "date";
export interface Column {
  key: keyof Prospect;
  label: string;
  kind: ColKind;
  width?: number;
}

/** Single source of truth for spreadsheet columns, CSV, and TSV order. */
export const COLUMNS: Column[] = [
  { key: "business", label: "Business", kind: "text", width: 170 },
  { key: "trade", label: "Trade", kind: "text", width: 110 },
  { key: "owner", label: "Owner", kind: "text", width: 110 },
  { key: "phone", label: "Phone", kind: "text", width: 120 },
  { key: "email", label: "Email", kind: "text", width: 160 },
  { key: "website", label: "Website", kind: "text", width: 150 },
  { key: "address", label: "Address", kind: "text", width: 180 },
  { key: "rating", label: "Rating", kind: "text", width: 60 },
  { key: "reviews", label: "Reviews", kind: "text", width: 70 },
  { key: "source", label: "Source", kind: "text", width: 110 },
  { key: "status", label: "Status", kind: "status", width: 120 },
  { key: "contacted", label: "Contacted", kind: "bool" },
  { key: "called", label: "Called", kind: "bool" },
  { key: "emailed", label: "Emailed", kind: "bool" },
  { key: "sms", label: "SMS/DM", kind: "bool" },
  { key: "replied", label: "Replied", kind: "bool" },
  { key: "demoBooked", label: "Demo booked", kind: "bool" },
  { key: "demoCompleted", label: "Demo done", kind: "bool" },
  { key: "pilotOffered", label: "Pilot offered", kind: "bool" },
  { key: "pilotStarted", label: "Pilot started", kind: "bool" },
  { key: "paying", label: "Paying", kind: "bool" },
  { key: "followUp", label: "Follow-up", kind: "date", width: 130 },
  { key: "nextAction", label: "Next action", kind: "text", width: 160 },
  { key: "notes", label: "Notes", kind: "text", width: 180 },
];

export function rid(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function blankProspect(partial: Partial<Prospect> = {}): Prospect {
  return {
    id: rid(),
    business: "",
    trade: "",
    owner: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    rating: "",
    reviews: "",
    source: "Manual",
    status: "New",
    contacted: false,
    called: false,
    emailed: false,
    sms: false,
    replied: false,
    demoBooked: false,
    demoCompleted: false,
    pilotOffered: false,
    pilotStarted: false,
    paying: false,
    followUp: "",
    nextAction: "",
    notes: "",
    ...partial,
  };
}

function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}
function host(url: string): string {
  return (url || "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
}

/** Dedup key: normalized name + phone digits or website host (whichever exists). */
export function dedupeKey(p: Pick<Prospect, "business" | "phone" | "website">): string {
  const name = (p.business || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const secondary = digits(p.phone) || host(p.website) || "";
  return `${name}|${secondary}`;
}

/**
 * Merge incoming prospects into an existing list, skipping duplicates
 * (by dedupeKey). Returns the new list and how many were actually added.
 */
export function mergeProspects(
  existing: Prospect[],
  incoming: Prospect[]
): { merged: Prospect[]; added: number } {
  const seen = new Set(existing.map(dedupeKey));
  const toAdd: Prospect[] = [];
  for (const p of incoming) {
    if (!p.business.trim()) continue;
    const k = dedupeKey(p);
    if (seen.has(k)) continue;
    seen.add(k);
    toAdd.push(p);
  }
  return { merged: [...existing, ...toAdd], added: toAdd.length };
}

function cell(p: Prospect, key: keyof Prospect): string {
  const v = p[key];
  if (typeof v === "boolean") return v ? "yes" : "";
  return String(v ?? "");
}

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export function toCSV(rows: Prospect[]): string {
  const head = COLUMNS.map((c) => csvEscape(c.label)).join(",");
  const body = rows.map((p) => COLUMNS.map((c) => csvEscape(cell(p, c.key))).join(","));
  return [head, ...body].join("\n");
}

/** Tab-separated for direct paste into Google Sheets. */
export function toTSV(rows: Prospect[]): string {
  const clean = (v: string) => v.replace(/[\t\n\r]+/g, " ");
  const head = COLUMNS.map((c) => c.label).join("\t");
  const body = rows.map((p) => COLUMNS.map((c) => clean(cell(p, c.key))).join("\t"));
  return [head, ...body].join("\n");
}

/** Split one CSV/TSV line honoring simple double-quoted fields. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
    } else if (ch === '"') {
      q = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const HEADER_ALIASES: Record<string, keyof Prospect> = {
  business: "business",
  "business name": "business",
  name: "business",
  company: "business",
  trade: "trade",
  vertical: "trade",
  category: "trade",
  type: "trade",
  owner: "owner",
  "owner name": "owner",
  contact: "owner",
  phone: "phone",
  telephone: "phone",
  "phone number": "phone",
  tel: "phone",
  email: "email",
  "e-mail": "email",
  website: "website",
  site: "website",
  url: "website",
  web: "website",
  address: "address",
  addr: "address",
  location: "address",
  rating: "rating",
  stars: "rating",
  reviews: "reviews",
  "review count": "reviews",
  "reviews count": "reviews",
  source: "source",
  notes: "notes",
  note: "notes",
  "next action": "nextAction",
  "follow-up": "followUp",
  "follow up": "followUp",
};

const PHONE_RE = /(\+?\d[\d().\-\s]{7,}\d)/;
const EMAIL_RE = /([a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,})/i;
const URL_RE = /((https?:\/\/)?(www\.)?[a-z0-9\-]+\.[a-z]{2,}(\.[a-z]{2,})?(\/[^\s,]*)?)/i;

/**
 * Parse pasted CSV/TSV or loose rows into prospects. Uses a header row when
 * present; otherwise treats column 1 as the business name and detects
 * phone/email/website by pattern. Only fills fields actually present.
 */
export function parseImport(text: string, defaultTrade = ""): Prospect[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const delim = lines[0].includes("\t") ? "\t" : ",";
  const firstCells = splitLine(lines[0], delim).map((c) => c.toLowerCase());
  const hasHeader = firstCells.some((c) => c in HEADER_ALIASES);

  const out: Prospect[] = [];

  if (hasHeader) {
    const map = firstCells.map((c) => HEADER_ALIASES[c] ?? null);
    for (let i = 1; i < lines.length; i++) {
      const cells = splitLine(lines[i], delim);
      const p = blankProspect({ source: "CSV/paste", trade: defaultTrade });
      let any = false;
      map.forEach((field, idx) => {
        if (!field) return;
        const val = cells[idx] ?? "";
        if (val && field !== "status") {
          // status stays as the enum default; import only text fields
          (p as unknown as Record<string, string>)[field as string] = val;
          any = true;
        }
      });
      if (any && p.business.trim()) out.push(p);
    }
    return out;
  }

  // No header: business = first cell; detect phone/email/website across the row.
  for (const line of lines) {
    const cells = splitLine(line, delim);
    const business = cells[0]?.trim();
    if (!business) continue;
    const rest = cells.slice(1).join(" ") + " " + line;
    const phone = rest.match(PHONE_RE)?.[1]?.trim() ?? "";
    const email = rest.match(EMAIL_RE)?.[1]?.trim() ?? "";
    let website = "";
    const urlM = rest.match(URL_RE)?.[1]?.trim() ?? "";
    if (urlM && !urlM.includes("@")) website = urlM;
    out.push(
      blankProspect({ business, phone, email, website, source: "CSV/paste", trade: defaultTrade })
    );
  }
  return out;
}

export interface Summary {
  total: number;
  contacted: number;
  called: number;
  emailed: number;
  sms: number;
  replied: number;
  demoBooked: number;
  demoCompleted: number;
  pilotStarted: number;
  paying: number;
  contactRate: number;
  replyRate: number;
  demoRate: number;
  pilotRate: number;
}

export function summarize(rows: Prospect[]): Summary {
  const n = (f: (p: Prospect) => boolean) => rows.filter(f).length;
  const total = rows.length;
  const contacted = n((p) => p.contacted);
  const replied = n((p) => p.replied);
  const demoBooked = n((p) => p.demoBooked);
  const pilotStarted = n((p) => p.pilotStarted);
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
  return {
    total,
    contacted,
    called: n((p) => p.called),
    emailed: n((p) => p.emailed),
    sms: n((p) => p.sms),
    replied,
    demoBooked,
    demoCompleted: n((p) => p.demoCompleted),
    pilotStarted,
    paying: n((p) => p.paying),
    contactRate: pct(contacted, total),
    replyRate: pct(replied, contacted),
    demoRate: pct(demoBooked, contacted),
    pilotRate: pct(pilotStarted, demoBooked),
  };
}

/** Outreach-derived values to merge into the /yc tracker (folvra_yc_v1). */
export function ycValuesFromProspects(rows: Prospect[]): Record<string, number> {
  const s = summarize(rows);
  return {
    contacted: s.contacted,
    conversations: s.replied,
    demos: s.demoBooked,
    demos_completed: s.demoCompleted,
    pilots: s.pilotStarted,
    paying: s.paying,
  };
}
