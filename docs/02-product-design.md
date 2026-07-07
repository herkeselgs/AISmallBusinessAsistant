# Phase 2 — Product Design (MVP)

_Product: **Folvra** — the AI employee that never lets a lead go cold._

## The one exceptional feature (the whole MVP)

**Instant Lead Response + Booking.** Everything else is deleted until this is
undeniably great. The bar: a stranger emails/forms in at 11pm; within 60 seconds
they get a reply that (a) sounds like a real, competent person at the business,
(b) answers their actual question using the business's real info, and (c) offers
specific open times and books one onto Google Calendar — with the owner notified
and in control.

If we nail only this, we have a business. So we obsess only on this.

---

## Core user journey

```
Marketing site  →  "See it work on your own inbox"
      │
      ▼
Sign in with Google (Gmail + Calendar, read + send scoped)
      │
      ▼
ONBOARDING (≈3 min, the activation moment)
  1. Folvra reads your website + last 90 days of email → drafts your "Business Brain"
     (services, pricing hints, service area, hours, tone, FAQs)
  2. You review/edit the Brain (2–3 quick confirmations, not a form wall)
  3. Set booking rules: appointment types, durations, buffer, availability,
     which calendar, address/virtual, how far out
  4. WOW MOMENT: Folvra finds a *real past lead* in your inbox that you replied to
     slowly (or never) and shows the reply it *would* have sent in 45 seconds.
      │
      ▼
GO LIVE — choose mode:
   • Autopilot: Folvra replies & books automatically
   • Approve-first: Folvra drafts, you tap Approve (great for week 1 trust)
      │
      ▼
STEADY STATE
  New lead arrives (email / web-form email / marketplace email)
    → Folvra classifies: is this a lead? intent? service? urgency?
    → Folvra drafts a personalized reply w/ real availability
    → (approve-first: notify owner to approve) / (autopilot: send)
    → Customer picks a time → Folvra books it on Calendar + confirms both sides
    → Owner sees it on the dashboard: "Booked ✓ Sarah — kitchen estimate — Tue 2pm"
      │
      ▼
DASHBOARD / DAILY HABIT
  "Today: 6 leads, avg response 38s, 3 booked, ~$5,400 pipeline rescued"
```

## Screens (MVP — six, no more)

1. **Landing page** — visceral problem, live-ish demo, one CTA (Connect Google).
2. **Onboarding wizard** — Brain review → booking rules → the replay wow-moment.
3. **Inbox / Leads** — the heart. Stream of detected leads, each with the
   conversation, Folvra's draft/sent reply, status (New → Replied → Booked → Won),
   and Approve/Edit/Send controls. This is where owners live in week 1.
