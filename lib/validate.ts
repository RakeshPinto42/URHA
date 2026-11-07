/**
 * Boundary validation for everything arriving from forms / Server Actions.
 * Pure (no DB): existence of referenced ids is checked in the action.
 * Returns either a typed value or field errors with human messages.
 */
import { isIsoDate } from "./dates";
import { STEPS, type Step } from "./progress";
import { CATEGORIES, PRIORITIES, RECURRENCES, STATUSES, type Category, type Priority, type Recurrence, type TaskStatus } from "./taskLogic";
import type { TaskInput } from "./data";
import { isAuto, MAX_QUERY_CHARS, type Assessment } from "./assessments/types";
import { scoreRubric } from "./assessments/grade";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
const optId = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === "" ? null : v;
};
const ID = /^[a-z0-9:-]{1,120}$/;

function minutes(raw: string, field: string, errors: Record<string, string>): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 1440) {
    errors[field] = "Enter whole minutes between 0 and 1440.";
    return null;
  }
  return n;
}

function limit(v: string, max: number, field: string, errors: Record<string, string>) {
  if (v.length > max) errors[field] = `Keep this under ${max} characters.`;
  return v;
}

export function parseTaskForm(fd: FormData): Result<TaskInput> {
  const errors: Record<string, string> = {};
  const title = limit(str(fd, "title"), 200, "title", errors);
  if (!title) errors.title = "Give the task a title.";
  const category = str(fd, "category") as Category;
  if (!CATEGORIES.includes(category)) errors.category = "Choose a category.";
  const priority = Number(str(fd, "priority") || "2") as Priority;
  if (!PRIORITIES.includes(priority)) errors.priority = "Choose a priority.";
  const recurrence = (str(fd, "recurrence") || "none") as Recurrence;
  if (!RECURRENCES.includes(recurrence)) errors.recurrence = "Choose how it repeats.";
  const dueDate = optId(fd, "dueDate");
  if (dueDate && !isIsoDate(dueDate)) errors.dueDate = "Use a real date.";
  if (recurrence !== "none" && !dueDate) errors.dueDate = "A repeating task needs a due date to repeat from.";
  const ids = ["phaseId", "topicId", "skillId", "resourceId"].map((k) => {
    const v = optId(fd, k);
    if (v && !ID.test(v)) errors[k] = "Unknown reference.";
    return v;
  });
  const value: TaskInput = {
    title, category, priority, recurrence, dueDate,
    description: limit(str(fd, "description"), 4000, "description", errors),
    deliverable: limit(str(fd, "deliverable"), 500, "deliverable", errors),
    estMinutes: minutes(str(fd, "estMinutes"), "estMinutes", errors),
    phaseId: ids[0]!, topicId: ids[1]!, skillId: ids[2]!, resourceId: ids[3]!,
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function parseStatusChange(fd: FormData): Result<{ id: number; status: TaskStatus; actualMinutes: number | null; completionNotes: string; blockedReason: string }> {
  const errors: Record<string, string> = {};
  const id = Number(str(fd, "id"));
  if (!Number.isInteger(id) || id <= 0) errors.id = "Unknown task.";
  const status = str(fd, "status") as TaskStatus;
  if (!STATUSES.includes(status)) errors.status = "Unknown status.";
  const actualMinutes = minutes(str(fd, "actualMinutes"), "actualMinutes", errors);
  const completionNotes = limit(str(fd, "completionNotes"), 2000, "completionNotes", errors);
  const blockedReason = limit(str(fd, "blockedReason"), 500, "blockedReason", errors);
  if (status === "blocked" && !blockedReason) errors.blockedReason = "Say what it is blocked on.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { id, status, actualMinutes, completionNotes, blockedReason } };
}

export function parseStep(fd: FormData): Result<{ subtopicId: string; step: Step; on: boolean; evidence: string | null }> {
  const errors: Record<string, string> = {};
  const subtopicId = str(fd, "subtopicId");
  if (!ID.test(subtopicId)) errors.subtopicId = "Unknown subtopic.";
  const step = str(fd, "step") as Step;
  if (!STEPS.includes(step)) errors.step = "Unknown step.";
  const on = str(fd, "on") === "1";
  const evidence = limit(str(fd, "evidence"), 2000, "evidence", errors) || null;
  if (step === "proficient" && on && !evidence) errors.evidence = "Describe or link the evidence of independent work: a commit, test run, demo or write-up.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { subtopicId, step, on, evidence } };
}

/** Only absolute http(s) URLs; never javascript:, data:, file:. */
export function parseUrl(raw: string, { httpsOnly = false } = {}): string | null | "invalid" {
  if (raw === "") return null;
  try {
    const u = new URL(raw);
    if (httpsOnly ? u.protocol !== "https:" : !["http:", "https:"].includes(u.protocol)) return "invalid";
    if (u.username || u.password) return "invalid";
    return u.toString();
  } catch {
    return "invalid";
  }
}

export function parseResourceForm(fd: FormData): Result<{ id: string; url: string | null; sections: string; hours: number | null }> {
  const errors: Record<string, string> = {};
  const id = str(fd, "id");
  if (!ID.test(id)) errors.id = "Unknown resource.";
  const url = parseUrl(str(fd, "url"));
  if (url === "invalid") errors.url = "Paste a full http(s) link.";
  const hoursRaw = str(fd, "hours");
  const hours = hoursRaw === "" ? null : Number(hoursRaw);
  if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 500)) errors.hours = "Hours between 0 and 500.";
  const sections = limit(str(fd, "sections"), 1000, "sections", errors);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { id, url: url === "invalid" ? null : url, sections, hours } };
}

