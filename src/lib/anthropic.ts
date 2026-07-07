import Anthropic from "@anthropic-ai/sdk";

/** Whether real Claude is available. When false, the engine uses mock mode. */
export const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);

export const MODELS = {
  draft: process.env.OTTO_DRAFT_MODEL || "claude-opus-4-8",
  classify: process.env.OTTO_CLASSIFY_MODEL || "claude-haiku-4-5-20251001",
} as const;

let client: Anthropic | null = null;

/** Lazily construct the Anthropic client so importing this module never throws. */
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}
