"use server";
/**
 * Server Actions. Each one: validate (lib/validate.ts) → check references exist →
 * write through lib/data.ts → revalidate. Returns a small state object for
 * useActionState; never raw rows.
 *
 * Auth: Release 1 is single-user and the server binds to 127.0.0.1 (package.json).
 * Next.js's built-in Origin/Host check blocks cross-site posts. Before exposing
 * URHA beyond localhost, add authentication here (docs/ARCHITECTURE.md §Security).
 */
import { revalidatePath } from "next/cache";
import * as data from "@/lib/data";
import { COLLECTIONS, findPassage, isTranslation } from "@/lib/scripture";
import { BOOKS } from "@/lib/narration";
import {
  parseAttemptForm, parseAudioForm, parseEvidenceForm, parseReflection, parseResourceForm, parseReviewForm, parseSettings, parseStatusChange, parseStep, parseTaskForm,
} from "@/lib/validate";
import { getAssessment } from "@/lib/assessments";
import { gradeAttempt } from "@/lib/assessments/attempt";
import { summarise } from "@/lib/assessments/grade";
import { runSql, type SqlResult } from "@/lib/assessments/sql";
import { FIXTURES } from "@/lib/assessments/fixtures";
import { MAX_QUERY_CHARS } from "@/lib/assessments/types";
import { STATUSES, type TaskStatus } from "@/lib/taskLogic";

/** `values` echoes what was submitted on a validation failure so the form keeps the user's input after React resets it. */
export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string>; values?: Record<string, string>; href?: string } | null;

const echo = (fd: FormData): Record<string, string> =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v).slice(0, 4000)]));
const fail = (message: string, errors?: Record<string, string>, fd?: FormData): ActionState => ({ ok: false, message, errors, values: fd ? echo(fd) : undefined });

function refreshAll() {
  revalidatePath("/", "layout");
}

function guard(fn: () => ActionState): ActionState {
  try {
    return fn();
  } catch (e) {
    // Log server-side with context; return a safe message (no stack, no SQL).
    console.error("[urha action]", e);
    const msg = e instanceof Error && /required|not found/i.test(e.message) ? e.message : "Could not save. Nothing was changed — try again.";
    return fail(msg);
  }
}

/* settings */
export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseSettings(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  return guard(() => {
    data.setSetting("start_date", r.value.startDate);
    data.setSetting("weekly_target_hours", String(r.value.weeklyTargetHours));
    data.setSetting("name", r.value.name);
    refreshAll();
    return { ok: true, message: "Saved." };
  });
}

/* progress */
export async function toggleStep(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseStep(fd);
  if (!r.ok) return fail(r.errors.evidence ?? "That change could not be applied.", r.errors, fd);
  return guard(() => {
    data.setStep(r.value.subtopicId, r.value.step, r.value.on, r.value.evidence);
    refreshAll();
    return { ok: true };
  });
}

export async function setRevision(_: ActionState, fd: FormData): Promise<ActionState> {
  const topicId = String(fd.get("topicId") ?? "");
  if (!data.topicExists(topicId)) return fail("Unknown topic.");
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 1000);
  return guard(() => {
    data.setRevision(topicId, fd.get("on") === "1", notes);
    refreshAll();
    return { ok: true };
  });
}

