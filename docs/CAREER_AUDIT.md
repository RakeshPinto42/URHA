# Career Intelligence: implementation audit

This is the audit required by `docs/PRD.md` §15, dated 2026-11-07. It was made by reading the code and the data, and **no curriculum, schema or application code was changed for it**. `Nex_Ra_2.0` was read only. Implementation starts when the owner answers §9.

## 1. Bottom line

- **The target needs one decision.** The PRD says "existing NexEra 2.0", but two systems fit that description (§2). This audit recommends URHA.
- **Migration risk is low in URHA.** The database has no learning progress to lose.
- **The biggest gap is content, not code.** Phase 2 of the PRD (data engineering and finance analytics) barely exists today, and neither do Databricks, PySpark, Terraform, OpenTelemetry, LangSmith or the five portfolio projects.
- **The YouTube work is the largest job.** 63 of 258 subtopics have documentation as their primary resource, and 9 of the 15 named channels are unused.
- **The time budget has room.** Current content is about 293 hours against 832–1,040 available.

## 2. Existing architecture: two candidates

| | URHA (`D:\Project AI\AI_Learning`) | Career in `Nex_Ra_2.0` (now branded PINNOVA) |
|---|---|---|
| Stack | Next 16, React 19, SQLite, Tailwind 3 | Next 14, per the project notes (not re-checked here) |
| Career data | `lib/curriculum.ts`, seeded into the database | `lib/career.ts`, 187 lines, a fixed snapshot |
| Structure | 7 phases, 25 topics, 258 subtopics, 12 skills | 8 phases, 26 roadmap steps |
| Video verification | 95 videos, watch-page metadata, 2026-11-01 | YouTube oEmbed check, 2026-09-30, re-check due 2027-01-01 |
| Topic prerequisites | Yes (`topic_prereqs`, with cycle detection) | Not found in `lib/career.ts` |
| Assessments and evidence | 25 assessments, attempts, evidence | Separate Academy and portfolio system |
| Repository state | Not a git repository | 216 uncommitted changes, `PRD.md` among them |
| Other purpose | Learning plus Meditation | Four pillars fixed by `VISION.md` (Academy, Stocks, TAO, Music) |

**Recommendation: build in URHA.** It already has the prerequisite graph, assessments, evidence and verified video pipeline the PRD asks for. Building in `Nex_Ra_2.0` would add a third curriculum beside `lib/career.ts` and `lib/academy.ts`, against the PRD's "no duplicate curriculum structures" rule, on top of 216 uncommitted changes. URHA can still be merged later, but its Next 16 versus NexEra's Next 14 must be resolved first.

## 3. PRD against the current URHA build

| PRD requirement | Current state | Gap |
|---|---|---|
| §3 Three career milestones | Not shown. `MILESTONES` means 10 LedgerSync steps | New |
| §4 Six phases | Seven phases | Restructure |
| §4 Modules | Phase → Topic → Subtopic, no module level | New level |
| §4 Prerequisites block advanced topics | Graph exists and a topic is "ready" when its prerequisites are done | Check Home's recommendation against "demonstrated" in Stage 1 |
| §5 YouTube is primary | 195 video primaries, 63 documentation primaries | Replace the 63 |
| §5 Mandatory metadata | Title, channel, duration, date, embeddable, verified | Add difficulty, objectives, reason and a last-verified date per video |
| §6 Workspace A–G | Topic page holds concept, prerequisites, lessons, exercises, notes | Add **Understand** and finance use case. Re-order the rest; confirm in Stage 4 |
| §7 Five states | None, Learning, Practising, Proficient, Demonstrated | Remove Proficient as a state and add Needs Revision. A revision flag already exists |
| §7 Evidence | Evidence table, gated Demonstrated | Add GitHub, screenshot and result fields if missing |
| §8 Dashboard | Most of it on Home | Add destination, current module, exercises done, portfolio status, revision list |
| §9 Planner | Tasks with a week view and a default target of 11 h | **New generator.** Default falls to the owner's 8–10 h |
| §10 Five projects | One project, LedgerSync, 10 milestones | Replace (§5) |
| §2 Profile | Not modelled | Add `CareerProfile` |

## 4. Curriculum

**Proposed mapping.** Months are a proposal for Stage 1.

| PRD phase | Months | Existing topics that move here | New content |
|---|---|---|---|
| 1. Programming, SQL and databases | 1–4 | Python engineering, Software engineering, SQL and database foundations | Starting level lowered to the owner's profile |
| 2. Data engineering and finance analytics | 5–8 | None | Pandas, ingestion and validation, finance data modelling, Databricks and PySpark, Power BI, FP&A analytics. **Project P1, P2** |
| 3. Applied AI and RAG | 9–12 | LLM engineering, Prompt and context, Knowledge ingestion, Retrieval, RAG architecture | FastAPI essentials (see below). **P3** |
| 4. AI agents and evaluation | 13–16 | Agent engineering, LangGraph, MCP, Reliable agent execution, AI evaluation, Observability | LangSmith replaces Langfuse. **P4** |
| 5. Software engineering, integration and cloud | 17–20 | Backend engineering, Enterprise integrations, Deployment foundations, Cloud and production, Reliability, Security | Terraform, OpenTelemetry, GitHub Actions depth |
| 6. Enterprise AI solutions architecture | 21–24 | Advanced application architecture, Enterprise identity and security, Enterprise architecture, AI governance, Advanced RAG and agent design | Requirements, network fundamentals, disaster recovery, FinOps, TCO, ROI. **P5** |

