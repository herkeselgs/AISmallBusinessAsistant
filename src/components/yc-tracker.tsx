"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Metric = { key: string; label: string; target: number; prefix?: string };

const METRICS: Metric[] = [
  { key: "contacted", label: "Businesses contacted", target: 300 },
  { key: "conversations", label: "Real conversations", target: 60 },
  { key: "demos", label: "Demos booked", target: 25 },
  { key: "demos_completed", label: "Demos completed", target: 20 },
  { key: "pilots", label: "Pilots started", target: 10 },
  { key: "paying", label: "Paying customers", target: 3 },
  { key: "leads", label: "Leads processed by Folvra", target: 200 },
  { key: "estimates", label: "Estimates booked", target: 40 },
  { key: "rescued", label: "Pipeline rescued", target: 25000, prefix: "$" },
];

const STORAGE_KEY = "folvra_yc_v1";

type State = {
  values: Record<string, number>;
  testimonials: string;
  quotes: string;
  objections: string;
  productChanges: string;
};
const INITIAL: State = {
  values: Object.fromEntries(METRICS.map((m) => [m.key, 0])),
  testimonials: "",
  quotes: "",
  objections: "",
  productChanges: "",
};

export function YcTracker() {
  const [state, setState] = useState<State>(INITIAL);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...INITIAL, ...parsed, values: { ...INITIAL.values, ...(parsed.values ?? {}) } });
      }
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setValue = (key: string, v: number) =>
    setState((s) => ({ ...s, values: { ...s.values, [key]: v } }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m) => {
          const val = state.values[m.key] ?? 0;
          const pct = Math.min(100, Math.round((val / m.target) * 100));
          return (
            <div key={m.key} className="rounded-xl border border-line bg-white p-4 shadow-card">
              <div className="text-xs text-ink-faint">{m.label}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-ink-faint">{m.prefix}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setValue(m.key, Number(e.target.value) || 0)}
                  className="w-full bg-transparent text-2xl font-bold text-ink outline-none"
                />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={cn("h-full rounded-full", pct >= 100 ? "bg-brand-600" : "bg-brand-400")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-ink-faint">
                target {m.prefix}
                {m.target.toLocaleString()} · {pct}%
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextCard
          label="Testimonials (paste as they come in)"
          value={state.testimonials}
          onChange={(v) => setState((s) => ({ ...s, testimonials: v }))}
          placeholder={"“Folvra booked me a $6k job while I was on a roof.” — Mike, Summit Home Services"}
        />
        <TextCard
          label="Strongest customer quotes (for the YC app)"
          value={state.quotes}
          onChange={(v) => setState((s) => ({ ...s, quotes: v }))}
          placeholder={"The one-liners that make a partner lean in. Keep the best 3 at the top."}
        />
        <TextCard
          label="Biggest objections heard"
          value={state.objections}
          onChange={(v) => setState((s) => ({ ...s, objections: v }))}
          placeholder={"What makes owners hesitate? Tally them — the top one is your next fix."}
        />
        <TextCard
          label="Product changes caused by customer feedback"
          value={state.productChanges}
          onChange={(v) => setState((s) => ({ ...s, productChanges: v }))}
          placeholder={"YC loves 'we heard X, shipped Y in 2 days.' Log every one."}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => copySummary(state)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink-soft transition hover:border-ink-faint/40"
        >
          Copy summary for the YC app
        </button>
        <p className="text-xs text-ink-faint">
          Saved in this browser (localStorage). Update daily; copy the summary before you write the app.
        </p>
      </div>
    </div>
  );
}

function copySummary(s: State) {
  const lines = [
    `FOLVRA — traction summary (${new Date().toISOString().slice(0, 10)})`,
    ``,
    ...METRICS.map((m) => `- ${m.label}: ${m.prefix ?? ""}${(s.values[m.key] ?? 0).toLocaleString()}`),
    ``,
    `Testimonials:`,
    s.testimonials || "—",
    ``,
    `Strongest quotes:`,
    s.quotes || "—",
    ``,
    `Biggest objections:`,
    s.objections || "—",
    ``,
    `Product changes from feedback:`,
    s.productChanges || "—",
  ].join("\n");
  navigator.clipboard?.writeText(lines).catch(() => {
    /* ignore */
  });
}

function TextCard({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-40 w-full resize-y rounded-lg border border-line bg-paper/50 p-3 text-sm text-ink-soft outline-none focus:border-brand-500"
      />
    </div>
  );
}
