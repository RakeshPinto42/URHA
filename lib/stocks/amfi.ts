// AMFI market-cap classification, from NexEra's lib/wealth/mcapList.ts. Categories are AMFI's own
// "Categorization as per SEBI Circular" column, never computed here. You download the list yourself
// (AMFI terms: personal, non-commercial use) and it stays in your local database.
export type MarketCapSegment = "large-cap" | "mid-cap" | "small-cap";

const MAX_BYTES = 4 * 1024 * 1024;
/** SEBI: the list applies for the next half-year; past this age a newer list should exist. */
const STALE_AFTER_MONTHS = 7;
const CATEGORY: Record<string, MarketCapSegment> = { "large cap": "large-cap", "mid cap": "mid-cap", "small cap": "small-cap" };
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const ISIN_RE = /^IN[A-Z0-9]{9}[0-9]$/;

export type McapRow = { rank: number; name: string; isin: string; nse: string | null; bse: string | null; avgMcapCr: number | null; segment: Exclude<MarketCapSegment, "UNCLASSIFIED"> };
export type McapList = {
  source: string; title: string; periodEnd: string; uploadedAt: string;
  counts: { large: number; mid: number; small: number }; rows: McapRow[];
};

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF/LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let f = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(f); rows.push(row); row = []; f = "";
    } else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows;
}

const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const dash = (s: string) => (s === "" || s === "-" ? null : s);

export function parseAmfiCsv(text: string, now: () => Date = () => new Date()): { ok: true; list: McapList } | { ok: false; errors: string[] } {
  if (text.length > MAX_BYTES) return { ok: false, errors: ["File is larger than 4 MB — not an AMFI list export."] };
  const rows = parseCsv(text.replace(/^﻿/, "")).map((r) => r.map(clean));
  const titleRow = rows.slice(0, 5).find((r) => /six months ended/i.test(r.join(" ")));
  const m = titleRow?.join(" ").match(/six months ended\s+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/i);
  const month = m ? MONTHS.indexOf(m[2]!.toLowerCase()) : -1;
  if (!m || month < 0) return { ok: false, errors: ['Title row with "six months ended <day> <Month> <year>" not found — export the AMFI sheet unchanged.'] };
  const periodEnd = `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  if (Number.isNaN(Date.parse(`${periodEnd}T00:00:00Z`)) || new Date(`${periodEnd}T00:00:00Z`).toISOString().slice(0, 10) !== periodEnd) return { ok: false, errors: [`Period end ${periodEnd} is not a real date.`] };

  const hIdx = rows.findIndex((r) => r.includes("ISIN") && r.some((c) => /^Categori[sz]ation/i.test(c)));
  if (hIdx < 0) return { ok: false, errors: ['Header row with "ISIN" and "Categorization…" columns not found.'] };
  const h = rows[hIdx]!;
  const col = (re: RegExp) => h.findIndex((c) => re.test(c));
  const ix = { rank: col(/^Sr\.?\s*No/i), name: col(/^Company name/i), isin: col(/^ISIN$/), bse: col(/^BSE Symbol/i), nse: col(/^NSE Symbol/i), avg: col(/^Average of All Exchanges/i), cat: col(/^Categori[sz]ation/i) };
  const missing = Object.entries(ix).filter(([, i]) => i < 0).map(([k]) => k);
  if (missing.length) return { ok: false, errors: [`Missing columns: ${missing.join(", ")}.`] };

  const errors: string[] = [];
  const out: McapRow[] = [];
  const seen = new Set<string>();
  for (let r = hIdx + 1; r < rows.length; r++) {
    const c = rows[r]!;
    if (c.every((x) => x === "")) continue;
    const line = r + 1;
    const rank = Number(c[ix.rank]);
    const isin = (c[ix.isin] ?? "").toUpperCase();
    const segment = CATEGORY[(c[ix.cat] ?? "").toLowerCase()];
    const avgRaw = dash(c[ix.avg] ?? "");
    const avg = avgRaw === null ? null : Number(avgRaw.replace(/,/g, ""));
    if (!Number.isInteger(rank) || rank < 1) errors.push(`Line ${line}: Sr. No. "${c[ix.rank]}" is not a positive integer.`);
    else if (!ISIN_RE.test(isin)) errors.push(`Line ${line}: ISIN "${c[ix.isin]}" is not a valid Indian ISIN.`);
    else if (!segment) errors.push(`Line ${line}: category "${c[ix.cat]}" is not Large Cap, Mid Cap or Small Cap.`);
    else if (avg !== null && (!Number.isFinite(avg) || avg < 0)) errors.push(`Line ${line}: average market cap "${avgRaw}" is not a number.`);
    else if (seen.has(isin)) errors.push(`Line ${line}: duplicate ISIN ${isin}.`);
    else {
      seen.add(isin);
      out.push({ rank, name: c[ix.name] ?? "", isin, nse: dash((c[ix.nse] ?? "").toUpperCase()), bse: dash((c[ix.bse] ?? "").toUpperCase()), avgMcapCr: avg, segment });
    }
    if (errors.length >= 10) { errors.push("Stopped after 10 errors."); break; }
  }
  if (errors.length) return { ok: false, errors };
  const counts = { large: out.filter((x) => x.segment === "large-cap").length, mid: out.filter((x) => x.segment === "mid-cap").length, small: out.filter((x) => x.segment === "small-cap").length };
  // SEBI definition: exactly 100 large and 150 mid — anything else is a truncated or edited export.
  if (counts.large !== 100 || counts.mid !== 150) return { ok: false, errors: [`Expected 100 Large Cap and 150 Mid Cap rows (SEBI definition); found ${counts.large} and ${counts.mid}. Export the full sheet.`] };
  const bad = out.find((x) => (x.segment === "large-cap" && x.rank > 100) || (x.segment === "mid-cap" && (x.rank <= 100 || x.rank > 250)) || (x.segment === "small-cap" && x.rank <= 250));
  if (bad) return { ok: false, errors: [`Rank ${bad.rank} (${bad.name}) does not match its category ${bad.segment} — the list is inconsistent.`] };
  return {
    ok: true,
    list: {
      source: "AMFI Average Market Capitalisation list (operator-supplied export)", title: clean(titleRow?.join(" ")),
      periodEnd, uploadedAt: now().toISOString(), counts, rows: out.sort((a, b) => a.rank - b.rank),
    },
  };
}
