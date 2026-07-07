import { z } from "zod";

/**
 * The "Business Brain" — Otto's model of a specific business. Learned at
 * onboarding (from the website + inbox) and continuously tuned by the owner.
 * Everything Otto says is grounded in this. It never invents beyond it.
 */
export const BusinessBrainSchema = z.object({
  name: z.string(),
  ownerName: z.string().optional(),
  industry: z.string(),
  website: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  serviceArea: z.string().optional(),
  hours: z.string().optional(),
  services: z.array(z.string()).default([]),
  pricingNotes: z
    .string()
    .describe("Only prices Otto is allowed to quote. Empty = quote nothing.")
    .default(""),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  tone: z
    .string()
    .describe("How the owner talks to customers, in a sentence or two.")
    .default("Friendly, concise, and professional. Warm but not chatty."),
  bookingTypes: z
    .array(
      z.object({
        label: z.string(),
        durationMin: z.number(),
        location: z.enum(["onsite", "office", "virtual", "phone"]).default("onsite"),
      })
    )
    .default([]),
  escalateTopics: z
    .array(z.string())
    .describe("Topics Otto must hand to a human instead of answering.")
    .default(["complaints", "legal or safety issues", "refunds"]),
  signature: z.string().optional(),
});
export type BusinessBrain = z.infer<typeof BusinessBrainSchema>;

/** A proposed open slot Otto can offer, derived from the owner's calendar. */
export const SlotSchema = z.object({
  /** ISO start time. */
  start: z.string(),
  /** Human label in the business timezone, e.g. "Tue Jul 8, 2:00 PM". */
  label: z.string(),
  durationMin: z.number(),
});
export type Slot = z.infer<typeof SlotSchema>;

/** Result of classifying an inbound message. */
export const LeadClassificationSchema = z.object({
  isLead: z.boolean().describe("A prospective customer inquiry (not spam/vendor/existing/personal)."),
  category: z.enum([
    "new_lead",
    "existing_customer",
    "vendor_or_spam",
    "personal",
    "unclear",
  ]),
  confidence: z.number().min(0).max(1),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  service: z.string().nullable().describe("What they seem to want."),
  intent: z
    .enum(["quote", "book_appointment", "question", "urgent_service", "other"])
    .nullable(),
  urgency: z.enum(["low", "medium", "high"]).nullable(),
  preferredTimes: z.string().nullable().describe("Any timing they mentioned, verbatim-ish."),
  estValueUsd: z.number().nullable().describe("Rough job value if inferable, else null."),
  summary: z.string(),
});
export type LeadClassification = z.infer<typeof LeadClassificationSchema>;

/** Result of drafting a reply. */
export const ReplyDraftSchema = z.object({
  reply: z.string().describe("The full email body Otto would send."),
  offeredSlots: z.array(z.string()).describe("ISO starts Otto offered, subset of provided slots."),
  confidence: z.number().min(0).max(1),
  needsHuman: z.boolean().describe("True if Otto is unsure and should route to the owner."),
  reason: z.string().describe("Why needsHuman is true/false — for the owner's trust."),
});
export type ReplyDraft = z.infer<typeof ReplyDraftSchema>;

/** An inbound message to process. */
export interface InboundMessage {
  from: string;
  subject?: string;
  body: string;
  receivedAt?: string;
}

/** Full result of Otto handling one inbound message end-to-end (for the demo). */
export interface HandleResult {
  classification: LeadClassification;
  draft: ReplyDraft | null;
  mode: "live" | "mock";
  latencyMs: number;
}
