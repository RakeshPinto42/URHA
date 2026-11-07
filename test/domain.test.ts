import { describe, expect, it } from "vitest";
import { applyStep, currentPhaseIndex, EMPTY, pct, resolveTopicStatuses, roadMonths, topicStatus } from "@/lib/progress";
import { addDays, isIsoDate, monthStartDate, roadmapMonth, weekStart } from "@/lib/dates";
import { compareTasks, nextOccurrence, weekActualMinutes } from "@/lib/taskLogic";
import { PHASES, scheduleMonths, slug } from "@/lib/curriculum";
import { RESOURCES } from "@/lib/resources";

describe("progress steps are cumulative", () => {
  it("proficient implies practised and exposed", () => {
    expect(applyStep(EMPTY, "proficient", true)).toEqual({ exposed: true, practised: true, proficient: true });
  });
  it("clearing exposure clears everything above it", () => {
    const full = { exposed: true, practised: true, proficient: true };
    expect(applyStep(full, "exposed", false)).toEqual(EMPTY);
    expect(applyStep(full, "practised", false)).toEqual({ exposed: true, practised: false, proficient: false });
    expect(applyStep(full, "proficient", false)).toEqual({ exposed: true, practised: true, proficient: false });
  });
});

describe("topic status", () => {
  const e = { exposed: true, practised: false, proficient: false };
  const p = { exposed: true, practised: true, proficient: false };
  const d = { exposed: true, practised: true, proficient: true };
  it("watching every lesson is in progress, not completed", () => {
    expect(topicStatus([e, e], false, [])).toBe("in-progress");
  });
  it("completed needs practice on every subtopic; proficiency alone never makes it mastered", () => {
    expect(topicStatus([p, p], false, [])).toBe("completed");
    expect(topicStatus([d, p], false, [])).toBe("completed");
    expect(topicStatus([d, d], false, [])).toBe("completed");
  });
  it("mastered (Demonstrated) only with a passed assessment", () => {
    expect(topicStatus([EMPTY], false, [], true)).toBe("mastered");
    expect(topicStatus([d, d], false, [], false)).not.toBe("mastered");
  });
  it("ready only when every prerequisite is done", () => {
    expect(topicStatus([EMPTY], false, [])).toBe("ready");
    expect(topicStatus([EMPTY], false, ["completed", "in-progress"])).toBe("not-started");
    expect(topicStatus([EMPTY], false, ["completed", "mastered"])).toBe("ready");
  });
  it("needs revision overrides", () => {
    expect(topicStatus([d], true, [])).toBe("needs-revision");
  });
  it("resolves through prerequisite chains and rejects cycles", () => {
    const s = resolveTopicStatuses([
      { id: "b", prerequisites: ["a"], subs: [EMPTY], needsRevision: false },
      { id: "a", prerequisites: [], subs: [p], needsRevision: false },
    ]);
    expect(s.get("a")).toBe("completed");
    expect(s.get("b")).toBe("ready");
    expect(() => resolveTopicStatuses([
      { id: "x", prerequisites: ["y"], subs: [], needsRevision: false },
      { id: "y", prerequisites: ["x"], subs: [], needsRevision: false },
    ])).toThrow(/cycle/);
  });
  it("current phase is the first not fully done", () => {
    expect(currentPhaseIndex([["completed"], ["in-progress"], ["ready"]])).toBe(1);
    expect(currentPhaseIndex([["mastered"], ["completed"]])).toBeNull();
  });
  it("pct floors and handles zero", () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(299, 300)).toBe(99);
  });
});

