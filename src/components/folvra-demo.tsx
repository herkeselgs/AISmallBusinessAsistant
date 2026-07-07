"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Loader2,
  Mail,
  Sparkles,
  Zap,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HandleResult, InboundMessage } from "@/lib/folvra/types";

const SAMPLES = [
  { id: "hvac", label: "HVAC emergency", sub: "website form · 10:52 PM" },
  { id: "roofing", label: "Roofing estimate", sub: "Angi lead · 7:41 AM" },
  { id: "bathroom", label: "Bathroom remodel", sub: "direct email · 6:15 AM" },
  { id: "landscaping", label: "Landscaping quote", sub: "Thumbtack · 8:24 PM" },
  { id: "cleaning", label: "Cleaning inquiry", sub: "direct email · 1:07 PM" },
  { id: "spam", label: "Vendor spam", sub: "watch Folvra skip it" },
];

type ApiResponse = {
  message: InboundMessage;
  result: HandleResult;
  business: string;
};

export function FolvraDemo() {
  const [activeId, setActiveId] = useState<string>("hvac");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(payload: { leadId?: string; body?: string }) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5 md:grid-cols-[300px_1fr]">
        {/* Left: pick a lead */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <Mail className="h-3.5 w-3.5" /> A new lead just landed
          </div>
          <div className="flex flex-col gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveId(s.id);
                  setCustom("");
                  run({ leadId: s.id });
                }}
                className={cn(
                  "group rounded-xl border px-3.5 py-2.5 text-left transition-all",
                  activeId === s.id && !custom
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-line bg-paper hover:border-ink-faint/40 hover:bg-white"
                )}
              >
                <div className="text-sm font-semibold text-ink">{s.label}</div>
                <div className="text-xs text-ink-faint">{s.sub}</div>
              </button>
            ))}
          </div>

          <div className="mt-1 border-t border-line pt-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              …or paste a real lead email
            </label>
            <textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Paste an inquiry from your own inbox…"
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-brand-500"
            />
            <button
              disabled={loading || custom.trim().length < 8}
              onClick={() => {
                setActiveId("");
                run({ body: custom });
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Run Folvra on it <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Folvra's work */}
        <div className="min-h-[420px] rounded-xl border border-line bg-paper/60 p-4 sm:p-5">
          {loading && <LoadingState />}
          {!loading && error && (
            <div className="flex h-full items-center justify-center text-sm text-ink-faint">
              {error}
            </div>
          )}
          {!loading && !error && !data && <EmptyState />}
          {!loading && !error && data && <ResultView data={data} />}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        This is the real engine. In your pilot, Folvra works your actual leads — replies, follows up,
        and helps book the estimate.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="max-w-xs text-sm text-ink-faint">
        Pick a lead on the left. Watch Folvra read it, reply in the owner&apos;s voice, and offer real
        appointment times — in seconds.
      </p>
    </div>
  );
}

function LoadingState() {
  const lines = [
    "Reading the message…",
    "Checking if it's a real lead…",
    "Pulling open times from the calendar…",
    "Writing a reply in the owner's voice…",
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {lines.map((l, i) => (
        <div
          key={l}
          className="flex items-center gap-2.5 text-sm text-ink-soft animate-fade-up"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
          {l}
        </div>
      ))}
    </div>
  );
}

function ResultView({ data }: { data: ApiResponse }) {
  const { message, result } = data;
  const c = result.classification;

  if (!c.isLead) {
    return (
      <div className="flex h-full flex-col justify-center gap-4 animate-fade-up">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-soft">
          <ShieldCheck className="h-3.5 w-3.5" /> Folvra screened this
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <div className="font-semibold text-ink">Skipped — not a customer lead</div>
            <p className="mt-1 text-sm text-ink-faint">{c.summary}</p>
            <p className="mt-2 text-sm text-ink-soft">
              A dumb autoresponder would&apos;ve emailed this spammer back. Folvra knows the difference,
              so your customers only ever get real replies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Speed banner */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 animate-fade-up"
      >
        <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
          <Zap className="h-4 w-4" /> Folvra responded instantly
        </div>
        <div className="text-xs text-ink-faint">
          Industry average: <span className="line-through">47 hours</span>
        </div>
      </div>

      {/* Detected */}
      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <StepLabel n={1} text="Lead detected & understood" />
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Fact label="Name" value={c.contactName ?? "—"} />
          <Fact label="Wants" value={c.service ?? "General"} />
          <Fact label="Urgency" value={cap(c.urgency ?? "medium")} highlight={c.urgency === "high"} />
          <Fact
            label="Est. value"
            value={c.estValueUsd ? `$${c.estValueUsd.toLocaleString()}` : "—"}
          />
        </div>
      </div>

      {/* Reply */}
      {result.draft && (
        <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <StepLabel n={2} text="Folvra's reply — in the owner's voice" />
          <div className="mt-2 rounded-xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-line px-4 py-2 text-xs text-ink-faint">
              <span>
                To: <span className="text-ink-soft">{message.from}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-brand-600">
                <Check className="h-3.5 w-3.5" /> sent
              </span>
            </div>
            <p className="whitespace-pre-line px-4 py-3 text-sm leading-relaxed text-ink-soft">
              {result.draft.reply}
            </p>
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            You approve or edit before it sends — or let Folvra run on autopilot.
          </p>
        </div>
      )}

      {/* Booking */}
      {result.draft && result.draft.offeredSlots.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <StepLabel n={3} text="Toward a booked estimate — with follow-up" />
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-brand-200 bg-white p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold text-ink">
                {c.contactName ?? "New lead"} — {c.service ?? "estimate"}
              </div>
              <div className="text-ink-faint">
                Folvra offered {result.draft.offeredSlots.length} open times. If they go quiet, it
                follows up automatically until the estimate is booked.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] text-white">
        {n}
      </span>
      {text}
    </div>
  );
}

function Fact({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div
        className={cn(
          "truncate text-sm font-semibold",
          highlight ? "text-amber-500" : "text-ink"
        )}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
