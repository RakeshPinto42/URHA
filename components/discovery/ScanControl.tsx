"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ScanRow } from "@/lib/stocks/store";

type State = { running: boolean; scan: ScanRow | null };

/** Starts the market scan and follows it. It runs on the server, so leaving the page is fine. */
export function ScanControl({ initial }: { initial: State }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wasRunning = useRef(initial.running);

  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(async () => {
      const r = await fetch("/api/stocks/scan", { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const next = (await r.json()) as State;
      setState(next);
      if (wasRunning.current && next.running) router.refresh(); // New rows appear as they arrive.
      if (!next.running) { wasRunning.current = false; router.refresh(); }
    }, 5000);
    return () => clearInterval(id);
  }, [state.running, router]);

  const send = async (body: object) => {
    setBusy(true); setError(null);
    const r = await fetch("/api/stocks/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", ...body }) }).catch(() => null);
    setBusy(false);
    if (!r) { setError("The app's server did not respond."); return; }
    if (!r.ok) { setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "The scan could not start."); return; }
    wasRunning.current = true;
    setState((s) => ({ ...s, running: !("action" in body && (body as { action: string }).action === "stop") }));
  };

  const s = state.scan;
  const pct = s && s.total > 0 ? Math.min(100, Math.floor((s.done / s.total) * 100)) : 0;
  return (
    <div className="card-row flex h-full flex-col gap-2 p-4">
      <p className="text-[14px] font-semibold">Market scan</p>
      {state.running && s ? (
        <>
          <p className="num text-[14px]">Reading {s.done.toLocaleString("en-IN")} of {s.total.toLocaleString("en-IN")} companies</p>
          <span role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Scan progress" className="block h-2 overflow-hidden rounded-full bg-control/40"><span className="block h-full bg-accent" style={{ width: `${pct}%` }} /></span>
          <p className="text-[12px] text-muted">Runs at the source's published pace. You can leave this page.</p>
          <button type="button" className="btn btn-secondary self-start" disabled={busy} onClick={() => void send({ action: "stop" })}>Stop scan</button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-muted">
            {s ? `Last scan: trading day ${s.trading_date}, ${s.done.toLocaleString("en-IN")} of ${s.total.toLocaleString("en-IN")} read${s.failed ? `, ${s.failed} unavailable` : ""}.${s.status === "stopped" ? ` Stopped: ${s.error ?? "unknown reason"}. Starting again continues where it left off.` : ""}` : "Not run yet. It first works out which companies are eligible, then reads each one, which takes about 30 minutes."}
          </p>
          <button type="button" className="btn btn-primary self-start" disabled={busy} onClick={() => void send({})}>{busy ? "Starting…" : s ? "Scan again" : "Run market scan"}</button>
        </>
      )}
      {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
    </div>
  );
}
