import { describe, expect, it } from "vitest";
import { adjustBars, adjustedVolume, uniqueActions } from "@/lib/stocks/adjust";
import type { CorporateAction, RawBar } from "@/lib/stocks/types";
import { derive, sectorMedians } from "@/lib/stocks/derive";
import { compareResearch, funnelOf, research, watchlistCsv } from "@/lib/stocks/discovery";
import { compareReadings, evaluateCheck, type Reading } from "@/lib/stocks/evidence";
import { parseFundamentalsCsv } from "@/lib/stocks/imports";
import { confidenceOf, runStrategy, scoreCompany, STRATEGIES, type Candidate, type Fundamentals, type Metric, type Pillar } from "@/lib/stocks/scoring";
import { DATA_SOURCES, sourceStatuses } from "@/lib/stocks/sources";
import { currentTechnicals, resolveFundamentals, type CompanyRow } from "@/lib/stocks/store";
import { ENGINE_VERSION, isImproving, isTightening, measure, swingStructure, technicalVerdict, type Bar, type Technicals } from "@/lib/stocks/technicals";
import { averageTurnover, eligibilityOf, instrumentOf, modelOf } from "@/lib/stocks/universe";

const day = (i: number) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
const series = (n: number, at: (i: number) => number, volume: (i: number) => number = () => 1000): Bar[] =>
  Array.from({ length: n }, (_, i) => ({ date: day(i), close: at(i), high: at(i) * 1.01, low: at(i) * 0.99, volume: volume(i) }));
const known = (entries: Partial<Record<Metric, number>>): Fundamentals =>
  Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { value: v, state: "ok" }]));

const baseT = (over: Partial<Technicals> = {}): Technicals => ({
  v: ENGINE_VERSION, date: "2026-11-06", bars: 280, close: 110, dma: { d20: 108, d50: 105, d100: 100, d200: 95 }, slope: { d50Pct: 3, d200Pct: 2 }, rsi14: 60,
  macd: { line: 1, signal: 0.5, hist: 0.5 }, relativeStrength: { benchmark: "x", pct3m: 5, pct6m: 8 }, volumeTrend: 1.2, breakout: { confirmed: false, level: 120, volumeRatio: 1 },
  consolidationPct: 15, priorRangePct: 25, rangeRatio: 0.6, upDownVolume: 1.3, structure: "higher-highs-and-lows", high52w: 120, low52w: 70, fromHighPct: -8, ...over,
});
const fullIndustrial = known({ roce: 30, roe: 30, opm: 25, cashConversion: 1.2, fcf: 50, revenueCagr3y: 25, profitCagr3y: 25, qtrProfitGrowth: 30, pe: 20, peg: 1, evEbitda: 12, peVsSector: 0.7, debtEquity: 0.1, promoterHolding: 60, promoterPledge: 0, dilution3y: 0 });

describe("who belongs in discovery", () => {
  it("decides by ISIN, not by name", () => {
    expect(instrumentOf("INE002A01018")).toBe("company");
    expect(instrumentOf("INF204KB14I2")).toBe("fund");
    expect(instrumentOf("IN9175A01010")).toBe("other");
    expect(instrumentOf(null)).toBe("other");
  });

  it("keeps real companies whose names look like funds", () => {
    expect(eligibilityOf("INE144J01027", 5e7)).toBe("eligible"); // PNB Gilts-style names are never tested.
    expect(eligibilityOf("INF204KB14I2", 5e9)).toBe("not-a-company");
    expect(eligibilityOf(null, 5e9)).toBe("unidentified");
  });

  it("uses a 20-session average, so one busy day does not pass and one quiet day does not fail", () => {
    const quietThenSpike = Array.from({ length: 20 }, (_, i) => new Map([["A", i === 19 ? 15e7 : 1e5]]));
    const a = averageTurnover(quietThenSpike).get("A")!;
    expect(a.average).toBeCloseTo(7.595e6, -3);
    expect(eligibilityOf("INE002A01018", a.average)).toBe("below-liquidity");
    const steadyWithQuietDay = Array.from({ length: 20 }, (_, i) => new Map([["B", i === 19 ? 1e5 : 2e7]]));
    expect(eligibilityOf("INE002A01018", averageTurnover(steadyWithQuietDay).get("B")!.average)).toBe("eligible");
  });

  it("counts a missed session as zero", () => {
    const days = [new Map([["A", 2e7]]), new Map<string, number>()];
    expect(averageTurnover(days).get("A")).toEqual({ average: 1e7, traded: 1 });
  });
});

