/**
 * Data access layer. The only module that runs SQL. Server-only.
 * Every query is scoped by user id; inputs arriving here are already validated
 * (lib/validate.ts) but foreign keys and CHECK constraints are the last line.
 */
import "server-only";
import { getDb, LOCAL_USER_ID, type DB } from "./db";
import { EXERCISES } from "./practice/exercises";
import {
  applyStep, count, currentPhaseIndex, resolveTopicStatuses, roadMonths, topicMastery,
  type Counts, type Mastery, type Step, type SubtopicProgress, type TopicStatus,
} from "./progress";
import { nextOccurrence, type Category, type Priority, type Recurrence, type TaskStatus } from "./taskLogic";
import { addDays, toIso, today as todayIso, weekStart } from "./dates";
import { getAssessment, ASSESSMENTS } from "./assessments";
import { reviewerLabel } from "./assessments/labels";

const uid = () => LOCAL_USER_ID;
const db = (): DB => getDb();

/* ---------------------------------------------------------------- settings */

export type Settings = { startDate: string | null; weeklyTargetHours: number; name: string };
export const DEFAULT_WEEKLY_HOURS = 11;

export function getSettings(): Settings {
  const rows = db().prepare("SELECT key, value FROM settings WHERE user_id = ?").all(uid()) as { key: string; value: string }[];
  const m = new Map(rows.map((r) => [r.key, r.value]));
  const hours = Number(m.get("weekly_target_hours"));
  return {
    startDate: m.get("start_date") ?? null,
    weeklyTargetHours: Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_WEEKLY_HOURS,
    name: m.get("name") ?? "",
  };
}

export function setSetting(key: "start_date" | "weekly_target_hours" | "name", value: string) {
  db().prepare("INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value")
    .run(uid(), key, value);
}

/* ---------------------------------------------------------------- curriculum */

export type SubtopicView = { id: string; title: string; ord: number; month: number; progress: SubtopicProgress; evidence: string | null; updatedAt: string | null };
export type TopicView = {
  id: string; phaseId: string; ord: number; title: string; objective: string; summary: string; assignment: string;
  milestoneId: string | null; prerequisites: string[]; skills: string[]; status: TopicStatus; needsRevision: boolean; revisionNotes: string;
  subtopics: SubtopicView[]; counts: Counts;
  /** Demonstrated = this topic's assessment has a passed attempt. Never set by a step. */
  demonstrated: boolean; mastery: Mastery;
};
export type PhaseView = {
  id: string; ord: number; title: string; months: [number, number]; summary: string; deliverable: string; exitGate: string;
  topics: TopicView[]; counts: Counts;
};
export type PathModel = {
  phases: PhaseView[];
  currentPhaseId: string | null;
  overall: Counts;
  road: ReturnType<typeof roadMonths>;
  topicTitles: Record<string, string>;
};

type ProgRow = { subtopic_id: string; exposed_at: string | null; practised_at: string | null; proficient_at: string | null; evidence: string | null; updated_at: string };

