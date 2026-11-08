// Real NSE prices for the Academy's market exercises: a few large companies and the Nifty 50 ETF,
// daily from 2023, from TejHQ (the same keyless source Rare Stocks uses).
//
//   npm run practice:market
//
// `close` is the exchange's price; `adj_close` is adjusted for bonuses and splits with the same
// factors as lib/stocks/adjust.ts (bonus: d / (n + d); split: new face value / old). Dividends and
// demergers are not adjusted, and the file says so in the exercises. Written to
// public/practice/data/market_prices.csv, which is not committed: it is exchange data for your
// own use, and this script rebuilds it.
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../public/practice/data/market_prices.csv");
const API = "https://api.tejhq.dev/v1";
const SYMBOLS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "ITC", "LT", "SBIN", "NIFTYBEES"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": "urha-practice-data" }, signal: AbortSignal.timeout(30000) });
  if (r.status === 404) return { data: [] };
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
};

function factorOf(a) {
  const n = Number(a.ratio_num), d = Number(a.ratio_den);
  if (a.type === "bonus" && n > 0 && d > 0) return d / (n + d);
  if (a.type === "split") {
    const from = Number(a.fv_from ?? a.face_value_from), to = Number(a.fv_to ?? a.face_value_to);
    if (from > 0 && to > 0) return to / from;
  }
  return 1;
}

const rows = [["date", "symbol", "open", "high", "low", "close", "adj_close", "volume"]];
for (const symbol of SYMBOLS) {
  const seen = new Set();
  const bars = ((await get(`${API}/ohlcv/nse/${symbol}?from=2023-01-01`)).data ?? [])
    .filter((b) => typeof b.close === "number" && !seen.has(b.date) && seen.add(b.date))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  await sleep(600);
  const actions = ((await get(`${API}/actions/${symbol}`)).data ?? []).filter((a) => a.exchange === "NSE" && factorOf(a) !== 1);
  await sleep(600);
  // A price before an ex-date is scaled by every factor whose ex-date comes after it.
  const factorFor = (date) => actions.filter((a) => a.ex_date > date).reduce((f, a) => f * factorOf(a), 1);
  for (const b of bars) rows.push([b.date, symbol, b.open, b.high, b.low, b.close, +(b.close * factorFor(b.date)).toFixed(4), b.volume]);
  console.log(`${symbol}: ${bars.length} sessions; adjusted for ${actions.map((a) => `${a.type} ${a.ex_date}`).join(", ") || "nothing"}`);
}
await fs.writeFile(OUT, rows.map((r) => r.join(",")).join("\n") + "\n");
console.log(`market_prices.csv: ${rows.length - 1} rows`);
