import Link from "next/link";
import { FrontispieceBand } from "@/components/Frontispiece";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { loadCompany } from "@/lib/stocks/discovery";
import { MODEL_LABEL } from "@/lib/stocks/universe";
import { SYMBOL } from "@/lib/api-guard";
import { CHECK_OUTCOME_LABEL, type CheckOutcome } from "@/lib/stocks/evidence";
import { STRATEGIES } from "@/lib/stocks/scoring";
import { listWatch } from "@/lib/stocks/store";
import { VERDICT_MEANING, type Technicals } from "@/lib/stocks/technicals";
import { ELIGIBILITY_LABEL } from "@/lib/stocks/universe";
import { PageEnter } from "@/components/Motion";
import { Canvas, Panel, TextLink } from "@/components/ui";
import { VerdictTag } from "@/components/discovery/VerdictTag";
import { evidenceLabel, SCORE_STATUS } from "@/lib/stocks/evidence-label";
import { verdictEvidence } from "@/lib/stocks/validation";
import { WatchControl } from "@/components/discovery/WatchControl";

type Props = { params: Promise<{ symbol: string }> };

/** An address can hold anything, so it must decode cleanly and look like a symbol. */
function symbolFrom(raw: string): string | null {
  try { const s = decodeURIComponent(raw); return SYMBOL.test(s) ? s : null; } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  return { title: symbolFrom((await params).symbol) ?? "Company" };
}

