# URHA: the journey in 3D, the roadmap and evidence-based mastery

Stage 1 of the brief "Cinematic 3D Experience, Interactive Roadmap and Evidence-Based Mastery" (2026-11-02). This document is the authority for the 3D scene, how the roadmap is navigated and how assessment works. Tokens, type and layout stay in `DESIGN.md`.

## 1. Audit: what was actually there

> Written for the seven-phase path. The curriculum is now the six phases of `PRD.md`; `lib/curriculum.ts` is the source, and `CURRICULUM_SEQUENCE.md` describes it.

The audit read the code and the database, not the earlier documents.

| Area | Found | Consequence |
|---|---|---|
| Stack | Next 16.4, React 19.3, framer-motion 14.9, better-sqlite3, Tailwind 3. **No 3D library.** | Any 3D work needs a new dependency, so it has to be justified (§3). |
| Hardware | GTX 1650 + Radeon iGPU, Ryzen 5 5600H, 20 GB RAM | WebGL2 is fine. The scene is budgeted for the iGPU and for ordinary phones, not for the 1650. |
| Curriculum | 7 phases, 25 topics, 258 subtopics, 12 skills, 10 LedgerSync milestones | Kept. Nothing in the curriculum changes. |
| Resources | `lib/learning-map.ts`: each of the 258 subtopics has a primary resource (195 video, 63 docs), an optional supplement (142), an exercise and its minutes. The videos were verified against YouTube metadata (`data/videos-verified.json`). | Stage 3 adds what was missing: a **learning outcome** per subtopic and a **suitability flag**. It does not re-curate. |
| Progress model | Three steps per subtopic: exposed → practised → demonstrated (demonstrated took free-text evidence) | It changes to the four-state model (§5). "Demonstrated" may no longer be self-declared. |
| User data | 0 progress rows, 0 tasks, no start date. Meditation listening history exists. | The migration is low risk. It is still forward-only and preserves data. |
| Home | A Friedrich painting as a static band, then a dashboard of cards | Replaced by the 3D journey (§4). |
| My Path | Phases as stacked bars and lists | Replaced by the three-level roadmap (§4). |
| Skills, Projects, Assessments | Placeholder "Release 2" screens | Built for real (§5–6). |

## 2. The installed skills and how they are used

| Skill | Found | Use |
|---|---|---|
| design-taste-frontend | Installed (`~/.claude/skills`), with references for app screens and motion | House rules for the working screens. It has **no 3D guidance**, so the scene follows its motion reference: one orchestrated moment, transform and opacity only. |
| ui-ux-pro-max | Installed | Accessibility, touch targets and keyboard checks |
| frontend-design | Installed | "Spend boldness in one place": the 3D goes on Home and Path only |
| anti-ui-slop | Installed | State coverage for assessment flows (empty, submitted, awaiting review, passed, failed, retake) |
| web-design-guidelines | Installed | Final review of the changed screens |
| nexera-ui-motion | Installed | 150–250 ms UI motion and the reduced-motion rule |
| gsap-* | Installed | Used since 2026-11-07 for the section wipe and the glass window (`DESIGN.md` §13). The 3D scene stays on its own render loop. |
| awesome-design, web-design | Empty folders in `Nex_Ra_2.0` | Nothing to read |
| UI Verse, Vengeance UI, Animate UI | **Not installed anywhere** | Not used. Their ideas (tilt, animated CTA) are not needed once the scene exists. |
| React Three Fiber / Drei skills | **Not installed** | The official three.js and R3F documentation is used instead. |

## 3. 3D dependency decision

> **Superseded on 2026-11-07.** The journey now runs on the cinema engine, on raw three.js, with shadows, post-processing and quality tiers. React Three Fiber was removed. See `CINEMATIC_ENGINE_AUDIT.md` §10. The reasoning below is kept as history.

**Added:**
- `three@0.186.1` (published 2026-09-24)
- `@react-three/fiber@9.8.2` (published 2026-10-14; its peer range `react >=19 <19.4` fits React 19.3.1)

**Why R3F rather than raw three:** the scene is React state (phases, progress, selection), and R3F keeps it declarative with one render loop, including disposal on unmount.

**Not added: `@react-three/drei`.** It brings in about 20 packages (hls.js, MediaPipe, camera-controls, troika and others). URHA needs none of its helpers: the camera is scripted and labels are HTML.

**Cost control**
- The scene is loaded with `next/dynamic({ ssr: false })` on Home and Path only. No other route downloads three.js.
- The device pixel ratio is clamped to 1–1.5.
- There are no shadow maps, no post-processing and no textures to download. Everything is procedural geometry, vertex colours and two small shaders (sky and water).
- Fog hides the far plane.
- The render loop pauses when the canvas is off-screen or the tab is hidden.

