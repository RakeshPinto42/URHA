import { describe, expect, it } from "vitest";
import { embedUrl, pendingUnits, skillStandings, unitHours, weekOf, type CareerUnit } from "@/lib/career";
import { SUBTOPIC_PLANS, type SubtopicPlan } from "@/lib/catalog";
import type { PhaseView, SubtopicView, TopicView } from "@/lib/data";
import { EMPTY } from "@/lib/progress";

const sub = (id: string, over: Partial<SubtopicView["progress"]> = {}) =>
  ({ id, title: id, ord: 1, month: 1, progress: { ...EMPTY, ...over }, evidence: null }) as SubtopicView;
const topic = (id: string, subtopics: SubtopicView[], over: Partial<TopicView> = {}) =>
  ({ id, title: id, subtopics, skills: [], mastery: "none", demonstrated: false, ...over }) as TopicView;
const phase = (id: string, ord: number, topics: TopicView[]) => ({ id, ord, title: id, topics }) as PhaseView;
const plan = (minutes: number | null, exerciseMinutes: number): SubtopicPlan =>
  ({ pending: null, primary: minutes === null ? null : { minutes }, supplement: null, exercise: "x", exerciseMinutes, outcome: "" }) as SubtopicPlan;

describe("the learning sequence", () => {
  const plans = new Map([["a", plan(10, 10)], ["b", plan(10, 10)]]);

  it("follows the curriculum order across topics and phases", () => {
    const phases = [phase("p1", 1, [topic("t1", [sub("a"), sub("b")])]), phase("p2", 2, [topic("t2", [sub("c")])])];
    expect(pendingUnits(phases, plans).map((u) => u.subtopic.id)).toEqual(["a", "b", "c"]);
  });

  it("does not move on when a lesson was only watched", () => {
    const phases = [phase("p1", 1, [topic("t1", [sub("a", { exposed: true }), sub("b")])])];
    expect(pendingUnits(phases, plans)[0]!.subtopic.id).toBe("a");
  });

  it("moves on once the exercise is practised", () => {
    const phases = [phase("p1", 1, [topic("t1", [sub("a", { exposed: true, practised: true }), sub("b")])])];
    expect(pendingUnits(phases, plans)[0]!.subtopic.id).toBe("b");
  });

  it("covers every subtopic of the real curriculum exactly once when nothing is done", () => {
    expect(SUBTOPIC_PLANS.size).toBe(328);
    for (const [id, p] of SUBTOPIC_PLANS) {
      expect(p.exercise.length, id).toBeGreaterThan(25);
      expect(p.primary !== null || Boolean(p.pending), id).toBe(true);
    }
  });
});

describe("the week", () => {
  const unit = (hours: number) => ({ hours }) as CareerUnit;
  it("fills up to the weekly target", () => expect(weekOf([unit(3), unit(3), unit(3), unit(3)], 7)).toHaveLength(2));
  it("always gives at least one unit, even a long one", () => expect(weekOf([unit(20), unit(1)], 8)).toHaveLength(1));
  it("copes with nothing left", () => expect(weekOf([], 8)).toEqual([]));
  it("allows for pausing and first attempts", () => expect(unitHours(plan(60, 60))).toBeCloseTo(2.75));
  it("plans time for a unit with no video", () => expect(unitHours(plan(null, 0))).toBeGreaterThan(0));
});

describe("skills", () => {
  it("are demonstrated only when every topic reached is", () => {
    const yes = topic("t1", [], { skills: ["s"], mastery: "demonstrated", demonstrated: true });
    const no = topic("t2", [], { skills: ["s"], mastery: "practising" });
    expect(skillStandings([{ id: "s", name: "S" }], [phase("p1", 1, [yes, no])], "p1")[0]!.mastery).toBe("practising");
    expect(skillStandings([{ id: "s", name: "S" }], [phase("p1", 1, [yes])], "p1")[0]!.mastery).toBe("demonstrated");
  });
});

describe("the player", () => {
  it("uses the privacy-enhanced address and the lesson's segment", () => {
    const u = new URL(embedUrl("abc123DEF_-", 90, 300));
    expect(u.origin).toBe("https://www.youtube-nocookie.com");
    expect(u.searchParams.get("start")).toBe("90");
    expect(u.searchParams.get("end")).toBe("300");
  });
});
