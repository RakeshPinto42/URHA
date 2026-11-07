import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MILESTONES, PHASES, SKILLS, slug } from "@/lib/curriculum";
import { DROPPED_SUBTOPICS, MOVED_SUBTOPICS, PHASE_MOVES } from "@/lib/curriculum-moves";
import { migrate, openDb, seed, syncContent, type DB } from "@/lib/db";
import old from "./fixtures/curriculum-v3.json";

const V3 = 3;
type Row = Record<string, unknown>;

/** A database exactly as the seven-phase release left it, from a snapshot of the real one. */
function sevenPhaseDb(): DB {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db, V3);
  db.prepare("INSERT INTO users (id, name) VALUES (1, '')").run();
  const insert = (table: string, rows: Row[]) => {
    const cols = Object.keys(rows[0]!);
    const st = db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => `@${c}`).join(",")})`);
    rows.forEach((r) => st.run(r));
  };
  const f = old as unknown as Record<string, Row[]>;
  db.pragma("defer_foreign_keys = ON");
  db.transaction(() => { for (const t of ["skills", "phases", "milestones", "topics", "topic_prereqs", "topic_skills", "subtopics", "resources"]) insert(t, f[t]!); })();
  return db;
}

const practise = (db: DB, id: string, evidence: string | null = null) => db.prepare(
  "INSERT INTO subtopic_progress (user_id, subtopic_id, exposed_at, practised_at, proficient_at, evidence) VALUES (1, ?, '2026-10-01', '2026-10-02', ?, ?)",
).run(id, evidence ? "2026-10-03" : null, evidence);
const rows = <T,>(db: DB, sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as T[];
const count = (db: DB, sql: string) => (db.prepare(sql).get() as { n: number }).n;

describe("from seven phases to six", () => {
  it("starts from the real seven-phase shape", () => {
    const db = sevenPhaseDb();
    expect(count(db, "SELECT COUNT(*) n FROM phases")).toBe(7);
    expect(count(db, "SELECT COUNT(*) n FROM subtopics")).toBe(258);
  });

  it("produces exactly the curriculum a new install gets", () => {
    const db = sevenPhaseDb();
    migrate(db);
    syncContent(db);
    const fresh = openDb(":memory:");
    for (const q of [
      "SELECT id, ord, title, month_start, month_end, summary, deliverable, exit_gate FROM phases ORDER BY id",
      "SELECT id, phase_id, ord, title FROM modules ORDER BY id",
      "SELECT id, phase_id, module_id, ord, title, objective, summary, assignment, milestone_id, why, finance, project FROM topics ORDER BY id",
      "SELECT id, topic_id, ord, title, month FROM subtopics ORDER BY id",
      "SELECT * FROM topic_prereqs ORDER BY topic_id, prereq_id",
      "SELECT * FROM topic_skills ORDER BY topic_id, skill_id",
      "SELECT id, title, phase_id, project FROM milestones ORDER BY id",
      "SELECT id, name, target FROM skills ORDER BY id",
    ]) expect(rows(db, q), q).toEqual(rows(fresh, q));
  });

  it("carries every subtopic's progress to its new home, including the moved ones", () => {
    const db = sevenPhaseDb();
    const dropped = new Set(DROPPED_SUBTOPICS.map((d) => `${d.topic}:${slug(d.subtopic)}`));
    const all = rows<{ id: string; title: string; topic_id: string }>(db, "SELECT id, title, topic_id FROM subtopics");
    const kept = all.filter((s) => !dropped.has(s.id));
    kept.forEach((s) => practise(db, s.id));
    migrate(db);
    const moved = new Map(MOVED_SUBTOPICS.map(([from, to, title]) => [`${from}:${slug(title)}`, `${to}:${slug(title)}`]));
    expect(moved.size).toBe(16);
    for (const s of kept) {
      const now = moved.get(s.id) ?? s.id;
      const row = db.prepare("SELECT practised_at FROM subtopic_progress WHERE subtopic_id = ?").get(now) as { practised_at: string } | undefined;
      expect(row?.practised_at, s.id).toBe("2026-10-02");
    }
    expect(count(db, "SELECT COUNT(*) n FROM subtopic_progress")).toBe(kept.length);
  });

  it("keeps self-declared evidence on a moved subtopic", () => {
    const db = sevenPhaseDb();
    practise(db, "python-engineering:exception-handling", "My validator's error report");
    migrate(db);
    const row = db.prepare("SELECT evidence FROM subtopic_progress WHERE subtopic_id = 'python-foundations:exception-handling'").get() as { evidence: string };
    expect(row.evidence).toBe("My validator's error report");
  });

  it("archives progress on a dropped subtopic, and credits it to nothing else", () => {
    const db = sevenPhaseDb();
    practise(db, "observability:langfuse", "Traced a real run");
    migrate(db);
    expect(count(db, "SELECT COUNT(*) n FROM subtopics WHERE id = 'observability:langfuse'")).toBe(0);
    const [r] = rows<{ title: string; evidence: string; practised_at: string; reason: string }>(db, "SELECT * FROM retired_progress");
    expect(r).toMatchObject({ title: "Langfuse", evidence: "Traced a real run", practised_at: "2026-10-02" });
    expect(r!.reason).toMatch(/LangSmith/);
    expect(count(db, "SELECT COUNT(*) n FROM subtopic_progress WHERE subtopic_id = 'observability:langsmith'")).toBe(0);
  });

  it("moves tasks with their topic, or with their old phase", () => {
    const db = sevenPhaseDb();
    const task = db.prepare("INSERT INTO tasks (id, user_id, title, category, phase_id, topic_id) VALUES (?, 1, 't', 'build', ?, ?)");
    task.run(1, "p2", "backend-engineering");
    task.run(2, "p7", null);
    task.run(3, "p6", null);
    task.run(4, null, null);
    migrate(db);
    const phase = (id: number) => (db.prepare("SELECT phase_id p FROM tasks WHERE id = ?").get(id) as { p: string | null }).p;
    expect(phase(1)).toBe("p5");
    expect(phase(2)).toBe(PHASE_MOVES.p7);
    expect(phase(3)).toBe(PHASE_MOVES.p6);
    expect(phase(4)).toBeNull();
  });

  it("leaves notes, attempts, evidence and Meditation data alone", () => {
    const db = sevenPhaseDb();
    db.prepare("INSERT INTO topic_flags (user_id, topic_id, notes) VALUES (1, 'langgraph', 'my notes')").run();
    db.prepare("INSERT INTO listening_progress (user_id, passage_id, translation) VALUES (1, 'ps-23', 'web')").run();
    db.prepare("INSERT INTO assessment_attempts (id, user_id, assessment_id, version) VALUES (1, 1, 'sql-foundations', 1)").run();
    db.prepare("INSERT INTO evidence (user_id, kind, title, body, topic_id, milestone_id) VALUES (1, 'project', 'x', 'y', 'mcp', 'ls-07')").run();
    const snapshot = () => ["topic_flags", "listening_progress", "assessment_attempts", "evidence"].map((t) => rows(db, `SELECT * FROM ${t}`));
    const before = snapshot();
    migrate(db);
    expect(snapshot()).toEqual(before);
  });

  it("removes the seventh phase and leaves no broken reference", () => {
    const db = sevenPhaseDb();
    migrate(db);
    expect(rows<{ id: string }>(db, "SELECT id FROM phases ORDER BY ord").map((p) => p.id)).toEqual(PHASES.map((p) => p.id));
    expect(rows(db, "PRAGMA foreign_key_check")).toEqual([]);
    expect(count(db, "SELECT COUNT(*) n FROM topics WHERE module_id IS NULL OR why = '' OR finance = ''")).toBe(0);
  });

  it("is safe to run on a database that has already moved", () => {
    const db = sevenPhaseDb();
    migrate(db);
    const before = rows(db, "SELECT * FROM subtopics ORDER BY id");
    migrate(db);
    syncContent(db);
    seed(db);
    expect(rows(db, "SELECT * FROM subtopics ORDER BY id")).toEqual(before);
  });

  it("rolls back completely if the move fails", () => {
    const db = sevenPhaseDb();
    migrate(db, V3 + 1); // schema step only
    db.prepare("INSERT INTO retired_progress (user_id, subtopic_id, topic_id, title, reason) VALUES (1, 'observability:langfuse', 'observability', 'x', 'y')").run();
    practise(db, "observability:langfuse"); // a second archive of this id breaks the primary key
    expect(() => migrate(db)).toThrow();
    expect(count(db, "SELECT COUNT(*) n FROM phases")).toBe(7);
    expect(db.pragma("user_version", { simple: true })).toBe(V3 + 1);
  });
});

describe("the backup before an upgrade", () => {
  it("copies a database with data before migrating it, and nothing else", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "urha-"));
    const file = path.join(dir, "urha.db");
    const made = new Database(file);
    migrate(made, V3);
    made.prepare("INSERT INTO users (id, name) VALUES (1, 'keep me')").run();
    made.close();

    const db = openDb(file);
    db.close();
    const backups = fs.readdirSync(path.join(dir, "backups"));
    expect(backups).toHaveLength(1);
    const copy = new Database(path.join(dir, "backups", backups[0]!), { readonly: true });
    expect(copy.pragma("user_version", { simple: true })).toBe(V3);
    expect((copy.prepare("SELECT name FROM users").get() as { name: string }).name).toBe("keep me");
    copy.close();

    openDb(file).close(); // Already current: no second backup.
    expect(fs.readdirSync(path.join(dir, "backups"))).toHaveLength(1);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("milestones and skills after the move", () => {
  it("places each milestone in a real phase and project", () => {
    for (const m of MILESTONES) {
      expect(PHASES.some((p) => p.id === m.phase), m.id).toBe(true);
      expect(m.project, m.id).toMatch(/^P[1-5]$/);
    }
  });
  it("adds the two skills the new phase needs", () => {
    expect(SKILLS.map((s) => s.id)).toEqual(expect.arrayContaining(["data", "analytics"]));
  });
});
