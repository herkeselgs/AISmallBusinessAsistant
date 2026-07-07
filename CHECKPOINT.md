# CHECKPOINT — Folvra

_Last updated: 2026-07-07 (overnight session #2 — conversion polish)_

Live domain: **https://folvra.com** · Branch: `claude/ai-employee-startup-sdk3er`

## Status: ✅ STABLE — build + 12 tests pass, everything committed & pushed

## Completed (this session — conversion polish)
1. **Production verification** — live folvra.com could **not** be reached from the
   sandbox (network policy denies outbound to folvra.com:443; proxy logged
   `connect_rejected 403`). Verified **locally instead**: fresh server, all routes
   HTTP 200, demo API correct per vertical. Source clean: **no "Otto", no vercel.app**.
2. **Landing polish** — hero microcopy → "Free 14-day pilot · No credit card ·
   Approve-first, then autopilot" + verticals line (contractors/remodelers/HVAC/
   roofers/landscapers/cleaners/plumbers/electricians). New **ChannelsBand** section
   (Website forms/Yelp/Angi/Thumbtack/Google/Facebook/Email) framed honestly ("during
   your pilot we point Folvra at those" — no false "live integration" claim) +
   approve-first line. CTAs all → /pilot.
3. **Demo upgrade** — demo business is now multi-trade "Summit Home Services". Six
   vertical sample buttons: **HVAC emergency, Roofing estimate, Bathroom remodel,
   Landscaping quote, Cleaning inquiry, Vendor spam**. Mock classifier extended
   (services + urgency + $ ranges) so each shows job type, urgency, draft reply,
   follow-up/booking step — spam skipped. Verified live per-vertical.
4. **/pilot conversion** — benefits list (free 14-day pilot, no card, we set up
   manually first, you approve replies, best fit 10+ leads/mo, cancel anytime).
   Message now includes `Source: https://folvra.com/pilot`. Fallback: copy message +
   the founder email shown for manual send.
5. **/founder cockpit** — added Voicemail, Demo checklist, "What to log after every
   call", "How to ask for payment", "How to ask for a testimonial", and a
   **"Tomorrow's non-negotiables"** panel (30 contacted / 20 calls / 10 emails / 5
   SMS / 3 demos / 1 pilot). Tracker (30 rows, CSV export) unchanged.
6. **/yc tracker** — added "Demos completed", "Biggest objections heard", "Product
   changes from feedback", and a **"Copy summary for the YC app"** button.
7. **Docs** — new `docs/05-tomorrow-outreach-plan.md`, `06-demo-and-pilot-playbook.md`,
   `07-yc-metrics.md` (practical, mirror /founder + /yc).

## Prior session (still in place)
Full Otto→Folvra rename; new positioning ("follows up with every lead before it goes
cold"); canonical → folvra.com; `/pilot`, `/founder`, `/yc`, `/dashboard`; approve-first
dashboard; mock fallback. No Gmail/Calendar/Supabase/auth/payments.

## Build / test status
- `npm test` → **12/12 pass**. `npm run build` → **success** (prerenders `/ /dashboard
  /pilot /founder /yc` + API routes). Runs fully in **mock mode with no API key**.

## Files changed / added this session
- Edited: `src/lib/folvra/samples.ts` (multi-trade brain + 6 samples), `mock.ts`
  (vertical detection + urgency + $), `workspace.ts` (seed statuses),
  `src/components/folvra-demo.tsx` (6 buttons), `leads-inbox.tsx` (name),
  `src/app/page.tsx` (hero + ChannelsBand), `src/app/pilot/page.tsx` +
  `src/components/pilot-form.tsx`, `src/app/founder/page.tsx`,
  `src/components/yc-tracker.tsx`, `src/lib/folvra/engine.test.ts`.
- Added: `docs/05/06/07`, updated `CHECKPOINT.md`.

## Known bugs / limitations
- **None blocking.** Live-site verification blocked by sandbox egress policy (see #1) —
  verified via build + local server instead.
- Trackers on /founder and /yc persist in **browser localStorage only** (by design).
  Export CSV / copy-summary before switching browsers.
- Pilot requests go to `FOUNDER_EMAIL` in `src/lib/folvra/contact.ts`
  (`usstephan431@gmail.com`) via the visitor's mail client (mailto).

## Manual actions for the founder (only if needed)
- **Confirm the latest push deployed** on Vercel (open folvra.com; should show the new
  hero "Free 14-day pilot… Approve-first" + 6 demo buttons). If stale → Vercel →
  Deployments → Redeploy, or confirm Production Branch = `claude/ai-employee-startup-sdk3er`.
- Optional real AI: add `ANTHROPIC_API_KEY` in Vercel env → redeploy (do NOT set
  `ANTHROPIC_BASE_URL`). Mock works without it.

## Exact next prompt to resume
> "Resume Folvra. Read CHECKPOINT.md. Site is fully rebranded + conversion-polished
> (6-vertical demo, /pilot, /founder cockpit, /yc). Next, in order: (1) once I have
> 2–3 pilots, wire pilot-form submits to a real capture (Formspree or a Vercel route
> that emails me) so I don't depend on the owner's mail client; (2) a /thanks page
> after submit; (3) only after that, the real Gmail + Calendar integration behind
> Google OAuth in test mode. Keep mock fallback; no payments/CRM yet."

## What to do tomorrow morning
Open **/founder**, build your 30-business list, hit the non-negotiables (30 contacted /
3 demos / 1 pilot). Scripts are on /founder and in `docs/06`. Log to the tracker + /yc.
