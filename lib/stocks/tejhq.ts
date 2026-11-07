// TejHQ keyless REST client (Phase 1).
// Verified keyless 2026-10-13: GET /v1/ohlcv/{ex}/{symbol}, /v1/snapshot/{ex}?date=,
// /v1/actions/{symbol}, /v1/status, /health, /ready.
// Rate limits (per official tej-sdk-py README): 100 req / 10 s per IP at edge,
// 120 / min at origin. Sequential calls, spaced and retried by lib/sources/http.ts.
// Adjusted/symbols need a free key (401); metrics/universe/batch need paid tiers.
// We never call those — adjustments are computed locally from raw + actions.

import { getJson } from "./http";
import { PRICE_MAX_AGE_MS, TEJHQ_API, TEJHQ_SOURCE } from "./types";
import type { AdjustedBar, CorporateAction, DataStatus, RawBar, SourceStamp, UniverseMember } from "./types";

export type ProviderError = {
  kind: "unavailable" | "not-found" | "rate-limited" | "malformed";
  message: string;
  httpStatus: number | null;
};

// 100 req / 10 s per IP → keep sequential calls ≥ 110 ms apart (lib/sources/http.ts).
const MIN_INTERVAL_MS = 110;

async function tejFetch(path: string): Promise<{ ok: true; json: unknown } | { ok: false; error: ProviderError }> {
  const r = await getJson(`${TEJHQ_API}${path}`, { label: `TejHQ ${path}`, timeoutMs: 10_000, retries: 2, minIntervalMs: MIN_INTERVAL_MS });
  if (r.ok) return { ok: true, json: r.json };
  return { ok: false, error: { kind: r.kind === "auth" ? "unavailable" : r.kind, message: r.message, httpStatus: r.status } };
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

export function stamp(note?: string): SourceStamp {
  return { source: TEJHQ_SOURCE, at: new Date().toISOString(), note };
}

function parseBar(r: Record<string, unknown>): RawBar | null {
  const date = str(r.date);
  const open = num(r.open); const high = num(r.high); const low = num(r.low); const close = num(r.close);
  const volume = num(r.volume); const turnover = num(r.turnover);
  if (!date || open === null || high === null || low === null || close === null || volume === null || turnover === null) return null;
  // OHLC integrity: a corrupt row (high < low, close outside range) is dropped, never repaired.
  if (high < low || high < open || high < close || low > open || low > close) return null;
  if (volume < 0 || turnover < 0) return null;
  return { date, open, high, low, close, volume, turnover, prevClose: num(r.prev_close ?? r.prevClose) };
}

function parseAction(r: Record<string, unknown>): CorporateAction | null {
  const exDate = str(r.ex_date ?? r.exDate);
  const type = str(r.type);
  if (!exDate || !type) return null;
  return {
    exchange: str(r.exchange) ?? "unknown",
    symbol: str(r.symbol) ?? "unknown",
    isin: str(r.isin),
    exDate, recordDate: str(r.record_date ?? r.recordDate),
    type,
    ratioNum: num(r.ratio_num ?? r.ratioNum), ratioDen: num(r.ratio_den ?? r.ratioDen),
    cashAmount: num(r.cash_amount ?? r.cashAmount),
    faceValueFrom: num(r.face_value_from ?? r.faceValueFrom),
    faceValueTo: num(r.face_value_to ?? r.faceValueTo),
    rawSubject: str(r.raw_subject ?? r.rawSubject) ?? type,
  };
}

export async function fetchStatus(): Promise<{ ok: true; tradingDate: string; stamp: SourceStamp } | { ok: false; error: ProviderError }> {
  const r = await tejFetch("/v1/status");
  if (!r.ok) return r;
  const d = (r.json ?? {}) as Record<string, unknown>;
  const tradingDate = str(d.trading_date ?? d.tradingDate);
  if (!tradingDate) return { ok: false, error: { kind: "malformed", message: "TejHQ /v1/status missing trading_date", httpStatus: 200 } };
  return { ok: true, tradingDate, stamp: stamp(`pipeline stage: ${str(d.stage) ?? "unknown"}`) };
}

/** Dynamic universe: full-market snapshot for a trading date, EQ series only. Never hardcoded. */
export async function fetchUniverse(
  exchange: string, date: string,
): Promise<{ ok: true; members: UniverseMember[]; stamp: SourceStamp } | { ok: false; error: ProviderError }> {
  const r = await tejFetch(`/v1/snapshot/${encodeURIComponent(exchange)}?date=${encodeURIComponent(date)}`);
  if (!r.ok) return r;
  const d = (r.json ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(d.data) ? d.data : null;
  if (!rows) return { ok: false, error: { kind: "malformed", message: "TejHQ snapshot missing data[]", httpStatus: 200 } };
  const members: UniverseMember[] = [];
  for (const raw of rows) {
    const o = (raw ?? {}) as Record<string, unknown>;
    if (str(o.series) !== "EQ") continue;
    const symbol = str(o.symbol);
    if (!symbol) continue;
    members.push({ symbol, isin: str(o.isin), name: str(o.name), close: num(o.close), turnover: num(o.turnover) });
  }
  if (members.length === 0) {
    return { ok: false, error: { kind: "unavailable", message: `TejHQ snapshot ${exchange}/${date} has no EQ rows — treated as unavailable, never as an empty universe`, httpStatus: 200 } };
  }
  return { ok: true, members, stamp: stamp(`snapshot ${exchange} ${date}, ${members.length} EQ members`) };
}

export async function fetchOhlcv(
  exchange: string, symbol: string, from?: string, to?: string,
): Promise<{ ok: true; bars: RawBar[]; stamp: SourceStamp } | { ok: false; error: ProviderError }> {
  const q = [from ? `from=${encodeURIComponent(from)}` : "", to ? `to=${encodeURIComponent(to)}` : ""].filter(Boolean).join("&");
  const r = await tejFetch(`/v1/ohlcv/${encodeURIComponent(exchange)}/${encodeURIComponent(symbol)}${q ? `?${q}` : ""}`);
  if (!r.ok) return r;
  const d = (r.json ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(d.data) ? d.data : null;
  if (!rows) return { ok: false, error: { kind: "malformed", message: "TejHQ ohlcv missing data[]", httpStatus: 200 } };
  const bars = rows.map((x) => parseBar((x ?? {}) as Record<string, unknown>)).filter((b): b is RawBar => b !== null);
  if (bars.length === 0) {
    return { ok: false, error: { kind: "not-found", message: `No usable bars for ${symbol} (${exchange}) — unknown symbol or delisted range`, httpStatus: 200 } };
  }
  bars.sort((a, b) => (a.date < b.date ? -1 : 1));
  // Dedupe by date (keep last occurrence); duplicates are a provider anomaly, never double-counted.
  const seen = new Set<string>();
  const deduped = bars.filter((b) => (seen.has(b.date) ? false : (seen.add(b.date), true)));
  const dupes = bars.length - deduped.length;
  return { ok: true, bars: deduped, stamp: stamp(`${deduped.length} daily bars, ${deduped[0]!.date} → ${deduped[deduped.length - 1]!.date}${dupes > 0 ? ` (${dupes} duplicate rows dropped)` : ""}`) };
}

export async function fetchActions(
  symbol: string,
): Promise<{ ok: true; actions: CorporateAction[]; stamp: SourceStamp } | { ok: false; error: ProviderError }> {
  const r = await tejFetch(`/v1/actions/${encodeURIComponent(symbol)}`);
  if (!r.ok) {
    // A symbol with no corporate actions is normal — empty list, still live provenance.
    if (r.error.kind === "not-found") return { ok: true, actions: [], stamp: stamp("no corporate actions reported") };
    return r;
  }
  const d = (r.json ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(d.data) ? d.data : null;
  if (!rows) return { ok: false, error: { kind: "malformed", message: "TejHQ actions missing data[]", httpStatus: 200 } };
  const actions = rows.map((x) => parseAction((x ?? {}) as Record<string, unknown>)).filter((a): a is CorporateAction => a !== null);
  return { ok: true, actions, stamp: stamp(`${actions.length} corporate actions`) };
}

/** Freshness gate: latest bar date within PRICE_MAX_AGE_MS of now. */
export function freshnessOf(latestBarDate: string | null, now = Date.now()): { status: DataStatus; note: string | null } {
  if (!latestBarDate) return { status: "unavailable", note: "No price reported for this symbol." };
  const t = Date.parse(latestBarDate);
  if (!Number.isFinite(t)) return { status: "unavailable", note: `Unparseable bar date ${latestBarDate}.` };
  // Bar dates are trading days (no intraday time); compare at day resolution + 1 day grace for timezone.
  const age = now - t;
  if (age > PRICE_MAX_AGE_MS + 24 * 3600_000) {
    return { status: "stale", note: `Latest bar ${latestBarDate} is older than 4 trading days — no decision-grade reading.` };
  }
  return { status: "ok", note: null };
}

export type { AdjustedBar };
