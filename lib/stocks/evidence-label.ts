/**
 * What the historical validation says about a verdict, in a few words, for every place a verdict
 * is shown. Pure: it reads the stored results of the latest complete run, or none.
 */
import type { VerdictStats } from "./backtest";

export type EvidenceLabel = { text: string; tone: "positive" | "negative" | "muted"; detail: string };

export function evidenceLabel(results: VerdictStats[] | null, verdict: string): EvidenceLabel {
  if (verdict === "NOT ENOUGH DATA") return { text: "No verdict", tone: "muted", detail: "Too little price history for a verdict." };
  if (!results) return { text: "Unvalidated", tone: "muted", detail: "No historical validation has run, so this verdict has not been tested." };
  const r = results.find((x) => x.verdict === verdict);
  if (!r || r.status === "too little data") return { text: "Untested", tone: "muted", detail: "Too few historical observations of this verdict to judge it." };
  const ci = Number.isFinite(r.ciLow) && Number.isFinite(r.ciHigh) ? ` (95% interval ${r.ciLow.toFixed(1)} to ${r.ciHigh.toFixed(1)} points against the sample)` : "";
  switch (r.status) {
    case "supported": return { text: "Held historically", tone: "positive", detail: `This verdict's direction held over ten years of history${ci}. A description, not a recommendation.` };
    case "contradicted": return { text: "Contradicted", tone: "negative", detail: `History ran against what this verdict implies${ci}.` };
    case "no claim": return { text: "No claim", tone: "muted", detail: "This verdict makes no directional claim." };
    default: return { text: "No proven edge", tone: "muted", detail: `History does not show a reliable edge for this verdict${ci}.` };
  }
}

/** The 100-point score cannot be validated: fundamentals are not stored as of past dates. */
export const SCORE_STATUS = "Provisional: the score has not been validated, because fundamentals as of past dates are not available.";
