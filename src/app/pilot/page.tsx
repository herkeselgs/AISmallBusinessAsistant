import Link from "next/link";
import { ArrowLeft, CalendarClock, Zap } from "lucide-react";
import { PilotForm } from "@/components/pilot-form";
import { FOUNDER_EMAIL } from "@/lib/folvra/contact";

export const metadata = {
  title: "Start your free Folvra pilot",
  description:
    "Get a free 14-day Folvra pilot on your own leads, or book a 5-minute demo. No card, no new software.",
};

export default function PilotPage() {
  const demoMailto = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(
    "Book a 5-minute Folvra demo"
  )}&body=${encodeURIComponent(
    "Hi — I'd like a 5-minute Folvra demo. Here are a couple of times that work for me:\n\n- \n- \n\nBusiness:\nName:\nPhone:\n"
  )}`;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
              <span className="text-lg font-bold leading-none">F</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-ink">Folvra</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-soft">
            <Zap className="h-3.5 w-3.5 text-brand-500" /> Free 14-day pilot
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Put Folvra on your leads for two weeks — free.
          </h1>
          <p className="mt-3 text-pretty text-ink-soft">
            Tell us a bit about your business and we&apos;ll set Folvra up on your real leads within a
            day. It replies in under 60 seconds, follows up, and helps book the estimate — in
            approve-first mode, so nothing goes out without your OK. If it saves you one job, it&apos;s
            paid for itself.
          </p>
          <div className="mt-4">
            <a
              href={demoMailto}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              <CalendarClock className="h-4 w-4 text-brand-600" /> Prefer a quick call first? Book a
              5-minute demo
            </a>
          </div>
        </div>

        <div className="mt-8">
          <PilotForm />
        </div>
      </main>
    </div>
  );
}
