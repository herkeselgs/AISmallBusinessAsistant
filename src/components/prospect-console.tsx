"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CallCopilot } from "@/components/call-copilot";
import {
  COLUMNS,
  blankProspect,
  mergeProspects,
  parseImport,
  summarize,
  toCSV,
  toTSV,
  ycValuesFromProspects,
  STATUSES,
  type Prospect,
} from "@/lib/folvra/prospects";

const STORAGE_KEY = "folvra_prospects_v1";
const YC_KEY = "folvra_yc_v1";
const PLACES_KEY = "folvra_places_key";
const mapsSearchUrl = (city: string, trade: string) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`${trade} in ${city}`)}`;

/**
 * Bookmarklet the user saves once and clicks WHILE on a Google Maps results
 * page. It runs in the Maps page context (the only way to read that page — a
 * website cannot read another site's tab), scrapes the visible business cards
 * (name, rating, reviews, phone, + full card text), and copies them as CSV so
 * they can be pasted / "Paste from Google Maps" into Folvra. No API key.
 * String.raw keeps regex backslashes intact.
 */
const GRAB_BOOKMARKLET =
  "javascript:" +
  String.raw`(function(){try{var f=document.querySelector('div[role="feed"]')||document.body;var cs=[].slice.call(f.querySelectorAll('a.hfpxzc'));if(!cs.length){cs=[].slice.call(f.querySelectorAll('a[href*="/maps/place/"]'));}if(!cs.length){alert('Folvra: no Google Maps results found. Open a Maps search results LIST, scroll it to load businesses, then click this again.');return;}var seen={},rows=[['business','rating','reviews','phone','notes']];cs.forEach(function(a){var name=a.getAttribute('aria-label')||'';if(!name||seen[name])return;seen[name]=1;var c=a.closest('div[role="article"]')||a.parentElement;var t=((c&&c.innerText)||'').replace(/\s*\n\s*/g,' | ');var rm=t.match(/(\d(?:\.\d)?)\s*\(?([\d,]+)\)?/);var pm=t.match(/(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);rows.push([name,rm?rm[1]:'',rm?rm[2].replace(/,/g,''):'',pm?pm[1]:'',t]);});var csv=rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');navigator.clipboard.writeText(csv).then(function(){alert('Folvra: grabbed '+(rows.length-1)+' businesses. Go back to Folvra and click "Paste from Google Maps".');},function(){window.prompt('Folvra: copy this, then paste into Folvra import:',csv);});}catch(e){alert('Folvra grab failed: '+e.message);}})();`;
const TARGETS = { contacted: 30, called: 20, emailed: 10, sms: 5, demoBooked: 3, pilotStarted: 1 };

function seedBlank(n: number): Prospect[] {
  return Array.from({ length: n }, () => blankProspect());
}

/* cold outreach templates customized per prospect */
function coldEmail(p: Prospect): string {
  const b = p.business || "your company";
  const trade = (p.trade || "home-service").toLowerCase();
  return `Subject: the lead you missed last night

Hi ${p.owner && p.owner !== "Unknown" ? p.owner : "there"} — when a new ${trade} lead messages ${b} at 9pm, how fast do they hear back? 78% of customers hire whoever replies first, and most contractors take hours.

I built Folvra — it replies to every new lead in under a minute, follows up until they respond, and helps book the estimate, all off your existing inbox. Want me to run it on one of ${b}'s own past leads so you can see exactly what it'd say? 5 minutes, no setup.

— {YourName} · folvra.com`;
}
function coldSMS(p: Prospect): string {
  const b = p.business || "your company";
  const trade = (p.trade || "home-service").toLowerCase();
  return `Hey ${p.owner && p.owner !== "Unknown" ? p.owner : "there"} — saw ${b}. Quick q: when a ${trade} lead comes in after hours while you're on a job, how's it handled? I built a tool that auto-replies in <60s and follows up until they book. Can I run it on one of your real leads? No pitch. folvra.com`;
}

export function ProspectConsole() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const loaded = useRef(false);
  const bmRef = useRef<HTMLAnchorElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mapsHelp, setMapsHelp] = useState(false);

  // finder state
  const [city, setCity] = useState("");
  const [trade, setTrade] = useState("");
  const [maxN, setMaxN] = useState(30);
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<Prospect[]>([]);
  const [findMsg, setFindMsg] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [placesKey, setPlacesKey] = useState("");
  const [keyHelp, setKeyHelp] = useState(false);

  // import + table controls
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof Prospect | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      setRows(Array.isArray(parsed) && parsed.length ? parsed : seedBlank(30));
    } catch {
      setRows(seedBlank(30));
    }
    try {
      setPlacesKey(localStorage.getItem(PLACES_KEY) || "");
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(PLACES_KEY, placesKey);
    } catch {
      /* ignore */
    }
  }, [placesKey]);

  // Set the bookmarklet href directly on the DOM node (React strips javascript: hrefs).
  useEffect(() => {
    if (bmRef.current) bmRef.current.setAttribute("href", GRAB_BOOKMARKLET);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  function flash(msg: string) {
    setToast(msg);
    window.clearTimeout((flash as unknown as { t?: number }).t);
    (flash as unknown as { t?: number }).t = window.setTimeout(() => setToast(null), 2600);
  }

  const summary = useMemo(() => summarize(rows.filter((r) => r.business.trim())), [rows]);

  const visible = useMemo(() => {
    let v = rows;
    const q = filter.trim().toLowerCase();
    if (q) {
      v = v.filter((r) =>
        [r.business, r.trade, r.owner, r.phone, r.email, r.status, r.notes, r.nextAction]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (sortKey) {
      v = [...v].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (typeof av === "boolean" || typeof bv === "boolean")
          return ((av ? 1 : 0) - (bv ? 1 : 0)) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      });
    }
    return v;
  }, [rows, filter, sortKey, sortDir]);

  function update(id: string, patch: Partial<Prospect>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addBlank() {
    setRows((prev) => [...prev, blankProspect()]);
  }
  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }
  function resetAll() {
    if (confirm("Clear the whole spreadsheet? This cannot be undone.")) setRows(seedBlank(30));
  }
  function toggleSort(key: keyof Prospect) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  function addProspects(list: Prospect[]) {
    const empties = rows.filter((r) => !r.business.trim());
    const real = rows.filter((r) => r.business.trim());
    const { merged, added } = mergeProspects(real, list);
    // keep a few blank rows at the bottom for manual entry
    setRows([...merged, ...empties.slice(0, Math.max(5, empties.length))]);
    flash(added ? `Added ${added} prospect${added === 1 ? "" : "s"} (duplicates skipped).` : "No new prospects (all duplicates).");
  }

  async function runSearch() {
    if (city.trim().length < 2 || trade.trim().length < 1) {
      setFindMsg("Enter a city/area and a trade.");
      return;
    }
    setSearching(true);
    setFindMsg(null);
    setFound([]);
    setPicked(new Set());
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          trade: trade.trim(),
          max: maxN,
          apiKey: placesKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setFindMsg(data.reason || "Search unavailable — use CSV / paste import below.");
        if (!placesKey.trim()) setKeyHelp(true);
        return;
      }
      const list: Prospect[] = data.prospects ?? [];
      setFound(list);
      setPicked(new Set(list.map((p) => p.id)));
      if (list.length) {
        setFindMsg(`Found ${list.length} via ${data.provider}. Review, then add.`);
      } else {
        setFindMsg(data.note || "No results — try a broader area or use CSV / paste import.");
        if (data.needsKey) setKeyHelp(true);
      }
    } catch {
      setFindMsg("Search unavailable — use CSV / paste import below (always works).");
    } finally {
      setSearching(false);
    }
  }

  function addPicked() {
    const list = found.filter((p) => picked.has(p.id));
    if (!list.length) return flash("Select at least one prospect.");
    addProspects(list.map((p) => ({ ...p, trade: p.trade || trade })));
    setFound([]);
    setPicked(new Set());
  }

  function doImport() {
    const parsed = parseImport(importText, trade);
    if (!parsed.length) return flash("Nothing to import — paste rows first.");
    addProspects(parsed);
    setImportText("");
    setShowImport(false);
  }

  async function pasteFromMaps() {
    let text = "";
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setShowImport(true);
      return flash("Couldn't read clipboard — paste (Ctrl/Cmd+V) into the Import box instead.");
    }
    if (!text.trim()) return flash("Clipboard is empty — grab from Google Maps first.");
    const parsed = parseImport(text, trade).map((p) => ({ ...p, source: "Google Maps" }));
    if (!parsed.length) {
      setImportText(text);
      setShowImport(true);
      return flash("Couldn't auto-read that — check it in the Import box.");
    }
    addProspects(parsed);
  }

  async function copyBookmarklet() {
    await copyText(GRAB_BOOKMARKLET, "Bookmarklet code");
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} copied.`);
    } catch {
      flash("Copy failed — select & copy manually.");
    }
  }

  function exportCSV() {
    const real = rows.filter((r) => r.business.trim());
    const blob = new Blob([toCSV(real)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `folvra-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function syncYC() {
    try {
      const raw = localStorage.getItem(YC_KEY);
      const cur = raw ? JSON.parse(raw) : {};
      const values = { ...(cur.values ?? {}), ...ycValuesFromProspects(rows.filter((r) => r.business.trim())) };
      localStorage.setItem(YC_KEY, JSON.stringify({ ...cur, values }));
      flash("Synced to YC tracker — reload /yc to see updated numbers.");
    } catch {
      flash("Sync failed.");
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="sticky top-2 z-20 mx-auto w-fit rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white shadow-lift">
          {toast}
        </div>
      )}

      {/* Find prospects */}
      <section className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-bold text-ink">Find prospects</h3>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1.3fr_1fr_auto_auto]">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City / area (e.g. Fort Myers, FL)"
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <input
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder="Trade (e.g. HVAC)"
            className={inputCls}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <input
            type="number"
            value={maxN}
            min={1}
            max={60}
            onChange={(e) => setMaxN(Math.max(1, Math.min(60, Number(e.target.value) || 30)))}
            className={cn(inputCls, "w-20")}
            title="Max results"
          />
          <button
            onClick={runSearch}
            disabled={searching}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            {searching ? "Searching…" : "Find prospects"}
          </button>
        </div>

        {/* No-API: pull from Google Maps via a bookmarklet */}
        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MapPin className="h-4 w-4 text-brand-600" /> Pull from Google Maps — no API key
            </span>
            <a
              href={mapsSearchUrl(city.trim() || "your city", trade.trim() || "hvac")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink/90"
            >
              <Globe className="h-3.5 w-3.5" /> Open Google Maps
            </a>
            <a
              ref={bmRef}
              href="#"
              draggable
              onClick={(e) => e.preventDefault()}
              title="Drag me to your bookmarks bar (one time)"
              className={cn(ghost, "cursor-grab")}
            >
              ⭳ Grab from Maps (drag to bookmarks)
            </a>
            <button onClick={copyBookmarklet} className={ghost}>
              <Copy className="h-3.5 w-3.5" /> Copy code
            </button>
            <button
              onClick={pasteFromMaps}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste from Google Maps
            </button>
            <button onClick={() => setMapsHelp((v) => !v)} className={ghost}>
              How?
            </button>
          </div>
          {mapsHelp && (
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-ink-soft">
              <li>
                <b>One time:</b> drag <b>&quot;Grab from Maps&quot;</b> to your browser&apos;s bookmarks
                bar. (Or click <b>Copy code</b>, make a new bookmark, and paste it as the URL.)
              </li>
              <li>Type a city + trade above, then click <b>Open Google Maps</b>.</li>
              <li>On Maps, <b>scroll the results list down</b> to load businesses — the more you scroll, the more you get.</li>
              <li>Click your <b>Grab from Maps</b> bookmark → it copies every business it sees.</li>
              <li>Come back here → click <b>Paste from Google Maps</b> → they drop into the spreadsheet.</li>
            </ol>
          )}
        </div>

        {/* Google Maps data key (stored in this browser only — no redeploy needed) */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="w-full text-[11px] font-medium text-ink-faint">
            Or, for fully automatic bulk results, paste a Google Maps API key:
          </span>
          <input
            value={placesKey}
            onChange={(e) => setPlacesKey(e.target.value)}
            placeholder="Google Maps (Places) API key — paste for full results"
            className={cn(inputCls, "max-w-sm font-mono text-xs")}
            spellCheck={false}
          />
          {placesKey.trim() ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Google Maps data ON
            </span>
          ) : (
            <button onClick={() => setKeyHelp((v) => !v)} className={ghost}>
              Get a free key (2 min)
            </button>
          )}
          <a
            href={mapsSearchUrl(city.trim() || "your city", trade.trim() || "hvac")}
            target="_blank"
            rel="noopener noreferrer"
            className={ghost}
          >
            <Globe className="h-3.5 w-3.5" /> Open in Google Maps
          </a>
        </div>

        {keyHelp && (
          <div className="mt-2 rounded-xl border border-line bg-paper/60 p-3 text-xs text-ink-soft">
            <p className="font-semibold text-ink">Get a free Google Maps (Places) API key — ~2 min:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>Go to{" "}
                <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline">
                  console.cloud.google.com/google/maps-apis
                </a>{" "}
                → create a project.
              </li>
              <li>Enable <span className="font-medium text-ink">&quot;Places API (New)&quot;</span> and turn on billing (Google gives $200/mo free — thousands of searches).</li>
              <li>APIs &amp; Services → Credentials → <span className="font-medium text-ink">Create credentials → API key</span>. Copy it.</li>
              <li>Paste it in the box above. It&apos;s stored only in this browser and used for your searches. (Restrict it to Places API in Google for safety.)</li>
            </ol>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => setShowImport((v) => !v)} className={ghost}>
            <Upload className="h-3.5 w-3.5" /> Import CSV / paste
          </button>
          <button onClick={exportCSV} className={ghost}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={() => copyText(toTSV(rows.filter((r) => r.business.trim())), "Sheet")} className={ghost}>
            <Copy className="h-3.5 w-3.5" /> Copy for Google Sheets
          </button>
          <button onClick={syncYC} className={ghost}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Sync to YC tracker
          </button>
        </div>

        {findMsg && <p className="mt-2 text-xs text-ink-faint">{findMsg}</p>}
        <p className="mt-1 text-[11px] text-ink-faint">
          With a Google Maps key you get 30–60 real businesses per search (phone, website, rating).
          Without one, the free source is thin — use <span className="font-medium">Open in Google Maps</span>{" "}
          + <span className="font-medium">Import CSV / paste</span>. Never invents businesses; missing
          owner/email shows blank or &quot;Unknown&quot;.
        </p>

        {showImport && (
          <div className="mt-3 rounded-xl border border-line bg-paper/60 p-3">
            <p className="mb-1 text-xs text-ink-soft">
              Paste rows from Google Maps / a scrape / a spreadsheet. With a header row we map columns
              automatically; without one, the first column is the business name and we detect
              phone/email/website.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={5}
              placeholder={"Business, Phone, Website, Address\nAce HVAC, (239) 555-0100, acehvac.com, Fort Myers FL"}
              className="w-full resize-y rounded-lg border border-line bg-white p-2 font-mono text-xs text-ink outline-none focus:border-brand-500"
            />
            <div className="mt-2 flex gap-2">
              <button onClick={doImport} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                Import rows
              </button>
              <button onClick={() => setShowImport(false)} className={ghost}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* preview of found */}
        {found.length > 0 && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-ink">{found.length} found</span>
              <button onClick={addPicked} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
                Add selected ({picked.size})
              </button>
              <button onClick={() => addProspects(found.map((p) => ({ ...p, trade: p.trade || trade })))} className={ghost}>
                Add all
              </button>
              <button onClick={() => { setFound([]); setPicked(new Set()); }} className={ghost}>
                <Trash2 className="h-3.5 w-3.5" /> Clear results
              </button>
            </div>
            <div className="max-h-64 overflow-auto rounded-lg border border-line bg-white scroll-slim">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-paper/90 text-left text-xs text-ink-faint">
                  <tr>
                    <th className="w-8 px-2 py-1.5"></th>
                    <th className="px-2 py-1.5">Business</th>
                    <th className="px-2 py-1.5">Phone</th>
                    <th className="px-2 py-1.5">Website</th>
                    <th className="px-2 py-1.5">Rating</th>
                    <th className="px-2 py-1.5">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {found.map((p) => (
                    <tr key={p.id} className="border-t border-line/60">
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={picked.has(p.id)}
                          onChange={(e) =>
                            setPicked((s) => {
                              const n = new Set(s);
                              if (e.target.checked) n.add(p.id);
                              else n.delete(p.id);
                              return n;
                            })
                          }
                          className="h-4 w-4 accent-brand-500"
                        />
                      </td>
                      <td className="px-2 py-1 font-medium text-ink">{p.business}</td>
                      <td className="px-2 py-1 text-ink-soft">{p.phone || "—"}</td>
                      <td className="max-w-[160px] truncate px-2 py-1 text-ink-soft">{p.website || "—"}</td>
                      <td className="px-2 py-1 text-ink-soft">{p.rating ? `${p.rating}★ (${p.reviews || "?"})` : "—"}</td>
                      <td className="px-2 py-1 text-ink-faint">{p.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Live Call Copilot */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
          Live Call Copilot
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            guided cold calls
          </span>
        </h3>
        <CallCopilot prospects={rows} onUpdate={update} />
      </section>

      {/* Summary */}
      <section>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <Stat label="Prospects" value={summary.total} />
          <Stat label="Contacted" value={summary.contacted} sub={`${summary.contactRate}%`} />
          <Stat label="Replied" value={summary.replied} sub={`${summary.replyRate}%`} />
          <Stat label="Demos booked" value={summary.demoBooked} sub={`${summary.demoRate}%`} good />
          <Stat label="Demos done" value={summary.demoCompleted} good />
          <Stat label="Pilots" value={summary.pilotStarted} good />
          <Stat label="Paying" value={summary.paying} good />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3 text-xs shadow-card">
          <span className="font-semibold text-ink">Today&apos;s remaining:</span>
          <Remaining label="contacted" have={summary.contacted} target={TARGETS.contacted} />
          <Remaining label="calls" have={summary.called} target={TARGETS.called} />
          <Remaining label="emails" have={summary.emailed} target={TARGETS.emailed} />
          <Remaining label="SMS/DMs" have={summary.sms} target={TARGETS.sms} />
          <Remaining label="demos" have={summary.demoBooked} target={TARGETS.demoBooked} />
          <Remaining label="pilot ask" have={summary.pilotStarted} target={TARGETS.pilotStarted} />
        </div>
      </section>

      {/* Spreadsheet */}
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-ink">Outreach spreadsheet</h3>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            className={cn(inputCls, "h-8 w-40 py-1")}
          />
          <span className="text-xs text-ink-faint">{visible.length} shown</span>
          <div className="ml-auto flex gap-2">
            <button onClick={addBlank} className={ghost}><Plus className="h-3.5 w-3.5" /> Row</button>
            <button onClick={resetAll} className={ghost}><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line bg-white scroll-slim">
          <table className="min-w-max border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/70 text-left text-[11px] text-ink-faint">
                <th className="sticky left-0 z-10 bg-paper/95 px-2 py-2">Actions</th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="cursor-pointer select-none whitespace-nowrap px-2 py-2 font-medium hover:text-ink"
                    title="Click to sort"
                  >
                    {c.label}
                    {sortKey === c.key ? (sortDir === 1 ? " ▲" : " ▼") : ""}
                  </th>
                ))}
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-b border-line/60 align-top">
                  <td className="sticky left-0 z-10 bg-white px-1 py-1">
                    <RowActions p={p} update={update} copyText={copyText} />
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <Cell p={p} col={c} update={update} />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <button onClick={() => removeRow(p.id)} title="Delete row" className="text-ink-faint hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Saves automatically in this browser (localStorage). Export CSV before switching devices.
          Click a header to sort. Actions: Call / Email / Website / Copy cold email / Copy SMS / quick
          mark contacted, demo, pilot.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------- cells -------------------------------- */

function Cell({
  p,
  col,
  update,
}: {
  p: Prospect;
  col: (typeof COLUMNS)[number];
  update: (id: string, patch: Partial<Prospect>) => void;
}) {
  const v = p[col.key];
  if (col.kind === "bool") {
    return (
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={Boolean(v)}
          onChange={(e) => update(p.id, { [col.key]: e.target.checked } as Partial<Prospect>)}
          className="h-4 w-4 accent-brand-500"
        />
      </div>
    );
  }
  if (col.kind === "status") {
    return (
      <select
        value={String(v)}
        onChange={(e) => update(p.id, { status: e.target.value as Prospect["status"] })}
        className="rounded border border-line bg-white px-1 py-1 text-xs text-ink outline-none focus:border-brand-500"
      >
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    );
  }
  if (col.kind === "date") {
    return (
      <input
        type="date"
        value={String(v)}
        onChange={(e) => update(p.id, { followUp: e.target.value })}
        className="rounded px-1 py-1 text-xs text-ink outline-none focus:bg-brand-50"
      />
    );
  }
  return (
    <input
      value={String(v)}
      onChange={(e) => update(p.id, { [col.key]: e.target.value } as Partial<Prospect>)}
      style={{ width: col.width ?? 120 }}
      className="rounded px-1.5 py-1 text-sm text-ink outline-none focus:bg-brand-50"
    />
  );
}

function RowActions({
  p,
  update,
  copyText,
}: {
  p: Prospect;
  update: (id: string, patch: Partial<Prospect>) => void;
  copyText: (text: string, label: string) => void;
}) {
  const tel = p.phone.replace(/[^\d+]/g, "");
  const site = p.website ? (p.website.startsWith("http") ? p.website : `https://${p.website}`) : "";
  return (
    <div className="flex items-center gap-0.5">
      <IconLink href={tel ? `tel:${tel}` : undefined} title="Call" onClick={() => update(p.id, { called: true, contacted: true })}>
        <Phone className="h-3.5 w-3.5" />
      </IconLink>
      <IconLink
        href={p.email ? `mailto:${p.email}` : undefined}
        title="Email"
        onClick={() => update(p.id, { emailed: true, contacted: true })}
      >
        <Mail className="h-3.5 w-3.5" />
      </IconLink>
      <IconLink href={site || undefined} title="Open website" external>
        <Globe className="h-3.5 w-3.5" />
      </IconLink>
      <IconBtn title="Copy cold email" onClick={() => copyText(coldEmail(p), "Cold email")}>
        <Mail className="h-3.5 w-3.5 text-brand-600" />
      </IconBtn>
      <IconBtn title="Copy SMS" onClick={() => copyText(coldSMS(p), "SMS")}>
        <MessageSquare className="h-3.5 w-3.5 text-brand-600" />
      </IconBtn>
      <IconBtn title="Mark contacted" onClick={() => update(p.id, { contacted: true, status: p.status === "New" ? "Contacted" : p.status })}>
        <span className="text-[10px] font-bold text-ink-faint">C</span>
      </IconBtn>
      <IconBtn title="Mark demo booked" onClick={() => update(p.id, { demoBooked: true, contacted: true, status: "Demo booked" })}>
        <span className="text-[10px] font-bold text-ink-faint">D</span>
      </IconBtn>
      <IconBtn title="Mark pilot started" onClick={() => update(p.id, { pilotStarted: true, pilotOffered: true, status: "Pilot" })}>
        <span className="text-[10px] font-bold text-brand-600">P</span>
      </IconBtn>
    </div>
  );
}

function IconLink({
  href,
  title,
  onClick,
  external,
  children,
}: {
  href?: string;
  title: string;
  onClick?: () => void;
  external?: boolean;
  children: React.ReactNode;
}) {
  const cls = cn(
    "flex h-6 w-6 items-center justify-center rounded transition",
    href ? "text-ink-soft hover:bg-paper" : "cursor-not-allowed text-ink-faint/30"
  );
  if (!href) return <span className={cls} title={`${title} (none)`}>{children}</span>;
  return (
    <a
      href={href}
      title={title}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cls}
    >
      {children}
    </a>
  );
}
function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className="flex h-6 w-6 items-center justify-center rounded text-ink-soft transition hover:bg-paper">
      {children}
    </button>
  );
}

function Stat({ label, value, sub, good }: { label: string; value: number; sub?: string; good?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-card">
      <div className="text-[11px] text-ink-faint">{label}</div>
      <div className={cn("text-xl font-bold", good ? "text-brand-600" : "text-ink")}>
        {value}
        {sub && <span className="ml-1 text-[11px] font-normal text-ink-faint">{sub}</span>}
      </div>
    </div>
  );
}
function Remaining({ label, have, target }: { label: string; have: number; target: number }) {
  const left = Math.max(0, target - have);
  const done = left === 0;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 font-medium",
        done ? "bg-brand-50 text-brand-700" : "bg-ink/5 text-ink-soft"
      )}
    >
      {done ? "✓" : left} {label}
    </span>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint/70 focus:border-brand-500";
const ghost =
  "inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-ink-faint/40";
