"use client";
/** The research table: strategies, filters and scores. Everything here was read from stored data. */
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Confidence } from "@/lib/stocks/scoring";
import type { Verdict } from "@/lib/stocks/technicals";
import { VerdictTag } from "./VerdictTag";

export type BoardPillar = { key: string; label: string; points: number; max: number; measured: number; total: number };
export type BoardRow = {
  symbol: string; name: string | null; segment: string | null; sector: string | null; close: number; date: string; turnoverCr: number | null;
  verdict: Verdict; total: number; measured: number; confidence: Confidence; pillars: BoardPillar[]; strategies: string[]; stale: boolean; watched: boolean;
};
type StrategyStat = { id: string; title: string; summary: string; matched: number; noMatch: number; notTestable: number; blockedBy: string | null };

const VERDICTS: Verdict[] = ["BULLISH", "EARLY ACCUMULATION", "NEUTRAL", "OVEREXTENDED", "BEARISH", "NOT ENOUGH DATA"];
const SEGMENTS = [["small-cap", "Small cap"], ["mid-cap", "Mid cap"], ["large-cap", "Large cap"]] as const;
const PAGE = 60;

function PillarBars({ pillars }: { pillars: BoardPillar[] }) {
  return (
    <span className="flex items-end gap-1" role="img" aria-label={pillars.map((p) => `${p.label}: ${p.measured ? `${p.points} of ${p.max}` : "not measured"}`).join(", ")}>
      {pillars.map((p) => (
        <span key={p.key} title={`${p.label}: ${p.measured ? `${p.points} of ${p.max}` : "not measured"}`}
          className={`relative block h-6 w-2.5 overflow-hidden rounded-[3px] ${p.measured ? "bg-control/40" : "border border-dashed border-control"}`}>
          {p.measured > 0 && <span className="absolute inset-x-0 bottom-0 block bg-accent" style={{ height: `${(p.points / p.max) * 100}%` }} />}
        </span>
      ))}
    </span>
  );
}

export function DiscoveryBoard({ rows, strategies }: { rows: BoardRow[]; strategies: StrategyStat[] }) {
  const [strategy, setStrategy] = useState<string | null>(null);
  const [verdict, setVerdict] = useState("all");
  const [segment, setSegment] = useState("all");
  const [sector, setSector] = useState("all");
  const [watchOnly, setWatchOnly] = useState(false);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const sectors = useMemo(() => [...new Set(rows.map((r) => r.sector).filter((s): s is string => !!s))].sort(), [rows]);
  const hasSegments = rows.some((r) => r.segment);

  const list = useMemo(() => {
    const t = q.trim().toUpperCase();
    return rows
      .filter((r) => (!strategy || r.strategies.includes(strategy)) && (verdict === "all" || r.verdict === verdict) && (segment === "all" || r.segment === segment)
        && (sector === "all" || r.sector === sector) && (!watchOnly || r.watched) && (!t || r.symbol.includes(t) || (r.name ?? "").toUpperCase().includes(t)))
      .sort((a, b) => b.total - a.total || (b.turnoverCr ?? 0) - (a.turnoverCr ?? 0));
  }, [rows, strategy, verdict, segment, sector, watchOnly, q]);
  const active = strategies.find((s) => s.id === strategy);

  return (
    <>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {strategies.map((s) => {
          const on = s.id === strategy;
          return (
            <li key={s.id}>
              <button type="button" aria-pressed={on} onClick={() => { setStrategy(on ? null : s.id); setShown(PAGE); }}
                className={`flex h-full w-full flex-col rounded-[12px] border p-3 text-left transition-colors ${on ? "border-ink bg-active" : "border-border bg-raised hover:bg-surface"}`}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-medium">{s.title}</span>
                  <span className="num text-[16px] font-medium">{s.blockedBy ? "—" : s.matched}</span>
                </span>
                <span className="mt-1 text-[12px] text-muted">{s.summary}</span>
                <span className={`mt-auto pt-1 text-[12px] ${s.blockedBy ? "text-warning" : "text-muted"}`}>
                  {s.blockedBy ?? `${s.noMatch} no match · ${s.notTestable} not testable`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[13px] text-muted">Technical verdict
          <select className="input h-9 min-w-[170px]" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
            <option value="all">All</option>{VERDICTS.map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted">Market cap
          <select className="input h-9 min-w-[130px]" value={segment} disabled={!hasSegments} onChange={(e) => setSegment(e.target.value)}>
            <option value="all">{hasSegments ? "All" : "Needs AMFI list"}</option>{SEGMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted">Sector
          <select className="input h-9 min-w-[150px]" value={sector} disabled={sectors.length === 0} onChange={(e) => setSector(e.target.value)}>
            <option value="all">{sectors.length ? "All" : "Needs a Screener CSV"}</option>{sectors.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-muted">Search
          <input className="input h-9 w-[170px]" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Symbol or name" />
        </label>
        <label className="flex h-9 items-center gap-2 text-[14px]"><input type="checkbox" checked={watchOnly} onChange={(e) => setWatchOnly(e.target.checked)} /> Watchlist only</label>
        <a href="/api/stocks/watchlist" className="btn btn-secondary ml-auto">Export watchlist</a>
      </div>

      <p className="num mt-3 text-[13px] text-muted" aria-live="polite">{list.length} {list.length === 1 ? "company" : "companies"}{active ? ` in ${active.title}` : ""}</p>
      {rows.length === 0 ? (
        <p className="mt-2 rounded-[12px] bg-surface p-4 text-[14px]">No companies read yet. Run a market scan to read prices.</p>
      ) : list.length === 0 ? (
        <p className="mt-2 rounded-[12px] bg-surface p-4 text-[14px]">{active?.blockedBy ? `${active.title} cannot run yet. ${active.blockedBy}. This is missing data, not a negative result.` : "No company matches these filters."}</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-[12px] border border-border">
          <table className="w-full min-w-[840px] text-left text-[14px]">
            <thead className="bg-surface text-[13px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Company</th><th className="px-3 py-2 font-medium">Market cap</th>
                <th className="px-3 py-2 text-right font-medium">Close, ₹</th><th className="px-3 py-2 font-medium">Technical verdict</th>
                <th className="px-3 py-2 text-right font-medium">Score</th><th className="px-3 py-2 font-medium">Pillars</th><th className="px-3 py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {list.slice(0, shown).map((r) => (
                <tr key={r.symbol} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/discovery/${encodeURIComponent(r.symbol)}`} className="font-medium hover:underline">{r.symbol}</Link>{r.watched && <span className="ml-1 text-[12px] text-muted">Watching</span>}
                    <span className="block max-w-[260px] truncate text-[12px] text-muted">{r.name ?? "Name unavailable"}</span>
                  </td>
                  <td className="px-3 py-2 text-[13px]">{r.segment ? r.segment.replace("-cap", " cap") : <span className="text-muted">Unknown</span>}</td>
                  <td className="num px-3 py-2 text-right">{r.close.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{r.stale && <span className="block text-[12px] text-warning">Stale</span>}</td>
                  <td className="px-3 py-2"><VerdictTag verdict={r.verdict} /></td>
                  <td className="num px-3 py-2 text-right"><span className="font-medium">{r.total}</span><span className="block text-[12px] text-muted">{r.measured} of 100 measured</span></td>
                  <td className="px-3 py-2"><PillarBars pillars={r.pillars} /></td>
                  <td className="px-3 py-2 text-[13px]">{r.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.length > shown && <button type="button" className="btn btn-secondary mt-3" onClick={() => setShown((n) => n + PAGE)}>Show more</button>}
    </>
  );
}
