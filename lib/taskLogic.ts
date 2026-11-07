/** Pure task rules: categories, statuses, recurrence and weekly totals. */
import { addDays, weekStart } from "./dates";

export const CATEGORIES = ["learn", "practise", "build", "test", "debug", "review", "document", "assess"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  learn: "Learn", practise: "Practise", build: "Build", test: "Test",
  debug: "Debug", review: "Review", document: "Document", assess: "Assess",
};

export const STATUSES = ["todo", "in_progress", "blocked", "deferred", "done"] as const;
export type TaskStatus = (typeof STATUSES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", blocked: "Blocked", deferred: "Deferred", done: "Done",
};

export const PRIORITIES = [1, 2, 3] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = { 1: "High", 2: "Normal", 3: "Low" };

export const RECURRENCES = ["none", "daily", "weekdays", "weekly"] as const;
export type Recurrence = (typeof RECURRENCES)[number];
export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "Does not repeat", daily: "Every day", weekdays: "Every weekday", weekly: "Every week",
};

/** Next due date for a recurring task completed with due date `due` (or today if none). */
export function nextOccurrence(due: string, rec: Recurrence): string | null {
  switch (rec) {
    case "none":
      return null;
    case "daily":
      return addDays(due, 1);
    case "weekly":
      return addDays(due, 7);
    case "weekdays": {
      let d = addDays(due, 1);
      // Saturday or Sunday → move to Monday
      while (dayIndex(d) >= 5) d = addDays(d, 1);
      return d;
    }
  }
}

function dayIndex(iso: string): number {
  return (new Date(`${iso}T00:00:00`).getDay() + 6) % 7; // Monday = 0
}

/** Minutes of actual study logged on tasks completed within the week containing `ref`. */
export function weekActualMinutes(
  tasks: { status: TaskStatus; completedOn: string | null; actualMinutes: number | null }[],
  ref: string,
): number {
  const start = weekStart(ref);
  const end = addDays(start, 6);
  return tasks
    .filter((t) => t.status === "done" && t.completedOn && t.completedOn >= start && t.completedOn <= end)
    .reduce((sum, t) => sum + (t.actualMinutes ?? 0), 0);
}

/** Sort for a day list: overdue first, then priority, then estimate (short first). */
export function compareTasks(
  a: { dueDate: string | null; priority: number; estMinutes: number | null },
  b: { dueDate: string | null; priority: number; estMinutes: number | null },
): number {
  const da = a.dueDate ?? "9999-12-31";
  const db = b.dueDate ?? "9999-12-31";
  if (da !== db) return da < db ? -1 : 1;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return (a.estMinutes ?? 9999) - (b.estMinutes ?? 9999);
}
