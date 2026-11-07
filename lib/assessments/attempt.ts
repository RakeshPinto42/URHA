/**
 * Turns validated answers into a gradable attempt. Choice and SQL items are scored here,
 * deterministically; rubric items stay unscored (null) until a named reviewer scores them.
 */
import "server-only";
import { gradeAuto, summarise, type Graded, type Summary } from "./grade";
import { compareResults, runSql } from "./sql";
import { isAuto, TYPE_LABEL, type Assessment } from "./types";

export type AnswerInput = { itemId: string; response: string; text: string; url: string | null };

export type GradedAttempt = {
  answers: Graded[];
  evidence: { title: string; url: string | null; body: string }[];
  summary: Summary;
};

export async function gradeAttempt(a: Assessment, input: AnswerInput[]): Promise<GradedAttempt> {
  const byId = new Map(input.map((x) => [x.itemId, x]));
  const answers: Graded[] = [];
  const evidence: GradedAttempt["evidence"] = [];
  for (const item of a.items) {
    const ans = byId.get(item.id);
    if (isAuto(item)) {
      answers.push(await gradeAuto(item, ans?.response ?? "", runSql, compareResults));
      continue;
    }
    answers.push({
      itemId: item.id, auto: false, points: null, feedback: "",
      response: JSON.stringify({ text: ans?.text ?? "", url: ans?.url ?? null }),
    });
    evidence.push({ title: `${a.title}: ${TYPE_LABEL[item.type].toLowerCase()} hand-in`, url: ans?.url ?? null, body: ans?.text ?? "" });
  }
  return { answers, evidence, summary: summarise(a, answers) };
}

/** A hand-in as stored in attempt_answers.response. Tolerates older plain-text rows. */
export function readHandIn(response: string): { text: string; url: string | null } {
  try {
    const v = JSON.parse(response) as { text?: unknown; url?: unknown };
    return { text: typeof v.text === "string" ? v.text : "", url: typeof v.url === "string" ? v.url : null };
  } catch {
    return { text: response, url: null };
  }
}