export function parseSettings(fd: FormData): Result<{ startDate: string; weeklyTargetHours: number; name: string }> {
  const errors: Record<string, string> = {};
  const startDate = str(fd, "startDate");
  if (!isIsoDate(startDate)) errors.startDate = "Choose the date your path begins.";
  const weeklyTargetHours = Number(str(fd, "weeklyTargetHours"));
  if (!Number.isFinite(weeklyTargetHours) || weeklyTargetHours < 1 || weeklyTargetHours > 80) errors.weeklyTargetHours = "Between 1 and 80 hours.";
  const name = limit(str(fd, "name"), 60, "name", errors);
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { startDate, weeklyTargetHours, name } };
}

export function parseReflection(fd: FormData): Result<{ passageId: string; stoodOut: string; understood: string; questioned: string; apply: string; personal: string }> {
  const errors: Record<string, string> = {};
  const passageId = str(fd, "passageId");
  if (!ID.test(passageId)) errors.passageId = "Unknown passage.";
  const f = (k: string) => limit(str(fd, k), 4000, k, errors);
  const value = { passageId, stoodOut: f("stoodOut"), understood: f("understood"), questioned: f("questioned"), apply: f("apply"), personal: f("personal") };
  if (!value.stoodOut && !value.understood && !value.questioned && !value.apply && !value.personal) errors.form = "Write at least one answer before saving.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function parseAudioForm(fd: FormData): Result<{ passageId: string; url: string; label: string; licence: string }> {
  const errors: Record<string, string> = {};
  const passageId = str(fd, "passageId");
  if (!ID.test(passageId)) errors.passageId = "Unknown passage.";
  const url = parseUrl(str(fd, "url"), { httpsOnly: true });
  if (url === null || url === "invalid") errors.url = "Paste a full https link to an audio file you are licensed to play.";
  const label = limit(str(fd, "label"), 120, "label", errors);
  const licence = limit(str(fd, "licence"), 200, "licence", errors);
  if (!licence) errors.licence = "Record the licence or permission for this recording.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { passageId, url: url as string, label, licence } };
}

/* ---------------------------------------------------------------- assessments */

export type AttemptAnswer = { itemId: string; response: string; text: string; url: string | null };