export function getPath(): PathModel {
  const d = db();
  const phases = d.prepare("SELECT * FROM phases ORDER BY ord").all() as {
    id: string; ord: number; title: string; month_start: number; month_end: number; summary: string; deliverable: string; exit_gate: string;
  }[];
  const topics = d.prepare("SELECT * FROM topics ORDER BY ord").all() as {
    id: string; phase_id: string; ord: number; title: string; objective: string; summary: string; assignment: string; milestone_id: string | null;
  }[];
  const subs = d.prepare("SELECT * FROM subtopics ORDER BY topic_id, ord").all() as { id: string; topic_id: string; ord: number; title: string; month: number }[];
  const prereqs = d.prepare("SELECT topic_id, prereq_id FROM topic_prereqs").all() as { topic_id: string; prereq_id: string }[];
  const skills = d.prepare("SELECT topic_id, skill_id FROM topic_skills").all() as { topic_id: string; skill_id: string }[];
  const prog = d.prepare("SELECT * FROM subtopic_progress WHERE user_id = ?").all(uid()) as ProgRow[];
  const flags = d.prepare("SELECT topic_id, needs_revision, notes FROM topic_flags WHERE user_id = ?").all(uid()) as { topic_id: string; needs_revision: number; notes: string }[];

  const passed = passedTopicIds();
  // Linked practice exercises, and which are passed, from the Practice yard's own records.
  const passedPractice = new Set((d.prepare("SELECT DISTINCT exercise_id FROM practice_attempts WHERE user_id = ? AND passed = 1").all(uid()) as { exercise_id: string }[]).map((r) => r.exercise_id));
  // Real-price exercises are applied extras: they need a locally built file, so they never block completion.
  const practiceDone = (topicId: string) => EXERCISES.filter((e) => e.topicId === topicId && !e.market).every((e) => passedPractice.has(e.id));
  const progBy = new Map(prog.map((p) => [p.subtopic_id, p]));
  const flagBy = new Map(flags.map((f) => [f.topic_id, f]));
  const subView = (s: (typeof subs)[number]): SubtopicView => {
    const p = progBy.get(s.id);
    return {
      id: s.id, title: s.title, ord: s.ord, month: s.month,
      progress: { exposed: !!p?.exposed_at, practised: !!p?.practised_at, proficient: !!p?.proficient_at },
      evidence: p?.evidence ?? null, updatedAt: p?.updated_at ?? null,
    };
  };
  const subsByTopic = new Map<string, SubtopicView[]>();
  subs.forEach((s) => subsByTopic.set(s.topic_id, [...(subsByTopic.get(s.topic_id) ?? []), subView(s)]));

  const statuses = resolveTopicStatuses(topics.map((t) => ({
    id: t.id,
    prerequisites: prereqs.filter((p) => p.topic_id === t.id).map((p) => p.prereq_id),
    subs: (subsByTopic.get(t.id) ?? []).map((s) => s.progress),
    needsRevision: !!flagBy.get(t.id)?.needs_revision,
    demonstrated: passed.has(t.id),
    practiceDone: practiceDone(t.id),
  })));

  const topicViews: TopicView[] = topics.map((t) => {
    const sv = subsByTopic.get(t.id) ?? [];
    return {
      id: t.id, phaseId: t.phase_id, ord: t.ord, title: t.title, objective: t.objective, summary: t.summary, assignment: t.assignment,
      milestoneId: t.milestone_id,
      prerequisites: prereqs.filter((p) => p.topic_id === t.id).map((p) => p.prereq_id),
      skills: skills.filter((s) => s.topic_id === t.id).map((s) => s.skill_id),
      status: statuses.get(t.id) ?? "not-started",
      needsRevision: !!flagBy.get(t.id)?.needs_revision,
      revisionNotes: flagBy.get(t.id)?.notes ?? "",
      subtopics: sv, counts: count(sv.map((s) => s.progress)),
      demonstrated: passed.has(t.id),
      mastery: topicMastery(sv.map((s) => s.progress), passed.has(t.id)),
    };
  });

  const phaseViews: PhaseView[] = phases.map((p) => {
    const ts = topicViews.filter((t) => t.phaseId === p.id);
    return {
      id: p.id, ord: p.ord, title: p.title, months: [p.month_start, p.month_end], summary: p.summary,
      deliverable: p.deliverable, exitGate: p.exit_gate, topics: ts,
      counts: count(ts.flatMap((t) => t.subtopics.map((s) => s.progress))),
    };
  });

  const ci = currentPhaseIndex(phaseViews.map((p) => p.topics.map((t) => t.status)));
  const allSubs = topicViews.flatMap((t) => t.subtopics.map((s) => ({ month: s.month, phaseId: t.phaseId, practised: s.progress.practised, p: s.progress })));
  return {
    phases: phaseViews,
    currentPhaseId: ci === null ? null : phaseViews[ci]!.id,
    overall: count(allSubs.map((s) => s.p)),
    road: roadMonths(allSubs, phaseViews),
    topicTitles: Object.fromEntries(topicViews.map((t) => [t.id, t.title])),
  };
}

export function topicExists(id: string): boolean {
  return !!db().prepare("SELECT 1 FROM topics WHERE id = ?").get(id);
}

export type ResourceView = {
  id: string; topicId: string; kind: string; title: string; author: string; url: string | null; sections: string; hours: number | null;
  primary: boolean; linkStatus: "unchecked" | "resolves" | "failed"; linkHttp: number | null; linkCheckedAt: string | null;
};
export function getResources(topicId?: string): ResourceView[] {
  const rows = (topicId
    ? db().prepare("SELECT * FROM resources WHERE topic_id = ? ORDER BY is_primary DESC, title").all(topicId)
    : db().prepare("SELECT * FROM resources ORDER BY topic_id, is_primary DESC, title").all()) as {
    id: string; topic_id: string; kind: string; title: string; author: string; url: string | null; sections: string; hours: number | null;
    is_primary: number; link_status: ResourceView["linkStatus"]; link_http: number | null; link_checked_at: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id, topicId: r.topic_id, kind: r.kind, title: r.title, author: r.author, url: r.url, sections: r.sections, hours: r.hours,
    primary: !!r.is_primary, linkStatus: r.link_status, linkHttp: r.link_http, linkCheckedAt: r.link_checked_at,
  }));
}

export function updateResource(id: string, patch: { url: string | null; sections: string; hours: number | null }) {
  const cur = db().prepare("SELECT url FROM resources WHERE id = ?").get(id) as { url: string | null } | undefined;
  if (!cur) throw new Error("Resource not found");
  const urlChanged = cur.url !== patch.url;
  db().prepare(`UPDATE resources SET url = ?, sections = ?, hours = ?, updated_at = datetime('now')
    ${urlChanged ? ", link_status = 'unchecked', link_http = NULL, link_checked_at = NULL" : ""} WHERE id = ?`)
    .run(patch.url, patch.sections, patch.hours, id);
}

