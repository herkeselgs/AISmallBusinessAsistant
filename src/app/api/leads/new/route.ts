import { NextResponse } from "next/server";
import { z } from "zod";
import { generateNewLead } from "@/lib/otto/workspace";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({ autopilot: z.boolean().optional() });

/** Simulates a brand-new inbound lead arriving, processed by Otto. */
export async function POST(req: Request) {
  let autopilot = false;
  try {
    autopilot = Body.parse(await req.json().catch(() => ({}))).autopilot ?? false;
  } catch {
    autopilot = false;
  }
  try {
    const lead = await generateNewLead(undefined, autopilot);
    return NextResponse.json({ lead });
  } catch (err) {
    console.error("POST /api/leads/new failed", err);
    return NextResponse.json({ error: "Could not generate lead" }, { status: 500 });
  }
}
