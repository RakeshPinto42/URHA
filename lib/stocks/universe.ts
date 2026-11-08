/**
 * Who belongs in equity discovery. Pure. The ISIN decides, not the name: names would wrongly
 * drop real companies such as PNB Gilts or SBI Funds Management.
 *
 * An Indian ISIN is IN + issuer type + issuer + security type + serial + check digit. Issuer type
 * E is a company and F a mutual fund, and security type 01 is an equity share.
 */
export type Instrument = "company" | "fund" | "other";
export type Eligibility = "eligible" | "below-liquidity" | "not-a-company" | "unidentified";

export const ELIGIBILITY_LABEL: Record<Eligibility, string> = {
  eligible: "Eligible",
  "below-liquidity": "Below the liquidity limit",
  "not-a-company": "ETF, fund or other instrument",
  unidentified: "No ISIN from the source",
};

/** ₹1 crore a day, averaged over 20 sessions. */
export const MIN_AVG_TURNOVER = 1e7;
export const LIQUIDITY_SESSIONS = 20;

export function instrumentOf(isin: string | null): Instrument {
  if (!isin) return "other";
  if (/^INE[A-Z0-9]{4}01[A-Z0-9]{3}$/.test(isin)) return "company";
  if (isin.startsWith("INF")) return "fund";
  return "other";
}

/** Sessions a company did not trade count as zero: a thin stock must not look liquid by missing days. */
export function averageTurnover(sessions: Map<string, number>[]): Map<string, { average: number; traded: number }> {
  const totals = new Map<string, { sum: number; traded: number }>();
  for (const day of sessions) for (const [symbol, turnover] of day) {
    const t = totals.get(symbol) ?? { sum: 0, traded: 0 };
    totals.set(symbol, { sum: t.sum + turnover, traded: t.traded + 1 });
  }
  return new Map([...totals].map(([symbol, t]) => [symbol, { average: t.sum / sessions.length, traded: t.traded }]));
}

export function eligibilityOf(isin: string | null, avgTurnover: number | null): Eligibility {
  if (!isin) return "unidentified";
  if (instrumentOf(isin) !== "company") return "not-a-company";
  return (avgTurnover ?? 0) >= MIN_AVG_TURNOVER ? "eligible" : "below-liquidity";
}

export type BusinessModel = "industrial" | "lender" | "financial-other" | "unclassified";

export const MODEL_LABEL: Record<BusinessModel, string> = {
  industrial: "Operating company",
  lender: "Bank or NBFC",
  "financial-other": "Other financial",
  unclassified: "Business type unknown",
};

const LENDER = /\bbank|nbfc|non.?banking|finance|financial institution|micro.?finance|lending/i;
const OTHER_FINANCIAL = /insurance|asset management|\bamc\b|brok(er|ing)|capital market|exchange|depositor|wealth management/i;

/**
 * How a company should be judged. The filed sector decides. Without one, only an unmistakable name
 * marks a financial. Anything else stays unknown, because treating it as an operating company
 * would apply the wrong tests if it is not one.
 */
export function modelOf(sector: string | null, name: string | null): { model: BusinessModel; basis: "sector" | "name" | null } {
  if (sector) {
    if (OTHER_FINANCIAL.test(sector)) return { model: "financial-other", basis: "sector" };
    if (LENDER.test(sector)) return { model: "lender", basis: "sector" };
    return { model: "industrial", basis: "sector" };
  }
  if (name) {
    // The market list abbreviates names ("POWER FIN CORP", "HDFC LIFE INS CO"), so these cover the short forms.
    if (/\b(insurance|insura|ins co|gic|amc|asset management|broking|depository)\b/i.test(name)) return { model: "financial-other", basis: "name" };
    if (/\b(bank|housing finance|finance|financ|fin|financial services|finserv|microfin)\b/i.test(name)) return { model: "lender", basis: "name" };
  }
  return { model: "unclassified", basis: null };
}
