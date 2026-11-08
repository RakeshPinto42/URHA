/**
 * Companies listed only on BSE, which the market-data source barely covers (78 of 1,869 on
 * 2026-11-06). Their price history is built from BSE's own daily files, one file per past
 * session, downloaded only when the owner asks and paced well below any reasonable limit. Prices
 * are adjusted with TejHQ's corporate-actions feed, which does list BSE-only companies. These
 * companies have price evidence only: no fundamentals source covers them here. Server-only.
 */
import "server-only";
import { getDb } from "../db";
import { adjustBars, adjustedVolume } from "./adjust";
import { averageTurnoverOf, isCompanyShare, parseBhavcopy, rawBarsOf, type HistoryRow } from "./bhavcopy";
import { downloadOfficial, latestOfficialDate } from "./official";
import { fetchActions } from "./tejhq";
import { measure, technicalVerdict, type Bar, type Verdict } from "./technicals";
import { eligibilityOf, MIN_AVG_TURNOVER } from "./universe";

export const BSE_SESSIONS = 260;
const PACE_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Job = { running: boolean; cancelled: boolean; phase: "files" | "actions" | null; done: number; total: number; failedDates: string[]; error: string | null };
const job = ((globalThis as { __urhaBse?: Job }).__urhaBse ??= { running: false, cancelled: false, phase: null, done: 0, total: 0, failedDates: [], error: null });

export type BseReading = {
  symbol: string; isin: string; name: string | null; close: number; avgTurnover: number; sessions: number;
  verdict: Verdict; rsi14: number | null; d200: number | null; actionsApplied: number;
};
export type BseSummary = {
  builtAt: string; latest: string; first: string; sessions: number; failedDates: string[];
  bseOnly: number; withHistory: number; liquid: number; read: number; unavailable: { symbol: string; reason: string }[]; readings: BseReading[];
};

/** Session files held for BSE, oldest first: a date counts when its file was stored. */
export const bseCalendar = (): string[] =>
  (getDb().prepare("SELECT DISTINCT trade_date AS d FROM stock_official_prices WHERE exchange = 'bse' ORDER BY d").all() as { d: string }[]).map((r) => r.d);

/** ISINs of companies on the latest BSE file and not on the latest NSE file. */
function bseOnlyIsins(): Map<string, { symbol: string; name: string | null }> {
  const db = getDb();
  const nse = latestOfficialDate("nse"), bse = latestOfficialDate("bse");
  if (!nse || !bse) return new Map();
  const onNse = new Set((db.prepare("SELECT isin FROM stock_official_prices WHERE exchange = 'nse' AND trade_date = ?").all(nse) as { isin: string | null }[]).map((r) => r.isin));
  const rows = db.prepare("SELECT symbol, isin, name FROM stock_official_prices WHERE exchange = 'bse' AND trade_date = ?").all(bse) as { symbol: string; isin: string | null; name: string | null }[];
  return new Map(rows.filter((r) => r.isin && isCompanyShare(r) && !onNse.has(r.isin)).map((r) => [r.isin!, { symbol: r.symbol, name: r.name }]));
}

export const bseState = () => ({ ...job, summary: latestBseSummary() });

export function latestBseSummary(): BseSummary | null {
  const r = getDb().prepare("SELECT summary FROM stock_source_checks WHERE source = 'bse-only' ORDER BY id DESC LIMIT 1").get() as { summary: string } | undefined;
  return r ? (JSON.parse(r.summary) as BseSummary) : null;
}

export function startBseHistory(sessions = BSE_SESSIONS): { ok: true } | { ok: false; error: string } {
  if (job.running) return { ok: false, error: "The BSE history is already being built." };
  const latest = latestOfficialDate("bse");
  if (!latest || !latestOfficialDate("nse")) return { ok: false, error: "Download the latest official prices first: BSE-only companies are found by comparing both exchanges' files." };
  Object.assign(job, { running: true, cancelled: false, phase: "files", done: 0, total: sessions, failedDates: [], error: null });
  build(latest, sessions).catch((e) => { job.error = e instanceof Error ? e.message : String(e); }).finally(() => { job.running = false; job.phase = null; });
  return { ok: true };
}

export function stopBseHistory() { job.cancelled = true; }

