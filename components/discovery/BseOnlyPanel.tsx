/**
 * Companies listed only on BSE: price coverage built from BSE's own files, with no fundamentals.
 * Shown apart from the main board, because nothing here can be scored.
 */
import { bseState, BSE_SESSIONS, MIN_AVG_TURNOVER } from "@/lib/stocks/bse-history";
import { evidenceLabel } from "@/lib/stocks/evidence-label";
import { officialCoverage } from "@/lib/stocks/official";
import { verdictEvidence } from "@/lib/stocks/validation";
import { BseHistoryControl } from "./EvidenceControls";
import { VerdictTag } from "./VerdictTag";

const SHOWN = 60;
const cr = (n: number) => (n / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 1 });

export function BseOnlyPanel() {
  const { summary, ...job } = bseState();
  const coverage = officialCoverage();
  const evidence = verdictEvidence()?.results ?? null;
  return (
    <section aria-labelledby="bse-h" className="mt-10 border-t border-border pt-6">
      <h2 id="bse-h" className="text-[14px] font-semibold">Companies listed only on BSE</h2>
      <p className="mt-1 max-w-[86ch] text-[13px] text-muted">
        {coverage ? `${coverage.bseOnly.toLocaleString("en-IN")} companies trade only on BSE (${coverage.bseDate}). ` : ""}
        The market-data source covers few of them, so their prices come from BSE&apos;s own daily files, adjusted with the corporate-actions feed. They have price coverage only: no fundamentals source covers them, so they carry a technical verdict and no score.
      </p>
      <div className="mt-3"><BseHistoryControl initial={job} /></div>
      {!summary && <p className="mt-3 text-[14px] text-muted">No BSE history has been built yet, so these companies are not read at all.</p>}
      {summary && (
        <div className="mt-4">
          <p className="num text-[14px]">
            {summary.sessions} sessions held ({summary.first} to {summary.latest}{summary.sessions < BSE_SESSIONS ? `, fewer than the ${BSE_SESSIONS} asked for` : ""}).
            {" "}{summary.withHistory.toLocaleString("en-IN")} of {summary.bseOnly.toLocaleString("en-IN")} traded in that time; {summary.liquid} average at least ₹{cr(MIN_AVG_TURNOVER)} crore a day and were read; {summary.readings.filter((r) => r.verdict !== "NOT ENOUGH DATA").length} have the 200 sessions a verdict needs; the rest listed recently.
            {summary.unavailable.length > 0 ? ` ${summary.unavailable.length} could not be read.` : ""}
          </p>
          {summary.failedDates.length > 0 && <p className="mt-1 text-[13px] text-warning">{summary.failedDates.length} session files were missing when this was built: {summary.failedDates.slice(0, 8).join(", ")}.</p>}
          {summary.readings.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="text-muted"><tr>
                  <th className="py-1 pr-3 font-medium">Company</th><th className="py-1 pr-3 text-right font-medium">Close, ₹</th><th className="py-1 pr-3 text-right font-medium">Turnover a day, ₹ cr</th>
                  <th className="py-1 pr-3 font-medium">Technical verdict</th><th className="py-1 pr-3 text-right font-medium">Sessions</th><th className="py-1 font-medium">Fundamentals</th>
                </tr></thead>
                <tbody>
                  {summary.readings.slice(0, SHOWN).map((r) => {
                    const e = evidenceLabel(evidence, r.verdict);
                    return (
                      <tr key={r.isin} className="num border-t border-border">
                        <td className="py-1.5 pr-3"><span className="font-medium">{r.symbol}</span><span className="block text-[12px] text-muted">{r.name}</span></td>
                        <td className="py-1.5 pr-3 text-right">{r.close.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                        <td className="py-1.5 pr-3 text-right">{cr(r.avgTurnover)}</td>
                        <td className="py-1.5 pr-3"><VerdictTag verdict={r.verdict} /><span className="mt-0.5 block text-[12px] text-muted" title={`${e.detail} The validation sampled NSE companies, not these.`}>{r.verdict === "NOT ENOUGH DATA" ? e.text : `${e.text} (tested on NSE)`}</span></td>
                        <td className="py-1.5 pr-3 text-right">{r.sessions}{r.actionsApplied ? <span className="block text-[12px] text-muted">{r.actionsApplied} actions adjusted</span> : null}</td>
                        <td className="py-1.5 text-muted">Not available</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {summary.readings.length > SHOWN && <p className="mt-2 text-[12px] text-muted">The {SHOWN} most traded of {summary.readings.length} are shown.</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
