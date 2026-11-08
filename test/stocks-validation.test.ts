import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { agreement, averageTurnoverOf, coverageOf, parseBhavcopy, rawBarsOf, splitCsv } from "@/lib/stocks/bhavcopy";
import { adjustBars } from "@/lib/stocks/adjust";
import { evaluationDates, observe, sampleOf, summarise, type Observation } from "@/lib/stocks/backtest";
import { unzipSingle } from "@/lib/stocks/official";
import type { Bar } from "@/lib/stocks/technicals";

const HEAD = "TradDt,BizDt,Sgmt,Src,FinInstrmTp,FinInstrmId,ISIN,TckrSymb,SctySrs,XpryDt,FininstrmActlXpryDt,StrkPric,OptnTp,FinInstrmNm,OpnPric,HghPric,LwPric,ClsPric,LastPric,PrvsClsgPric,UndrlygPric,SttlmPric,OpnIntrst,ChngInOpnIntrst,TtlTradgVol,TtlTrfVal,TtlNbOfTxsExctd,SsnId,NewBrdLotQty,Rmks,Rsvd1,Rsvd2,Rsvd3,Rsvd4";
const row = (sym: string, isin: string, close: number, tp = "STK") => `2026-11-06,2026-11-06,CM,NSE,${tp},1,${isin},${sym},EQ,,,,,"${sym} LTD, INDIA",1,2,0.5,${close},${close},1,,${close},,,100,1000,10,F1,1,,,,,`;

describe("official exchange files", () => {
  it("parses stock rows, keeps quoted names whole, and skips other instruments", () => {
    const text = [HEAD, row("RELIANCE", "INE002A01018", 1320), row("NIFTYBEES", "INF204KB14I2", 290), row("FUT", "INE002A01018", 1, "FUT")].join("\n");
    const r = parseBhavcopy("nse", text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tradeDate).toBe("2026-11-06");
    expect(r.rows.map((x) => x.symbol)).toEqual(["RELIANCE", "NIFTYBEES"]);
    expect(r.rows[0]!.name).toBe("RELIANCE LTD, INDIA");
    expect(splitCsv('a,"b,c",d')).toEqual(["a", "b,c", "d"]);
  });

  it("refuses a file that is not the expected format rather than guessing at columns", () => {
    const r = parseBhavcopy("bse", "SYMBOL,CLOSE\nABB,6774");
    expect(r.ok).toBe(false);
  });

  it("unzips the single file in a zip", () => {
    const body = Buffer.from(`${HEAD}\n${row("TCS", "INE467B01029", 4100)}\n`);
    const data = deflateRawSync(body), name = Buffer.from("x.csv");
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(8, 8); head.writeUInt32LE(data.length, 18); head.writeUInt32LE(body.length, 22); head.writeUInt16LE(name.length, 26);
    expect(unzipSingle(Buffer.concat([head, name, data]))).toBe(body.toString());
  });

  it("counts companies on each exchange by ISIN, and those only on BSE", () => {
    const nse = [{ isin: "INE002A01018" }, { isin: "INE467B01029" }, { isin: "INF204KB14I2" }] as never[];
    const bse = [{ isin: "INE002A01018" }, { isin: "INE999Z01011" }] as never[];
    expect(coverageOf(nse, bse)).toEqual({ nse: 2, bse: 2, both: 1, bseOnly: 1, nseOnly: 1 });
  });

  it("shows disagreements with both values, never an average", () => {
    const official = [{ symbol: "A", close: 100, isin: "INE000A01011" }, { symbol: "B", close: 200, isin: "INE000B01011" }, { symbol: "C", close: 50, isin: "INE000C01011" }];
    const a = agreement("2026-11-06", official, [{ symbol: "A", close: 100 }, { symbol: "B", close: 210 }, { symbol: "Z", close: 9 }]);
    expect(a).toMatchObject({ compared: 2, agree: 1, disagree: 1, onlyOfficial: 1, onlyOther: 1 });
    expect(a.worst[0]).toEqual({ symbol: "B", official: 200, other: 210, diffPct: 5 });
  });
});

/** A synthetic trending series with noise, deterministic. */
function series(n: number, drift: number, seed = 1): Bar[] {
  let s = seed, p = 100;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: n }, (_, i) => {
    p *= 1 + drift + (rand() - 0.5) * 0.03;
    const d = new Date(Date.UTC(2015, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
    return { date: d, close: p, high: p * 1.01, low: p * 0.99, volume: 1e5 * (1 + rand()) };
  });
}

