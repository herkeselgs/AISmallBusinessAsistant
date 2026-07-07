# CHECKPOINT — Folvra

_Last updated: 2026-07-07 (overnight session)_

Live domain: **https://folvra.com** · Branch: `claude/ai-employee-startup-sdk3er`

## Status: ✅ STABLE — build + tests pass, everything committed & pushed

## Completed this session
1. **Full rename Otto → Folvra** — every user-facing surface: landing, navbar, hero,
   CTAs, live demo, dashboard, metadata/title/description, footer, README, all docs,
   pricing, FAQ, scripts. Internal module renamed `lib/otto` → `lib/folvra`, component
   `otto-demo` → `folvra-demo`, env vars `OTTO_*` → `FOLVRA_*`, package name `folvra`.
   Verified: **zero "Otto" left in source**, zero stray "O" logo badges.
2. **New positioning** — "The AI employee that follows up with every lead before it
   goes cold." Core promise (reply <60s, collect job details, follow up, help book the
   estimate) woven through hero, how-it-works, comparison table, FAQ, footer.
3. **Domain/canonical** — `metadataBase = https://folvra.com`, canonical + OG/Twitter
   tags in `layout.tsx`. No Vercel URL anywhere in user-facing copy (grep-verified).
4. **/pilot** — pro conversion page + `PilotForm` (business, owner, phone, email,
   industry, website, current handling, biggest problem). No DB: builds a prefilled
   **mailto to the founder** + a **copyable message** + live preview. "Book a 5-min
   demo" mailto CTA. Landing CTAs now point to /pilot.
5. **/founder** (no nav link, `noindex`) — morning plan, **localStorage outreach
   tracker** (30 seeded rows; business/owner/phone/email/vertical/contacted/replied/
   demo/pilot/notes; add-row, CSV export, reset, live counts), and copy-buttoned
   scripts: cold call, SMS/DM, cold emails 1–3, follow-up-after-demo, 5-min demo,
   objections, pilot onboarding, list-building.
6. **/yc** (no nav link, `noindex`) — editable localStorage traction tracker
   (contacted, conversations, demos, pilots, paying, leads processed, estimates,
   pipeline rescued) with targets + progress bars, plus testimonials/quotes fields.
7. **Demo improvements** — landing demo shows: lead in → detect job type + urgency →
   personalized reply → "you approve/edit or autopilot" note → moves toward booked
   estimate **with follow-up** → spam skipped. Dashboard = approve/edit + status
   pipeline (new→drafted→sent→booked/won). Copy de-Googled (pilot framing).
8. **Docs/README** — GTM doc + README rebranded; README lists all routes.

## Build / test status
- `npm test` → **10/10 pass** (`engine.test.ts`, `workspace.test.ts`).
- `npm run build` → **success**; prerenders `/ /dashboard /pilot /founder /yc` +
  API routes `/api/demo /api/leads /api/leads/new`.
- Mock fallback intact: everything works with **no `ANTHROPIC_API_KEY`**.

## Files changed / added
- Renamed: `src/lib/otto/*` → `src/lib/folvra/*`; `src/components/otto-demo.tsx` →
  `folvra-demo.tsx`.
- Added: `src/app/pilot/page.tsx`, `src/app/founder/page.tsx`, `src/app/yc/page.tsx`,
  `src/components/pilot-form.tsx`, `src/components/founder-console.tsx`,
  `src/components/yc-tracker.tsx`, `src/lib/folvra/contact.ts`, `CHECKPOINT.md`.
- Edited: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/dashboard/page.tsx`,
  `src/components/folvra-demo.tsx`, `src/components/leads-inbox.tsx`,
  `src/lib/anthropic.ts`, `.env.example`, `package.json`, `README.md`, `docs/*`.

## Known bugs / limitations
- **None blocking.** Runtime smoke-testing in this sandbox was flaky because
  background dev-servers don't persist across tool calls and foreground `sleep` is
  blocked — but the production build prerenders every page (proves they render) and
  earlier same-process checks returned HTTP 200 on all routes + working demo API.
- `/pilot` and `/yc` and `/founder` trackers persist in **browser localStorage only**
  (by design — no DB). Export CSV before switching devices/browsers.
- Pilot requests go to the founder email in `src/lib/folvra/contact.ts`
  (`usstephan431@gmail.com`) via the user's own email client (mailto). Change there if
  a `hello@folvra.com` inbox is set up later.

## Config the founder may want to do (optional, not required)
- Add `ANTHROPIC_API_KEY` in Vercel → Settings → Env Vars → redeploy, to switch the
  demo/engine from mock to **real Claude**. (Do NOT set `ANTHROPIC_BASE_URL`.)
- Nothing else required — no Google/Supabase/auth/payments (intentionally out of scope).

## Exact next prompt to resume
> "Resume Folvra. Read CHECKPOINT.md. Everything is rebranded + /pilot /founder /yc
> shipped. Next priorities, in order: (1) after I have 2–3 pilots, build the real
> Gmail + Calendar integration behind Google OAuth (test-mode, my creds); (2) a
> simple '/thanks' confirmation page after pilot submit; (3) wire pilot-form submits
> to a real capture (Formspree or a Vercel serverless route to email) so I don't rely
> on the owner's mail client. Keep mock fallback. Don't touch payments/CRM yet."
