import { connection } from "next/server";
import type { Metadata } from "next";
import { compareResearch, loadDiscovery } from "@/lib/stocks/discovery";
import { MODEL_LABEL } from "@/lib/stocks/universe";
import { fetchStatus } from "@/lib/stocks/tejhq";
import { segmentCount, sourceCounts } from "@/lib/stocks/store";
import { scanState } from "@/lib/stocks/scan";
import { sourceStatuses, SOURCE_TIER_LABEL, type SourceTier } from "@/lib/stocks/sources";
import { PageEnter } from "@/components/Motion";
import { Canvas } from "@/components/ui";
import { RoomHero } from "@/components/realm/RoomHero";
import { EvidencePanel } from "@/components/discovery/EvidencePanel";
import { closeOrphanedBacktests, verdictEvidence } from "@/lib/stocks/validation";
import { latestOfficialDate } from "@/lib/stocks/official";
import { BseOnlyPanel } from "@/components/discovery/BseOnlyPanel";
import { DiscoveryBoard, type BoardRow } from "@/components/discovery/DiscoveryBoard";
import { ScanControl } from "@/components/discovery/ScanControl";
import { ImportForm } from "@/components/discovery/ImportForm";

export const metadata: Metadata = { title: "Rare Stock Discovery" };

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card-row p-3">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="num text-[24px] font-medium leading-tight">{value}</p>
      {note && <p className="text-[12px] text-muted">{note}</p>}
    </div>
  );
}

