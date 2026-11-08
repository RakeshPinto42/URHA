# The Realm of Wisdom

URHA opens on one world with exactly three destinations. This records what was built and why. The owner's brief of 2026-11-08 governs it.

## Places

| Route | World | Scene file | What is real in it |
|---|---|---|---|
| `/` | The Realm: floating court, crescent palace, Tree of Knowledge, three gateways | `realm.json` | The three gateway links; "Continue with" is the current focus topic |
| `/career` | Career: the Hall of Wisdom | `hall-of-wisdom.json` | Six banners show each phase as passed, current or ahead |
| `/discovery` | Rare Stocks: the Chamber of Insight | `chamber-of-insight.json` | One star for each researched company; watched ones are blue |
| `/academy` | Academy: the Grounds of Practice | `grounds-of-practice.json` | Six plinths glow by the share of exercises practised |

Every other route stays and now belongs to a destination (`lib/realm/destinations.ts`). The old home is `/today` and the topic list is `/academy/study`. Meditation, Journal, Insights, Settings and Credits are in the Compass menu, so they are not a fourth destination.

## Decisions

- **The existing engine, not React Three Fiber.** R3F was removed earlier (docs/CINEMATIC_ENGINE_AUDIT.md). The realm adds generators in `lib/realm/` and four JSON scenes, so the Studio edits all of it.
- **A crescent palace, not a central dome.** A dome directly behind the tree is hidden by the crown. Two great domes frame the tree instead.
- **Our own marble.** Poly Haven has no white veined marble. `npm run assets:marble` bakes it (`scripts/bake-marble.mjs`) and credits it as own work. Rock and the six models come from Poly Haven through `npm run assets:texture` and `assets:add`.
- **The world is a view, never the only control.** Every gateway is a real link, so keyboard users, screen readers and machines without WebGL reach the same places. Reduced motion or "Pause animation" gives still frames and plain navigation.
- **Posters.** `public/cinema/posters/*.webp` are renders of the scenes. They show while a world loads, stand in when WebGL is unavailable, and head the working pages. After changing a scene, render them again.
- **Cost.** Each page runs one WebGL context and stops it when it is scrolled away or the tab is hidden. Light shafts and mirror floors are high-tier only; the low tier has no bloom, shafts or shadows.

## Engine additions

- `environment.rays`: screen-space light shafts (`lib/cinema-engine/rays.ts`).
- `environment.shadowRange`: lets the sun's shadows cover a large world.
- `objects[].parent`: a real hierarchy, validated against missing parents and loops, and shown as a tree in the Studio.
- `materials`: scene-wide settings for the shared marble, gold, bronze, rock and crystal.
- `onFirstFrame`, which lifts the transition veil, and `setLean` for pointer parallax.

## Stage 2 (2026-11-08)

- **Tree of Knowledge.** It has a braided trunk, gold veins with light rising through them, three turning rings engraved with degrees, a crown that shimmers as wind crosses it, falling leaves and a light within the crown. All of these are scene parameters (`braid`, `pulse`, `halo`, `shimmer`, `falling`, `crownLight`).
- **Gateways.** Each one is larger and carries a lapis plaque. The page sets the destination's name on that plaque by projecting its centre, width and tilt every frame. `lib/realm/gate-spec.ts` is the one source both sides read.
- **Destination pages.** On Career, Rare Stocks and Academy the world stays behind the whole page. Scrolling walks the camera down the nave, around the instrument, or along the pool. Below the opening, the render loop stops and frames are drawn only on scroll.
- **Life.** Birds, meteors in the observatory sky, light glinting on the pool.
- **Performance.** Shadows are redrawn on a cadence rather than every frame. Render resolution follows the frame rate before the quality tier does. Leaves cast shadows only on the high tier.
- **Practice yard (`/academy/practice`).** Pyodide 314.0.7 (Python 3.14, pandas 3.0.2) runs in a module worker (`public/python/worker.js`) with these limits:
  - Network and the Python-to-JavaScript bridges are removed once the runtime loads.
  - Each run starts in a fresh namespace with a fresh data folder.
  - Runs stop after 12 s, which kills the worker and starts a new one.
  - The worker is recycled after a run that leaves it above 900 MB.
  - Output is capped.
  - Install with `npm run python:fetch`. The wheels are checked against Pyodide's SHA-256 lockfile, and the 21 MB runtime is not committed.
  - Seven challenges (`lib/practice/challenges.ts`) use synthetic data. `test/practice.test.ts` runs each reference solution and each starter in real Python.

### Measured frame rates (production build, 1920×1080, vsync on, automatic tier)