describe("business models", () => {
  it("reads the filed sector first", () => {
    expect(modelOf("Banks - Private Sector", null).model).toBe("lender");
    expect(modelOf("Finance - NBFC", null).model).toBe("lender");
    expect(modelOf("Insurance", "Anything").model).toBe("financial-other");
    expect(modelOf("Stock/ Commodity Brokers", null).model).toBe("financial-other");
    expect(modelOf("Chemicals", "Something Finance Ltd")).toEqual({ model: "industrial", basis: "sector" });
  });

  it("uses a name only when it is unmistakable, and otherwise stays unknown", () => {
    expect(modelOf(null, "HDFC BANK LTD")).toEqual({ model: "lender", basis: "name" });
    expect(modelOf(null, "BAJAJ HOUSING FINANCE LTD").model).toBe("lender");
    expect(modelOf(null, "ADANI PORT & SEZ LTD")).toEqual({ model: "unclassified", basis: null });
    expect(modelOf(null, "PNB GILTS LIMITED").model).toBe("unclassified");
  });

  it("does not fail a bank for the leverage that is its business", () => {
    const f = known({ debtEquity: 8, roce: 2, roe: 16, roa: 1.4, nim: 4, gnpa: 1.5, crar: 17, nnpa: 0.5 });
    const s = scoreCompany(f, null, { model: "lender" });
    const labels = s.pillars.flatMap((p) => p.checks.map((c) => c.label));
    expect(labels).not.toContain("Debt/equity");
    expect(labels).not.toContain("ROCE %");
    expect(labels).not.toContain("EV/EBITDA");
    expect(labels).not.toContain("Promoter holding %");
    expect(s.pillars[0]!.checks.every((c) => c.outcome === "passed")).toBe(true);
  });

  it("fails a weak lender on asset quality", () => {
    const q = scoreCompany(known({ gnpa: 9, crar: 10 }), null, { model: "lender" }).pillars[0]!.checks;
    expect(q.find((c) => c.label === "Gross NPA %")!.outcome).toBe("failed");
    expect(q.find((c) => c.label === "Capital adequacy %")!.outcome).toBe("failed");
  });

  it("judges an operating company on the operating tests", () => {
    expect(scoreCompany(known({ debtEquity: 8 }), null, { model: "industrial" }).pillars[4]!.checks[0]).toMatchObject({ label: "Debt/equity", outcome: "failed" });
  });

  it("treats a strategy that cannot apply as not applicable, not as a failure", () => {
    const cash = STRATEGIES.find((s) => s.id === "strong-cash-flow")!;
    expect(runStrategy(cash, { f: known({ fcf: 1, cashConversion: 1 }), t: null, segment: null, model: "lender" })).toBe("not-applicable");
    expect(runStrategy(cash, { f: {}, t: null, segment: null, model: "unclassified" })).toBe("not-testable");
  });

  it("does not put a bank on the risk list for leverage", () => {
    const risk = STRATEGIES.find((s) => s.id === "high-risk-watchlist")!;
    const c = (f: Fundamentals, model: Candidate["model"]): Candidate => ({ f, t: null, segment: null, model });
    expect(runStrategy(risk, c(known({ debtEquity: 9, promoterPledge: 0, gnpa: 1, dilution3y: 0 }), "lender"))).toBe("no-match");
    expect(runStrategy(risk, c(known({ debtEquity: 9 }), "industrial"))).toBe("match");
    expect(runStrategy(risk, c(known({ gnpa: 12 }), "lender"))).toBe("match");
  });
});

describe("split-adjusted volume", () => {
  const bar = (type: string, factor: number) => ({ volume: 1000, adjustments: [{ exDate: "2026-01-01", type, factor }] });
  it("scales volume before a split, the opposite way to price", () => {
    expect(adjustedVolume(bar("split", 0.2))).toBeCloseTo(5000); // 1:5 split: five times the shares.
    expect(adjustedVolume(bar("bonus", 0.5))).toBeCloseTo(2000);
  });
  it("ignores dividends, and leaves bars after the action alone", () => {
    expect(adjustedVolume(bar("dividend", 0.98))).toBe(1000);
    expect(adjustedVolume({ volume: 1000, adjustments: [] })).toBe(1000);
  });
});

