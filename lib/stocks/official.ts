/**
 * Official exchange prices: one published bhavcopy file per exchange, fetched only when the owner
 * asks, stored in the local database, and used to check the market-data source against the
 * exchange's own numbers. Server-only.
 */
import "server-only";
import { inflateRawSync } from "node:zlib";
import { getDb } from "../db";
import { agreement, bhavcopyUrl, coverageOf, parseBhavcopy, type Agreement, type Coverage, type Exchange, type OfficialRow } from "./bhavcopy";
import { fetchStatus, fetchUniverse } from "./tejhq";

const MAX_BYTES = 25 * 1024 * 1024;
const AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) URHA/1.0 (personal research; one file on request)";

/** The one file inside a zip, from its local header. Refuses anything else rather than guess. */
export function unzipSingle(buf: Buffer): string {
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error("Not a zip file.");
  const method = buf.readUInt16LE(8), compressed = buf.readUInt32LE(18), nameLen = buf.readUInt16LE(26), extraLen = buf.readUInt16LE(28);
  const start = 30 + nameLen + extraLen;
  const flags = buf.readUInt16LE(6);
  // With a data descriptor the size is only at the end: find the central directory's copy.
  let size = compressed;
  if (flags & 0x8 || size === 0) {
    const cd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    if (cd < 0) throw new Error("The zip has no directory.");
    size = buf.readUInt32LE(cd + 20);
  }
  const body = buf.subarray(start, start + size);
  if (method === 0) return body.toString("utf8");
  if (method === 8) return inflateRawSync(body).toString("utf8");
  throw new Error(`Unsupported zip compression method ${method}.`);
}

export async function downloadOfficial(exchange: Exchange, date: string): Promise<{ ok: true; text: string } | { ok: false; status: number | null; error: string }> {
  try {
    const r = await fetch(bhavcopyUrl(exchange, date), { headers: { "User-Agent": AGENT, Accept: "*/*" }, signal: AbortSignal.timeout(45_000), redirect: "error" });
    if (!r.ok) return { ok: false, status: r.status, error: `HTTP ${r.status}` };
    // BSE answers a date with no file (a holiday) with its home page and HTTP 200: that is no file, not a failure.
    if ((r.headers.get("content-type") ?? "").toLowerCase().includes("text/html")) return { ok: false, status: 404, error: "No file was published for this date." };
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) return { ok: false, status: r.status, error: "The file is unexpectedly large." };
    return { ok: true, text: exchange === "nse" ? unzipSingle(buf) : buf.toString("utf8") };
  } catch (e) {
    return { ok: false, status: null, error: e instanceof Error ? e.message : String(e) };
  }
}

function save(rows: OfficialRow[]) {
  const ins = getDb().prepare(`INSERT INTO stock_official_prices (exchange, trade_date, symbol, isin, series, name, open, high, low, close, prev_close, volume, turnover, trades)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(exchange, trade_date, symbol) DO UPDATE SET close = excluded.close, fetched_at = datetime('now')`);
  getDb().transaction(() => { for (const r of rows) ins.run(r.exchange, r.tradeDate, r.symbol, r.isin, r.series, r.name, r.open, r.high, r.low, r.close, r.prevClose, r.volume, r.turnover, r.trades); })();
}

const weekdaysBack = (from: Date, n: number) => {
  const out: string[] = [];
  for (let d = new Date(from); out.length < n; d = new Date(d.getTime() - 86_400_000)) if (d.getUTCDay() % 6 !== 0) out.push(d.toISOString().slice(0, 10));
  return out;
};

export type FetchReport = { exchange: Exchange; ok: boolean; tradeDate?: string; rows?: number; companies?: number; error?: string }[];

/**
 * Downloads the most recent published file from each exchange (trying back over the last week for
 * holidays), stores it, and checks TejHQ against NSE for that day.
 */
