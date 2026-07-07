# Otto — the AI employee that never lets a lead go cold

Otto answers every new inbound lead in **under 60 seconds** and books the job on
the owner's calendar — 24/7. Connect one inbox and Otto catches leads from your
website, Yelp, Angi, Thumbtack, Google, and direct email (they all send an email
notification), replies in the owner's voice, and proposes real appointment times.

> **Why this exists:** 78% of customers hire whoever responds first; the average
> business takes 47 hours. Home-service businesses lose $45k–$120k/year to slow
> lead response. Otto fixes the single most expensive, most daily problem a small
> business has. See [`docs/01-market-research.md`](docs/01-market-research.md).

## What's in this repo

```
docs/                     Strategy: research, product design, YC critique, GTM
src/
  app/
    page.tsx              Landing page (the front door + live demo)
    api/demo/route.ts     Demo endpoint — runs the real Otto engine
  components/otto-demo.tsx Interactive "watch Otto handle a lead" widget
  lib/
    anthropic.ts          Claude client + model tiering
    otto/
      engine.ts           classifyLead / draftReply / handleLead (Claude + mock)
      prompts.ts          The prompts — the actual product
      types.ts            Business Brain, classification, reply schemas (zod)
      availability.ts     Calendar-slot generation
      mock.ts             Deterministic fallback (runs with no API key)
      samples.ts          Demo Business Brain + sample leads
```

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
