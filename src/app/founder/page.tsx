import Link from "next/link";
import { CopyBlock, FounderConsole } from "@/components/founder-console";

export const metadata = {
  title: "Folvra — Founder Console",
  robots: { index: false, follow: false },
};

const CALL = `Hi {FirstName}, this is {YourName} — I'll be quick, 20 seconds.

I help {trade} businesses with the one thing that quietly loses them jobs: slow follow-up on new leads. When someone messages you at 2pm and you're on a job, by the time you get back to them they've already booked someone else.

I built Folvra — an AI that replies to every new lead in under a minute, follows up until they answer, and helps book the estimate. Sits on your existing inbox, so it catches website, Yelp, Angi, and Thumbtack leads too.

Can I show you what it'd say to one of YOUR actual leads? Takes five minutes, and the pilot's free — if it saves you one job in two weeks, you keep it. Fair?`;

const EMAIL1 = `Subject: the lead you missed last night

Hi {FirstName},

Quick question — when someone fills out your site form or messages you on Angi at 9pm, how fast do they hear back?

78% of customers hire whoever replies first, and most contractors take hours (you're on a job, not at a desk). That lead just books your competitor.

I built Folvra — an AI employee that replies to every new lead in under a minute, follows up until they respond, and helps book the estimate. It works off your existing inbox, so it catches website, Yelp, Angi, and Thumbtack leads too.

Want me to run it on one of your own past leads so you can see exactly what it'd say? 5 minutes, no setup.

— {YourName}
folvra.com`;

const EMAIL2 = `Subject: re: the lead you missed

{FirstName} — 40-second version: Folvra reads a new lead, replies in your voice, follows up if they go quiet, and gets the estimate booked. See it: https://folvra.com

Forward me one of your lead emails and I'll show you what Folvra would've sent back — on your business, not a demo.

— {YourName}`;

const EMAIL3 = `Subject: should I close this out?

No worries if the timing's off, {FirstName}. Last thing: even one saved job a month more than covers it.

Reply "show me" and I'll set you up with a free 14-day pilot on your own leads — nothing goes out without your OK.

— {YourName}`;

const SMS = `Hey {FirstName} — saw you run {Company}. Quick q: when an after-hours website/Angi lead comes in while you're on a job, how's it handled?

I built a tool that auto-replies to every new lead in under 60s and follows up until they book. Happy to run it on one of your real leads so you can see it — no pitch. Worth a look? https://folvra.com`;

const DEMO = `FOLVRA 5-MINUTE DEMO

1. Hook (30s): "Whoever follows up with a new lead first usually wins the job — 78% of the time. Most contractors take hours because they're on a job. Let's race that." Ask for one real (or typical) lead they get.

2. The replay (2m): Open folvra.com, paste their lead into the demo. Folvra reads it → shows what it detected (job type? urgency?) → writes the reply in the owner's voice → offers times → moves it toward booked. Say: "That's what your customer would've gotten at 11pm — in 40 seconds, not 4 hours. And if they go quiet, Folvra follows up so it doesn't get forgotten."

3. The screen (30s): Run the "Vendor spam" sample. "It's not a dumb autoresponder — it won't email your customers junk or reply to spammers."

4. Control (30s): Open folvra.com/dashboard → show Approve-first. "You approve the first few. When you trust it, one tap flips on autopilot. Anything sensitive, it hands to you."

5. The math (30s): "What's an average job worth to you? … One saved job pays for half a year. Want me to set it up on your real leads?"

6. Close (30s): "Free 14-day pilot. If it books you even one job, you keep it. I can have it live tomorrow. Fair?"`;

const OBJECTIONS = `OBJECTION HANDLING

"I answer my own calls / leads."
→ "Totally — this is for the ones you can't get to: after-hours, on a roof, in the truck. That's where the leaks are. Folvra just makes sure none of those wait hours."

"I already use Jobber / Housecall Pro."
→ "Keep it — Folvra sits on your inbox and makes sure every lead gets a fast reply and a follow-up. It hands the booked job right back to you."

"Does it sound like a robot?"
→ "That's exactly why it's text/email, not a phone robot. Let me show you a reply on your own lead — you tell me if it sounds like you."

"Will it email my customers without me seeing it?"
→ "No — it starts in approve-first mode. It drafts, you tap send. You turn on autopilot only when you trust it."

"I don't have time to set it up."
→ "That's on me. Send me one lead email and I'll have it running on your inbox tomorrow. The pilot's free."

"Send me some info."
→ "Happy to — but it lands better in 5 minutes on your own lead than in a PDF. Got your phone? I'll text you the link and we watch it together right now."`;

