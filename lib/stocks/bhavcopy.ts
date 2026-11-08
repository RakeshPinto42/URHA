/**
 * The exchanges' own end-of-day price files ("bhavcopy"), in the common UDiFF format both NSE and
 * BSE publish. Pure parsing here; fetching is separate and only ever user-triggered: the latest
 * file per exchange, or, on an explicit request, one BSE file per past session, paced.
 */
import type { RawBar } from "./types";
import { instrumentOf } from "./universe";

export type Exchange = "nse" | "bse";

export type OfficialRow = {
  exchange: Exchange; tradeDate: string; symbol: string; isin: string | null; series: string | null; name: string | null;
  open: number | null; high: number | null; low: number | null; close: number; prevClose: number | null;
  volume: number | null; turnover: number | null; trades: number | null;
};

/** Where each exchange publishes its file for a day (YYYYMMDD). */
export function bhavcopyUrl(exchange: Exchange, date: string): string {
  const d = date.replaceAll("-", "");
  return exchange === "nse"
    ? `https://nsearchives.nseindia.com/content/cm/BhavCopy_NSE_CM_0_0_0_${d}_F_0000.csv.zip`
    : `https://www.bseindia.com/download/BhavCopy/Equity/BhavCopy_BSE_CM_0_0_0_${d}_F_0000.CSV`;
}

/** Splits one CSV line, honouring quoted fields. */
export function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const num = (v: string | undefined) => {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Parses a UDiFF bhavcopy. Keeps cash-market stock rows (FinInstrmTp STK) only, and refuses a file
 * whose header is not the expected format rather than guessing at columns.
 */
export function parseBhavcopy(exchange: Exchange, text: string): { ok: true; rows: OfficialRow[]; tradeDate: string } | { ok: false; error: string } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, error: "The file is empty." };
  const head = splitCsv(lines[0]!);
  const col = (name: string) => head.indexOf(name);
  const need = ["TradDt", "FinInstrmTp", "ISIN", "TckrSymb", "SctySrs", "FinInstrmNm", "OpnPric", "HghPric", "LwPric", "ClsPric", "PrvsClsgPric", "TtlTradgVol", "TtlTrfVal", "TtlNbOfTxsExctd"];
  const missing = need.filter((n) => col(n) < 0);
  if (missing.length) return { ok: false, error: `Not the expected bhavcopy format: missing ${missing.join(", ")}.` };
  const rows: OfficialRow[] = [];
  let tradeDate = "";
  for (const line of lines.slice(1)) {
    const f = splitCsv(line);
    if (f[col("FinInstrmTp")] !== "STK") continue;
    const close = num(f[col("ClsPric")]);
    const symbol = f[col("TckrSymb")]?.trim();
    if (close === null || !symbol) continue;
    tradeDate ||= f[col("TradDt")]!.trim();
    rows.push({
      exchange, tradeDate: f[col("TradDt")]!.trim(), symbol, isin: f[col("ISIN")]?.trim() || null, series: f[col("SctySrs")]?.trim() || null,
      name: f[col("FinInstrmNm")]?.trim() || null, open: num(f[col("OpnPric")]), high: num(f[col("HghPric")]), low: num(f[col("LwPric")]),
      close, prevClose: num(f[col("PrvsClsgPric")]), volume: num(f[col("TtlTradgVol")]), turnover: num(f[col("TtlTrfVal")]), trades: num(f[col("TtlNbOfTxsExctd")]),
    });
  }
  if (!rows.length) return { ok: false, error: "The file has no stock rows." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) return { ok: false, error: `Unexpected trade date "${tradeDate}".` };
  return { ok: true, rows, tradeDate };
}

/** Company equity shares only: the ISIN decides, as it does everywhere else in discovery. */
export const isCompanyShare = (r: Pick<OfficialRow, "isin">) => instrumentOf(r.isin) === "company";

export type Coverage = { nse: number; bse: number; both: number; bseOnly: number; nseOnly: number };

/** How many companies each exchange covers on a day, matched by ISIN. */
export function coverageOf(nse: OfficialRow[], bse: OfficialRow[]): Coverage {
  const a = new Set(nse.filter(isCompanyShare).map((r) => r.isin!));
  const b = new Set(bse.filter(isCompanyShare).map((r) => r.isin!));
  let both = 0;
  for (const i of a) if (b.has(i)) both++;
  return { nse: a.size, bse: b.size, both, bseOnly: b.size - both, nseOnly: a.size - both };
}

export type Agreement = {
  tradeDate: string; compared: number; agree: number; disagree: number; onlyOfficial: number; onlyOther: number;
  /** The largest disagreements, both values shown: sources that differ are never averaged. */
  worst: { symbol: string; official: number; other: number; diffPct: number }[];
};

/** Compares another source's closes with the exchange's own, symbol by symbol, for one day. */
export function agreement(tradeDate: string, official: Pick<OfficialRow, "symbol" | "close" | "isin">[], other: { symbol: string; close: number | null }[], tolerancePct = 0.05): Agreement {
  const off = new Map(official.filter(isCompanyShare).map((r) => [r.symbol, r.close]));
  const oth = new Map(other.filter((r) => r.close !== null && off.has(r.symbol)).map((r) => [r.symbol, r.close!]));
  const diffs: Agreement["worst"] = [];
  let agree = 0;
  for (const [symbol, close] of oth) {
    const o = off.get(symbol)!;
    const diffPct = o > 0 ? Math.abs(close - o) / o * 100 : 100;
    if (diffPct <= tolerancePct) agree++;
    else diffs.push({ symbol, official: o, other: close, diffPct: Math.round(diffPct * 100) / 100 });
  }
  diffs.sort((x, y) => y.diffPct - x.diffPct);
  const otherSymbols = new Set(other.map((r) => r.symbol));
  return {
    tradeDate, compared: oth.size, agree, disagree: diffs.length,
    onlyOfficial: [...off.keys()].filter((s) => !otherSymbols.has(s)).length,
    onlyOther: other.filter((r) => !off.has(r.symbol)).length,
    worst: diffs.slice(0, 15),
  };
}

export type HistoryRow = { tradeDate: string; open: number | null; high: number | null; low: number | null; close: number; prevClose: number | null; volume: number | null; turnover: number | null };
/**
 * A company's daily bars from the exchange's own files, unadjusted, ready for adjustBars with the
 * corporate actions. The exchange's previous close is NOT adjusted on an ex-date (checked against
 * BSE's file for RELIANCE's 1:1 bonus on 2024-10-28: 2,655.45), so actions must come from a feed.
 */
export function rawBarsOf(rows: HistoryRow[]): RawBar[] {
  return [...rows].filter((r) => r.close > 0).sort((a, b) => (a.tradeDate < b.tradeDate ? -1 : 1)).map((r) => ({
    date: r.tradeDate, open: r.open ?? r.close, high: r.high ?? r.close, low: r.low ?? r.close, close: r.close, volume: r.volume ?? 0, turnover: r.turnover ?? 0, prevClose: r.prevClose,
  }));
}

/** Average daily turnover over the last `n` sessions of the calendar, counting untraded days as zero. */
export function averageTurnoverOf(rows: HistoryRow[], calendar: string[], n = 20): { average: number; traded: number } {
  const last = new Set(calendar.slice(-n));
  const inWindow = rows.filter((r) => last.has(r.tradeDate));
  return { average: inWindow.reduce((s, r) => s + (r.turnover ?? 0), 0) / Math.max(1, Math.min(n, calendar.length)), traded: inWindow.length };
}
