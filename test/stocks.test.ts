import { describe, expect, it } from "vitest";
import { compareReadings, evaluateCheck, type Reading } from "@/lib/stocks/evidence";
import { parseFundamentalsCsv } from "@/lib/stocks/imports";
import { runStrategy, scoreCompany, STRATEGIES, type Candidate, type Fundamentals, type Metric } from "@/lib/stocks/scoring";
import { resolveFundamentals } from "@/lib/stocks/store";
import { measure, swingStructure, technicalVerdict, type Bar, type Technicals } from "@/lib/stocks/technicals";
import { DATA_SOURCES, sourceStatuses } from "@/lib/stocks/sources";
import { funnelOf, research, watchlistCsv } from "@/lib/stocks/discovery";
import type { CompanyRow } from "@/lib/stocks/store";

const day = (i: number) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
const series = (n: number, at: (i: number) => number, volume: (i: number) => number = () => 1000): Bar[] =>
  Array.from({ length: n }, (_, i) => ({ date: day(i), close: at(i), high: at(i) * 1.01, low: at(i) * 0.99, volume: volume(i) }));
const known = (entries: Partial<Record<Metric, number>>): Fundamentals =>
  Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, { value: v, state: "ok" }]));

const baseT = (over: Partial<Technicals> = {}): Technicals => ({
  date: "2026-11-06", bars: 280, close: 110, dma: { d20: 108, d50: 105, d100: 100, d200: 95 }, rsi14: 60, macd: { line: 1, signal: 0.5, hist: 0.5 },
  relativeStrength: { benchmark: "x", pct3m: 5, pct6m: 8 }, volumeTrend: 1.2, breakout: { confirmed: false, level: 120, volumeRatio: 1 },
  consolidationPct: 15, structure: "higher-highs-and-lows", high52w: 120, low52w: 70, fromHighPct: -8, ...over,
});

describe("technical measurements", () => {
  it("computes all four averages only with enough history", () => {
    const t = measure(series(250, (i) => 100 + i * 0.1), null)!;
    expect(t.dma.d200).not.toBeNull();
    const short = measure(series(120, (i) => 100 + i), null)!;
    expect(short.dma.d100).not.toBeNull();
    expect(short.dma.d200).toBeNull();
    expect(short.high52w).toBeNull();
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
    const bench = series(100, () => 100);
    expect(measure(stock, { label: "b", bars: bench })!.relativeStrength!.pct3m).toBeGreaterThan(0);
    expect(measure(stock, null)!.relativeStrength).toBeNull();
    expect(measure(stock, { label: "b", bars: [] })!.relativeStrength!.pct3m).toBeNull();
  });
});

describe("the technical verdict", () => {
  it("gives each verdict from its own conditions", () => {
    expect(technicalVerdict(baseT(), null).verdict).toBe("BULLISH");
    expect(technicalVerdict(baseT({ rsi14: 82 }), null).verdict).toBe("OVEREXTENDED");
    expect(technicalVerdict(baseT({ close: 135 }), null).verdict).toBe("OVEREXTENDED");
    expect(technicalVerdict(baseT({ close: 80, dma: { d20: 85, d50: 88, d100: 92, d200: 95 }, macd: { line: -1, signal: 0, hist: -1 } }), null).verdict).toBe("BEARISH");
    expect(technicalVerdict(baseT({ structure: "mixed", volumeTrend: 0.8 }), null).verdict).toBe("NEUTRAL");
  });

  it("will not call a fundamentally unknown company Early Accumulation", () => {
    const improving = baseT({ structure: "mixed", rsi14: 55 });
    expect(technicalVerdict(improving, true).verdict).toBe("EARLY ACCUMULATION");
    const unknown = technicalVerdict(improving, null);
    expect(unknown.verdict).toBe("NEUTRAL");
    expect(unknown.reasons[0]).toMatch(/fundamentals are unavailable/);
    expect(technicalVerdict(improving, false).verdict).toBe("NEUTRAL");
  });

  it("gives no verdict without 200 sessions", () => {
    expect(technicalVerdict(baseT({ dma: { d20: 1, d50: 1, d100: 1, d200: null } }), null).verdict).toBe("NOT ENOUGH DATA");
    expect(technicalVerdict(null, null).verdict).toBe("NOT ENOUGH DATA");
  });
});

