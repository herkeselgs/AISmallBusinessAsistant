import { describe, expect, it } from "vitest";
import {
  blankProspect,
  dedupeKey,
  mergeProspects,
  parseImport,
  summarize,
  toCSV,
  toTSV,
  ycValuesFromProspects,
  COLUMNS,
} from "./prospects";

describe("dedupeKey / mergeProspects", () => {
  it("treats same name + phone as duplicate", () => {
    const a = blankProspect({ business: "Ace HVAC", phone: "(239) 555-0100" });
    const b = blankProspect({ business: "ace hvac", phone: "239-555-0100" });
    expect(dedupeKey(a)).toBe(dedupeKey(b));
  });

  it("merges without adding duplicates, preserves existing", () => {
    const existing = [blankProspect({ business: "Ace HVAC", phone: "2395550100" })];
    const incoming = [
      blankProspect({ business: "Ace HVAC", phone: "(239) 555-0100" }), // dup
      blankProspect({ business: "Best Roofing", website: "bestroof.com" }), // new
      blankProspect({ business: "" }), // empty, skipped
    ];
    const { merged, added } = mergeProspects(existing, incoming);
    expect(added).toBe(1);
    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.business)).toContain("Best Roofing");
  });
});

describe("parseImport", () => {
  it("maps a header row to fields", () => {
    const csv = "Business,Phone,Website\nAce HVAC,(239) 555-0100,acehvac.com";
    const rows = parseImport(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].business).toBe("Ace HVAC");
    expect(rows[0].phone).toBe("(239) 555-0100");
    expect(rows[0].website).toBe("acehvac.com");
    expect(rows[0].source).toBe("CSV/paste");
  });

  it("parses TSV with headers (Google Sheets paste)", () => {
    const tsv = "name\tphone\temail\nBest Roofing\t2395551234\tinfo@bestroof.com";
    const rows = parseImport(tsv);
    expect(rows[0].business).toBe("Best Roofing");
    expect(rows[0].email).toBe("info@bestroof.com");
  });

  it("handles headerless rows, detecting phone/email/website", () => {
    const text = "Ace HVAC, call us (239) 555-0100, acehvac.com, hi@acehvac.com";
    const rows = parseImport(text);
    expect(rows[0].business).toBe("Ace HVAC");
    expect(rows[0].phone).toContain("239");
    expect(rows[0].email).toBe("hi@acehvac.com");
    expect(rows[0].website).toBe("acehvac.com");
  });

  it("accepts plain business names one per line", () => {
    const rows = parseImport("Ace HVAC\nBest Roofing\nCool Air Co");
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.business)).toEqual(["Ace HVAC", "Best Roofing", "Cool Air Co"]);
  });

  it("applies default trade to imported rows", () => {
    const rows = parseImport("Ace HVAC", "HVAC");
    expect(rows[0].trade).toBe("HVAC");
  });
});

describe("CSV / TSV export", () => {
  it("CSV has a header row and escapes quotes/commas", () => {
    const rows = [blankProspect({ business: 'Ace, "The" HVAC', phone: "239" })];
    const csv = toCSV(rows);
    const [header, line] = csv.split("\n");
    expect(header).toContain('"Business"');
    expect(header.split(",")).toHaveLength(COLUMNS.length);
    expect(line).toContain('"Ace, ""The"" HVAC"');
  });

  it("TSV is tab-separated and strips embedded tabs/newlines", () => {
    const rows = [blankProspect({ business: "Ace\tHVAC", notes: "line1\nline2" })];
    const tsv = toTSV(rows);
    expect(tsv.split("\n")[0].split("\t")).toHaveLength(COLUMNS.length);
    expect(tsv).toContain("Ace HVAC"); // tab collapsed to space
  });

  it("round-trips business/phone through CSV export → import", () => {
    const original = [blankProspect({ business: "Ace HVAC", phone: "(239) 555-0100", website: "acehvac.com" })];
    const csv = toCSV(original);
    const reparsed = parseImport(csv);
    expect(reparsed[0].business).toBe("Ace HVAC");
    expect(reparsed[0].phone).toBe("(239) 555-0100");
  });
});

describe("summarize / ycValuesFromProspects", () => {
  const rows = [
    blankProspect({ business: "A", contacted: true, called: true, replied: true, demoBooked: true }),
    blankProspect({ business: "B", contacted: true, emailed: true }),
    blankProspect({ business: "C", contacted: true, demoBooked: true, demoCompleted: true, pilotStarted: true, paying: true }),
  ];

  it("counts statuses and rates", () => {
    const s = summarize(rows);
    expect(s.total).toBe(3);
    expect(s.contacted).toBe(3);
    expect(s.replied).toBe(1);
    expect(s.demoBooked).toBe(2);
    expect(s.pilotStarted).toBe(1);
    expect(s.paying).toBe(1);
    expect(s.contactRate).toBe(100);
    expect(s.demoRate).toBe(67); // 2/3
  });

  it("maps to YC metric keys", () => {
    const v = ycValuesFromProspects(rows);
    expect(v).toMatchObject({
      contacted: 3,
      conversations: 1,
      demos: 2,
      demos_completed: 1,
      pilots: 1,
      paying: 1,
    });
  });
});
