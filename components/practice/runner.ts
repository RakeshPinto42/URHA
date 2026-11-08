"use client";
/**
 * Talks to the Python worker (public/python/worker.js). The page owns the limits: a run that
 * passes its time limit gets the whole worker killed and a fresh one started, and a worker
 * whose memory has grown too large is replaced after it answers.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SQL_HARNESS } from "@/lib/practice/harness";

export type CheckResult = { label: string; passed: boolean; hint: string };
export type RunResult = { output: string; clipped: boolean; error: string | null; seconds: number; results: CheckResult[]; memoryMb: number; stopped?: string };
export type RunnerState = { phase: "starting" | "ready" | "running" | "failed"; detail: string };

export const TIME_LIMIT_S = 12;
const MEMORY_LIMIT_MB = 900;

export function usePython() {
  const worker = useRef<Worker | null>(null);
  const pending = useRef<{ id: number; resolve: (r: RunResult) => void; timer: ReturnType<typeof setTimeout> } | null>(null);
  const seq = useRef(0);
  const [state, setState] = useState<RunnerState>({ phase: "starting", detail: "Starting Python…" });

  const boot = useCallback(() => {
    worker.current?.terminate();
    setState({ phase: "starting", detail: "Starting Python…" });
    let w: Worker;
    try {
      w = new Worker("/python/worker.js", { type: "module", name: "urha-python" });
    } catch (e) {
      setState({ phase: "failed", detail: `Python could not start in this browser: ${e instanceof Error ? e.message : String(e)}` });
      return;
    }
    worker.current = w;
    w.onmessage = (e: MessageEvent) => {
      const m = e.data as { type?: string; id?: number; versions?: string; seconds?: number; error?: string } & Partial<RunResult>;
      if (m.type === "ready") setState({ phase: "ready", detail: `${m.versions}, ready in ${m.seconds?.toFixed(1)} s` });
      else if (m.type === "failed") setState({ phase: "failed", detail: `Python could not start: ${m.error}` });
      else if (m.type === "result" && pending.current?.id === m.id) {
        const p = pending.current!;
        pending.current = null;
        clearTimeout(p.timer);
        const result: RunResult = {
          output: String(m.output ?? ""), clipped: !!m.clipped, error: m.error ?? null, seconds: Number(m.seconds ?? 0),
          results: Array.isArray(m.results) ? m.results : [], memoryMb: Number(m.memoryMb ?? 0),
        };
        p.resolve(result);
        if (result.memoryMb > MEMORY_LIMIT_MB) boot(); // The next run starts clean.
        else setState((s) => ({ ...s, phase: "ready" }));
      }
    };
    w.onerror = (e) => {
      e.preventDefault();
      const p = pending.current;
      pending.current = null;
      if (p) { clearTimeout(p.timer); p.resolve({ output: "", clipped: false, error: null, seconds: 0, results: [], memoryMb: 0, stopped: "Python stopped unexpectedly, most likely out of memory. It has been restarted." }); boot(); }
      else setState({ phase: "failed", detail: "Python could not start. Run npm run python:fetch, then reload." });
    };
  }, []);

  useEffect(() => {
    boot();
    return () => { worker.current?.terminate(); worker.current = null; };
  }, [boot]);

  /** Python runs as written; SQL runs through the shared harness, with the query passed in. */
  const run = useCallback((input: { code: string } | { sql: string }, files: Record<string, string>, checks: string | null): Promise<RunResult> => {
    const code = "sql" in input ? SQL_HARNESS : input.code;
    const sql = "sql" in input ? input.sql : null;
    const w = worker.current;
    if (!w) return Promise.resolve({ output: "", clipped: false, error: "Python is not running.", seconds: 0, results: [], memoryMb: 0 });
    const id = ++seq.current;
    setState((s) => ({ ...s, phase: "running" }));
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (pending.current?.id !== id) return;
        pending.current = null;
        resolve({ output: "", clipped: false, error: null, seconds: TIME_LIMIT_S, results: [], memoryMb: 0, stopped: `Stopped after ${TIME_LIMIT_S} seconds. Look for a loop that never ends. Python is restarting.` });
        boot();
      }, TIME_LIMIT_S * 1000);
      pending.current = { id, resolve, timer };
      w.postMessage({ type: "run", id, code, sql, files, checks });
    });
  }, [boot]);

  return { state, run, restart: boot };
}
