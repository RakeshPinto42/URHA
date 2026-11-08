/**
 * The data sources. A null field has not been evaluated: pricing, terms and coverage are recorded
 * only after checking the provider's own documents, never assumed.
 */
export type SourceTier = "official" | "structured" | "research" | "market-data";

export type DataSource = {
  id: string; provider: string; tier: SourceTier; provides: string;
  access: string | null; licensing: string | null; note: string | null;
};

export const SOURCE_TIER_LABEL: Record<SourceTier, string> = {
  official: "Official filings and classification", structured: "Structured financial data",
  research: "Research platforms", "market-data": "Market data",
};

const later = (id: string, provider: string, tier: SourceTier, provides: string, access: string | null, note: string | null = null): DataSource =>
  ({ id, provider, tier, provides, access, licensing: null, note });

export const DATA_SOURCES: DataSource[] = [
  { id: "amfi", provider: "AMFI market-cap list", tier: "official", provides: "Large, mid and small-cap classification", access: "CSV you download and import", licensing: "AMFI terms: personal, non-commercial use", note: "Stored only in your local database." },
  { id: "nse", provider: "NSE bhavcopy", tier: "official", provides: "Official end-of-day prices for every NSE security", access: "The published daily file, downloaded only when you ask", licensing: null, note: "The site is never crawled; filings and announcements are not read." },
  { id: "bse", provider: "BSE bhavcopy", tier: "official", provides: "Official end-of-day prices for every BSE security, including BSE-only companies", access: "The latest file when you ask; a year of past files only when you build the BSE-only history", licensing: null, note: "Paced at one file every 1.5 seconds; filings and announcements are not read." },
  // Governance, checked 2026-11-08. Nothing here is read yet; the board shows governance as not measured unless a Screener CSV supplies it.
  later("nse-shp", "NSE shareholding pattern", "official", "Promoter and public holding by quarter, with the date each was published (point-in-time)", "Exchange web API, answered without a session when checked", "Not read yet. Pledges came back empty without a browser session; auditor changes, related-party transactions and board data are filings, not structured data."),
  later("bse-shp", "BSE shareholding pattern", "official", "Promoter holding and pledge by quarter", "Exchange web API refused automated requests (HTTP 403) when checked", "Not usable without a browser session."),
  later("upstox", "Upstox Fundamentals API", "structured", "Statements, ratios, shareholding", "Documented API, needs your account"),
  { id: "screener", provider: "Screener.in", tier: "research", provides: "Fundamental ratios and growth", access: "CSV export from your own account", licensing: null, note: "Never scraped." },
  later("trendlyne", "Trendlyne", "research", "Ratios and research metrics", null),
  later("tijori", "Tijori Finance", "research", "Segments and industry fundamentals", null),
  { id: "tejhq", provider: "TejHQ tej-bazaar", tier: "market-data", provides: "Daily prices, volume, corporate actions, market list", access: "Documented REST API, no key", licensing: "Redistributes exchange bhavcopy; terms not yet reviewed for this use", note: "Paced at under 2 requests a second." },
  later("truedata", "TrueData", "market-data", "Market data and history", "API, needs a subscription"),
  later("yahoo", "Yahoo Finance", "market-data", "Supplementary price history", null, "Supplementary only."),
];

export type SourceStatus = DataSource & { state: string; working: boolean };

export function sourceStatuses(h: { tejhq: { ok: true; date: string } | { ok: false; reason: string }; fundamentals: Record<string, number>; segments: number; official?: { nse: string | null; bse: string | null } }): SourceStatus[] {
  return DATA_SOURCES.map((s) => {
    if (s.id === "nse" || s.id === "bse") {
      const d = h.official?.[s.id] ?? null;
      return d ? { ...s, state: `Official prices held for ${d}`, working: true } : { ...s, state: "Not downloaded yet", working: false };
    }
    if (s.id === "tejhq") return h.tejhq.ok ? { ...s, state: `Connected, latest trading day ${h.tejhq.date}`, working: true } : { ...s, state: `Unavailable right now: ${h.tejhq.reason}`, working: false };
    if (s.id === "amfi") return h.segments > 0 ? { ...s, state: `${h.segments} companies classified`, working: true } : { ...s, state: "Not imported yet", working: false };
    const companies = h.fundamentals[s.id] ?? 0;
    if (companies > 0) return { ...s, state: `${companies} companies imported`, working: true };
    return { ...s, state: s.id === "screener" ? "Not imported yet" : "Not connected", working: false };
  });
}
