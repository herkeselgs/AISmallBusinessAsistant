# Folvra — the AI employee that follows up with every lead before it goes cold

Live at **https://folvra.com**

Folvra replies to every new lead in **under 60 seconds**, collects the job details,
**follows up** until they respond, and helps book the estimate — 24/7. It works the
leads you already get from your website, Yelp, Angi, Thumbtack, Google, and direct
email (they all send an email notification), replying in the owner's voice.

> **Why this exists:** 78% of customers hire whoever responds first; the average
> business takes 47 hours. Home-service businesses lose $45k–$120k/year to slow
> lead response. Folvra fixes the single most expensive, most daily problem a small
> business has. See [`docs/01-market-research.md`](docs/01-market-research.md).

## What's in this repo

```
docs/                     Strategy: research, product design, YC critique, GTM
src/
  app/
    page.tsx              Landing page (front door + live demo)
    dashboard/            Product tour: the leads inbox (approve-first)
    pilot/                Free-pilot / demo request form (mailto, no DB)
    founder/             Founder outreach console: scripts + localStorage tracker (no nav link)
    yc/                   YC traction tracker (localStorage, no nav link)
    api/demo, api/leads   Endpoints that run the real Folvra engine
  components/             folvra-demo, leads-inbox, pilot-form, founder-console, yc-tracker
  lib/
    anthropic.ts          Claude client + model tiering
    folvra/
      engine.ts           classifyLead / draftReply / handleLead (Claude + mock)
      prompts.ts          The prompts — the actual product
      types.ts            Business Brain, classification, reply schemas (zod)
      workspace.ts        Demo leads board + ROI stats
      availability.ts     Calendar-slot generation
      mock.ts             Deterministic fallback (runs with no API key)
      samples.ts          Demo Business Brain + sample leads
      contact.ts          Founder email for pilot requests
```

## Pages

| Route | What it is |
|---|---|
| `/` | Landing page + live demo |
| `/dashboard` | Product tour — the leads inbox (approve-first) |
| `/pilot` | Free-pilot / 5-min-demo request (builds a prefilled email) |
| `/founder` | **Private** — outreach scripts + tracker (no nav link) |
| `/yc` | **Private** — traction metrics tracker (no nav link) |

## The one exceptional feature

**Instant Lead Response + Booking.** Everything else is deferred. The engine:

1. **Classifies** an inbound message (Haiku) — is it a real lead? intent, service,
   urgency, contact, rough value. Spam and vendors are screened out.
2. **Drafts** a reply (Opus) grounded in the business's "Brain" — in the owner's
   voice, answering the real question, offering 2–3 concrete open times. It never
   invents prices and routes anything sensitive to a human.
3. **Books** the chosen time onto the calendar.

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — see below
npm run dev                    # http://localhost:3000
```

**The demo runs with no API key** (deterministic mock mode) so you can see the
whole experience immediately. To use real Claude, set `ANTHROPIC_API_KEY` in
`.env.local` — the engine automatically switches to live mode.

```bash
npm run build      # production build
npm test           # unit tests (engine logic)
npm run typecheck  # tsc --noEmit
```

## Tech

Next.js 14 (App Router) · TypeScript · Tailwind · Claude
(`claude-opus-4-8` for drafting, `claude-haiku-4-5` for triage) · Vercel-ready.

## Roadmap (deliberately deferred)

The MVP is only the reply-and-book loop. Next, in order: Google OAuth + live
Gmail/Calendar integration & the authenticated dashboard → SMS + missed-call
text-back → voice → full back-office modules (reviews, no-shows, estimates, CRM).
See [`docs/02-product-design.md`](docs/02-product-design.md).

## Deploy

```bash
vercel            # set ANTHROPIC_API_KEY in Vercel project env vars
```
