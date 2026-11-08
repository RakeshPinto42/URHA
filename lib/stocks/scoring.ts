/**
 * The 100-point research score and the discovery strategies. Pure. Every check says what it
 * measured, and a missing value is "unavailable", never a failure and never a point. Each business
 * model gets tests that mean something for it: a bank's leverage is its business, not a red flag.
 * A score is research attention, not a recommendation. Thresholds are provisional, shown in the
 * app, and have not been validated against market outcomes.
 */
import { CHECK_OUTCOME_LABEL, type CheckOutcome } from "./evidence";
import { isImproving, type Technicals } from "./technicals";
import type { BusinessModel } from "./universe";

export const METRICS = {
  roce: "ROCE %", roe: "ROE %", roa: "ROA %", opm: "Operating margin %", cashConversion: "Cash conversion (CFO / profit)", fcf: "Free cash flow, ₹ cr",
  nim: "Net interest margin %", gnpa: "Gross NPA %", nnpa: "Net NPA %", crar: "Capital adequacy %",
  revenueCagr3y: "Revenue CAGR 3y %", profitCagr3y: "Profit CAGR 3y %", qtrProfitGrowth: "Latest quarter profit growth %",
  pe: "P/E", pb: "P/B", peg: "PEG", evEbitda: "EV/EBITDA", peVsSector: "P/E relative to sector median",
  debtEquity: "Debt/equity", promoterHolding: "Promoter holding %", promoterPledge: "Promoter pledge %", dilution3y: "Share count change 3y %",
  roceChange: "ROCE change over 3y, points",
  // Inputs only: these are never scored, they feed the calculated measures in derive.ts.
  cfo: "Cash from operations, ₹ cr", pat: "Net profit, ₹ cr", capex: "Capex, ₹ cr", shares: "Shares outstanding", shares3yAgo: "Shares 3 years ago", roce3yAgo: "ROCE 3 years ago %",
} as const;
export type Metric = keyof typeof METRICS;

/** One metric after comparing sources: a usable value, or the reason there is none. */
export type MetricState = { value: number | null; state: "ok" | "unavailable" | "stale" | "conflict"; source?: string; period?: string | null; note?: string };
export type Fundamentals = Partial<Record<Metric, MetricState>>;

export type Check = { label: string; rule: string; outcome: CheckOutcome; detail: string };
export type Pillar = { key: string; label: string; max: number; points: number; measured: number; total: number; checks: Check[] };

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));

function fundamental(f: Fundamentals, m: Metric, rule: string, test: (v: number) => boolean): Check {
  const s = f[m];
  const label = METRICS[m];
  if (!s || s.state === "unavailable" || s.value === null) {
    const outcome: CheckOutcome = s?.state === "conflict" ? "conflict" : s?.state === "stale" ? "stale" : "unavailable";
    return { label, rule, outcome, detail: s?.note ?? CHECK_OUTCOME_LABEL[outcome] };
  }
  if (s.state === "stale" || s.state === "conflict") return { label, rule, outcome: s.state, detail: s.note ?? CHECK_OUTCOME_LABEL[s.state] };
  return { label, rule, outcome: test(s.value) ? "passed" : "failed", detail: `${fmt(s.value)}${s.source ? `, ${s.source}` : ""}, ${s.period ?? "reporting period not stated"}` };
}

function technical(label: string, rule: string, value: boolean | null, detail: string): Check {
  if (value === null) return { label, rule, outcome: "unavailable", detail: CHECK_OUTCOME_LABEL.unavailable };
  return { label, rule, outcome: value ? "passed" : "failed", detail };
}

function pillar(key: string, label: string, max: number, checks: Check[]): Pillar {
  const passed = checks.filter((c) => c.outcome === "passed").length;
  const measured = checks.filter((c) => c.outcome === "passed" || c.outcome === "failed").length;
  return { key, label, max, points: (max * passed) / checks.length, measured, total: checks.length, checks };
}

const gt = (a: number | null, b: number | null) => (a === null || b === null ? null : a > b);
const pctText = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

