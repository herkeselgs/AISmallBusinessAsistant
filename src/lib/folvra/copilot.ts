/**
 * Live Call Copilot — pure, deterministic logic (no DOM, no speech, no network).
 * The UI (components/call-copilot.tsx) layers Web Speech + state on top of this.
 * Everything here is unit-tested.
 */

import type { Prospect, ProspectStatus } from "./prospects";

/* ----------------------------- Script ----------------------------- */

export type LineKind = "say" | "ask";
export interface ScriptLine {
  id: string;
  phase: "open" | "discovery" | "close";
  kind: LineKind;
  text: string; // may contain {business}
}

export const SCRIPT: ScriptLine[] = [
  { id: "o1", phase: "open", kind: "say", text: "Hi, is this {business}?" },
  { id: "o2", phase: "open", kind: "say", text: "Hey, this is Stephan — I'll be quick, 20 seconds." },
  { id: "o3", phase: "open", kind: "say", text: "I help remodelers stop losing jobs from slow follow-up on estimate requests." },
  { id: "o4", phase: "open", kind: "say", text: "When someone asks about a bathroom or kitchen remodel and you're on a job, they often book whoever replies first." },
  { id: "o5", phase: "open", kind: "say", text: "I built Folvra — it replies in under 60 seconds, follows up, and helps book the estimate." },
  { id: "o6", phase: "open", kind: "ask", text: "Do you handle new leads yourself?" },
  { id: "d1", phase: "discovery", kind: "ask", text: "How fast do you usually reply to website or Angi leads?" },
  { id: "d2", phase: "discovery", kind: "ask", text: "Do leads ever come in after hours or while you're on a job site?" },
  { id: "d3", phase: "discovery", kind: "ask", text: "Where do most of your remodel leads come from?" },
  { id: "d4", phase: "discovery", kind: "ask", text: "Do you already use Jobber, Angi, Thumbtack, or a CRM?" },
  { id: "d5", phase: "discovery", kind: "ask", text: "Would saving even one extra estimate a month be valuable?" },
  { id: "c1", phase: "close", kind: "ask", text: "Can I show you what Folvra would say to one of your actual leads?" },
  { id: "c2", phase: "close", kind: "say", text: "It takes five minutes." },
  { id: "c3", phase: "close", kind: "say", text: "The pilot is free for 14 days." },
  { id: "c4", phase: "close", kind: "ask", text: "Does today or tomorrow work better?" },
];

export function renderLine(text: string, business: string): string {
  return text.replace(/\{business\}/g, business || "your company");
}

/** Next discovery/close question after the given index (for "next best question"). */
export function nextQuestion(fromIndex: number): string | null {
  for (let i = fromIndex + 1; i < SCRIPT.length; i++) {
    if (SCRIPT[i].kind === "ask") return SCRIPT[i].text;
  }
  return null;
}

/* -------------------------- Objections --------------------------- */

export interface ObjectionRule {
  key: string;
  label: string;
  kw: string[]; // phrases matched as substrings (lowercased)
  boundary?: string[]; // short tokens matched on word boundaries
  response: string;
}

export const OBJECTIONS: ObjectionRule[] = [
  {
    key: "not_interested",
    label: "Not interested",
    kw: ["not interested", "no thanks", "no thank you", "we're good", "we are good", "not right now", "all set"],
    response:
      "No worries. Before I let you go, is slow lead follow-up not a problem, or is it just not something you want to change right now?",
  },
  {
    key: "send_info",
    label: "Send me info",
    kw: ["send me", "send info", "send over", "send it", "email me", "email it", "brochure", "some information", "send something"],
    response:
      "Sure — I can send it. It makes more sense if I show it on one real lead though. Is there a 5-minute window today or tomorrow?",
  },
  {
    key: "respond_fast",
    label: "We respond fast",
    kw: ["respond fast", "reply fast", "respond quickly", "we're fast", "we are fast", "answer right away", "we call back", "we get back", "we already respond", "we always answer"],
    response:
      "That's good. Is that also true after hours, on weekends, or when you're on a job site?",
  },
  {
    key: "crm",
    label: "We use a CRM",
    kw: ["jobber", "housecall", "service titan", "servicetitan", "hubspot", "we use", "already use", "we have a system"],
    boundary: ["crm"],
    response:
      "Perfect — Folvra doesn't replace that. It just makes sure the lead gets a fast reply before it goes cold.",
  },
  {
    key: "ai_concern",
    label: "Doesn't trust AI",
    kw: ["don't trust", "do not trust", "trust ai", "sounds like a robot", "robotic", "automated", "impersonal"],
    boundary: ["ai", "bot"],
    response:
      "That's fair. Folvra starts approve-first — it drafts the reply, you approve it, and nothing sends automatically until you trust it.",
  },
  {
    key: "price",
    label: "How much?",
    kw: ["how much", "what's the cost", "whats the cost", "what does it cost", "pricing", "how expensive", "the price", "per month"],
    boundary: ["cost", "price"],
    response:
      "For early pilots it's free for 14 days. After that, around $99–$199/month depending on lead volume. If it books even one estimate, it pays for itself.",
  },
  {
    key: "busy",
    label: "Busy right now",
    kw: ["i'm busy", "im busy", "on a job", "can't talk", "cant talk", "bad time", "in the middle", "i'm driving", "im driving", "call me later", "catch me later"],
    response:
      "Totally — 20 seconds and I'll let you go. Can I show you one thing that saves a booked job, or should I catch you later today?",
  },
];

