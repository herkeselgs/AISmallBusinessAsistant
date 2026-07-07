# Phase 1 — Market Research & Opportunity Selection

_Last updated: 2026-07-07_

## How this research was done

Searches across small-business / trades / services complaints and industry data
(home services, dental, med spa, law, salon), plus the AI-receptionist and
answering-service competitive landscape. Rather than chase flashy ideas, the
filter was blunt: **problems that occur daily, cost real money, cause stress,
already have people paying to solve them, and cannot be solved by ChatGPT alone.**

Key grounded facts that shaped the conclusion:

- **78% of customers buy from the business that responds first.** The average
  business takes **47 hours** to respond to a new lead. Respond within 5 minutes
  and you are **21× more likely to qualify** the lead; within 1 minute lifts
  conversion **~391%**. (Multiple 2026 speed-to-lead studies.)
- **62% of contractor calls go unanswered** (owner is on a job). **85% of callers
  who don't get through never call back**; **78% won't leave a voicemail** — they
  call the next name on the list. Home-service businesses lose an estimated
  **$45k–$120k/year** to this. (DeanTek, StreetLight, Downtime Digital, 2026.)
- **Nearly every inbound lead channel emails a notification** — website contact
  forms, Yelp, Angi, Thumbtack, Google Business, Facebook lead forms, Housecall
  Pro/Jobber web leads. This is the wedge (see below).
- Dental no-shows cost the average practice **$105k–$240k/year**; front desks
  spend **2–4 hrs/week** on reschedule phone-tag. Automated reminders cut no-shows
  **23–50%**. SMS open rate **98%** vs email **21%**.
- The AI-receptionist market is **real and paying** ($99–$299/mo typical, up to
  $899) but **crowded on voice**: CallBird, NextPhone, Ruby, Smith.ai,
  AnswerConnect, MyAIFrontDesk, Ringly, GoHighLevel, plus legacy answering
  services. Voice is also the *hardest* thing to build well (telephony, latency,
  turn-taking) — a poor place for a solo founder to win in 3 weeks.

---

## Top 30 recurring problems (ranked by weighted score)

### Scoring framework

Each problem scored 1–10 on seven weighted criteria (weights sum to 100%):

| Criterion | Weight | What it measures |
|---|---|---|
| **Pain / urgency** | 20% | Daily? Stressful? Actively losing money right now? |
| **Willingness to pay / ROI** | 20% | Clear, attributable dollar return; already a budget line |
| **AI-automatable now** | 15% | Can today's LLMs actually do it to a customer-facing bar |
| **Buildability (solo, 3 wks)** | 13% | Inverse of integration/technical difficulty |
| **Time-to-value** | 10% | How fast a new user feels the "wow" |
| **Defensibility vs ChatGPT** | 10% | Needs integration/workflow, not a copy-paste prompt |
| **Market size** | 12% | # of businesses × realistic ACV |

`Weighted score = Σ(criterion × weight)`, out of 10.

### Ranked table (top 30)

| # | Problem | Pain | WTP | AI | Build | TTV | Defens. | Mkt | **Score** |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Slow/no response to inbound leads (speed-to-lead) + booking** | 10 | 10 | 9 | 8 | 9 | 8 | 9 | **9.05** |
| 2 | Missed-call → instant text-back + booking | 10 | 9 | 8 | 5 | 8 | 7 | 9 | 8.05 |
| 3 | Answering the same FAQs from customers all day | 8 | 7 | 9 | 8 | 9 | 6 | 9 | 7.90 |
| 4 | Appointment no-shows (reminders + easy reschedule) | 8 | 9 | 8 | 6 | 7 | 6 | 8 | 7.55 |
| 5 | Following up with quotes/estimates that go quiet | 9 | 8 | 8 | 7 | 6 | 7 | 7 | 7.60 |
| 6 | After-hours / weekend lead capture | 9 | 8 | 8 | 7 | 8 | 6 | 8 | 7.75 |
| 7 | Asking happy customers for reviews (reputation) | 7 | 8 | 8 | 8 | 7 | 5 | 8 | 7.30 |
| 8 | Appointment scheduling back-and-forth ("what times work?") | 8 | 7 | 9 | 7 | 8 | 6 | 8 | 7.55 |
| 9 | Chasing unpaid invoices / payment reminders | 8 | 8 | 7 | 6 | 6 | 6 | 7 | 7.00 |
| 10 | Creating quotes/estimates from a request | 8 | 8 | 6 | 5 | 5 | 7 | 7 | 6.70 |
| 11 | Re-engaging old/dead leads (database reactivation) | 7 | 8 | 8 | 7 | 6 | 6 | 7 | 7.05 |
| 12 | Writing/sending invoices | 6 | 6 | 6 | 6 | 6 | 4 | 7 | 5.85 |
| 13 | Summarizing phone calls / logging to CRM | 6 | 6 | 8 | 5 | 6 | 7 | 6 | 6.25 |
| 14 | Updating the CRM after every interaction | 6 | 6 | 8 | 5 | 5 | 7 | 6 | 6.10 |
| 15 | Triaging & sorting the inbox | 6 | 5 | 8 | 7 | 7 | 5 | 7 | 6.35 |
| 16 | Intake forms / new-client onboarding paperwork | 6 | 6 | 7 | 5 | 5 | 6 | 6 | 5.90 |
| 17 | Drafting routine customer emails | 6 | 5 | 9 | 8 | 7 | 4 | 7 | 6.45 |
| 18 | Rescheduling / cancellation handling | 7 | 6 | 8 | 5 | 6 | 6 | 6 | 6.30 |
| 19 | Collecting & organizing job photos/docs | 5 | 5 | 5 | 5 | 5 | 5 | 6 | 5.10 |
| 20 | Appointment reminders (basic SMS/email) | 6 | 7 | 7 | 7 | 7 | 3 | 7 | 6.15 |
| 21 | Social media posting / content | 5 | 5 | 8 | 7 | 6 | 3 | 7 | 5.75 |
| 22 | Bookkeeping / expense categorization | 7 | 7 | 6 | 3 | 4 | 6 | 7 | 5.75 |
| 23 | Insurance verification (dental/med) | 8 | 8 | 5 | 2 | 4 | 7 | 6 | 5.75 |
| 24 | Drafting contracts/proposals | 6 | 6 | 7 | 5 | 5 | 5 | 6 | 5.75 |
| 25 | Call routing / phone tree | 6 | 6 | 6 | 3 | 6 | 5 | 6 | 5.35 |
| 26 | Warranty / service-plan renewals | 6 | 6 | 6 | 5 | 5 | 5 | 5 | 5.50 |
| 27 | Payroll / scheduling staff | 6 | 6 | 5 | 3 | 4 | 5 | 6 | 4.95 |
| 28 | Ordering / inventory reminders | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 4.90 |
| 29 | Translating customer comms | 4 | 4 | 9 | 8 | 6 | 3 | 5 | 5.30 |
| 30 | Generating marketing/ad copy | 4 | 4 | 8 | 8 | 6 | 2 | 6 | 5.20 |

