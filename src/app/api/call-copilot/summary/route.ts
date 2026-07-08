import { NextResponse } from "next/server";
import { z } from "zod";
import { anthropic, hasApiKey, MODELS } from "@/lib/anthropic";
import { buildSummary, demoLikelihood, type CallSession, type Outcome } from "@/lib/folvra/copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * After-call summary. Deterministic buildSummary is always computed (flags,
 * status, follow-up date stay reliable for the spreadsheet). When a key exists,
 * Claude improves the prose fields (summary, SMS, email, pain, next action).
 * On any failure, the deterministic version is returned unchanged.
 */

const OUTCOMES = [
  "no_answer",
  "answered",
  "demo_booked",
  "follow_up",
  "not_interested",
  "pilot_offered",
  "pilot_started",
] as const;

const Body = z.object({
  business: z.string().min(1),
  owner: z.string().optional(),
  trade: z.string().optional(),
  outcome: z.enum(OUTCOMES),
  prospectTranscript: z.string().optional().default(""),
  objections: z.array(z.string()).optional().default([]),
  painScore: z.number().optional().default(0),
  sources: z.array(z.string()).optional().default([]),
  workflow: z.array(z.string()).optional().default([]),
  interest: z.boolean().optional().default(false),
});

const SYSTEM = `You summarize a cold sales call for Folvra (an AI that replies to a home-service business's new leads in under 60s, follows up, and helps book the estimate; approve-first; free 14-day pilot, then ~$99-$199/mo). Never invent Folvra features or claim live Gmail/Calendar integrations.

Return ONLY JSON:
{"summary": string (2-3 sentences, plain), "painLevel": "low"|"medium"|"high", "demoLikelihood": "low"|"medium"|"high", "objections": string, "currentWorkflow": string, "leadSources": string, "nextAction": string (short), "followUpSMS": string (friendly, <300 chars, from Stephan), "followUpEmail": string (3-4 sentences, from Stephan, signed "— Stephan · folvra.com")}`;

export async function POST(req: Request) {
  let input: z.infer<typeof Body>;
  try {
    input = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const session: CallSession = {
    business: input.business,
    owner: input.owner,
    trade: input.trade,
    outcome: input.outcome as Outcome,
    prospectTranscript: input.prospectTranscript,
    objections: input.objections,
    painScore: input.painScore,
    sources: input.sources,
    workflow: input.workflow,
    interest: input.interest,
  };
  const det = buildSummary(session);
  const like = demoLikelihood(input.painScore, input.interest, input.objections);

  if (!hasApiKey) {
    return NextResponse.json({ ...det, demoLikelihood: like, source: "rule" });
  }

  try {
    const user = [
      `BUSINESS: ${input.business}${input.owner && input.owner !== "Unknown" ? ` (owner ${input.owner})` : ""}${input.trade ? ` — ${input.trade}` : ""}`,
      `OUTCOME: ${det.outcomeLabel}`,
      input.objections.length ? `OBJECTIONS: ${input.objections.join(", ")}` : "",
      input.sources.length ? `LEAD SOURCES MENTIONED: ${input.sources.join(", ")}` : "",
      input.workflow.length ? `CURRENT WORKFLOW: ${input.workflow.join(", ")}` : "",
      `PAIN SCORE: ${input.painScore} · INTEREST: ${input.interest}`,
      input.prospectTranscript ? `PROSPECT TRANSCRIPT:\n${input.prospectTranscript.slice(0, 1500)}` : "",
      `\nReturn the JSON now.`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await anthropic().messages.create(
      {
        model: MODELS.draft,
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
      },
      { timeout: 18000, maxRetries: 0 }
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s === -1 || e === -1) return NextResponse.json({ ...det, demoLikelihood: like, source: "rule" });
    const raw = JSON.parse(text.slice(s, e + 1)) as Record<string, unknown>;
    const str = (k: string, fb: string) => (typeof raw[k] === "string" && (raw[k] as string).trim() ? (raw[k] as string).trim() : fb);
    const lvl = (k: string, fb: string) => (["low", "medium", "high"].includes(raw[k] as string) ? (raw[k] as string) : fb);

    const summary = str("summary", det.summary);
    const painLevel = lvl("painLevel", det.painLevel);
    const notes =
      `[Call ${det.notes.match(/\[Call ([\d-]+)\]/)?.[1] ?? new Date().toISOString().slice(0, 10)}] ` +
      `${input.business} — ${det.outcomeLabel}. Pain: ${painLevel}. ${summary}`;

    return NextResponse.json({
      ...det,
      source: "ai",
      summary,
      painLevel,
      demoLikelihood: lvl("demoLikelihood", like),
      objections: str("objections", det.objections),
      currentWorkflow: str("currentWorkflow", det.currentWorkflow),
      leadSources: str("leadSources", det.leadSources),
      nextAction: str("nextAction", det.nextAction),
      followUpSMS: str("followUpSMS", det.followUpSMS),
      followUpEmail: str("followUpEmail", det.followUpEmail),
      notes,
    });
  } catch (err) {
    console.error("call-copilot summary AI failed", err);
    return NextResponse.json({ ...det, demoLikelihood: like, source: "rule" });
  }
}
