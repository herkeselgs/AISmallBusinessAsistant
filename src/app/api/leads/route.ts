import { NextResponse } from "next/server";
import { buildInitialLeads, computeStats } from "@/lib/folvra/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Returns the seeded demo inbox + ROI stats. Stateless — regenerated per call. */
export async function GET() {
  try {
    const { leads, screened } = await buildInitialLeads();
    return NextResponse.json({ leads, stats: computeStats(leads, screened) });
  } catch (err) {
    console.error("GET /api/leads failed", err);
    return NextResponse.json({ error: "Could not load leads" }, { status: 500 });
  }
}
