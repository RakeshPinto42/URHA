// The evidence model for multi-source discovery (docs/PRD_ADDENDUM_STOCK_DISCOVERY.md §4, §8).
// Pure. Two rules matter most:
//   • A missing value is never a failed test. "unavailable" and "failed" stay separate outcomes.
//   • Sources that disagree are never averaged. Every reading is kept, and the likely reason is
//     named so a person can resolve it.

export type StatementBasis = "consolidated" | "standalone" | "unknown";
export type PeriodType = "ttm" | "annual" | "quarterly" | "unknown";

export type Reading = {
  value: number | null;
  /** YYYY-MM-DD the reported period ended. */
  periodEnd: string | null;
  periodType: PeriodType;
  basis: StatementBasis;
  source: string;
  /** ISO time the value was retrieved. */
  retrievedAt: string;
};

export type Comparison =
  | { state: "unavailable"; value: null; readings: Reading[]; reasons: string[] }
  | { state: "single-source" | "agreed"; value: number; readings: Reading[]; reasons: string[] }
  | { state: "conflict"; value: null; readings: Reading[]; reasons: string[] };

/** What a screening test says about a company. Only "failed" is a genuine negative. */
export type CheckOutcome = "passed" | "failed" | "unavailable" | "stale" | "conflict";

export const CHECK_OUTCOME_LABEL: Record<CheckOutcome, string> = {
  passed: "Passed",
  failed: "Failed the test",
  unavailable: "Data unavailable, not a negative result",
  stale: "Data out of date, not a negative result",
  conflict: "Sources disagree, needs manual review",
};

const known = (r: Reading) => r.value !== null && Number.isFinite(r.value);

function differencesIn(a: Reading, b: Reading): string[] {
  const reasons: string[] = [];
  if (a.periodEnd !== b.periodEnd) reasons.push(`Different reporting periods: ${a.periodEnd ?? "unknown"} and ${b.periodEnd ?? "unknown"}.`);
  if (a.periodType !== b.periodType) reasons.push(`Different period types: ${a.periodType} and ${b.periodType}.`);
  if (a.basis !== b.basis) reasons.push(`Different statement basis: ${a.basis} and ${b.basis}.`);
  return reasons;
}

/**
 * Compares what each source reported for one metric. Readings must be listed best source
 * first: an agreed value is that source's own figure, never a blend.
 */
export function compareReadings(readings: Reading[], tolerancePct = 1): Comparison {
  const usable = readings.filter(known);
  if (usable.length === 0) return { state: "unavailable", value: null, readings, reasons: ["No source reported this value."] };
  const first = usable[0]!;
  if (usable.length === 1) return { state: "single-source", value: first.value!, readings, reasons: [] };

  const reasons = new Set<string>();
  let differ = false;
  for (const other of usable.slice(1)) {
    const a = first.value!, b = other.value!;
    const scale = Math.max(Math.abs(a), Math.abs(b));
    if (scale !== 0 && (Math.abs(a - b) / scale) * 100 > tolerancePct) {
      differ = true;
      differencesIn(first, other).forEach((r) => reasons.add(r));
    }
  }
  if (!differ) return { state: "agreed", value: first.value!, readings, reasons: [] };
  if (reasons.size === 0) reasons.add("Same period and basis, so the cause is unresolved.");
  return { state: "conflict", value: null, readings, reasons: [...reasons] };
}

/** True when the newest usable reading was retrieved more than maxAgeDays ago. */
export function isStale(readings: Reading[], maxAgeDays: number, now = Date.now()): boolean {
  const times = readings.filter(known).map((r) => Date.parse(r.retrievedAt)).filter(Number.isFinite);
  return times.length > 0 && now - Math.max(...times) > maxAgeDays * 86_400_000;
}

/** Runs a test over a comparison. The test only ever sees a value that is safe to judge. */
export function evaluateCheck(c: Comparison, test: (value: number) => boolean, opts: { stale?: boolean } = {}): CheckOutcome {
  if (c.state === "unavailable") return "unavailable";
  if (c.state === "conflict") return "conflict";
  if (opts.stale) return "stale";
  return test(c.value) ? "passed" : "failed";
}