export function technicalChecks(t: Technicals | null): Check[] {
  const d = t?.dma, rs = t?.relativeStrength?.pct3m ?? null, r = t?.rsi14 ?? null, h = t?.macd?.hist ?? null;
  const c = t?.close ?? null, s50 = t?.slope.d50Pct ?? null, s200 = t?.slope.d200Pct ?? null;
  return [
    technical("Above 50-day average", "Close above 50 DMA", gt(c, d?.d50 ?? null), d?.d50 ? `${fmt(c!)} against ${fmt(d.d50)}` : ""),
    technical("Above 200-day average", "Close above 200 DMA", gt(c, d?.d200 ?? null), d?.d200 ? `${fmt(c!)} against ${fmt(d.d200)}` : ""),
    technical("Trend stack", "50 DMA above 200 DMA", gt(d?.d50 ?? null, d?.d200 ?? null), d?.d50 && d.d200 ? `${fmt(d.d50)} against ${fmt(d.d200)}` : ""),
    technical("50-day average rising", "Higher than 20 sessions ago", s50 === null ? null : s50 > 0, s50 === null ? "" : pctText(s50)),
    technical("200-day average rising", "Higher than 20 sessions ago", s200 === null ? null : s200 > 0, s200 === null ? "" : pctText(s200)),
    technical("RSI in a healthy range", "RSI 45 to 70", r === null ? null : r >= 45 && r <= 70, r === null ? "" : r.toFixed(0)),
    technical("MACD momentum", "Histogram above zero", h === null ? null : h > 0, h === null ? "" : h.toFixed(2)),
    technical("Relative strength", "Ahead of the Nifty 500 ETF over 3 months", rs === null ? null : rs > 0, rs === null ? "" : `${rs >= 0 ? "+" : ""}${rs.toFixed(1)} points`),
    technical("Structure", "Higher highs and higher lows", t?.structure ? t.structure === "higher-highs-and-lows" : null, t?.structure?.replaceAll("-", " ") ?? ""),
    technical("Volume on up days", "Up-day volume above down-day volume", t?.upDownVolume == null ? null : t.upDownVolume > 1, t?.upDownVolume == null ? "" : `${t.upDownVolume.toFixed(2)} times`),
  ];
}

const atMost = (x: number) => (v: number) => v <= x;
const atLeast = (x: number) => (v: number) => v >= x;
const positiveUpTo = (x: number) => (v: number) => v > 0 && v <= x;

function qualityChecks(f: Fundamentals, model: BusinessModel): Check[] {
  if (model === "lender") return [
    fundamental(f, "roe", "12% or more", atLeast(12)),
    fundamental(f, "roa", "1% or more", atLeast(1)),
    fundamental(f, "nim", "3% or more", atLeast(3)),
    fundamental(f, "gnpa", "4% or less", atMost(4)),
    fundamental(f, "crar", "15% or more", atLeast(15)),
  ];
  if (model === "financial-other") return [fundamental(f, "roe", "15% or more", atLeast(15)), fundamental(f, "roa", "2% or more", atLeast(2))];
  return [
    fundamental(f, "roce", "15% or more", atLeast(15)),
    fundamental(f, "roe", "15% or more", atLeast(15)),
    fundamental(f, "opm", "12% or more", atLeast(12)),
    fundamental(f, "cashConversion", "0.8 or more", atLeast(0.8)),
    fundamental(f, "fcf", "Above zero", (v) => v > 0),
  ];
}

function valuationChecks(f: Fundamentals, model: BusinessModel): Check[] {
  const shared = [fundamental(f, "pe", "30 or less, and above zero", positiveUpTo(30)), fundamental(f, "peg", "1.5 or less, and above zero", positiveUpTo(1.5)), fundamental(f, "peVsSector", "Below the sector median", (v) => v < 1)];
  return model === "lender" || model === "financial-other"
    ? [fundamental(f, "pb", "3 or less, and above zero", positiveUpTo(3)), ...shared]
    : [...shared, fundamental(f, "evEbitda", "18 or less, and above zero", positiveUpTo(18))];
}

