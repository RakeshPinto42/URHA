# URHA — Cinematic Direction (Stage 1 review)

## 1. Skill inspection and recommended usage

The table records what was actually found on disk on 2026-11-02.

| Skill | Status | Use in URHA | Why |
|---|---|---|---|
| **design-taste-frontend (Taste Skills)** | Installed, read | **Primary art direction**, its inspector and lint as the quality gate, its motion reference (`references/motion.md`: tokens, "opening window", "receding hero", "page to page" view transitions), and `assets.mjs` for credited open-collection imagery | Anti-generic house rules and measured checks |
| **ui-ux-pro-max** | Installed, read; `search.py` run | Accessibility, touch and player UX rules (`--domain ux`), pre-delivery checklist | Its `--design-system` output (landing-page pattern, pink accent) was rejected as a poor fit |
| **frontend-design** | Installed, read | Concept discipline: "spend boldness in one place", a single orchestrated moment, critique by screenshot | Keeps cinema from spreading to every block |
| **anti-ui-slop** | Installed, read | State coverage (loading, empty, error, permission) for the new audio and music players | Players have many failure states |
| **web-design-guidelines** (Vercel) | Installed, read | Final interface-guidelines review of changed files | Accessibility and forms compliance |
| **nexera-ui-motion** | Installed, read | 150–250 ms UI motion and reduced-motion rules | Same baseline as NexEra |
| **gsap-*** | Installed (reference) | Not used | GSAP is not a dependency, and framer-motion plus CSS scroll timelines cover everything needed |
| **Framer Motion** | **npm library, not a skill** (installed, v14.9) | Scene transitions, player and queue motion, progress and milestone fills | Already a dependency |
| awesome-design, web-design | **Empty folders** in `Nex_Ra_2.0/` | — | Nothing to read |
| ui-verse, vengeance-ui, animate-ui | **Not installed**. Described only in NexEra `UI-LIBRARIES-3D.md` as external component libraries | Their *ideas* (one 3D tilt, an animated hero) built with CSS and framer-motion. No new dependency. | Your rule: no unnecessary dependencies |
| speckit | **Not found anywhere** | Its structure (spec → plan → tasks → validate) followed by hand through this document and staged commits of work | — |

**Inaccuracy in NexEra.** `Nex_Ra_2.0/docs/engineering/SKILL_ROUTING.md` claims `ui-verse` and other skills are installed under `.opencode/skills/`. They are not.

## 2. Three visual concepts (reference imagery in `public/art/`, all public domain or CC, credited)

### Concept I — "Light in the Dark Room" (chiaroscuro) — **recommended**

Rembrandt's *Philosopher in Meditation* (1632) is the key: a dark room, one window of light, a spiral stair.

| Element | Treatment |
|---|---|
| Working rooms (Home, Path, Academy, Tasks, Projects, Skills) | Stay in **daylight**: travertine ground, the professional editorial system. |
| Light motif | Each section opens with **one chapter frontispiece**, a single artwork that tells its theme, shown once and framed like a plate in a book. |
| Meditation | **Night**: deep umber-black, candle-gold accent, painted scenes opening from a window of light ("opening window" scene). |
| Motion | The light opens: a picture opening from a lit window, a road whose milestones fill. |

**Scenes used**
- A, walking on water: Aivazovsky, 1888
- B, the Sermon on the Mount: Bloch, 1877
- C, the wilderness: Kramskoi, 1872
- D, Galilee at sunrise: a photograph, CC BY
- E, the candlelit study: Rembrandt, 1632, plus the Syriac manuscripts
- F, mountains towards light: Friedrich, *Morning in the Riesengebirge*, 1810–11

### Concept II — "The Codex"

Everything is an illuminated manuscript: two-column pages, red rubrics, Syriac initials, parchment grounds.
- **Strong:** the most unusual of the three, and it suits Scripture and the name URHA.
- **Weak:** parchment with red ink is the "cream and terracotta" generated-design tell the taste skill bans. Dense codex pages also make poor working screens.

### Concept III — "Galilee Dawn"

Full-bleed landscape photography with a colour field per phase (sea-blue → dawn gold), driven by scroll scenes.
- **Strong:** immersive.
- **Weak:** reads like a travel site, colour spreads across the screens, and Tasks and Academy lose focus.

## 3. Recommendation

**Concept I.** It keeps the serious working environment you asked for. It gives every section one meaningful image instead of decoration, and it puts the strongest atmosphere where you asked for it: Meditation.

One element is borrowed from Concept II: Scripture references in Meditation are set as small red rubrics, as manuscripts did.

## 4. Screen-by-screen