const OUTCOME_TONE: Record<CheckOutcome, string> = { passed: "text-positive", failed: "text-negative", unavailable: "text-muted", stale: "text-warning", conflict: "text-warning" };
const OUTCOME_SHORT: Record<CheckOutcome, string> = { passed: "Passed", failed: "Failed", unavailable: "Unavailable", stale: "Stale", conflict: "Conflict" };
const n = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? "Unavailable" : v.toLocaleString("en-IN", { maximumFractionDigits: digits }));
const sign = (v: number | null | undefined) => (v === null || v === undefined ? "Unavailable" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}`);

function PriceLine({ closes, label }: { closes: number[]; label: string }) {
  if (closes.length < 2) return null;
  const lo = Math.min(...closes), hi = Math.max(...closes), w = 640, h = 140;
  const points = closes.map((c, i) => `${((i / (closes.length - 1)) * w).toFixed(1)},${(h - ((c - lo) / (hi - lo || 1)) * (h - 8) - 4).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-[140px] w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function technicalRows(t: Technicals) {
  return [
    ["20 DMA", n(t.dma.d20)], ["50 DMA", n(t.dma.d50)], ["100 DMA", n(t.dma.d100)], ["200 DMA", n(t.dma.d200)],
    ["RSI 14", n(t.rsi14, 1)], ["MACD histogram", n(t.macd?.hist)],
    ["Relative strength 3m", `${sign(t.relativeStrength?.pct3m)} points`], ["Relative strength 6m", `${sign(t.relativeStrength?.pct6m)} points`],
    ["Volume trend", t.volumeTrend === null ? "Unavailable" : `${t.volumeTrend.toFixed(2)} times`],
    ["Breakout", t.breakout ? (t.breakout.confirmed ? `Confirmed above ${n(t.breakout.level)}` : `None; 60-session high ${n(t.breakout.level)}`) : "Unavailable"],
    ["50 DMA, 20 sessions", `${sign(t.slope.d50Pct)}%`], ["200 DMA, 20 sessions", `${sign(t.slope.d200Pct)}%`],
    ["20-session range", t.consolidationPct === null ? "Unavailable" : `${t.consolidationPct.toFixed(1)}%`],
    ["Against prior range", t.rangeRatio === null ? "Unavailable" : `${t.rangeRatio.toFixed(2)} times`],
    ["Up-day volume", t.upDownVolume === null ? "Unavailable" : `${t.upDownVolume.toFixed(2)} times`],
    ["Structure", t.structure?.replaceAll("-", " ") ?? "Unavailable"],
    ["52-week high", n(t.high52w)], ["From 52-week high", t.fromHighPct === null ? "Unavailable" : `${t.fromHighPct.toFixed(1)}%`],
  ] as const;
}

export default async function CompanyPage({ params }: Props) {
  await connection();
  const symbol = symbolFrom((await params).symbol);
  if (!symbol) notFound();
  const watch = listWatch().find((w) => w.symbol === symbol);
  const r = loadCompany(symbol, !!watch);
  if (!r) notFound();
  const company = r.company;
  const t = company.technicals;
  const excluded = company.eligibility && company.eligibility !== "eligible" ? ELIGIBILITY_LABEL[company.eligibility] : null;
  const matched = STRATEGIES.filter((s) => r.strategies[s.id] === "match");
  const untestable = STRATEGIES.filter((s) => r.strategies[s.id] === "not-testable").length;

  return (
    <PageEnter>
      <FrontispieceBand section="discovery" height="compact" start={0.62}>
        <p className="text-[14px] text-white/85">Chamber of Insight · company research</p>
      </FrontispieceBand>
      <Canvas>
        <nav aria-label="Breadcrumb" className="text-[13px] text-muted"><Link href="/discovery" className="hover:underline">Rare Stock Discovery</Link> <span aria-hidden="true">/</span> {symbol}</nav>
        <header className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-[38px] leading-[1.05]">{company.name ?? symbol}</h1>
            <p className="num mt-1 text-[14px] text-muted">NSE: {symbol} · {company.isin ?? "ISIN unavailable"} · {company.segment ? company.segment.replace("-cap", " cap") : "Market cap unknown"}{company.sector ? ` · ${company.sector}` : ""} · {MODEL_LABEL[r.model]}{r.modelBasis === "name" ? " (from its name)" : ""}</p>
          </div>
          <div className="text-right">
            <p className="num text-[26px] font-medium">{t ? `₹${n(t.close)}` : "Price unavailable"}</p>
            {t && <p className="num text-[13px] text-muted">Close on {t.date}{r.pricesStale ? ", stale" : ""}, adjusted, via TejHQ</p>}
          </div>
        </header>
        {excluded && <p role="status" className="mt-3 rounded-[12px] bg-surface p-3 text-[14px]">Not part of equity discovery: {excluded}.</p>}
        {!t && <p role="status" className="mt-3 rounded-[12px] bg-surface p-3 text-[14px]">Prices have not been read for this company. {company.reason}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Panel title="Technical assessment" className="lg:col-span-5">
            <VerdictTag verdict={r.verdict.verdict} />
            {(() => { const e = evidenceLabel(verdictEvidence()?.results ?? null, r.verdict.verdict); return <p className={`mt-1 text-[13px] ${e.tone === "positive" ? "text-positive" : e.tone === "negative" ? "text-negative" : "text-muted"}`}>{e.text}. {e.detail}</p>; })()}
            <p className="mt-2 text-[14px]">{VERDICT_MEANING[r.verdict.verdict]}</p>
            <ul className="mt-2 list-disc pl-4 text-[14px] text-muted">{r.verdict.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
            <p className="mt-3 text-[12px] text-muted">A verdict describes the chart. It does not say this is a good time to buy.</p>
          </Panel>
          <Panel title="Research score" className="lg:col-span-4">
            <p className="num text-[34px] font-medium leading-none">{r.score.adjusted ?? "Not scored"}{r.score.adjusted !== null && <span className="text-[16px] text-muted"> adjusted</span>}</p>
            <p className="num mt-1 text-[13px] text-muted">Earned {r.score.earned} of the {r.score.measuredPoints} points that could be measured, out of 100. Confidence: {r.score.confidence}.</p>
            <p className="mt-1 text-[13px] text-warning">{SCORE_STATUS}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {r.score.pillars.map((p) => (
                <li key={p.key}>
                  <p className="flex justify-between text-[13px]"><span>{p.label}</span><span className="num text-muted">{p.measured ? `${Math.round(p.points)} of ${p.max}, ${p.measured} of ${p.total} checks` : "Not measured"}</span></p>
                  <span className={`block h-1.5 overflow-hidden rounded-full ${p.measured ? "bg-control/40" : "border border-dashed border-control"}`}>{p.measured > 0 && <span className="block h-full bg-accent" style={{ width: `${(p.points / p.max) * 100}%` }} />}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Watchlist" className="lg:col-span-3"><WatchControl symbol={symbol} watched={!!watch} thesis={watch?.thesis ?? ""} /></Panel>
        </div>

        {t && (
          <Panel title="Price, last 120 sessions" className="mt-4"><PriceLine closes={company.closes} label={`Adjusted closing price of ${symbol} over the last ${company.closes.length} sessions`} /></Panel>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Panel title="Technical readings" className="lg:col-span-4">
            {t ? <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">{technicalRows(t).map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="num text-right">{v}</dd></div>)}</dl> : <p className="text-[14px] text-muted">Unavailable.</p>}
            {t?.relativeStrength && <p className="mt-2 text-[12px] text-muted">Against {t.relativeStrength.benchmark}, standing in for the Nifty 500.</p>}
          </Panel>
          <section aria-label="Evidence by pillar" className="flex flex-col gap-4 lg:col-span-8">
            {r.score.pillars.map((p) => (
              <Panel key={p.key} title={p.label}>
                <table className="w-full text-left text-[13px]">
                  <thead className="sr-only"><tr><th>Check</th><th>Rule</th><th>Result</th><th>Reading</th></tr></thead>
                  <tbody>
                    {p.checks.map((c) => (
                      <tr key={c.label} className="border-t border-border first:border-0 align-top">
                        <td className="py-1 pr-3">{c.label}</td><td className="py-1 pr-3 text-muted">{c.rule}</td>
                        <td className={`py-1 pr-3 font-medium ${OUTCOME_TONE[c.outcome]}`}>{OUTCOME_SHORT[c.outcome]}</td>
                        <td className="py-1 text-muted">{c.outcome === "unavailable" ? CHECK_OUTCOME_LABEL.unavailable : c.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            ))}
          </section>
        </div>

        <Panel title="Strategies" className="mt-4">
          {matched.length ? <ul className="flex flex-wrap gap-1">{matched.map((s) => <li key={s.id} className="chip chip-accent">{s.title}</li>)}</ul> : <p className="text-[14px]">No strategy has matched.</p>}
          <p className="mt-2 text-[13px] text-muted">{untestable} of {STRATEGIES.length} strategies could not be tested for lack of data. <TextLink href="/discovery">Back to the board</TextLink></p>
        </Panel>
      </Canvas>
    </PageEnter>
  );
}