## 4. Three concepts

### Concept A: "The Way to the Summit" (recommended)

A low-poly landscape at dawn, built in real 3D: a valley with a still lake (Galilee), and foothills rising to a ridge of mountains with light behind them (Friedrich's *Morning in the Riesengebirge*, `public/art/riesengebirge-morning-friedrich.jpg`, is the reference for palette and composition). One winding stone path runs from the lake shore up to the summit. Seven **stations** stand along it, one per phase. Each has its own form, so the phase is recognisable without reading:

| Phase | Station | Form |
|---|---|---|
| 1. Programming, SQL and databases | The Well | A low ring of stones: the source |
| 2. Data engineering and finance analytics | The Bridge | An arch across a stream: connection |
| 3. Applied AI and RAG | The Library | A tower with a lit window: knowledge |
| 4. AI agents and evaluation | The Crossroads | Two path forks and a waymarker: decisions |
| 5. Software engineering, integration and cloud | The Watchtower | Tall and narrow, with a beacon: vigilance |
| 6. Enterprise AI solutions architecture | The Summit | A cairn on the peak in the sunrise: ownership |

**Atmosphere and progress**
- Drifting mist sheets sit between the depth layers.
- Dust motes catch the light.
- The water surface moves slowly.
- Clouds drift past the peaks.
- The path carries each phase's colour. It burns bright where you have walked it (practised) and is plainer where you have not. Your marker is a small flame.
- Passed and current stations stand in a tall column of their colour; stations ahead have a faint one. Colours and sequence: `DESIGN.md` §13.

**References:** Friedrich, *Morning in the Riesengebirge* (palette, layered ridges); Kramskoi, *Christ in the Wilderness* (the stony foreground); the Galilee sunrise photograph (the water).

### Concept B: "The Lantern Archipelago"

Night on the sea (Aivazovsky, *Walking on Water*): seven islands joined by a path of light across moving water. The camera glides like a boat.
- **Strong:** the most atmospheric of the three.
- **Weak:**
  - Night on every working screen fights the daylight system and reading contrast.
  - Large animated water is the most expensive surface to render on an iGPU or phone.
  - It duplicates Meditation's night room, which should stay unique.

### Concept C: "The Codex Dioramas"

A 3D book. Each phase is a page that unfolds into a pop-up diorama, and you turn pages to travel.
- **Strong:** unusual, and tied to manuscripts.
- **Weak:**
  - Page-turning hides the whole-journey view you asked for.
  - Text on curved paper is hard to read.
  - It reads as a novelty after the second visit.

### Recommendation

**Concept A.**
- It is the only one where the whole 24-month journey is visible at once: the overview shot shows all six stations.
- Progress has a physical meaning: a walked path and lit beacons.
- It stays in daylight, so the working screens keep their contrast, and Meditation keeps the only night room.

## 5. Interaction model and the three roadmap levels

The 3D scene is a **view**. The HTML beside it is the **control**: every action reachable in 3D is also a real button, link or list item. The canvas is `aria-hidden`, and screen readers and the keyboard use the station list.

| Level | Where | Camera | HTML |
|---|---|---|---|
| **1. Journey** | Home and `/path` | **Home:** behind your flame, looking up the path to the next station. **Path:** a high overview of all seven stations. | Home: greeting, today's position (month, phase, topic), next destination, Continue. Path: a station rail (7 items, months, progress, state). |
| **2. Phase** | `/path?phase=p3` | Flies (1.6 s, eased) to the station | Phase sheet: months, summary, competencies (skills), topics with their subtopic counts and months, the LedgerSync milestone, the exit gate, the **assessments required** and their status |
| **3. Topic** | `/academy/[topicId]` | — (normal page) | Objective; subtopics with primary and supplement resources, timestamps, exercise, minutes and outcome; notes; the topic's **assessment** and its requirements |

**Rules**
- Selection lives in the URL (`?phase=`), so Back and deep links work.
- Hovering a station or focusing it in the rail highlights it in both places.
- Clicking a station equals choosing it in the rail.
- Escape returns to the overview.
- On phones the scene is a 46vh band above the rail, and the sheet opens below it rather than over it.
- **Reduced motion:** the camera cuts instead of flying, and the mist, water, dust and clouds are still frames.
- **No WebGL** (or context loss): the 2D Milestone Road and the same rail and sheets render. Nothing is lost except the picture.

## 6. Mastery architecture

### States

| State | Meaning | How it is reached | Where it is recorded |
|---|---|---|---|
| **Learning** | Conceptual exposure | Mark a subtopic *Studied* | `subtopic_progress.exposed_at` |
| **Practising** | The guided exercise is done | Mark it *Practised* | `practised_at` |
| **Proficient** | An unfamiliar problem solved independently | Mark it *Proficient* **with evidence** (link, commit, test output) | `proficient_at` + `evidence`. This was the old `demonstrated_at`, renamed by migration v3, so any existing rows keep their evidence. |
| **Demonstrated** | Capability proven | **Only** by a passed assessment: the attempt meets the pass threshold, every *required* item passes, and every human-review item is reviewed | `assessment_attempts.passed`; evidence rows link to the attempt |

**Rules**
- A lesson or exercise never produces Demonstrated.
- AI-generated text never scores anything: auto-scoring is deterministic (exact choices, or SQL results compared row for row), and everything else is reviewed against a written rubric.

**Aggregation**
- **Topic:** Demonstrated when its assessment is passed. Otherwise it holds the lowest state that all its subtopics share, shown with counts.
- **Skill:** linked to topics through `topic_skills`. Its state is the lowest state across its *linked topics in phases up to the current one, plus any linked topic already started ahead of schedule*, and every count is shown beside it. A skill's evidence is the union of its topics' evidence and assessment history.

### Assessment framework

Definitions are **versioned content in code** (`lib/assessments/*.ts`). Attempts and evidence are user data in SQLite.

**Coverage.** Every topic has exactly one assessment, so every topic can reach Demonstrated. Six are written question by question (Python, software engineering, SQL, backend, RAG, LangGraph). The other 19 are generated by `lib/assessments/practical.ts` from the topic's own practical assignment with one shared rubric, and are always human-reviewed. A written assessment replaces a practical one by being added to `WRITTEN` in `lib/assessments/index.ts`.

```
Assessment { id, version, topicId, skillIds[], title, objectives[], difficulty: foundation|intermediate|advanced,
             passPercent, minutes, revision: subtopicId[] , items: Item[] }
Item (discriminated by type) { id, type, prompt, points, required?, revision: subtopicId[] ,
  mcq:           options[], correct[]                  → auto, exact
  sql:           schema+seed (fixture), expected query → auto, result set compared (order-sensitive if asked)
  debug:         code with a defect, options or lines  → auto when single-answer, else rubric
  concept | scenario | architecture | code | project: rubric[{criterion, points, descriptor}], evidenceRequired? → human review }
```

**Tables (migration v3)**

| Table | Holds |
|---|---|
| `assessment_attempts` | id, user, assessment_id, version, started_at, submitted_at, status (`in_progress`, `awaiting_review`, `passed`, `failed`), auto_points, review_points, max_points, percent |
| `attempt_answers` | attempt, item, response, points, auto (0/1), feedback, reviewer, reviewed_at |
| `evidence` | user, kind (`submission`, `test_result`, `score`, `project`, `review`, `file_ref`), title, url, body, topic, skill, milestone, attempt, demonstrated_on |

**Running an attempt**
- **SQL items** run in a separate short-lived process (`scripts/sql-sandbox.mjs`) against an in-memory copy of the fixture, because better-sqlite3 cannot interrupt a statement in-process. They are read-only (`stmt.readonly`), limited to 4 kB, and killed after 3 s. "Run query" shows what a query returns, never whether it is right.
- **Drafts:** answers are mirrored to the browser's local storage, so a reload or a failed submit loses nothing.
- **Feedback per item:** what was wrong, the expected answer for auto items, and the subtopics to revise, which link to the Academy.

**Resources.** Each subtopic's outcome lives in `lib/learning-outcomes.ts`. A resource's caution is derived from verified metadata, not asserted by hand: a video published before 2019 (Phase 1) or before 2023 (later phases) is flagged to check against current documentation.

**Review and retakes**
- **Review:** every human-review item (code, project, architecture, open concept) needs a reviewer name (yourself or a mentor) and points per rubric criterion. The attempt shows "awaiting review" until then and is honestly labelled self-reviewed when it is.
- **Retake:** allowed at any time. History keeps every attempt, and the best passed attempt counts.

### How the modules connect

```
My Path ──defines──▶ topics/subtopics ──taught by──▶ Academy (resources, exercises, outcome)
   │                                                     │
   │                                         "Plan this" │ creates
   ▼                                                     ▼
 Home ◀── reflects ── progress, assessments ◀── My Tasks (learn/practise/build/assess tasks linked to topic)
                         │
             Assessments ─┴─ pass ─▶ Skills (Demonstrated) ◀─ evidence ─ Projects (LedgerSync milestones)
```