describe("technical measurements", () => {
  it("computes all four averages only with enough history", () => {
    expect(measure(series(250, (i) => 100 + i * 0.1), null)!.dma.d200).not.toBeNull();
    const short = measure(series(120, (i) => 100 + i), null)!;
    expect(short.dma.d100).not.toBeNull();
    expect(short.dma.d200).toBeNull();
    expect(short.high52w).toBeNull();
  });

  it("measures the slope of each average", () => {
    const up = measure(series(260, (i) => 100 + i), null)!;
    expect(up.slope.d50Pct).toBeGreaterThan(0);
    expect(up.slope.d200Pct).toBeGreaterThan(0);
    const down = measure(series(260, (i) => 400 - i), null)!;
    expect(down.slope.d50Pct).toBeLessThan(0);
    expect(measure(series(210, (i) => 100 + i), null)!.slope.d200Pct).toBeNull(); // Needs 220 sessions.
  });

  it("finds higher highs and lows, and the reverse", () => {
    expect(swingStructure(series(70, (i) => 100 + i))).toBe("higher-highs-and-lows");
    expect(swingStructure(series(70, (i) => 200 - i))).toBe("lower-highs-and-lows");
    expect(swingStructure(series(40, (i) => i))).toBeNull();
  });

  it("confirms a breakout only on a close through the high with volume", () => {
    const flat = (i: number) => (i === 99 ? 112 : 100);
    expect(measure(series(100, flat, (i) => (i === 99 ? 5000 : 1000)), null)!.breakout!.confirmed).toBe(true);
    expect(measure(series(100, flat), null)!.breakout!.confirmed).toBe(false);
  });

  it("measures relative strength against the benchmark, and says so when it cannot", () => {
    const stock = series(100, (i) => 100 + i);
    expect(measure(stock, { label: "b", bars: series(100, () => 100) })!.relativeStrength!.pct3m).toBeGreaterThan(0);
    expect(measure(stock, null)!.relativeStrength).toBeNull();
    expect(measure(stock, { label: "b", bars: [] })!.relativeStrength!.pct3m).toBeNull();
  });

  it("compares the current range with the one before it", () => {
    const swing = (i: number) => (i < 40 ? 100 + (i % 2 ? 15 : -15) : 100 + (i % 2 ? 2 : -2));
    const t = measure(series(60, swing), null)!;
    expect(t.rangeRatio).toBeLessThan(0.5);
    expect(isTightening(t)).toBe(true);
    const wide = measure(series(60, (i) => 100 + (i % 2 ? 15 : -15)), null)!;
    expect(wide.rangeRatio).toBeCloseTo(1, 0);
    expect(isTightening(wide)).toBe(false);
  });

  it("counts volume on up days against down days", () => {
    const t = measure(series(30, (i) => 100 + (i % 2 ? 1 : 0), (i) => (i % 2 ? 3000 : 1000)), null)!;
    expect(t.upDownVolume).toBeCloseTo(3, 1);
  });
});

describe("the technical verdict", () => {
  it("gives each verdict from its own conditions", () => {
    expect(technicalVerdict(baseT(), null).verdict).toBe("BULLISH");
    expect(technicalVerdict(baseT({ rsi14: 82 }), null).verdict).toBe("OVEREXTENDED");
    expect(technicalVerdict(baseT({ close: 135 }), null).verdict).toBe("OVEREXTENDED");
    expect(technicalVerdict(baseT({ close: 80, dma: { d20: 85, d50: 88, d100: 92, d200: 95 }, macd: { line: -1, signal: 0, hist: -1 } }), null).verdict).toBe("BEARISH");
    expect(technicalVerdict(baseT({ structure: "mixed", rangeRatio: 1 }), null).verdict).toBe("NEUTRAL");
  });

  it("will not call a falling average bullish", () => {
    expect(technicalVerdict(baseT({ slope: { d50Pct: 3, d200Pct: -0.1 } }), null).verdict).not.toBe("BULLISH");
    expect(technicalVerdict(baseT({ slope: { d50Pct: -0.1, d200Pct: 2 } }), null).verdict).not.toBe("BULLISH");
    expect(technicalVerdict(baseT({ slope: { d50Pct: 3, d200Pct: null } }), null).verdict).not.toBe("BULLISH");
  });

  it("states the slopes it verified", () => {
    expect(technicalVerdict(baseT(), null).reasons[0]).toContain("3.0%");
  });

  it("will not call a fundamentally unknown company Early Accumulation", () => {
    const improving = baseT({ structure: "mixed", rsi14: 55 });
    expect(isImproving(improving)).toBe(true);
    expect(technicalVerdict(improving, true).verdict).toBe("EARLY ACCUMULATION");
    const unknown = technicalVerdict(improving, null);
    expect(unknown.verdict).toBe("NEUTRAL");
    expect(unknown.reasons[0]).toMatch(/fundamentals are unknown/);
    expect(technicalVerdict(improving, false).verdict).toBe("NEUTRAL");
  });

  it("does not call a wide range improving", () => {
    expect(isImproving(baseT({ structure: "mixed", rsi14: 55, consolidationPct: 28, rangeRatio: 0.7 }))).toBe(false);
    expect(isImproving(baseT({ structure: "mixed", rsi14: 55, rangeRatio: 0.95 }))).toBe(false);
  });

  it("gives no verdict without 200 sessions", () => {
    expect(technicalVerdict(baseT({ dma: { d20: 1, d50: 1, d100: 1, d200: null } }), null).verdict).toBe("NOT ENOUGH DATA");
    expect(technicalVerdict(null, null).verdict).toBe("NOT ENOUGH DATA");
  });
});

