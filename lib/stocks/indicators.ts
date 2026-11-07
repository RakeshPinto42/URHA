// Technical indicators — pure functions over adjusted closes (Phase 1).
// Every function returns null on insufficient history or non-finite input.
// Nulls propagate: no partial-window computation, no zero-fill.

function finite(xs: number[]): boolean {
  return xs.length > 0 && xs.every((v) => Number.isFinite(v));
}

export function sma(values: number[], n: number): number | null {
  if (values.length < n || n <= 0) return null;
  const w = values.slice(-n);
  if (!finite(w)) return null;
  return w.reduce((a, b) => a + b, 0) / n;
}

/** EMA series (seeded with SMA of first n). Null when fewer than n inputs. */
export function emaSeries(values: number[], n: number): number[] | null {
  if (values.length < n || n <= 0 || !finite(values)) return null;
  const k = 2 / (n + 1);
  let e = values.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const out = [e];
  for (let i = n; i < values.length; i++) {
    e = values[i]! * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

export const ema = (values: number[], n: number): number | null => {
  const s = emaSeries(values, n);
  return s === null ? null : s[s.length - 1]!;
};

/** RSI(14) with Wilder smoothing. Needs ≥ period+1 closes. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1 || !finite(closes)) return null;
  let gain = 0; let loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period; let avgLoss = loss / period;
  // Wilder smoothing already embodied: seed over last `period` diffs.
  // For longer series, walk the full history for correctness:
  if (closes.length > period + 1) {
    avgGain = 0; avgLoss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i]! - closes[i - 1]!;
      if (d >= 0) avgGain += d; else avgLoss -= d;
    }
    avgGain /= period; avgLoss /= period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i]! - closes[i - 1]!;
      avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    }
  }
  if (avgLoss === 0) return avgGain === 0 ? null : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** MACD(12,26,9). Needs ≥ 26 + 9 − 1 = 34 closes for a signal value. */
export function macd(
  closes: number[], fast = 12, slow = 26, signalN = 9,
): { macd: number; signal: number | null; hist: number | null } | null {
  if (closes.length < slow || !finite(closes)) return null;
  const fastS = emaSeries(closes, fast);
  const slowS = emaSeries(closes, slow);
  if (!fastS || !slowS) return null;
  // Align: fastS[i] covers closes[i..], slowS[j] covers closes[j+slow-1..].
  const line: number[] = [];
  for (let i = slow - fast; i < fastS.length; i++) line.push(fastS[i]! - slowS[i - (slow - fast)]!);
  const cur = line[line.length - 1]!;
  if (line.length < signalN) return { macd: cur, signal: null, hist: null };
  const sigS = emaSeries(line, signalN);
  if (!sigS) return { macd: cur, signal: null, hist: null };
  const sig = sigS[sigS.length - 1]!;
  return { macd: cur, signal: sig, hist: cur - sig };
}

/** ATR(14) with Wilder smoothing over TR. Needs ≥ period+1 bars. */
export function atr(bars: { high: number; low: number; close: number }[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i]!.high; const l = bars[i]!.low; const pc = bars[i - 1]!.close;
    if (![h, l, pc].every(Number.isFinite)) return null;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  // Wilder: seed SMA of first `period` TRs, then smooth across full history.
  let a = trs.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < trs.length; i++) a = (a * (period - 1) + trs[i]!) / period;
  return a;
}

/** Annualized volatility: σ(daily log returns, 20) × √252. Needs ≥ 21 closes. */
export function volatility(closes: number[], window = 20): number | null {
  if (closes.length < window + 1 || !finite(closes)) return null;
  const rets: number[] = [];
  for (let i = closes.length - window; i < closes.length; i++) {
    if (closes[i - 1]! <= 0 || closes[i]! <= 0) return null;
    rets.push(Math.log(closes[i]! / closes[i - 1]!));
  }
  const m = rets.reduce((a, b) => a + b, 0) / rets.length;
  const v = rets.reduce((a, r) => a + (r - m) ** 2, 0) / rets.length;
  return Math.sqrt(v) * Math.sqrt(252);
}

export function relativeVolume(volumes: number[], window = 20): number | null {
  if (volumes.length < window || !finite(volumes)) return null;
  const w = volumes.slice(-window);
  const m = w.reduce((a, b) => a + b, 0) / window;
  if (m <= 0) return null;
  return volumes[volumes.length - 1]! / m;
}

export function drawdown(closes: number[], window = 252): { drawdownPct: number | null; high52w: number | null; low52w: number | null } {
  const w = closes.slice(-window);
  if (w.length === 0 || !finite(w)) return { drawdownPct: null, high52w: null, low52w: null };
  const hi = Math.max(...w); const lo = Math.min(...w);
  const last = w[w.length - 1]!;
  return { drawdownPct: hi > 0 ? (last - hi) / hi : null, high52w: hi, low52w: lo };
}

export function avgTurnover(turnovers: number[], window: number): number | null {
  if (turnovers.length < window || !finite(turnovers)) return null;
  const w = turnovers.slice(-window);
  return w.reduce((a, b) => a + b, 0) / window;
}
