/** Assembles the dashboard from what is stored. Nothing here reaches a provider. */
import { runStrategy, scoreCompany, STRATEGIES, type Candidate, type Score, type StrategyResult } from "./scoring";
import { technicalVerdict, type VerdictResult } from "./technicals";
import { allFundamentals, listCompanies, listWatch, type CompanyRow } from "./store";

const PRICE_MAX_AGE_DAYS = 4;

export type Researched = {
  company: CompanyRow; score: Score; verdict: VerdictResult; strategies: Record<string, StrategyResult>;
  pricesStale: boolean; watched: boolean;
};

const candidateOf = (c: CompanyRow, f: Candidate["f"]): Candidate => ({ f, t: c.technicals, segment: c.segment, turnoverCr: c.turnover === null ? null : c.turnover / 1e7 });

export function research(c: CompanyRow, f: Candidate["f"], watched: boolean, now = Date.now()): Researched {
  const date = c.technicals?.date;
  const pricesStale = date ? now - Date.parse(date) > PRICE_MAX_AGE_DAYS * 86_400_000 : false;
  const score = scoreCompany(f, c.technicals, { pricesStale });
  const verdict = technicalVerdict(c.technicals, score.fundamentalsStrong);
  const cand = candidateOf(c, f);
  return { company: c, score, verdict, pricesStale, watched, strategies: Object.fromEntries(STRATEGIES.map((s) => [s.id, runStrategy(s, cand)])) };
}

export type Funnel = {
  listed: number; read: number; unavailable: number; stale: number; withFundamentals: number; classified: number;
  strategies: { id: string; title: string; summary: string; matched: number; noMatch: number; notTestable: number; blockedBy: string | null }[];
};

export function funnelOf(rows: Researched[]): Funnel {
  const read = rows.filter((r) => r.company.technicals);
  return {
    listed: rows.length, read: read.length,
    unavailable: rows.filter((r) => r.company.scanned_at && r.company.status === "unavailable").length,
    stale: rows.filter((r) => r.pricesStale).length,
    withFundamentals: rows.filter((r) => r.score.fundamentalsStrong !== null).length,
    classified: rows.filter((r) => r.company.segment).length,
    strategies: STRATEGIES.map((s) => {
      const count = (x: StrategyResult) => read.filter((r) => r.strategies[s.id] === x).length;
      const notTestable = count("not-testable");
      return {
        id: s.id, title: s.title, summary: s.summary, matched: count("match"), noMatch: count("no-match"), notTestable,
        blockedBy: read.length > 0 && notTestable === read.length ? (s.technical ? "Needs a market scan" : s.needsSegment ? "Needs the AMFI list and fundamentals" : "Needs fundamentals") : null,
      };
    }),
  };
}

export function loadDiscovery(): { rows: Researched[]; funnel: Funnel } {
  const f = allFundamentals();
  const watch = new Set(listWatch().map((w) => w.symbol));
  const rows = listCompanies().map((c) => research(c, f.get(c.symbol) ?? {}, watch.has(c.symbol)));
  return { rows, funnel: funnelOf(rows) };
}

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

/** The watchlist as a spreadsheet. A value nobody could measure stays blank. */
export function watchlistCsv(rows: Researched[], theses: Map<string, string>): string {
  const head = ["Symbol", "ISIN", "Company", "Market cap class", "Sector", "Close", "Price date", "Technical verdict", "Score", "Points measured", "Confidence", "Thesis"];
  const body = rows.map((r) => [
    r.company.symbol, r.company.isin, r.company.name, r.company.segment, r.company.sector, r.company.technicals?.close, r.company.technicals?.date,
    r.verdict.verdict, r.score.total, r.score.measuredPoints, r.score.confidence, theses.get(r.company.symbol),
  ].map(cell).join(","));
  return `${[head.join(","), ...body].join("\n")}\n`;
}