describe("the score", () => {
  it("has the five weighted pillars, adding to 100, for every model", () => {
    for (const model of ["industrial", "lender", "financial-other", "unclassified"] as const) {
      const s = scoreCompany({}, null, { model });
      expect(s.pillars.map((p) => [p.label, p.max])).toEqual([["Business quality", 25], ["Growth", 20], ["Valuation", 20], ["Technical structure", 20], ["Governance and risk", 15]]);
    }
  });

  it("does not score a company with too little measured", () => {
    const s = scoreCompany({}, null);
    expect(s.earned).toBe(0);
    expect(s.measuredPoints).toBe(0);
    expect(s.normalised).toBeNull();
    expect(s.adjusted).toBeNull();
    expect(s.confidence).toBe("Very low");
    expect(s.pillars.flatMap((p) => p.checks).every((c) => c.outcome === "unavailable")).toBe(true);
    expect(s.fundamentalsStrong).toBeNull();
  });

  it("separates a real failure from a missing value", () => {
    const q = scoreCompany(known({ roce: 5 }), null, { model: "industrial" }).pillars[0]!;
    expect(q.checks[0]!.outcome).toBe("failed");
    expect(q.checks[1]!.outcome).toBe("unavailable");
    expect(q.measured).toBe(1);
  });

  it("reaches full marks only with all of the evidence", () => {
    const full = scoreCompany(fullIndustrial, baseT(), { model: "industrial" });
    expect(full.earned).toBe(100);
    expect(full.measuredPoints).toBe(100);
    expect(full.normalised).toBe(100);
    expect(full.confidence).toBe("High");
    expect(full.fundamentalsStrong).toBe(true);
  });

  it("lets strong full evidence outrank a perfect but thin result", () => {
    const thin = scoreCompany({}, baseT()).adjusted!;
    const good = scoreCompany(known({ roce: 20, roe: 20, opm: 15, cashConversion: 1, fcf: 5, revenueCagr3y: 20, profitCagr3y: 20, qtrProfitGrowth: 20, pe: 20, peg: 1, evEbitda: 12, peVsSector: 2, debtEquity: 0.1, promoterHolding: 60, promoterPledge: 0, dilution3y: 0 }), baseT({ rsi14: 75 }), { model: "industrial" });
    expect(scoreCompany({}, baseT()).normalised).toBe(100);
    expect(good.normalised!).toBeLessThan(100);
    expect(good.adjusted!).toBeGreaterThan(thin);
  });

  it("does not punish missing data as harshly as a real failure", () => {
    const missing = scoreCompany({}, baseT()).adjusted!;
    const failing = scoreCompany(known({ roce: 1, roe: 1, opm: 1, cashConversion: 0, fcf: -1, revenueCagr3y: 0, profitCagr3y: 0, qtrProfitGrowth: 0 }), baseT(), { model: "industrial" }).adjusted!;
    expect(failing).toBeLessThan(missing);
  });

  it("cannot be high confidence on partial data", () => {
    const p = (measured: number, total = 4): Pillar => ({ key: "k", label: "l", max: 20, points: 0, measured, total, checks: [] });
    expect(confidenceOf(90, [p(4), p(4), p(4), p(4), p(0)])).not.toBe("High");
    expect(confidenceOf(90, [p(4), p(4), p(4), p(4), p(2)])).toBe("High");
    expect(scoreCompany({}, baseT()).confidence).toBe("Very low");
    expect(scoreCompany(known({ roce: 30, roe: 30, opm: 25, cashConversion: 1.2, fcf: 50 }), baseT(), { model: "industrial" }).confidence).toBe("Low");
  });

  it("treats stale prices as stale, not as a pass", () => {
    const t = scoreCompany({}, baseT(), { pricesStale: true }).pillars[3]!;
    expect(t.points).toBe(0);
    expect(t.checks[0]!.outcome).toBe("stale");
  });

  it("does not judge a metric whose sources conflict", () => {
    const f: Fundamentals = { roce: { value: null, state: "conflict", note: "A: 20; B: 10." } };
    expect(scoreCompany(f, null, { model: "industrial" }).pillars[0]!.checks[0]).toMatchObject({ outcome: "conflict", detail: "A: 20; B: 10." });
  });

  it("does not credit a loss-making company for a low P/E", () => {
    expect(scoreCompany(known({ pe: -5 }), null, { model: "industrial" }).pillars[2]!.checks[0]!.outcome).toBe("failed");
  });

  it("needs most of quality and growth measured before calling fundamentals strong", () => {
    expect(scoreCompany(known({ roce: 30, roe: 30 }), null, { model: "industrial" }).fundamentalsStrong).toBeNull();
  });
});

