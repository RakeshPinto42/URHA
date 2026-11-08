/**
 * The historical validation job: reads about ten years of real prices for a random sample of
 * today's listed companies, runs the verdicts walk-forward (lib/stocks/backtest.ts), and stores
 * the result. Runs in the server process, like the scan, and saves its progress as it goes.
 */
import "server-only";
import { getDb } from "../db";
import { DEFAULT_PARAMS, evaluationDates, observe, sampleOf, summarise, type BacktestParams, type Observation, type VerdictStats } from "./backtest";
import { readBars } from "./scan";
import { fetchStatus, fetchUniverse } from "./tejhq";
import { instrumentOf } from "./universe";

/** Nifty 50 through an ETF with history back to 2002: the Nifty 500 ETF used elsewhere only starts in 2023. */
export const BACKTEST_BENCHMARK = { symbol: "NIFTYBEES", label: "Nippon India ETF Nifty 50 BeES" };

const job = ((globalThis as { __urhaBacktest?: { running: Promise<void> | null; cancelled: boolean } }).__urhaBacktest ??= { running: null, cancelled: false });

export type BacktestRow = {
  id: number; status: "running" | "complete" | "stopped" | "failed"; params: BacktestParams & { sample: number; benchmark: string; universe?: number; calendar?: { dates: number; first: string | null; last: string | null; horizon: number; step: number } };
  total: number; done: number; failed: number; observations: number; results: VerdictStats[] | null; error: string | null; started_at: string; finished_at: string | null;
};

export function latestBacktest(): BacktestRow | null {
  const r = getDb().prepare("SELECT * FROM stock_backtests ORDER BY id DESC LIMIT 1").get() as (Omit<BacktestRow, "params" | "results"> & { params: string; results: string | null }) | undefined;
  return r ? { ...r, params: JSON.parse(r.params), results: r.results ? JSON.parse(r.results) : null } : null;
}

/** The most recent finished run's verdict statuses, for labelling verdicts on the board. */
export function verdictEvidence(): BacktestRow | null {
  const r = getDb().prepare("SELECT * FROM stock_backtests WHERE status = 'complete' ORDER BY id DESC LIMIT 1").get() as (Omit<BacktestRow, "params" | "results"> & { params: string; results: string | null }) | undefined;
  return r ? { ...r, params: JSON.parse(r.params), results: r.results ? JSON.parse(r.results) : null } : null;
}

export const backtestState = () => ({ running: job.running !== null, run: latestBacktest() });

async function run(id: number, symbols: string[], p: BacktestParams) {
  const db = getDb();
  const update = db.prepare("UPDATE stock_backtests SET done = ?, failed = ?, observations = ? WHERE id = ?");
  const finish = db.prepare("UPDATE stock_backtests SET status = ?, results = ?, error = ?, finished_at = datetime('now') WHERE id = ?");
  const bench = await readBars(BACKTEST_BENCHMARK.symbol, p.from.slice(0, 4) + "-01-01");
  if (!bench.ok) { finish.run("failed", null, `The benchmark could not be read: ${bench.reason}`, id); return; }
  const benchmark = new Map(bench.bars.map((b) => [b.date, b.close]));
  const dates = evaluationDates(bench.bars.map((b) => b.date), p);
  // Recorded with the run: every company is evaluated on exactly this calendar.
  db.prepare("UPDATE stock_backtests SET params = json_set(params, '$.calendar', json(?)) WHERE id = ?").run(JSON.stringify({ dates: dates.length, first: dates[0] ?? null, last: dates.at(-1) ?? null, horizon: p.horizon, step: p.step }), id);
  const all: Observation[] = [];
  let done = 0, failed = 0;
  // A year before the first evaluation, so the 200-day average exists on day one.
  const from = `${Number(p.from.slice(0, 4)) - 1}${p.from.slice(4)}`;
  for (const symbol of symbols) {
    if (job.cancelled) { finish.run("stopped", JSON.stringify(summarise(all, p)), "Stopped by you.", id); return; }
    const r = await readBars(symbol, from);
    if (r.ok) all.push(...observe(symbol, r.bars, benchmark, p, dates));
    else failed++;
    done++;
    update.run(done, failed, all.length, id);
  }
  finish.run("complete", JSON.stringify(summarise(all, p)), null, id);
}

export async function startBacktest(sample = 150, p: BacktestParams = DEFAULT_PARAMS): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  if (job.running) return { ok: false, error: "A validation run is already in progress." };
  const status = await fetchStatus();
  if (!status.ok) return { ok: false, error: `TejHQ is unavailable: ${status.error.message}` };
  const snap = await fetchUniverse("nse", status.tradingDate);
  if (!snap.ok) return { ok: false, error: snap.error.message };
  const companies = snap.members.filter((m) => instrumentOf(m.isin) === "company").map((m) => m.symbol).sort();
  const symbols = sampleOf(companies, sample, Number(status.tradingDate.replaceAll("-", "")));
  const id = Number(getDb().prepare("INSERT INTO stock_backtests (status, params, total) VALUES ('running', ?, ?)").run(
    JSON.stringify({ ...p, sample, benchmark: BACKTEST_BENCHMARK.label, universe: companies.length, tradingDate: status.tradingDate }), symbols.length).lastInsertRowid);
  job.cancelled = false;
  job.running = run(id, symbols, p).catch((e) => {
    getDb().prepare("UPDATE stock_backtests SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?").run(e instanceof Error ? e.message : String(e), id);
  }).finally(() => { job.running = null; });
  return { ok: true, total: symbols.length };
}

export function stopBacktest() { job.cancelled = true; }

/** A run left 'running' by a restart is closed honestly, not resumed silently. */
export function closeOrphanedBacktests() {
  if (!job.running) getDb().prepare("UPDATE stock_backtests SET status = 'stopped', error = 'The app restarted during the run.', finished_at = datetime('now') WHERE status = 'running'").run();
}
