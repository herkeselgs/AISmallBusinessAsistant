import { describe, expect, it } from "vitest";
import {
  buildSummary,
  demoLikelihood,
  detectObjection,
  nextQuestion,
  painLevel,
  renderLine,
  ruleSuggest,
  SCRIPT,
  wordMatch,
  type CallSession,
} from "./copilot";

describe("detectObjection", () => {
  const cases: [string, string][] = [
    ["can you just send me some info?", "send_info"],
    ["honestly we respond fast already", "respond_fast"],
    ["we already use jobber for everything", "crm"],
    ["i don't really trust ai stuff", "ai_concern"],
    ["yeah not interested, all set", "not_interested"],
    ["so how much does it cost?", "price"],
    ["i'm busy on a job right now", "busy"],
  ];
  it.each(cases)("detects %s", (text, key) => {
    expect(detectObjection(text)?.key).toBe(key);
  });

  it("returns null when no objection", () => {
    expect(detectObjection("sure, that sounds good, tell me more")).toBeNull();
  });

  it("prioritizes not_interested over price", () => {
    expect(detectObjection("not interested, and how much is it anyway")?.key).toBe("not_interested");
  });

  it("each objection has a non-empty suggested response", () => {
    for (const text of ["send me info", "we respond fast", "we use a crm", "trust ai", "not interested", "how much", "i'm busy"]) {
      const o = detectObjection(text);
      expect(o && o.response.length).toBeGreaterThan(10);
    }
  });
});

describe("wordMatch", () => {
  it("full verbatim match completes", () => {
    const line = "Hey, this is Stephan — I'll be quick";
    const r = wordMatch(line, "hey this is stephan i'll be quick");
    expect(r.ratio).toBeGreaterThan(0.8);
    expect(r.complete).toBe(true);
    expect(r.words.every((w) => w.done)).toBe(true);
  });

  it("partial speech is partially highlighted, not complete", () => {
    const line = "Do you handle new leads yourself?";
    const r = wordMatch(line, "do you");
    expect(r.words[0].done).toBe(true);
    expect(r.words[1].done).toBe(true);
    expect(r.complete).toBe(false);
  });

  it("tolerates paraphrase / fuzzy words", () => {
    const line = "How fast do you reply to leads";
    const r = wordMatch(line, "how fastt do you replies to leadz"); // typos/plurals
    expect(r.ratio).toBeGreaterThan(0.6);
  });

  it("empty speech = nothing done", () => {
    const r = wordMatch("It takes five minutes.", "");
    expect(r.words.some((w) => w.done)).toBe(false);
    expect(r.complete).toBe(false);
  });
});

describe("script helpers", () => {
  it("renders {business}", () => {
    expect(renderLine(SCRIPT[0].text, "Ace HVAC")).toBe("Hi, is this Ace HVAC?");
    expect(renderLine(SCRIPT[0].text, "")).toContain("your company");
  });
  it("nextQuestion finds the next ask line", () => {
    expect(nextQuestion(-1)).toBe(SCRIPT.find((l) => l.kind === "ask")!.text);
    expect(nextQuestion(SCRIPT.length - 1)).toBeNull();
  });
});

describe("painLevel", () => {
  it("maps score to buckets", () => {
    expect(painLevel(0)).toBe("low");
    expect(painLevel(2)).toBe("medium");
    expect(painLevel(5)).toBe("high");
  });
});

describe("demoLikelihood", () => {
  it("high when interested + pain", () => {
    expect(demoLikelihood(2, true, [])).toBe("high");
  });
  it("low when not interested", () => {
    expect(demoLikelihood(1, false, ["Not interested"])).toBe("low");
  });
});

describe("ruleSuggest (shared fallback)", () => {
  it("returns the objection response and marks source rule", () => {
    const s = ruleSuggest("can you just send me some info");
    expect(s.source).toBe("rule");
    expect(s.objectionType).toBe("send_info");
    expect(s.recommendedAction).toBe("ask_for_demo");
    expect(s.suggestedResponse.length).toBeGreaterThan(10);
  });
  it("suggests the demo ask when interested", () => {
    const s = ruleSuggest("yeah that sounds good, tell me more");
    expect(s.recommendedAction).toBe("ask_for_demo");
  });
  it("falls back to a discovery question with no objection", () => {
    const s = ruleSuggest("hello");
    expect(s.recommendedAction).toBe("continue_discovery");
    expect(s.nextBestQuestion.length).toBeGreaterThan(5);
  });
});

describe("buildSummary", () => {
  const base: CallSession = {
    business: "Ace Remodeling",
    owner: "Mike",
    outcome: "demo_booked",
    prospectTranscript: "we get slammed, leads come in after hours and we miss some from angi",
    objections: ["We respond fast"],
    painScore: 3,
    sources: ["angi"],
    workflow: ["jobber"],
    interest: true,
  };

  it("demo booked sets flags, status and next action", () => {
    const s = buildSummary(base);
    expect(s.status).toBe("Demo booked");
    expect(s.flags.contacted).toBe(true);
    expect(s.flags.called).toBe(true);
    expect(s.flags.demoBooked).toBe(true);
    expect(s.painLevel).toBe("high");
    expect(s.nextAction.toLowerCase()).toContain("demo");
    expect(s.followUpDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(s.followUpSMS.length).toBeGreaterThan(20);
    expect(s.notes).toContain("Ace Remodeling");
  });

  it("not interested is Dead with no follow-up date and no replied flag", () => {
    const s = buildSummary({ ...base, outcome: "not_interested" });
    expect(s.status).toBe("Dead");
    expect(s.followUpDate).toBe("");
    expect(s.flags.replied).toBeUndefined();
  });

  it("pilot started sets pilot flags", () => {
    const s = buildSummary({ ...base, outcome: "pilot_started" });
    expect(s.flags.pilotOffered).toBe(true);
    expect(s.flags.pilotStarted).toBe(true);
    expect(s.status).toBe("Pilot");
  });

  it("no answer stays Contacted, not replied", () => {
    const s = buildSummary({ ...base, outcome: "no_answer", painScore: 0 });
    expect(s.status).toBe("Contacted");
    expect(s.flags.replied).toBeUndefined();
    expect(s.painLevel).toBe("low");
  });
});
