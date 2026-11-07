# URHA ܐܘܪܚܐ — The Path to Mastery

*Seek. Learn. Build. Become.* A personal learning, mastery and reflection system (NexEra 2.0 module, standalone build).

## Run

```bash
npm install
npm run dev            # http://127.0.0.1:3100  (local only, no login)
# or
npm run build && npm start
```

On first run the database (`data/urha.db`) is created and the 24-month curriculum is seeded. Open **Home** and set the date your path begins.

## Scripts

| Command | What it does |
|---|---|
| `npm test` | Unit and data-layer tests (Vitest, in-memory database) |
| `npm run typecheck` | TypeScript |
| `npm run backup` | Consistent database copy to `data/backups/` |
| `npm run links:check` | Records whether each resource link resolves (a resolved link is not the same as checked content) |
| `npm run scripture:fetch` | Re-downloads the public-domain WEB/KJV text (already bundled) |

## What is built

- **Home**: the 3D journey, with your position, next destination and today's work
- **My Path**: all 7 phases as stations in the 3D scene, with a phase sheet for each (the 2D Milestone Road is the fallback without WebGL)
- **Academy**: topic workspaces with a learning outcome, resources, an exercise and minutes for every subtopic, and the topic's assessment
- **My Tasks**: today, week, all and completed views; filters; recurrence; blocked and deferred states; completion history; planned against actual time
- **Assessments**: one for every topic. Choice and SQL questions are checked deterministically, and written and practical work is reviewed against a rubric by a named reviewer. No AI scores anything.
- **Skills**: four mastery states (Learning, Practising, Proficient, Demonstrated) with evidence and assessment history. Demonstrated comes only from a passed assessment.
- **Projects**: the LedgerSync milestones, with evidence recorded against each
- **Quiet Room**: five curated collections, WEB/KJV text, a device-voice and attached-recording player, resume position, bookmarks, labelled reflections and a private journal
- **Settings** and backup; credits

**Release 2 (shown honestly as not yet built):** Journal and Insights.

Journey, roadmap and mastery: [docs/JOURNEY.md](docs/JOURNEY.md). Design: [docs/DESIGN.md](docs/DESIGN.md). Architecture and security: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
