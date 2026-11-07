/**
 * Pure progress rules. "Course completion does not equal mastery" (PRD §21.10)
 * is enforced here (docs/JOURNEY.md §6). Four mastery states:
 *
 *   Learning      (exposed)    — a lesson was watched or read. Exposure only.
 *   Practising    (practised)  — the guided exercise was done.
 *   Proficient    (proficient) — an unfamiliar problem solved independently; evidence required.
 *   Demonstrated               — ONLY a passed assessment (lib/assessments). Never a step a
 *                                learner can tick, never a lesson, never AI-generated text.
 *
 * Subtopic steps are cumulative: practised implies exposed; proficient implies both.
 * Clearing a step clears every step above it.
 */

export type Step = "exposed" | "practised" | "proficient";
export const STEPS: Step[] = ["exposed", "practised", "proficient"];

export type SubtopicProgress = { exposed: boolean; practised: boolean; proficient: boolean };
export const EMPTY: SubtopicProgress = { exposed: false, practised: false, proficient: false };

export type TopicStatus = "not-started" | "ready" | "in-progress" | "completed" | "needs-revision" | "mastered";

export const STATUS_LABEL: Record<TopicStatus, string> = {
  "not-started": "Not started",
  ready: "Ready",
  "in-progress": "In progress",
  completed: "Completed",
  "needs-revision": "Needs revision",
  mastered: "Demonstrated",
};

/** Apply a step toggle, keeping steps cumulative. */
export function applyStep(cur: SubtopicProgress, step: Step, on: boolean): SubtopicProgress {
  const level = STEPS.indexOf(step);
  if (on) {
    return {
      exposed: cur.exposed || level >= 0,
      practised: cur.practised || level >= 1,
      proficient: cur.proficient || level >= 2,
    };
  }
  return {
    exposed: level <= 0 ? false : cur.exposed,
    practised: level <= 1 ? false : cur.practised,
    proficient: false,
  };
}

const DONE: TopicStatus[] = ["completed", "mastered"];
export const isDone = (s: TopicStatus) => DONE.includes(s);

/**
 * "mastered" means Demonstrated: the topic's assessment was passed. Subtopic steps alone
 * top out at "completed", however many are proficient.
 */
export function topicStatus(
  subs: SubtopicProgress[],
  needsRevision: boolean,
  prereqStatuses: TopicStatus[],
  demonstrated = false,
): TopicStatus {
  if (needsRevision) return "needs-revision";
  if (demonstrated) return "mastered";
  if (subs.length > 0 && subs.every((s) => s.practised)) return "completed";
  if (subs.some((s) => s.exposed || s.practised || s.proficient)) return "in-progress";
  if (prereqStatuses.every(isDone)) return "ready";
  return "not-started";
}

/**
 * Resolve statuses for every topic in prerequisite order. Topics must form a DAG;
 * a cycle (bad curriculum edit) is reported, not looped on.
 */
export function resolveTopicStatuses(
  topics: { id: string; prerequisites: string[]; subs: SubtopicProgress[]; needsRevision: boolean; demonstrated?: boolean }[],
): Map<string, TopicStatus> {
  const byId = new Map(topics.map((t) => [t.id, t]));
  const out = new Map<string, TopicStatus>();
  const visiting = new Set<string>();
  const visit = (id: string): TopicStatus => {
    const known = out.get(id);
    if (known) return known;
    const t = byId.get(id);
    if (!t) return "not-started"; // unknown prerequisite: never satisfied
    if (visiting.has(id)) throw new Error(`Curriculum prerequisite cycle at topic "${id}"`);
    visiting.add(id);
    const s = topicStatus(t.subs, t.needsRevision, t.prerequisites.map(visit), !!t.demonstrated);
    visiting.delete(id);
    out.set(id, s);
    return s;
  };
  topics.forEach((t) => visit(t.id));
  return out;
}

export type Counts = { total: number; exposed: number; practised: number; proficient: number };

export function count(subs: SubtopicProgress[]): Counts {
  return {
    total: subs.length,
    exposed: subs.filter((s) => s.exposed).length,
    practised: subs.filter((s) => s.practised).length,
    proficient: subs.filter((s) => s.proficient).length,
  };
}

/** Whole-number percentage, floored so 99.6% never prints as 100%. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.floor((part / whole) * 100);
}

/** The current phase is the first one whose topics are not all done. Null when all are done. */
export function currentPhaseIndex(phaseTopicStatuses: TopicStatus[][]): number | null {
  const i = phaseTopicStatuses.findIndex((ts) => ts.length === 0 || !ts.every(isDone));
  return i === -1 ? null : i;
}

export type RoadMonth = { month: number; phaseId: string; total: number; practised: number };

/** Per-month fill for the Milestone Road. */
export function roadMonths(
  subs: { month: number; phaseId: string; practised: boolean }[],
  phases: { id: string; months: [number, number] }[],
  totalMonths = 24,
): RoadMonth[] {
  return Array.from({ length: totalMonths }, (_, i) => {
    const month = i + 1;
    const phase = phases.find((p) => month >= p.months[0] && month <= p.months[1]);
    const inMonth = subs.filter((s) => s.month === month);
    return { month, phaseId: phase?.id ?? "", total: inMonth.length, practised: inMonth.filter((s) => s.practised).length };
  });
}

/** A percentage for display: never prints 0% when something is done, never 100% when something is not. */
export function pctLabel(part: number, whole: number): string {
  if (whole <= 0) return "0%";
  const p = pct(part, whole);
  if (p === 0 && part > 0) return "under 1%";
  return `${p}%`;
}

/* ---------------------------------------------------------------- mastery */

export type Mastery = "none" | "learning" | "practising" | "proficient" | "demonstrated";
export const MASTERY_ORDER: Mastery[] = ["none", "learning", "practising", "proficient", "demonstrated"];
export const MASTERY_LABEL: Record<Mastery, string> = {
  none: "Not started", learning: "Learning", practising: "Practising", proficient: "Proficient", demonstrated: "Demonstrated",
};

export function subtopicMastery(p: SubtopicProgress): Exclude<Mastery, "demonstrated"> {
  return p.proficient ? "proficient" : p.practised ? "practising" : p.exposed ? "learning" : "none";
}

/**
 * A topic's mastery: Demonstrated if its assessment is passed; otherwise the highest
 * state that EVERY subtopic has reached, except that any activity at all counts as Learning.
 */
export function topicMastery(subs: SubtopicProgress[], demonstrated: boolean): Mastery {
  if (demonstrated) return "demonstrated";
  if (subs.length === 0) return "none";
  if (subs.every((s) => s.proficient)) return "proficient";
  if (subs.every((s) => s.practised)) return "practising";
  if (subs.some((s) => s.exposed)) return "learning";
  return "none";
}

/** A skill holds the lowest state across the topics it depends on. */
export function lowestMastery(states: Mastery[]): Mastery {
  if (states.length === 0) return "none";
  return states.reduce((lo, s) => (MASTERY_ORDER.indexOf(s) < MASTERY_ORDER.indexOf(lo) ? s : lo));
}