function hasKw(text: string, rule: ObjectionRule): boolean {
  if (rule.kw.some((k) => text.includes(k))) return true;
  if (rule.boundary?.some((b) => new RegExp(`\\b${b}\\b`).test(text))) return true;
  return false;
}

/** Return the highest-priority objection detected, or null. */
export function detectObjection(transcript: string): ObjectionRule | null {
  const t = (transcript || "").toLowerCase();
  for (const rule of OBJECTIONS) {
    if (hasKw(t, rule)) return rule;
  }
  return null;
}

/* --------------------------- Signals ----------------------------- */

const PAIN_SIGNALS = [
  "after hours", "after-hours", "weekend", "on a job", "job site", "jobsite",
  "miss", "missed", "lose", "lost", "slow", "voicemail", "too late", "forget",
  "forgot", "behind", "booked someone else", "swamped", "overwhelmed", "no time",
];
const LEAD_SOURCES = [
  "angi", "thumbtack", "yelp", "google", "facebook", "instagram", "website",
  "referral", "word of mouth", "home advisor", "homeadvisor", "nextdoor", "networx",
];
const WORKFLOW = [
  "jobber", "housecall", "servicetitan", "service titan", "hubspot", "thumbtack",
  "angi", "myself", "i handle", "office manager", "receptionist", "wife", "secretary",
  "front desk", "answering service", "spreadsheet", "voicemail",
];
const INTEREST = [
  "interested", "tell me more", "how does it work", "sounds good", "let's do it",
  "lets do it", "set it up", "sign me up", "sure", "yeah let's", "okay let's", "show me",
];

function findAll(text: string, terms: string[]): string[] {
  const t = text.toLowerCase();
  return terms.filter((term) => t.includes(term));
}

export function painScoreOf(transcript: string): number {
  return findAll(transcript, PAIN_SIGNALS).length;
}
export function detectSources(transcript: string): string[] {
  return findAll(transcript, LEAD_SOURCES);
}
export function detectWorkflow(transcript: string): string[] {
  return findAll(transcript, WORKFLOW);
}
export function isInterested(transcript: string): boolean {
  return findAll(transcript, INTEREST).length > 0;
}
export function painLevel(score: number): "low" | "medium" | "high" {
  if (score >= 3) return "high";
  if (score >= 1) return "medium";
  return "low";
}

/* --------------------- Word match / highlight -------------------- */

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function fuzzyEq(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (Math.max(a.length, b.length) >= 4 && lev(a, b) <= 1) return true;
  return false;
}

export interface WordMatch {
  words: { w: string; done: boolean }[];
  ratio: number;
  complete: boolean;
}

/**
 * Approximate word-by-word match of what was spoken vs. the script line.
 * Forgiving (paraphrase/fuzzy) so it still highlights when you don't say it verbatim.
 */
export function wordMatch(scriptLine: string, spoken: string, threshold = 0.6): WordMatch {
  const display = scriptLine.split(/\s+/).filter(Boolean);
  const spokenTokens = spoken.split(/\s+/).map(norm).filter(Boolean);
  const spokenSet = new Set(spokenTokens);

  let done = 0;
  const words = display.map((raw) => {
    const nw = norm(raw);
    let hit = nw.length === 0 || spokenSet.has(nw);
    if (!hit && nw.length >= 3) hit = spokenTokens.some((s) => fuzzyEq(nw, s));
    if (hit) done++;
    return { w: raw, done: hit };
  });

  const meaningful = display.filter((w) => norm(w).length > 0).length || 1;
  const ratio = done / meaningful;
  return { words, ratio, complete: ratio >= threshold };
}

/* ----------------------- After-call summary ---------------------- */

