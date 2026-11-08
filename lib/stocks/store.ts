/** Everything the stock module keeps, in URHA's own database. */
import { getDb as db } from "../db";
import { compareReadings, isStale, type Reading } from "./evidence";
import type { FundamentalRow } from "./imports";
import type { Fundamentals, Metric } from "./scoring";
import { ENGINE_VERSION, type Technicals } from "./technicals";
import type { Eligibility } from "./universe";
import type { McapRow } from "./amfi";

export type UniverseRow = { symbol: string; isin: string | null; name: string | null; close: number | null; turnover: number | null; eligibility: Eligibility; avgTurnover: number | null; sessionsTraded: number };
export type ScanRow = { id: number; trading_date: string; status: "running" | "complete" | "stopped"; total: number; done: number; failed: number; started_at: string; finished_at: string | null; error: string | null };
export type CompanyRow = {
  symbol: string; isin: string | null; name: string | null; turnover: number | null; close: number | null;
  eligibility: Eligibility | null; avg_turnover: number | null; sessions_traded: number | null;
  technicals: Technicals | null; closes: number[]; status: "ok" | "unavailable"; reason: string | null;
  scanned_at: string | null; sector: string | null; segment: "large-cap" | "mid-cap" | "small-cap" | null; avg_mcap_cr: number | null; list_period: string | null;
};

const FUNDAMENTAL_MAX_AGE_DAYS = 120;

export function saveUniverse(rows: UniverseRow[]) {
  const put = db().prepare(`INSERT INTO stock_companies (symbol, isin, name, turnover, close, eligibility, avg_turnover, sessions_traded) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(symbol) DO UPDATE SET isin = excluded.isin, name = excluded.name, turnover = excluded.turnover, close = excluded.close,
      eligibility = excluded.eligibility, avg_turnover = excluded.avg_turnover, sessions_traded = excluded.sessions_traded`);
  db().transaction(() => rows.forEach((r) => put.run(r.symbol, r.isin, r.name, r.turnover, r.close, r.eligibility, r.avgTurnover, r.sessionsTraded)))();
}

export const latestScan = () => (db().prepare("SELECT * FROM stock_scans ORDER BY id DESC LIMIT 1").get() as ScanRow | undefined) ?? null;
export const openScan = (tradingDate: string, total: number) => Number(db().prepare("INSERT INTO stock_scans (trading_date, status, total) VALUES (?, 'running', ?)").run(tradingDate, total).lastInsertRowid);
export const scanProgress = (id: number, done: number, failed: number) => db().prepare("UPDATE stock_scans SET done = ?, failed = ? WHERE id = ?").run(done, failed, id);
export const closeScan = (id: number, status: "complete" | "stopped", error: string | null) => db().prepare("UPDATE stock_scans SET status = ?, error = ?, finished_at = datetime('now') WHERE id = ?").run(status, error, id);
/** After a restart nothing is running, whatever the table says. */
export const stopOrphanedScans = () => db().prepare("UPDATE stock_scans SET status = 'stopped', error = 'The app restarted during the scan.', finished_at = datetime('now') WHERE status = 'running'").run();

export function saveReading(symbol: string, r: { technicals: Technicals; closes: number[] } | { reason: string }) {
  if ("reason" in r) {
    db().prepare("UPDATE stock_companies SET status = 'unavailable', reason = ?, scanned_at = datetime('now') WHERE symbol = ?").run(r.reason, symbol);
    return;
  }
  db().prepare("UPDATE stock_companies SET status = 'ok', reason = NULL, technicals = ?, closes = ?, scanned_at = datetime('now') WHERE symbol = ?")
    .run(JSON.stringify(r.technicals), JSON.stringify(r.closes), symbol);
}

/** Companies already read for this trading day, so a stopped scan can carry on. */
export const scannedOn = (tradingDate: string): Set<string> =>
  new Set((db().prepare("SELECT symbol FROM stock_companies WHERE status = 'ok' AND json_extract(technicals, '$.date') = ? AND json_extract(technicals, '$.v') = ?").all(tradingDate, ENGINE_VERSION) as { symbol: string }[]).map((r) => r.symbol));

type Raw = Omit<CompanyRow, "technicals" | "closes"> & { technicals: string | null; closes: string | null };
/** Readings from an older engine mean something different, so they count as not read. */
export function currentTechnicals(json: string | null): Technicals | null {
  if (!json) return null;
  const t = JSON.parse(json) as Technicals;
  return t.v === ENGINE_VERSION ? t : null;
}

const hydrate = (r: Raw): CompanyRow => ({ ...r, technicals: currentTechnicals(r.technicals), closes: r.closes ? JSON.parse(r.closes) as number[] : [] });

const COMPANY_SQL = `SELECT c.symbol, c.isin, c.name, c.turnover, c.close, c.eligibility, c.avg_turnover, c.sessions_traded, c.technicals, c.closes, COALESCE(c.status, 'unavailable') AS status,
    COALESCE(c.reason, 'Not read yet.') AS reason, c.scanned_at, c.sector, s.segment, s.avg_mcap_cr, s.period_end AS list_period
  FROM stock_companies c LEFT JOIN stock_segments s ON s.isin = c.isin`;

