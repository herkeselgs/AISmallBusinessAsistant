# CHECKPOINT — Folvra

_Last updated: 2026-07-08 (session #5 — Live Call Copilot)_

Live domain: **https://folvra.com** · Branch: `claude/ai-employee-startup-sdk3er`

## Status: ✅ STABLE — build + 45 tests pass, everything committed & pushed

## The product (routes)
- `/` landing (6-vertical live demo) · `/dashboard` leads inbox (approve-first) ·
  `/pilot` pilot/demo request (mailto) · `/founder` 🔒 outreach cockpit · `/yc` 🔒 traction.
- Runs fully in **mock mode with no API key**. No Gmail/Calendar/Supabase/auth/payments.

## /founder now contains
1. **Find prospects** — Google Maps via in-app Places key OR the **"Pull from Google
   Maps" bookmarklet** (no key) OR CSV/paste import. Real data only.
2. **Live Call Copilot** (this session) — guided cold-calling. See below.
3. **Outreach spreadsheet** — 24 cols, localStorage, per-row actions, CSV/TSV, YC sync.
4. Scripts (call/voicemail/email/SMS/objections/demo checklist/etc.) + non-negotiables.

## Completed this session — Live Call Copilot
- **Logic** (`src/lib/folvra/copilot.ts`, fully unit-tested): the 15-line script
  (open/discovery/close, `{business}` rendered), objection detection (7 objections →
  exact suggested responses), pain/lead-source/workflow/interest signal detection,
  approximate **word-match highlighting** (fuzzy/paraphrase tolerant), and
  **after-call summary** builder (outcome→status+flags, pain level, next action,
  follow-up date, follow-up SMS + email, notes block).
- **UI** (`src/components/call-copilot.tsx`): 3-column live view (Prospect / Live
  guide / Intelligence), consent gate, **Web Speech API** (SpeechRecognition) with
  turn-based speaker mode (My turn / Prospect speaking), word-by-word highlight as
  you speak, live suggested response as the prospect talks, progress bar, outcome
  buttons, **manual textarea fallback** when speech is unavailable, keyboard
  shortcuts (Space=said this, L=prospect, M=my turn, E=end), copy buttons, and a
  session **stats bar** (localStorage `folvra_call_stats_v1`).
- **Spreadsheet integration:** End call → writes contacted/called/replied/demoBooked/
  pilotOffered/pilotStarted, status, next action, follow-up date, and a dated notes
  block to the selected prospect row (via the shared ProspectConsole `update`).
- Also present but unwired: `src/components/roi-calculator.tsx` (ROI calculator built
  right before the pivot — valid component, not imported anywhere; wire into landing
  later if wanted).

## Verification
- `npm test` → **45/45 pass** (24 new copilot tests: objection detection, word-match/
  highlight, summary generation).
- `npm run build` → **success**; all routes prerender (`/founder` 19.3 kB).
- Runtime: `/ /dashboard /pilot /founder /yc` all **200**; copilot renders SSR.
- Works **without** speech recognition (manual mode) and **without** any API key.

## Files changed / added this session
- Added: `src/lib/folvra/copilot.ts`, `src/lib/folvra/copilot.test.ts`,
  `src/components/call-copilot.tsx`, `src/components/roi-calculator.tsx`.
- Edited: `src/components/prospect-console.tsx` (import + "Live Call Copilot" section).

## Known bugs / limitations
- **None blocking.** Speech recognition is **Chrome/Edge only** (Web Speech API);
  Safari/Firefox fall back to manual typing — the copilot still fully works.
- Speaker detection is turn-based (button/keyboard driven), not voice biometrics — by
  design. No auto-advance on speech; you press Space / "I said this".
- Objection/summary logic is deterministic (no AI call) — reliable, offline; could be
  AI-enhanced later behind ANTHROPIC_API_KEY (not required).
- Call stats + prospects persist in **browser localStorage only**.

## Exact next prompt to resume
> "Resume Folvra. Read CHECKPOINT.md. /founder has prospect finder + spreadsheet +
> Live Call Copilot. Options next: (1) wire the ROI calculator into the landing page;
> (2) let the copilot optionally call an ANTHROPIC_API_KEY server route to polish the
> after-call summary (keep the deterministic fallback); (3) wire pilot-form submits to
> a real capture (Formspree / Vercel route) + a /thanks page. Keep mock fallback; no
> payments/CRM; don't break existing routes."

## What to do next (you)
Open **/founder → Live Call Copilot**, pick a prospect, hit **Start Call Copilot**,
say the consent line, and dial. Use Space to advance your lines, L when the prospect
talks, M for your turn, E to end + save. When you can call, run your non-negotiables.