export async function fetchOfficial(now = new Date()): Promise<{ report: FetchReport; agreement: Agreement | null }> {
  const report: FetchReport = [];
  const latest: Partial<Record<Exchange, string>> = {};
  for (const exchange of ["nse", "bse"] as const) {
    let done = false, lastError = "No file found for the last seven weekdays.";
    for (const date of weekdaysBack(now, 7)) {
      const r = await downloadOfficial(exchange, date);
      if (!r.ok) { if (r.status !== 404) lastError = r.error; continue; }
      const parsed = parseBhavcopy(exchange, r.text);
      if (!parsed.ok) { lastError = parsed.error; break; }
      save(parsed.rows);
      latest[exchange] = parsed.tradeDate;
      report.push({ exchange, ok: true, tradeDate: parsed.tradeDate, rows: parsed.rows.length, companies: parsed.rows.filter((x) => /^INE[A-Z0-9]{4}01/.test(x.isin ?? "")).length });
      done = true;
      break;
    }
    if (!done) report.push({ exchange, ok: false, error: lastError });
  }
  let check: Agreement | null = null;
  if (latest.nse) check = await crossCheck(latest.nse);
  return { report, agreement: check };
}

/** TejHQ's closes for a day against NSE's own, stored so the page can show the latest result. */
export async function crossCheck(tradeDate: string): Promise<Agreement | null> {
  const snap = await fetchUniverse("nse", tradeDate);
  if (!snap.ok) return null;
  const official = officialRows("nse", tradeDate);
  const a = agreement(tradeDate, official, snap.members.map((m) => ({ symbol: m.symbol, close: m.close })));
  getDb().prepare("INSERT INTO stock_source_checks (trade_date, source, summary) VALUES (?, 'tejhq', ?)").run(tradeDate, JSON.stringify(a));
  return a;
}

export const officialRows = (exchange: Exchange, tradeDate: string): OfficialRow[] =>
  (getDb().prepare(`SELECT exchange, trade_date AS tradeDate, symbol, isin, series, name, open, high, low, close, prev_close AS prevClose, volume, turnover, trades
    FROM stock_official_prices WHERE exchange = ? AND trade_date = ?`).all(exchange, tradeDate) as OfficialRow[]);

export const latestOfficialDate = (exchange: Exchange): string | null =>
  (getDb().prepare("SELECT MAX(trade_date) AS d FROM stock_official_prices WHERE exchange = ?").get(exchange) as { d: string | null }).d;

export function latestAgreement(): (Agreement & { checkedAt: string }) | null {
  const r = getDb().prepare("SELECT summary, checked_at FROM stock_source_checks WHERE source = 'tejhq' ORDER BY id DESC LIMIT 1").get() as { summary: string; checked_at: string } | undefined;
  return r ? { ...(JSON.parse(r.summary) as Agreement), checkedAt: r.checked_at } : null;
}

export function officialCoverage(): (Coverage & { nseDate: string | null; bseDate: string | null }) | null {
  const nseDate = latestOfficialDate("nse"), bseDate = latestOfficialDate("bse");
  if (!nseDate && !bseDate) return null;
  return { ...coverageOf(nseDate ? officialRows("nse", nseDate) : [], bseDate ? officialRows("bse", bseDate) : []), nseDate, bseDate };
}

/** Freshness of each price source: the latest day held, and how many weekdays old it is. */
export async function freshness(now = new Date()) {
  const age = (d: string | null) => {
    if (!d) return null;
    let n = 0;
    for (let t = new Date(`${d}T00:00:00Z`); t < now; t = new Date(t.getTime() + 86_400_000)) if (t.getUTCDay() % 6 !== 0) n++;
    return Math.max(0, n - 1);
  };
  const tej = await fetchStatus();
  const nse = latestOfficialDate("nse"), bse = latestOfficialDate("bse");
  return [
    { source: "TejHQ (market data)", date: tej.ok ? tej.tradingDate : null, weekdaysOld: tej.ok ? age(tej.tradingDate) : null, note: tej.ok ? null : tej.error.message },
    { source: "NSE bhavcopy (official)", date: nse, weekdaysOld: age(nse), note: nse ? null : "Not downloaded yet." },
    { source: "BSE bhavcopy (official)", date: bse, weekdaysOld: age(bse), note: bse ? null : "Not downloaded yet." },
  ];
}
