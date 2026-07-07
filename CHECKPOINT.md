# CHECKPOINT — Folvra

_Last updated: 2026-07-07 (session #3 — prospect finder + outreach spreadsheet)_

Live domain: **https://folvra.com** · Branch: `claude/ai-employee-startup-sdk3er`

## Status: ✅ STABLE — build + 24 tests pass, everything committed & pushed

## Completed (this session — /founder prospect finder + spreadsheet)
- **Prospect finder** (`/api/prospects` + "Find prospects" section on /founder):
  enter city/area + trade + max (default 30) → returns real businesses. Provider
  order: **Google Places** (if `GOOGLE_PLACES_API_KEY` set) → **OpenStreetMap**
  (Nominatim + Overpass, free, no key) → graceful `{ok:false}` so the UI always
  falls back to CSV/paste. **Never fabricates data** (real sources only); missing
  owner/email → blank or "Unknown"; every row carries a `source`.
- **Full outreach spreadsheet** (localStorage `folvra_prospects_v1`, seeded 30 rows):
  24 columns incl. all requested fields, editable cells, status dropdown, checkbox
  columns, follow-up date, notes, next action. Sortable (click header) + text filter.
  Per-row **actions**: Call (tel:), Email (mailto:), Open website, Copy cold email,
  Copy SMS (both customized w/ business + trade), and quick-mark Contacted / Demo /
  Pilot. Add row / delete row / reset.
- **Preview + add flow:** found prospects show in a preview table with per-row
  checkboxes → "Add selected" / "Add all"; **dedupe** by name + phone/website;
  existing manual rows preserved.
- **Import/Export:** Export CSV (download), **Copy for Google Sheets** (TSV),
  Import CSV/paste (header-mapped or headerless with phone/email/website detection).
- **Summary panel:** total / contacted / replied / demos booked / demos done /
  pilots / paying + conversion rates + "today's remaining" chips (30/20/10/5/3/1).
- **YC sync:** "Sync to YC tracker" writes outreach-derived counts into
  `folvra_yc_v1` (merges, preserves testimonials/quotes/etc.); reload /yc to see.
- `.env.example` documents optional `GOOGLE_PLACES_API_KEY` (no key required).

## Verification (this session)
- `npm test` → **24/24 pass** (added 12 prospect tests: dedupe, merge, CSV/TSV,
  import parsing incl. round-trip, summarize, YC mapping).
- `npm run build` → **success**; `/api/prospects` + all pages compile.
- Runtime (local, same-process): `/ /dashboard /pilot /founder /yc` all **200**.
- Finder **fails gracefully**: valid body w/ no key + blocked outbound →
  `{ok:false, reason:"…use CSV/paste"}` at 200; bad body → 400. (In this sandbox
  outbound is firewalled; on Vercel OSM will return real results, Places if keyed.)
- /founder renders (screenshot): finder + summary + 30-row spreadsheet + actions.

## Prior sessions (still in place)
Otto→Folvra rename; positioning "follows up with every lead before it goes cold";
6-vertical demo; /pilot, /founder, /yc, /dashboard; approve-first dashboard; mock
fallback. No Gmail/Calendar/Supabase/auth/payments.

## Files changed / added this session
- Added: `src/lib/folvra/prospects.ts`, `src/lib/folvra/prospects.test.ts`,
  `src/app/api/prospects/route.ts`, `src/components/prospect-console.tsx`.
- Edited: `src/app/founder/page.tsx` (render ProspectConsole instead of the old
  tracker; keeps CopyBlock scripts), `.env.example`.
- `src/components/founder-console.tsx` still exports `CopyBlock` (used) and the old
  `FounderConsole` (now unused, harmless).

## Known bugs / limitations
- **None blocking.** Auto-search returns few/no results via OSM for thinly-mapped
  US trades — that's expected; **CSV/paste is the reliable workhorse**, and Google
  Places (optional key) gives full data.
- Trackers persist in **browser localStorage only** (per-browser). Export CSV to back
  up / move devices.
- YC sync writes localStorage; /yc must be reloaded to reflect new numbers
  (no cross-tab live refresh by design).

## Manual actions for the founder (optional)
- **Best prospect data:** add `GOOGLE_PLACES_API_KEY` in Vercel env → redeploy.
  Get it at console.cloud.google.com (Places API, New). Without it, OSM + CSV work.
- Confirm latest deploy is live on folvra.com (should show 6-vertical demo + the new
  /founder finder). If stale → Vercel → Deployments → Redeploy.

## Exact next prompt to resume
> "Resume Folvra. Read CHECKPOINT.md. /founder now has a prospect finder + full
> outreach spreadsheet (localStorage) + YC sync. Next, in order: (1) wire the
> pilot form to a real capture (Formspree or a Vercel route that emails me) + a
> /thanks page; (2) optional: add a Yelp Fusion provider to the finder as another
> keyed source; (3) only after 2–3 pilots, real Gmail+Calendar behind Google OAuth
> (test mode). Keep mock fallback + never fabricate prospect data; no payments/CRM."

## What to do next (tomorrow morning)
Open **/founder**. Try "Find prospects" (Fort Myers, FL / HVAC). If auto-search is
thin, use **Import CSV / paste**: pull a list from Google Maps and paste it — the
spreadsheet fills automatically. Then work the rows: Call/Email/Copy-SMS, mark
Contacted/Demo/Pilot, hit the non-negotiables (30 contacted / 3 demos / 1 pilot),
and click **Sync to YC tracker** at end of day.