const FOLLOWUP = `FOLLOW-UP AFTER A DEMO

Hi {FirstName} — great talking. As promised, here's your free Folvra pilot set up for {Company}.

It's in approve-first mode, so nothing goes to your customers without your OK. Try it on this week's leads — if it saves you a job, it's paid for itself six times over.

I'll check in Friday. Reply here anytime if a lead comes in you want me to look at.

— {YourName}`;

const PILOT_ONBOARDING = `PILOT ONBOARDING MESSAGE

Welcome aboard, {FirstName} — here's how your Folvra pilot works:

1. Folvra is now watching your leads. Every new one gets a reply drafted in under 60 seconds.
2. You're in APPROVE-FIRST mode: I'll send you each draft; you reply "send" or tweak it. Nothing goes out without you.
3. After a few days, when the replies look right, we flip on autopilot — Folvra sends and follows up on its own, and only pings you for anything sensitive.
4. Your only job this week: forward me any lead you want handled, and tell me when a reply feels off so it learns your voice.

Goal for 14 days: never let a lead sit unanswered, and book at least one job you'd otherwise have lost. Let's go.`;

const LIST = `HOW TO BUILD YOUR 30 (≈15 MIN)

Priority rule: businesses already PAYING for leads feel this pain most. Target them first — anyone running Google Ads, or listed on Angi / Thumbtack / Yelp.

Fill 6 per segment (edit the tracker below):
• Remodelers / GCs — Google Maps: "kitchen remodeler {city}", "bathroom remodeler {city}"
• HVAC — "HVAC repair {city}" (note the "Sponsored" results = paying for leads)
• Roofing — "roofing contractor {city}" + check Angi
• Plumbing / Electrical — "plumber {city}", "electrician {city}"
• Landscaping / Decks / Painters — "deck builder {city}", "landscaping {city}", "painter {city}"

For each: grab business name, owner first name (from reviews / "About"), phone, and website contact form. Flag anyone marked "Sponsored" or on Angi/Thumbtack → CALL THOSE FIRST.

Then work the list: call during business hours (call script), email/DM the rest.`;

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <span className="text-lg font-bold leading-none">F</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">Folvra — Founder Console</span>
          </div>
          <div className="flex gap-4 text-sm text-ink-soft">
            <Link href="/dashboard" className="hover:text-ink">Product</Link>
            <Link href="/yc" className="hover:text-ink">YC tracker</Link>
            <Link href="/pilot" className="hover:text-ink">Pilot page</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Morning plan */}
        <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
          <h2 className="text-lg font-bold text-ink">Your first 2 hours tomorrow</h2>
          <ol className="mt-3 space-y-1.5 text-sm text-ink-soft">
            <li><strong>0:00–0:15</strong> — Build your 30-business list (see the &quot;Build your 30&quot; script below). Fill the tracker.</li>
            <li><strong>0:15–0:20</strong> — Open folvra.com and folvra.com/dashboard in tabs; do one practice run of the demo out loud.</li>
            <li><strong>0:20–1:20</strong> — Call the "already paying for leads" ones first (Sponsored / Angi / Thumbtack). Use the call script. Aim: 20+ dials, book 2–3 demos.</li>
            <li><strong>1:20–2:00</strong> — Email + text everyone you couldn&apos;t reach (Email 1 + SMS). Log every touch in the tracker.</li>
          </ol>
          <p className="mt-3 text-sm text-ink-soft">
            Target for the day: <strong>30 contacted, 3 demos booked, 1 pilot started.</strong> Track
            it here and on the <Link href="/yc" className="font-semibold underline">YC tracker</Link>.
          </p>
        </section>

        {/* Tracker */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink">Outreach tracker</h2>
          <FounderConsole />
        </section>

        {/* Scripts */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">Scripts</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <CopyBlock title="Cold call (30 sec)" text={CALL} />
            <CopyBlock title="SMS / DM" text={SMS} />
            <CopyBlock title="Cold email 1 — the miss" text={EMAIL1} />
            <CopyBlock title="Cold email 2 — proof (+2 days)" text={EMAIL2} />
            <CopyBlock title="Cold email 3 — breakup (+4 days)" text={EMAIL3} />
            <CopyBlock title="Follow-up after a demo" text={FOLLOWUP} />
            <CopyBlock title="5-minute demo script" text={DEMO} />
            <CopyBlock title="Objection handling" text={OBJECTIONS} />
            <CopyBlock title="Pilot onboarding message" text={PILOT_ONBOARDING} />
            <CopyBlock title="Build your 30 (list-building)" text={LIST} />
          </div>
        </section>
      </main>
    </div>
  );
}
