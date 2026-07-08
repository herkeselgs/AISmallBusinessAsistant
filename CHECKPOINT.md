# CHECKPOINT — Folvra

_Last updated: 2026-07-08 (session #6 — AI live suggestions for Call Copilot)_

Live domain: **https://folvra.com** · Branch: `claude/ai-employee-startup-sdk3er`

## Status: ✅ STABLE — build + 50 tests pass, everything committed & pushed

## The product (routes)
- `/` landing (6-vertical live demo) · `/dashboard` leads inbox (approve-first) ·
  `/pilot` pilot/demo request (mailto) · `/founder` 🔒 outreach cockpit · `/yc` 🔒 traction.
- Runs fully in **mock mode with no API key**. No Gmail/Calendar/Supabase/auth/payments.

## /founder now contains
1. **Find prospects** — Google Maps via in-app Places key OR the **"Pull from Google
   Maps" bookmarklet** (no key) OR CSV/paste import. Real data only.
2. **Live Call Copilot** — guided cold-calling with **AI live suggestions** (this
   session) layered on top of the deterministic rule engine. See below.
3. **Outreach spreadsheet** — 24 cols, localStorage, per-row actions, CSV/TSV, YC sync.
4. Scripts (call/voicemail/email/SMS/objections/demo checklist/etc.) + non-negotiables.

## Completed this session (#6) — AI live suggestions
- **Two new API routes** (`src/app/api/call-copilot/`):
  - `POST /suggest` — live per-utterance suggestion. Adapts to prospect, trade, call
    stage, recent transcript, latest utterance, detected objection. Returns
    `{source, suggestedResponse, nextBestQuestion, detectedIntent, objectionType,
    confidence, recommendedAction, shortReason}`. Claude (Haiku, 6s timeout, no
    retries) when `ANTHROPIC_API_KEY` is set; **deterministic `ruleSuggest` fallback**
    otherwise or on any error/timeout. Supports `refine` = shorter / more_direct /
    ask_for_demo.
  - `POST /summary` — after-call summary. **Always** computes deterministic
    `buildSummary` (flags/status/follow-up-date stay reliable for the spreadsheet);
    when a key is set Claude (Opus draft, 18s timeout) improves only the prose fields
    (summary, pain, objections, workflow, lead sources, next action, SMS, email,
    demoLikelihood). Falls back to deterministic on any failure.
- **Shared logic** added to `copilot.ts`: `Suggestion`/`RecommendedAction` types,
  `ruleSuggest()` (objection→response, interest→demo ask, else next question — used by
  the client for the instant suggestion AND by the route as the AI fallback), and
  `demoLikelihood()`. All unit-tested.
- **UI** (`src/components/call-copilot.tsx`): right column now shows **"Instant
  suggestion (rules)"** immediately + **"AI refined suggestion"** with a "Refining
  response…" loading state. AI fires on prospect pause (1.2s debounce, ≥1.5s between
  calls, seq-guard drops stale in-flight responses, 7s abort). Controls: **Use AI**
  toggle, Regenerate, Shorter, More direct, Ask for demo, Use AI / Use this, copy
  buttons. The big highlighted script line defaults to best available
  (AI → rule → next script line). End Call fires the AI summary **non-blocking** after
  the deterministic save (shows "AI refining…"; upgrades notes when it returns).
- **AI is strictly an enhancement — never a dependency.** No key = full product via
  rules; key present = polished suggestions/summaries. Key stays server-side.

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
- `npm test` → **50/50 pass** (new: `demoLikelihood`, `ruleSuggest` shared fallback).
- `npm run build` → **success**; `/founder` 21.2 kB; both `/api/call-copilot/*` routes
  registered as dynamic (server-rendered on demand).
- Runtime (no key): `/api/call-copilot/suggest` returns `source:"rule"` with the right
  objection/demo handling; `/api/call-copilot/summary` returns the full deterministic
  summary; `/founder` **200**.
- Works **without** speech recognition (manual mode) and **without** any API key.

## Files changed / added this session (#6)
- Added: `src/app/api/call-copilot/suggest/route.ts`,
  `src/app/api/call-copilot/summary/route.ts`.
- Edited: `src/lib/folvra/copilot.ts` (Suggestion/RecommendedAction/ruleSuggest/
  demoLikelihood), `src/lib/folvra/copilot.test.ts`, `src/components/call-copilot.tsx`
  (AI suggestion layer + AI after-call summary).

## Known bugs / limitations
- **None blocking.** Speech recognition is **Chrome/Edge only** (Web Speech API);
  Safari/Firefox fall back to manual typing — the copilot still fully works.
- Speaker detection is turn-based (button/keyboard driven), not voice biometrics — by
  design. No auto-advance on speech; you press Space / "I said this".
- **AI suggestions/summary require `ANTHROPIC_API_KEY` (server-side env only).**
  Without it the instant rule engine drives everything — the "AI refined" block shows
  "AI unavailable (no API key set)" and the rule suggestion is used. Nothing breaks.
- AI is latency-gated (debounced, ≥1.5s apart, 6–7s timeout) and never blocks the UI;
  the rule suggestion is always shown first and instantly.
- Call stats + prospects persist in **browser localStorage only**.

## Exact next prompt to resume
> "Resume Folvra. Read CHECKPOINT.md. /founder has prospect finder + spreadsheet +
> Live Call Copilot WITH AI live suggestions + AI after-call summary (both behind
> ANTHROPIC_API_KEY, deterministic fallback when absent). Options next: (1) wire the
> ROI calculator into the landing page; (2) wire pilot-form submits to a real capture
> (Formspree / Vercel route) + a /thanks page; (3) set ANTHROPIC_API_KEY in Vercel and
> live-test the AI copilot on a real call. Keep mock fallback; no payments/CRM; don't
> break existing routes."

## What to do next (you)
Open **/founder → Live Call Copilot**, pick a prospect, hit **Start Call Copilot**,
say the consent line, and dial. Use Space to advance your lines, L when the prospect
talks, M for your turn, E to end + save. When you can call, run your non-negotiables.
