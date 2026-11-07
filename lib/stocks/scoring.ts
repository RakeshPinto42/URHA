/**
 * The 100-point research score and the discovery strategies. Pure. Every check says what it
 * measured, and a missing value is "unavailable", never a failure and never a point. A score is
 * research attention, not a recommendation. Thresholds are provisional and shown in the app.
 */
import { CHECK_OUTCOME_LABEL, type CheckOutcome } from "./evidence";
import { isImproving, type Technicals } from "./technicals";

export const METRICS = {
  roce: "ROCE %", roe: "ROE %", opm: "Operating margin %", cashConversion: "Cash conversion (CFO / profit)", fcf: "Free cash flow, ₹ cr",
  revenueCagr3y: "Revenue CAGR 3y %", profitCagr3y: "Profit CAGR 3y %", qtrProfitGrowth: "Latest quarter profit growth %",
  pe: "P/E", peg: "PEG", evEbitda: "EV/EBITDA", peVsSector: "P/E relative to sector median",
  debtEquity: "Debt/equity", promoterHolding: "Promoter holding %", promoterPledge: "Promoter pledge %", dilution3y: "Share count change 3y %",
  roceChange: "ROCE change over 3y, points",
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
  return { key, label, max, points: Math.round((max * passed) / checks.length), measured, total: checks.length, checks };
}

const gt = (a: number | null, b: number | null) => (a === null || b === null ? null : a > b);

export function technicalChecks(t: Technicals | null): Check[] {
  const d = t?.dma, rs = t?.relativeStrength?.pct3m ?? null, r = t?.rsi14 ?? null, h = t?.macd?.hist ?? null;
  const c = t?.close ?? null;
  return [
    technical("Above 50-day average", "Close above 50 DMA", gt(c, d?.d50 ?? null), d?.d50 ? `${fmt(c!)} against ${fmt(d.d50)}` : ""),
    technical("Above 200-day average", "Close above 200 DMA", gt(c, d?.d200 ?? null), d?.d200 ? `${fmt(c!)} against ${fmt(d.d200)}` : ""),
    technical("Trend stack", "50 DMA above 200 DMA", gt(d?.d50 ?? null, d?.d200 ?? null), d?.d50 && d.d200 ? `${fmt(d.d50)} against ${fmt(d.d200)}` : ""),
    technical("RSI in a healthy range", "RSI 45 to 70", r === null ? null : r >= 45 && r <= 70, r === null ? "" : r.toFixed(0)),
    technical("MACD momentum", "Histogram above zero", h === null ? null : h > 0, h === null ? "" : h.toFixed(2)),
    technical("Relative strength", "Ahead of the Nifty 500 ETF over 3 months", rs === null ? null : rs > 0, rs === null ? "" : `${rs >= 0 ? "+" : ""}${rs.toFixed(1)} points`),
    technical("Structure", "Higher highs and higher lows", t?.structure ? t.structure === "higher-highs-and-lows" : null, t?.structure?.replaceAll("-", " ") ?? ""),
    technical("Volume trend", "20-session volume above the prior 60", t?.volumeTrend == null ? null : t.volumeTrend > 1, t?.volumeTrend == null ? "" : `${t.volumeTrend.toFixed(2)} times`),
  ];
}

export type Confidence = "High" | "Medium" | "Low" | "Very low";

export type Score = {
  /** Points earned out of 100. Unmeasured checks earn nothing, so read it with `measuredPoints`. */
  total: number;
  /** How many of the 100 points could be tested at all. */
  measuredPoints: number;
  confidence: Confidence; pillars: Pillar[]; fundamentalsStrong: boolean | null;
};

