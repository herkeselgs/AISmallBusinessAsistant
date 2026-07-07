"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOUNDER_EMAIL } from "@/lib/folvra/contact";

type Fields = {
  business: string;
  owner: string;
  phone: string;
  email: string;
  industry: string;
  website: string;
  currentHandling: string;
  biggestProblem: string;
};

const EMPTY: Fields = {
  business: "",
  owner: "",
  phone: "",
  email: "",
  industry: "",
  website: "",
  currentHandling: "",
  biggestProblem: "",
};

const INDUSTRIES = [
  "Remodeling / General contractor",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping / Lawn",
  "Painting",
  "Cleaning",
  "Med spa / Aesthetics",
  "Dental",
  "Law firm",
  "Other home / local service",
];

const HANDLING = [
  "I answer leads myself when I can",
  "Whoever's free grabs it",
  "An office manager / receptionist",
  "An answering service",
  "They mostly sit until end of day",
  "Honestly, a lot slip through",
];

export function PilotForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const valid = f.business.trim() && f.owner.trim() && (f.email.trim() || f.phone.trim());

  const message = useMemo(() => buildMessage(f), [f]);

  const subject = `Folvra pilot request — ${f.business || "new business"}`;
  const mailto = `mailto:${FOUNDER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    message
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the textarea below is selectable as a fallback */
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      {/* Form */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Business name" required>
            <input className={inputCls} value={f.business} onChange={set("business")} placeholder="Summit Remodeling" />
          </Field>
          <Field label="Your name" required>
            <input className={inputCls} value={f.owner} onChange={set("owner")} placeholder="Mike Sanchez" />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="(303) 555-0142" />
          </Field>
          <Field label="Email">
            <input className={inputCls} value={f.email} onChange={set("email")} placeholder="mike@summit.com" />
          </Field>
          <Field label="Industry">
            <select className={inputCls} value={f.industry} onChange={set("industry")}>
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </Field>
          <Field label="Website">
            <input className={inputCls} value={f.website} onChange={set("website")} placeholder="summitremodeling.com" />
          </Field>
          <Field label="How do you handle new leads today?" full>
            <select className={inputCls} value={f.currentHandling} onChange={set("currentHandling")}>
              <option value="">Select…</option>
              {HANDLING.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </Field>
          <Field label="Biggest lead / follow-up problem?" full>
            <textarea
              className={cn(inputCls, "min-h-[80px] resize-y")}
              value={f.biggestProblem}
              onChange={set("biggestProblem")}
              placeholder="e.g. I'm on jobs all day and miss leads that come in after hours — they book someone else."
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            href={valid ? mailto : undefined}
            aria-disabled={!valid}
            onClick={(e) => {
              if (!valid) e.preventDefault();
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition",
              valid
                ? "bg-ink text-white hover:bg-ink/90"
                : "cursor-not-allowed bg-ink/30 text-white"
            )}
          >
            <Mail className="h-4 w-4" /> Send my pilot request
          </a>
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink-faint/40"
          >
            {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy message"}
          </button>
        </div>
        {!valid && (
          <p className="mt-2 text-xs text-ink-faint">
            Add your business name, your name, and an email or phone to continue.
          </p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5" /> No account, no card. We reply within one business
          day to set up your pilot.
        </p>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-line bg-paper/60 p-5 sm:p-6">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Your request preview
        </div>
        <textarea
          readOnly
          value={message}
          className="h-[360px] w-full resize-none rounded-xl border border-line bg-white p-3 text-xs leading-relaxed text-ink-soft scroll-slim"
        />
        <p className="mt-2 text-xs text-ink-faint">
          &quot;Send my pilot request&quot; opens your email app with this filled in. Or copy it and
          send it however you like.
        </p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-brand-500";

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1 block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </span>
      {children}
    </label>
  );
}

function buildMessage(f: Fields): string {
  const line = (k: string, v: string) => (v.trim() ? `${k}: ${v.trim()}` : `${k}: —`);
  return [
    `Hi — I'd like to try the free 14-day Folvra pilot.`,
    ``,
    line("Business", f.business),
    line("Owner", f.owner),
    line("Phone", f.phone),
    line("Email", f.email),
    line("Industry", f.industry),
    line("Website", f.website),
    line("How we handle leads today", f.currentHandling),
    ``,
    `Biggest lead / follow-up problem:`,
    f.biggestProblem.trim() || "—",
    ``,
    `Sent from folvra.com`,
  ].join("\n");
}