| GPU | Realm | Hall | Chamber | Grounds | Frames over 25 ms |
|---|---|---|---|---|---|
| AMD Radeon integrated (medium tier) | 69 | 65 | 66 | 62 | 0% to 2.3% |
| NVIDIA GTX 1650 (high tier) | 91 | 83 | 120 | 111 | 0% |

These were measured in headless Chrome. Chrome uses the integrated AMD unless Windows is set to give it the high-performance GPU.

## Stage 3 (2026-11-08)

- **Practice bank.** 32 exercises (`lib/practice/exercises.ts`) across Python, SQL, Pandas, data engineering, AI and finance automation, at three levels each. Each links to a curriculum topic and has hints and an explanation. The data is one fictional group's 2025 books (`npm run practice:data`, in `public/practice/data/`), synthetic and labelled as such. SQL runs through `lib/practice/harness.ts`, which loads every dataset into SQLite inside Pyodide. `test/practice.test.ts` runs every solution and every starter in real Python.
- **Progress in the database.** Migration v7 adds `practice_attempts`. `POST /api/practice/attempts` sits behind `guardWrite`. The Grounds, topic pages and the Practice yard read from the database; the browser keeps only unsaved drafts. The checks run in the browser, so a pass is your own record, not a proof.
- **Live bands.** `FrontispieceBand` is the destination's live world on every working page inside a destination, each at its own place along the path. Pages outside a destination keep a still image of the Realm.
- **Realm composition.** The tree stands on a terraced mount (`dais` with `rise`, `inset` and `stair`), so the Rare Stocks gateway frames the climb instead of hiding the trunk.
- **Editor mode.** It is switched on in Settings, stored as `editor_mode`, and works only for loopback requests (`studioAllowed` in `lib/studio-access.ts`). Development and `URHA_STUDIO=1` still open it. Every write still passes `guardWrite`.
- **Reading comfort.** The Compass tucks away while scrolling down and returns on scroll-up or focus. The section tabs scroll away with the page.
- **Performance.** Shadows redraw only when their view moves, plus a slow cadence. The medium tier starts at one render pixel per CSS pixel. The resolution governor aims at 60 fps and settles within about a second.

### Measured in a visible Chrome window (no GPU flags, vsync on, Chrome's own GPU choice)

Integrated AMD Radeon, 1540×788 CSS pixels at 125% display scaling, medium tier:

| Page | Average fps | 95th percentile | Frames over 25 ms | Render scale chosen |
|---|---|---|---|---|
| Realm | 84 | 16.8 ms | 0.6% | 0.88 |
| Hall (Career) | 83 | 16.8 ms | 0% | 0.70 |
| Chamber (Rare Stocks) | 99 | 16.7 ms | 0% | 1.0 |
| Grounds (Academy) | 75 | 16.7 ms | 0.2% | 1.0 |
| Skills (live band) | 74 | 16.8 ms | 0% | 0.74 |
| Practice yard (live band) | 79 | 16.8 ms | 0% | 0.93 |

Before these changes, the same window measured the Hall at 61 fps with 15% of frames over 25 ms. The GTX 1650 was measured only headless, with `--force_high_performance_gpu`, at 83 to 120 fps. Software-rendered runs (SwiftShader) are for screenshots only and say nothing about speed.

## Stage 4 (2026-11-08)

### Rare Stocks: sources and coverage
- **Official files.** NSE and BSE UDiFF bhavcopies (`lib/stocks/bhavcopy.ts`, `lib/stocks/official.ts`, migration v8). The latest file is fetched only on request. BSE answers a missing file (a holiday) with HTTP 200 and its home page, which is treated as "no file".
- **Coverage on 2026-11-06.** NSE lists 3,081 company shares and BSE 4,316. 2,447 are on both, 1,869 only on BSE and 634 only on NSE. TejHQ's closes agreed with NSE's file for 2,387 of 2,387 (within 0.05%). 694 NSE companies are missing from TejHQ, which keeps only the EQ series. TejHQ's BSE feed covers just 78 of the 1,869 BSE-only companies.
- **BSE-only history** (`lib/stocks/bse-history.ts`). On request it downloads 260 past BSE files, one every 1.5 s. Only BSE-only companies' rows are kept (419,554 rows). Prices are adjusted with TejHQ's actions feed, matched by ISIN, because BSE's previous close on an ex-date is **not** adjusted (RELIANCE 1:1 bonus, 2024-10-28: 2,655.45). Result: 260 sessions from 2025-10-17 to 2026-11-06 with no missing file. 84 of 1,869 BSE-only companies trade at least ₹1 crore a day, and all 84 were read: 47 have a verdict, and 37 listed too recently. They are price-only, with no fundamentals and no score.
- **Price coverage and fundamental coverage are separate.** The coverage row counts prices read and companies with fundamentals separately. Fundamentals come only from the owner's Screener CSV.
- **Governance (checked 2026-11-08).** The score's governance tests use promoter holding, pledge and dilution, and only when a Screener CSV supplies them; otherwise they show as not measured. NSE's shareholding-master API returns point-in-time promoter holding by quarter without a session, but it is not read yet. Its pledge endpoint returned empty data without a browser session. BSE's shareholding API answered 403. Auditor changes, related-party transactions and board data exist only as filings, not structured data. Nothing is inferred.

