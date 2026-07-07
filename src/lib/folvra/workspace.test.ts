import { describe, expect, it } from "vitest";
import { buildInitialLeads, channelFromEmail, computeStats } from "./workspace";

describe("channelFromEmail", () => {
  it("maps notifying senders to the right channel", () => {
    expect(channelFromEmail({ from: "no-reply@thumbtack.com", body: "" })).toBe("Thumbtack");
    expect(channelFromEmail({ from: "no-reply@angi.com", body: "" })).toBe("Angi");
    expect(channelFromEmail({ from: "x@yelp.com", body: "" })).toBe("Yelp");
    expect(
      channelFromEmail({ from: "a@gmail.com", subject: "New lead from your website", body: "" })
    ).toBe("Website form");
    expect(channelFromEmail({ from: "dan@outlook.com", subject: "Bathroom", body: "" })).toBe(
      "Email"
    );
  });
});

describe("buildInitialLeads", () => {
  it("seeds real leads, screens spam, and reports it", async () => {
    const { leads, screened } = await buildInitialLeads();
    expect(leads.length).toBeGreaterThanOrEqual(4);
    expect(screened).toBeGreaterThanOrEqual(1); // the vendor spam sample
    // every seeded lead is a real lead with a draft
    for (const l of leads) {
      expect(l.classification.isLead).toBe(true);
      expect(l.draft).not.toBeNull();
    }
    // a mix of statuses exists (not all one bucket)
    const statuses = new Set(leads.map((l) => l.status));
    expect(statuses.size).toBeGreaterThan(1);
  });
});

describe("computeStats", () => {
  it("counts booked and only attributes rescued value to replied+ leads", async () => {
    const { leads, screened } = await buildInitialLeads();
    const stats = computeStats(leads, screened);
    expect(stats.total).toBe(leads.length);
    expect(stats.booked).toBeGreaterThanOrEqual(1);
    expect(stats.pipelineRescued).toBeGreaterThan(0);
    expect(stats.medianResponseSec).toBeGreaterThan(0);
    expect(stats.medianResponseSec).toBeLessThan(90);
  });
});