describe("BSE-only history from the exchange's files", () => {
  // RELIANCE around its 1:1 bonus, as BSE published it: the previous close on the ex-date is NOT adjusted.
  const rows = [
    { tradeDate: "2024-10-25", open: 2670, high: 2680, low: 2650, close: 2655.45, prevClose: 2679.1, volume: 100, turnover: 2e7 },
    { tradeDate: "2024-10-28", open: 1338, high: 1353.15, low: 1322, close: 1334.3, prevClose: 2655.45, volume: 210, turnover: 2.8e7 },
    { tradeDate: "2024-10-24", open: 2680, high: 2690, low: 2670, close: 2679.1, prevClose: 2677, volume: 90, turnover: 2.4e7 },
  ];
  it("orders the days and adjusts a bonus with the actions feed, not the exchange's previous close", () => {
    const raw = rawBarsOf(rows);
    expect(raw.map((b) => b.date)).toEqual(["2024-10-24", "2024-10-25", "2024-10-28"]);
    const bonus = { exchange: "BSE", symbol: "RELIANCE", isin: "INE002A01018", exDate: "2024-10-28", type: "bonus", ratioNum: 1, ratioDen: 1, cashAmount: null, fvFrom: null, fvTo: null } as never;
    const adj = adjustBars(raw, [bonus]);
    expect(adj[1]!.adjClose).toBeCloseTo(2655.45 / 2, 6);
    expect(adj[2]!.adjClose).toBe(1334.3);
  });
  it("averages turnover over the calendar, counting a day without trades as zero", () => {
    const a = averageTurnoverOf(rows.slice(0, 2), ["2024-10-24", "2024-10-25", "2024-10-28"], 3);
    expect(a).toEqual({ average: (2e7 + 2.8e7) / 3, traded: 2 });
  });
});

describe("historical validation", () => {
  const bars = series(900, 0.0008);
  const bench = new Map(series(900, 0.0003, 7).map((b) => [b.date, b.close]));
  const p = { horizon: 60, step: 21, from: "2015-01-01", costPct: 0.4 };

  it("never looks ahead: changing later prices leaves earlier verdicts unchanged", () => {
    const full = observe("X", bars, bench, p);
    const tampered = bars.map((b, i) => (i > 600 ? { ...b, close: b.close * 3, high: b.high * 3, low: b.low * 3 } : b));
    const after = observe("X", tampered, bench, p);
    // Verdicts on dates whose window ends before the change must match exactly.
    const early = (o: Observation[]) => o.filter((x) => bars.findIndex((b) => b.date === x.date) <= 600).map((x) => `${x.date}:${x.verdict}`);
    expect(early(after)).toEqual(early(full));
    expect(full.length).toBeGreaterThan(5);
  });

  it("evaluates every company on the benchmark's dates, whatever its own history", () => {
    const calendar = [...bench.keys()];
    const dates = evaluationDates(calendar, p);
    // Every step-th benchmark session from the start date, and nothing else.
    expect(dates[0]).toBe(calendar.find((d) => d >= p.from));
    for (let k = 1; k < dates.length; k++) expect(calendar.indexOf(dates[k]!) - calendar.indexOf(dates[k - 1]!)).toBe(p.step);
    // A company that listed later, and one with a suspension, are still only seen on those dates.
    const late = bars.slice(150);
    const gappy = bars.filter((_, i) => i < 400 || i > 430);
    const shared = new Set(dates);
    for (const series of [bars, late, gappy]) {
      const obs = observe("X", series, bench, p, dates);
      expect(obs.length).toBeGreaterThan(0);
      for (const o of obs) expect(shared.has(o.date), o.date).toBe(true);
    }
    // Where two companies both have a verdict, it is on the same date and over the same benchmark period.
    const a = new Map(observe("A", bars, bench, p, dates).map((o) => [o.date, o.bench]));
    for (const o of observe("B", late, bench, p, dates)) if (a.has(o.date)) expect(o.bench).toBeCloseTo(a.get(o.date)!, 9);
  });

  it("measures returns after costs against the benchmark over the same dates", () => {
    const o = observe("X", bars, bench, p)[0]!;
    const i = bars.findIndex((b) => b.date === o.date);
    const ret = (bars[i + 60]!.close / bars[i]!.close - 1) * 100 - 0.4;
    expect(o.ret).toBeCloseTo(ret, 6);
    expect(o.excess).toBeCloseTo(o.ret - o.bench, 6);
  });

  it("calls a verdict supported, contradicted or not supported only from the evidence", () => {
    const obs: Observation[] = [];
    for (let d = 0; d < 40; d++) {
      const date = `2020-${String(1 + (d % 12)).padStart(2, "0")}-${String(1 + Math.floor(d / 12)).padStart(2, "0")}`;
      for (let k = 0; k < 6; k++) {
        const noise = ((d * 7 + k * 13) % 10) / 10 - 0.45;
        obs.push({ date, symbol: `B${k}`, verdict: "BULLISH", ret: 0, bench: 0, excess: 6 + noise });
        obs.push({ date, symbol: `N${k}`, verdict: "NEUTRAL", ret: 0, bench: 0, excess: noise });
        obs.push({ date, symbol: `R${k}`, verdict: "BEARISH", ret: 0, bench: 0, excess: 4 + noise });
        obs.push({ date, symbol: `O${k}`, verdict: "OVEREXTENDED", ret: 0, bench: 0, excess: 2 + noise * 40 });
      }
    }
    const s = Object.fromEntries(summarise(obs, p).map((x) => [x.verdict, x]));
    expect(s.BULLISH!.status).toBe("supported");
    expect(s.BEARISH!.status).toBe("contradicted");
    expect(s.NEUTRAL!.status).toBe("no claim");
    expect(s["EARLY ACCUMULATION"]!.status).toBe("too little data");
    expect(s.ALL!.n).toBe(obs.length);
  });

  it("samples deterministically", () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(sampleOf(items, 10, 42)).toEqual(sampleOf(items, 10, 42));
    expect(new Set(sampleOf(items, 10, 42)).size).toBe(10);
  });
});
