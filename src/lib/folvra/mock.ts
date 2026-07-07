import type {
  BusinessBrain,
  InboundMessage,
  LeadClassification,
  ReplyDraft,
  Slot,
} from "./types";

/**
 * Deterministic fallback used when no ANTHROPIC_API_KEY is set (e.g. local demo
 * without credentials). It is intentionally good enough to show the experience,
 * but the real engine (engine.ts + Claude) is what ships. Everything here is
 * heuristic; nothing calls a network.
 */

const SPAM_SIGNALS = [
  "exclusive leads",
  "leadgen",
  "grow your business",
  "quick call to see if we're a fit",
  "seo",
  "rank your website",
  "backlinks",
  "b2b",
  "increase your sales",
];

// Order matters — first match wins, so put specific/urgent trades before generic.
const SERVICE_KEYWORDS: Record<string, string[]> = {
  "HVAC (heating & cooling)": ["hvac", "furnace", "air condition", "a/c", " ac ", "heating", "cooling", "no heat", "no ac", "boiler", "heat pump"],
  Roofing: ["roof", "shingle", "gutter"],
  "Bathroom remodel": ["bathroom", "shower", "vanity"],
  "Kitchen remodel": ["kitchen"],
  "Basement finishing": ["basement"],
  Landscaping: ["landscap", "lawn", "yard", "sod", "mulch", "retaining wall", "garden", "planting"],
  "House cleaning": ["cleaning", "housekeeping", "maid", "clean"],
  "Deck / outdoor": ["deck", "porch", "patio"],
  Addition: ["addition", "add on", "add-on", "extension"],
};

const URGENT_WORDS = [
  "asap", "urgent", "leak", "water damage", "emergency", "move fast", "quickly",
  "no heat", "no ac", "freezing", "tonight", "today", "flooding", "burst", "quit",
];

const EST_VALUE: Record<string, number> = {
  "HVAC (heating & cooling)": 6000,
  Roofing: 9000,
  "Bathroom remodel": 12000,
  "Kitchen remodel": 25000,
  "Basement finishing": 18000,
  Landscaping: 4500,
  "House cleaning": 200,
  "Deck / outdoor": 8000,
  Addition: 30000,
};

function extractName(msg: InboundMessage): string | null {
  const nameLine = msg.body.match(/name:\s*([A-Za-z][A-Za-z .'-]+)/i);
  if (nameLine) return nameLine[1].trim();
  const customer = msg.body.match(/customer:\s*([A-Za-z][A-Za-z .'-]+)/i);
  if (customer) return customer[1].trim();
  const dash = msg.body.match(/[—-]\s*([A-Z][a-z]+)\s*$/);
  if (dash) return dash[1].trim();
  return null;
}

function extractPhone(msg: InboundMessage): string | null {
  const m = msg.body.match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
  return m ? m[1] : null;
}

export function mockClassify(msg: InboundMessage): LeadClassification {
  const text = `${msg.subject ?? ""} ${msg.body} ${msg.from}`.toLowerCase();
  const isSpam = SPAM_SIGNALS.some((s) => text.includes(s));
  const isMarketplace = /thumbtack|angi|yelp|houzz|no-?reply/.test(msg.from.toLowerCase());

  let service: string | null = null;
  for (const [name, kws] of Object.entries(SERVICE_KEYWORDS)) {
    if (kws.some((k) => text.includes(k))) {
      service = name;
      break;
    }
  }

  if (isSpam) {
    return {
      isLead: false,
      category: "vendor_or_spam",
      confidence: 0.9,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      service: null,
      intent: "other",
      urgency: "low",
      preferredTimes: null,
      estValueUsd: null,
      summary: "Vendor/marketing outreach — not a customer lead.",
    };
  }

  const urgency: LeadClassification["urgency"] = URGENT_WORDS.some((w) => text.includes(w))
    ? "high"
    : "medium";

  return {
    isLead: true,
    category: "new_lead",
    confidence: isMarketplace ? 0.86 : 0.82,
    contactName: extractName(msg),
    contactEmail: /@/.test(msg.from) && !isMarketplace ? msg.from : null,
    contactPhone: extractPhone(msg),
    service,
    intent: text.includes("cost") || text.includes("estimate") || text.includes("quote")
      ? "quote"
      : "book_appointment",
    urgency,
    preferredTimes: null,
    estValueUsd: service ? EST_VALUE[service] ?? null : null,
    summary: `${service ?? "Home services"} inquiry${urgency === "high" ? " (time-sensitive)" : ""}.`,
  };
}

export function mockDraft(
  msg: InboundMessage,
  slots: Slot[],
  brain: BusinessBrain,
  classification: LeadClassification
): ReplyDraft {
  const first = classification.contactName?.split(" ")[0] ?? "there";
  const service = (classification.service ?? "your project").toLowerCase();
  const offered = slots.slice(0, 2);
  const slotText = offered.map((s) => s.label).join(" or ");
  const sig = brain.signature ?? `— ${brain.ownerName ?? brain.name}`;

  const reply = `Hi ${first},

Thanks for reaching out about ${service} — we'd love to help. ${
    brain.name
  } does exactly this kind of work${brain.serviceArea ? `, and ${classification.contactName ? "you're" : "we're"} right in our service area` : ""}. Our in-home estimates are free and take about 45 minutes so we can give you an accurate number.

I've got ${slotText} open — would either of those work for you? If not, just tell me a couple of times that do and I'll lock it in.

${sig}`;

  return {
    reply,
    offeredSlots: offered.map((s) => s.start),
    confidence: 0.8,
    needsHuman: classification.urgency === "high" ? false : false,
    reason:
      "Standard estimate inquiry within our services and area — safe to reply and offer times.",
  };
}
