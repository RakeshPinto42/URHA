/**
 * Practice progress, kept in URHA's own database beside the rest of the learner's progress.
 * Every run that reaches its checks is recorded; an exercise is passed once any attempt passed.
 * Server-only.
 */
import "server-only";
import { getDb, LOCAL_USER_ID } from "../db";
import { EXERCISES, exerciseById, type Discipline } from "./exercises";

export const MAX_CODE = 50_000;

export type AttemptInput = { exerciseId: string; passed: boolean; checksPassed: number; checksTotal: number; seconds: number; code: string };

/** Validates a recorded attempt. The checks run in the learner's browser, so this is their own record, not a proof. */
export function parseAttempt(body: Record<string, unknown>): { ok: true; value: AttemptInput } | { ok: false; error: string } {
  const { exerciseId, passed, checksPassed, checksTotal, seconds, code } = body;
  if (typeof exerciseId !== "string" || !exerciseById(exerciseId)) return { ok: false, error: "Unknown exercise." };
  if (typeof passed !== "boolean") return { ok: false, error: "passed must be true or false." };
  const int = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 100;
  if (!int(checksPassed) || !int(checksTotal) || (checksPassed as number) > (checksTotal as number)) return { ok: false, error: "Check counts are not valid." };
  if (passed && checksPassed !== checksTotal) return { ok: false, error: "A pass needs every check passed." };
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0 || seconds > 600) return { ok: false, error: "seconds is not valid." };
  if (typeof code !== "string" || code.length > MAX_CODE) return { ok: false, error: "The code is missing or too long." };
  return { ok: true, value: { exerciseId, passed, checksPassed: checksPassed as number, checksTotal: checksTotal as number, seconds, code } };
}

export function recordAttempt(a: AttemptInput) {
  getDb().prepare(`INSERT INTO practice_attempts (user_id, exercise_id, passed, checks_passed, checks_total, seconds, code)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(LOCAL_USER_ID, a.exerciseId, a.passed ? 1 : 0, a.checksPassed, a.checksTotal, a.seconds, a.code);
}

export type ExerciseStatus = { attempts: number; passed: boolean; passedAt: string | null; lastAt: string | null; lastCode: string | null; bestChecks: number; checksTotal: number };

/** One entry per exercise attempted. Codes are the latest attempt's, to resume where the learner left off. */
export function practiceStatus(): Record<string, ExerciseStatus> {
  const rows = getDb().prepare(`
    SELECT exercise_id, COUNT(*) AS attempts, MAX(passed) AS passed, MIN(CASE WHEN passed = 1 THEN created_at END) AS passed_at,
           MAX(created_at) AS last_at, MAX(checks_passed) AS best, MAX(checks_total) AS total,
           (SELECT code FROM practice_attempts p2 WHERE p2.user_id = p.user_id AND p2.exercise_id = p.exercise_id ORDER BY p2.created_at DESC, p2.id DESC LIMIT 1) AS last_code
    FROM practice_attempts p WHERE user_id = ? GROUP BY exercise_id`).all(LOCAL_USER_ID) as {
      exercise_id: string; attempts: number; passed: number; passed_at: string | null; last_at: string | null; best: number; total: number; last_code: string | null;
    }[];
  return Object.fromEntries(rows.map((r) => [r.exercise_id, {
    attempts: r.attempts, passed: r.passed === 1, passedAt: r.passed_at, lastAt: r.last_at, lastCode: r.last_code, bestChecks: r.best, checksTotal: r.total,
  }]));
}

/** Passed out of available, by discipline, for the Grounds of Practice. */
export function practiceByDiscipline(status = practiceStatus()): Record<Discipline, { passed: number; total: number }> {
  const out = {} as Record<Discipline, { passed: number; total: number }>;
  for (const e of EXERCISES) {
    const d = (out[e.discipline] ??= { passed: 0, total: 0 });
    d.total += 1;
    if (status[e.id]?.passed) d.passed += 1;
  }
  return out;
}

/** Recently passed exercises, for achievements. */
export function recentPasses(limit = 4): { exerciseId: string; at: string }[] {
  return (getDb().prepare(`SELECT exercise_id, MIN(created_at) AS at FROM practice_attempts WHERE user_id = ? AND passed = 1
    GROUP BY exercise_id ORDER BY at DESC LIMIT ?`).all(LOCAL_USER_ID, limit) as { exercise_id: string; at: string }[]).map((r) => ({ exerciseId: r.exercise_id, at: r.at }));
}