async function build(latest: string, sessions: number) {
  const db = getDb();
  const only = bseOnlyIsins();
  const ins = db.prepare(`INSERT INTO stock_official_prices (exchange, trade_date, symbol, isin, series, name, open, high, low, close, prev_close, volume, turnover, trades)
    VALUES ('bse', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(exchange, trade_date, symbol) DO NOTHING`);
  const held = new Set(bseCalendar());
  // Walk back over weekdays until enough sessions are held; a 404 is a holiday, not a failure.
  let have = [...held].filter((d) => d <= latest).length;
  job.done = Math.min(have, sessions);
  for (let t = Date.parse(`${latest}T00:00:00Z`), tries = 0; have < sessions && tries < Math.ceil(sessions * 1.6); t -= 86_400_000) {
    const date = new Date(t);
    if (date.getUTCDay() % 6 === 0) continue;
    const d = date.toISOString().slice(0, 10);
    if (held.has(d)) continue;
    if (job.cancelled) { job.error = "Stopped by you."; return; }
    tries++;
    const r = await downloadOfficial("bse", d);
    await sleep(PACE_MS);
    if (!r.ok) { if (r.status !== 404) job.failedDates.push(d); continue; }
    const parsed = parseBhavcopy("bse", r.text);
    if (!parsed.ok) { job.failedDates.push(d); continue; }
    // Only the BSE-only companies are kept for past days: the rest are covered by the main source.
    const keep = parsed.rows.filter((x) => x.isin && only.has(x.isin));
    db.transaction(() => { for (const x of keep) ins.run(x.tradeDate, x.symbol, x.isin, x.series, x.name, x.open, x.high, x.low, x.close, x.prevClose, x.volume, x.turnover, x.trades); })();
    if (keep.length === 0) continue; // no BSE-only company traded: not counted as a held session
    have++;
    job.done = have;
  }
  await summarise(only);
}

async function summarise(only: Map<string, { symbol: string; name: string | null }>) {
  const db = getDb();
  const calendar = bseCalendar();
  const rows = db.prepare(`SELECT isin, trade_date AS tradeDate, open, high, low, close, prev_close AS prevClose, volume, turnover FROM stock_official_prices
    WHERE exchange = 'bse' AND isin IN (SELECT value FROM json_each(?))`).all(JSON.stringify([...only.keys()])) as (HistoryRow & { isin: string })[];
  const byIsin = new Map<string, HistoryRow[]>();
  for (const r of rows) { const list = byIsin.get(r.isin) ?? []; list.push(r); byIsin.set(r.isin, list); }
  const liquid = [...byIsin].filter(([isin, h]) => eligibilityOf(isin, averageTurnoverOf(h, calendar).average) === "eligible");
  job.phase = "actions"; job.done = 0; job.total = liquid.length;
  const readings: BseReading[] = [];
  const unavailable: { symbol: string; reason: string }[] = [];
  for (const [isin, history] of liquid) {
    if (job.cancelled) { job.error = "Stopped by you."; break; }
    const meta = only.get(isin)!;
    const ax = await fetchActions(meta.symbol);
    await sleep(550);
    job.done++;
    if (!ax.ok) { unavailable.push({ symbol: meta.symbol, reason: `Corporate actions unavailable, so prices cannot be adjusted: ${ax.error.message}` }); continue; }
    // Match on ISIN: a BSE symbol can collide with another company's NSE symbol.
    const actions = ax.actions.filter((a) => a.isin === isin);
    const adjusted = adjustBars(rawBarsOf(history), actions);
    const bars: Bar[] = adjusted.map((b) => { const f = b.close > 0 ? b.adjClose / b.close : 1; return { date: b.date, close: b.adjClose, high: b.high * f, low: b.low * f, volume: adjustedVolume(b) }; });
    const t = measure(bars, null);
    if (!t) { unavailable.push({ symbol: meta.symbol, reason: "Too little price history." }); continue; }
    readings.push({
      symbol: meta.symbol, isin, name: meta.name, close: t.close, avgTurnover: averageTurnoverOf(history, calendar).average, sessions: bars.length,
      verdict: technicalVerdict(t, null).verdict, rsi14: t.rsi14, d200: t.dma.d200, actionsApplied: new Set(adjusted.flatMap((b) => b.adjustments.map((a) => a.exDate + a.type))).size,
    });
  }
  const summary: BseSummary = {
    builtAt: new Date().toISOString(), latest: calendar.at(-1) ?? "", first: calendar[0] ?? "", sessions: calendar.length, failedDates: job.failedDates,
    bseOnly: only.size, withHistory: byIsin.size, liquid: liquid.length, read: readings.length, unavailable, readings: readings.sort((a, b) => b.avgTurnover - a.avgTurnover),
  };
  db.prepare("INSERT INTO stock_source_checks (trade_date, source, summary) VALUES (?, 'bse-only', ?)").run(summary.latest, JSON.stringify(summary));
}

export { MIN_AVG_TURNOVER };
