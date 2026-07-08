"use client";

import { useState } from "react";
import { ArrowRight, TrendingDown } from "lucide-react";

/**
 * "What slow lead follow-up is costing you" — a concrete, conservative money
 * estimate for cold traffic. No backend; pure client math. Clearly labelled as
 * an estimate; never over-claims.
 */
function money(n: number): string {
  return "$" + Math.round(n).toLocaleString();
}

export function RoiCalculator() {
  const [jobValue, setJobValue] = useState(500);
  const [leads, setLeads] = useState(40);
  const [missPct, setMissPct] = useState(30);
  const [closeRate, setCloseRate] = useState(40);

  const missedLeads = leads * (missPct / 100);
  const jobsLost = missedLeads * (closeRate / 100);
  const perMonth = jobsLost * jobValue;
  const perYear = perMonth * 12;
  const paysForItself = perMonth > 99;

  return (
    <section className="bg-paper py-20">
      <div className="mx-auto max-w-4xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-600">
            The cost of slow follow-up
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            How much are missed leads costing you?
          </h2>
          <p className="mx-auto mt-3 text-pretty text-ink-soft">
            A quick, conservative estimate. Slide your numbers.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-[1fr_0.9fr]">
          {/* Inputs */}
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
            <Slider label="Average job value" value={jobValue} min={150} max={5000} step={50} suffix={money(jobValue)} onChange={setJobValue} />
            <Slider label="New leads per month" value={leads} min={5} max={200} step={5} suffix={String(leads)} onChange={setLeads} />
            <Slider label="% you miss or reply to slowly" value={missPct} min={5} max={80} step={5} suffix={`${missPct}%`} onChange={setMissPct} />
            <Slider label="Close rate when you reach them first" value={closeRate} min={10} max={80} step={5} suffix={`${closeRate}%`} onChange={setCloseRate} />
            <p className="mt-3 text-[11px] text-ink-faint">
              Estimate only. Assumes you&apos;d win {closeRate}% of the {Math.round(missedLeads)} leads/month
              you currently fumble if you&apos;d replied first (78% of customers hire whoever does).
            </p>
          </div>

          {/* Result */}
          <div className="flex flex-col justify-between rounded-2xl border border-brand-200 bg-brand-50/50 p-6">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <TrendingDown className="h-4 w-4" /> You&apos;re likely leaving on the table
              </div>
              <div className="mt-2 text-4xl font-bold text-ink sm:text-5xl">{money(perMonth)}<span className="text-lg font-semibold text-ink-faint">/mo</span></div>
              <div className="mt-1 text-2xl font-bold text-brand-700">{money(perYear)}<span className="text-sm font-semibold text-ink-faint">/year</span></div>
              <div className="mt-3 text-sm text-ink-soft">
                ≈ <strong className="text-ink">{Math.round(jobsLost)}</strong> jobs a month lost to slow follow-up.
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm text-ink-soft">
                Folvra replies to all of them in under 60 seconds.{" "}
                {paysForItself && (
                  <span className="font-semibold text-ink">It pays for itself many times over.</span>
                )}
              </p>
              <a
                href="/pilot"
                className="group mt-3 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Stop losing these — start a free pilot
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-4 block last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        <span className="text-sm font-bold text-ink">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-500"
      />
    </label>
  );
}
