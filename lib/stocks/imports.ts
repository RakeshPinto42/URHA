/**
 * Reading fundamentals from a CSV you exported. Columns are matched by name; anything not
 * recognised is reported, never guessed. The Screener column names here come from its documented
 * vocabulary and have not yet been checked against a real export.
 */
import { parseCsv } from "./amfi";
import type { Metric } from "./scoring";

/** Lower-case header, with spaces and punctuation squeezed out. */
const norm = (s: string) => s.toLowerCase().replace(/rs\.?\s*cr\.?/g, "").replace(/[^a-z0-9]/g, "");

const ALIASES: Partial<Record<Metric, string[]>> = {
  roce: ["roce", "returnoncapitalemployed"],
  roe: ["roe", "returnonequity"],
  opm: ["opm", "operatingprofitmargin", "opmlatestquarter"],
  cashConversion: ["cashconversion", "cfotopat", "cfopat"],
  fcf: ["freecashflow", "freecashflowlastyear", "fcf"],
  revenueCagr3y: ["salesgrowth3years", "salesvar3yrs", "revenuecagr3y"],
  profitCagr3y: ["profitgrowth3years", "profitvar3yrs", "profitcagr3y"],
  qtrProfitGrowth: ["qtrprofitvar", "yoyquarterlyprofitgrowth", "qtrprofitgrowth"],
  pe: ["pe", "pricetoearning", "priceearnings"],
  peg: ["peg", "pegratio"],
  evEbitda: ["evebitda", "evtoebitda"],
  debtEquity: ["debttoequity", "de", "debtequity"],
  promoterHolding: ["promoterholding", "promoterholdingpct", "promhold"],
  promoterPledge: ["pledgedpercentage", "pledgedpct", "promoterpledge"],
  dilution3y: ["dilution3y", "changeinshares3years"],
  roceChange: ["rocechange", "rocechange3y"],
};
const SYMBOL = ["nsecode", "nsesymbol", "symbol"];
const ISIN = ["isin", "isincode"];
const SECTOR = ["industry", "sector", "industrygroup"];
const IGNORED = new Set(["sno", "name", "companyname", "bsecode", "cmp", "currentprice", "marcap", "marketcapitalization", "divyld", "dividendyield", "npqtr", "salesqtr", "qtrsalesvar"]);

export type FundamentalRow = { symbol: string | null; isin: string | null; sector: string | null; values: Partial<Record<Metric, number>> };
export type ParsedImport = { ok: true; rows: FundamentalRow[]; matched: Metric[]; ignored: string[] } | { ok: false; error: string };

export function parseFundamentalsCsv(text: string): ParsedImport {
  const rows = parseCsv(text.replace(/^﻿/, "")).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return { ok: false, error: "This file has no data rows." };
  const headers = rows[0]!.map(norm);
  const find = (names: string[]) => headers.findIndex((h) => names.includes(h));
  const symbolAt = find(SYMBOL), isinAt = find(ISIN), sectorAt = find(SECTOR);
  if (symbolAt < 0 && isinAt < 0) return { ok: false, error: "No NSE Code or ISIN column, so rows cannot be matched to companies. Add one of them to your export." };

  const columns = (Object.entries(ALIASES) as [Metric, string[]][]).flatMap(([m, names]) => { const i = find(names); return i < 0 ? [] : [[m, i] as const]; });
  if (columns.length === 0) return { ok: false, error: "No recognised fundamental columns." };
  const used = new Set<number>([symbolAt, isinAt, sectorAt, ...columns.map(([, i]) => i)]);
  const ignored = rows[0]!.filter((_, i) => !used.has(i) && !IGNORED.has(headers[i]!)).map((h) => h.trim()).filter(Boolean);

  const out: FundamentalRow[] = [];
  for (const r of rows.slice(1)) {
    const symbol = symbolAt >= 0 ? (r[symbolAt] ?? "").trim().toUpperCase() : "";
    const isin = isinAt >= 0 ? (r[isinAt] ?? "").trim().toUpperCase() : "";
    if (!symbol && !isin) continue;
    const values: FundamentalRow["values"] = {};
    for (const [m, i] of columns) {
      const raw = (r[i] ?? "").replace(/[,%₹\s]/g, "");
      if (raw === "" || raw === "-") continue; // Blank stays unknown. It is never read as zero.
      const n = Number(raw);
      if (Number.isFinite(n)) values[m] = n;
    }
    out.push({ symbol: symbol || null, isin: isin || null, sector: sectorAt >= 0 ? (r[sectorAt] ?? "").trim() || null : null, values });
  }
  if (out.length === 0) return { ok: false, error: "No row has a company identifier." };
  return { ok: true, rows: out, matched: columns.map(([m]) => m), ignored };
}
