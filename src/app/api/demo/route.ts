import { NextResponse } from "next/server";
import { z } from "zod";
import { handleLead } from "@/lib/folvra/engine";
import { DEMO_BRAIN, SAMPLE_LEADS } from "@/lib/folvra/samples";
import type { InboundMessage } from "@/lib/folvra/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  leadId: z.string().optional(),
  from: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let message: InboundMessage | null = null;
  if (parsed.leadId) {
    message = SAMPLE_LEADS.find((l) => l.id === parsed.leadId)?.message ?? null;
  } else if (parsed.body && parsed.body.trim().length > 0) {
    message = {
      from: parsed.from?.trim() || "prospect@example.com",
      subject: parsed.subject?.trim() || "New inquiry",
      body: parsed.body.trim().slice(0, 4000),
    };
  }

  if (!message) {
    return NextResponse.json({ error: "No lead provided" }, { status: 400 });
  }

  try {
    const result = await handleLead(message, DEMO_BRAIN);
    return NextResponse.json({ message, result, business: DEMO_BRAIN.name });
  } catch (err) {
    console.error("demo handleLead failed", err);
    return NextResponse.json(
      { error: "Folvra hit an error handling that lead. Try again." },
      { status: 500 }
    );
  }
}
