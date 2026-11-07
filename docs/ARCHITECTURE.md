# URHA — Architecture

Written for Release 1. The 3D journey and evidence-based mastery added since are specified in `JOURNEY.md`.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Where URHA lives | A standalone app in `D:\Project AI\AI_Learning` | Chosen by the user. The NexEra repo (`Nex_Ra_2.0`, now PINNOVA) had 216 uncommitted changes, and its `VISION.md` fixes four pillars. A standalone app protects that work. |
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind 3, framer-motion | Same family as NexEra, so URHA can be merged in later. |
| Next.js version | 16.4.3, not NexEra's 14.2 | Next 14 has unpatched critical advisories (`npm audit`, 2026-11-02). **NexEra 14.2.x is exposed to the same advisories.** |
| Persistence | SQLite via `better-sqlite3`, one file at `data/urha.db` | Chosen by the user. Real relations, constraints and transactions, with no server to run. Backup is one file. |
| Scripture | WEB and KJV, public domain, fetched once and bundled (`data/scripture/*.json`) | Exact text, works offline, no licensing risk. |
| Audio | The device's own speech synthesis, or a recording the user attaches and records a licence for | URHA does not scrape or redistribute recordings (PRD §15.1). |
| AI features | None in Release 1 | PRD §18: the core works without AI. |

## Layers

```
app/*/page.tsx          Server Components: read through lib/data.ts, render
app/actions.ts          Server Actions: validate (lib/validate.ts) → check references → write (lib/data.ts) → revalidate
lib/data.ts             Data access layer: the only module that runs SQL; scoped by user_id
lib/db.ts               Connection, forward-only migrations (PRAGMA user_version), one-time seed
lib/curriculum.ts       24-month roadmap seed (PRD §5). After the first run, the database copy is the editable source.
lib/progress.ts         Pure rules: studied → practised → demonstrated, topic status, current phase, road
lib/taskLogic.ts        Pure rules: categories, statuses, recurrence, weekly totals
lib/scripture.ts, quotes.ts, reflections.ts   Meditation content with typed attribution
components/             UI; forms/ and meditation/ are client components
```

## Data model

Every user-owned table carries `user_id`. Release 1 has one local user (id 1). Adding users later is a data change, not a schema rewrite.

**Curriculum**
- `phases` → `topics` (with `topic_prereqs` and `topic_skills`) → `subtopics` (each scheduled into a roadmap month)
- `skills`, `milestones` (LedgerSync v2), `resources` (each resource records its link-check state)

**Progress**
- `subtopic_progress` records `exposed_at`, `practised_at`, `demonstrated_at` and `evidence`.
- CHECK constraints: practised requires exposed, and demonstrated requires practised plus non-empty evidence.
- `topic_flags` holds the "needs revision" flag and topic notes.

**Tasks**
- One `tasks` table. CHECK constraints cover category, status, priority and minutes.
- Recurring tasks share a `series_id`. Completing one creates the next occurrence once (idempotent).

**Meditation**
- `listening_progress`, `bookmarks`, `passage_reflections`, `audio_sources`

## Security

- **Local only.** `npm run dev` and `npm start` bind to `127.0.0.1:3100`, and there is no login. **Before hosting URHA anywhere, add authentication:**
  - check the session in every action in `app/actions.ts`;
  - protect `/api/backup`;
  - derive `user_id` from the session in `lib/data.ts`.
- Next's built-in Origin/Host check guards Server Actions against cross-site posts.
- **Validation at the boundary.**
  - All form input is parsed in `lib/validate.ts`: lengths, enums, real dates and integer minutes.
  - URLs must be `http(s)` with no credentials. Attached audio must be `https`.
  - Referenced ids are re-checked against the database. SQL is parameterised throughout.
- **Headers.** The CSP and other security headers are in `next.config.mjs`:
  - no third-party scripts, and fonts are self-hosted by `next/font`;
  - `media-src https:` exists only for audio the user attaches;
  - `frame-ancestors 'none'`.
- **Errors.** Server errors are logged on the server. The UI gets a safe message and never sees stack traces or SQL.

## Backup and recovery

- **Settings → Download a backup** (`/api/backup`) and `npm run backup` both use SQLite's online backup API. They are safe while URHA is running.
- **To restore:** stop URHA, then replace `data/urha.db` with the backup.
- `data/*.db` is gitignored. Progress is never committed.

## Merging into NexEra later

1. Move `app/*` under an `app/urha/` route group, and `lib/*` under `lib/urha/`.
2. Resolve the stack gap first: NexEra should move to Next 15/16 (React 19) because of the advisories above.
3. Decide whether URHA's Academy replaces NexEra's Academy (`lib/career.ts`). Its `nexera2.career.*` progress in `localStorage` would need migrating; never rename or drop those keys.
4. Use NexEra's operator session (`lib/auth.ts`) as URHA's authentication.
