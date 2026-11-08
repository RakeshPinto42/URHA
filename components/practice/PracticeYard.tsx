"use client";
/**
 * The Practice yard: write Python, pandas or SQL against the group's books, run it here, and see it
 * checked. Every run is saved to URHA's database with the rest of your progress; an unsaved draft
 * is also kept in this browser, so an accidental reload loses nothing.
 */
import Link from "next/link";
import type { MarketData } from "@/lib/practice/market";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DISCIPLINE_LABEL, LEVEL_LABEL, type Discipline, type PublicExercise } from "@/lib/practice/exercises";
import { TIME_LIMIT_S, usePython, type RunResult } from "./runner";

export type Status = { attempts: number; passed: boolean; lastCode: string | null; bestChecks: number; checksTotal: number };
type Item = PublicExercise & { scratch?: boolean };

const DRAFT = (id: string) => `urha.practice.${id}`;
const read = (key: string): string | null => { try { return window.localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string | null) => {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* the database keeps every run */ }
};

const datasets = new Map<string, Promise<string>>();
function dataset(name: string): Promise<string> {
  let p = datasets.get(name);
  if (!p) {
    p = fetch(`/practice/data/${encodeURIComponent(name)}`).then((r) => { if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r.text(); });
    p = p.catch((e) => {
      datasets.delete(name);
      if (name === "market_prices.csv") throw new Error("The real NSE price file is not built on this machine yet. Run npm run practice:market, then try again.");
      throw e;
    });
    datasets.set(name, p);
  }
  return p;
}

const ORDER: Discipline[] = ["python", "sql", "pandas", "data", "ai", "finance"];

