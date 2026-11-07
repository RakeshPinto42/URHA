// Wealth Intelligence — shared types (Phase 1: prices + technicals only).
// Fundamentals are UNKNOWN stubs until a licensed source is approved.
// Provenance: every material value carries source + asOf + status.

export type ValueStatus = "live" | "unavailable" | "stale";

export type SourcedValue = {
  value: number | null;
  source: string;
  asOf: string | null;
  status: ValueStatus;
};

export type SourceStamp = { source: string; at: string; note?: string };

export type RawBar = {
  date: string; // YYYY-MM-DD
  open: number; high: number; low: number; close: number;
  volume: number; turnover: number; prevClose?: number | null;
};

export type CorporateAction = {
  exchange: string; symbol: string; isin: string | null;
  exDate: string; recordDate: string | null; type: string;
  ratioNum: number | null; ratioDen: number | null;
  cashAmount: number | null;
  faceValueFrom: number | null; faceValueTo: number | null;
  rawSubject: string;
};

export type AdjustedBar = RawBar & {
  adjFactorCumulative: number;
  adjClose: number;
  adjustments: { exDate: string; type: string; factor: number }[];
};

export type UniverseMember = { symbol: string; isin: string | null; name: string | null; close: number | null; turnover: number | null };

export type DataStatus = "ok" | "stale" | "unavailable";

export const TEJHQ_SOURCE = "TejHQ tej-bazaar (NSE/BSE official bhavcopy, redistributed)" as const;
export const TEJHQ_API = "https://api.tejhq.dev" as const;

/** Price data older than this is stale for decisions (PRD freshness gate). */
export const PRICE_MAX_AGE_MS = 4 * 24 * 3600_000;
