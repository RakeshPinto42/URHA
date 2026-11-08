# Issue register

Status is **Verified** only when the fix was seen working on the running production build, or by a test that fails without it. **Open** items block production readiness at their severity. Numbers match the audit of 2026-11-08 where they came from it; `S` numbers were found during Stage 1.

## Stage 1: correctness and trust

| # | Sev | Issue | Evidence | Fix | Status |
|---|---|---|---|---|---|
| 2 | Critical | ETFs and funds were treated as companies | 90 in the read set; 11 of 21 OVEREXTENDED were funds | `universe.ts`: ISIN decides, not the name | Pending the full-scan check |
| 3 | Critical | Banks judged like factories | Debt/equity of 8 failed | Separate models: operating, lender, other financial | Verified by test; no real financial data yet |
| 4 | Critical | Some strategies could never run | No source for three inputs; P/E vs sector never calculated | `derive.ts`, plus raw import columns | Verified by test; column names unverified against a real export |
| 5 | Critical | Stock writes had only an origin check | Hosted `Host` was accepted | `api-guard.ts`: loopback or token, fail closed | Verified live |
| S1 | Critical | `/api/backup` gave the whole database to any host | 200 with a hosted `Host`, found by live probe | `guardRead` | Verified live: 401 |
| S2 | High | Studio writes used the weaker check | Code review | `guardWrite`; a test now requires it on every write route | Verified live |
| S3 | High | Old stored readings crashed company pages | M&M returned 500 | Older-engine readings count as unread | Verified live |
| 7 | High | "Tightening" did not measure tightening | The old limit passed 77% of the market | Current range against the prior one | Pending the full-scan check |
| 8 | High | Volume not adjusted for splits | `adjust.ts` ignored volume | `adjustedVolume` | Verified by test |
| 9 | High | Liquidity used one session | 1,082 excluded on one day | 20-session average, from 20 market snapshots | Verified live: 1,573 eligible |
| 10 | High | Scores were not comparable across data coverage | 9 distinct scores, 13 tied at the top | Earned against measured, pulled towards 50 when thin; ties use 6-month strength | Pending the full-scan check |
| 11 | High | "Rising" averages were never checked | The wording claimed it; no slope existed | Slope required for BULLISH, and stated in the reasons | Pending the full-scan check |
| 13 | High | "With fundamentals" undercounted | A 4-measure import showed 0 | Counts any fundamental value | Verified by test |
| 14 | High | CSV formula injection | `=HYPERLINK` exported as-is | Leading `= + - @`, tab and CR are neutralised | Verified by test |
| 15 | High | Malformed address returned 500 | `/discovery/%E0%A4%A` | `proxy.ts`, because it fails inside Next's router | Verified live: 404 |
| 16 | High | Upload limit applied after reading the body | 30 MB read for 1.7 s, then refused | `readLimited` stops at the limit | Verified live: 9 MB refused in 45 ms |
| S4 | Medium | Stated pacing was luck, not enforced | Code review | 550 ms minimum between calls | Verified by review |
| S5 | Medium | JSON such as `null` could crash a handler | Code review | `jsonBody` accepts objects only | Verified live: 400 |
| S6 | Medium | Confidence could read high on partial data | Thresholds used total points only | High needs every pillar evidenced | Verified by test |

## Open

| # | Sev | Issue | Why it is open |
|---|---|---|---|
| 1 | Critical | One working source out of ten | Needs your Screener export, an AMFI list and an approved API (Stage 4) |
| 12 | Critical | The score has never been backtested | Stage 3. Point-in-time fundamentals do not exist yet, and delisted coverage is unproven |
| S7 | High | Pages and server actions have no login | Only the API routes are guarded. URHA must not be hosted until the whole app is gated. Local use is safe because it binds to 127.0.0.1 |
| S8 | High | No sector or fundamental data, so the financial models are untested on real figures | Needs real data (Stage 4) |
| S9 | High | Screener column names are unverified | Needs a real export |
| 17 | High | Colour tints do not render | Stage 6 |
| 18 | High | Stock table cannot be sorted by column | Stage 6 |
| 19 | High | `/discovery` page weight | Stage 2 |
| 20 | High | A slow provider can hold up the page | Stage 2 |
| 21 | High | No CI or repeatable browser tests in the repo | Browser checks are scripts outside Git |
| 22–24 | High | Career content issues | Stage 5 |
| S10 | Medium | A scan row can read as complete when the benchmark failed | Stage 2 |
| S11 | Medium | Companies that lose eligibility keep old readings | Stage 2 |
| S12 | Medium | The scan's failed count resets on resume | Stage 2 |

Medium items from the audit stay tracked in `docs/PRODUCT_INTEGRATION.md` until their stage.