export function getSkills(): { id: string; name: string; target: number }[] {
  return db().prepare("SELECT id, name, target FROM skills ORDER BY rowid").all() as { id: string; name: string; target: number }[];
}

export type MilestoneView = { id: string; ord: number; title: string; phaseId: string; businessProblem: string; technicalObjective: string; completionCriteria: string };
export function getMilestones(): MilestoneView[] {
  return (db().prepare("SELECT * FROM milestones ORDER BY ord").all() as {
    id: string; ord: number; title: string; phase_id: string; business_problem: string; technical_objective: string; completion_criteria: string;
  }[]).map((m) => ({ id: m.id, ord: m.ord, title: m.title, phaseId: m.phase_id, businessProblem: m.business_problem, technicalObjective: m.technical_objective, completionCriteria: m.completion_criteria }));
}

/* ---------------------------------------------------------------- progress mutations */

export function setStep(subtopicId: string, step: Step, on: boolean, evidence: string | null) {
  const d = db();
  const exists = d.prepare("SELECT 1 FROM subtopics WHERE id = ?").get(subtopicId);
  if (!exists) throw new Error("Subtopic not found");
  const row = d.prepare("SELECT * FROM subtopic_progress WHERE user_id = ? AND subtopic_id = ?").get(uid(), subtopicId) as ProgRow | undefined;
  const cur: SubtopicProgress = { exposed: !!row?.exposed_at, practised: !!row?.practised_at, proficient: !!row?.proficient_at };
  const next = applyStep(cur, step, on);
  // Practising or proving a topic needs its prerequisites completed first. Studying stays open.
  if (on && (step === "practised" || step === "proficient")) {
    const topicId = (d.prepare("SELECT topic_id FROM subtopics WHERE id = ?").get(subtopicId) as { topic_id: string }).topic_id;
    const missing = unmetPrerequisites(topicId);
    if (missing.length) throw new Error(`Prerequisite not completed: finish ${missing.join(", ")} first.`);
  }
  if (next.proficient && !cur.proficient && !(evidence && evidence.trim())) {
    throw new Error("Evidence is required to mark a subtopic as proficient.");
  }
  const now = new Date().toISOString();
  const keep = (was: string | null | undefined, isOn: boolean) => (isOn ? was ?? now : null);
  d.prepare(`INSERT INTO subtopic_progress (user_id, subtopic_id, exposed_at, practised_at, proficient_at, evidence, updated_at)
      VALUES (@u, @s, @e, @p, @d, @ev, datetime('now'))
      ON CONFLICT(user_id, subtopic_id) DO UPDATE SET exposed_at=@e, practised_at=@p, proficient_at=@d, evidence=@ev, updated_at=datetime('now')`)
    .run({
      u: uid(), s: subtopicId,
      e: keep(row?.exposed_at, next.exposed), p: keep(row?.practised_at, next.practised), d: keep(row?.proficient_at, next.proficient),
      ev: next.proficient ? (step === "proficient" && on ? evidence!.trim() : row?.evidence ?? null) : null,
    });
}

/** The titles of a topic's prerequisites that are not yet completed or demonstrated. */
export function unmetPrerequisites(topicId: string): string[] {
  const topics = getPath().phases.flatMap((p) => p.topics);
  const t = topics.find((x) => x.id === topicId);
  if (!t) return [];
  return t.prerequisites.map((id) => topics.find((x) => x.id === id)).filter((p): p is TopicView => !!p && p.status !== "completed" && p.status !== "mastered").map((p) => p.title);
}

export function setRevision(topicId: string, needsRevision: boolean, notes: string) {
  db().prepare(`INSERT INTO topic_flags (user_id, topic_id, needs_revision, notes) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, topic_id) DO UPDATE SET needs_revision = excluded.needs_revision, notes = excluded.notes, updated_at = datetime('now')`)
    .run(uid(), topicId, needsRevision ? 1 : 0, notes);
}

export type Achievement = { at: string; kind: "demonstrated" | "proficient" | "practised" | "task"; title: string; href: string };
export function recentAchievements(limit = 4): Achievement[] {
  const d = db();
  const prog = d.prepare(`SELECT s.title, s.topic_id, p.proficient_at, p.practised_at FROM subtopic_progress p JOIN subtopics s ON s.id = p.subtopic_id
    WHERE p.user_id = ? AND p.practised_at IS NOT NULL ORDER BY COALESCE(p.proficient_at, p.practised_at) DESC LIMIT ?`).all(uid(), limit) as
    { title: string; topic_id: string; proficient_at: string | null; practised_at: string }[];
  const passedRows = d.prepare(`SELECT id, assessment_id, COALESCE(reviewed_at, submitted_at) AS at FROM assessment_attempts
    WHERE user_id = ? AND status = 'passed' ORDER BY at DESC LIMIT ?`).all(uid(), limit) as { id: number; assessment_id: string; at: string }[];
  const tasks = d.prepare(`SELECT id, title, completed_on FROM tasks WHERE user_id = ? AND status = 'done' AND category IN ('build','assess','test')
    ORDER BY completed_on DESC, id DESC LIMIT ?`).all(uid(), limit) as { id: number; title: string; completed_on: string }[];
  const items: Achievement[] = [
    ...prog.map((p) => ({ at: toIso(new Date(p.proficient_at ?? p.practised_at)) /* UTC ISO → local date */, kind: (p.proficient_at ? "proficient" : "practised") as Achievement["kind"], title: p.title, href: `/academy/${p.topic_id}` })),
    ...passedRows.map((r) => ({ at: toIso(new Date(r.at.replace(" ", "T") + "Z")), kind: "demonstrated" as const, title: getAssessment(r.assessment_id)?.title ?? r.assessment_id, href: `/assessments/attempt/${r.id}` })),
    ...tasks.map((t) => ({ at: t.completed_on, kind: "task" as const, title: t.title, href: `/tasks?task=${t.id}` })),
  ];
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, limit);
}