describe("calculated measures", () => {
  const raw = (e: Partial<Record<Metric, number>>) => known(e);

  it("works out what a source does not report", () => {
    const f = derive(raw({ cfo: 120, pat: 100, capex: -30, roce: 18, roce3yAgo: 12, shares: 110, shares3yAgo: 100, pe: 20, profitCagr3y: 25 }), { value: 25, peers: 8 });
    expect(f.cashConversion!.value).toBeCloseTo(1.2);
    expect(f.fcf!.value).toBe(90);
    expect(f.roceChange!.value).toBe(6);
    expect(f.dilution3y!.value).toBeCloseTo(10);
    expect(f.peg!.value).toBeCloseTo(0.8);
    expect(f.peVsSector!.value).toBeCloseTo(0.8);
    expect(f.peVsSector!.source).toContain("8 sector peers");
  });

  it("never overrides a reported value", () => {
    expect(derive(raw({ peg: 3, pe: 20, profitCagr3y: 25 }), null).peg!.value).toBe(3);
  });

  it("will not make a clean number from a disputed or stale input", () => {
    const f: Fundamentals = { cfo: { value: null, state: "conflict" }, pat: { value: 100, state: "ok" } };
    expect(derive(f, null).cashConversion).toMatchObject({ value: null, state: "conflict" });
    const g: Fundamentals = { cfo: { value: 5, state: "stale" }, pat: { value: 100, state: "ok" } };
    expect(derive(g, null).cashConversion!.state).toBe("stale");
  });

  it("refuses a ratio with no meaning", () => {
    expect(derive(raw({ cfo: 50, pat: -10 }), null).cashConversion).toMatchObject({ value: null, state: "unavailable" });
    expect(derive(raw({ pe: 20, profitCagr3y: -5 }), null).peg!.value).toBeNull();
    expect(derive(raw({ pe: -3 }), { value: 20, peers: 6 }).peVsSector!.value).toBeNull();
  });

  it("needs five peers with a positive P/E for a sector median", () => {
    const row = (pe: number | null, sector = "Chem") => ({ sector, pe });
    expect(sectorMedians([row(10), row(20), row(30), row(40)]).size).toBe(0);
    expect(sectorMedians([row(10), row(20), row(30), row(40), row(100), row(-5), row(null)]).get("Chem")).toEqual({ value: 30, peers: 5 });
    expect(derive(raw({ pe: 20 }), null).peVsSector).toMatchObject({ value: null, state: "unavailable" });
  });
});

