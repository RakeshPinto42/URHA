import { describe, expect, it } from "vitest";
import { evidenceLabel } from "@/lib/stocks/evidence-label";
import type { VerdictStats } from "@/lib/stocks/backtest";

const stat = (verdict: string, status: VerdictStats["status"], ciLow = -1, ciHigh = 2): VerdictStats =>
  ({ verdict, status, n: 500, dates: 100, meanExcess: 1, hitRate: 0.5, vsSample: 0.5, ciLow, ciHigh } as VerdictStats);

describe("verdict evidence labels", () => {
  it("calls every verdict unvalidated when no run exists", () => {
    expect(evidenceLabel(null, "BULLISH").text).toBe("Unvalidated");
  });
  it("never shows an edge the run did not find", () => {
    const r = [stat("BULLISH", "not supported"), stat("BEARISH", "supported", -5, -1), stat("OVEREXTENDED", "too little data")];
    expect(evidenceLabel(r, "BULLISH")).toMatchObject({ text: "No proven edge", tone: "muted" });
    expect(evidenceLabel(r, "BEARISH")).toMatchObject({ text: "Held historically", tone: "positive" });
    expect(evidenceLabel(r, "OVEREXTENDED").text).toBe("Untested");
    expect(evidenceLabel(r, "EARLY ACCUMULATION").text).toBe("Untested");
  });
  it("keeps the interval out when it is not a number", () => {
    expect(evidenceLabel([stat("BULLISH", "not supported", NaN, NaN)], "BULLISH").detail).not.toMatch(/NaN/);
  });
});