/* ---------------------------------------------------------------- tasks */

export type TaskView = {
  id: number; title: string; description: string; category: Category; phaseId: string | null; topicId: string | null; skillId: string | null;
  resourceId: string | null; priority: Priority; estMinutes: number | null; actualMinutes: number | null; dueDate: string | null;
  status: TaskStatus; blockedReason: string; deliverable: string; completionNotes: string; recurrence: Recurrence; completedOn: string | null; createdAt: string;
};
type TaskRow = {
  id: number; title: string; description: string; category: Category; phase_id: string | null; topic_id: string | null; skill_id: string | null;
  resource_id: string | null; priority: Priority; est_minutes: number | null; actual_minutes: number | null; due_date: string | null; status: TaskStatus;
  blocked_reason: string; deliverable: string; completion_notes: string; recurrence: Recurrence; completed_on: string | null; created_at: string; series_id: number | null;
};
const toTask = (r: TaskRow): TaskView => ({
  id: r.id, title: r.title, description: r.description, category: r.category, phaseId: r.phase_id, topicId: r.topic_id, skillId: r.skill_id,
  resourceId: r.resource_id, priority: r.priority, estMinutes: r.est_minutes, actualMinutes: r.actual_minutes, dueDate: r.due_date, status: r.status,
  blockedReason: r.blocked_reason, deliverable: r.deliverable, completionNotes: r.completion_notes, recurrence: r.recurrence,
  completedOn: r.completed_on, createdAt: r.created_at,
});

export function listTasks(): TaskView[] {
  return (db().prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY COALESCE(due_date, '9999') , priority, id").all(uid()) as TaskRow[]).map(toTask);
}

export function getTask(id: number): TaskView | null {
  const r = db().prepare("SELECT * FROM tasks WHERE user_id = ? AND id = ?").get(uid(), id) as TaskRow | undefined;
  return r ? toTask(r) : null;
}

export type TaskInput = {
  title: string; description: string; category: Category; phaseId: string | null; topicId: string | null; skillId: string | null;
  resourceId: string | null; priority: Priority; estMinutes: number | null; dueDate: string | null; deliverable: string; recurrence: Recurrence;
};

export function createTask(t: TaskInput): number {
  const info = db().prepare(`INSERT INTO tasks (user_id, title, description, category, phase_id, topic_id, skill_id, resource_id, priority, est_minutes, due_date, deliverable, recurrence)
    VALUES (@u, @title, @description, @category, @phaseId, @topicId, @skillId, @resourceId, @priority, @estMinutes, @dueDate, @deliverable, @recurrence)`)
    .run({ u: uid(), ...t });
  return Number(info.lastInsertRowid);
}

export function updateTask(id: number, t: TaskInput) {
  const r = db().prepare(`UPDATE tasks SET title=@title, description=@description, category=@category, phase_id=@phaseId, topic_id=@topicId, skill_id=@skillId,
    resource_id=@resourceId, priority=@priority, est_minutes=@estMinutes, due_date=@dueDate, deliverable=@deliverable, recurrence=@recurrence
    WHERE id=@id AND user_id=@u`).run({ id, u: uid(), ...t });
  if (r.changes === 0) throw new Error("Task not found");
}

/**
 * Change status. Completing a recurring task creates its next occurrence once:
 * the new row shares `series_id`, and a second completion of the same row does
 * not create a duplicate (idempotent on retries).
 */
export function setTaskStatus(id: number, status: TaskStatus, extra: { actualMinutes?: number | null; completionNotes?: string; blockedReason?: string }, on: string = todayIso()) {
  const d = db();
  d.transaction(() => {
    const r = d.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(id, uid()) as TaskRow | undefined;
    if (!r) throw new Error("Task not found");
    const wasDone = r.status === "done";
    d.prepare(`UPDATE tasks SET status=?, completed_on=?, actual_minutes=COALESCE(?, actual_minutes), completion_notes=COALESCE(?, completion_notes),
      blocked_reason=? WHERE id=?`).run(
      status, status === "done" ? (wasDone ? r.completed_on : on) : null,
      extra.actualMinutes ?? null, extra.completionNotes ?? null,
      status === "blocked" ? (extra.blockedReason ?? r.blocked_reason) : "", id,
    );
    if (status === "done" && !wasDone && r.recurrence !== "none") {
      const series = r.series_id ?? r.id;
      const nextDue = nextOccurrence(r.due_date ?? on, r.recurrence)!;
      const dup = d.prepare("SELECT 1 FROM tasks WHERE user_id = ? AND series_id = ? AND due_date = ? AND status != 'done'").get(uid(), series, nextDue);
      if (!r.series_id) d.prepare("UPDATE tasks SET series_id = ? WHERE id = ?").run(series, id);
      if (!dup) {
        d.prepare(`INSERT INTO tasks (user_id, title, description, category, phase_id, topic_id, skill_id, resource_id, priority, est_minutes, due_date, deliverable, recurrence, series_id)
          SELECT user_id, title, description, category, phase_id, topic_id, skill_id, resource_id, priority, est_minutes, ?, deliverable, recurrence, ? FROM tasks WHERE id = ?`)
          .run(nextDue, series, id);
      }
    }
  })();
}

export function deleteTask(id: number) {
  const r = db().prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, uid());
  if (r.changes === 0) throw new Error("Task not found");
}