export async function saveResource(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseResourceForm(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  return guard(() => {
    data.updateResource(r.value.id, r.value);
    refreshAll();
    return { ok: true, message: "Resource saved. A changed link is marked unchecked until the link check runs." };
  });
}

/* assessments */

/** Grades and stores an attempt; `href` sends the learner to its result. No model is involved at any step. */
export async function submitAttempt(_: ActionState, fd: FormData): Promise<ActionState> {
  const a = getAssessment(String(fd.get("assessmentId") ?? ""));
  if (!a) return fail("Unknown assessment.");
  const r = parseAttemptForm(a, fd);
  if (!r.ok) return fail(`${Object.keys(r.errors).length} answer${Object.keys(r.errors).length === 1 ? " needs" : "s need"} attention. Your work is still here.`, r.errors);
  try {
    const g = await gradeAttempt(a, r.value);
    const id = data.saveAttempt({
      assessmentId: a.id, version: a.version, status: g.summary.status, points: g.summary.points, maxPoints: g.summary.max,
      answers: g.answers, evidence: g.evidence,
    });
    refreshAll();
    return { ok: true, href: `/assessments/attempt/${id}` };
  } catch (e) {
    console.error("[urha action]", e);
    return fail("The attempt could not be graded, so nothing was recorded. Your work is still here; try again.");
  }
}

/** Try a query against the fixture before submitting. Shows the result only, never whether it is right. */
export async function previewSql(fixtureId: string, query: string): Promise<SqlResult> {
  if (!FIXTURES[fixtureId]) return { ok: false, error: "Unknown dataset." };
  if (typeof query !== "string" || query.length > MAX_QUERY_CHARS) return { ok: false, error: `Keep the query under ${MAX_QUERY_CHARS} characters.` };
  return runSql(fixtureId, query);
}

export async function submitReview(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("attemptId"));
  const found = Number.isInteger(id) && id > 0 ? data.getAttempt(id) : null;
  const a = found ? getAssessment(found.attempt.assessmentId) : undefined;
  if (!found || !a) return fail("Unknown attempt.");
  const r = parseReviewForm(a, fd);
  if (!r.ok) return fail("Score every criterion and name the reviewer.", r.errors, fd);
  try {
    data.reviewAttempt(id, r.value.reviewer, r.value.scores, (answers) => {
      const s = summarise(a, answers);
      return { status: s.status, points: s.points, max: s.max };
    });
    refreshAll();
    return { ok: true, message: "Review saved." };
  } catch (e) {
    console.error("[urha action]", e);
    return fail(e instanceof Error && /awaiting review/.test(e.message) ? e.message : "The review could not be saved. Nothing was changed.", undefined, fd);
  }
}

export async function addProjectEvidence(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseEvidenceForm(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  if (!data.milestoneExists(r.value.milestoneId) || !data.topicExists(r.value.topicId)) return fail("Unknown milestone or topic.", undefined, fd);
  return guard(() => {
    data.addEvidence({ ...r.value, skillId: null });
    refreshAll();
    return { ok: true, message: "Evidence added. It supports the topic; only a passed assessment makes it Demonstrated." };
  });
}

export async function removeEvidence(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Unknown evidence.");
  try {
    data.deleteEvidence(id);
    refreshAll();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not remove that.");
  }
}

/* tasks */
function checkRefs(v: { phaseId: string | null; topicId: string | null; skillId: string | null; resourceId: string | null }): string | null {
  const path = data.getPath();
  if (v.phaseId && !path.phases.some((p) => p.id === v.phaseId)) return "Unknown phase.";
  if (v.topicId && !path.topicTitles[v.topicId]) return "Unknown topic.";
  if (v.skillId && !data.getSkills().some((s) => s.id === v.skillId)) return "Unknown skill.";
  if (v.resourceId && !data.getResources().some((r) => r.id === v.resourceId)) return "Unknown resource.";
  return null;
}

export async function createTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseTaskForm(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  const bad = checkRefs(r.value);
  if (bad) return fail(bad, undefined, fd);
  return guard(() => {
    data.createTask(r.value);
    refreshAll();
    return { ok: true, message: `Added “${r.value.title}”.` };
  });
}

export async function updateTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("Unknown task.");
  const r = parseTaskForm(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  const bad = checkRefs(r.value);
  if (bad) return fail(bad);
  return guard(() => {
    data.updateTask(id, r.value);
    refreshAll();
    return { ok: true, message: "Task updated." };
  });
}

export async function changeTaskStatus(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseStatusChange(fd);
  if (!r.ok) return fail(Object.values(r.errors)[0] ?? "Could not change status.", r.errors);
  return guard(() => {
    data.setTaskStatus(r.value.id, r.value.status, r.value);
    refreshAll();
    return { ok: true };
  });
}

/** Quick status change from a row button (no extra fields). */
export async function quickStatus(id: number, status: TaskStatus): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0 || !STATUSES.includes(status) || status === "blocked") return fail("Unknown change.");
  return guard(() => {
    data.setTaskStatus(id, status, {});
    refreshAll();
    return { ok: true };
  });
}

export async function deleteTask(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = Number(fd.get("id"));
  if (!Number.isInteger(id) || id <= 0) return fail("Unknown task.");
  return guard(() => {
    data.deleteTask(id);
    refreshAll();
    return { ok: true, message: "Task deleted." };
  });
}

/* meditation */
export async function recordListening(passageId: string, translation: string, verseIndex: number, finished: boolean): Promise<ActionState> {
  if (!isListeningTarget(passageId) || !isTranslation(translation) || !Number.isInteger(verseIndex) || verseIndex < 0 || verseIndex > 500) {
    return fail("Unknown passage.");
  }
  return guard(() => {
    data.saveListening(passageId, translation, verseIndex, finished);
    return { ok: true };
  });
}

