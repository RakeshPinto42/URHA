/**
 * Grading rules (docs/JOURNEY.md §6). Pure except for SQL, which runs in the sandbox.
 *
 * - Choice and debugging items: all-or-nothing on the exact set of correct options.
 * - SQL items: the learner's result set must equal the reference query's on the fixture.
 * - Rubric items: no automatic score at all. A named reviewer scores each criterion.
 * - An attempt passes when every item is scored, the total reaches passPercent, and every
 *   required item reaches REQUIRED_SHARE of its points.
 */
import { isAuto, maxPoints, REQUIRED_SHARE, type Assessment, type AutoItem, type Item, type McqItem, type DebugItem } from "./types";

export type Graded = { itemId: string; response: string; points: number | null; auto: boolean; feedback: string };

export function parseChoice(response: string): number[] {
  try {
    const v = JSON.parse(response);
    return Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n)))].sort((a, b) => a - b) : [];
  } catch {
    return [];
  }
}

export function gradeChoice(item: McqItem | DebugItem, response: string): Graded {
  const chosen = parseChoice(response).filter((n) => n >= 0 && n < item.options.length);
  const want = [...item.correct].sort((a, b) => a - b);
  const right = chosen.length === want.length && chosen.every((n, i) => n === want[i]);
  const answer = want.map((n) => item.options[n]).join("; ");
  return {
    itemId: item.id, response: JSON.stringify(chosen), auto: true, points: right ? item.points : 0,
    feedback: right ? item.explain : `${chosen.length === 0 ? "No option was chosen. " : ""}The correct answer: ${answer}. ${item.explain}`,
  };
}

export type SqlRunner = (fixture: string, query: string) => Promise<{ ok: true; columns: string[]; rows: unknown[][]; truncated: boolean } | { ok: false; error: string }>;
export type SqlComparer = (got: { columns: string[]; rows: unknown[][] }, want: { columns: string[]; rows: unknown[][] }, ordered: boolean) => { equal: true } | { equal: false; reason: string };

export async function gradeAuto(item: AutoItem, response: string, run: SqlRunner, compare: SqlComparer): Promise<Graded> {
  if (item.type !== "sql") return gradeChoice(item, response);
  const query = response.trim();
  if (!query) return { itemId: item.id, response: "", auto: true, points: 0, feedback: `No query was submitted. ${item.explain}` };
  const [got, want] = await Promise.all([run(item.fixture, query), run(item.fixture, item.reference)]);
  if (!want.ok) throw new Error(`Reference query for ${item.id} failed: ${want.error}`);
  if (!got.ok) return { itemId: item.id, response: query, auto: true, points: 0, feedback: `The query did not run: ${got.error}` };
  const c = compare(got, want, item.ordered);
  return c.equal
    ? { itemId: item.id, response: query, auto: true, points: item.points, feedback: `Correct result (${want.rows.length} row${want.rows.length === 1 ? "" : "s"}). ${item.explain}` }
    : { itemId: item.id, response: query, auto: true, points: 0, feedback: `${c.reason} ${item.explain}` };
}

export type Summary = {
  points: number; max: number; percent: number;
  pendingReview: number;        // rubric items not yet scored
  failedRequired: string[];     // required item ids below REQUIRED_SHARE
  status: "awaiting_review" | "passed" | "failed";
};

export function summarise(a: Assessment, answers: { itemId: string; points: number | null }[]): Summary {
  const byId = new Map(answers.map((x) => [x.itemId, x]));
  const max = maxPoints(a);
  let points = 0, pending = 0;
  const failedRequired: string[] = [];
  for (const item of a.items) {
    const ans = byId.get(item.id);
    const p = ans?.points;
    if (p === null || p === undefined) {
      if (isAuto(item)) failedRequired.push(...(item.required ? [item.id] : [])); // unanswered auto item scores 0
      else pending++;
      continue;
    }
    points += Math.min(p, item.points);
    if (item.required && p < item.points * REQUIRED_SHARE) failedRequired.push(item.id);
  }
  const percent = max > 0 ? Math.floor((points / max) * 100) : 0;
  const status = pending > 0 ? "awaiting_review" : percent >= a.passPercent && failedRequired.length === 0 ? "passed" : "failed";
  return { points, max, percent, pendingReview: pending, failedRequired, status };
}

/** Subtopic ids to revise for the items that lost points, in curriculum order of appearance. */
export function revisionFor(a: Assessment, answers: { itemId: string; points: number | null }[]): string[] {
  const byId = new Map(answers.map((x) => [x.itemId, x.points]));
  const out: string[] = [];
  for (const item of a.items) {
    const p = byId.get(item.id);
    if (p === null || p === undefined || p < item.points) {
      for (const r of item.revise) {
        const id = r.includes(":") ? r : `${a.topicId}:${r}`;
        if (!out.includes(id)) out.push(id);
      }
    }
  }
  return out;
}

/** Validates reviewer scores for a rubric item: one integer-or-half score per criterion within bounds. */
export function scoreRubric(item: Item, scores: Record<string, number>): { ok: true; points: number } | { ok: false; error: string } {
  if (isAuto(item)) return { ok: false, error: "This item is scored automatically." };
  let total = 0;
  for (const c of item.rubric) {
    const s = scores[c.id];
    if (s === undefined || !Number.isFinite(s)) return { ok: false, error: `Score "${c.label}".` };
    if (s < 0 || s > c.points || Math.round(s * 2) !== s * 2) return { ok: false, error: `"${c.label}" takes 0 to ${c.points} in steps of 0.5.` };
    total += s;
  }
  return { ok: true, points: total };
}