export function weekStats(ref: string = todayIso()) {
  const start = weekStart(ref);
  const end = addDays(start, 6);
  const row = db().prepare(`SELECT COALESCE(SUM(actual_minutes), 0) AS actual, COUNT(*) AS done,
      SUM(CASE WHEN actual_minutes IS NULL THEN 1 ELSE 0 END) AS unlogged
    FROM tasks WHERE user_id = ? AND status = 'done' AND completed_on BETWEEN ? AND ?`).get(uid(), start, end) as { actual: number; done: number; unlogged: number | null };
  const planned = db().prepare(`SELECT COALESCE(SUM(est_minutes), 0) AS planned FROM tasks WHERE user_id = ? AND due_date BETWEEN ? AND ?`)
    .get(uid(), start, end) as { planned: number };
  return { start, end, actualMinutes: row.actual, doneCount: row.done, unloggedCount: row.unlogged ?? 0, plannedMinutes: planned.planned };
}

/* ---------------------------------------------------------------- meditation */

export type ListeningView = { passageId: string; translation: string; verseIndex: number; finished: boolean; positionSec: number | null; updatedAt: string };
export function getListening(): ListeningView[] {
  return (db().prepare("SELECT * FROM listening_progress WHERE user_id = ? ORDER BY updated_at DESC").all(uid()) as {
    passage_id: string; translation: string; verse_index: number; finished: number; position_sec: number | null; updated_at: string;
  }[]).map((r) => ({ passageId: r.passage_id, translation: r.translation, verseIndex: r.verse_index, finished: !!r.finished, positionSec: r.position_sec, updatedAt: r.updated_at }));
}

export function saveListening(passageId: string, translation: string, verseIndex: number, finished: boolean, positionSec: number | null = null) {
  db().prepare(`INSERT INTO listening_progress (user_id, passage_id, translation, verse_index, finished, position_sec) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, passage_id) DO UPDATE SET translation=excluded.translation, verse_index=excluded.verse_index,
    finished=MAX(finished, excluded.finished), position_sec=COALESCE(excluded.position_sec, position_sec), updated_at=datetime('now')`).run(uid(), passageId, translation, verseIndex, finished ? 1 : 0, positionSec);
}

export function getBookmarks(): Set<string> {
  return new Set((db().prepare("SELECT passage_id FROM bookmarks WHERE user_id = ?").all(uid()) as { passage_id: string }[]).map((r) => r.passage_id));
}

export function setBookmark(passageId: string, on: boolean) {
  if (on) db().prepare("INSERT OR IGNORE INTO bookmarks (user_id, passage_id) VALUES (?, ?)").run(uid(), passageId);
  else db().prepare("DELETE FROM bookmarks WHERE user_id = ? AND passage_id = ?").run(uid(), passageId);
}

export type JournalEntry = { id: number; passageId: string; stoodOut: string; understood: string; questioned: string; apply: string; revisit: string; personal: string; createdAt: string };
export function getPassageReflections(passageId?: string): JournalEntry[] {
  const rows = (passageId
    ? db().prepare("SELECT * FROM passage_reflections WHERE user_id = ? AND passage_id = ? ORDER BY created_at DESC, id DESC").all(uid(), passageId)
    : db().prepare("SELECT * FROM passage_reflections WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 20").all(uid())) as {
    id: number; passage_id: string; stood_out: string; understood: string; questioned: string; apply: string; revisit: string; personal: string; created_at: string;
  }[];
  return rows.map((r) => ({ id: r.id, passageId: r.passage_id, stoodOut: r.stood_out, understood: r.understood, questioned: r.questioned, apply: r.apply, revisit: r.revisit, personal: r.personal, createdAt: r.created_at }));
}