function riskChecks(f: Fundamentals, model: BusinessModel): Check[] {
  const shared = [fundamental(f, "promoterPledge", "5% or less", atMost(5)), fundamental(f, "dilution3y", "5% or less", atMost(5))];
  if (model === "lender") return [fundamental(f, "nnpa", "2% or less", atMost(2)), ...shared];
  if (model === "financial-other") return shared;
  // Many strong financials have no promoter, so this test applies to operating companies only.
  return [fundamental(f, "debtEquity", "0.5 or less", atMost(0.5)), fundamental(f, "promoterHolding", "40% or more", atLeast(40)), ...shared];
}

/** Below this share of the 100 points, a company is listed but not scored. */
const MIN_MEASURED_TO_SCORE = 20;
/** Weight of the neutral prior: thin evidence stays close to 50 instead of looking exceptional. */
const PRIOR_POINTS = 40;

export type Confidence = "High" | "Medium" | "Low" | "Very low";

export type Score = {
  /** Points earned, from a possible `measuredPoints`. */
  earned: number; measuredPoints: number;
  /** Earned as a share of what could be tested, or null when too little could. */
  normalised: number | null;
  /** The ranking score: normalised, pulled towards 50 by how little was measured. */
  adjusted: number | null;
  confidence: Confidence; pillars: Pillar[]; fundamentalsStrong: boolean | null;
};

/** High needs every pillar evidenced, so partial data can never read as a confident result. */
export function confidenceOf(measuredPoints: number, pillars: Pillar[]): Confidence {
  const evidenced = pillars.filter((p) => p.measured / p.total >= 0.5).length;
  if (measuredPoints >= 85 && evidenced === pillars.length) return "High";
  if (measuredPoints >= 60 && evidenced >= 4) return "Medium";
  if (measuredPoints >= 35) return "Low";
  return "Very low";
}

/** Tests whose meaning depends on the business. Without a known type, they cannot be judged. */
const MODEL_SPECIFIC: Metric[] = ["roce", "opm", "cashConversion", "fcf", "evEbitda", "debtEquity", "promoterHolding"];

function withoutModelSpecific(f: Fundamentals): Fundamentals {
  const out = { ...f };
  for (const m of MODEL_SPECIFIC) out[m] = { value: null, state: "unavailable", note: "Needs the company's sector, because this test depends on its type of business." };
  return out;
}

export function scoreCompany(given: Fundamentals, t: Technicals | null, opts: { pricesStale?: boolean; model?: BusinessModel } = {}): Score {
  const model = opts.model ?? "unclassified";
  const f = model === "unclassified" ? withoutModelSpecific(given) : given;
  const techChecks = technicalChecks(t).map((c) => (opts.pricesStale && c.outcome !== "unavailable"
    ? { ...c, outcome: "stale" as const, detail: CHECK_OUTCOME_LABEL.stale } : c));
  const pillars = [
    pillar("quality", "Business quality", 25, qualityChecks(f, model)),
    pillar("growth", "Growth", 20, [
      fundamental(f, "revenueCagr3y", "15% or more", atLeast(15)),
      fundamental(f, "profitCagr3y", "15% or more", atLeast(15)),
      fundamental(f, "qtrProfitGrowth", "15% or more", atLeast(15)),
    ]),
    pillar("valuation", "Valuation", 20, valuationChecks(f, model)),
    pillar("technical", "Technical structure", 20, techChecks),
    pillar("governance", "Governance and risk", 15, riskChecks(f, model)),
  ];
  const earned = pillars.reduce((n, p) => n + p.points, 0);
  const measuredPoints = pillars.reduce((n, p) => n + (p.max * p.measured) / p.total, 0);
  const scored = measuredPoints >= MIN_MEASURED_TO_SCORE;
  const core = [...pillars[0]!.checks, ...pillars[1]!.checks];
  const known = core.filter((c) => c.outcome === "passed" || c.outcome === "failed");
  // Strong needs most of quality and growth actually measured. Too little data is unknown, not weak.
  const needed = Math.ceil(core.length * 0.6);
  const fundamentalsStrong = known.length < needed ? null : known.filter((c) => c.outcome === "passed").length / known.length >= 0.7;
  return {
    earned: Math.round(earned * 10) / 10, measuredPoints: Math.round(measuredPoints * 10) / 10,
    normalised: scored ? Math.round((earned / measuredPoints) * 100) : null,
    adjusted: scored ? Math.round(((earned + PRIOR_POINTS / 2) / (measuredPoints + PRIOR_POINTS)) * 100) : null,
    confidence: confidenceOf(measuredPoints, pillars), pillars, fundamentalsStrong,
  };
}

