/**
 * Technical validation. Pure: bars in, measurements and a verdict out. Thresholds are provisional
 * research defaults, published in the app, and not validated against market outcomes.
 */
import { macd, rsi, sma } from "./indicators";

export type Bar = { date: string; close: number; high: number; low: number; volume: number };

export type Structure = "higher-highs-and-lows" | "lower-highs-and-lows" | "mixed";

export type Technicals = {
  date: string; bars: number; close: number;
  dma: { d20: number | null; d50: number | null; d100: number | null; d200: number | null };
  rsi14: number | null;
  macd: { line: number; signal: number | null; hist: number | null } | null;
  /** Return minus the benchmark's over the same sessions, in percentage points. */
  relativeStrength: { benchmark: string; pct3m: number | null; pct6m: number | null } | null;
  /** 20-session average volume over the 60 sessions before it. */
  volumeTrend: number | null;
  breakout: { confirmed: boolean; level: number; volumeRatio: number | null } | null;
  /** Width of the last 30 sessions' range, as a share of price. */
  consolidationPct: number | null;
  structure: Structure | null;
  high52w: number | null; low52w: number | null; fromHighPct: number | null;
};

const YEAR = 252;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (now: number, then: number) => (then > 0 ? (now / then - 1) * 100 : null);

/** Compares two consecutive 30-session swings, which is enough to see the direction of the structure. */
export function swingStructure(bars: Bar[]): Structure | null {
  if (bars.length < 60) return null;
  const a = bars.slice(-60, -30), b = bars.slice(-30);
  const hi = (x: Bar[]) => Math.max(...x.map((y) => y.high)), lo = (x: Bar[]) => Math.min(...x.map((y) => y.low));
  if (hi(b) > hi(a) && lo(b) > lo(a)) return "higher-highs-and-lows";
  if (hi(b) < hi(a) && lo(b) < lo(a)) return "lower-highs-and-lows";
  return "mixed";
}

function relativeTo(bars: Bar[], benchmark: Bar[], sessions: number): number | null {
  if (bars.length <= sessions) return null;
  const from = bars[bars.length - 1 - sessions]!, to = bars[bars.length - 1]!;
  const byDate = new Map(benchmark.map((b) => [b.date, b.close]));
  const b0 = byDate.get(from.date), b1 = byDate.get(to.date);
  if (b0 === undefined || b1 === undefined) return null; // No matching session: unknown, not zero.
  const own = pct(to.close, from.close), bench = pct(b1, b0);
  return own === null || bench === null ? null : own - bench;
}

export function measure(bars: Bar[], benchmark: { label: string; bars: Bar[] } | null): Technicals | null {
  if (bars.length === 0) return null;
  const closes = bars.map((b) => b.close), volumes = bars.map((b) => b.volume);
  const last = bars[bars.length - 1]!;
  const year = bars.slice(-YEAR);
  const hasYear = bars.length >= 200;
  const high52w = hasYear ? Math.max(...year.map((b) => b.high)) : null;
  const low52w = hasYear ? Math.min(...year.map((b) => b.low)) : null;

  let breakout: Technicals["breakout"] = null;
  if (bars.length >= 61) {
    const prior = bars.slice(-61, -1);
    const level = Math.max(...prior.map((b) => b.high));
    const usual = avg(prior.slice(-20).map((b) => b.volume));
    const volumeRatio = usual > 0 ? last.volume / usual : null;
    // A close through the 60-session high, on at least half as much again as usual volume.
    breakout = { level, volumeRatio, confirmed: last.close > level && (volumeRatio ?? 0) >= 1.5 };
  }

  let consolidationPct: number | null = null;
  if (bars.length >= 30) {
    const w = bars.slice(-30);
    consolidationPct = ((Math.max(...w.map((b) => b.high)) - Math.min(...w.map((b) => b.low))) / last.close) * 100;
  }

  const prior60 = volumes.slice(-80, -20);
  const recent = volumes.slice(-20);
  const m = macd(closes);

  return {
    date: last.date, bars: bars.length, close: last.close,
    dma: { d20: sma(closes, 20), d50: sma(closes, 50), d100: sma(closes, 100), d200: sma(closes, 200) },
    rsi14: rsi(closes),
    macd: m ? { line: m.macd, signal: m.signal, hist: m.hist } : null,
    relativeStrength: benchmark ? {
      benchmark: benchmark.label,
      pct3m: relativeTo(bars, benchmark.bars, 63), pct6m: relativeTo(bars, benchmark.bars, 126),
    } : null,
    volumeTrend: prior60.length === 60 && avg(prior60) > 0 ? avg(recent) / avg(prior60) : null,
    breakout, consolidationPct, structure: swingStructure(bars),
    high52w, low52w, fromHighPct: high52w === null ? null : pct(last.close, high52w),
  };
}