export const listCompanies = (): CompanyRow[] => (db().prepare(COMPANY_SQL).all() as Raw[]).map(hydrate);
export function getCompany(symbol: string): CompanyRow | null {
  const r = db().prepare(`${COMPANY_SQL} WHERE c.symbol = ?`).get(symbol) as Raw | undefined;
  return r ? hydrate(r) : null;
}

export function importFundamentals(source: string, rows: FundamentalRow[]): { matched: number; unmatched: string[] } {
  const d = db();
  const bySymbol = d.prepare("SELECT symbol FROM stock_companies WHERE symbol = ?");
  const byIsin = d.prepare("SELECT symbol FROM stock_companies WHERE isin = ?");
  const put = d.prepare(`INSERT INTO stock_fundamentals (symbol, metric, source, value, period_end, period_type, basis) VALUES (?,?,?,?,NULL,'unknown','unknown')
    ON CONFLICT(symbol, metric, source) DO UPDATE SET value = excluded.value, retrieved_at = datetime('now')`);
  const sector = d.prepare("UPDATE stock_companies SET sector = ? WHERE symbol = ?");
  const unmatched: string[] = [];
  let matched = 0;
  d.transaction(() => {
    for (const r of rows) {
      const hit = ((r.isin ? byIsin.get(r.isin) : undefined) ?? (r.symbol ? bySymbol.get(r.symbol) : undefined)) as { symbol: string } | undefined;
      if (!hit) { unmatched.push(r.symbol ?? r.isin ?? "?"); continue; }
      matched++;
      if (r.sector) sector.run(r.sector, hit.symbol);
      for (const [m, v] of Object.entries(r.values)) put.run(hit.symbol, m, source, v);
    }
  })();
  return { matched, unmatched };
}

export function saveSegments(rows: McapRow[], periodEnd: string) {
  const d = db();
  const put = d.prepare("INSERT INTO stock_segments (isin, segment, avg_mcap_cr, period_end) VALUES (?,?,?,?)");
  d.transaction(() => { d.prepare("DELETE FROM stock_segments").run(); rows.forEach((r) => put.run(r.isin, r.segment, r.avgMcapCr, periodEnd)); })();
}

type FundRow = { symbol: string; metric: Metric; source: string; value: number; period_end: string | null; period_type: Reading["periodType"]; basis: Reading["basis"]; retrieved_at: string };

/** Compares each metric across sources, so a disagreement surfaces instead of being averaged. */
export function resolveFundamentals(rows: FundRow[], now = Date.now()): Fundamentals {
  const byMetric = new Map<Metric, FundRow[]>();
  for (const r of rows) byMetric.set(r.metric, [...(byMetric.get(r.metric) ?? []), r]);
  const out: Fundamentals = {};
  for (const [metric, list] of byMetric) {
    const readings: Reading[] = list.map((r) => ({ value: r.value, periodEnd: r.period_end, periodType: r.period_type, basis: r.basis, source: r.source, retrievedAt: `${r.retrieved_at.replace(" ", "T")}Z` }));
    const c = compareReadings(readings);
    if (c.state === "conflict") out[metric] = { value: null, state: "conflict", note: `${readings.map((r) => `${r.source}: ${r.value}`).join("; ")}. ${c.reasons.join(" ")}` };
    else if (c.state === "unavailable") out[metric] = { value: null, state: "unavailable" };
    else if (isStale(readings, FUNDAMENTAL_MAX_AGE_DAYS, now)) out[metric] = { value: c.value, state: "stale", source: readings[0]!.source, note: `Imported more than ${FUNDAMENTAL_MAX_AGE_DAYS} days ago.` };
    else out[metric] = { value: c.value, state: "ok", source: readings[0]!.source, period: readings[0]!.periodEnd };
  }
  return out;
}

export function allFundamentals(): Map<string, Fundamentals> {
  const rows = db().prepare("SELECT * FROM stock_fundamentals").all() as FundRow[];
  const bySymbol = new Map<string, FundRow[]>();
  for (const r of rows) bySymbol.set(r.symbol, [...(bySymbol.get(r.symbol) ?? []), r]);
  const out = new Map<string, Fundamentals>();
  for (const [s, list] of bySymbol) out.set(s, resolveFundamentals(list));
  return out;
}

export const sourceCounts = (): Record<string, number> => Object.fromEntries((db().prepare("SELECT source, COUNT(DISTINCT symbol) AS n FROM stock_fundamentals GROUP BY source").all() as { source: string; n: number }[]).map((r) => [r.source, r.n]));
export const segmentCount = () => (db().prepare("SELECT COUNT(*) AS n FROM stock_segments").get() as { n: number }).n;

export type WatchRow = { symbol: string; thesis: string; added_at: string };
export const listWatch = (): WatchRow[] => db().prepare("SELECT symbol, thesis, added_at FROM stock_watchlist ORDER BY added_at DESC").all() as WatchRow[];
export function setWatched(symbol: string, on: boolean) {
  if (on) db().prepare("INSERT OR IGNORE INTO stock_watchlist (symbol) VALUES (?)").run(symbol);
  else db().prepare("DELETE FROM stock_watchlist WHERE symbol = ?").run(symbol);
}
export const setThesis = (symbol: string, thesis: string) => db().prepare("UPDATE stock_watchlist SET thesis = ? WHERE symbol = ?").run(thesis, symbol);