export function addPassageReflection(passageId: string, e: { stoodOut: string; understood: string; questioned: string; apply: string; personal: string }) {
  db().prepare(`INSERT INTO passage_reflections (user_id, passage_id, stood_out, understood, questioned, apply, personal) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(uid(), passageId, e.stoodOut, e.understood, e.questioned, e.apply, e.personal);
}

export function deletePassageReflection(id: number) {
  db().prepare("DELETE FROM passage_reflections WHERE id = ? AND user_id = ?").run(id, uid());
}

export type AudioSource = { url: string; label: string; licence: string };
export function getAudioSource(passageId: string): AudioSource | null {
  return (db().prepare("SELECT url, label, licence FROM audio_sources WHERE user_id = ? AND passage_id = ?").get(uid(), passageId) as AudioSource | undefined) ?? null;
}

export function setAudioSource(passageId: string, src: AudioSource | null) {
  if (!src) db().prepare("DELETE FROM audio_sources WHERE user_id = ? AND passage_id = ?").run(uid(), passageId);
  else db().prepare(`INSERT INTO audio_sources (user_id, passage_id, url, label, licence) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, passage_id) DO UPDATE SET url=excluded.url, label=excluded.label, licence=excluded.licence`)
    .run(uid(), passageId, src.url, src.label, src.licence);
}

/* ---------------------------------------------------------------- meditation v2 */

export function getCollectionNote(collectionId: string): string {
  const r = db().prepare("SELECT body FROM collection_notes WHERE user_id = ? AND collection_id = ?").get(uid(), collectionId) as { body: string } | undefined;
  return r?.body ?? "";
}

export function setCollectionNote(collectionId: string, body: string) {
  db().prepare("INSERT INTO collection_notes (user_id, collection_id, body) VALUES (?, ?, ?) ON CONFLICT(user_id, collection_id) DO UPDATE SET body = excluded.body, updated_at = datetime('now')").run(uid(), collectionId, body);
}

export function getNarrationOffset(passageId: string): number | null {
  const r = db().prepare("SELECT start_sec FROM narration_offsets WHERE user_id = ? AND passage_id = ?").get(uid(), passageId) as { start_sec: number } | undefined;
  return r?.start_sec ?? null;
}

export function setNarrationOffset(passageId: string, startSec: number | null) {
  if (startSec === null) db().prepare("DELETE FROM narration_offsets WHERE user_id = ? AND passage_id = ?").run(uid(), passageId);
  else db().prepare("INSERT INTO narration_offsets (user_id, passage_id, start_sec) VALUES (?, ?, ?) ON CONFLICT(user_id, passage_id) DO UPDATE SET start_sec = excluded.start_sec, updated_at = datetime('now')").run(uid(), passageId, startSec);
}

export type CachedChapter = { verses: { verse: number; text: string }[]; source: string; fetchedAt: string };
export function getCachedChapter(translation: string, book: string, chapter: number): CachedChapter | null {
  const r = db().prepare("SELECT body, source, fetched_at FROM scripture_cache WHERE translation = ? AND book = ? AND chapter = ?").get(translation, book, chapter) as
    { body: string; source: string; fetched_at: string } | undefined;
  return r ? { verses: JSON.parse(r.body), source: r.source, fetchedAt: r.fetched_at } : null;
}

export function putCachedChapter(translation: string, book: string, chapter: number, verses: { verse: number; text: string }[], source: string) {
  db().prepare("INSERT INTO scripture_cache (translation, book, chapter, body, source) VALUES (?, ?, ?, ?, ?) ON CONFLICT(translation, book, chapter) DO UPDATE SET body = excluded.body, source = excluded.source, fetched_at = datetime('now')")
    .run(translation, book, chapter, JSON.stringify(verses), source);
}

/* ---------------------------------------------------------------- assessments and evidence (docs/JOURNEY.md §6) */

/** Topics with at least one passed attempt of an assessment for that topic. */
export function passedTopicIds(): Set<string> {
  const rows = db().prepare("SELECT DISTINCT assessment_id FROM assessment_attempts WHERE user_id = ? AND status = 'passed'").all(uid()) as { assessment_id: string }[];
  const out = new Set<string>();
  for (const r of rows) { const a = getAssessment(r.assessment_id); if (a) out.add(a.topicId); }
  return out;
}

export type AttemptStatus = "awaiting_review" | "passed" | "failed";
export type AttemptView = {
  id: number; assessmentId: string; version: number; status: AttemptStatus;
  submittedAt: string; reviewedAt: string | null; reviewer: string;
  points: number | null; maxPoints: number | null;
};
export type AnswerView = { itemId: string; response: string; points: number | null; auto: boolean; feedback: string; criteria: Record<string, number>; reviewedAt: string | null };

type AttemptRow = { id: number; assessment_id: string; version: number; status: AttemptStatus; submitted_at: string; reviewed_at: string | null; reviewer: string; points: number | null; max_points: number | null };
const attemptView = (r: AttemptRow): AttemptView => ({
  id: r.id, assessmentId: r.assessment_id, version: r.version, status: r.status, submittedAt: r.submitted_at,
  reviewedAt: r.reviewed_at, reviewer: r.reviewer, points: r.points, maxPoints: r.max_points,
});

export function listAttempts(assessmentId?: string): AttemptView[] {
  const rows = (assessmentId
    ? db().prepare("SELECT * FROM assessment_attempts WHERE user_id = ? AND assessment_id = ? AND status <> 'in_progress' ORDER BY id DESC").all(uid(), assessmentId)
    : db().prepare("SELECT * FROM assessment_attempts WHERE user_id = ? AND status <> 'in_progress' ORDER BY id DESC").all(uid())) as AttemptRow[];
  return rows.map(attemptView);
}

export function getAttempt(id: number): { attempt: AttemptView; answers: AnswerView[] } | null {
  const r = db().prepare("SELECT * FROM assessment_attempts WHERE id = ? AND user_id = ?").get(id, uid()) as AttemptRow | undefined;
  if (!r) return null;
  const answers = (db().prepare("SELECT * FROM attempt_answers WHERE attempt_id = ?").all(id) as {
    item_id: string; response: string; points: number | null; auto: number; feedback: string; criteria: string; reviewed_at: string | null;
  }[]).map((a) => ({
    itemId: a.item_id, response: a.response, points: a.points, auto: !!a.auto, feedback: a.feedback,
    criteria: a.criteria ? (JSON.parse(a.criteria) as Record<string, number>) : {}, reviewedAt: a.reviewed_at,
  }));
  return { attempt: attemptView(r), answers };
}

/**
 * Stores a submitted attempt with its answers in one transaction. The caller grades
 * (lib/assessments/grade.ts); this writes exactly what it is given. Rubric answers arrive
 * with points = null and wait for review. Hand-in links and text become evidence rows.
 */
export function saveAttempt(input: {
  assessmentId: string; version: number; status: AttemptStatus; points: number; maxPoints: number;
  answers: { itemId: string; response: string; points: number | null; auto: boolean; feedback: string }[];
  evidence: { title: string; url: string | null; body: string }[];
}): number {
  const a = getAssessment(input.assessmentId);
  if (!a) throw new Error("Assessment not found");
  const d = db();
  return d.transaction(() => {
    const id = Number(d.prepare(`INSERT INTO assessment_attempts (user_id, assessment_id, version, status, submitted_at, points, max_points)
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?)`).run(uid(), input.assessmentId, input.version, input.status, input.points, input.maxPoints).lastInsertRowid);
    const ins = d.prepare("INSERT INTO attempt_answers (attempt_id, item_id, response, points, auto, feedback) VALUES (?, ?, ?, ?, ?, ?)");
    for (const x of input.answers) ins.run(id, x.itemId, x.response, x.points, x.auto ? 1 : 0, x.feedback);
    const ev = d.prepare("INSERT INTO evidence (user_id, kind, title, url, body, topic_id, attempt_id) VALUES (?, 'submission', ?, ?, ?, ?, ?)");
    for (const e of input.evidence) ev.run(uid(), e.title, e.url, e.body, a.topicId, id);
    if (input.status === "passed") recordPass(id, a.topicId, a.title, input.points, input.maxPoints);
    return id;
  })();
}

function recordPass(attemptId: number, topicId: string, title: string, points: number, max: number) {
  db().prepare(`INSERT INTO evidence (user_id, kind, title, body, topic_id, attempt_id, demonstrated_on)
    VALUES (?, 'score', ?, ?, ?, ?, date('now', 'localtime'))`)
    .run(uid(), `Passed: ${title}`, `${points} of ${max} points`, topicId, attemptId);
}

/**
 * Records a reviewer's scores for rubric items and settles the attempt. `settle` computes
 * the status and total from all answers (grade.ts summarise). Review is possible only while
 * the attempt awaits it, and the reviewer must be named.
 */
export function reviewAttempt(attemptId: number, reviewer: string,
  scores: { itemId: string; points: number; criteria: Record<string, number>; feedback: string }[],
  settle: (answers: { itemId: string; points: number | null }[]) => { status: AttemptStatus; points: number; max: number }) {
  const d = db();
  d.transaction(() => {
    const at = d.prepare("SELECT * FROM assessment_attempts WHERE id = ? AND user_id = ?").get(attemptId, uid()) as AttemptRow | undefined;
    if (!at) throw new Error("Attempt not found");
    if (at.status !== "awaiting_review") throw new Error("This attempt is not awaiting review.");
    if (!reviewer.trim()) throw new Error("Name the reviewer.");
    const a = getAssessment(at.assessment_id);
    if (!a) throw new Error("Assessment not found");
    const up = d.prepare(`UPDATE attempt_answers SET points = ?, criteria = ?, feedback = ?, reviewed_at = datetime('now')
      WHERE attempt_id = ? AND item_id = ? AND auto = 0`);
    for (const s of scores) {
      const r = up.run(s.points, JSON.stringify(s.criteria), s.feedback, attemptId, s.itemId);
      if (r.changes !== 1) throw new Error(`Item ${s.itemId} cannot be reviewed.`);
    }
    const all = d.prepare("SELECT item_id AS itemId, points FROM attempt_answers WHERE attempt_id = ?").all(attemptId) as { itemId: string; points: number | null }[];
    const res = settle(all);
    if (res.status === "awaiting_review") throw new Error("Score every reviewed item before saving.");
    d.prepare("UPDATE assessment_attempts SET status = ?, points = ?, max_points = ?, reviewer = ?, reviewed_at = datetime('now') WHERE id = ?")
      .run(res.status, res.points, res.max, reviewer.trim(), attemptId);
    d.prepare("INSERT INTO evidence (user_id, kind, title, body, topic_id, attempt_id) VALUES (?, 'review', ?, ?, ?, ?)")
      .run(uid(), reviewerLabel(reviewer.trim()), scores.map((s) => s.feedback).filter(Boolean).join("\n\n") || "Scored against the rubric.", a.topicId, attemptId);
    if (res.status === "passed") recordPass(attemptId, a.topicId, a.title, res.points, res.max);
  })();
}

export type EvidenceKind = "submission" | "test_result" | "score" | "project" | "review" | "file_ref";
export type EvidenceView = {
  id: number; kind: EvidenceKind; title: string; url: string | null; body: string;
  topicId: string | null; skillId: string | null; milestoneId: string | null; attemptId: number | null;
  demonstratedOn: string | null; createdAt: string;
};

/** Evidence rows, newest first. topicIds/skillId match either link; milestoneId narrows to one milestone. */
export function listEvidence(filter: { topicIds?: string[]; milestoneId?: string; skillId?: string } = {}): EvidenceView[] {
  const rows = db().prepare("SELECT * FROM evidence WHERE user_id = ? ORDER BY created_at DESC, id DESC").all(uid()) as {
    id: number; kind: EvidenceKind; title: string; url: string | null; body: string; topic_id: string | null; skill_id: string | null;
    milestone_id: string | null; attempt_id: number | null; demonstrated_on: string | null; created_at: string;
  }[];
  const scoped = filter.topicIds !== undefined || filter.skillId !== undefined;
  return rows
    .filter((r) => !scoped
      || (r.topic_id !== null && !!filter.topicIds?.includes(r.topic_id))
      || (filter.skillId !== undefined && r.skill_id === filter.skillId))
    .filter((r) => !filter.milestoneId || r.milestone_id === filter.milestoneId)
    .map((r) => ({
      id: r.id, kind: r.kind, title: r.title, url: r.url, body: r.body, topicId: r.topic_id, skillId: r.skill_id,
      milestoneId: r.milestone_id, attemptId: r.attempt_id, demonstratedOn: r.demonstrated_on, createdAt: r.created_at,
    }));
}

/** Project and practical evidence added by hand (Projects screen). It never makes anything Demonstrated on its own. */
export function addEvidence(e: { kind: "project" | "test_result" | "file_ref"; title: string; url: string | null; body: string; milestoneId: string | null; topicId: string | null; skillId: string | null }) {
  db().prepare("INSERT INTO evidence (user_id, kind, title, url, body, milestone_id, topic_id, skill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(uid(), e.kind, e.title, e.url, e.body, e.milestoneId, e.topicId, e.skillId);
}

export function milestoneExists(id: string): boolean {
  return !!db().prepare("SELECT 1 FROM milestones WHERE id = ?").get(id);
}

export function deleteEvidence(id: number) {
  const r = db().prepare("DELETE FROM evidence WHERE id = ? AND user_id = ? AND attempt_id IS NULL").run(id, uid());
  if (r.changes !== 1) throw new Error("Only evidence you added by hand can be removed; assessment records are kept.");
}

export type AssessmentStatus = "not-attempted" | "awaiting-review" | "failed" | "passed";
export type AssessmentState = { state: AssessmentStatus; attempts: number; bestPercent: number | null; lastAt: string | null };

/** Every registered assessment with this user's state: passed beats awaiting review beats failed. */
export function assessmentStatuses(): Map<string, AssessmentState> {
  const attempts = listAttempts();
  const out = new Map<string, AssessmentState>();
  for (const a of ASSESSMENTS) {
    const mine = attempts.filter((x) => x.assessmentId === a.id);
    const scored = mine
      .filter((x) => x.status !== "awaiting_review" && x.points !== null && x.maxPoints)
      .map((x) => Math.floor((x.points! / x.maxPoints!) * 100));
    const state: AssessmentStatus = mine.some((x) => x.status === "passed") ? "passed"
      : mine.some((x) => x.status === "awaiting_review") ? "awaiting-review"
      : mine.length > 0 ? "failed" : "not-attempted";
    out.set(a.id, { state, attempts: mine.length, bestPercent: scored.length ? Math.max(...scored) : null, lastAt: mine[0]?.submittedAt ?? null });
  }
  return out;
}
