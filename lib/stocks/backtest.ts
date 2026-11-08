/**
 * Historical validation of the technical verdicts. Pure, so it is tested without a network.
 *
 * Walk-forward: at each evaluation date the verdict is computed from that date's bars and nothing
 * after it, then the next `horizon` sessions' return is measured against the benchmark's over the
 * same dates. Results are grouped by verdict and judged against what each verdict implies.
 *
 * What it cannot fix, and the page says so: the sample is today's listed companies (survivorship),
 * fundamentals are not point-in-time so Early Accumulation can never fire, windows overlap (the
 * standard error is widened for that, but not perfectly), and costs are a flat assumption.
 */
import { measure, technicalVerdict, type Bar, type Verdict } from "./technicals";

export type BacktestParams = { horizon: number; step: number; from: string; costPct: number };
export const DEFAULT_PARAMS: BacktestParams = { horizon: 60, step: 21, from: "2016-01-01", costPct: 0.4 };

export type Observation = { date: string; symbol: string; verdict: Verdict; ret: number; bench: number; excess: number };

/** The sessions of history the verdict reads, and no more: enough for the 200-day average and the 52-week range. */
const WINDOW = 320;

/** Evaluation dates shared by every company: every `step` sessions of the benchmark from `from`. Shared dates are what let results be grouped by date. */
export function evaluationDates(benchmarkDates: string[], p: BacktestParams = DEFAULT_PARAMS): string[] {
  const first = benchmarkDates.findIndex((d) => d >= p.from);
  if (first < 0) return [];
  const out: string[] = [];
  for (let i = first; i < benchmarkDates.length; i += p.step) out.push(benchmarkDates[i]!);
  return out;
}

export function observe(symbol: string, bars: Bar[], benchmark: Map<string, number>, p: BacktestParams = DEFAULT_PARAMS, dates?: string[]): Observation[] {
  const out: Observation[] = [];
  const index = new Map(bars.map((b, i) => [b.date, i]));
  const when = dates ?? evaluationDates(bars.map((b) => b.date), p);
  for (const date of when) {
    const i = index.get(date);
    if (i === undefined || i < 260 || i + p.horizon >= bars.length) continue;
    const now = bars[i]!, later = bars[i + p.horizon]!;
    const b0 = benchmark.get(now.date), b1 = benchmark.get(later.date);
    if (b0 === undefined || b1 === undefined || now.close <= 0) continue;
    // Only what was known on the day: the bars up to and including it.
    const t = measure(bars.slice(Math.max(0, i - WINDOW + 1), i + 1), null);
    const v = technicalVerdict(t, null).verdict;
    if (v === "NOT ENOUGH DATA") continue;
    const ret = (later.close / now.close - 1) * 100 - p.costPct;
    const bench = (b1 / b0 - 1) * 100;
    out.push({ date: now.date, symbol, verdict: v, ret, bench, excess: ret - bench });
  }
  return out;
}

/** What each verdict claims: a positive or negative excess return to come, or nothing. */
export const EXPECTED: Partial<Record<Verdict, 1 | -1>> = { BULLISH: 1, "EARLY ACCUMULATION": 1, BEARISH: -1, OVEREXTENDED: -1 };

export type VerdictStats = {
  verdict: Verdict | "ALL"; n: number; dates: number;
  meanExcess: number; medianExcess: number; hitRate: number;
  /** Mean excess over all observations on the same dates: what the verdict adds beyond the sample. */
  vsSample: number;
  ciLow: number; ciHigh: number;
  status: "supported" | "contradicted" | "not supported" | "no claim" | "too little data";
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };

/**
 * Groups observations by verdict. The uncertainty is clustered by date (observations on one day move
 * together) and widened by sqrt(horizon / step) for overlapping windows.
 */
export function summarise(raw: Observation[], p: BacktestParams = DEFAULT_PARAMS, minDates = 24): VerdictStats[] {
  // A few extreme moves (multibaggers, or a corporate action a source missed) would otherwise
  // decide every mean: excess returns are winsorised at the 1st and 99th percentiles of the run.
  const sorted = raw.map((o) => o.excess).sort((x, y) => x - y);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))))] ?? 0;
  const lo = at(0.01), hi = at(0.99);
  const obs = raw.map((o) => ({ ...o, excess: Math.min(hi, Math.max(lo, o.excess)) }));
  const byDate = new Map<string, number[]>();
  for (const o of obs) (byDate.get(o.date) ?? byDate.set(o.date, []).get(o.date)!).push(o.excess);
  const dateMean = new Map([...byDate].map(([d, xs]) => [d, mean(xs)]));
  const overlap = Math.sqrt(Math.max(1, p.horizon / p.step));
  const groups: (Verdict | "ALL")[] = ["ALL", "BULLISH", "EARLY ACCUMULATION", "NEUTRAL", "BEARISH", "OVEREXTENDED"];
  return groups.map((g) => {
    const own = g === "ALL" ? obs : obs.filter((o) => o.verdict === g);
    const perDate = new Map<string, number[]>();
    for (const o of own) (perDate.get(o.date) ?? perDate.set(o.date, []).get(o.date)!).push(o.excess - (g === "ALL" ? 0 : dateMean.get(o.date)!));
    const series = [...perDate.values()].map(mean);
    const nDates = series.length;
    const m = nDates ? mean(series) : 0;
    const sd = nDates > 1 ? Math.sqrt(series.reduce((a, x) => a + (x - m) ** 2, 0) / (nDates - 1)) : 0;
    const se = nDates > 1 ? (sd / Math.sqrt(nDates)) * overlap : NaN; // No interval from fewer than two dates.
    const excess = own.map((o) => o.excess);
    const base: VerdictStats = {
      verdict: g, n: own.length, dates: nDates,
      meanExcess: excess.length ? mean(excess) : 0, medianExcess: excess.length ? median(excess) : 0,
      hitRate: excess.length ? excess.filter((x) => x > 0).length / excess.length : 0,
      vsSample: m, ciLow: m - 1.96 * se, ciHigh: m + 1.96 * se, status: "no claim",
    };
    if (g === "ALL") return { ...base, vsSample: 0, ciLow: 0, ciHigh: 0 };
    if (nDates < minDates) return { ...base, status: "too little data" };
    const want = EXPECTED[g];
    if (!want) return base;
    if (want > 0 ? base.ciLow > 0 : base.ciHigh < 0) return { ...base, status: "supported" };
    if (want > 0 ? base.ciHigh < 0 : base.ciLow > 0) return { ...base, status: "contradicted" };
    return { ...base, status: "not supported" };
  });
}

/** A deterministic sample, so a rerun on the same day reads the same companies. */
export function sampleOf<T>(items: T[], size: number, seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a.slice(0, size);
}
