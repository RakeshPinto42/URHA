/**
 * Writes the curriculum into the database, for a new install and for an upgrade.
 *
 * `applyCurriculum` is the one writer of curriculum rows, so a fresh database and a migrated
 * one cannot drift apart. It upserts: nothing a user owns lives in these tables.
 *
 * `migrateToSixPhases` moves a database from the seven-phase path to the six-phase path of
 * docs/PRD.md. It runs inside the migration's transaction, so it completes or leaves the
 * database untouched. What it guarantees:
 *  - Progress follows a subtopic to its new topic. Its id changes; the row does not.
 *  - Progress on a dropped subtopic is archived in retired_progress, never deleted and never
 *    credited to something else.
 *  - Tasks follow their topic, or the phase their old phase became.
 *  - Evidence, attempts, notes, tasks and Meditation data are not touched.
 */
import type Database from "better-sqlite3";
import { MILESTONES, PHASES, SKILLS, scheduleMonths, slug } from "./curriculum";
import { DROPPED_SUBTOPICS, MOVED_SUBTOPICS, PHASE_MOVES } from "./curriculum-moves";

type DB = Database.Database;

export function applyCurriculum(db: DB) {
  const skill = db.prepare("INSERT INTO skills (id, name, target) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, target = excluded.target");
  SKILLS.forEach((s) => skill.run(s.id, s.name, s.target));

  const phase = db.prepare(`INSERT INTO phases (id, ord, title, month_start, month_end, summary, deliverable, exit_gate) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET ord = excluded.ord, title = excluded.title, month_start = excluded.month_start, month_end = excluded.month_end,
      summary = excluded.summary, deliverable = excluded.deliverable, exit_gate = excluded.exit_gate`);
  PHASES.forEach((p) => phase.run(p.id, p.order, p.title, p.months[0], p.months[1], p.summary, p.deliverable, p.exitGate));

  const mod = db.prepare(`INSERT INTO modules (id, phase_id, ord, title) VALUES (?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET phase_id = excluded.phase_id, ord = excluded.ord, title = excluded.title`);
  PHASES.forEach((p) => p.modules.forEach((m, i) => mod.run(m.id, p.id, i + 1, m.title)));

  const milestone = db.prepare(`INSERT INTO milestones (id, ord, title, phase_id, business_problem, technical_objective, completion_criteria, project) VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET ord = excluded.ord, title = excluded.title, phase_id = excluded.phase_id, business_problem = excluded.business_problem,
      technical_objective = excluded.technical_objective, completion_criteria = excluded.completion_criteria, project = excluded.project`);
  MILESTONES.forEach((m) => milestone.run(m.id, m.order, m.title, m.phase, m.businessProblem, m.technicalObjective, m.completionCriteria, m.project));

  const topic = db.prepare(`INSERT INTO topics (id, phase_id, module_id, ord, title, objective, summary, assignment, milestone_id, why, finance, project) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET phase_id = excluded.phase_id, module_id = excluded.module_id, ord = excluded.ord, title = excluded.title,
      objective = excluded.objective, summary = excluded.summary, assignment = excluded.assignment, milestone_id = excluded.milestone_id,
      why = excluded.why, finance = excluded.finance, project = excluded.project`);
  const sub = db.prepare(`INSERT INTO subtopics (id, topic_id, ord, title, month) VALUES (?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET topic_id = excluded.topic_id, ord = excluded.ord, title = excluded.title, month = excluded.month`);
  for (const p of PHASES) {
    const flat = p.topics.flatMap((t) => t.subtopics.map((s, i) => ({ t, s, i })));
    const months = scheduleMonths(flat.length, p.months);
    let ord = 0;
    for (const m of p.modules) for (const t of m.topics) {
      ord += 1;
      topic.run(t.id, p.id, m.id, ord, t.title, t.objective, t.summary, t.assignment, t.milestone, t.why, t.finance, t.project);
    }
    flat.forEach(({ t, s, i }, n) => sub.run(`${t.id}:${slug(s)}`, t.id, i + 1, s, months[n]!));
  }

  // Links are rebuilt after every topic exists, so foreign keys hold.
  db.exec("DELETE FROM topic_prereqs; DELETE FROM topic_skills;");
  const prereq = db.prepare("INSERT INTO topic_prereqs (topic_id, prereq_id) VALUES (?, ?)");
  const link = db.prepare("INSERT INTO topic_skills (topic_id, skill_id) VALUES (?, ?)");
  for (const p of PHASES) for (const t of p.topics) {
    t.prerequisites.forEach((q) => prereq.run(t.id, q));
    t.skills.forEach((s) => link.run(t.id, s));
  }
}

export function migrateToSixPhases(db: DB) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM phases").get() as { n: number };
  if (n === 0) return; // A new database: seed() writes the curriculum.

  db.pragma("defer_foreign_keys = ON"); // Rows reference each other mid-move; checked at commit.

  // Archive before anything moves, while the old rows still exist.
  const archive = db.prepare(`INSERT INTO retired_progress (user_id, subtopic_id, topic_id, title, exposed_at, practised_at, proficient_at, evidence, reason)
    SELECT p.user_id, p.subtopic_id, s.topic_id, s.title, p.exposed_at, p.practised_at, p.proficient_at, p.evidence, ?
    FROM subtopic_progress p JOIN subtopics s ON s.id = p.subtopic_id WHERE p.subtopic_id = ?`);
  for (const d of DROPPED_SUBTOPICS) {
    const id = `${d.topic}:${slug(d.subtopic)}`;
    archive.run(d.reason, id);
    db.prepare("DELETE FROM subtopic_progress WHERE subtopic_id = ?").run(id);
    db.prepare("DELETE FROM subtopics WHERE id = ?").run(id);
  }

  applyCurriculum(db); // Creates every topic and subtopic, including the moved ones under their new ids.

  const carry = db.prepare("UPDATE subtopic_progress SET subtopic_id = ? WHERE subtopic_id = ?");
  const remove = db.prepare("DELETE FROM subtopics WHERE id = ?");
  for (const [from, to, title] of MOVED_SUBTOPICS) {
    const oldId = `${from}:${slug(title)}`;
    carry.run(`${to}:${slug(title)}`, oldId);
    remove.run(oldId);
  }

  const cases = Object.entries(PHASE_MOVES);
  db.prepare(`UPDATE tasks SET phase_id = COALESCE((SELECT t.phase_id FROM topics t WHERE t.id = tasks.topic_id),
      CASE phase_id ${cases.map(() => "WHEN ? THEN ?").join(" ")} ELSE phase_id END)
    WHERE phase_id IS NOT NULL`).run(...cases.flat());

  const keep = new Set(PHASES.map((p) => p.id));
  const stale = (db.prepare("SELECT id FROM phases").all() as { id: string }[]).filter((p) => !keep.has(p.id));
  for (const { id } of stale) db.prepare("DELETE FROM phases WHERE id = ?").run(id);
}
