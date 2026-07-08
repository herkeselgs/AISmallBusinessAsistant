"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Globe,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prospect } from "@/lib/folvra/prospects";
import {
  SCRIPT,
  buildSummary,
  detectObjection,
  detectSources,
  detectWorkflow,
  isInterested,
  nextQuestion,
  painLevel,
  painScoreOf,
  renderLine,
  wordMatch,
  type CallSession,
  type CallSummary,
  type Outcome,
} from "@/lib/folvra/copilot";

const STATS_KEY = "folvra_call_stats_v1";
type Stats = { calls: number; answers: number; demos: number; followups: number; notInterested: number; pilotsOffered: number };
const ZERO_STATS: Stats = { calls: 0, answers: 0, demos: 0, followups: 0, notInterested: 0, pilotsOffered: 0 };

type Phase = "setup" | "consent" | "live" | "summary";
type Mode = "you" | "prospect";

export function CallCopilot({
  prospects,
  onUpdate,
}: {
  prospects: Prospect[];
  onUpdate: (id: string, patch: Partial<Prospect>) => void;
}) {
  const withName = prospects.filter((p) => p.business.trim());
  const [selectedId, setSelectedId] = useState<string>("");
  const selected = prospects.find((p) => p.id === selectedId) || withName[0] || null;

  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("you");
  const [lineIndex, setLineIndex] = useState(0);
  const [spokenLine, setSpokenLine] = useState("");
  const [interim, setInterim] = useState("");
  const [prospectText, setProspectText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [objection, setObjection] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [listening, setListening] = useState(false);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [stats, setStats] = useState<Stats>(ZERO_STATS);

  // refs mirror state so speech/keyboard callbacks never go stale
  const recRef = useRef<any>(null);
  const supportedRef = useRef(false);
  const phaseRef = useRef<Phase>("setup");
  const modeRef = useRef<Mode>("you");
  const lineRef = useRef(0);
  const spokenRef = useRef("");
  const prospectRef = useRef("");
  const objectionsSeen = useRef<Set<string>>(new Set());
  const listeningRef = useRef(false);

  phaseRef.current = phase;
  modeRef.current = mode;
  lineRef.current = lineIndex;

  const business = selected?.business || "your company";
  const currentLine = renderLine(SCRIPT[lineIndex]?.text ?? "", business);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats({ ...ZERO_STATS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const refreshIntel = useCallback((full: string, live: string) => {
    const obj = detectObjection(live);
    if (obj) {
      objectionsSeen.current.add(obj.label);
      setObjection(obj.label);
      setSuggestion(obj.response);
    } else {
      setObjection(null);
      if (isInterested(live)) {
        setSuggestion("Great — can I show you what Folvra would say to one of your actual leads? Takes 5 minutes, and the pilot's free.");
      } else {
        const nq = nextQuestion(lineRef.current);
        setSuggestion(nq ?? "Go for the close: does today or tomorrow work better?");
      }
    }
  }, []);

  // Set up speech recognition once.
  useEffect(() => {
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SR) return;
    supportedRef.current = true;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let fin = "", intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) fin += res[0].transcript + " ";
        else intr += res[0].transcript + " ";
      }
      if (modeRef.current === "you") {
        if (fin) {
          spokenRef.current += fin;
          setSpokenLine(spokenRef.current);
        }
        setInterim(intr);
      } else {
        if (fin) {
          prospectRef.current += fin;
          setProspectText(prospectRef.current);
        }
        setInterim(intr);
        refreshIntel(prospectRef.current, prospectRef.current + " " + intr);
      }
    };
    r.onend = () => {
      if (phaseRef.current === "live" && listeningRef.current) {
        try {
          r.start();
        } catch {
          /* already started */
        }
      }
    };
    recRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
    };
  }, [refreshIntel]);

  function startListening() {
    if (!recRef.current) return;
    try {
      recRef.current.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      /* already running */
    }
  }
  function stopListening() {
    listeningRef.current = false;
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }

  function resetTurn() {
    spokenRef.current = "";
    setSpokenLine("");
    setInterim("");
  }

  function advanceLine() {
    setLineIndex((i) => Math.min(i + 1, SCRIPT.length - 1));
    resetTurn();
  }

  const iSaidThis = useCallback(() => {
    const line = SCRIPT[lineRef.current];
    if (line?.kind === "ask") {
      setMode("prospect");
      modeRef.current = "prospect";
    } else {
      advanceLine();
    }
    resetTurn();
  }, []);

  const goProspect = useCallback(() => {
    setMode("prospect");
    modeRef.current = "prospect";
    setInterim("");
  }, []);

  const goMyTurn = useCallback(() => {
    // finalize + move to next line, back to me
    advanceLine();
    setMode("you");
    modeRef.current = "you";
  }, []);

  function start() {
    if (!selected) return;
    setPhase("consent");
  }
  function confirmConsent() {
    setPhase("live");
    setLineIndex(0);
    lineRef.current = 0;
    setMode("you");
    modeRef.current = "you";
    prospectRef.current = "";
    setProspectText("");
    objectionsSeen.current = new Set();
    setObjection(null);
    setSuggestion(nextQuestion(-1) ?? "");
    setOutcome(null);
    resetTurn();
    startListening();
  }

  const endCall = useCallback(() => {
    stopListening();
    if (!selected) {
      setPhase("summary");
      return;
    }
    const finalOutcome: Outcome = outcome ?? (prospectRef.current.trim() ? "answered" : "no_answer");
    const session: CallSession = {
      business: selected.business,
      owner: selected.owner,
      trade: selected.trade,
      outcome: finalOutcome,
      prospectTranscript: prospectRef.current,
      objections: Array.from(objectionsSeen.current),
      painScore: painScoreOf(prospectRef.current),
      sources: detectSources(prospectRef.current),
      workflow: detectWorkflow(prospectRef.current),
      interest: isInterested(prospectRef.current),
    };
    const sum = buildSummary(session);
    const priorNotes = (selected.notes || "").trim();
    onUpdate(selected.id, {
      ...sum.flags,
      status: sum.status,
      nextAction: sum.nextAction,
      followUp: sum.followUpDate || selected.followUp,
      notes: priorNotes ? `${sum.notes}\n${priorNotes}` : sum.notes,
    });
    // stats
    setStats((prev) => {
      const s = { ...prev, calls: prev.calls + 1 };
      if (["answered", "demo_booked", "follow_up", "pilot_offered", "pilot_started"].includes(finalOutcome)) s.answers += 1;
      if (finalOutcome === "demo_booked") s.demos += 1;
      if (finalOutcome === "follow_up") s.followups += 1;
      if (finalOutcome === "not_interested") s.notInterested += 1;
      if (finalOutcome === "pilot_offered" || finalOutcome === "pilot_started") s.pilotsOffered += 1;
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(s));
      } catch {
        /* ignore */
      }
      return s;
    });
    setSummary(sum);
    setPhase("summary");
  }, [selected, outcome, onUpdate]);

  // keyboard shortcuts during live call
  useEffect(() => {
    if (phase !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        iSaidThis();
      } else if (e.key.toLowerCase() === "l") {
        goProspect();
      } else if (e.key.toLowerCase() === "m") {
        goMyTurn();
      } else if (e.key.toLowerCase() === "e") {
        endCall();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, iSaidThis, goProspect, goMyTurn, endCall]);

  function reset() {
    setPhase("setup");
    setSummary(null);
    setOutcome(null);
    setProspectText("");
    prospectRef.current = "";
    resetTurn();
  }

  const wm = wordMatch(currentLine, spokenLine + " " + (mode === "you" ? interim : ""));
  const statusLabel =
    phase !== "live" ? "" : mode === "you" ? "Your turn" : "Listening to prospect";
  const progress = Math.round(((lineIndex + 1) / SCRIPT.length) * 100);

  return (
    <div>
      {/* stats bar */}
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <StatPill label="Calls" v={stats.calls} />
        <StatPill label="Answers" v={stats.answers} />
        <StatPill label="Demos" v={stats.demos} good />
        <StatPill label="Follow-ups" v={stats.followups} />
        <StatPill label="Not interested" v={stats.notInterested} />
        <StatPill label="Pilots offered" v={stats.pilotsOffered} good />
      </div>

      {phase === "setup" && (
        <SetupCard
          prospects={withName}
          selectedId={selected?.id || ""}
          onSelect={setSelectedId}
          onStart={start}
        />
      )}

      {phase === "consent" && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-center">
          <p className="text-sm font-semibold text-ink">Before you start transcription:</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Say this to the prospect first:{" "}
            <span className="font-medium text-ink">
              &quot;I&apos;m taking notes so I don&apos;t miss anything — is that okay?&quot;
            </span>
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={confirmConsent} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90">
              I said this and got consent — start copilot
            </button>
            <button onClick={() => setPhase("setup")} className={ghost}>
              Back
            </button>
          </div>
        </div>
      )}

      {phase === "live" && selected && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* LEFT: prospect */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Prospect</div>
            <div className="mt-1 text-lg font-bold text-ink">{selected.business}</div>
            <div className="text-sm text-ink-soft">
              {selected.owner && selected.owner !== "Unknown" ? selected.owner : "Owner unknown"}
              {selected.trade ? ` · ${selected.trade}` : ""}
            </div>
            <div className="mt-2 space-y-1 text-sm text-ink-soft">
              {selected.phone && <div>📞 {selected.phone}</div>}
              {selected.website && <div className="truncate">🌐 {selected.website}</div>}
              <div>Status: <span className="font-medium text-ink">{selected.status}</span></div>
            </div>
            {selected.notes && (
              <div className="mt-2 max-h-24 overflow-auto rounded-lg border border-line bg-paper/50 p-2 text-xs text-ink-faint scroll-slim">
                {selected.notes}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.phone && (
                <a href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`} className={callBtn}>
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              )}
              {selected.website && (
                <a href={selected.website.startsWith("http") ? selected.website : `https://${selected.website}`} target="_blank" rel="noopener noreferrer" className={ghost}>
                  <Globe className="h-3.5 w-3.5" /> Site
                </a>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <OutcomeBtn cur={outcome} val="no_answer" set={setOutcome} label="No answer" />
              <OutcomeBtn cur={outcome} val="answered" set={setOutcome} label="Answered" />
              <OutcomeBtn cur={outcome} val="demo_booked" set={setOutcome} label="Demo booked" />
              <OutcomeBtn cur={outcome} val="pilot_offered" set={setOutcome} label="Pilot offered" />
              <OutcomeBtn cur={outcome} val="not_interested" set={setOutcome} label="Not interested" />
              <OutcomeBtn cur={outcome} val="follow_up" set={setOutcome} label="Follow-up" />
            </div>
            <button onClick={endCall} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-ink/90">
              <PhoneOff className="h-4 w-4" /> End call &amp; save (E)
            </button>
          </div>

          {/* MIDDLE: guide */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", mode === "you" ? "bg-brand-500 text-white" : "bg-amber-400/20 text-amber-600")}>
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                {listening ? <Mic className="h-3.5 w-3.5 text-brand-500" /> : <MicOff className="h-3.5 w-3.5" />}
                {supportedRef.current ? (listening ? "mic on" : "mic off") : "no mic"}
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">
              Line {lineIndex + 1} / {SCRIPT.length} · {SCRIPT[lineIndex]?.phase}
            </div>

            <div className="mt-3 min-h-[92px] rounded-xl border border-line bg-paper/50 p-3 text-lg font-semibold leading-snug">
              {mode === "you" ? (
                wm.words.map((w, i) => (
                  <span key={i} className={w.done ? "text-brand-600" : "text-ink/40"}>
                    {w.w}{" "}
                  </span>
                ))
              ) : (
                <span className="text-ink-soft">{currentLine}</span>
              )}
              {mode === "you" && wm.complete && (
                <span className="ml-1 inline-flex items-center gap-0.5 align-middle text-xs font-medium text-brand-600">
                  <Check className="h-3.5 w-3.5" /> covered
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button onClick={iSaidThis} className={primaryBtn}>
                <Check className="h-4 w-4" /> I said this <kbd className="ml-1 text-[10px] opacity-70">Space</kbd>
              </button>
              <button onClick={() => advanceLine()} className={ghost}>
                <SkipForward className="h-3.5 w-3.5" /> Skip line
              </button>
              <button onClick={goProspect} className={cn(ghost, mode === "prospect" && "border-amber-400 text-amber-600")}>
                Prospect speaking <kbd className="ml-1 text-[10px] opacity-70">L</kbd>
              </button>
              <button onClick={goMyTurn} className={cn(ghost, mode === "you" && "border-brand-500 text-brand-600")}>
                My turn <kbd className="ml-1 text-[10px] opacity-70">M</kbd>
              </button>
            </div>
            {!supportedRef.current && (
              <p className="mt-2 text-[11px] text-ink-faint">
                No speech recognition in this browser — read the line yourself and use the buttons.
                Type what the prospect says in the box on the right.
              </p>
            )}
          </div>

          {/* RIGHT: intelligence */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Intelligence</div>

            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {objection && <span className="rounded-full bg-amber-400/20 px-2 py-1 font-medium text-amber-600">Objection: {objection}</span>}
              <span className="rounded-full bg-ink/5 px-2 py-1 font-medium text-ink-soft">
                Pain: {painLevel(painScoreOf(prospectText))}
              </span>
              {detectSources(prospectText).length > 0 && (
                <span className="rounded-full bg-ink/5 px-2 py-1 font-medium text-ink-soft">Leads: {detectSources(prospectText).join(", ")}</span>
              )}
            </div>

            <Labeled label="Suggested response">
              <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-2.5 text-sm text-ink">
                {suggestion || "—"}
              </div>
              {suggestion && <CopyRow text={suggestion} label="response" />}
            </Labeled>

            <Labeled label="Next best question">
              <div className="text-sm text-ink-soft">{nextQuestion(lineIndex) ?? "Go for the close."}</div>
            </Labeled>

            <Labeled label={supportedRef.current ? "Live transcript (prospect)" : "Type what the prospect says"}>
              <textarea
                value={prospectText}
                onChange={(e) => {
                  prospectRef.current = e.target.value;
                  setProspectText(e.target.value);
                  refreshIntel(e.target.value, e.target.value);
                }}
                rows={4}
                placeholder={supportedRef.current ? "Prospect speech appears here…" : "Type notes on what they say…"}
                className="w-full resize-y rounded-lg border border-line bg-paper/40 p-2 text-xs text-ink-soft outline-none focus:border-brand-500 scroll-slim"
              />
            </Labeled>

            {interim && mode === "prospect" && (
              <p className="text-[11px] italic text-ink-faint">…{interim}</p>
            )}
          </div>
        </div>
      )}

      {phase === "summary" && (
        <SummaryCard summary={summary} onDone={reset} />
      )}
    </div>
  );
}

/* ------------------------------ pieces ------------------------------ */

function SetupCard({
  prospects,
  selectedId,
  onSelect,
  onStart,
}: {
  prospects: Prospect[];
  selectedId: string;
  onSelect: (id: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
      {prospects.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Add prospects to the spreadsheet first (Find prospects / Import), then pick one here to
          start a guided call.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Who are you calling?</span>
            <select
              value={selectedId}
              onChange={(e) => onSelect(e.target.value)}
              className="min-w-[240px] rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-500"
            >
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.business}
                  {p.phone ? ` — ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button onClick={onStart} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90">
            <Sparkles className="h-4 w-4" /> Start Call Copilot
          </button>
        </div>
      )}
      <p className="mt-3 text-[11px] text-ink-faint">
        Copilot only listens, transcribes, suggests, and saves notes — it never dials or speaks for
        you. Works best in Chrome (mic permission). No speech? It falls back to manual notes.
      </p>
    </div>
  );
}

function SummaryCard({ summary, onDone }: { summary: CallSummary | null; onDone: () => void }) {
  if (!summary)
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <p className="text-sm text-ink-soft">Call ended.</p>
        <button onClick={onDone} className={cn(primaryBtn, "mt-3")}>New call</button>
      </div>
    );
  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Check className="h-5 w-5 text-brand-600" />
        <span className="text-lg font-bold text-ink">Saved: {summary.outcomeLabel}</span>
        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink-soft">Pain: {summary.painLevel}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Summary">{summary.summary}</Field>
        <Field label="Next action">{summary.nextAction}{summary.followUpDate ? ` · ${summary.followUpDate}` : ""}</Field>
        <div>
          <Labeled label="Follow-up SMS">
            <div className="rounded-lg border border-line bg-paper/50 p-2 text-xs text-ink-soft">{summary.followUpSMS}</div>
            <CopyRow text={summary.followUpSMS} label="SMS" />
          </Labeled>
        </div>
        <div>
          <Labeled label="Follow-up email">
            <div className="max-h-28 overflow-auto rounded-lg border border-line bg-paper/50 p-2 text-xs text-ink-soft scroll-slim whitespace-pre-line">{summary.followUpEmail}</div>
            <CopyRow text={summary.followUpEmail} label="email" />
          </Labeled>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Saved to the spreadsheet row (status, flags, notes, next action, follow-up date) and to your call stats.</p>
      <button onClick={onDone} className={cn(primaryBtn, "mt-3")}>Call the next one</button>
    </div>
  );
}

function CopyRow({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink"
    >
      {done ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3" />}
      {done ? "Copied" : `Copy ${label}`}
    </button>
  );
}

function OutcomeBtn({ cur, val, set, label }: { cur: Outcome | null; val: Outcome; set: (o: Outcome) => void; label: string }) {
  return (
    <button
      onClick={() => set(val)}
      className={cn(
        "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
        cur === val ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-soft hover:border-ink-faint/40"
      )}
    >
      {label}
    </button>
  );
}

function StatPill({ label, v, good }: { label: string; v: number; good?: boolean }) {
  return (
    <span className="rounded-lg border border-line bg-white px-2.5 py-1">
      <span className={cn("font-bold", good ? "text-brand-600" : "text-ink")}>{v}</span>{" "}
      <span className="text-ink-faint">{label}</span>
    </span>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-paper/40 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 text-sm text-ink-soft">{children}</div>
    </div>
  );
}

const ghost =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink-faint/40";
const primaryBtn =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600";
const callBtn =
  "inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600";
