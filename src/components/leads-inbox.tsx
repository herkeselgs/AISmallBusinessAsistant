"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarCheck,
  Check,
  Clock,
  Inbox,
  Loader2,
  Pencil,
  Plus,
  Send,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadRecord, LeadStatus } from "@/lib/folvra/types";

const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-ink/10 text-ink-soft" },
  drafted: { label: "Needs approval", cls: "bg-amber-400/15 text-amber-500" },
  sent: { label: "Replied", cls: "bg-brand-50 text-brand-700" },
  booked: { label: "Booked", cls: "bg-brand-500 text-white" },
  won: { label: "Won", cls: "bg-brand-700 text-white" },
};

export function LeadsInbox() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [autopilot, setAutopilot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/leads");
        const json = await res.json();
        setLeads(json.leads ?? []);
        setSelectedId(json.leads?.[0]?.id ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const stats = useMemo(() => computeStats(leads), [leads]);

  function update(id: string, patch: Partial<LeadRecord>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function approve(l: LeadRecord) {
    update(l.id, { status: "sent" });
  }

  function markBooked(l: LeadRecord) {
    const label =
      l.draft?.offeredSlots.length && l.bookedSlotLabel
        ? l.bookedSlotLabel
        : "Tue 2:00 PM";
    update(l.id, { status: "booked", bookedSlotLabel: l.bookedSlotLabel ?? label });
  }

  function startEdit(l: LeadRecord) {
    setEditingId(l.id);
    setEditText(l.draft?.reply ?? "");
  }
  function saveEdit(l: LeadRecord) {
    if (l.draft) update(l.id, { draft: { ...l.draft, reply: editText } });
    setEditingId(null);
  }

  async function addLead() {
    setAdding(true);
    try {
      const res = await fetch("/api/leads/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ autopilot }),
      });
      const json = await res.json();
      if (json.lead) {
        setLeads((prev) => [json.lead, ...prev]);
        setSelectedId(json.lead.id);
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">Summit Home Services</h1>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink-faint">
              demo workspace
            </span>
          </div>
          <p className="text-sm text-ink-faint">Folvra is watching your inbox.</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle autopilot={autopilot} onChange={setAutopilot} />
          <button
            onClick={addLead}
            disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Simulate a new lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Inbox} label="Leads" value={String(stats.total)} />
        <Stat
          icon={Zap}
          label="Median response"
          value={fmtDuration(stats.medianResponseSec)}
          sub="industry: 47 hrs"
          good
        />
        <Stat icon={CalendarCheck} label="Booked" value={String(stats.booked)} good />
        <Stat
          icon={BadgeCheck}
          label="Pipeline rescued"
          value={`$${stats.pipelineRescued.toLocaleString()}`}
          good
        />
      </div>

      {/* Board */}
      <div className="mt-4 grid gap-4 rounded-2xl border border-line bg-white p-3 shadow-card md:grid-cols-[300px_1fr] md:p-4">
        {/* List */}
        <div className="flex max-h-[560px] flex-col gap-1.5 overflow-y-auto scroll-slim pr-1">
          {loading && (
            <div className="flex items-center gap-2 p-4 text-sm text-ink-faint">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading inbox…
            </div>
          )}
          {leads.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition",
                selectedId === l.id
                  ? "border-ink/30 bg-paper"
                  : "border-transparent hover:bg-paper/70"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">
                  {l.classification.contactName ?? "New lead"}
                </span>
                <StatusBadge status={l.status} />
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-ink-faint">
                <span className="truncate">{l.classification.service ?? "Inquiry"}</span>
                <span className="shrink-0">{l.channel}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="min-h-[420px] rounded-xl border border-line bg-paper/50 p-4">
          {selected ? (
            <LeadDetail
              lead={selected}
              editing={editingId === selected.id}
              editText={editText}
              setEditText={setEditText}
              onApprove={() => approve(selected)}
              onBooked={() => markBooked(selected)}
              onEdit={() => startEdit(selected)}
              onSaveEdit={() => saveEdit(selected)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-faint">
              Select a lead.
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-faint">
        Demo workspace with sample leads. In your pilot, this fills with your real leads — Folvra
        replies, follows up, and helps book the estimate.
      </p>
    </div>
  );
}

function LeadDetail({
  lead,
  editing,
  editText,
  setEditText,
  onApprove,
  onBooked,
  onEdit,
  onSaveEdit,
}: {
  lead: LeadRecord;
  editing: boolean;
  editText: string;
  setEditText: (s: string) => void;
  onApprove: () => void;
  onBooked: () => void;
  onEdit: () => void;
  onSaveEdit: () => void;
}) {
  const c = lead.classification;
  return (
    <div className="flex h-full flex-col gap-4">
      {/* meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-semibold text-ink">
          {c.contactName ?? "New lead"}
        </span>
        <span className="text-xs text-ink-faint">{lead.message.from}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand-600">
          <Clock className="h-3.5 w-3.5" /> replied in {fmtDuration(lead.respondedInSec)}
        </span>
      </div>

      {/* incoming */}
      <div>
        <Label>They wrote · {lead.channel} · {lead.receivedAt}</Label>
        <div className="mt-1.5 rounded-xl border border-line bg-white p-3 text-sm text-ink-soft">
          {lead.message.subject && (
            <div className="mb-1 font-medium text-ink">{lead.message.subject}</div>
          )}
          <p className="whitespace-pre-line">{lead.message.body}</p>
        </div>
      </div>

      {/* Folvra flagged */}
      {lead.draft?.needsHuman && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2.5 text-xs text-amber-600">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Folvra flagged this for your review: {lead.draft.reason}</span>
        </div>
      )}

      {/* Folvra's reply */}
      {lead.draft && (
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Label>
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Folvra&apos;s reply
              </span>
            </Label>
            {lead.status === "drafted" && !editing && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
              >
                <Pencil className="h-3 w-3" /> edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-1.5">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={9}
                className="w-full resize-none rounded-xl border border-line bg-white p-3 text-sm text-ink-soft outline-none focus:border-brand-500"
              />
              <button
                onClick={onSaveEdit}
                className="mt-2 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="mt-1.5 rounded-xl border border-line bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-xs text-ink-faint">
                <span>To: {lead.message.from}</span>
                {lead.status !== "drafted" && (
                  <span className="inline-flex items-center gap-1 text-brand-600">
                    <Check className="h-3.5 w-3.5" /> sent
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
                {lead.draft.reply}
              </p>
            </div>
          )}
        </div>
      )}

      {/* booked banner */}
      {(lead.status === "booked" || lead.status === "won") && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-2.5 text-sm">
          <CalendarCheck className="h-4 w-4 text-brand-600" />
          <span className="font-medium text-ink">
            Booked{lead.bookedSlotLabel ? ` — ${lead.bookedSlotLabel}` : ""}
          </span>
        </div>
      )}

      {/* actions */}
      <div className="flex flex-wrap gap-2">
        {lead.status === "drafted" && !editing && (
          <button
            onClick={onApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <Send className="h-4 w-4" /> Approve &amp; send
          </button>
        )}
        {lead.status === "sent" && (
          <button
            onClick={onBooked}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink-faint/40"
          >
            <CalendarCheck className="h-4 w-4 text-brand-600" /> Customer picked a time → book it
          </button>
        )}
        {lead.status === "sent" && (
          <span className="inline-flex items-center gap-1.5 self-center text-xs text-ink-faint">
            Sent · awaiting the customer&apos;s pick
          </span>
        )}
      </div>
    </div>
  );
}

function ModeToggle({
  autopilot,
  onChange,
}: {
  autopilot: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-line bg-white p-0.5 text-xs font-semibold">
      <button
        onClick={() => onChange(false)}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition",
          !autopilot ? "bg-ink text-white" : "text-ink-faint"
        )}
      >
        Approve-first
      </button>
      <button
        onClick={() => onChange(true)}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition",
          autopilot ? "bg-brand-500 text-white" : "text-ink-faint"
        )}
      >
        Autopilot
      </button>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  good,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  good?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3 shadow-card">
      <div className="flex items-center gap-1.5 text-xs text-ink-faint">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={cn("mt-1 text-2xl font-bold", good ? "text-brand-600" : "text-ink")}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-ink-faint">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", m.cls)}>
      {m.label}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{children}</div>
  );
}

function fmtDuration(sec: number) {
  if (!sec) return "—";
  if (sec < 90) return `${sec}s`;
  const m = Math.round(sec / 60);
  return `${m}m`;
}

function computeStats(leads: LeadRecord[]) {
  const active = leads.filter((l) => l.classification.isLead);
  const times = active.map((l) => l.respondedInSec).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : 0;
  const booked = active.filter((l) => l.status === "booked" || l.status === "won").length;
  const pipelineRescued = active
    .filter((l) => ["sent", "booked", "won"].includes(l.status))
    .reduce((s, l) => s + (l.classification.estValueUsd ?? 0), 0);
  return { total: active.length, medianResponseSec: median, booked, pipelineRescued };
}