/** What a strategy sees. `segment` is null until an AMFI list has been imported. */
export type Candidate = { f: Fundamentals; t: Technicals | null; segment: "large-cap" | "mid-cap" | "small-cap" | null; model: BusinessModel };

const v = (c: Candidate, m: Metric) => c.f[m]?.value ?? NaN;
type Rule = { needs: Metric[]; match: (c: Candidate) => boolean };
/** How a strategy applies per business model. A model it leaves out cannot be judged by it. */
type Rules = Partial<Record<BusinessModel, Rule>>;

export type Strategy = {
  id: string; title: string; summary: string;
  needsSegment?: boolean; technical?: boolean;
  rules: Rules;
  /** A warning list: one bad value is enough to flag a company. */
  anyValue?: boolean;
};

const everyModel = (rule: Rule): Rules => ({ industrial: rule, lender: rule, "financial-other": rule, unclassified: rule });
const quality = (segment: "small-cap" | "mid-cap"): Rules => ({
  industrial: { needs: ["roce", "roe"], match: (c) => c.segment === segment && v(c, "roce") >= 15 && v(c, "roe") >= 15 },
  lender: { needs: ["roe", "roa"], match: (c) => c.segment === segment && v(c, "roe") >= 14 && v(c, "roa") >= 1 },
  "financial-other": { needs: ["roe"], match: (c) => c.segment === segment && v(c, "roe") >= 15 },
});
const peers = (c: Candidate, floor: Metric, at: number) => v(c, "peVsSector") < 0.8 && v(c, floor) >= at;