describe("curriculum integrity (PRD §5)", () => {
  const topics = PHASES.flatMap((p) => p.topics);
  it("has seven phases covering months 1–24 without gaps", () => {
    expect(PHASES).toHaveLength(7);
    let next = 1;
    for (const p of PHASES) {
      expect(p.months[0]).toBe(next);
      next = p.months[1] + 1;
    }
    expect(next).toBe(25);
  });
  it("every topic has practical work, a deliverable phase and known prerequisites", () => {
    const ids = new Set(topics.map((t) => t.id));
    for (const t of topics) {
      expect(t.assignment.length).toBeGreaterThan(40);
      expect(t.subtopics.length).toBeGreaterThan(0);
      t.prerequisites.forEach((q) => expect(ids.has(q), `${t.id} → ${q}`).toBe(true));
    }
    for (const p of PHASES) expect(p.exitGate.length).toBeGreaterThan(20);
  });
  it("subtopic ids are unique within each topic", () => {
    for (const t of topics) expect(new Set(t.subtopics.map(slug)).size).toBe(t.subtopics.length);
  });
  it("prerequisites form a DAG", () => {
    expect(() => resolveTopicStatuses(topics.map((t) => ({ id: t.id, prerequisites: t.prerequisites, subs: [], needsRevision: false })))).not.toThrow();
  });
  it("does not re-teach existing strengths (PRD §2)", () => {
    const text = JSON.stringify(PHASES).toLowerCase();
    for (const banned of ["power query", "power bi", "dax", "excel formulas", "fp&a"]) expect(text).not.toContain(banned);
  });
  it("resources point at real topics and never at non-http links", () => {
    const ids = new Set(topics.map((t) => t.id));
    for (const r of RESOURCES) {
      expect(ids.has(r.topic), r.id).toBe(true);
      if (r.url) expect(r.url).toMatch(/^https:\/\//);
    }
  });
  it("schedules subtopics evenly across phase months", () => {
    expect(scheduleMonths(4, [1, 2])).toEqual([1, 1, 2, 2]);
    expect(scheduleMonths(5, [7, 9])).toEqual([7, 7, 8, 8, 9]);
    expect(new Set(scheduleMonths(1, [13, 18]))).toEqual(new Set([13]));
  });
});

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("26-2-1")).toBe(false);
  });
  it("roadmap month boundaries fall on the start day", () => {
    expect(roadmapMonth("2026-01-15", "2026-01-14")).toBe(0);
    expect(roadmapMonth("2026-01-15", "2026-01-15")).toBe(1);
    expect(roadmapMonth("2026-01-15", "2026-02-14")).toBe(1);
    expect(roadmapMonth("2026-01-15", "2026-02-15")).toBe(2);
    expect(roadmapMonth("2026-01-15", "2028-01-14")).toBe(24);
  });
  it("month start clamps end-of-month overflow", () => {
    expect(monthStartDate("2026-01-31", 2)).toBe("2026-02-28");
    expect(monthStartDate("2026-01-15", 13)).toBe("2027-01-15");
  });
  it("weeks start on Monday", () => {
    expect(weekStart("2026-11-02")).toBe("2026-11-02"); // Monday
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("tasks", () => {
  it("recurrence", () => {
    expect(nextOccurrence("2026-11-02", "none")).toBeNull();
    expect(nextOccurrence("2026-11-02", "daily")).toBe("2026-11-03");
    expect(nextOccurrence("2026-11-02", "weekly")).toBe("2026-11-09");
    expect(nextOccurrence("2026-11-06", "weekdays")).toBe("2026-11-09"); // Fri → Mon
    expect(nextOccurrence("2026-11-07", "weekdays")).toBe("2026-11-09"); // Sat → Mon
  });
  it("weekly actual minutes count only done tasks completed this week", () => {
    const tasks = [
      { status: "done" as const, completedOn: "2026-11-02", actualMinutes: 60 },
      { status: "done" as const, completedOn: "2026-11-08", actualMinutes: 30 },
      { status: "done" as const, completedOn: "2026-11-09", actualMinutes: 99 },
      { status: "todo" as const, completedOn: null, actualMinutes: 45 },
      { status: "done" as const, completedOn: "2026-11-03", actualMinutes: null },
    ];
    expect(weekActualMinutes(tasks, "2026-11-04")).toBe(90);
  });
  it("orders overdue first, then priority", () => {
    const list = [
      { dueDate: "2026-11-05", priority: 1, estMinutes: 30 },
      { dueDate: "2026-11-01", priority: 3, estMinutes: 30 },
      { dueDate: "2026-11-05", priority: 2, estMinutes: 30 },
      { dueDate: null, priority: 1, estMinutes: 30 },
    ].sort(compareTasks);
    expect(list.map((t) => `${t.dueDate}/${t.priority}`)).toEqual(["2026-11-01/3", "2026-11-05/1", "2026-11-05/2", "null/1"]);
  });
});

describe("road", () => {
  it("fills months from practised subtopics", () => {
    const road = roadMonths(
      [{ month: 1, phaseId: "p1", practised: true }, { month: 1, phaseId: "p1", practised: false }, { month: 3, phaseId: "p2", practised: false }],
      [{ id: "p1", months: [1, 2] }, { id: "p2", months: [3, 4] }],
      4,
    );
    expect(road).toEqual([
      { month: 1, phaseId: "p1", total: 2, practised: 1 },
      { month: 2, phaseId: "p1", total: 0, practised: 0 },
      { month: 3, phaseId: "p2", total: 1, practised: 0 },
      { month: 4, phaseId: "p2", total: 0, practised: 0 },
    ]);
  });
});