### Rare Stocks: validation of the technical verdicts
- **Method** (`lib/stocks/backtest.ts`, `lib/stocks/validation.ts`):
  - 150 companies sampled from today's 2,387 TejHQ-listed companies, seeded by trading date, so the run is reproducible.
  - Every company is evaluated on the same 128 benchmark dates, every 21 sessions from 2016-01-01 to 2026-10-08.
  - The verdict is computed only from bars up to each date. The return is over the next 60 sessions, after 0.4% costs, minus the Nifty 50 ETF's return over the same period.
  - Excess returns are winsorised at the 1st and 99th percentiles.
  - "Against the sample" is the mean over dates of the verdict's excess minus that date's sample mean. The 95% interval is clustered by date and widened by √(60/21) for overlapping windows.
- **Results** (9,074 observations, 0 companies unavailable; the re-run reproduced them exactly):

| Verdict | Observations | Dates | Mean excess | Beat index | Against sample | 95% interval | Judgement |
|---|---|---|---|---|---|---|---|
| Bullish | 741 | 113 | +8.9 | 53% | +4.2 | −1.1 to +9.5 | No reliable edge |
| Neutral | 5,219 | 125 | +4.6 | 48% | +0.4 | −0.4 to +1.2 | No claim |
| Bearish | 2,742 | 121 | +3.5 | 45% | −1.8 | −4.1 to +0.5 | No reliable edge |
| Overextended | 372 | 91 | +4.2 | 47% | +1.5 | −6.1 to +9.2 | No reliable edge |
| Early accumulation | 0 | 0 | — | — | — | — | Cannot fire without point-in-time fundamentals |

- **Reading.** Bullish and bearish point the right way, but neither interval excludes zero. No verdict is shown as reliable. Every verdict on the board, on the stock page and on the BSE-only list carries its evidence label (`lib/stocks/evidence-label.ts`), and the score is labelled provisional.
- **Known biases.**
  - Survivorship: only companies listed today are sampled.
  - The fundamental score cannot be tested, because fundamentals are not point-in-time.
  - Costs are flat; slippage on thin stocks is higher.
  - The BSE-only list shows the NSE validation result, labelled as tested on NSE.

### Career and Academy
- **Videos.** 223 of 224 curated videos are verified against YouTube (title, channel, availability), from 146 creators. `ssd-branch` cannot be embedded, so the lesson shows a link instead.
- **Prerequisites and completion.** Marking practised or proficient is refused while prerequisites are unfinished. A topic is completed only when every required linked exercise has passed.
- **Exercises.** 48 in total, ordered by level and showing what each builds on (`after`). They cover ETL load and reconciliation, a quality scorecard, retries, token budgets, PII redaction, FX exposure, DSO and DPO, CASE ageing and windowed exceptions.
- **Real-price exercises.** Three use real NSE prices (`npm run practice:market`, bonus- and split-adjusted, gitignored). They are optional for completion. The yard says when the file is missing or more than five weekdays old.

### Production readiness
- **Migration rehearsal.** `npm run db:rehearse` copies `data/urha.db` byte for byte, migrates the copy and compares every row of every personal and progress table. It also runs integrity and foreign-key checks. The real file is not opened. Result: v3 to v9, backup taken, 14 tables identical, integrity ok.
- **Access.** The server binds to 127.0.0.1. Without loopback, every route and Server Action needs the `URHA_ACCESS_TOKEN` session, and every mutating route passes `guardWrite` (enforced by `test/api-guard.test.ts`).

## Known limits

- data/urha.db is still at v3. It migrates itself to v9, with a backup, the next time the app starts on it. That has not been done without the owner's approval.
- There is no multi-user authentication. One owner token protects remote access, so hosting for others needs real accounts first.
- There is no point-in-time fundamentals source, so the score cannot be validated. NSE promoter-holding history is available but not read. There is no pledge source without a browser session.
- Practice checks run in the browser, so a pass is the learner's own record, not a proof.