> Note: several near-neighbors (2, 6, 8) are **components of #1** rather than
> separate products. #1 is the umbrella that captures their value.

---

## Winner: #1 — Instant lead response + booking ("the AI that never lets a lead go cold")

### Why this wins

1. **It's the most expensive, most painful, most daily problem** with the
   clearest dollar ROI. Every missed/slow lead is a lost job the owner can name a
   number for ($500–$8,000+). "You lost that job because you were on a roof and
   couldn't reply for three hours" is visceral. That makes it *sell itself*.

2. **Willingness to pay is already proven.** Businesses pay $99–$299/mo for
   answering services and AI receptionists *today*. The budget line exists — we
   just have to be the best value in it.

3. **The wedge nobody has nailed: one inbox = every lead channel.** Website forms,
   Yelp, Angi, Thumbtack, Google Business, Facebook, Housecall Pro/Jobber leads —
   **they all send an email notification.** Connect one Gmail inbox and the AI
   employee can see and respond to *nearly every inbound lead*, instantly, 24/7 —
   without building telephony, without a widget on every platform, without asking
   the owner to change how they get leads. This is a 2-minute setup with an
   enormous surface area.

4. **We avoid the bloody part of the market.** The crowd is on *voice*. Voice is
   the hardest thing to build and the easiest to do badly ("sounds robotic" is the
   #1 churn complaint). We start on **text/email + booking**, where quality is
   achievable *today* and where the incumbents are weakest. Voice becomes a later
   add-on, not the wedge.

5. **AI can genuinely do it well now,** and it is **not** replicable with ChatGPT
   alone — it requires live inbox monitoring, calendar availability, booking
   actions, and a per-business knowledge base. That's a real product, not a prompt.

6. **Time-to-value is minutes.** Connect Google → the AI reads recent threads and
   the website to learn the business → next real lead gets a perfect instant reply
   and a booked appointment. The "holy shit" moment happens on day one, often on
   the owner's *own* inbox during onboarding (we can replay a past missed lead and
   show what the AI *would* have said).

### Why not the runners-up

- **Missed-call text-back / voice (#2):** same value, 3× the build cost
  (telephony, number provisioning, latency), and the most crowded, most
  commoditized slice. We'll layer a phone number on later; not the wedge.
- **No-show reminders (#4):** great problem, but it *protects* existing revenue
  (less thrilling than *winning new* revenue), leans on deep PMS/EHR integrations
  (Dentrix, Open Dental) that are slow to build, and is more commoditized.
- **Estimates/invoicing (#10/#12):** lower urgency, no "lose it forever in 5
  minutes" clock, weaker emotional pull.

### The one-line product

> **Otto — the AI employee that answers every new lead in under 60 seconds and
> books the job on your calendar, 24/7.** Connect your inbox, and stop losing
> jobs to whoever replied first.

Working name **"Otto"** (evokes *auto* + reads like a teammate's name). Renameable.

### Beachhead customer

**Home-service businesses with 1–15 employees that live and die on inbound leads**
— remodelers, HVAC, plumbers, electricians, roofers, landscapers, cleaners,
movers, painters. Secondary: med spas, dental, salons, small law/accounting firms
(same "reply fast or lose the booking" dynamic). Start with home services because
the pain is sharpest, the ROI math is trivial, and they're reachable via cold
email/local outreach.

**Decision:** Build the Instant Lead Response + Booking employee. Proceed to
Phase 2.

---

### Sources
- DeanTek — "Why contractors lose $3,800/month in missed calls"
- StreetLight Local — "Missed Calls Are Costing You Jobs"
- Downtime Digital — "Missed Call Text Back for Contractors"
- Casey Response / LeadResponse / Kixie / Chili Piper — Speed-to-Lead statistics 2026
- Franchise Chatter — "2026 Home Services Lead Handling Study"
- Denzif / TensorLinks / Clerri — Dental no-show cost data 2026
- CallBird / NextPhone / AgentZap / Ringly — AI receptionist pricing 2025–2026
- Nextiva / Cira — After-hours answering services for small business
