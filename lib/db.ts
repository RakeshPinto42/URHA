/**
 * SQLite persistence (decision recorded in docs/ARCHITECTURE.md).
 *
 * - One file, `data/urha.db` (override with URHA_DB_PATH; ":memory:" in tests).
 * - Forward-only migrations tracked by PRAGMA user_version.
 * - Curriculum is seeded once, when the phases table is empty. Later code
 *   changes to lib/curriculum.ts never overwrite the user's edited copy.
 * - Every user-owned row carries user_id so multi-user support is a data change,
 *   not a schema rewrite. Release 1 has one local user (id 1).
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { PHASES, slug } from "./curriculum";
import { applyCurriculum, migrateToSixPhases } from "./curriculum-migration";
import { RESOURCES } from "./resources";

export type DB = Database.Database;
export const LOCAL_USER_ID = 1;

type Migration = string | ((db: DB) => void);

const MIGRATIONS: Migration[] = [
  // v1 — Release 1 schema
  `
  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE settings (user_id INTEGER NOT NULL REFERENCES users(id), key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (user_id, key));

  CREATE TABLE skills (id TEXT PRIMARY KEY, name TEXT NOT NULL, target INTEGER NOT NULL CHECK (target BETWEEN 0 AND 4));
  CREATE TABLE phases (id TEXT PRIMARY KEY, ord INTEGER NOT NULL UNIQUE, title TEXT NOT NULL, month_start INTEGER NOT NULL, month_end INTEGER NOT NULL,
    summary TEXT NOT NULL, deliverable TEXT NOT NULL, exit_gate TEXT NOT NULL, CHECK (month_start <= month_end));
  CREATE TABLE milestones (id TEXT PRIMARY KEY, ord INTEGER NOT NULL, title TEXT NOT NULL, phase_id TEXT NOT NULL REFERENCES phases(id),
    business_problem TEXT NOT NULL, technical_objective TEXT NOT NULL, completion_criteria TEXT NOT NULL);
  CREATE TABLE topics (id TEXT PRIMARY KEY, phase_id TEXT NOT NULL REFERENCES phases(id), ord INTEGER NOT NULL, title TEXT NOT NULL,
    objective TEXT NOT NULL, summary TEXT NOT NULL, assignment TEXT NOT NULL, milestone_id TEXT REFERENCES milestones(id));
  CREATE TABLE topic_prereqs (topic_id TEXT NOT NULL REFERENCES topics(id), prereq_id TEXT NOT NULL REFERENCES topics(id), PRIMARY KEY (topic_id, prereq_id));
  CREATE TABLE topic_skills (topic_id TEXT NOT NULL REFERENCES topics(id), skill_id TEXT NOT NULL REFERENCES skills(id), PRIMARY KEY (topic_id, skill_id));
  CREATE TABLE subtopics (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id), ord INTEGER NOT NULL, title TEXT NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 24));
  CREATE INDEX subtopics_topic ON subtopics(topic_id, ord);

  CREATE TABLE resources (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id), kind TEXT NOT NULL, title TEXT NOT NULL, author TEXT NOT NULL,
    url TEXT, sections TEXT NOT NULL DEFAULT '', hours REAL, is_primary INTEGER NOT NULL DEFAULT 0,
    link_status TEXT NOT NULL DEFAULT 'unchecked' CHECK (link_status IN ('unchecked','resolves','failed')),
    link_http INTEGER, link_checked_at TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')));

  CREATE TABLE subtopic_progress (user_id INTEGER NOT NULL REFERENCES users(id), subtopic_id TEXT NOT NULL REFERENCES subtopics(id),
    exposed_at TEXT, practised_at TEXT, demonstrated_at TEXT, evidence TEXT, updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, subtopic_id),
    CHECK (demonstrated_at IS NULL OR (practised_at IS NOT NULL AND evidence IS NOT NULL AND length(trim(evidence)) > 0)),
    CHECK (practised_at IS NULL OR exposed_at IS NOT NULL));
  CREATE TABLE topic_flags (user_id INTEGER NOT NULL REFERENCES users(id), topic_id TEXT NOT NULL REFERENCES topics(id),
    needs_revision INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, topic_id));

  CREATE TABLE tasks (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('learn','practise','build','test','debug','review','document','assess')),
    phase_id TEXT REFERENCES phases(id), topic_id TEXT REFERENCES topics(id), skill_id TEXT REFERENCES skills(id), resource_id TEXT REFERENCES resources(id),
    priority INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1,2,3)),
    est_minutes INTEGER CHECK (est_minutes IS NULL OR est_minutes BETWEEN 0 AND 1440),
    actual_minutes INTEGER CHECK (actual_minutes IS NULL OR actual_minutes BETWEEN 0 AND 1440),
    due_date TEXT, status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','deferred','done')),
    blocked_reason TEXT NOT NULL DEFAULT '', deliverable TEXT NOT NULL DEFAULT '', completion_notes TEXT NOT NULL DEFAULT '',
    recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekdays','weekly')),
    series_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), completed_on TEXT);
  CREATE INDEX tasks_user_due ON tasks(user_id, status, due_date);
  CREATE INDEX tasks_user_completed ON tasks(user_id, completed_on);

  CREATE TABLE listening_progress (user_id INTEGER NOT NULL REFERENCES users(id), passage_id TEXT NOT NULL, translation TEXT NOT NULL,
    verse_index INTEGER NOT NULL DEFAULT 0, finished INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, passage_id));
  CREATE TABLE bookmarks (user_id INTEGER NOT NULL REFERENCES users(id), passage_id TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, passage_id));
  CREATE TABLE passage_reflections (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), passage_id TEXT NOT NULL,
    stood_out TEXT NOT NULL DEFAULT '', understood TEXT NOT NULL DEFAULT '', questioned TEXT NOT NULL DEFAULT '',
    apply TEXT NOT NULL DEFAULT '', revisit TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE INDEX passage_reflections_user ON passage_reflections(user_id, passage_id, created_at);
  CREATE TABLE audio_sources (user_id INTEGER NOT NULL REFERENCES users(id), passage_id TEXT NOT NULL, url TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '', licence TEXT NOT NULL DEFAULT '', PRIMARY KEY (user_id, passage_id));
  `,
  // v2 — Meditation upgrade: personal reflection field, collection notes, user-calibrated narration start points
  `
  ALTER TABLE passage_reflections ADD COLUMN personal TEXT NOT NULL DEFAULT '';
  CREATE TABLE collection_notes (user_id INTEGER NOT NULL REFERENCES users(id), collection_id TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, collection_id));
  CREATE TABLE narration_offsets (user_id INTEGER NOT NULL REFERENCES users(id), passage_id TEXT NOT NULL,
    start_sec REAL NOT NULL CHECK (start_sec >= 0), updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, passage_id));
  ALTER TABLE listening_progress ADD COLUMN position_sec REAL;
  CREATE TABLE scripture_cache (translation TEXT NOT NULL, book TEXT NOT NULL, chapter INTEGER NOT NULL, body TEXT NOT NULL,
    source TEXT NOT NULL, fetched_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (translation, book, chapter));
  `,
  // v3 — Evidence-based mastery (docs/JOURNEY.md §6).
  // The old subtopic "demonstrated" step was self-declared with evidence: that is what
  // Proficient now means, so the column is renamed (rows and their evidence are kept;
  // SQLite rewrites the CHECK constraint). Demonstrated comes only from passed assessments.
  `
  ALTER TABLE subtopic_progress RENAME COLUMN demonstrated_at TO proficient_at;

  CREATE TABLE assessment_attempts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    assessment_id TEXT NOT NULL, version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','awaiting_review','passed','failed')),
    started_at TEXT NOT NULL DEFAULT (datetime('now')), submitted_at TEXT, reviewed_at TEXT, reviewer TEXT NOT NULL DEFAULT '',
    points REAL CHECK (points IS NULL OR points >= 0), max_points REAL CHECK (max_points IS NULL OR max_points > 0),
    CHECK (status = 'in_progress' OR submitted_at IS NOT NULL),
    CHECK (status NOT IN ('passed','failed') OR (points IS NOT NULL AND max_points IS NOT NULL)));
  CREATE INDEX assessment_attempts_user ON assessment_attempts(user_id, assessment_id, started_at);

  CREATE TABLE attempt_answers (attempt_id INTEGER NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE, item_id TEXT NOT NULL,
    response TEXT NOT NULL DEFAULT '', points REAL CHECK (points IS NULL OR points >= 0), auto INTEGER NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL DEFAULT '', criteria TEXT NOT NULL DEFAULT '', reviewed_at TEXT,
    PRIMARY KEY (attempt_id, item_id));

  CREATE TABLE evidence (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    kind TEXT NOT NULL CHECK (kind IN ('submission','test_result','score','project','review','file_ref')),
    title TEXT NOT NULL CHECK (length(trim(title)) > 0), url TEXT, body TEXT NOT NULL DEFAULT '',
    topic_id TEXT REFERENCES topics(id), skill_id TEXT REFERENCES skills(id), milestone_id TEXT REFERENCES milestones(id),
    attempt_id INTEGER REFERENCES assessment_attempts(id) ON DELETE SET NULL,
    demonstrated_on TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (url IS NOT NULL OR length(trim(body)) > 0));
  CREATE INDEX evidence_user ON evidence(user_id, created_at);
  `,
  // v4 — The six-phase path (docs/PRD.md §4): modules, the reason and finance use of each topic,
  // projects, and an archive so a dropped subtopic never takes anyone's progress with it.
  `
  CREATE TABLE modules (id TEXT PRIMARY KEY, phase_id TEXT NOT NULL REFERENCES phases(id), ord INTEGER NOT NULL, title TEXT NOT NULL);
  ALTER TABLE topics ADD COLUMN module_id TEXT REFERENCES modules(id);
  ALTER TABLE topics ADD COLUMN why TEXT NOT NULL DEFAULT '';
  ALTER TABLE topics ADD COLUMN finance TEXT NOT NULL DEFAULT '';
  ALTER TABLE topics ADD COLUMN project TEXT;
  ALTER TABLE milestones ADD COLUMN project TEXT;
  CREATE TABLE retired_progress (user_id INTEGER NOT NULL REFERENCES users(id), subtopic_id TEXT NOT NULL, topic_id TEXT NOT NULL, title TEXT NOT NULL,
    exposed_at TEXT, practised_at TEXT, proficient_at TEXT, evidence TEXT, reason TEXT NOT NULL, retired_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, subtopic_id));
  `,
  (db) => migrateToSixPhases(db),
  // v5 — Rare Stock Discovery. Additive: nothing existing changes.
  `
  CREATE TABLE stock_companies (symbol TEXT PRIMARY KEY, isin TEXT, name TEXT, sector TEXT, turnover REAL, close REAL,
    technicals TEXT, closes TEXT, status TEXT, reason TEXT, scanned_at TEXT);
  CREATE INDEX stock_companies_isin ON stock_companies(isin);
  CREATE TABLE stock_scans (id INTEGER PRIMARY KEY, trading_date TEXT NOT NULL, status TEXT NOT NULL, total INTEGER NOT NULL, done INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0, error TEXT, started_at TEXT NOT NULL DEFAULT (datetime('now')), finished_at TEXT);
  CREATE TABLE stock_fundamentals (symbol TEXT NOT NULL, metric TEXT NOT NULL, source TEXT NOT NULL, value REAL NOT NULL, period_end TEXT,
    period_type TEXT NOT NULL DEFAULT 'unknown', basis TEXT NOT NULL DEFAULT 'unknown', retrieved_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (symbol, metric, source));
  CREATE TABLE stock_segments (isin TEXT PRIMARY KEY, segment TEXT NOT NULL, avg_mcap_cr REAL, period_end TEXT NOT NULL);
  CREATE TABLE stock_watchlist (symbol TEXT PRIMARY KEY, thesis TEXT NOT NULL DEFAULT '', added_at TEXT NOT NULL DEFAULT (datetime('now')));
  `,
  // v6 — Who belongs in discovery: instrument type and average liquidity. Additive.
  `
  ALTER TABLE stock_companies ADD COLUMN eligibility TEXT;
  ALTER TABLE stock_companies ADD COLUMN avg_turnover REAL;
  ALTER TABLE stock_companies ADD COLUMN sessions_traded INTEGER;
  `,
  // v7 — Academy practice attempts. Additive: nothing existing changes.
  `
  CREATE TABLE practice_attempts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    exercise_id TEXT NOT NULL, passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
    checks_passed INTEGER NOT NULL, checks_total INTEGER NOT NULL, seconds REAL NOT NULL,
    code TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE INDEX practice_attempts_exercise ON practice_attempts(user_id, exercise_id, created_at);
  `,
  // v8 — Official exchange prices, source agreement and historical validation. Additive.
  `
  CREATE TABLE stock_official_prices (exchange TEXT NOT NULL, trade_date TEXT NOT NULL, symbol TEXT NOT NULL, isin TEXT, series TEXT, name TEXT,
    open REAL, high REAL, low REAL, close REAL NOT NULL, prev_close REAL, volume REAL, turnover REAL, trades INTEGER,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (exchange, trade_date, symbol));
  CREATE INDEX stock_official_isin ON stock_official_prices(isin, trade_date);
  CREATE TABLE stock_source_checks (id INTEGER PRIMARY KEY, trade_date TEXT NOT NULL, source TEXT NOT NULL, summary TEXT NOT NULL,
    checked_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE stock_backtests (id INTEGER PRIMARY KEY, status TEXT NOT NULL, params TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0, observations INTEGER NOT NULL DEFAULT 0, results TEXT, error TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')), finished_at TEXT);
  `,
];

/** The v-numbered user_version counts every entry above. */
export function migrate(db: DB, upTo = MIGRATIONS.length) {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < upTo; v++) {
    db.transaction(() => {
      const step = MIGRATIONS[v]!;
      if (typeof step === "string") db.exec(step);
      else step(db);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

/** A copy of a database that already holds data, taken before a migration changes it. */
function backupBeforeUpgrade(db: DB, file: string) {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (file === ":memory:" || current === 0 || current >= MIGRATIONS.length) return;
  const dir = path.join(path.dirname(file), "backups");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `before-v${MIGRATIONS.length}-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
  db.prepare("VACUUM INTO ?").run(out);
}

export function seed(db: DB) {
  const has = db.prepare("SELECT COUNT(*) AS n FROM phases").get() as { n: number };
  if (has.n > 0) return;
  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO users (id, name) VALUES (?, '')").run(LOCAL_USER_ID);
    applyCurriculum(db);
    const rs = db.prepare("INSERT INTO resources (id, topic_id, kind, title, author, url, sections, hours, is_primary) VALUES (?,?,?,?,?,?,?,?,?)");
    RESOURCES.forEach((r) => rs.run(r.id, r.topic, r.kind, r.title, r.author, r.url, r.sections, r.hours, r.primary ? 1 : 0));
  })();
}

/**
 * Content sync for databases seeded by an earlier release. Additive only:
 * inserts curriculum subtopics and seed resources that do not exist yet, and fills a
 * seed resource's URL only while the user has not set one. Never edits progress,
 * user-edited text or existing rows otherwise.
 */
export function syncContent(db: DB) {
  db.transaction(() => {
    const insertSub = db.prepare("INSERT OR IGNORE INTO subtopics (id, topic_id, ord, title, month) VALUES (?,?,?,?,?)");
    const lastMonth = db.prepare("SELECT COALESCE(MAX(month), 1) AS m, COALESCE(MAX(ord), 0) AS o FROM subtopics WHERE topic_id = ?");
    for (const p of PHASES) for (const t of p.topics) {
      t.subtopics.forEach((title) => {
        const id = `${t.id}:${slug(title)}`;
        const exists = db.prepare("SELECT 1 FROM subtopics WHERE id = ?").get(id);
        if (exists) return;
        const { m, o } = lastMonth.get(t.id) as { m: number; o: number };
        insertSub.run(id, t.id, o + 1, title, m);
      });
    }
    const insertRes = db.prepare("INSERT OR IGNORE INTO resources (id, topic_id, kind, title, author, url, sections, hours, is_primary) VALUES (?,?,?,?,?,?,?,?,?)");
    const fillUrl = db.prepare("UPDATE resources SET url = ?, title = ?, author = ?, sections = ? WHERE id = ? AND url IS NULL");
    for (const r of RESOURCES) {
      insertRes.run(r.id, r.topic, r.kind, r.title, r.author, r.url, r.sections, r.hours, r.primary ? 1 : 0);
      if (r.url) fillUrl.run(r.url, r.title, r.author, r.sections, r.id);
    }
  })();
}

export function openDb(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 3000");
  backupBeforeUpgrade(db, file);
  migrate(db);
  seed(db);
  syncContent(db);
  return db;
}

export function dbPath(): string {
  return process.env.URHA_DB_PATH || path.join(process.cwd(), "data", "urha.db");
}

// One connection per server process; survives dev hot reloads.
const g = globalThis as unknown as { __urhaDb?: DB };
export function getDb(): DB {
  if (!g.__urhaDb) g.__urhaDb = openDb(dbPath());
  return g.__urhaDb;
}