export function scoreCompany(f: Fundamentals, t: Technicals | null, opts: { pricesStale?: boolean } = {}): Score {
  const techChecks = technicalChecks(t).map((c) => (opts.pricesStale && c.outcome !== "unavailable"
    ? { ...c, outcome: "stale" as const, detail: CHECK_OUTCOME_LABEL.stale } : c));
  const pillars = [
    pillar("quality", "Business quality", 25, [
      fundamental(f, "roce", "15% or more", (v) => v >= 15),
      fundamental(f, "roe", "15% or more", (v) => v >= 15),
      fundamental(f, "opm", "12% or more", (v) => v >= 12),
      fundamental(f, "cashConversion", "0.8 or more", (v) => v >= 0.8),
      fundamental(f, "fcf", "Above zero", (v) => v > 0),
    ]),
    pillar("growth", "Growth", 20, [
      fundamental(f, "revenueCagr3y", "15% or more", (v) => v >= 15),
      fundamental(f, "profitCagr3y", "15% or more", (v) => v >= 15),
      fundamental(f, "qtrProfitGrowth", "15% or more", (v) => v >= 15),
    ]),
    pillar("valuation", "Valuation", 20, [
      fundamental(f, "pe", "30 or less, and above zero", (v) => v > 0 && v <= 30),
      fundamental(f, "peg", "1.5 or less, and above zero", (v) => v > 0 && v <= 1.5),
      fundamental(f, "evEbitda", "18 or less, and above zero", (v) => v > 0 && v <= 18),
      fundamental(f, "peVsSector", "Below the sector median", (v) => v < 1),
    ]),
    pillar("technical", "Technical structure", 20, techChecks),
    pillar("governance", "Governance and risk", 15, [
      fundamental(f, "debtEquity", "0.5 or less", (v) => v <= 0.5),
      fundamental(f, "promoterHolding", "40% or more", (v) => v >= 40),
      fundamental(f, "promoterPledge", "5% or less", (v) => v <= 5),
      fundamental(f, "dilution3y", "5% or less", (v) => v <= 5),
    ]),
  ];
  const total = pillars.reduce((n, p) => n + p.points, 0);
  const measuredPoints = Math.round(pillars.reduce((n, p) => n + (p.max * p.measured) / p.total, 0));
  const confidence: Confidence = measuredPoints >= 85 ? "High" : measuredPoints >= 60 ? "Medium" : measuredPoints >= 35 ? "Low" : "Very low";

  const core = [...pillars[0]!.checks, ...pillars[1]!.checks];
  const known = core.filter((c) => c.outcome === "passed" || c.outcome === "failed");
  // Strong needs most of quality and growth actually measured. Too little data is unknown, not weak.
  const fundamentalsStrong = known.length < 5 ? null : known.filter((c) => c.outcome === "passed").length / known.length >= 0.7;
  return { total, measuredPoints, confidence, pillars, fundamentalsStrong };
}

/** What a strategy sees. `segment` is null until an AMFI list has been imported. */
export type Candidate = { f: Fundamentals; t: Technicals | null; segment: "large-cap" | "mid-cap" | "small-cap" | null; turnoverCr: number | null };

export type Strategy = {
  id: string; title: string; summary: string;
  /** Everything it must be able to read. Without these, a company is "not testable", not "no match". */
  needs: Metric[]; needsSegment?: boolean; technical?: boolean;
  match: (c: Candidate) => boolean;
};

const v = (c: Candidate, m: Metric) => c.f[m]?.value ?? NaN;