export type Verdict = "BULLISH" | "EARLY ACCUMULATION" | "NEUTRAL" | "BEARISH" | "OVEREXTENDED" | "NOT ENOUGH DATA";

export const VERDICT_MEANING: Record<Verdict, string> = {
  BULLISH: "Positive trend and momentum.",
  "EARLY ACCUMULATION": "Fundamentals are strong and the technical structure is improving.",
  NEUTRAL: "No clear technical confirmation.",
  BEARISH: "Weak trend or negative momentum.",
  OVEREXTENDED: "Strong trend, but potentially unfavourable entry conditions.",
  "NOT ENOUGH DATA": "Fewer than 200 sessions of history, so no verdict is given.",
};

export type VerdictResult = { verdict: Verdict; reasons: string[] };

/** Base building: price holding near its 50-day average, range tight, volume picking up, not in a downtrend. */
export function isImproving(t: Technicals): boolean {
  const { d50, d200 } = t.dma;
  if (d50 === null || d200 === null || t.rsi14 === null) return false;
  return t.close > d50 && t.rsi14 >= 45 && t.rsi14 <= 65 && t.structure !== "lower-highs-and-lows"
    && (t.volumeTrend ?? 0) >= 1.1 && (t.consolidationPct ?? Infinity) <= 30;
}

/**
 * `strongFundamentals` is null when they are unknown. Early Accumulation requires a true value,
 * so unknown fundamentals can never earn it: the note says what is missing instead.
 */
export function technicalVerdict(t: Technicals | null, strongFundamentals: boolean | null): VerdictResult {
  if (!t || t.dma.d200 === null || t.dma.d50 === null || t.rsi14 === null) {
    return { verdict: "NOT ENOUGH DATA", reasons: [`Only ${t?.bars ?? 0} sessions of history; 200 are needed.`] };
  }
  const { d50, d200 } = t.dma;
  const hist = t.macd?.hist ?? null;
  const fromD50 = pct(t.close, d50)!;
  const reasons: string[] = [];

  if (t.close > d50 && d50 > d200 && (t.rsi14 >= 78 || fromD50 >= 25)) {
    reasons.push(t.rsi14 >= 78 ? `RSI is ${t.rsi14.toFixed(0)}, at or above 78.` : `Price is ${fromD50.toFixed(0)}% above its 50-day average.`);
    return { verdict: "OVEREXTENDED", reasons };
  }
  if (t.close < d200 && d50 < d200 && (hist === null || hist < 0 || t.structure === "lower-highs-and-lows")) {
    reasons.push("Price and the 50-day average are below the 200-day average.");
    if (hist !== null && hist < 0) reasons.push("MACD momentum is negative.");
    return { verdict: "BEARISH", reasons };
  }
  if (t.close > d50 && d50 > d200 && t.rsi14 >= 50 && hist !== null && hist > 0 && t.structure === "higher-highs-and-lows") {
    return { verdict: "BULLISH", reasons: ["Price is above a rising 50-day and 200-day stack.", "RSI and MACD are positive, with higher highs and lows."] };
  }
  if (isImproving(t)) {
    if (strongFundamentals === true) return { verdict: "EARLY ACCUMULATION", reasons: ["Range is tightening with rising volume, and fundamentals pass."] };
    reasons.push(strongFundamentals === null
      ? "Structure is improving, but fundamentals are unavailable, so Early Accumulation cannot be confirmed."
      : "Structure is improving, but fundamentals do not pass.");
    return { verdict: "NEUTRAL", reasons };
  }
  return { verdict: "NEUTRAL", reasons: ["The trend, momentum and structure do not line up."] };
}
