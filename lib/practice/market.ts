/** Whether the real NSE price file for the market exercises is built here, and how recent it is. Server-only. */
import "server-only";
import fs from "node:fs";
import path from "node:path";

export type MarketData = { available: false } | { available: true; first: string; last: string; weekdaysOld: number };
const FILE = path.join(process.cwd(), "public/practice/data/market_prices.csv");

export function weekdaysBetween(from: string, to: Date): number {
  let n = 0;
  for (let t = new Date(`${from}T00:00:00Z`).getTime() + 86_400_000; t <= to.getTime(); t += 86_400_000) if (new Date(t).getUTCDay() % 6 !== 0) n++;
  return n;
}

export function marketData(now = new Date()): MarketData {
  let text: string;
  try { text = fs.readFileSync(FILE, "utf8"); } catch { return { available: false }; }
  const dates = text.split("\n").slice(1).map((l) => l.slice(0, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if (!dates.length) return { available: false };
  return { available: true, first: dates[0]!, last: dates.at(-1)!, weekdaysOld: weekdaysBetween(dates.at(-1)!, now) };
}