describe("the score", () => {
  it("has the five weighted pillars, adding to 100", () => {
    const s = scoreCompany({}, null);
    expect(s.pillars.map((p) => [p.label, p.max])).toEqual([["Business quality", 25], ["Growth", 20], ["Valuation", 20], ["Technical structure", 20], ["Governance and risk", 15]]);
    expect(s.pillars.reduce((n, p) => n + p.max, 0)).toBe(100);
  });

  it("awards nothing for missing data and shows it as unavailable, not failed", () => {
    const s = scoreCompany({}, null);
    expect(s.total).toBe(0);
    expect(s.measuredPoints).toBe(0);
    expect(s.confidence).toBe("Very low");
    expect(s.pillars.flatMap((p) => p.checks).every((c) => c.outcome === "unavailable")).toBe(true);
    expect(s.fundamentalsStrong).toBeNull();
  });

  it("separates a real failure from a missing value", () => {
    const q = scoreCompany(known({ roce: 5 }), null).pillars[0]!;
    expect(q.checks[0]!.outcome).toBe("failed");
    expect(q.checks[1]!.outcome).toBe("unavailable");
    expect(q.measured).toBe(1);
  });

  it("reduces confidence with missing data, and reaches full marks only with all of it", () => {
    const all = known({ roce: 30, roe: 30, opm: 25, cashConversion: 1.2, fcf: 50, revenueCagr3y: 25, profitCagr3y: 25, qtrProfitGrowth: 30, pe: 20, peg: 1, evEbitda: 12, peVsSector: 0.7, debtEquity: 0.1, promoterHolding: 60, promoterPledge: 0, dilution3y: 0 });
    const full = scoreCompany(all, baseT());
    expect(full.total).toBe(100);
    expect(full.measuredPoints).toBe(100);
    expect(full.confidence).toBe("High");
    expect(full.fundamentalsStrong).toBe(true);
    expect(scoreCompany({}, baseT()).confidence).toBe("Very low");
  });

  it("treats stale prices as stale, not as a pass", () => {
    const t = scoreCompany({}, baseT(), { pricesStale: true }).pillars[3]!;
    expect(t.points).toBe(0);
    expect(t.checks[0]!.outcome).toBe("stale");
  });

  it("does not judge a metric whose sources conflict", () => {
    const f: Fundamentals = { roce: { value: null, state: "conflict", note: "A: 20; B: 10." } };
    expect(scoreCompany(f, null).pillars[0]!.checks[0]).toMatchObject({ outcome: "conflict", detail: "A: 20; B: 10." });
  });

  it("does not credit a loss-making company for a low P/E", () => {
    expect(scoreCompany(known({ pe: -5 }), null).pillars[2]!.checks[0]!.outcome).toBe("failed");
  });
});

describe("the strategies", () => {
  const cand = (over: Partial<Candidate> = {}): Candidate => ({ f: {}, t: baseT(), segment: null, turnoverCr: 5, ...over });
  const get = (id: string) => STRATEGIES.find((s) => s.id === id)!;

  it("has the thirteen requested", () => expect(STRATEGIES).toHaveLength(13));

  it("calls missing data not testable, never no match", () => {
    for (const s of STRATEGIES.filter((x) => !x.technical)) expect(runStrategy(s, cand()), s.id).toBe("not-testable");
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
    symbol: "ACME", isin: "INE000A01000", name: 'Acme, "Ltd"', turnover: 5e7, close: 110, technicals: baseT(), closes: [], status: "ok", reason: null,
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

  it("exports a watchlist, quoting commas and leaving unknowns blank", () => {
    const csv = watchlistCsv([research(company(), {}, true, now)], new Map([["ACME", "A thesis"]]));
    expect(csv).toContain('"Acme, ""Ltd"""');
    expect(csv.split("\n")[1]).toContain(",,,110,"); // No market-cap class or sector.
  });
});
