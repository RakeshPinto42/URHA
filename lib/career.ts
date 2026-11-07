/**
 * Career Intelligence: what to do next, worked out from the path. Pure, so the sequence can be
 * tested. A subtopic counts as done only once its exercise is practised: watching alone never
 * moves you on, and mastery still needs evidence and an assessment (lib/progress.ts).
 */
import type { PhaseView, SubtopicView, TopicView } from "./data";
import type { SubtopicPlan } from "./catalog";
import { LOAD } from "./study-load";
import { lowestMastery, type Mastery } from "./progress";

export type CareerUnit = {
  subtopic: SubtopicView; topic: TopicView; phase: PhaseView; plan: SubtopicPlan | null;
  /** Planned hours, using the study-load factors for pausing and for a first attempt. */
  hours: number;
};

export function unitHours(plan: SubtopicPlan | null): number {
  if (!plan) return 0;
  const watch = (plan.primary?.minutes ?? LOAD.pendingWatchMinutes) * LOAD.watchFactor;
  return (watch + plan.exerciseMinutes * LOAD.practiseFactor) / 60;
}

/** Every unit not yet practised, in curriculum order. */
export function pendingUnits(phases: PhaseView[], plans: ReadonlyMap<string, SubtopicPlan>): CareerUnit[] {
  return phases.flatMap((phase) => phase.topics.flatMap((topic) => topic.subtopics
    .filter((s) => !s.progress.practised)
    .map((subtopic) => {
      const plan = plans.get(subtopic.id) ?? null;
      return { subtopic, topic, phase, plan, hours: unitHours(plan) };
    })));
}

/** The units that fit one week. Always at least one, so a long lesson cannot stall the plan. */
export function weekOf(units: CareerUnit[], weeklyHours: number): CareerUnit[] {
  const week: CareerUnit[] = [];
  let used = 0;
  for (const u of units) {
    if (week.length > 0 && used + u.hours > weeklyHours) break;
    week.push(u);
    used += u.hours;
  }
  return week;
}

export const totalHours = (units: CareerUnit[]) => units.reduce((n, u) => n + u.hours, 0);

export type SkillStanding = { id: string; name: string; mastery: Mastery; demonstrated: number; topics: number };

/** Each skill holds the lowest state across the topics reached so far, as on the Skills page. */
export function skillStandings(skills: { id: string; name: string }[], phases: PhaseView[], currentPhaseId: string | null): SkillStanding[] {
  const topics = phases.flatMap((p) => p.topics.map((t) => ({ ...t, phaseOrd: p.ord })));
  const currentOrd = phases.find((p) => p.id === currentPhaseId)?.ord ?? phases.length;
  return skills.map((s) => {
    const related = topics.filter((t) => t.skills.includes(s.id));
    const reached = related.filter((t) => t.phaseOrd <= currentOrd || t.mastery !== "none");
    return {
      id: s.id, name: s.name,
      mastery: reached.length ? lowestMastery(reached.map((t) => t.mastery)) : "none",
      demonstrated: related.filter((t) => t.demonstrated).length, topics: related.length,
    };
  });
}

/** The address of the privacy-enhanced player, starting at the segment that matters. */
export function embedUrl(videoId: string, startSec: number | null, endSec: number | null): string {
  const q = new URLSearchParams({ rel: "0" });
  if (startSec) q.set("start", String(startSec));
  if (endSec) q.set("end", String(endSec));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${q}`;
}
