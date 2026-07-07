import { describe, expect, it } from "vitest";
import { generateSlots } from "./availability";
import { mockClassify, mockDraft } from "./mock";
import { DEMO_BRAIN, SAMPLE_LEADS } from "./samples";

function lead(id: string) {
  const l = SAMPLE_LEADS.find((s) => s.id === id);
  if (!l) throw new Error(`missing sample ${id}`);
  return l.message;
}

describe("generateSlots", () => {
  it("returns the requested number of weekday slots in the future", () => {
    const from = new Date("2026-07-07T12:00:00"); // Tuesday
    const slots = generateSlots({ count: 3, from });
    expect(slots).toHaveLength(3);
    for (const s of slots) {
      const d = new Date(s.start);
      expect(d.getTime()).toBeGreaterThan(from.getTime());
      expect([0, 6]).not.toContain(d.getDay()); // never a weekend
      expect(s.label).toMatch(/\d/);
    }
  });

  it("respects the requested duration", () => {
    const slots = generateSlots({ count: 2, durationMin: 45 });
    expect(slots.every((s) => s.durationMin === 45)).toBe(true);
  });
});

describe("mockClassify", () => {
  it("flags vendor spam as not a lead", () => {
    const c = mockClassify(lead("spam"));
    expect(c.isLead).toBe(false);
    expect(c.category).toBe("vendor_or_spam");
  });

  it("detects a real HVAC lead with contact + service", () => {
    const c = mockClassify(lead("hvac"));
    expect(c.isLead).toBe(true);
    expect(c.service).toMatch(/hvac/i);
    expect(c.contactPhone).toBeTruthy();
  });

  it("marks an HVAC emergency (no heat, newborn) as high urgency", () => {
    const c = mockClassify(lead("hvac"));
    expect(c.urgency).toBe("high");
  });

  it("detects a bathroom remodel lead", () => {
    const c = mockClassify(lead("bathroom"));
    expect(c.isLead).toBe(true);
    expect(c.service).toMatch(/bath/i);
  });

  it("recognizes each demo vertical as a lead (except spam)", () => {
    for (const id of ["hvac", "roofing", "bathroom", "landscaping", "cleaning"]) {
      expect(mockClassify(lead(id)).isLead).toBe(true);
    }
    expect(mockClassify(lead("spam")).isLead).toBe(false);
  });
});

describe("mockDraft", () => {
  it("greets the lead, offers real slots, and signs off as the business", () => {
    const msg = lead("roofing");
    const c = mockClassify(msg);
    const slots = generateSlots({ count: 3 });
    const draft = mockDraft(msg, slots, DEMO_BRAIN, c);

    expect(draft.reply.length).toBeGreaterThan(40);
    expect(draft.offeredSlots.length).toBeGreaterThan(0);
    // every offered slot is one we actually had available
    for (const s of draft.offeredSlots) {
      expect(slots.map((x) => x.start)).toContain(s);
    }
    expect(draft.reply).toContain(DEMO_BRAIN.ownerName!);
  });

  it("never fabricates a firm price in the reply", () => {
    const msg = lead("roofing");
    const c = mockClassify(msg);
    const draft = mockDraft(msg, generateSlots({ count: 3 }), DEMO_BRAIN, c);
    // mock reply should not quote a specific dollar figure
    expect(draft.reply).not.toMatch(/\$\s?\d/);
  });
});
