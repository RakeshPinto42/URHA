// Corporate-action back-adjustment (Phase 1).
// Factor semantics ported from tej-bazaar MIT pipeline
// (pipeline/actions/factors.py + back_adjust.py, read 2026-10-13):
//   split:   fv_to / fv_from  (face values; missing/invalid → 1.0 passthrough)
//             × bonus part d/(n+d) when a row announces both
//   bonus:   d / (n + d)
//   dividend: (prev_close − cash) / prev_close, clamped to (0, 1]; needs prev close
//   rights/buyback/demerger/merger/other → 1.0 (no price scaling, NSE convention)
// Cumulative: product of factors with ex_date > price date; the ex-date bar
// itself is post-action and stays unchanged. ISIN-less actions are dropped.

import type { AdjustedBar, CorporateAction, RawBar } from "./types";

export function actionFactor(a: CorporateAction, prevClose: number | null): { factor: number; applied: boolean } {
  const t = a.type.toLowerCase();
  if (t === "split") {
    const f = a.faceValueFrom;
    const to = a.faceValueTo;
    if (f === null || to === null || f <= 0) return { factor: 1.0, applied: false };
    let x = to / f;
    if (a.ratioNum !== null && a.ratioDen !== null && a.ratioNum + a.ratioDen > 0) x *= a.ratioDen / (a.ratioNum + a.ratioDen);
    if (!Number.isFinite(x) || x <= 0) return { factor: 1.0, applied: false };
    return { factor: x, applied: true };
  }
  if (t === "bonus") {
    const n = a.ratioNum; const d = a.ratioDen;
    if (n === null || d === null || n + d <= 0) return { factor: 1.0, applied: false };
    return { factor: d / (n + d), applied: true };
  }
  if (t === "dividend") {
    if (a.cashAmount === null || prevClose === null || prevClose <= 0) return { factor: 1.0, applied: false };
    const x = (prevClose - a.cashAmount) / prevClose;
    if (!Number.isFinite(x) || x <= 0 || x > 1) return { factor: 1.0, applied: false };
    return { factor: x, applied: true };
  }
  return { factor: 1.0, applied: false };
}

/** Previous close strictly before ex_date (ex-date bar itself is post-action). */
function prevCloseBefore(bars: RawBar[], exDate: string): number | null {
  let prev: number | null = null;
  for (const b of bars) {
    if (b.date >= exDate) break;
    prev = b.close;
  }
  return prev;
}

export function adjustBars(bars: RawBar[], actions: CorporateAction[]): AdjustedBar[] {
  const sorted = [...bars].sort((a, b) => (a.date < b.date ? -1 : 1));
  // Per (exDate, type-class) keep one factor; same-day same-class payouts combine
  // multiplicatively (dividends) — matches pipeline's per-row factor product.
  const factors: { exDate: string; type: string; factor: number }[] = [];
  for (const a of actions) {
    if (!a.isin) continue; // no join key — drop, like the reference pipeline
    const { factor, applied } = actionFactor(a, prevCloseBefore(sorted, a.exDate));
    if (applied) factors.push({ exDate: a.exDate, type: a.type, factor });
  }
  return sorted.map((b) => {
    let cum = 1.0;
    const used: { exDate: string; type: string; factor: number }[] = [];
    for (const f of factors) {
      if (f.exDate > b.date) { cum *= f.factor; used.push(f); }
    }
    return { ...b, adjFactorCumulative: cum, adjClose: b.close * cum, adjustments: used };
  });
}