**Stack gaps** (mentions in `lib/curriculum.ts`): Databricks 0, PySpark 0, LangSmith 0, OpenTelemetry 0, Terraform 0, Power BI 1, pandas 1. Langfuse appears 4 times and has to go, because the PRD names LangSmith as the one primary stack. AWS, GCP and rival vector stores or agent frameworks are correctly absent.

**One challenge to the PRD sequence.** FastAPI and REST sit in phase 5, yet P3 (phase 3) needs an access-controlled service and P4 (phase 4) needs tool calling and audit trails. Recommendation: teach the essentials in phase 3 and the production depth in phase 5. That keeps the PRD's order and avoids a knowledge gap.

**Time budget.** Primary videos total 86 hours and exercises 207, so 293 hours today, against 832 hours (8 h a week) to 1,040 (10 h) over 104 weeks. This excludes assessments, revision and projects. The new phase 2 and five projects fit, but Stage 1 must measure the total load rather than assume it.

## 5. Portfolio projects

LedgerSync is a reconciliation product with 10 milestones. Its content maps well: milestones 1–2 feed P1, 5 feeds P3, 6–7 and 4 feed P4, and 3, 8, 9, 10 feed P5. Nothing feeds P2, which is new. Recommendation: retire the name and move the milestones into P1–P5. Synthetic or anonymised data only (PRD §10).

## 6. YouTube resources

| Measure | Result |
|---|---|
| Verified videos | 95, from 52 channels, about 104 hours, all embeddable |
| Subtopic primaries | 195 video, 63 documentation |
| Unresolved video keys | 0 |
| Published before 2020 | 26 of 95. Sound for Python, a risk for fast-moving tools |
| Most-used channel | Corey Schafer, 23 |
| PRD channels in use | 6 of 15: Corey Schafer 23, freeCodeCamp 3, Dave Ebbelaar 2, ArjanCodes 2, Data With Baraa 1, LangChain 1 |
| PRD channels unused | Alex The Analyst, techTFQ, DataTalksClub, Databricks, Microsoft Developer, Guy in a Cube, DeepLearning.AI, Docker, Microsoft Azure |

These channel counts match on the channel name recorded in the data.

`scripts/verify-videos.mjs` already checks real watch pages, so no search-result URL can pass it. It checks that a video exists, **not that it teaches the right thing**, so PRD §5's relevance check needs a person or a review pass for each video. Anything not verified is labelled pending, never invented.

## 7. Data migration

| Table | Rows | Consequence |
|---|---|---|
| `subtopic_progress` | 0 | Nothing to preserve |
| `topic_flags`, `tasks`, `assessment_attempts`, `evidence` | 0 | Nothing to preserve |
| `settings` | 0 | No start date set |
| `listening_progress` | 3 | Meditation. **Must not be touched** |

The migration stays forward-only with a backup first (`npm run backup`), and existing ids are kept where a topic survives so any progress made before Stage 3 carries over. **Learning done before Stage 3 is still safe to record.**

## 8. UI changes and risks

**UI changes**
- 3D journey: six stations rather than seven. `STATION_AT`, `LANDMARK`, `BEACON_Y`, station landmarks and tests all assume seven. The landmark to remove is the owner's call in Stage 1.
- `lib/cinema.ts` keeps seven colours, because sections use them. The glass window shows six panes.
- Workspace re-ordered into A–G, dashboard extended, new Planner and Career Progress views.

**Risks**
| Risk | Mitigation |
|---|---|
| Good YouTube lessons may not exist for every new subject | Stage 2 reports the real gaps. Nothing is padded |
| Adding pandas, Databricks and Power BI raises load | Capacity check in Stage 1, using real durations |
| Five states replace four, and assessments reference the old ones | Change one rule module (`lib/progress.ts`), with tests first |
| 19 of 25 assessments are generated, not written | New topics need the same; written ones can follow per topic |
| PRD says "keep the NexEra design language", but the owner has just asked for the colourful look | Treated as superseded by the newer request (`DESIGN.md` §13) unless told otherwise |
| No git repository here, so no rollback | Initialise git before Stage 3, if the owner agrees |
| No auth; the app binds to 127.0.0.1 | Stays local. Auth is required before hosting |

## 9. Decisions needed before Stage 1

1. **Target:** URHA (recommended) or `Nex_Ra_2.0`?
2. **Git:** initialise a repository in `AI_Learning` before migrating? Recommended, as there is no rollback today.
3. **LedgerSync:** retire it into P1–P5 (recommended), or keep the name for P4 only?

## 10. Implementation plan

Follows PRD §15, each stage ending in tests and a check against §14.

| Stage | Work | Done when |
|---|---|---|
| 1 | Six-phase sequence, modules, prerequisites, load check, profile, career milestones | Reviewed sequence; total hours within 8–10 a week |
| 2 | YouTube research across all units, metadata, verification, relevance review | Every unit has a verified primary or a labelled pending state |
| 3 | Typed data, schema, forward migration, tests | Migration passes on a database copy; Meditation data unchanged |
| 4 | Workspace A–G, five-state mastery | No video can produce Demonstrated (tested) |
| 5 | Dashboard, planner, next lesson | Next lesson obeys prerequisites (tested); rescheduling cannot break them |
| 6 | P1–P5, architecture track | Each has requirements, architecture, milestones, acceptance criteria, deliverable |
| 7 | End-to-end journey, phone and desktop, migration validation | All 15 acceptance criteria evidenced |
