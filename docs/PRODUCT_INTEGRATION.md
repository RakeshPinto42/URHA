# Career Intelligence and Rare Stock Discovery

Both live inside URHA, by the owner's decision of 2026-11-08. This replaces the earlier plan to build the stock engine in NexEra's `/wealth`. NexEra's stock work stays on its own `stock-discovery` branch, unchanged. URHA took a copy of its pure engine code, so the two can now diverge.

## Career Intelligence (`/career`)

Reads the existing curriculum and progress. It adds no tables.

- `lib/career.ts`: the sequence, the weekly plan and skill standing. A subtopic counts as done only once practised, so watching never moves the plan on.
- The lesson player uses `youtube-nocookie.com`. The security policy allows that one frame source and `i.ytimg.com` thumbnails.
- Difficulty and objectives exist for all 224 videos. They were judged from the verified title, chapters and curation note, and `relevance` records which. No video was watched, so these are informed estimates.

## Rare Stock Discovery (`/discovery`)

| File | Job |
|---|---|
| `lib/stocks/indicators.ts`, `adjust.ts`, `tejhq.ts`, `http.ts`, `evidence.ts`, `amfi.ts` | Copied from NexEra |
| `lib/stocks/technicals.ts` | Readings and the technical verdict |
| `lib/stocks/scoring.ts` | The 100-point score and the 13 strategies |
| `lib/stocks/scan.ts`, `store.ts`, `discovery.ts` | The market scan, storage and dashboard model |
| `lib/stocks/imports.ts` | Screener CSV import |

Database version 5 adds five `stock_*` tables and changes nothing that existed. Scan data, imports and the watchlist live in URHA's own database.

### Rules that must hold

- A missing value is unavailable, never a failed test, and it earns no points.
- Sources that disagree are never averaged. The company shows the conflict and both values.
- A strategy with no data says "not testable", never "no match".
- EARLY ACCUMULATION requires measured strong fundamentals. Without them, the verdict stays NEUTRAL and says why.
- A company with under 200 sessions gets NOT ENOUGH DATA, a sixth state added so that thin history is never judged.
- Thresholds are provisional and have not been tested against market outcomes.

### Data limits

| Need | State |
|---|---|
| Prices, volume, corporate actions | TejHQ, keyless |
| Market list | 2,746 NSE equities; those trading ₹1 crore or more a day are read (1,664 on 2026-11-06) |
| Nifty 500 | Not available from TejHQ. `MONIFTY500`, an ETF with history from October 2023, stands in and is labelled |
| Market cap class | Only from an AMFI list you download |
| Fundamentals | Only from a CSV you import. No provider is connected |
| Promoter, pledge and dilution | Only if your export includes them |
| Governance red flags | Not evaluated. Nothing supplies them yet |

The Screener column names in `imports.ts` have not been checked against a real export, and a Screener CSV carries no reporting period, so values show "reporting period not stated".

A scan runs inside the server process, at about one company a second. It saves as it goes, and starting again on the same trading day carries on from where it stopped.