export type Outcome =
  | "no_answer"
  | "answered"
  | "demo_booked"
  | "follow_up"
  | "not_interested"
  | "pilot_offered"
  | "pilot_started";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  no_answer: "No answer",
  answered: "Answered",
  demo_booked: "Demo booked",
  follow_up: "Follow-up needed",
  not_interested: "Not interested",
  pilot_offered: "Pilot offered",
  pilot_started: "Pilot started",
};

export interface CallSession {
  business: string;
  owner?: string;
  trade?: string;
  outcome: Outcome;
  prospectTranscript: string;
  objections: string[]; // labels
  painScore: number;
  sources: string[];
  workflow: string[];
  interest: boolean;
}

export interface CallSummary {
  outcome: Outcome;
  outcomeLabel: string;
  painLevel: "low" | "medium" | "high";
  summary: string;
  leadSources: string;
  currentWorkflow: string;
  objections: string;
  nextAction: string;
  followUpDate: string;
  followUpSMS: string;
  followUpEmail: string;
  status: ProspectStatus;
  notes: string;
  flags: Partial<Prospect>;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildSummary(s: CallSession): CallSummary {
  const pain = painLevel(s.painScore);
  const owner = s.owner && s.owner !== "Unknown" ? s.owner : "there";
  const sources = Array.from(new Set(s.sources)).join(", ");
  const workflow = Array.from(new Set(s.workflow)).join(", ");
  const objections = Array.from(new Set(s.objections)).join(", ");
  const fu = addDays(2);

  const status: ProspectStatus = (
    {
      no_answer: "Contacted",
      answered: "Contacted",
      demo_booked: "Demo booked",
      follow_up: "Contacted",
      not_interested: "Dead",
      pilot_offered: "Pilot",
      pilot_started: "Pilot",
    } as Record<Outcome, ProspectStatus>
  )[s.outcome];

  const flags: Partial<Prospect> = { contacted: true, called: true };
  if (s.outcome !== "no_answer" && s.outcome !== "not_interested") flags.replied = true;
  if (s.outcome === "demo_booked") flags.demoBooked = true;
  if (s.outcome === "pilot_offered" || s.outcome === "pilot_started") flags.pilotOffered = true;
  if (s.outcome === "pilot_started") flags.pilotStarted = true;

  const nextAction: Record<Outcome, string> = {
    no_answer: `Retry call + text (${fu})`,
    answered: `Follow up (${fu})`,
    demo_booked: `Run the 5-min demo (${fu})`,
    follow_up: `Follow up (${fu})`,
    not_interested: "—",
    pilot_offered: `Follow up to start pilot (${fu})`,
    pilot_started: "Onboard the pilot",
  };

  const quote = s.prospectTranscript.trim().replace(/\s+/g, " ").slice(0, 160);
  const summary = [
    `${s.business}: ${OUTCOME_LABEL[s.outcome]}. Pain ${pain}.`,
    objections ? `Objections: ${objections}.` : "",
    sources ? `Leads from: ${sources}.` : "",
    workflow ? `Current: ${workflow}.` : "",
    quote ? `They said: "${quote}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const followUpSMS =
    s.outcome === "demo_booked"
      ? `Hi ${owner}, Stephan here — looking forward to our Folvra demo. I'll show it on one of ${s.business}'s real leads. Talk soon!`
      : `Hi ${owner}, Stephan here — thanks for the minute earlier. When's a good 5 min to show Folvra on one of ${s.business}'s real leads? It replies to new leads in under 60s. folvra.com`;

  const followUpEmail =
    `Subject: Folvra for ${s.business}\n\n` +
    `Hi ${owner} — thanks for chatting. Quick recap: Folvra replies to every new lead in under 60 seconds, follows up, and helps book the estimate — approve-first, so nothing sends without your OK.\n\n` +
    `Want me to show it on one of your real leads? 5 minutes, free 14-day pilot.\n\n— Stephan · folvra.com`;

  const notes = `[Call ${addDays(0)}] ${s.business} — ${OUTCOME_LABEL[s.outcome]}. Pain: ${pain}.` +
    (objections ? ` Objections: ${objections}.` : "") +
    (sources ? ` Leads: ${sources}.` : "") +
    (workflow ? ` Now: ${workflow}.` : "") +
    (quote ? ` "${quote}"` : "");

  return {
    outcome: s.outcome,
    outcomeLabel: OUTCOME_LABEL[s.outcome],
    painLevel: pain,
    summary,
    leadSources: sources,
    currentWorkflow: workflow,
    objections,
    nextAction: nextAction[s.outcome],
    followUpDate: s.outcome === "not_interested" ? "" : fu,
    followUpSMS,
    followUpEmail,
    status,
    notes,
    flags,
  };
}