export function PracticeYard({ exercises, scratchpad, scratchData, topics, initialStatus, initial, market }: {
  exercises: PublicExercise[]; scratchpad: string; scratchData: string[]; topics: Record<string, string>;
  initialStatus: Record<string, Status>; initial: string | null;
  market: MarketData;
}) {
  const scratch: Item = useMemo(() => ({
    id: "scratchpad", scratch: true, discipline: "python", level: "foundation", topicId: "", language: "python", title: "Scratchpad",
    brief: "A free space with pandas loaded and the main datasets in the working folder. Nothing is checked or saved.", datasets: scratchData, starter: scratchpad, checks: "", hints: [], explanation: "",
  }), [scratchpad, scratchData]);
  const items: Item[] = useMemo(() => [scratch, ...exercises], [scratch, exercises]);
  const [status, setStatus] = useState(initialStatus);
  // The next step: not yet passed, with everything it builds on passed first.
  const ready = (e: PublicExercise) => (e.after ?? []).every((a) => status[a]?.passed);
  const recommended = exercises.find((e) => !status[e.id]?.passed && ready(e)) ?? exercises.find((e) => !status[e.id]?.passed) ?? null;
  const [current, setCurrent] = useState(() => items.find((i) => i.id === initial)?.id ?? recommended?.id ?? "scratchpad");
  const item = items.find((i) => i.id === current)!;
  const [code, setCode] = useState(item.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [hints, setHints] = useState(0);
  const [explain, setExplain] = useState(false);
  const [preview, setPreview] = useState<{ name: string; text: string } | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const { state, run, restart } = usePython();
  const editor = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(read(DRAFT(item.id)) ?? status[item.id]?.lastCode ?? item.starter);
    setResult(null); setHints(0); setExplain(false); setPreview(null); setSaveNote(null);
    const url = new URL(window.location.href);
    url.searchParams.set("c", item.id);
    window.history.replaceState(null, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const change = (next: string) => { setCode(next); write(DRAFT(item.id), next === item.starter ? null : next); };

  const go = useCallback(async () => {
    if (state.phase !== "ready") return;
    let files: Record<string, string>;
    try {
      files = Object.fromEntries(await Promise.all(item.datasets.map(async (n) => [n, await dataset(n)] as const)));
    } catch (e) {
      setResult({ output: "", clipped: false, error: `The data could not load: ${e instanceof Error ? e.message : String(e)}`, seconds: 0, results: [], memoryMb: 0 });
      return;
    }
    Object.assign(files, item.files ?? {});
    const r = await run(item.language === "sql" ? { sql: code } : { code }, files, item.checks || null);
    setResult(r);
    if (item.scratch || r.stopped) return;
    const passed = r.results.length > 0 && r.results.every((x) => x.passed);
    const res = await fetch("/api/practice/attempts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: item.id, passed, checksPassed: r.results.filter((x) => x.passed).length, checksTotal: r.results.length, seconds: Math.min(r.seconds, 600), code }),
    }).catch(() => null);
    if (!res?.ok) { setSaveNote("This run could not be saved to your progress. Your draft is still kept in this browser."); return; }
    const body = await res.json().catch(() => null) as { status?: Status } | null;
    if (body?.status) {
      setStatus((s) => ({ ...s, [item.id]: body.status! }));
      write(DRAFT(item.id), null); // Saved: the database now holds the latest code.
      setSaveNote(passed ? "Passed, and saved to your progress." : "Saved to your progress.");
      if (passed) setExplain(true);
    }
  }, [state.phase, run, code, item]);

  const keys = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); void go(); return; }
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const t = e.currentTarget, s = t.selectionStart, end = t.selectionEnd;
      change(`${code.slice(0, s)}    ${code.slice(end)}`);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; });
    }
    if (e.key === "Escape") e.currentTarget.blur();
  };

  const showData = async (name: string) => {
    if (preview?.name === name) { setPreview(null); return; }
    const text = item.files?.[name] ?? await dataset(name).catch(() => "This file could not load.");
    const lines = text.split("\n");
    setPreview({ name, text: lines.slice(0, 30).join("\n") + (lines.length > 31 ? `\n… ${lines.length - 1} lines in all` : "") });
  };

  const lines = code.split("\n").length;
  const allPassed = result && result.results.length > 0 && result.results.every((r) => r.passed);
  const s = status[item.id];
  const passedCount = exercises.filter((e) => status[e.id]?.passed).length;

  return (
    <div className="practice grid grid-cols-1 gap-8 lg:grid-cols-12">
      <nav aria-label="Practice exercises" className="lg:col-span-3">
        <p className="num text-[13px] text-muted">{passedCount} of {exercises.length} passed</p>
        {recommended && (
          <button type="button" onClick={() => setCurrent(recommended.id)} className="practice__next">
            <span className="text-[12px] text-muted">Recommended next</span>
            <span className="text-[14px] font-medium">{recommended.title}</span>
          </button>
        )}
        <button type="button" aria-current={current === "scratchpad" ? "true" : undefined} onClick={() => setCurrent("scratchpad")} className="practice__item mt-3">Scratchpad</button>
        {ORDER.map((d) => (
          <div key={d} className="mt-4">
            <h2 className="font-display text-[17px]">{DISCIPLINE_LABEL[d]}</h2>
            <ul className="mt-1">
              {exercises.filter((e) => e.discipline === d).map((e) => {
                const st = status[e.id];
                return (
                  <li key={e.id}>
                    <button type="button" aria-current={current === e.id ? "true" : undefined} onClick={() => setCurrent(e.id)} className="practice__item">
                      <span aria-hidden="true" className={`practice__dot practice__dot--${e.level}`} title={LEVEL_LABEL[e.level]} />
                      <span className="min-w-0 flex-1 text-left">{e.title}<span className="sr-only">, {LEVEL_LABEL[e.level]}</span></span>
                      {st?.passed ? <span className="practice__pass">Passed</span> : st ? <span className="practice__tried" title={`${st.attempts} attempts, best ${st.bestChecks} of ${st.checksTotal} checks`}>{st.bestChecks}/{st.checksTotal}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="mt-6 text-[12px] text-muted">Dots show the level: <span className="practice__dot practice__dot--foundation" /> foundation, <span className="practice__dot practice__dot--intermediate" /> intermediate, <span className="practice__dot practice__dot--advanced" /> advanced.</p>
      </nav>

      <section aria-labelledby="exercise-h" className="min-w-0 lg:col-span-9">
        <p className="text-[13px] text-muted">
          {item.scratch ? "Free practice" : <>{DISCIPLINE_LABEL[item.discipline]} · {LEVEL_LABEL[item.level]}{item.topicId && topics[item.topicId] ? <> · trains <Link href={`/academy/${item.topicId}`} className="underline decoration-control underline-offset-4">{topics[item.topicId]}</Link></> : null}</>}
        </p>
        <h2 id="exercise-h" className="mt-1 font-display text-[30px] leading-tight">{item.title}</h2>
        <p className="mt-2 max-w-[74ch] text-[15px] leading-relaxed">{item.brief}</p>
        {!item.scratch && (item.after ?? []).length > 0 && (
          <p className="mt-2 text-[13px]">
            <span className="text-muted">Builds on:</span>{" "}
            {(item.after ?? []).map((a, i) => { const pre = exercises.find((e) => e.id === a); return pre ? <span key={a}>{i > 0 ? ", " : ""}<button type="button" className="underline decoration-control underline-offset-4" onClick={() => setCurrent(a)}>{pre.title}</button>{status[a]?.passed ? " ✓" : ""}</span> : null; })}
            {!ready(item) && <span className="text-muted">. Pass these first for the intended order; you can still try this now.</span>}
          </p>
        )}
        {item.market && (market.available
          ? <p className="num mt-1 text-[13px] text-muted">Real NSE prices from TejHQ, the same source Rare Stocks reads, {market.first} to {market.last}. adj_close is adjusted for bonuses and splits; dividends are not.
              {market.weekdaysOld > 5 && <span className="block text-warning">These prices end {market.weekdaysOld} weekdays ago. The checks still work on them; run npm run practice:market to bring them up to date.</span>}</p>
          : <p role="status" className="mt-1 text-[13px] text-warning">This exercise uses real NSE prices, which are not built on this machine yet. Run npm run practice:market (it reads TejHQ, about 15 seconds), then reload.</p>)}
        {s && !item.scratch && <p className="num mt-1 text-[13px] text-muted">{s.passed ? "Passed" : "Not passed yet"} · {s.attempts} {s.attempts === 1 ? "run" : "runs"} saved</p>}
        {(item.datasets.length > 0 || item.files) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-muted">Data (synthetic):</span>
            {[...item.datasets, ...Object.keys(item.files ?? {})].map((f) => (
              <button key={f} type="button" className="chip" aria-expanded={preview?.name === f} onClick={() => void showData(f)}>{f}</button>
            ))}
          </div>
        )}
        {preview && <pre className="practice__data" tabIndex={0} aria-label={`The first lines of ${preview.name}`}>{preview.text}</pre>}

        <div className="practice__editor mt-4" data-language={item.language}>
          <div aria-hidden="true" className="practice__gutter">{Array.from({ length: lines }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
          <textarea ref={editor} value={code} onChange={(e) => change(e.target.value)} onKeyDown={keys} spellCheck={false} autoCapitalize="off" autoCorrect="off"
            aria-label={`${item.language === "sql" ? "SQL" : "Python"} for ${item.title}. Ctrl and Enter runs it; Escape leaves the editor.`} rows={Math.max(12, Math.min(lines + 2, 32))} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={() => void go()} disabled={state.phase !== "ready"}>{state.phase === "running" ? "Running…" : "Run"}</button>
          <button type="button" className="btn btn-secondary" onClick={() => change(item.starter)} disabled={code === item.starter}>Reset to the starter</button>
          {item.hints.length > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => setHints((n) => Math.min(n + 1, item.hints.length))} disabled={hints >= item.hints.length}>
              {hints === 0 ? "Show a hint" : hints < item.hints.length ? `Another hint (${hints + 1} of ${item.hints.length})` : "No more hints"}
            </button>
          )}
          <span role="status" className="text-[13px] text-muted">
            {state.phase === "failed" ? <span className="text-negative">{state.detail}</span> : state.phase === "starting" ? state.detail : `${state.detail}. Runs stop after ${TIME_LIMIT_S} s.`}
          </span>
          {state.phase === "failed" && <button type="button" className="btn btn-text" onClick={restart}>Try again</button>}
        </div>

        {hints > 0 && (
          <ol className="practice__hints mt-4">
            {item.hints.slice(0, hints).map((h, i) => <li key={i}><span className="text-muted">Hint {i + 1}.</span> {h}</li>)}
          </ol>
        )}

        {result && (
          <div className="mt-5" aria-live="polite">
            {result.results.length > 0 && (
              <section aria-label="Checks" className="practice__checks">
                <p className={`font-medium ${allPassed ? "text-positive" : ""}`}>{allPassed ? "Every check passes." : `${result.results.filter((r) => r.passed).length} of ${result.results.length} checks pass.`}</p>
                <ul className="mt-2 flex flex-col gap-1.5 text-[14px]">
                  {result.results.map((r) => (
                    <li key={r.label} className="flex gap-2">
                      <span aria-hidden="true" className={r.passed ? "text-positive" : "text-negative"}>{r.passed ? "✓" : "✗"}</span>
                      <span>{r.label}{!r.passed && r.hint ? <span className="text-muted">. {r.hint}</span> : null}<span className="sr-only">{r.passed ? ", passed" : ", not yet"}</span></span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {result.stopped && <p className="mt-3 text-[14px] text-negative">{result.stopped}</p>}
            {result.error && <pre className="practice__out practice__out--error" tabIndex={0} aria-label="Error">{result.error}</pre>}
            {(result.output || (!result.error && !result.stopped)) && (
              <pre className="practice__out" tabIndex={0} aria-label="Output">{result.output || "No output. Use print() to see values."}{result.clipped ? "\n… output cut off here" : ""}</pre>
            )}
            {!result.stopped && <p className="num mt-1 text-[12px] text-muted">Ran in {result.seconds.toFixed(2)} s{saveNote ? `. ${saveNote}` : ""}</p>}
          </div>
        )}

        {!item.scratch && (
          <section aria-label="Explanation" className="mt-6">
            {explain ? (
              <div className="practice__explain">
                <h3 className="font-display text-[19px]">Why this matters</h3>
                <p className="mt-1 max-w-[74ch] text-[15px] leading-relaxed">{item.explanation}</p>
              </div>
            ) : (
              <button type="button" className="btn btn-text" onClick={() => setExplain(true)}>Show the explanation</button>
            )}
          </section>
        )}
      </section>
    </div>
  );
}
