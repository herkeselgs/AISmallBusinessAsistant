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
  RefreshCw,
  SkipForward,
  Sparkles,
  Wand2,
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
  type Suggestion,
} from "@/lib/folvra/copilot";

const STATS_KEY = "folvra_call_stats_v1";
const DEMO_ASK = "Can I show you what Folvra would say to one of your actual leads? It takes five minutes.";
type Stats = { calls: number; answers: number; demos: number; followups: number; notInterested: number; pilotsOffered: number };
const ZERO_STATS: Stats = { calls: 0, answers: 0, demos: 0, followups: 0, notInterested: 0, pilotsOffered: 0 };

type Phase = "setup" | "consent" | "live" | "summary";
type Mode = "you" | "prospect";
type Refine = "shorter" | "more_direct" | "ask_for_demo";

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
  const [suggestion, setSuggestion] = useState(""); // instant rule suggestion
  const [objection, setObjection] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [listening, setListening] = useState(false);
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [stats, setStats] = useState<Stats>(ZERO_STATS);

  // AI layer
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiSug, setAiSug] = useState<Suggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  // the line to say / highlight in the middle column
  const [sayText, setSayText] = useState("");

  // refs so speech/keyboard/AI callbacks never go stale
  const recRef = useRef<any>(null);
  const supportedRef = useRef(false);
  const phaseRef = useRef<Phase>("setup");
  const modeRef = useRef<Mode>("you");
  const lineRef = useRef(0);
  const spokenRef = useRef("");
  const prospectRef = useRef("");
  const objectionsSeen = useRef<Set<string>>(new Set());
  const listeningRef = useRef(false);
  const aiEnabledRef = useRef(true);
  const aiSeqRef = useRef(0);
  const aiTimerRef = useRef<number | null>(null);
  const lastAiRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const sayingSuggestionRef = useRef(false);
  const scheduleAiRef = useRef<() => void>(() => {});

  phaseRef.current = phase;
  modeRef.current = mode;
  lineRef.current = lineIndex;
  aiEnabledRef.current = aiEnabled;

  const business = selected?.business || "your company";
  const currentLine = renderLine(SCRIPT[lineIndex]?.text ?? "", business);
  const bestText = aiEnabled && aiSug ? aiSug.suggestedResponse : suggestion || currentLine;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats({ ...ZERO_STATS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const refreshIntel = useCallback((live: string) => {
    const obj = detectObjection(live);
    if (obj) {
      objectionsSeen.current.add(obj.label);
      setObjection(obj.label);
      setSuggestion(obj.response);
    } else {
      setObjection(null);
      setSuggestion(isInterested(live) ? DEMO_ASK : nextQuestion(lineRef.current) ?? DEMO_ASK);
    }
  }, []);

  const callAi = useCallback(
    async (refine?: Refine) => {
      if (!selected) return;
      lastAiRef.current = Date.now();
      const seq = ++aiSeqRef.current;
      setAiLoading(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const timeout = window.setTimeout(() => ctrl.abort(), 7000);
      try {
        const res = await fetch("/api/call-copilot/suggest", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            prospect: {
              businessName: selected.business,
              ownerName: selected.owner,
              trade: selected.trade,
              phone: selected.phone,
              website: selected.website,
              notes: selected.notes,
            },
            callState: {
              currentStage: SCRIPT[lineRef.current]?.phase ?? "discovery",
              currentGoal: "book a 5-minute demo",
              mode: modeRef.current === "prospect" ? "prospect_speaking" : "my_turn",
            },
            transcript: [{ speaker: "prospect", text: prospectRef.current.slice(-800) }],
            latestProspectUtterance: prospectRef.current.slice(-500),
            detectedObjection: detectObjection(prospectRef.current)?.key ?? null,
            previousSuggestion: aiSug?.suggestedResponse,
            refine: refine ?? null,
            lineIndex: lineRef.current,
          }),
        });
        const data = (await res.json()) as Suggestion;
        if (seq !== aiSeqRef.current) return; // stale
        setAiSug(data);
        setAiUnavailable(data.source !== "ai");
      } catch {
        if (seq === aiSeqRef.current) {
          /* keep previous AI suggestion; rules still cover it */
        }
      } finally {
        window.clearTimeout(timeout);
        if (seq === aiSeqRef.current) setAiLoading(false);
      }
    },
    [selected, aiSug]
  );

  const scheduleAi = useCallback(() => {
    if (!aiEnabledRef.current) return;
    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = window.setTimeout(() => {
      if (modeRef.current === "prospect" && prospectRef.current.trim().length > 3) {
        if (Date.now() - lastAiRef.current >= 1500) callAi();
        else {
          // enforce min gap between calls
          aiTimerRef.current = window.setTimeout(() => {
            if (modeRef.current === "prospect") callAi();
          }, 1500);
        }
      }
    }, 1200);
  }, [callAi]);
  scheduleAiRef.current = scheduleAi;

  // speech recognition setup (once)
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
          refreshIntel(prospectRef.current);
          scheduleAiRef.current();
        } else {
          refreshIntel(prospectRef.current + " " + intr);
        }
        setInterim(intr);
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
  function setScriptLine(i: number) {
    setSayText(renderLine(SCRIPT[i]?.text ?? "", business));
  }
  function advanceLine() {
    setLineIndex((i) => {
      const ni = Math.min(i + 1, SCRIPT.length - 1);
      lineRef.current = ni;
      setScriptLine(ni);
      return ni;
    });
    resetTurn();
  }

  const iSaidThis = useCallback(() => {
    if (sayingSuggestionRef.current) {
      sayingSuggestionRef.current = false;
      setScriptLine(lineRef.current);
      resetTurn();
      return;
    }
    const line = SCRIPT[lineRef.current];
    if (line?.kind === "ask") {
      setMode("prospect");
      modeRef.current = "prospect";
      resetTurn();
    } else {
      advanceLine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goProspect = useCallback(() => {
    setMode("prospect");
    modeRef.current = "prospect";
    setInterim("");
  }, []);

  function useResponse(text: string) {
    sayingSuggestionRef.current = true;
    setSayText(text);
    setMode("you");
    modeRef.current = "you";
    resetTurn();
  }
  const goMyTurn = useCallback(() => {
    sayingSuggestionRef.current = true;
    setSayText(aiEnabledRef.current && aiSug ? aiSug.suggestedResponse : suggestion || currentLine);
    setMode("you");
    modeRef.current = "you";
    resetTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiSug, suggestion, currentLine]);

  function start() {
    if (!selected) return;
    setPhase("consent");
  }
  function confirmConsent() {
    setPhase("live");
    setLineIndex(0);
    lineRef.current = 0;
    setScriptLine(0);
    setMode("you");
    modeRef.current = "you";
    prospectRef.current = "";
    setProspectText("");
    objectionsSeen.current = new Set();
    setObjection(null);
    setSuggestion(nextQuestion(-1) ?? "");
    setAiSug(null);
    setAiUnavailable(false);
    sayingSuggestionRef.current = false;
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
    const det = buildSummary(session);
    const priorNotes = (selected.notes || "").trim();
    const save = (sum: CallSummary) =>
      onUpdate(selected.id, {
        ...sum.flags,
        status: sum.status,
        nextAction: sum.nextAction,
        followUp: sum.followUpDate || selected.followUp,
        notes: priorNotes ? `${sum.notes}\n${priorNotes}` : sum.notes,
      });
    save(det);
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
    setSummary(det);
    setPhase("summary");

    // AI improvement (optional, non-blocking)
    if (aiEnabledRef.current) {
      setSummaryLoading(true);
      const ctrl = new AbortController();
      const to = window.setTimeout(() => ctrl.abort(), 20000);
      fetch("/api/call-copilot/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify(session),
      })
        .then((r) => r.json())
        .then((ai: CallSummary & { source?: string }) => {
          if (ai && ai.source === "ai" && ai.summary) {
            setSummary(ai);
            save(ai);
          }
        })
        .catch(() => {})
        .finally(() => {
          window.clearTimeout(to);
          setSummaryLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setAiSug(null);
    resetTurn();
  }

  const wm = wordMatch(sayText || currentLine, spokenLine + " " + (mode === "you" ? interim : ""));
  const statusLabel = phase !== "live" ? "" : aiLoading && mode === "prospect" ? "Thinking" : mode === "you" ? "Your turn" : "Listening to prospect";
  const progress = Math.round(((lineIndex + 1) / SCRIPT.length) * 100);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <StatPill label="Calls" v={stats.calls} />
        <StatPill label="Answers" v={stats.answers} />
        <StatPill label="Demos" v={stats.demos} good />
        <StatPill label="Follow-ups" v={stats.followups} />
        <StatPill label="Not interested" v={stats.notInterested} />
        <StatPill label="Pilots offered" v={stats.pilotsOffered} good />
      </div>

      {phase === "setup" && (
        <SetupCard prospects={withName} selectedId={selected?.id || ""} onSelect={setSelectedId} onStart={start} />
      )}

      {phase === "consent" && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5 text-center">
          <p className="text-sm font-semibold text-ink">Before you start transcription:</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Say this first:{" "}
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
            <div className="mt-1 flex items-center justify-between text-[11px] text-ink-faint">
              <span>Line {lineIndex + 1} / {SCRIPT.length} · {SCRIPT[lineIndex]?.phase}</span>
              {sayingSuggestionRef.current && <span className="font-medium text-brand-600">responding</span>}
            </div>

            <div className="mt-3 min-h-[92px] rounded-xl border border-line bg-paper/50 p-3 text-lg font-semibold leading-snug">
              {mode === "you" ? (
                wm.words.map((w, i) => (
                  <span key={i} className={w.done ? "text-brand-600" : "text-ink/40"}>
                    {w.w}{" "}
                  </span>
                ))
              ) : (
                <span className="text-ink-soft">{sayText || currentLine}</span>
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
                No speech recognition here — read the line yourself, use the buttons, and type what the
                prospect says on the right.
              </p>
            )}
          </div>

          {/* RIGHT: intelligence */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Intelligence</span>
              <label className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
                <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} className="h-3.5 w-3.5 accent-brand-500" />
                Use AI
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {objection && <span className="rounded-full bg-amber-400/20 px-2 py-1 font-medium text-amber-600">Objection: {objection}</span>}
              <span className="rounded-full bg-ink/5 px-2 py-1 font-medium text-ink-soft">Pain: {painLevel(painScoreOf(prospectText))}</span>
              {detectSources(prospectText).length > 0 && (
                <span className="rounded-full bg-ink/5 px-2 py-1 font-medium text-ink-soft">Leads: {detectSources(prospectText).join(", ")}</span>
              )}
            </div>

            {/* Instant (rule) suggestion */}
            <Labeled label="Instant suggestion (rules)">
              <div className="rounded-lg border border-line bg-paper/50 p-2.5 text-sm text-ink-soft">{suggestion || "—"}</div>
              <div className="mt-1 flex items-center gap-3">
                {suggestion && <CopyRow text={suggestion} label="instant" />}
                <button onClick={() => useResponse(suggestion)} className="text-xs font-medium text-ink-faint hover:text-ink">Use this</button>
              </div>
            </Labeled>

            {/* AI refined suggestion */}
            <Labeled label="AI refined suggestion">
              <div className={cn("rounded-lg border p-2.5 text-sm", aiSug && aiEnabled ? "border-brand-200 bg-brand-50/50 text-ink" : "border-line bg-paper/40 text-ink-faint")}>
                {aiLoading ? (
                  <span className="inline-flex items-center gap-1.5 text-ink-soft">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Refining response…
                  </span>
                ) : aiEnabled && aiSug ? (
                  aiSug.suggestedResponse
                ) : aiUnavailable ? (
                  "AI unavailable (no API key set) — using instant suggestions."
                ) : (
                  "Waiting for the prospect to speak…"
                )}
              </div>
              {aiSug && aiEnabled && !aiLoading && (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <CopyRow text={aiSug.suggestedResponse} label="AI" />
                  <button onClick={() => useResponse(aiSug.suggestedResponse)} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Use AI</button>
                  <span className="text-[11px] text-ink-faint">{aiSug.shortReason}</span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <MiniBtn onClick={() => callAi()} disabled={!aiEnabled || aiLoading}><Wand2 className="h-3 w-3" /> Regenerate</MiniBtn>
                <MiniBtn onClick={() => callAi("shorter")} disabled={!aiEnabled || aiLoading}>Shorter</MiniBtn>
                <MiniBtn onClick={() => callAi("more_direct")} disabled={!aiEnabled || aiLoading}>More direct</MiniBtn>
                <MiniBtn onClick={() => useResponse(DEMO_ASK)}>Ask for demo</MiniBtn>
              </div>
            </Labeled>

            <Labeled label="Next best question">
              <div className="text-sm text-ink-soft">{(aiEnabled && aiSug?.nextBestQuestion) || nextQuestion(lineIndex) || "Go for the close."}</div>
            </Labeled>

            <Labeled label={supportedRef.current ? "Live transcript (prospect)" : "Type what the prospect says"}>
              <textarea
                value={prospectText}
                onChange={(e) => {
                  prospectRef.current = e.target.value;
                  setProspectText(e.target.value);
                  refreshIntel(e.target.value);
                  scheduleAi();
                }}
                rows={4}
                placeholder={supportedRef.current ? "Prospect speech appears here…" : "Type notes on what they say…"}
                className="w-full resize-y rounded-lg border border-line bg-paper/40 p-2 text-xs text-ink-soft outline-none focus:border-brand-500 scroll-slim"
              />
            </Labeled>
            {interim && mode === "prospect" && <p className="text-[11px] italic text-ink-faint">…{interim}</p>}
          </div>
        </div>
      )}

      {phase === "summary" && <SummaryCard summary={summary} loading={summaryLoading} onDone={reset} />}
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
          Add prospects to the spreadsheet first (Find prospects / Import), then pick one here to start
          a guided call.
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
                  {p.business}{p.phone ? ` — ${p.phone}` : ""}
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
        you. Best in Chrome with mic on speakerphone. Rule suggestions are instant; AI refines them
        when an API key is set. No speech / no key? It still works.
      </p>
    </div>
  );
}

function SummaryCard({ summary, loading, onDone }: { summary: (CallSummary & { demoLikelihood?: string; source?: string }) | null; loading: boolean; onDone: () => void }) {
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
        {summary.demoLikelihood && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Demo likelihood: {summary.demoLikelihood}</span>}
        {loading && <span className="inline-flex items-center gap-1 text-xs text-ink-faint"><RefreshCw className="h-3 w-3 animate-spin" /> AI refining…</span>}
        {summary.source === "ai" && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">AI</span>}
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
            <div className="max-h-28 overflow-auto whitespace-pre-line rounded-lg border border-line bg-paper/50 p-2 text-xs text-ink-soft scroll-slim">{summary.followUpEmail}</div>
            <CopyRow text={summary.followUpEmail} label="email" />
          </Labeled>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-faint">Saved to the spreadsheet row (status, flags, notes, next action, follow-up) and your call stats.</p>
      <button onClick={onDone} className={cn(primaryBtn, "mt-3")}>Call the next one</button>
    </div>
  );
}

function MiniBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink-soft transition hover:border-ink-faint/40 disabled:opacity-40"
    >
      {children}
    </button>
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