export async function toggleBookmark(passageId: string, on: boolean): Promise<ActionState> {
  if (!findPassage(passageId)) return fail("Unknown passage.");
  return guard(() => {
    data.setBookmark(passageId, on);
    revalidatePath("/meditation", "layout");
    return { ok: true };
  });
}

export async function saveReflection(_: ActionState, fd: FormData): Promise<ActionState> {
  const r = parseReflection(fd);
  if (!r.ok) return fail(r.errors.form ?? "Check the highlighted fields.", r.errors, fd);
  if (!findPassage(r.value.passageId)) return fail("Unknown passage.");
  return guard(() => {
    data.addPassageReflection(r.value.passageId, r.value);
    revalidatePath("/meditation", "layout");
    return { ok: true, message: "Reflection saved privately on this device." };
  });
}

/** A listening target is a curated passage id, or a chapter opened in the reader: "read:<Book>:<chapter>". */
function isListeningTarget(id: string): boolean {
  if (findPassage(id)) return true;
  const m = id.match(/^read:([1-3]? ?[A-Za-z ]{2,30}):(\d{1,3})$/);
  if (!m) return false;
  const book = BOOKS.find((b) => b.book === m[1]);
  return !!book && Number(m[2]) >= 1 && Number(m[2]) <= book.chapters;
}

export async function recordPosition(target: string, translation: string, positionSec: number, finished: boolean): Promise<ActionState> {
  if (!isListeningTarget(target) || !isTranslation(translation) || !Number.isFinite(positionSec) || positionSec < 0 || positionSec > 36_000) return fail("Unknown passage.");
  return guard(() => {
    data.saveListening(target, translation, 0, finished, positionSec);
    return { ok: true };
  });
}

export async function toggleSaved(target: string, on: boolean): Promise<ActionState> {
  if (!isListeningTarget(target)) return fail("Unknown passage.");
  return guard(() => {
    data.setBookmark(target, on);
    revalidatePath("/meditation", "layout");
    return { ok: true };
  });
}

export async function saveNarrationStart(passageId: string, startSec: number | null): Promise<ActionState> {
  if (!findPassage(passageId) || (startSec !== null && (!Number.isFinite(startSec) || startSec < 0 || startSec > 36_000))) return fail("Unknown passage.");
  return guard(() => {
    data.setNarrationOffset(passageId, startSec === null ? null : Math.round(startSec * 10) / 10);
    return { ok: true, message: startSec === null ? "Start point reset to the estimate." : "Start point saved." };
  });
}

export async function saveCollectionNote(_: ActionState, fd: FormData): Promise<ActionState> {
  const id = String(fd.get("collectionId") ?? "");
  if (!COLLECTIONS.some((c) => c.id === id)) return fail("Unknown collection.");
  const body = String(fd.get("body") ?? "").trim();
  if (body.length > 4000) return fail("Keep notes under 4,000 characters.", { body: "Keep notes under 4,000 characters." }, fd);
  return guard(() => {
    data.setCollectionNote(id, body);
    revalidatePath("/meditation", "layout");
    return { ok: true, message: "Notes saved privately on this device." };
  });
}

export async function deleteReflection(id: number): Promise<ActionState> {
  if (!Number.isInteger(id) || id <= 0) return fail("Unknown reflection.");
  return guard(() => {
    data.deletePassageReflection(id);
    revalidatePath("/meditation", "layout");
    return { ok: true };
  });
}

export async function saveAudioSource(_: ActionState, fd: FormData): Promise<ActionState> {
  if (fd.get("remove") === "1") {
    const passageId = String(fd.get("passageId") ?? "");
    if (!findPassage(passageId)) return fail("Unknown passage.");
    return guard(() => {
      data.setAudioSource(passageId, null);
      revalidatePath("/meditation", "layout");
      return { ok: true, message: "Recording removed." };
    });
  }
  const r = parseAudioForm(fd);
  if (!r.ok) return fail("Check the highlighted fields.", r.errors, fd);
  if (!findPassage(r.value.passageId)) return fail("Unknown passage.");
  return guard(() => {
    data.setAudioSource(r.value.passageId, r.value);
    revalidatePath("/meditation", "layout");
    return { ok: true, message: "Recording attached." };
  });
}