describe("the strategies", () => {
  const cand = (over: Partial<Candidate> = {}): Candidate => ({ f: {}, t: baseT(), segment: null, model: "industrial", ...over });
  const get = (id: string) => STRATEGIES.find((s) => s.id === id)!;

  it("has the thirteen requested", () => expect(STRATEGIES).toHaveLength(13));

  it("calls missing data not testable, never no match", () => {
    for (const s of STRATEGIES.filter((x) => !x.technical)) expect(runStrategy(s, cand()), s.id).toBe("not-testable");
  });

  it("can actually run every strategy once its inputs exist", () => {
    const f = derive(known({ ...{ roce: 30, roe: 30, revenueCagr3y: 25, profitCagr3y: 25, debtEquity: 0.1, qtrProfitGrowth: 30, pe: 10, fcf: 5, promoterPledge: 0, dilution3y: 0, cashConversion: 1 }, roce3yAgo: 20 }), { value: 20, peers: 6 });
    for (const s of STRATEGIES) expect(runStrategy(s, cand({ f, segment: "small-cap" })), s.id).not.toBe("not-testable");
  });

  it("needs a market-cap class for the size strategies", () => {
    const f = known({ roce: 20, roe: 20 });
    expect(runStrategy(get("quality-small-caps"), cand({ f }))).toBe("not-testable");
    expect(runStrategy(get("quality-small-caps"), cand({ f, segment: "small-cap" }))).toBe("match");
    expect(runStrategy(get("quality-small-caps"), cand({ f, segment: "mid-cap" }))).toBe("no-match");
  });

  it("runs the technical strategies on prices alone", () => {
    expect(runStrategy(get("bullish-breakouts"), cand({ t: baseT({ breakout: { confirmed: true, level: 100, volumeRatio: 2 } }) }))).toBe("match");
    expect(runStrategy(get("bullish-breakouts"), cand())).toBe("no-match");
    expect(runStrategy(get("bullish-breakouts"), cand({ t: null }))).toBe("not-testable");
  });

  it("flags risk from a single bad value", () => {
    expect(runStrategy(get("high-risk-watchlist"), cand({ f: known({ promoterPledge: 40 }) }))).toBe("match");
    expect(runStrategy(get("high-risk-watchlist"), cand({ f: known({ promoterPledge: 1 }) }))).toBe("not-testable");
  });
});

describe("evidence across sources", () => {
  const row = (source: string, value: number) => ({ symbol: "A", metric: "roce" as Metric, source, value, period_end: "2026-03-31", period_type: "annual" as const, basis: "consolidated" as const, retrieved_at: "2026-11-01 00:00:00" });
  const now = Date.parse("2026-11-07T00:00:00Z");

  it("never averages a disagreement", () => {
    const f = resolveFundamentals([row("screener", 20), row("upstox", 10)], now);
    expect(f.roce).toMatchObject({ value: null, state: "conflict" });
    expect(f.roce!.note).toContain("screener: 20");
  });

  it("keeps the value when sources agree, and marks old imports stale", () => {
    expect(resolveFundamentals([row("screener", 20), row("upstox", 20.05)], now).roce).toMatchObject({ value: 20, state: "ok" });
    expect(resolveFundamentals([row("screener", 20)], Date.parse("2027-11-07T00:00:00Z")).roce!.state).toBe("stale");
  });

  it("keeps unavailable apart from failed", () => {
    const r: Reading = { value: null, periodEnd: null, periodType: "unknown", basis: "unknown", source: "x", retrievedAt: "2026-11-07T00:00:00Z" };
    expect(evaluateCheck(compareReadings([r]), () => false)).toBe("unavailable");
  });
});

describe("importing a CSV", () => {
  const csv = "Name,NSE Code,Industry,Return on capital employed,Price to Earning,Pledged percentage,Mystery Column\nAcme,ACME,Chemicals,\"1,234.5\",,12,9\n";

  it("reads known columns, leaves blanks unknown, and reports the rest", () => {
    const r = parseFundamentalsCsv(csv);
    if (!r.ok) throw new Error(r.error);
    expect(r.rows[0]).toMatchObject({ symbol: "ACME", sector: "Chemicals", values: { roce: 1234.5, promoterPledge: 12 } });
    expect(r.rows[0]!.values.pe).toBeUndefined();
    expect(r.ignored).toEqual(["Mystery Column"]);
  });

  it("reads the lender and raw columns", () => {
    const r = parseFundamentalsCsv("NSE Code,Gross NPA,Net NPA,CRAR,Net Interest Margin,Price to Book Value,Cash from operations last year,Profit after tax\nA,2,1,16,4,1.5,10,8\n");
    if (!r.ok) throw new Error(r.error);
    expect(r.rows[0]!.values).toEqual({ gnpa: 2, nnpa: 1, crar: 16, nim: 4, pb: 1.5, cfo: 10, pat: 8 });
  });

  it("refuses a file it cannot match to companies", () => {
    expect(parseFundamentalsCsv("Name,ROCE\nAcme,20\n").ok).toBe(false);
    expect(parseFundamentalsCsv("").ok).toBe(false);
    expect(parseFundamentalsCsv("NSE Code,Colour\nA,red\n").ok).toBe(false);
  });
});

