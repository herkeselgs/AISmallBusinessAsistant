import { generateSlots } from "./availability";
import { handleLead } from "./engine";
import { DEMO_BRAIN, SAMPLE_LEADS } from "./samples";
import type {
  BusinessBrain,
  InboundMessage,
  LeadChannel,
  LeadRecord,
  LeadStatus,
} from "./types";

/** Derive the channel a lead arrived from, using the notifying email. */
export function channelFromEmail(msg: InboundMessage): LeadChannel {
  const f = msg.from.toLowerCase();
  const s = (msg.subject ?? "").toLowerCase();
  if (f.includes("thumbtack")) return "Thumbtack";
  if (f.includes("angi") || f.includes("angieslist")) return "Angi";
  if (f.includes("yelp")) return "Yelp";
  if (f.includes("google")) return "Google";
  if (s.includes("website") || s.includes("contact form") || f.includes("no-reply"))
    return "Website form";
  return "Email";
}

let idCounter = 1000;
function nextId() {
  // Random suffix keeps IDs unique across serverless cold starts (Vercel), so
  // React keys never collide when the client prepends newly-generated leads.
  idCounter += 1;
  return `lead_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Turn one inbound message into a fully-processed lead record. */
export async function processInbound(
  msg: InboundMessage,
  brain: BusinessBrain,
  opts: { status?: LeadStatus } = {}
): Promise<LeadRecord> {
  const result = await handleLead(msg, brain);
  const c = result.classification;
  const respondedInSec = 20 + Math.floor(Math.random() * 40); // 20–60s
  const status: LeadStatus = opts.status ?? (c.isLead ? "drafted" : "new");

  let bookedSlotLabel: string | undefined;
  if (status === "booked" || status === "won") {
    bookedSlotLabel =
      result.draft?.offeredSlots[0] &&
      generateSlots({ count: 3 }).find((s) => s.start === result.draft?.offeredSlots[0])?.label;
    if (!bookedSlotLabel) bookedSlotLabel = generateSlots({ count: 1 })[0]?.label;
  }

  return {
    id: nextId(),
    channel: channelFromEmail(msg),
    receivedAt: msg.receivedAt ?? "just now",
    respondedInSec,
    message: msg,
    classification: c,
    draft: result.draft,
    status,
    bookedSlotLabel,
  };
}

/** A couple of already-won leads so the ROI header has history behind it. */
const HISTORY: { msg: InboundMessage; status: LeadStatus }[] = [
  {
    status: "won",
    msg: {
      from: "reneed@gmail.com",
      subject: "New lead from your website",
      receivedAt: "Yesterday",
      body: `Name: Renee D.\nMessage: We want to finish our basement into a family room + office. Roughly 900 sq ft. What's the ballpark and when could you start?`,
    },
  },
  {
    status: "booked",
    msg: {
      from: "no-reply@angi.com",
      subject: "New lead: Bathroom remodel",
      receivedAt: "Yesterday",
      body: `Angi lead — Customer: James P. Project: Full guest bathroom remodel, dated tile and fixtures. Reply to this email to reach James.`,
    },
  },
];

/**
 * Build the initial inbox for the demo workspace: the sample leads in mixed
 * states plus a little won history. Spam is screened out of the inbox (shown as
 * a "screened" count in stats).
 */
export async function buildInitialLeads(
  brain: BusinessBrain = DEMO_BRAIN
): Promise<{ leads: LeadRecord[]; screened: number }> {
  const seedStatuses: Record<string, LeadStatus> = {
    bathroom: "booked",
    roofing: "booked",
    hvac: "sent",
    landscaping: "drafted",
    cleaning: "drafted",
  };

  const records: LeadRecord[] = [];
  let screened = 0;

  for (const s of SAMPLE_LEADS) {
    const rec = await processInbound(s.message, brain, { status: seedStatuses[s.id] });
    if (!rec.classification.isLead) {
      screened += 1;
      continue;
    }
    records.push(rec);
  }

  for (const h of HISTORY) {
    records.push(await processInbound(h.msg, brain, { status: h.status }));
  }

  return { leads: records, screened };
}

/** Fresh inbound leads for the "simulate a new lead" button. */
const NEW_LEAD_POOL: InboundMessage[] = [
  {
    from: "no-reply@yelp.com",
    subject: "New message from a Yelp customer",
    receivedAt: "just now",
    body: `Yelp lead — Customer: Priya M. "Hi! Do you do full kitchen remodels? Ours is original to the house (1990s). Would love a quote and to see how booked you are." Reply to respond to Priya.`,
  },
  {
    from: "tconnor@gmail.com",
    subject: "Deck + pergola",
    receivedAt: "just now",
    body: `Hey, looking to add a deck and a pergola out back before the fall. Maybe 350 sq ft. What would something like that run, and could someone come take a look? — Tom`,
  },
  {
    from: "no-reply@thumbtack.com",
    subject: "You have a new lead: Basement finishing",
    receivedAt: "just now",
    body: `Thumbtack lead — Customer: Marcus L. Project: Finish ~1000 sq ft basement (family room, half bath). Timeline: next couple months. Reply to this email to respond to Marcus.`,
  },
  {
    from: "sandra.k@outlook.com",
    subject: "Home addition question",
    receivedAt: "just now",
    body: `We're considering a small addition off the kitchen — maybe a mudroom/office. Is that something you take on, and roughly what does an addition like that cost? Thanks, Sandra`,
  },
];

export async function generateNewLead(
  brain: BusinessBrain = DEMO_BRAIN,
  autopilot = false
): Promise<LeadRecord> {
  const msg = NEW_LEAD_POOL[Math.floor(Math.random() * NEW_LEAD_POOL.length)];
  return processInbound(msg, brain, { status: autopilot ? "sent" : "drafted" });
}

/** ROI / activity stats computed from the current board. Conservative on money. */
export function computeStats(leads: LeadRecord[], screened: number) {
  const active = leads.filter((l) => l.classification.isLead);
  const times = active.map((l) => l.respondedInSec).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : 0;
  const booked = active.filter((l) => l.status === "booked" || l.status === "won").length;
  // Only count value we can attribute to Folvra having replied first (booked/won/sent).
  const pipelineRescued = active
    .filter((l) => ["sent", "booked", "won"].includes(l.status))
    .reduce((sum, l) => sum + (l.classification.estValueUsd ?? 0), 0);

  return {
    total: active.length,
    medianResponseSec: median,
    booked,
    pipelineRescued,
    screened,
  };
}
