/**
 * The study load check (docs/PRD.md §9): does each phase fit 8–10 hours a week?
 *
 * Video minutes come from real durations; exercise minutes from lib/learning-map.ts. The
 * factors below are planning assumptions, stated so they can be challenged. Pure, with data
 * passed in, so tests and scripts share it.
 */
import type { PhaseDef, ProjectId } from "./curriculum";

export const LOAD = {
  watchFactor: 1.25,      // pausing, rewinding and taking notes at this starting level
  practiseFactor: 1.5,    // PRD §2: not an experienced engineer yet, so exercises take longer than their estimate
  pendingWatchMinutes: 25,// a unit with no video yet
  assessmentHours: 3,     // one practical assessment per topic
  revisionShare: 0.1,     // revision on top of the above
  projectHours: { P1: 25, P2: 25, P3: 25, P4: 25, P5: 50 } as Record<ProjectId, number>, // integration beyond topic exercises
} as const;

/** Minutes for one subtopic. `watch` is null when it has no video yet. */
export type UnitMinutes = { watch: number | null; practise: number };

export type PhaseLoad = {
  id: string; title: string; months: number; weeks: number;
  watchHours: number; practiseHours: number; assessmentHours: number; projectHours: number; revisionHours: number;
  totalHours: number; hoursPerWeek: number;
};

const WEEKS_PER_MONTH = 52 / 12;

export function phaseLoads(phases: PhaseDef[], projects: { id: ProjectId; phases: string[] }[], units: Record<string, UnitMinutes[]>): PhaseLoad[] {
  return phases.map((p) => {
    let watch = 0, practise = 0;
    for (const t of p.topics) {
      const rows = units[t.id];
      if (!rows) throw new Error(`No study time for topic "${t.id}"`);
      for (const u of rows) {
        watch += (u.watch ?? LOAD.pendingWatchMinutes) * LOAD.watchFactor;
        practise += u.practise * LOAD.practiseFactor;
      }
    }
    const assessment = p.topics.length * LOAD.assessmentHours;
    const project = projects.filter((x) => x.phases.includes(p.id)).reduce((n, x) => n + LOAD.projectHours[x.id] / x.phases.length, 0);
    const base = watch / 60 + practise / 60 + assessment + project;
    const revision = base * LOAD.revisionShare;
    const total = base + revision;
    const months = p.months[1] - p.months[0] + 1;
    const weeks = months * WEEKS_PER_MONTH;
    return {
      id: p.id, title: p.title, months, weeks, watchHours: watch / 60, practiseHours: practise / 60,
      assessmentHours: assessment, projectHours: project, revisionHours: revision, totalHours: total, hoursPerWeek: total / weeks,
    };
  });
}
