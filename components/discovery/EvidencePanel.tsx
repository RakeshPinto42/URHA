/**
 * How far the board can be trusted: where each price comes from and how fresh it is, whether the
 * market-data source agrees with the exchange, and what ten years of history say about each verdict.
 */
import { freshness, latestAgreement, officialCoverage } from "@/lib/stocks/official";
import { backtestState, verdictEvidence } from "@/lib/stocks/validation";
import { BacktestControl, OfficialControl } from "./EvidenceControls";

const fmt = (n: number, d = 1) => `${n >= 0 ? "+" : ""}${n.toFixed(d)}`;
const STATUS_TEXT: Record<string, string> = {
  supported: "Supported by history", contradicted: "Contradicted by history", "not supported": "Not supported: no reliable edge",
  "no claim": "Makes no directional claim", "too little data": "Too few observations to judge",
};

export async function EvidencePanel() {
  const [fresh, coverage, agree, evidence, state] = [await freshness(), officialCoverage(), latestAgreement(), verdictEvidence(), backtestState()];
  const results = evidence?.results ?? null;
  return (
    <section aria-labelledby="evidence-h" className="mt-10 border-t border-border pt-6">
      <h2 id="evidence-h" className="text-[14px] font-semibold">Evidence and reliability</h2>
      <p className="mt-1 max-w-[80ch] text-[13px] text-muted">
        Nothing on this board is investment advice. A verdict is a description of the chart. Below is what the data sources and ten years of history say about how far each one can be trusted.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3 className="text-[13px] font-semibold">Price sources and freshness</h3>
          <table className="mt-2 w-full text-left text-[13px]">
            <thead className="text-muted"><tr><th className="py-1 pr-2 font-medium">Source</th><th className="py-1 pr-2 font-medium">Latest day</th><th className="py-1 font-medium">Age</th></tr></thead>
            <tbody>
              {fresh.map((f) => (
                <tr key={f.source} className="border-t border-border">
                  <td className="py-1.5 pr-2">{f.source}</td>
                  <td className="num py-1.5 pr-2">{f.date ?? <span className="text-muted">{f.note}</span>}</td>
                  <td className="py-1.5">{f.weekdaysOld === null ? "—" : f.weekdaysOld <= 1 ? <span className="text-positive">Current</span> : <span className="text-warning">{f.weekdaysOld} weekdays old</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3"><OfficialControl /></div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="text-[13px] font-semibold">Coverage and agreement</h3>
          {coverage ? (
            <p className="num mt-2 text-[14px]">
              NSE lists {coverage.nse.toLocaleString("en-IN")} company shares ({coverage.nseDate}); BSE lists {coverage.bse.toLocaleString("en-IN")} ({coverage.bseDate}).
              {" "}{coverage.both.toLocaleString("en-IN")} trade on both, and <strong>{coverage.bseOnly.toLocaleString("en-IN")} only on BSE</strong>, which TejHQ does not cover.
            </p>
          ) : <p className="mt-2 text-[14px] text-muted">No official file downloaded yet, so coverage against the exchanges is unknown.</p>}
          {agree ? (
            <div className="mt-3 text-[14px]">
              <p className="num">
                TejHQ&apos;s closing prices for {agree.tradeDate} agree with NSE&apos;s own file for <strong>{agree.agree.toLocaleString("en-IN")} of {agree.compared.toLocaleString("en-IN")}</strong> companies
                {agree.compared ? ` (${((agree.agree / agree.compared) * 100).toFixed(1)}%)` : ""}, within 0.05%.
                {agree.disagree > 0 ? ` ${agree.disagree} differ; both values are shown, never averaged.` : ""}
                {agree.onlyOfficial > 0 ? ` ${agree.onlyOfficial} NSE companies are missing from TejHQ.` : ""}
              </p>
              {agree.worst.length > 0 && (
                <details className="mt-2"><summary className="cursor-pointer text-[13px]">The largest disagreements</summary>
                  <table className="mt-2 w-full max-w-[520px] text-left text-[13px]">
                    <thead className="text-muted"><tr><th className="font-medium">Symbol</th><th className="font-medium">NSE</th><th className="font-medium">TejHQ</th><th className="font-medium">Difference</th></tr></thead>
                    <tbody>{agree.worst.map((w) => <tr key={w.symbol} className="num border-t border-border"><td>{w.symbol}</td><td>{w.official}</td><td>{w.other}</td><td>{w.diffPct}%</td></tr>)}</tbody>
                  </table>
                </details>
              )}
            </div>
          ) : <p className="mt-3 text-[14px] text-muted">TejHQ has not been checked against an exchange file yet.</p>}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-[13px] font-semibold">Technical verdicts: historical validation</h3>
        <p className="mt-1 max-w-[86ch] text-[13px] text-muted">
          A random sample of today&apos;s listed companies, read back to 2015. Every 21 sessions each verdict is computed from the prices known that day, then the next 60 sessions&apos; return after 0.4% costs is compared with the Nifty 50 ETF.
          Excess returns are winsorised at the 1st and 99th percentiles, so a few extreme moves cannot decide a mean. A verdict counts as supported only when its 95% interval, clustered by date and widened for overlapping windows, excludes zero in the direction it implies.
        </p>
        <div className="mt-3"><BacktestControl initial={{ running: state.running, run: state.run && { status: state.run.status, total: state.run.total, done: state.run.done, failed: state.run.failed, observations: state.run.observations, error: state.run.error } }} /></div>
        {results && evidence && (
          <div className="mt-4 overflow-x-auto">
            <p className="num mb-2 text-[13px] text-muted">Run of {evidence.finished_at?.slice(0, 10)}: {evidence.done - evidence.failed} companies read ({evidence.failed} unavailable), {evidence.observations.toLocaleString("en-IN")} observations, benchmark {evidence.params.benchmark}.
              {evidence.params.calendar ? ` Every company was evaluated on the same ${evidence.params.calendar.dates} dates, ${evidence.params.calendar.first} to ${evidence.params.calendar.last}, each against the benchmark over the same ${evidence.params.calendar.horizon} sessions.` : ""}</p>
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead className="text-muted"><tr>
                <th className="py-1 pr-3 font-medium">Verdict</th><th className="py-1 pr-3 font-medium">Observations</th><th className="py-1 pr-3 font-medium">Mean excess, 60 sessions</th>
                <th className="py-1 pr-3 font-medium">Beat the index</th><th className="py-1 pr-3 font-medium">Against the sample</th><th className="py-1 pr-3 font-medium">95% interval</th><th className="py-1 font-medium">Judgement</th>
              </tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.verdict} className="num border-t border-border">
                    <td className="py-1.5 pr-3 font-medium">{r.verdict === "ALL" ? "Every observation" : r.verdict}</td>
                    <td className="py-1.5 pr-3">{r.n.toLocaleString("en-IN")} <span className="text-muted">on {r.dates} dates</span></td>
                    <td className="py-1.5 pr-3">{r.n ? `${fmt(r.meanExcess)} pts` : "—"}</td>
                    <td className="py-1.5 pr-3">{r.n ? `${(r.hitRate * 100).toFixed(0)}%` : "—"}</td>
                    <td className="py-1.5 pr-3">{r.verdict === "ALL" || !r.n ? "—" : `${fmt(r.vsSample)} pts`}</td>
                    <td className="py-1.5 pr-3">{r.verdict === "ALL" || !Number.isFinite(r.ciLow) || !r.n ? "—" : `${fmt(r.ciLow)} to ${fmt(r.ciHigh)}`}</td>
                    <td className={`py-1.5 ${r.status === "supported" ? "text-positive" : r.status === "contradicted" ? "text-negative" : "text-muted"}`}>{r.verdict === "ALL" ? "Baseline" : STATUS_TEXT[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="mt-3 flex max-w-[86ch] list-disc flex-col gap-1 pl-4 text-[12px] text-muted">
              <li>Survivorship: only companies listed today are sampled, so failures that delisted are missing, which flatters every verdict.</li>
              <li>Fundamentals are not point-in-time, so Early Accumulation cannot fire and the 100-point score is not tested here at all.</li>
              <li>Costs are a flat 0.4% round trip; slippage in thin stocks can be far higher.</li>
              <li>Past behaviour does not establish future returns. A supported verdict is a description that has held, not a recommendation.</li>
            </ul>
          </div>
        )}
        {!results && <p className="mt-3 text-[14px] text-muted">No validation has run yet, so every verdict on this board is unvalidated.</p>}
      </div>

      <div className="mt-8">
        <h3 className="text-[13px] font-semibold">Fundamental score: not validated</h3>
        <p className="mt-1 max-w-[86ch] text-[14px]">
          The 100-point score cannot be tested yet. Testing it needs each company&apos;s fundamentals as they were known on each past date, and the only fundamentals here are today&apos;s, imported from Screener. A backtest on them would use information that was not available at the time.
          Until point-in-time fundamentals exist, the score and its thresholds are provisional: a way to direct research, with no evidence that it predicts returns.
        </p>
      </div>
    </section>
  );
}
