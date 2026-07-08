import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, hasApiKey, MODELS } from "@/lib/anthropic";
import { ruleSuggest, type RecommendedAction, type Suggestion } from "@/lib/folvra/copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Live call suggestion. Uses Claude when ANTHROPIC_API_KEY is set; otherwise (or
 * on any AI error/timeout) falls back to the deterministic rule engine. The
 * call copilot NEVER depends on AI — this route always returns a usable
 * suggestion fast.
 */

const Body = z.object({
  prospect: z
    .object({
      businessName: z.string().optional(),
      ownerName: z.string().optional(),
      trade: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  callState: z
    .object({
      currentStage: z.string().optional(),
      currentGoal: z.string().optional(),
      mode: z.string().optional(),
    })
    .optional(),
  transcript: z
    .array(z.object({ speaker: z.string(), text: z.string(), timestamp: z.union([z.string(), z.number()]).optional() }))
    .optional(),
  latestProspectUtterance: z.string().optional(),
  detectedObjection: z.string().nullable().optional(),
  previousSuggestion: z.string().optional(),
  refine: z.enum(["shorter", "more_direct", "ask_for_demo"]).nullable().optional(),
  lineIndex: z.number().optional(),
});

const ACTIONS: RecommendedAction[] = [
  "continue_discovery",
  "ask_for_demo",
  "ask_for_pilot",
  "send_info",
  "handle_objection",
  "end_call",
  "schedule_follow_up",
];

const SYSTEM = `You are a live cold-call sales coach whispering short lines to a founder (Stephan, a high-school founder) who is calling home-remodeling businesses about Folvra.

WHAT FOLVRA IS (never invent beyond this):
- An AI that replies to a business's new leads in under 60 seconds, follows up, and helps book the estimate.
- It works from the lead notifications the business already gets by email (website forms, Yelp, Angi, Thumbtack, Google).
- It is approve-first: it drafts the reply, the owner approves, nothing sends automatically until they trust it.
- Free 14-day pilot. After that ~$99-$199/month depending on lead volume.
- Do NOT claim live Gmail or Google Calendar integrations — those are not built yet. Do not invent features, customers, or stats beyond "78% of customers hire whoever replies first."

YOUR JOB: given the latest thing the prospect said, write the single best next line for Stephan to say.
RULES for suggestedResponse:
- 1-2 sentences, max ~30 words. Natural on a phone, not scripted, not pushy, no over-explaining.
- Primary goal: book a 5-minute demo. Secondary: learn their lead workflow.
- If they object, answer briefly then steer back to the 5-minute demo ask.
- If interested, ask for a specific time (today or tomorrow).
- If they say "send info", still try to book 5 minutes.
- If "not interested", ask ONE polite learning question (is slow follow-up not a problem, or just not now?).
- If "how much", give the pilot/pricing line above.

Return ONLY a JSON object:
{"suggestedResponse": string, "nextBestQuestion": string, "detectedIntent": string, "objectionType": string|null, "confidence": number (0-1), "recommendedAction": one of ["continue_discovery","ask_for_demo","ask_for_pilot","send_info","handle_objection","end_call","schedule_follow_up"], "shortReason": string}`;

function fallback(latest: string, lineIndex: number): Suggestion {
  return ruleSuggest(latest, lineIndex);
}

export async function POST(req: Request) {
  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await req.json());
  } catch {
    return NextResponse.json(fallback("", -1));
  }

  const latest = input.latestProspectUtterance || "";
  const lineIndex = input.lineIndex ?? -1;
  const rule = fallback(latest, lineIndex);

  if (!hasApiKey) {
    return NextResponse.json(rule);
  }

  try {
    const p = input.prospect ?? {};
    const transcript = (input.transcript ?? [])
      .slice(-8)
      .map((t) => `${t.speaker === "me" ? "Stephan" : "Prospect"}: ${t.text}`)
      .join("\n");
    const refineNote =
      input.refine === "shorter"
        ? "\nMake the response noticeably SHORTER than before."
        : input.refine === "more_direct"
        ? "\nMake the response MORE DIRECT — go straight to the 5-minute demo ask."
        : input.refine === "ask_for_demo"
        ? "\nThe response MUST directly ask to book a 5-minute demo today or tomorrow."
        : "";

    const user = [
      `PROSPECT: ${p.businessName || "a remodeler"}${p.ownerName && p.ownerName !== "Unknown" ? ` (owner ${p.ownerName})` : ""}${p.trade ? ` — ${p.trade}` : ""}`,
      p.notes ? `NOTES: ${p.notes.slice(0, 300)}` : "",
      `CALL STAGE: ${input.callState?.currentStage || "discovery"} · GOAL: ${input.callState?.currentGoal || "book a 5-minute demo"}`,
      input.detectedObjection ? `RULE-DETECTED OBJECTION: ${input.detectedObjection}` : "",
      transcript ? `RECENT TRANSCRIPT:\n${transcript}` : "",
      `LATEST PROSPECT SAID: "${latest || "(nothing yet)"}"`,
      input.previousSuggestion ? `PREVIOUS SUGGESTION: "${input.previousSuggestion}"` : "",
      refineNote,
      `\nReturn the JSON now.`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await anthropic().messages.create(
      {
        model: MODELS.classify,
        max_tokens: 350,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
      },
      { timeout: 6000, maxRetries: 0 }
    );

    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return NextResponse.json(rule);
    const raw = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;

    const suggestedResponse = typeof raw.suggestedResponse === "string" ? raw.suggestedResponse.trim() : "";
    if (!suggestedResponse) return NextResponse.json(rule);

    const action = ACTIONS.includes(raw.recommendedAction as RecommendedAction)
      ? (raw.recommendedAction as RecommendedAction)
      : rule.recommendedAction;

    const out: Suggestion = {
      source: "ai",
      suggestedResponse,
      nextBestQuestion:
        typeof raw.nextBestQuestion === "string" && raw.nextBestQuestion.trim()
          ? raw.nextBestQuestion.trim()
          : rule.nextBestQuestion,
      detectedIntent: typeof raw.detectedIntent === "string" ? raw.detectedIntent : rule.detectedIntent,
      objectionType:
        typeof raw.objectionType === "string" && raw.objectionType ? raw.objectionType : rule.objectionType,
      confidence: typeof raw.confidence === "number" ? Math.max(0, Math.min(1, raw.confidence)) : 0.7,
      recommendedAction: action,
      shortReason: typeof raw.shortReason === "string" ? raw.shortReason : "AI suggestion",
    };
    return NextResponse.json(out);
  } catch (err) {
    console.error("call-copilot suggest AI failed", err);
    return NextResponse.json(rule);
  }
}