| Section | Name | Frontispiece | What changes |
|---|---|---|---|
| Home | The Journey | Friedrich, *Morning in the Riesengebirge* (the path towards light) | A cinematic opening band: painting full width, greeting over a dark scrim; the road below. "Receding hero" on scroll (CSS scroll timeline, static if reduced motion). |
| My Path | The Roadmap | Appian Way and the Peutinger map (kept) | Phases become **stations**. The current station is lit and the rest are dimmed to 60%. The Milestone Road gains a 3D tilt on hover (CSS `perspective`, the ui-verse idea). |
| Academy | The Study | Rembrandt, *Philosopher in Meditation* | Topic pages become a quieter reading desk: a narrow measure and the subtopic ladder. Each subtopic opens its **video, docs and exercise**. |
| My Tasks | The Discipline | Kramskoi, *Christ in the Wilderness* (a small plate only) | No cinema in the working area: practical and fast. |
| Projects | The Practice | Bloch, *Sermon on the Mount* (teaching put into practice) | Milestones shown as the "house on the rock" sequence. |
| Skills | The Mastery | None | An evidence-led matrix. Levels change only on evidence. |
| Meditation | The Quiet Room | Aivazovsky; Galilee; Van Gogh's *Good Samaritan* per collection | Night room; eight collections; **human narration**; music player persistent across Meditation; reflection layers. |

## 5. Meditation audio and music — options assessed

### Bible narration (human)

| Option | Narrator | Coverage | Rights (primary source) | Verdict |
|---|---|---|---|---|
| **eBible.org — Winfred W. Henson** | Professional voice artist, one consistent voice | Complete WEB, one MP3 per chapter | "You may download, copy, and listen to this recording … freely." (ebible.org/eng-web/audio/) | **Recommended default.** Streamed from eBible.org, not bundled. |
| eBible.org — Michael Paul Johnson (WEB editor) | Single voice | Matthew, John, Hebrews, epistles, Mark 1–7, Romans 1–5, Psalms 1–2 only | "They are not copyrighted." | Alternative voice where available |
| LibriVox WEB OT and NT (2008–09) | Volunteers, a different reader per section | Complete, but **multi-chapter files** | "all our recordings are public domain (definitely in the USA)" | Fallback. Uneven quality; offsets within files would be estimates. |
| Bible Brain API (Faith Comes By Hearing) | Professional and dramatized editions | Many translations | Needs an approved API key; primary licence text not found; reportedly non-commercial and free-to-end-user conditions | Possible later upgrade. **You must apply for the key and accept the terms.** |
| AI narration (e.g. a synthetic voice) | — | — | WEB is public domain, so it is legal | **Not chosen.** You asked for human narration. No voice cloning. |
| Browser text-to-speech | — | — | — | **Kept only as a labelled fallback.** It is never the default. |

**Partial passages** (e.g. James 1:5) play their chapter recording. The start is estimated from the text position and labelled "approximate". You can nudge it and save your own start point.

### Music

| Collection | Source with rights that hold for an app | Notes |
|---|---|---|
| Sacred Hymns | US military band recordings (US government works, public domain, 17 U.S.C. §105); pre-1926 recordings (US public domain under the Music Modernization Act); Sacred Harp 1922 | Compositions are also public domain (traditional or old hymns) |
| Instrumental Wisdom, Piano and Strings | Musopen and other public-domain or CC recordings on Wikimedia Commons (Bach, Handel, etc.) | Licence is checked per file |
| Stillness and Nature | CC0 or CC BY field recordings and ambient pieces (e.g. Kevin MacLeod, CC BY 3.0) | Attribution shown |
| Worship and Reflection, Peaceful Christian Music | **Contemporary worship is copyrighted.** No public-domain catalogue exists. | Options: (a) public-domain hymns that suit the mood; (b) official artist embeds (YouTube/Spotify players, which play on the provider under its terms) that **you** choose. CCLI streaming licences cover church service streams, not an app catalogue, so CCLI is **not** a route here. |

## 6. Curriculum and resource mapping gaps (current state)

| Gap | Current state |
|---|---|
| Video resources | Only **3 YouTube links**, and they are **channel pages**, not videos. 29 resources in total, all at **topic** level. |
| Subtopic mapping | No subtopic-level mapping, timestamps, per-subtopic exercises or "why this resource". |
| Unlinked courses | Ed Donner, the FastAPI course and the freeCodeCamp pytest video have no verified link. |
| pandas | Only referenced through a resource. "Selective pandas" is not a subtopic. |
| Verified candidates | NexEra `lib/career.ts` holds 46 previously verified videos, about 25 of them relevant. These are candidates, re-verified before use. |
| Meditation content | Collections 6–8 are missing. Reflections cover 5 of 37 passages. |

## 7. Implementation stages (after approval)

1. Tokens, motion system and frontispiece component; Home and Path.
2. Academy subtopic resources (data model + UI) and verification script.
3. Meditation visual room, 8 collections, reflections for every passage.
4. Human narration player and persistent music player.
5. YouTube curation across 7 phases, plus the coverage matrix.
6. Regression tests, inspector at 3 widths, screenshots.