export default async function DiscoveryPage() {
  await connection();
  const { rows, funnel } = loadDiscovery();
  closeOrphanedBacktests();
  const status = await fetchStatus();
  const sources = sourceStatuses({
    tejhq: status.ok ? { ok: true, date: status.tradingDate } : { ok: false, reason: status.error.message },
    fundamentals: sourceCounts(), segments: segmentCount(), official: { nse: latestOfficialDate("nse"), bse: latestOfficialDate("bse") },
  });
  const working = sources.filter((s) => s.working).length;
  const board: BoardRow[] = rows.filter((r) => r.company.technicals).sort(compareResearch).map((r) => ({
    symbol: r.company.symbol, name: r.company.name, segment: r.company.segment, sector: r.company.sector,
    close: r.company.technicals!.close, date: r.company.technicals!.date, turnoverCr: r.company.avg_turnover === null ? null : r.company.avg_turnover / 1e7,
    verdict: r.verdict.verdict, adjusted: r.score.adjusted, normalised: r.score.normalised, earned: r.score.earned, measured: r.score.measuredPoints, confidence: r.score.confidence, model: MODEL_LABEL[r.model],
    pillars: r.score.pillars.map((p) => ({ key: p.key, label: p.label, points: p.points, max: p.max, measured: p.measured, total: p.total })),
    strategies: Object.entries(r.strategies).filter(([, v]) => v === "match").map(([k]) => k),
    stale: r.pricesStale, watched: r.watched,
  }));

  return (
    <PageEnter>
      <RoomHero destination="stocks" title="Chamber of Insight" data={{ stars: board.slice(0, 240).map((r) => ({ score: r.adjusted, watched: r.watched })) }}
        label="A dark observatory under a ribbed dome open to the stars, with a great armillary sphere at its centre and a brass telescope.">
        <p className="mt-2 max-w-[56ch] text-[17px] text-white/95">Rare Stock Discovery. Each star around the instrument is one company you have researched.</p>
      </RoomHero>
      <Canvas>
        <header className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="font-display text-[26px]">Indian equity research</h2>
            <p className="mt-2 max-w-[66ch] text-[15px] text-muted">
              Finds overlooked companies worth researching, and shows the evidence behind each one. A score directs your attention. It is not a recommendation or a forecast of returns.
            </p>
          </div>
          <div className="flex flex-col gap-2 lg:col-span-4"><ScanControl initial={scanState()} /></div>
        </header>

        <section aria-label="Discovery coverage" className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-5">
          <Stat label="Eligible companies" value={funnel.eligible.toLocaleString("en-IN")} note={`of ${funnel.listed.toLocaleString("en-IN")} listed; ${funnel.excludedInstruments} funds and other instruments, ${funnel.belowLiquidity} below the liquidity limit`} />
          <Stat label="Prices read" value={funnel.read.toLocaleString("en-IN")} note={`of ${funnel.eligible.toLocaleString("en-IN")} eligible, ${funnel.unavailable} unavailable`} />
          <Stat label="With fundamentals" value={funnel.withFundamentals.toLocaleString("en-IN")} note={funnel.withFundamentals ? undefined : "Import a Screener CSV"} />
          <Stat label="Market cap known" value={funnel.classified.toLocaleString("en-IN")} note={funnel.classified ? undefined : "Import the AMFI list"} />
          <Stat label="Sources working" value={`${working} of ${sources.length}`} note={funnel.stale ? `${funnel.stale} with stale prices` : undefined} />
        </section>

        <EvidencePanel />

        <BseOnlyPanel />

        <section aria-labelledby="strategies-h" className="mt-8">
          <h2 id="strategies-h" className="text-[14px] font-semibold">Discovery strategies</h2>
          <p className="mt-1 text-[13px] text-muted">Each runs independently. “Not testable” means the data is missing, not that companies failed.</p>
          <DiscoveryBoard rows={board} strategies={funnel.strategies} evidence={verdictEvidence()?.results ?? null} />
        </section>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section aria-labelledby="sources-h" className="lg:col-span-8">
            <h2 id="sources-h" className="text-[14px] font-semibold">Data sources</h2>
            <p className="mt-1 text-[13px] text-muted">A company missing here may only mean its source is not connected. “Not evaluated” means pricing and terms have not been checked.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead className="text-muted"><tr><th className="py-1 pr-3 font-medium">Source</th><th className="py-1 pr-3 font-medium">Tier</th><th className="py-1 pr-3 font-medium">State</th><th className="py-1 pr-3 font-medium">Access</th><th className="py-1 font-medium">Licensing</th></tr></thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="border-t border-border align-top">
                      <td className="py-1.5 pr-3 font-medium">{s.provider}</td>
                      <td className="py-1.5 pr-3 text-muted">{SOURCE_TIER_LABEL[s.tier as SourceTier]}</td>
                      <td className="py-1.5 pr-3"><span aria-hidden="true" className={`mr-1.5 inline-block h-2 w-2 rounded-full ${s.working ? "bg-positive" : "bg-control"}`} />{s.state}</td>
                      <td className="py-1.5 pr-3 text-muted">{s.access ?? "Not evaluated"}{s.note ? ` ${s.note}` : ""}</td>
                      <td className="py-1.5 text-muted">{s.licensing ?? "Not evaluated"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section aria-labelledby="import-h" className="flex flex-col gap-4 lg:col-span-4">
            <h2 id="import-h" className="text-[14px] font-semibold">Add your data</h2>
            <ImportForm kind="screener" label="Screener.in CSV" hint="Export from your own screen, with the NSE Code column." />
            <ImportForm kind="amfi" label="AMFI market-cap list" hint="Download the half-yearly list from AMFI and save it as CSV." />
          </section>
        </div>

        <section aria-labelledby="method-h" className="mt-10 border-t border-border pt-6">
          <h2 id="method-h" className="text-[14px] font-semibold">How to read this</h2>
          <ul className="mt-2 flex max-w-[78ch] list-disc flex-col gap-1 pl-4 text-[13px] text-muted">
            <li>Scores weigh business quality 25, growth 20, valuation 20, technical structure 20, governance and risk 15. Banks and NBFCs, other financials and operating companies each have their own tests. Thresholds are provisional and have not been tested against market outcomes.</li>
            <li>The adjusted score is points earned against points that could be measured, pulled towards 50 when little was measured. Thin evidence therefore cannot outrank strong evidence, and confidence is High only when every pillar has evidence.</li>
            <li>Relative strength compares with the Motilal Oswal Nifty 500 ETF, because the index itself is not available from the current price source.</li>
            <li>Prices are adjusted for splits, bonuses and dividends. Eligible means an ordinary NSE company share averaging ₹1 crore or more of daily turnover over 20 sessions. ETFs, funds and thinner names are counted above, but not researched.</li>
          </ul>
        </section>
      </Canvas>
    </PageEnter>
  );
}
