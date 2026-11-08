/**
 * Measures worked out from reported figures. Pure. A calculated value is only as good as its
 * inputs: an input that is stale or disputed passes that state on, so nothing gets laundered into
 * a clean number, and a directly reported value is never overwritten.
 */
import type { Fundamentals, Metric, MetricState } from "./scoring";

const usable = (s: MetricState | undefined): s is MetricState & { value: number } => !!s && s.value !== null && s.state === "ok";

function fromInputs(f: Fundamentals, target: Metric, inputs: Metric[], calc: (...v: number[]) => number | null, how: string): MetricState | null {
  if (f[target]) return null;
  const given = inputs.map((m) => f[m]);
  if (given.some((s) => !s)) return null; // Nothing to work from: stays unavailable, with no note needed.
  const blocked = given.find((s) => !usable(s));
  if (blocked) return { value: null, state: blocked.state === "unavailable" ? "unavailable" : blocked.state, note: `Cannot be calculated: an input is ${blocked.state}.` };
  const value = calc(...given.map((s) => s!.value!));
  if (value === null || !Number.isFinite(value)) return { value: null, state: "unavailable", note: `Cannot be calculated from these figures (${how}).` };
  const source = [...new Set(given.map((s) => s!.source).filter(Boolean))].join(", ");
  return { value, state: "ok", source: `calculated as ${how}${source ? ` from ${source}` : ""}`, period: given[0]!.period ?? null };
}

export function derive(f: Fundamentals, sectorMedianPe: { value: number | null; peers: number } | null): Fundamentals {
  const out: Fundamentals = { ...f };
  const add = (m: Metric, s: MetricState | null) => { if (s) out[m] = s; };
  add("cashConversion", fromInputs(f, "cashConversion", ["cfo", "pat"], (cfo, pat) => (pat! > 0 ? cfo! / pat! : null), "CFO / profit"));
  add("fcf", fromInputs(f, "fcf", ["cfo", "capex"], (cfo, capex) => cfo! - Math.abs(capex!), "CFO less capex"));
  add("roceChange", fromInputs(f, "roceChange", ["roce", "roce3yAgo"], (now, then) => now! - then!, "ROCE less ROCE 3 years ago"));
  add("dilution3y", fromInputs(f, "dilution3y", ["shares", "shares3yAgo"], (now, then) => (then! > 0 ? (now! / then! - 1) * 100 : null), "change in share count"));
  add("peg", fromInputs(f, "peg", ["pe", "profitCagr3y"], (pe, g) => (pe! > 0 && g! > 0 ? pe! / g! : null), "P/E / profit CAGR"));

  const pe = f.pe;
  if (pe && !usable(pe) && !f.peVsSector) out.peVsSector = { value: null, state: pe.state, note: `Cannot be calculated: the P/E is ${pe.state}.` };
  if (usable(pe) && !f.peVsSector) {
    if (pe.value > 0 && sectorMedianPe?.value) out.peVsSector = { value: pe.value / sectorMedianPe.value, state: "ok", source: `calculated against ${sectorMedianPe.peers} sector peers`, period: pe.period ?? null };
    else out.peVsSector = { value: null, state: "unavailable", note: sectorMedianPe ? "The company has no positive P/E, or the sector has no median." : "Fewer than 5 sector peers have a P/E, so no fair comparison exists." };
  }
  return out;
}

const MIN_PEERS = 5;

/** Median of positive P/Es by sector. Loss-makers have no meaningful P/E, so they are left out. */
export function sectorMedians(companies: { sector: string | null; pe: number | null }[]): Map<string, { value: number; peers: number }> {
  const bySector = new Map<string, number[]>();
  for (const c of companies) if (c.sector && c.pe !== null && c.pe > 0) bySector.set(c.sector, [...(bySector.get(c.sector) ?? []), c.pe]);
  const out = new Map<string, { value: number; peers: number }>();
  for (const [sector, values] of bySector) {
    if (values.length < MIN_PEERS) continue;
    const s = [...values].sort((a, b) => a - b), mid = s.length >> 1;
    out.set(sector, { value: s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2, peers: s.length });
  }
  return out;
}