export const STRATEGIES: Strategy[] = [
  { id: "undervalued-growth", title: "Undervalued Growth", summary: "Growing at 15% or more on a PEG of 1.2 or less.", rules: everyModel({ needs: ["profitCagr3y", "peg"], match: (c) => v(c, "profitCagr3y") >= 15 && v(c, "peg") > 0 && v(c, "peg") <= 1.2 }) },
  { id: "quality-small-caps", title: "Quality Small Caps", summary: "Small caps with returns of 15% or more. Lenders use ROE and ROA.", needsSegment: true, rules: quality("small-cap") },
  { id: "quality-mid-caps", title: "Quality Mid Caps", summary: "Mid caps with returns of 15% or more. Lenders use ROE and ROA.", needsSegment: true, rules: quality("mid-cap") },
  { id: "emerging-compounders", title: "Emerging Compounders", summary: "Sales and profit compounding at 20%, with strong returns and sound balance sheets.", rules: {
    industrial: { needs: ["revenueCagr3y", "profitCagr3y", "roce", "debtEquity"], match: (c) => v(c, "revenueCagr3y") >= 20 && v(c, "profitCagr3y") >= 20 && v(c, "roce") >= 18 && v(c, "debtEquity") <= 0.5 },
    lender: { needs: ["revenueCagr3y", "profitCagr3y", "roe", "nnpa"], match: (c) => v(c, "revenueCagr3y") >= 20 && v(c, "profitCagr3y") >= 20 && v(c, "roe") >= 14 && v(c, "nnpa") <= 1.5 },
    "financial-other": { needs: ["revenueCagr3y", "profitCagr3y", "roe"], match: (c) => v(c, "revenueCagr3y") >= 20 && v(c, "profitCagr3y") >= 20 && v(c, "roe") >= 18 },
  } },
  { id: "accelerating-earnings", title: "Accelerating Earnings", summary: "Latest quarter's profit growth ahead of the 3-year rate.", rules: everyModel({ needs: ["qtrProfitGrowth", "profitCagr3y"], match: (c) => v(c, "qtrProfitGrowth") > v(c, "profitCagr3y") && v(c, "qtrProfitGrowth") >= 15 }) },
  { id: "improving-roce", title: "Improving ROCE", summary: "ROCE up by 3 points or more over 3 years, to at least 12%. Operating companies only.", rules: { industrial: { needs: ["roceChange", "roce"], match: (c) => v(c, "roceChange") >= 3 && v(c, "roce") >= 12 } } },
  { id: "attractive-peg", title: "Attractive PEG", summary: "PEG between 0 and 1.", rules: everyModel({ needs: ["peg"], match: (c) => v(c, "peg") > 0 && v(c, "peg") <= 1 }) },
  { id: "undervalued-peers", title: "Undervalued Relative to Peers", summary: "P/E under 80% of the sector median, with solid returns.", rules: {
    industrial: { needs: ["peVsSector", "roce"], match: (c) => peers(c, "roce", 12) },
    lender: { needs: ["peVsSector", "roe"], match: (c) => peers(c, "roe", 12) },
    "financial-other": { needs: ["peVsSector", "roe"], match: (c) => peers(c, "roe", 12) },
  } },
  { id: "strong-cash-flow", title: "Strong Cash Flow Businesses", summary: "Positive free cash flow and cash conversion of 0.9 or more. Operating companies only.", rules: { industrial: { needs: ["fcf", "cashConversion"], match: (c) => v(c, "fcf") > 0 && v(c, "cashConversion") >= 0.9 } } },
  { id: "early-technical-accumulation", title: "Early Technical Accumulation", summary: "Range tightening against the prior one, above a rising 50-day average, with volume favouring up days.", technical: true, rules: everyModel({ needs: [], match: (c) => c.t !== null && isImproving(c.t) }) },
  { id: "bullish-breakouts", title: "Bullish Breakouts", summary: "Close through the 60-session high on 1.5 times usual volume.", technical: true, rules: everyModel({ needs: [], match: (c) => c.t?.breakout?.confirmed === true }) },
  { id: "fundamental-turnarounds", title: "Fundamental Turnarounds", summary: "ROCE recovering by 3 points or more while latest profit growth is positive. Operating companies only.", rules: { industrial: { needs: ["roceChange", "qtrProfitGrowth", "roce"], match: (c) => v(c, "roceChange") >= 3 && v(c, "qtrProfitGrowth") > 0 && v(c, "roce") < 15 } } },
  { id: "high-risk-watchlist", title: "High-Risk Watchlist", summary: "Heavy pledge, stretched balance sheet or asset quality, or a share count up over 25%. A warning list, not a pick list.", anyValue: true, rules: {
    industrial: { needs: ["promoterPledge", "debtEquity", "dilution3y"], match: (c) => v(c, "promoterPledge") > 20 || v(c, "debtEquity") > 2 || v(c, "dilution3y") > 25 },
    lender: { needs: ["promoterPledge", "gnpa", "dilution3y"], match: (c) => v(c, "promoterPledge") > 20 || v(c, "gnpa") > 8 || v(c, "dilution3y") > 25 },
    "financial-other": { needs: ["promoterPledge", "dilution3y"], match: (c) => v(c, "promoterPledge") > 20 || v(c, "dilution3y") > 25 },
  } },
];

export type StrategyResult = "match" | "no-match" | "not-testable" | "not-applicable";

export function runStrategy(s: Strategy, c: Candidate): StrategyResult {
  if (s.technical && !c.t) return "not-testable";
  if (s.needsSegment && !c.segment) return "not-testable";
  const rule = s.rules[c.model];
  // Unknown business type: it may yet apply, so this is missing data rather than a mismatch.
  if (!rule) return c.model === "unclassified" ? "not-testable" : "not-applicable";
  const unknown = rule.needs.some((m) => c.f[m]?.state !== "ok" || c.f[m]?.value == null);
  if (s.anyValue) {
    if (rule.match(c)) return "match";
    return unknown ? "not-testable" : "no-match";
  }
  if (unknown) return "not-testable";
  return rule.match(c) ? "match" : "no-match";
}
