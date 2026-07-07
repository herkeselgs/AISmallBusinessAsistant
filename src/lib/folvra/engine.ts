import { z } from "zod";
import { anthropic, hasApiKey, MODELS } from "@/lib/anthropic";
import { generateSlots } from "./availability";
import { mockClassify, mockDraft } from "./mock";
import {
  CLASSIFY_SYSTEM,
  classifyUser,
  draftSystem,
  draftUser,
} from "./prompts";
import {
  LeadClassificationSchema,
  ReplyDraftSchema,
  type BusinessBrain,
  type HandleResult,
  type InboundMessage,
  type LeadClassification,
  type ReplyDraft,
  type Slot,
} from "./types";

/**
 * The Folvra engine. Runs against real Claude when ANTHROPIC_API_KEY is set,
 * otherwise falls back to a deterministic mock so the product is always
 * demoable. Model tiering: cheap/fast Haiku to triage, Opus to draft the reply.
 */

/** Pull the first JSON object out of a model response and validate it. */
function parseJson<T>(text: string, schema: z.ZodType<T>): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function complete(
  model: string,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const res = await anthropic().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

export async function classifyLead(msg: InboundMessage): Promise<LeadClassification> {
  if (!hasApiKey) return mockClassify(msg);
  const text = await complete(MODELS.classify, CLASSIFY_SYSTEM, classifyUser(msg), 1024);
  return parseJson(text, LeadClassificationSchema) ?? mockClassify(msg);
}

export async function draftReply(
  msg: InboundMessage,
  slots: Slot[],
  brain: BusinessBrain,
  classification: LeadClassification
): Promise<ReplyDraft> {
  if (!hasApiKey) return mockDraft(msg, slots, brain, classification);
  const text = await complete(
    MODELS.draft,
    draftSystem(brain),
    draftUser(msg, slots, {
      service: classification.service,
      summary: classification.summary,
    }),
    2048
  );
  return parseJson(text, ReplyDraftSchema) ?? mockDraft(msg, slots, brain, classification);
}

/**
 * End-to-end: classify an inbound message and, if it's a real lead, draft a
 * reply with concrete open times. Returns everything needed to render the demo
 * or the product inbox.
 */
export async function handleLead(
  msg: InboundMessage,
  brain: BusinessBrain
): Promise<HandleResult> {
  const started = Date.now();
  const classification = await classifyLead(msg);

  let draft: ReplyDraft | null = null;
  if (classification.isLead) {
    const duration = brain.bookingTypes[0]?.durationMin ?? 60;
    const slots = generateSlots({ durationMin: duration, count: 3 });
    draft = await draftReply(msg, slots, brain, classification);
  }

  return {
    classification,
    draft,
    mode: hasApiKey ? "live" : "mock",
    latencyMs: Date.now() - started,
  };
}
