import {
  ArrowRight,
  Clock,
  Inbox,
  CalendarCheck,
  ShieldCheck,
  Zap,
  PhoneOff,
  Check,
  MessageSquareText,
} from "lucide-react";
import { OttoDemo } from "@/components/otto-demo";

export default function Home() {
  return (
    <div className="relative">
      <Nav />
      <Hero />
      <ProblemStrip />
      <HowItWorks />
      <WhyOtto />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
        <span className="text-lg font-bold leading-none">O</span>
      </div>
      <span className="text-lg font-bold tracking-tight text-ink">Otto</span>
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-ink-soft md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#why" className="hover:text-ink">Why Otto</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
        </nav>
        <a
          href="#demo"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          See it work
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="bg-dotted relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 pb-4 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Your AI employee for the front desk
          </div>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Stop losing jobs to whoever
            <br className="hidden sm:block" /> replied <span className="text-brand-600">first</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-ink-soft">
            <strong className="font-semibold text-ink">78% of customers hire the business that
            answers first</strong> — and the average business takes <strong className="font-semibold text-ink">47 hours</strong>.
            Otto answers every new lead in under 60 seconds and books the job on your calendar. 24/7,
            even while you&apos;re on the job.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#demo"
              className="group flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-base font-semibold text-white shadow-lift transition hover:bg-ink/90"
            >
              Watch Otto handle a lead
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#pricing"
              className="rounded-xl border border-line bg-white px-6 py-3.5 text-base font-semibold text-ink transition hover:border-ink-faint/40"
            >
              See pricing
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Connect your inbox in 2 minutes · No new software to learn · Free for 14 days
          </p>
        </div>

        <div id="demo" className="mt-12 scroll-mt-20 sm:mt-16">
          <OttoDemo />
        </div>
      </div>
    </section>
  );
}

