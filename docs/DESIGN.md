# URHA — Design System (Release 1)

> Decided before code, per PRD §3. Sources: `design-taste-frontend` (app sheet `editorial-greeting`, seed 1387262354, saved in `.taste-skill/direction.json`), `ui-ux-pro-max` (accessibility and pre-delivery checklist only; its pattern "Hero + Features + CTA" and pink accent were rejected as landing-page defaults), `nexera-ui-motion` (states, 150–250 ms motion, reduced motion), `anti-ui-slop` (state coverage).

## 1. Idea

**URHA (ܐܘܪܚܐ) means "the way".** The visual idea comes from a real road: the Via Appia and its Roman milestones (*miliaria*).

> On URHA, **the Roman road and its milestones** become **the progress line**: 24 monthly markers in 7 phases, with you standing at today's marker.

- **Signature element — the Milestone Road.** A horizontal road of 24 markers grouped into 7 phases. Each marker shows its month and fills as the subtopics planned for it reach *Practised*. Today's month is a single teal marker with its date in ink. It appears on Home (compact) and on My Path (full, interactive).
- **Face (from the sheet's options).** A surface taken from the product's world: Roman travertine. The stone ground `#f2f2ee` replaces `#f9f9f9`, and the page stays white.
- **Imagery.** Real, credited pictures of that world: the Appian Way, the Peutinger road map and Syriac manuscripts. Credits are listed on `/credits` and in `public/images/credits.json`. Robots, circuits and orbs are never used. Gradients are used for light only (§13).

## 2. Moodboard

| Picture | Role | Licence |
|---|---|---|
| Appian Way near Casal Rotondo (`appian-way.jpg`) | Home: the road ahead | CC BY-SA 4.0 |
| Tabula Peutingeriana, Lazio section (`peutinger-lazio.png`) | My Path: the itinerary | CC BY-SA 3.0 |
| End of the Via Appia, Brindisi, at night (`appia-brindisi-night.jpg`) | My Path: Phase 7, the destination | CC BY-SA 4.0 |
| Syriac liturgy leaf, 11th c. (`syriac-liturgy-11c.jpg`) | Meditation: the Quiet Room | Public domain |
| Barhebraeus Syriac MS (`syriac-barhebraeus.jpg`) | Academy: the study | Public domain |

## 3. Tokens

Two rooms share one type system: **Daylight** (all working screens) and **Night** (Meditation only).

```css
/* Daylight */
--ground:#ffffff; --surface:#f2f2ee /* travertine */; --raised:#ffffff;
--border:#e6e6e1; --rule:#efefeb; --control:#d4d4ce;
--text:#1f201d; --muted:#5d5d59 /* 6.4:1 on white */; --accent:#1b6e66 /* teal: data + one action */;
--positive:#2e7d32; --negative:#b42318; --warning:#92400e;
/* Night (Meditation) */
--ground:#0e0e0d; --surface:#171715; --raised:#1f1f1c; --border:#2a2a27;
--text:#ecebe6; --muted:#b0afa8; --faint:#93928b; --accent:#5fb3a8;
```

- **Radius:** cards 22px, controls 999px (pill), chips 999px, images 4px. One soft system.
- **Spacing:** 4px base. One gap of 16px. Card padding 20px. Gutter 24px desktop, 16px phone.
- **Edges:** a 1px border *or* a tone step, never both, and no shadows at rest. Only menus and the mini-player float.

## 4. Typography

| Role | Face | Size / weight |
|---|---|---|
| Greeting h1 (Home), scripture | Instrument Serif | 48/400 desktop, 30 phone; scripture 26/1.5 |
| Screen h1 | Instrument Sans | 24/600 |
| Section | Instrument Sans | 14/600 |
| Figure | Instrument Sans | 32/400 tabular |
| Body | Instrument Sans | 14–16/400 (reading 17/1.6) |
| Small | Instrument Sans | 12/400, never under 11 |
| Wordmark | Noto Sans Syriac | ܐܘܪܚܐ only |

Sentence case. No tracked capitals, no eyebrows, no index numbers. Phases are named, not numbered "01". "Phase 3" is used in text because it is data.

## 5. Colour rules

- Each section is a room with its own colour (§13). That colour replaces the former teal: it goes on the primary action, focus rings, links, tinted panels and data fills.
- Each phase owns a pane of glass, and the same hue marks that phase wherever it appears: road, roadmap, 3D path, beacon and window.
- Status always carries a text label: not started, ready, in progress, completed, needs revision, mastered. Each has its own **mark shape** as well as its tone, so state never relies on colour alone:

| Status | Mark |
|---|---|
| Not started | Hollow ring |
| Ready | Ring with a dot |
| In progress | Half-filled |
| Completed | Filled ink |
| Needs revision | Filled amber with a notch |
| Mastered | Filled teal with an inner ring |

## 6. Layout rules

- **Shell — open plane.** A 232px labelled sidebar on the white ground with a 1px rule. The Syriac wordmark and "URHA" sit at the top. Nav rows are 34px with a grey active pill. Settings, credits and backup sit at the bottom. No top bar.
- **Canvas.** Centred 1100px column on 12 columns (77px columns, 16px gutters: 12×77 + 11×16 = 1100). Rows use spans that share column lines (8+4, 6+6, 4+4+4).
- **Phone (< 900px).** The sidebar folds into a 48px top bar (screen name and menu button) that opens a full-screen sheet. 16px margins and 44px touch targets. Tables become two-line lists.

## 7. Navigation

Ten primary destinations, per PRD §4.

- **Built:** Home, My Path, Academy, My Tasks, Skills, Projects, Assessments, Meditation. The 3D scene, roadmap and mastery rules are specified in `JOURNEY.md`.
- **Release 2:** Journal, Insights. Their routes exist and show an honest "arrives in Release 2" state. There are no fake controls.
- **Utilities:** Settings, Backup and Credits sit at the foot of the sidebar.

## 8. Screens — each screen's one question

| Screen | Question | Biggest block | Main job (one click) |
|---|---|---|---|
| Home | "Where am I on the path, and what do I do now?" | Greeting + Milestone Road | Continue the journey (current topic) |
| My Path | "What is the whole journey and where am I in it?" | Phase list with the current phase open | Open a topic |
| Academy topic | "What do I learn here, and what proves I learnt it?" | Subtopic ladder: exposed → practised → demonstrated | Mark a step, with evidence for "demonstrated" |
| My Tasks | "What do I do today and this week?" | Today list | Add a task / complete a task |
| Meditation | "What shall I listen to and reflect on?" | The passage text | Play |

## 9. Components

Shell, NavItem, ScreenTitle, Panel, Figure, StatusMark, MilestoneRoad, PhaseRow, SubtopicLadder, ResourceRow (with verified/unverified tag), TaskRow, TaskForm, Segmented, Button (primary/secondary/text), Field, EmptyState, ErrorState, QuoteBlock (with typed attribution), PassageReader, Player, ReflectionForm.

## 10. Motion (Framer Motion)

| Move | Where | Spec |
|---|---|---|
| Route change | All screens | Opacity 0→1 and y 8→0, 220 ms, ease `[0.2,0.8,0.2,1]` |
| Milestone fill | Road | Scale-x of the fill 0→ratio, 600 ms, once |
| Step completion | Ladder | The mark morphs to its new shape, 180 ms |
| Into the Quiet Room | Meditation | The ground crossfades white→night over 700 ms; the text rises 12px |
| Player | Meditation | The active verse is highlighted with a 200 ms opacity change; the view scrolls into place |

Transform and opacity only. Under `prefers-reduced-motion: reduce`, every move becomes an instant state change. Content is never hidden waiting for an animation.

## 11. States

Every data block has empty, loading, error and real-zero states.

- **Errors** appear inside the block: what failed, plus a retry.
- **Zero** prints as 0.
- **Missing values** print as a grey dash.
- **First run** (no start date): Home keeps its frame and asks for the start date where the road would be.

## 13. Light through glass (2026-11-07)

**The brief:** "animated but colorful cinematic", used wherever possible in the UI. This replaces the restrained Concept I look. Where it conflicts with an older rule here or in `CINEMATIC_DIRECTION.md`, this section wins: colour is no longer limited to state, gradients are allowed for light, and cinema is no longer confined to Home and Path.

**The idea.** Dawn passing through stained glass. Seven panes, one per phase, in `lib/cinema.ts`, the single source for the CSS, the shaders and the 3D world.

| Surface | What happens |
|---|---|
| Home | A 7-second title sequence, night to sunrise, as the camera comes down to the walker. Once per visit, with "Replay the sunrise". The words are readable from the first frame. |
| 3D world | Saturated land, ridges and water; sun rays and lit cloud; the path as a river of phase colour; a column of light on each station; fireflies and a flock of birds. |
| Paintings | `LivingPicture`: a raw WebGL shader over the real image, grading it in the room's colours with flowing surface, light shafts and embers. No three.js on these routes. |
| Page openings | `FrontispieceBand`: letterbox opens, title words rise (CSS, so they end visible without script). |
| Between sections | `GlassWipe` (GSAP): seven panes lift off the new page in about 0.7 s. It never takes input and runs only when the section changes. |
| Rooms | The shell sets `--section`; panels, controls and focus rings take it up. |
| Progress | `GlassWindow` (GSAP ScrollTrigger): seven lancets filled to the practised share. An unfilled pane stays unfilled: the colour is the data. |

**Guard rails**
- Ink colours are tested at 4.5:1 on white and on the tinted surface (`test/cinema.test.ts`).
- "Pause animation" lives in the shell and the Night Room (WCAG 2.2.2). With it, or with reduced motion, the colour stays and nothing moves.
- No WebGL, a shader failure or a lost context leaves the real painting in place, with a console warning.
- Living pictures stop off-screen and in hidden tabs, run at about 30 fps and at most 1280 px wide.
- Text over a moving picture always has a neutral scrim beneath it.

**GSAP** (`gsap`, `@gsap/react`) was added for this work, replacing the earlier "not used" decision in `JOURNEY.md` §2.
