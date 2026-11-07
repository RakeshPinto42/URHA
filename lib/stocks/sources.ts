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
  later("nse", "NSE", "official", "Filings and announcements", null, "The site's terms prohibit automation, so it is never scraped. Its daily prices arrive through TejHQ."),
  later("bse", "BSE", "official", "Filings and announcements", null, "The site's terms prohibit automation, so it is never scraped."),
  later("upstox", "Upstox Fundamentals API", "structured", "Statements, ratios, shareholding", "Documented API, needs your account"),
  { id: "screener", provider: "Screener.in", tier: "research", provides: "Fundamental ratios and growth", access: "CSV export from your own account", licensing: null, note: "Never scraped." },
  later("trendlyne", "Trendlyne", "research", "Ratios and research metrics", null),
  later("tijori", "Tijori Finance", "research", "Segments and industry fundamentals", null),
  { id: "tejhq", provider: "TejHQ tej-bazaar", tier: "market-data", provides: "Daily prices, volume, corporate actions, market list", access: "Documented REST API, no key", licensing: "Redistributes exchange bhavcopy; terms not yet reviewed for this use", note: "Paced at under 2 requests a second." },
  later("truedata", "TrueData", "market-data", "Market data and history", "API, needs a subscription"),
  later("yahoo", "Yahoo Finance", "market-data", "Supplementary price history", null, "Supplementary only."),
];

export type SourceStatus = DataSource & { state: string; working: boolean };

export function sourceStatuses(h: { tejhq: { ok: true; date: string } | { ok: false; reason: string }; fundamentals: Record<string, number>; segments: number }): SourceStatus[] {
  return DATA_SOURCES.map((s) => {
    if (s.id === "tejhq") return h.tejhq.ok ? { ...s, state: `Connected, latest trading day ${h.tejhq.date}`, working: true } : { ...s, state: `Unavailable right now: ${h.tejhq.reason}`, working: false };
    if (s.id === "amfi") return h.segments > 0 ? { ...s, state: `${h.segments} companies classified`, working: true } : { ...s, state: "Not imported yet", working: false };
    const companies = h.fundamentals[s.id] ?? 0;
    if (companies > 0) return { ...s, state: `${companies} companies imported`, working: true };
    return { ...s, state: s.id === "screener" ? "Not imported yet" : "Not connected", working: false };
  });
}
