"use client";
/** The two evidence actions: fetch the exchanges' own prices, and run the historical validation. */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

async function post(url: string, body: object) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  if (!r) return { ok: false, error: "The server did not respond." };
  const j = await r.json().catch(() => ({})) as { error?: string };
  return r.ok ? { ok: true, body: j } : { ok: false, error: j.error ?? `HTTP ${r.status}` };
}

export function OfficialControl() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className="btn btn-primary self-start" disabled={busy} onClick={async () => {
        setBusy(true); setNote(null);
        const r = await post("/api/stocks/official", {});
        setBusy(false);
        if (!r.ok) { setNote(r.error ?? "The download failed."); return; }
        const report = (r.body as { report: { exchange: string; ok: boolean; tradeDate?: string; rows?: number; error?: string }[] }).report;
        setNote(report.map((x) => x.ok ? `${x.exchange.toUpperCase()} ${x.tradeDate}: ${x.rows?.toLocaleString("en-IN")} rows` : `${x.exchange.toUpperCase()}: ${x.error}`).join(". "));
        router.refresh();
      }}>{busy ? "Downloading…" : "Download the latest official prices"}</button>
      <p className="text-[12px] text-muted">One published file from each exchange, fetched only when you ask, stored in your database.</p>
      {note && <p role="status" className="text-[13px]">{note}</p>}
    </div>
  );
}

type Run = { status: string; total: number; done: number; failed: number; observations: number; error: string | null } | null;

export function BacktestControl({ initial }: { initial: { running: boolean; run: Run } }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(async () => {
      const r = await fetch("/api/stocks/backtest", { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const next = await r.json() as typeof initial;
      setState(next);
      if (!next.running) router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [state.running, router]);
  const run = state.run;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {state.running ? (
          <button type="button" className="btn btn-secondary" onClick={async () => { await post("/api/stocks/backtest", { action: "stop" }); }}>Stop the run</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={async () => {
            setError(null);
            const r = await post("/api/stocks/backtest", { action: "start", sample: 150 });
            if (!r.ok) { setError(r.error ?? "It could not start."); return; }
            setState({ running: true, run: { status: "running", total: 150, done: 0, failed: 0, observations: 0, error: null } });
          }}>Run the historical validation</button>
        )}
      </div>
      {run && (state.running || run.status !== "complete") && (
        <p role="status" className="num text-[13px] text-muted">
          {run.status === "running" ? `Reading ${run.done} of ${run.total} companies, ${run.observations.toLocaleString("en-IN")} observations so far. About a second a company.` : `${run.status}: ${run.error ?? ""}`}
        </p>
      )}
      {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
    </div>
  );
}

type BseJob = { running: boolean; phase: "files" | "actions" | null; done: number; total: number; failedDates: string[]; error: string | null };

export function BseHistoryControl({ initial }: { initial: BseJob }) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!job.running) return;
    const t = setInterval(async () => {
      const r = await fetch("/api/stocks/official").then((x) => x.json()).catch(() => null) as { bse?: BseJob } | null;
      if (!r?.bse) return;
      setJob(r.bse);
      if (!r.bse.running) router.refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [job.running, router]);
  const act = async (action: string) => {
    setError(null);
    const r = await post("/api/stocks/official", { action });
    if (!r.ok) { setError(r.error ?? "The request failed."); return; }
    setJob((j) => ({ ...j, running: action === "bse-history", phase: action === "bse-history" ? "files" : j.phase }));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {!job.running && <button type="button" className="btn btn-primary" onClick={() => act("bse-history")}>Build a year of BSE-only history</button>}
        {job.running && <button type="button" className="btn" onClick={() => act("bse-stop")}>Stop</button>}
      </div>
      <p className="text-[12px] text-muted">Downloads BSE&apos;s own file for each of the last 260 sessions, one every 1.5 seconds (about 10 minutes), then reads corporate actions for the liquid companies.</p>
      {job.running && <p role="status" className="num text-[13px]">{job.phase === "files" ? `Session files: ${job.done} of ${job.total}` : `Corporate actions: ${job.done} of ${job.total} companies`}</p>}
      {job.failedDates.length > 0 && <p className="text-[13px] text-warning">{job.failedDates.length} session files failed to download ({job.failedDates.slice(0, 5).join(", ")}{job.failedDates.length > 5 ? "…" : ""}); readings that span them may miss a day.</p>}
      {(error || job.error) && <p role="alert" className="text-[13px] text-negative">{error ?? job.error}</p>}
    </div>
  );
}