export const STRATEGIES: Strategy[] = [
  { id: "undervalued-growth", title: "Undervalued Growth", summary: "Growing at 15% or more on a PEG of 1.2 or less.", needs: ["profitCagr3y", "peg"], match: (c) => v(c, "profitCagr3y") >= 15 && v(c, "peg") > 0 && v(c, "peg") <= 1.2 },
  { id: "quality-small-caps", title: "Quality Small Caps", summary: "Small caps with ROCE and ROE of 15% or more.", needs: ["roce", "roe"], needsSegment: true, match: (c) => c.segment === "small-cap" && v(c, "roce") >= 15 && v(c, "roe") >= 15 },
  { id: "quality-mid-caps", title: "Quality Mid Caps", summary: "Mid caps with ROCE and ROE of 15% or more.", needs: ["roce", "roe"], needsSegment: true, match: (c) => c.segment === "mid-cap" && v(c, "roce") >= 15 && v(c, "roe") >= 15 },
  { id: "emerging-compounders", title: "Emerging Compounders", summary: "Sales and profit compounding at 20% with ROCE of 18% and low debt.", needs: ["revenueCagr3y", "profitCagr3y", "roce", "debtEquity"], match: (c) => v(c, "revenueCagr3y") >= 20 && v(c, "profitCagr3y") >= 20 && v(c, "roce") >= 18 && v(c, "debtEquity") <= 0.5 },
  { id: "accelerating-earnings", title: "Accelerating Earnings", summary: "Latest quarter's profit growth ahead of the 3-year rate.", needs: ["qtrProfitGrowth", "profitCagr3y"], match: (c) => v(c, "qtrProfitGrowth") > v(c, "profitCagr3y") && v(c, "qtrProfitGrowth") >= 15 },
  { id: "improving-roce", title: "Improving ROCE", summary: "ROCE up by 3 points or more over 3 years, to at least 12%.", needs: ["roceChange", "roce"], match: (c) => v(c, "roceChange") >= 3 && v(c, "roce") >= 12 },
  { id: "attractive-peg", title: "Attractive PEG", summary: "PEG between 0 and 1.", needs: ["peg"], match: (c) => v(c, "peg") > 0 && v(c, "peg") <= 1 },
  { id: "undervalued-peers", title: "Undervalued Relative to Peers", summary: "P/E under 80% of the sector median, with ROCE of 12% or more.", needs: ["peVsSector", "roce"], match: (c) => v(c, "peVsSector") < 0.8 && v(c, "roce") >= 12 },
  { id: "strong-cash-flow", title: "Strong Cash Flow Businesses", summary: "Positive free cash flow and cash conversion of 0.9 or more.", needs: ["fcf", "cashConversion"], match: (c) => v(c, "fcf") > 0 && v(c, "cashConversion") >= 0.9 },
  { id: "early-technical-accumulation", title: "Early Technical Accumulation", summary: "Range tightening above the 50-day average on rising volume.", needs: [], technical: true, match: (c) => c.t !== null && isImproving(c.t) },
  { id: "bullish-breakouts", title: "Bullish Breakouts", summary: "Close through the 60-session high on 1.5 times usual volume.", needs: [], technical: true, match: (c) => c.t?.breakout?.confirmed === true },
  { id: "fundamental-turnarounds", title: "Fundamental Turnarounds", summary: "ROCE recovering by 3 points or more while latest profit growth is positive.", needs: ["roceChange", "qtrProfitGrowth"], match: (c) => v(c, "roceChange") >= 3 && v(c, "qtrProfitGrowth") > 0 && v(c, "roce") < 15 },
  { id: "high-risk-watchlist", title: "High-Risk Watchlist", summary: "Pledge above 20%, debt/equity above 2, or a share count up over 25%. A warning list, not a pick list.", needs: ["promoterPledge", "debtEquity", "dilution3y"], match: (c) => v(c, "promoterPledge") > 20 || v(c, "debtEquity") > 2 || v(c, "dilution3y") > 25 },
];

export type StrategyResult = "match" | "no-match" | "not-testable";

export function runStrategy(s: Strategy, c: Candidate): StrategyResult {
  if (s.technical && !c.t) return "not-testable";
  if (s.needsSegment && !c.segment) return "not-testable";
  const unknown = s.needs.some((m) => c.f[m]?.state !== "ok" || c.f[m]?.value == null);
  // The risk list trips on any one bad value, so a partial picture can still flag a company.
  if (s.id === "high-risk-watchlist") {
    if (s.match(c)) return "match";
    return unknown ? "not-testable" : "no-match";
  }
  if (unknown) return "not-testable";
  return s.match(c) ? "match" : "no-match";
}