/** Every question must be answered before an attempt is graded, so a stray click cannot burn an attempt. */
export function parseAttemptForm(a: Assessment, fd: FormData): Result<AttemptAnswer[]> {
  const errors: Record<string, string> = {};
  const out: AttemptAnswer[] = [];
  for (const item of a.items) {
    const key = `item:${item.id}`;
    if (item.type === "mcq" || item.type === "debug") {
      const chosen = fd.getAll(key).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < item.options.length);
      if (chosen.length === 0) errors[key] = "Choose an answer.";
      out.push({ itemId: item.id, response: JSON.stringify(chosen), text: "", url: null });
    } else if (item.type === "sql") {
      const query = str(fd, key);
      if (!query) errors[key] = "Write a query.";
      else limit(query, MAX_QUERY_CHARS, key, errors);
      out.push({ itemId: item.id, response: query, text: "", url: null });
    } else {
      const text = limit(str(fd, key), 20_000, key, errors);
      const rawUrl = str(fd, `${key}:url`);
      const url = parseUrl(rawUrl);
      if (url === "invalid") errors[`${key}:url`] = "Paste a full http(s) link.";
      if (item.evidence !== "url" && !text) errors[key] = "Write your answer.";
      if (item.evidence !== "text" && !rawUrl) errors[`${key}:url`] = "Link the work: a repository, pull request or test run.";
      out.push({ itemId: item.id, response: "", text, url: url === "invalid" ? null : url });
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out };
}

export type ReviewInput = { reviewer: string; scores: { itemId: string; points: number; criteria: Record<string, number>; feedback: string }[] };

/** Reviewer scores for every rubric item. "self" is stored as such and always labelled self-reviewed. */
export function parseReviewForm(a: Assessment, fd: FormData): Result<ReviewInput> {
  const errors: Record<string, string> = {};
  const who = str(fd, "who");
  const name = limit(str(fd, "reviewerName"), 120, "reviewerName", errors);
  if (who !== "self" && who !== "other") errors.who = "Say who reviewed this.";
  if (who === "other" && !name) errors.reviewerName = "Name the reviewer.";
  if (who === "other" && name.toLowerCase() === "self") errors.reviewerName = "Choose “I reviewed my own work” instead.";
  const scores: ReviewInput["scores"] = [];
  for (const item of a.items) {
    if (isAuto(item)) continue;
    const criteria: Record<string, number> = {};
    for (const c of item.rubric) {
      const raw = str(fd, `score:${item.id}:${c.id}`);
      if (raw !== "") criteria[c.id] = Number(raw);
    }
    const scored = scoreRubric(item, criteria);
    if (!scored.ok) errors[`score:${item.id}`] = scored.error;
    else scores.push({ itemId: item.id, points: scored.points, criteria, feedback: limit(str(fd, `feedback:${item.id}`), 4000, `score:${item.id}`, errors) });
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { reviewer: who === "self" ? "self" : name, scores } };
}

export type EvidenceInput = { kind: "project" | "test_result" | "file_ref"; title: string; url: string | null; body: string; milestoneId: string; topicId: string };

export function parseEvidenceForm(fd: FormData): Result<EvidenceInput> {
  const errors: Record<string, string> = {};
  const kind = str(fd, "kind") as EvidenceInput["kind"];
  if (!["project", "test_result", "file_ref"].includes(kind)) errors.kind = "Choose what this is.";
  const title = limit(str(fd, "title"), 200, "title", errors);
  if (!title) errors.title = "Name this evidence.";
  const body = limit(str(fd, "body"), 4000, "body", errors);
  const url = parseUrl(str(fd, "url"));
  if (url === "invalid") errors.url = "Paste a full http(s) link.";
  if (url === null && !body) errors.url = "Link the work, or describe it in the note.";
  const milestoneId = str(fd, "milestoneId"), topicId = str(fd, "topicId");
  if (!ID.test(milestoneId)) errors.milestoneId = "Unknown milestone.";
  if (!ID.test(topicId)) errors.topicId = "Choose the topic this shows.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { kind, title, body, url: url === "invalid" ? null : url, milestoneId, topicId } };
}
