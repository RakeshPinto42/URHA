/** Assembles the dashboard from what is stored. Nothing here reaches a provider. */
import { derive, sectorMedians } from "./derive";
import { runStrategy, scoreCompany, STRATEGIES, type Candidate, type Fundamentals, type Score, type StrategyResult } from "./scoring";
import { technicalVerdict, type VerdictResult } from "./technicals";
import { allFundamentals, listCompanies, listWatch, type CompanyRow } from "./store";
import { modelOf, type BusinessModel, type Eligibility } from "./universe";

const PRICE_MAX_AGE_DAYS = 4;

export type Researched = {
  company: CompanyRow; score: Score; verdict: VerdictResult; strategies: Record<string, StrategyResult>;
  model: BusinessModel; modelBasis: "sector" | "name" | null; pricesStale: boolean; watched: boolean; hasFundamentals: boolean;
};

const hasValues = (f: Fundamentals) => Object.values(f).some((s) => s?.value !== null && s?.value !== undefined);

export function research(c: CompanyRow, f: Fundamentals, watched: boolean, now = Date.now()): Researched {
  const date = c.technicals?.date;
  const pricesStale = date ? now - Date.parse(date) > PRICE_MAX_AGE_DAYS * 86_400_000 : false;
  const { model, basis } = modelOf(c.sector, c.name);
  const score = scoreCompany(f, c.technicals, { pricesStale, model });
  const verdict = technicalVerdict(c.technicals, score.fundamentalsStrong);
  const cand: Candidate = { f, t: c.technicals, segment: c.segment, model };
  return {
    company: c, score, verdict, model, modelBasis: basis, pricesStale, watched, hasFundamentals: hasValues(f),
    strategies: Object.fromEntries(STRATEGIES.map((s) => [s.id, runStrategy(s, cand)])),
  };
}

export type Funnel = {
  listed: number; eligible: number; excludedInstruments: number; belowLiquidity: number; read: number; unavailable: number;
  stale: number; withFundamentals: number; classified: number;
  strategies: { id: string; title: string; summary: string; matched: number; noMatch: number; notTestable: number; notApplicable: number; blockedBy: string | null }[];
};

const count = (rows: CompanyRow[], e: Eligibility) => rows.filter((c) => c.eligibility === e).length;

export function funnelOf(rows: Researched[], all: CompanyRow[] = rows.map((r) => r.company)): Funnel {
  const read = rows.filter((r) => r.company.technicals);
  return {
    listed: all.length, eligible: count(all, "eligible"), excludedInstruments: count(all, "not-a-company") + count(all, "unidentified"), belowLiquidity: count(all, "below-liquidity"),
    read: read.length, unavailable: rows.filter((r) => r.company.scanned_at && r.company.status === "unavailable").length,
    stale: rows.filter((r) => r.pricesStale).length, withFundamentals: rows.filter((r) => r.hasFundamentals).length, classified: rows.filter((r) => r.company.segment).length,
    strategies: STRATEGIES.map((s) => {
      const n = (x: StrategyResult) => read.filter((r) => r.strategies[s.id] === x).length;
      const notTestable = n("not-testable"), notApplicable = n("not-applicable");
      return {
        id: s.id, title: s.title, summary: s.summary, matched: n("match"), noMatch: n("no-match"), notTestable, notApplicable,
        blockedBy: read.length > 0 && notTestable + notApplicable === read.length ? (s.technical ? "Needs a market scan" : s.needsSegment ? "Needs the AMFI list and fundamentals" : "Needs fundamentals") : null,
      };
    }),
  };
}

/** Reported figures plus calculated ones. Sector medians are taken over eligible companies only. */
function complete(rows: CompanyRow[]) {
  const raw = allFundamentals();
  const medians = sectorMedians(rows.map((c) => {
    const pe = raw.get(c.symbol)?.pe;
    return { sector: c.sector, pe: pe?.state === "ok" ? pe.value : null };
  }));
  return (c: CompanyRow) => derive(raw.get(c.symbol) ?? {}, c.sector ? medians.get(c.sector) ?? null : null);
}

/** Only eligible companies are researched. The rest are counted, so coverage adds up. */
export function loadDiscovery(): { rows: Researched[]; funnel: Funnel } {
  const all = listCompanies();
  const companies = all.filter((c) => c.eligibility === "eligible");
  const watch = new Set(listWatch().map((w) => w.symbol));
  const full = complete(companies);
  const rows = companies.map((c) => research(c, full(c), watch.has(c.symbol)));
  return { rows, funnel: funnelOf(rows, all) };
}

export function loadCompany(symbol: string, watched: boolean): Researched | null {
  const all = listCompanies();
  const c = all.find((x) => x.symbol === symbol);
  if (!c) return null;
  return research(c, complete(all.filter((x) => x.eligibility === "eligible"))(c), watched);
}

/** Ranks thin evidence below strong evidence, and breaks ties on strength against the market. */
export function compareResearch(a: Researched, b: Researched): number {
  return (b.score.adjusted ?? -1) - (a.score.adjusted ?? -1)
    || (b.company.technicals?.relativeStrength?.pct6m ?? -Infinity) - (a.company.technicals?.relativeStrength?.pct6m ?? -Infinity)
    || (b.company.avg_turnover ?? 0) - (a.company.avg_turnover ?? 0);
}

/** A leading = + - @ makes a spreadsheet run a cell as a formula, so text is neutralised. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const raw = String(v);
  const safe = typeof v === "string" && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** The watchlist as a spreadsheet. A value nobody could measure stays blank. */
export function watchlistCsv(rows: Researched[], theses: Map<string, string>): string {
  const head = ["Symbol", "ISIN", "Company", "Business type", "Market cap class", "Sector", "Close", "Price date", "Technical verdict", "Adjusted score", "Points earned", "Points measured", "Confidence", "Thesis"];
  const body = rows.map((r) => [
    r.company.symbol, r.company.isin, r.company.name, r.model, r.company.segment, r.company.sector, r.company.technicals?.close, r.company.technicals?.date,
    r.verdict.verdict, r.score.adjusted, r.score.earned, r.score.measuredPoints, r.score.confidence, theses.get(r.company.symbol),
  ].map(cell).join(","));
  return `${[head.join(","), ...body].join("\n")}\n`;
}