4. **Business Brain** — editable knowledge the AI uses (services, pricing, FAQs,
   service area, tone, do/don't rules, escalation triggers).
5. **Availability & booking rules** — appointment types, hours, buffers, calendar.
6. **Dashboard** — leads captured, median response time, booked, estimated
   pipeline rescued, this-week trend. (This is the retention & ROI-proof surface.)

Settings/billing are secondary sub-pages, not headline screens.

---

## Backend architecture

```
Next.js 14 (App Router, TS, Tailwind, shadcn/ui) ── Vercel
        │
        ├── Auth: Google OAuth (Gmail + Calendar scopes) via NextAuth
        │       (Supabase session/user store)
        │
        ├── Postgres (Supabase): businesses, brains, leads, messages,
        │       appointments, events, settings
        │
        ├── Ingestion:
        │     • MVP: Gmail API history/watch (push via Pub/Sub) or poll every 60s
        │     • Each new inbound message → lead pipeline
        │
        ├── AI core (Anthropic Claude — claude-opus-4-8 for quality drafts,
        │       claude-haiku-4-5 for cheap classification):
        │     • classifyLead()  → is-lead? intent, service, urgency, contact
        │     • draftReply()    → uses Business Brain + live availability + thread
        │     • extractBookingChoice() → parse "Tuesday 2 works" → slot
        │
        ├── Calendar: Google Calendar freebusy + event create
        │
        └── Actions: send reply (Gmail send), book (Calendar), notify owner
                (email/SMS later), update lead status
```

### Why this stack

- **Next.js + Vercel:** fastest path to a polished, fast, deployable full-stack
  app; server actions/route handlers do the AI + Google work server-side.
- **Supabase Postgres:** managed Postgres + auth + RLS; zero ops.
- **NextAuth Google:** we need Google OAuth anyway (Gmail+Calendar); reuse it for
  login. One connection, one consent screen — matches the "connect your inbox"
  promise.
- **Claude (opus-4-8 / haiku-4-5):** best drafting quality + cheap classification.
  Tiered so per-lead cost stays low.

### Data model (MVP)

```
businesses   (id, owner_user_id, name, website, timezone, mode[autopilot|approve],
              google_email, created_at)
brains       (id, business_id, services jsonb, pricing_notes, service_area,
              hours jsonb, faqs jsonb, tone, rules jsonb, updated_at)
leads        (id, business_id, contact_name, contact_email, contact_phone,
              source, intent, service, urgency, status, first_seen_at,
              first_response_at, est_value, gmail_thread_id)
messages     (id, lead_id, direction[in|out], channel, body, ai_generated bool,
              approved_by, sent_at, gmail_message_id)
appointments (id, lead_id, business_id, type, start_ts, end_ts, location,
              gcal_event_id, status)
events       (id, business_id, type, payload jsonb, created_at)  -- analytics/audit
```

## AI workflows (prompts, at a high level)

1. **Business Brain builder** — given website text + sampled inbox threads,
   extract services, pricing signals, service area, hours, FAQ answers, and a
   tone profile. Output structured JSON the owner can edit.
2. **Lead classifier** (haiku) — given an inbound message, decide: is this a
   sales lead (vs spam/vendor/existing customer/personal)? intent, service,
   urgency, extracted contact + preferred times. Cheap + fast, gates the pipeline.
3. **Reply drafter** (opus) — given the thread + Brain + live free/busy, write a
   reply that answers the question, reflects the owner's tone, and offers 2–3
   concrete open slots. Never invents prices it isn't given; escalates when unsure.
4. **Booking extractor** — parse the customer's chosen time → concrete slot →
   create event → confirmation reply.

Guardrails: never fabricate pricing/guarantees; configurable "always escalate"
topics; confidence threshold that routes low-confidence drafts to approve-first
even in autopilot.

---

## Pricing

Anchored below the incumbents, priced on rescued revenue (one saved job pays for
a year).

| Plan | Price | For | Includes |
|---|---|---|---|
| **Free trial** | 14 days | everyone | full product, up to 25 leads |
| **Solo** | **$99/mo** | 1–3 person shop | 1 inbox, unlimited leads, booking, dashboard |
| **Team** | **$249/mo** | growing | 3 inboxes, SMS notifications, integrations, priority |
| Later: **Pro** | $499+/mo | multi-location | multiple calendars, roles, API, phone add-on |

ROI framing everywhere: *"One rescued $600 job pays for 6 months."*

## Onboarding & activation

- **Activation metric:** *first AI reply sent to a real lead within 24h of signup*
  (and ideally first booking within 72h).
- Onboarding is ≤3 minutes and ends on the **replay wow-moment** (Folvra shows what
  it would have said to a real past lead). This is the single most important
  screen — it converts skeptics before we've even gone live.
- Approve-first mode by default for the first 10 leads to build trust, then a
  one-tap "turn on Autopilot."

## Retention & daily habit

- **The morning email:** "While you slept, Folvra handled 3 leads and booked 1
  ($1,900 job). 1 needs your input." Opens the app → daily habit.
- **Dashboard ROI counter:** cumulative "pipeline rescued" and "hours saved" —
  the number that makes cancellation feel insane.
- **Approve/edit loop** teaches Folvra the owner's voice → replies get better →
  owner trusts Autopilot → stickier.

## Growth loops

- **Booked-appointment footer:** every AI reply/confirmation carries a subtle
  "Scheduled with Folvra" — seen by the *customer* (a small business owner-type
  audience) → curiosity → signups. (Toggleable; on by default on free plan.)
- **Referral:** "Give a fellow owner a month free, get a month free." Owners in
  trades talk constantly and refer tools that make them money.
- **ROI share card:** one-tap "I rescued $12,400 in leads this month with Folvra"
  card for Facebook groups / LinkedIn.
- **Marketplace-lead reactivation:** wow existing leads → visible wins → word of
  mouth in local trade groups.

## Customer acquisition (summary; full plan in Phase 7 / doc 04)

Cold email + local walk-ins + trade Facebook groups + Reddit + BNI/referrals.
No paid ads. The demo *is* the pitch: "Forward me one lead email and watch."

---

## Future roadmap (deliberately deferred, NOT built in MVP)

- Phase 2: SMS channel + missed-call text-back (Twilio) → true omni-channel.
- Phase 3: Voice AI receptionist (the crowded frontier — enter once trusted).
- Phase 4: Full CRM sync (Jobber/Housecall Pro/HubSpot), review requests,
  no-show reminders, payment collection, estimate drafting — the back-office
  employee vision. Each is a module on the same "Business Brain."
