/** Derives the Home screen model from the path, settings and tasks. Server-only. */
import "server-only";
import { assessmentStatuses, getPath, getSettings, listAttempts, listTasks, recentAchievements, weekStats, getMilestones, type TopicView } from "./data";
import { assessmentsForTopic } from "./assessments";
import { monthStartDate, roadmapMonth, shortMonth, today } from "./dates";
import { compareTasks } from "./taskLogic";
import { TOTAL_MONTHS } from "./curriculum";

export function homeModel(now = new Date()) {
  const settings = getSettings();
  const path = getPath();
  const t = today(now);
  const currentMonth = settings.startDate ? roadmapMonth(settings.startDate, t) : null;
  const monthLabels: Record<number, string> = {};
  if (settings.startDate) for (let m = 1; m <= TOTAL_MONTHS; m++) monthLabels[m] = shortMonth(monthStartDate(settings.startDate, m));

  const phase = path.phases.find((p) => p.id === path.currentPhaseId) ?? null;
  const focus: TopicView | null =
    phase?.topics.find((x) => x.status === "needs-revision") ??
    phase?.topics.find((x) => x.status === "in-progress") ??
    phase?.topics.find((x) => x.status === "ready") ??
    path.phases.flatMap((p) => p.topics).find((x) => x.status === "in-progress" || x.status === "ready") ??
    null;
  const nextSubtopic = focus?.subtopics.find((s) => !s.progress.practised) ?? null;

  // Where the calendar says you should be vs where the work is.
  const scheduledPhase = currentMonth && currentMonth >= 1 && currentMonth <= TOTAL_MONTHS
    ? path.phases.find((p) => currentMonth >= p.months[0] && currentMonth <= p.months[1]) ?? null
    : null;

  const tasks = listTasks();
  const open = tasks.filter((x) => x.status !== "done");
  const priorities = open
    .filter((x) => x.status !== "deferred" && x.dueDate !== null && x.dueDate <= t)
    .sort(compareTasks);
  const week = weekStats(t);
  // The LedgerSync milestone the current focus topic builds towards.
  const milestone = focus?.milestoneId ? getMilestones().find((m) => m.id === focus.milestoneId) ?? null : null;

  // What proves the current focus, and what is waiting on a reviewer.
  const statuses = assessmentStatuses();
  const focusAssessment = focus ? assessmentsForTopic(focus.id)[0] ?? null : null;

  return {
    focusAssessment, focusAssessmentState: focusAssessment ? statuses.get(focusAssessment.id) ?? null : null,
    awaitingReview: listAttempts().filter((a) => a.status === "awaiting_review").length,
    settings, path, today: t, currentMonth, monthLabels, phase, focus, nextSubtopic, scheduledPhase,
    priorities, pendingCount: open.length, blockedCount: open.filter((x) => x.status === "blocked").length,
    week, achievements: recentAchievements(4), milestone,
  };
}
