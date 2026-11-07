import { VERDICT_MEANING, type Verdict } from "@/lib/stocks/technicals";

const TONE: Record<Verdict, string> = {
  BULLISH: "bg-positive/15 text-positive",
  "EARLY ACCUMULATION": "bg-accent/15 text-accent",
  NEUTRAL: "bg-control/30 text-ink",
  OVEREXTENDED: "bg-warning/15 text-warning",
  BEARISH: "bg-negative/15 text-negative",
  "NOT ENOUGH DATA": "border border-dashed border-control text-muted",
};

/** Always words, so colour never carries the meaning alone. */
export function VerdictTag({ verdict }: { verdict: Verdict }) {
  return <span title={VERDICT_MEANING[verdict]} className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium ${TONE[verdict]}`}>{verdict}</span>;
}