function ProblemStrip() {
  const stats = [
    { icon: PhoneOff, stat: "62%", label: "of contractor calls & inquiries go unanswered" },
    { icon: Clock, stat: "47 hrs", label: "average time a business takes to reply to a lead" },
    { icon: Zap, stat: "391%", label: "higher conversion when you reply within a minute" },
    { icon: Inbox, stat: "$45k+", label: "in lost jobs per year from slow lead response" },
  ];
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 py-10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-3 text-center sm:px-5">
            <s.icon className="mx-auto mb-2 h-5 w-5 text-brand-500" />
            <div className="text-2xl font-bold text-ink sm:text-3xl">{s.stat}</div>
            <div className="mx-auto mt-1 max-w-[16ch] text-xs text-ink-faint">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Inbox,
      title: "Connect your inbox",
      body: "One click with Google. Otto reads your website and recent emails to learn your services, pricing, and voice — then you confirm it in 3 minutes.",
    },
    {
      icon: MessageSquareText,
      title: "Otto answers every lead",
      body: "Website forms, Yelp, Angi, Thumbtack, Google, direct emails — they all hit your inbox, so Otto catches them all. It replies in your voice, in under a minute, day or night.",
    },
    {
      icon: CalendarCheck,
      title: "You wake up to booked jobs",
      body: "Otto offers real open times and books the appointment on your Google Calendar. You approve the first few, then flip on autopilot when you trust it.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-16 bg-paper py-20">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="How it works"
          title="An employee, not another app to babysit"
          sub="Otto lives where your leads already are — your inbox. No migration, no new dashboard your team has to adopt."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-line bg-white p-6 shadow-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Step {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type CellValue = boolean | "sometimes";
function WhyOtto() {
  const rows: { label: string; otto: CellValue; voice: CellValue; dumb: CellValue }[] = [
    { label: "Answers in under 60 seconds, 24/7", otto: true, voice: true, dumb: true },
    { label: "Catches leads from every channel (email, Yelp, Angi, Thumbtack…)", otto: true, voice: false, dumb: false },
    { label: "Actually answers the customer's question", otto: true, voice: "sometimes", dumb: false },
    { label: "Books the appointment on your calendar", otto: true, voice: "sometimes", dumb: false },
    { label: "Sounds like you — not a robot", otto: true, voice: false, dumb: false },
    { label: "You approve replies until you trust it", otto: true, voice: false, dumb: false },
    { label: "Set up in minutes, nothing to learn", otto: true, voice: false, dumb: true },
  ];
  return (
    <section id="why" className="scroll-mt-16 border-y border-line bg-white py-20">
      <div className="mx-auto max-w-5xl px-5">
        <SectionHeading
          eyebrow="Why Otto"
          title="Better than a robotic AI receptionist"
          sub="Voice AI is crowded, expensive, and famously sounds like a robot. Otto wins on the channel that actually books jobs — and does it in your voice."
        />
        <div className="mt-12 overflow-x-auto scroll-slim">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-3 pr-4 font-medium text-ink-faint">&nbsp;</th>
                <th className="pb-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 font-bold text-white">
                    Otto
                  </span>
                </th>
                <th className="pb-3 px-3 text-center font-semibold text-ink-soft">Voice AI receptionists</th>
                <th className="pb-3 px-3 text-center font-semibold text-ink-soft">Basic autoresponders</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="py-3 pr-4 text-ink-soft">{r.label}</td>
                  <td className="px-3 py-3 text-center"><Cell v={r.otto} strong /></td>
                  <td className="px-3 py-3 text-center"><Cell v={r.voice} /></td>
                  <td className="px-3 py-3 text-center"><Cell v={r.dumb} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Cell({ v, strong }: { v: CellValue; strong?: boolean }) {
  if (v === true)
    return (
      <span
        className={
          strong
            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white"
            : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        }
      >
        <Check className="h-4 w-4" />
      </span>
    );
  if (v === "sometimes")
    return <span className="text-xs font-medium text-amber-500">partial</span>;
  return <span className="text-ink-faint/50">—</span>;
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-paper py-20">
      <div className="mx-auto max-w-5xl px-5">
        <SectionHeading
          eyebrow="Pricing"
          title="One rescued job pays for months"
          sub="A single $600 job you would have lost covers half a year of Otto. Start free — no card required."
        />
        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          <PriceCard
            name="Solo"
            price="$99"
            tagline="For 1–3 person shops"
            features={[
              "1 connected inbox",
              "Unlimited leads answered",
              "Books to your Google Calendar",
              "Approve-first + autopilot modes",
              "Daily 'what Otto handled' recap",
            ]}
          />
          <PriceCard
            name="Team"
            price="$249"
            tagline="For growing crews"
            highlight
            features={[
              "Everything in Solo",
              "Up to 3 inboxes",
              "SMS alerts on hot leads",
              "Lead + pipeline dashboard",
              "Priority support",
            ]}
          />
        </div>
        <p className="mt-6 text-center text-sm text-ink-faint">
          14-day free trial · Cancel anytime · Setup help included
        </p>
      </div>
    </section>
  );
}

function PriceCard({
  name,
  price,
  tagline,
  features,
  highlight,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "relative rounded-2xl border p-6 " +
        (highlight
          ? "border-brand-500 bg-white shadow-lift ring-1 ring-brand-500"
          : "border-line bg-white shadow-card")
      }
    >
      {highlight && (
        <div className="absolute -top-3 left-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          Most popular
        </div>
      )}
      <div className="text-sm font-semibold text-ink">{name}</div>
      <div className="mt-1 text-xs text-ink-faint">{tagline}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-ink">{price}</span>
        <span className="text-sm text-ink-faint">/mo</span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href="#demo"
        className={
          "mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition " +
          (highlight
            ? "bg-ink text-white hover:bg-ink/90"
            : "border border-line text-ink hover:border-ink-faint/40")
        }
      >
        Start free
      </a>
    </div>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Will it send emails to my customers without me seeing them?",
      a: "Not unless you let it. Otto starts in approve-first mode: it drafts the reply and you tap send. Once you've seen the quality on your own leads, flip on autopilot — and even then, Otto routes anything sensitive or uncertain to you first.",
    },
    {
      q: "What if it makes up a price or says something wrong?",
      a: "Otto only uses the facts in your Business Brain and never invents prices, guarantees, or scope it wasn't given. Ambiguous or high-stakes messages (complaints, legal, edge cases) are automatically handed to you.",
    },
    {
      q: "My leads come from Angi / Thumbtack / my website, not just email.",
      a: "That's the point. Almost every one of those platforms sends an email notification — so by connecting one inbox, Otto sees and responds to leads from all of them, in one place.",
    },
    {
      q: "How long does setup take?",
      a: "About 3 minutes. Connect Google, Otto drafts your Business Brain from your site and inbox, you confirm a few details and your availability. Then it shows you what it would have said to a real past lead.",
    },
    {
      q: "Do you do phone calls too?",
      a: "Not yet — and on purpose. Voice is where every competitor is fighting and where AI most often sounds robotic. Otto wins first on text and email, where quality is achievable today. Voice is on the roadmap.",
    },
  ];
  return (
    <section className="border-t border-line bg-white py-20">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading eyebrow="FAQ" title="The questions owners actually ask" />
        <div className="mt-10 divide-y divide-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-semibold text-ink">{f.q}</span>
                <span className="text-ink-faint transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-ink py-20 text-center">
      <div className="mx-auto max-w-2xl px-5">
        <ShieldCheck className="mx-auto mb-5 h-9 w-9 text-brand-400" />
        <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Every cold lead is a job someone else booked.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/70">
          Otto makes sure the answer is always &quot;we replied first.&quot; See it work on your own
          inbox in the next 5 minutes.
        </p>
        <a
          href="#demo"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-white/90"
        >
          Try Otto free <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-paper py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
        <Logo />
        <p className="text-xs text-ink-faint">
          © {new Date().getFullYear()} Otto. The AI employee that never lets a lead go cold.
        </p>
        <div className="flex gap-5 text-xs text-ink-faint">
          <a href="#" className="hover:text-ink">Privacy</a>
          <a href="#" className="hover:text-ink">Terms</a>
          <a href="mailto:hello@hireotto.example" className="hover:text-ink">Contact</a>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-600">
        {eyebrow}
      </div>
      <h2 className="text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-xl text-pretty text-ink-soft">{sub}</p>}
    </div>
  );
}