describe("sources", () => {
  const h = { tejhq: { ok: true as const, date: "2026-11-06" }, fundamentals: {}, segments: 0 };
  it("lists what was asked for", () => {
    const names = DATA_SOURCES.map((s) => s.provider).join(" ");
    for (const n of ["Screener", "Trendlyne", "Tijori", "Upstox", "NSE", "BSE", "TrueData", "Yahoo"]) expect(names).toContain(n);
  });
  it("counts only what can supply data today", () => {
    expect(sourceStatuses(h).filter((s) => s.working).map((s) => s.id)).toEqual(["tejhq"]);
    expect(sourceStatuses({ ...h, fundamentals: { screener: 12 } }).find((s) => s.id === "screener")).toMatchObject({ working: true, state: "12 companies imported" });
  });
});

describe("the dashboard model", () => {
  const company = (over: Partial<CompanyRow> = {}): CompanyRow => ({
    symbol: "ACME", isin: "INE000A01000", name: 'Acme, "Ltd"', turnover: 5e7, close: 110, eligibility: "eligible", avg_turnover: 5e7, sessions_traded: 20, technicals: baseT(), closes: [], status: "ok", reason: null,
    scanned_at: "2026-11-07", sector: null, segment: null, avg_mcap_cr: null, list_period: null, ...over,
  });
  const now = Date.parse("2026-11-07T00:00:00Z");

  it("marks old prices stale", () => {
    expect(research(company({ technicals: baseT({ date: "2026-10-01" }) }), {}, false, now).pricesStale).toBe(true);
  });

  it("says which strategies are blocked by missing data", () => {
    const f = funnelOf([research(company(), {}, false, now)]);
    expect(f.strategies.find((s) => s.id === "attractive-peg")!.blockedBy).toBe("Needs fundamentals");
    expect(f.strategies.find((s) => s.id === "quality-small-caps")!.blockedBy).toMatch(/AMFI/);
    expect(f.strategies.find((s) => s.id === "bullish-breakouts")!.blockedBy).toBeNull();
  });

  it("accounts for every listed instrument", () => {
    const all = [company(), company({ symbol: "ETF", eligibility: "not-a-company" }), company({ symbol: "THIN", eligibility: "below-liquidity" }), company({ symbol: "X", eligibility: "unidentified" })];
    const f = funnelOf([research(all[0]!, {}, false, now)], all);
    expect(f.eligible + f.excludedInstruments + f.belowLiquidity).toBe(f.listed);
  });

  it("counts a company with any fundamentals, even a few", () => {
    expect(funnelOf([research(company(), known({ roce: 20 }), false, now)]).withFundamentals).toBe(1);
  });

  it("breaks ties on strength against the market", () => {
    const a = research(company({ symbol: "A", technicals: baseT({ relativeStrength: { benchmark: "x", pct3m: 5, pct6m: 30 } }) }), {}, false, now);
    const b = research(company({ symbol: "B", technicals: baseT({ relativeStrength: { benchmark: "x", pct3m: 5, pct6m: 2 } }) }), {}, false, now);
    expect([b, a].sort(compareResearch)[0]!.company.symbol).toBe("A");
  });

  it("exports a watchlist, quoting commas and leaving unknowns blank", () => {
    const csv = watchlistCsv([research(company(), {}, true, now)], new Map([["ACME", "A thesis"]]));
    expect(csv).toContain('"Acme, ""Ltd"""');
    expect(csv.split("\n")[1]).toContain("unclassified,,,110,");
  });

  it("neutralises spreadsheet formulas in text, but leaves numbers alone", () => {
    for (const bad of ["=HYPERLINK(1)", "+1+1", "-2+3", "@SUM(A1)", "\tx", "\rx"]) {
      const csv = watchlistCsv([research(company(), {}, true, now)], new Map([["ACME", bad]]));
      expect(csv.split("\n").slice(1).join("\n"), bad).not.toMatch(/,"?[=+\-@\t\r][^,]*\n*$/);
    }
    const lossMaker = research(company({ technicals: baseT({ close: -1 }) }), {}, true, now);
    expect(watchlistCsv([lossMaker], new Map())).toContain(",-1,");
  });
});

describe("readings from an older engine", () => {
  it("count as not read, so the pages never meet fields that are missing", () => {
    expect(currentTechnicals(JSON.stringify({ date: "2026-11-06", close: 10 }))).toBeNull();
    expect(currentTechnicals(JSON.stringify({ ...baseT(), v: 1 }))).toBeNull();
    expect(currentTechnicals(JSON.stringify({ ...baseT(), v: 2 }))).toBeNull();
    expect(currentTechnicals(JSON.stringify(baseT()))).not.toBeNull();
    expect(currentTechnicals(null)).toBeNull();
  });
});

describe("a company of unknown type", () => {
  it("is not judged by the operating-company tests", () => {
    const s = scoreCompany(known({ debtEquity: 9, roce: 2, roe: 20, pe: 15 }), null, { model: "unclassified" });
    const checks = s.pillars.flatMap((p) => p.checks);
    expect(checks.find((c) => c.label === "Debt/equity")).toMatchObject({ outcome: "unavailable", detail: expect.stringContaining("sector") });
    expect(checks.find((c) => c.label === "ROCE %")!.outcome).toBe("unavailable");
    expect(checks.find((c) => c.label === "ROE %")!.outcome).toBe("passed");
    expect(checks.find((c) => c.label === "P/E")!.outcome).toBe("passed");
  });
});

describe("corporate actions listed on both exchanges", () => {
  const action = (over: Partial<CorporateAction>): CorporateAction => ({
    exchange: "NSE", symbol: "A", isin: "INE000A01000", exDate: "2026-01-14", recordDate: null, type: "split", ratioNum: null, ratioDen: null, cashAmount: null, faceValueFrom: 5, faceValueTo: 1, rawSubject: "", ...over,
  });
  const bar = (date: string, close: number): RawBar => ({ date, open: close, high: close, low: close, close, volume: 1000, turnover: 1 });

  it("applies a split once, so the adjusted price does not jump", () => {
    const a = adjustBars([bar("2026-01-13", 2125), bar("2026-01-14", 425)], [action({}), action({ exchange: "BSE" })]);
    expect(a[0]!.adjClose).toBeCloseTo(425);
    expect(a[1]!.adjClose).toBeCloseTo(425);
  });

  it("applies a bonus once", () => {
    const b = action({ type: "bonus", ratioNum: 1, ratioDen: 1, faceValueFrom: null, faceValueTo: null });
    expect(adjustBars([bar("2026-01-13", 800), bar("2026-01-14", 400)], [b, { ...b, exchange: "BSE" }])[0]!.adjClose).toBeCloseTo(400);
  });

  it("counts a dividend once, and scales volume once", () => {
    const d = action({ type: "dividend", cashAmount: 10, faceValueFrom: null, faceValueTo: null });
    expect(uniqueActions([d, { ...d, exchange: "BSE" }])).toHaveLength(1);
    expect(adjustedVolume(adjustBars([bar("2026-01-13", 2125)], [action({}), action({ exchange: "BSE" })])[0]!)).toBeCloseTo(5000);
  });

  it("keeps different payouts on one day, and events only one exchange reports", () => {
    const interim = action({ type: "dividend", cashAmount: 5, faceValueFrom: null, faceValueTo: null });
    const special = { ...interim, cashAmount: 20 };
    expect(uniqueActions([interim, special])).toHaveLength(2);
    expect(uniqueActions([interim, { ...interim, exchange: "BSE" }, special, { ...special, exchange: "BSE" }])).toHaveLength(2);
    expect(uniqueActions([action({ exchange: "BSE" })])).toHaveLength(1);
  });
});

describe("abbreviated names in the market list", () => {
  it("recognises the short forms of financial names", () => {
    expect(modelOf(null, "POWER FIN CORP LTD.").model).toBe("lender");
    expect(modelOf(null, "CHOLAMANDALAM IN & FIN CO").model).toBe("lender");
    expect(modelOf(null, "HDFC LIFE INS CO LTD").model).toBe("financial-other");
    expect(modelOf(null, "LIFE INSURA CORP OF INDIA").model).toBe("financial-other");
    expect(modelOf(null, "HDFC AMC LIMITED").model).toBe("financial-other");
  });
  it("does not trip on words that merely contain those letters", () => {
    for (const n of ["FINOLEX CABLES LTD", "INSECTICIDES INDIA LTD", "BANKING SOFT LTD", "FINEOTEX CHEMICAL LIMITED", "MAGIC SOFT"]) expect(modelOf(null, n).model, n).toBe("unclassified");
  });
});
