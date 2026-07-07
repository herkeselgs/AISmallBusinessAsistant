"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Outreach tracker (localStorage, no backend)                         */
/* ------------------------------------------------------------------ */

type Row = {
  business: string;
  owner: string;
  phone: string;
  email: string;
  vertical: string;
  contacted: boolean;
  replied: boolean;
  demo: boolean;
  pilot: boolean;
  notes: string;
};

const STORAGE_KEY = "folvra_outreach_v1";
const BLANK: Row = {
  business: "",
  owner: "",
  phone: "",
  email: "",
  vertical: "",
  contacted: false,
  replied: false,
  demo: false,
  pilot: false,
  notes: "",
};
const seed = (n: number): Row[] => Array.from({ length: n }, () => ({ ...BLANK }));

export function FounderConsole() {
  const [rows, setRows] = useState<Row[]>(() => seed(30));
  const loaded = useRef(false);

  // hydrate from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setRows(parsed);
      }
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);

  // persist on change (after initial load)
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  function setCell<K extends keyof Row>(i: number, key: K, val: Row[K]) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ...BLANK }]);
  }
  function reset() {
    if (confirm("Clear the whole tracker? This can't be undone.")) setRows(seed(30));
  }
  function exportCsv() {
    const head = [
      "Business",
      "Owner",
      "Phone",
      "Email",
      "Vertical",
      "Contacted",
      "Replied",
      "Demo",
      "Pilot",
      "Notes",
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = rows.map((r) =>
      [
        r.business,
        r.owner,
        r.phone,
        r.email,
        r.vertical,
        r.contacted ? "yes" : "",
        r.replied ? "yes" : "",
        r.demo ? "yes" : "",
        r.pilot ? "yes" : "",
        r.notes,
      ]
        .map((v) => esc(v as string))
        .join(",")
    );
    const csv = [head.map(esc).join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folvra-outreach-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const done = {
    contacted: rows.filter((r) => r.contacted).length,
    replied: rows.filter((r) => r.replied).length,
    demo: rows.filter((r) => r.demo).length,
    pilot: rows.filter((r) => r.pilot).length,
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Metric label="Contacted" value={done.contacted} />
        <Metric label="Replied" value={done.replied} />
        <Metric label="Demos" value={done.demo} />
        <Metric label="Pilots" value={done.pilot} />
        <div className="ml-auto flex gap-2">
          <button onClick={addRow} className={btnGhost}>
            <Plus className="h-3.5 w-3.5" /> Row
          </button>
          <button onClick={exportCsv} className={btnGhost}>
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={reset} className={btnGhost}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white scroll-slim">
        <table className="w-full min-w-[1000px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-paper/60 text-left text-xs text-ink-faint">
              <th className="w-8 px-2 py-2">#</th>
              <Th>Business</Th>
              <Th>Owner</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Vertical</Th>
              <th className="px-2 py-2 text-center">Cont.</th>
              <th className="px-2 py-2 text-center">Repl.</th>
              <th className="px-2 py-2 text-center">Demo</th>
              <th className="px-2 py-2 text-center">Pilot</th>
              <Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line/60 last:border-0">
                <td className="px-2 py-1 text-center text-xs text-ink-faint">{i + 1}</td>
                <Td><CellInput v={r.business} on={(v) => setCell(i, "business", v)} /></Td>
                <Td><CellInput v={r.owner} on={(v) => setCell(i, "owner", v)} /></Td>
                <Td><CellInput v={r.phone} on={(v) => setCell(i, "phone", v)} /></Td>
                <Td><CellInput v={r.email} on={(v) => setCell(i, "email", v)} /></Td>
                <Td><CellInput v={r.vertical} on={(v) => setCell(i, "vertical", v)} /></Td>
                <Td center><CellCheck v={r.contacted} on={(v) => setCell(i, "contacted", v)} /></Td>
                <Td center><CellCheck v={r.replied} on={(v) => setCell(i, "replied", v)} /></Td>
                <Td center><CellCheck v={r.demo} on={(v) => setCell(i, "demo", v)} /></Td>
                <Td center><CellCheck v={r.pilot} on={(v) => setCell(i, "pilot", v)} /></Td>
                <Td><CellInput v={r.notes} on={(v) => setCell(i, "notes", v)} wide /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Saves automatically in this browser (localStorage). Export a CSV backup before switching
        devices.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm">
      <span className="font-bold text-ink">{value}</span>{" "}
      <span className="text-ink-faint">{label}</span>
    </div>
  );
}
const btnGhost =
  "inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink-faint/40";
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-2 font-medium">{children}</th>;
}
function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <td className={cn("px-1 py-0.5", center && "text-center")}>{children}</td>;
}
function CellInput({ v, on, wide }: { v: string; on: (v: string) => void; wide?: boolean }) {
  return (
    <input
      value={v}
      onChange={(e) => on(e.target.value)}
      className={cn(
        "rounded px-1.5 py-1 text-sm text-ink outline-none focus:bg-brand-50",
        wide ? "w-44" : "w-28"
      )}
    />
  );
}
function CellCheck({ v, on }: { v: boolean; on: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={v}
      onChange={(e) => on(e.target.checked)}
      className="h-4 w-4 accent-brand-500"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Scripts                                                             */
/* ------------------------------------------------------------------ */

export function CopyBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
        {text}
      </pre>
    </div>
  );
}
