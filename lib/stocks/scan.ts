/**
 * The market scan. Reads prices for the universe one company at a time, under TejHQ's published
 * limit, saving as it goes so a stopped scan resumes. It runs inside the server process.
 */
import { adjustBars } from "./adjust";
import { fetchActions, fetchOhlcv, fetchStatus, fetchUniverse } from "./tejhq";
import { measure, type Bar } from "./technicals";
import { closeScan, latestScan, openScan, saveReading, saveUniverse, scannedOn, scanProgress, stopOrphanedScans } from "./store";

/** The whole market is in the list; below this turnover, prices are too thin to read. */
export const MIN_TURNOVER = 1e7; // ₹1 crore a day
const HISTORY_DAYS = 420;
export const BENCHMARK = { symbol: "MONIFTY500", label: "Motilal Oswal Nifty 500 ETF" };

// Next gives the page and each API route their own copy of this module, so a plain variable would
// disagree between them. The one process-wide object keeps a single truth.
const job = ((globalThis as { __urhaScan?: { running: Promise<void> | null; cancelled: boolean } }).__urhaScan ??= { running: null, cancelled: false });

const since = () => new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString().slice(0, 10);

async function readBars(symbol: string): Promise<{ ok: true; bars: Bar[] } | { ok: false; reason: string }> {
  const [px, ax] = await Promise.all([fetchOhlcv("nse", symbol, since()), fetchActions(symbol)]);
  if (!px.ok) return { ok: false, reason: px.error.message };
  if (!ax.ok && ax.error.kind !== "not-found") return { ok: false, reason: `Corporate actions unavailable, so prices cannot be adjusted: ${ax.error.message}` };
  const adjusted = adjustBars(px.bars, ax.ok ? ax.actions : []);
  // High and low move with the same factor as the close, so splits do not look like crashes.
  return { ok: true, bars: adjusted.map((b) => {
    const f = b.close > 0 ? b.adjClose / b.close : 1;
    return { date: b.date, close: b.adjClose, high: b.high * f, low: b.low * f, volume: b.volume };
  }) };
}

async function run(id: number, symbols: string[], tradingDate: string) {
  const bench = await readBars(BENCHMARK.symbol);
  const benchmark = bench.ok ? { label: BENCHMARK.label, bars: bench.bars } : null;
  const already = scannedOn(tradingDate);
  let done = already.size, failed = 0;
  scanProgress(id, done, failed);
  for (const symbol of symbols) {
    if (job.cancelled) { closeScan(id, "stopped", "Stopped by you."); return; }
    if (already.has(symbol)) continue;
    const r = await readBars(symbol);
    const t = r.ok ? measure(r.bars, benchmark) : null;
    if (r.ok && t) saveReading(symbol, { technicals: t, closes: r.bars.slice(-120).map((b) => b.close) });
    else { saveReading(symbol, { reason: r.ok ? "No usable price history." : r.reason }); failed++; }
    done++;
    if (done % 5 === 0) scanProgress(id, done, failed);
  }
  scanProgress(id, done, failed);
  closeScan(id, "complete", benchmark ? null : "Relative strength is unavailable: the benchmark could not be read.");
}

export async function startScan(limit?: number): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  if (job.running) return { ok: false, error: "A scan is already running." };
  stopOrphanedScans();
  const status = await fetchStatus();
  if (!status.ok) return { ok: false, error: `The price source is unavailable: ${status.error.message}` };
  const universe = await fetchUniverse("nse", status.tradingDate);
  if (!universe.ok) return { ok: false, error: `The market list is unavailable: ${universe.error.message}` };
  saveUniverse(universe.members);
  const liquid = universe.members.filter((m) => (m.turnover ?? 0) >= MIN_TURNOVER).sort((a, b) => a.symbol.localeCompare(b.symbol)).map((m) => m.symbol);
  const symbols = limit ? liquid.slice(0, limit) : liquid;
  const id = openScan(status.tradingDate, symbols.length);
  job.cancelled = false;
  job.running = run(id, symbols, status.tradingDate)
    .catch((e) => { closeScan(id, "stopped", e instanceof Error ? e.message : String(e)); })
    .finally(() => { job.running = null; });
  return { ok: true, total: symbols.length };
}

export function stopScan() { job.cancelled = true; }
export const scanState = () => ({ running: job.running !== null, scan: latestScan() });
