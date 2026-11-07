import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getMilestones, getPath, getSettings, getSkills } from "@/lib/data";
import { monthStartDate, roadmapMonth, shortMonth, today } from "@/lib/dates";
import { pctLabel, subtopicMastery, STATUS_LABEL, type TopicStatus } from "@/lib/progress";
import { TOTAL_MONTHS } from "@/lib/curriculum";
import { ASSESSMENTS, reviewMode } from "@/lib/assessments";
import { journeyFrom } from "@/lib/journey/model";
import { MilestoneRoad } from "@/components/MilestoneRoad";
import { PageEnter } from "@/components/Motion";
import { StatusMark, TextLink } from "@/components/ui";
import { RoadmapExplorer, type PhaseSheet } from "@/components/journey/RoadmapExplorer";

export const metadata: Metadata = { title: "My Path" };

const LEGEND: TopicStatus[] = ["not-started", "ready", "in-progress", "completed", "needs-revision", "mastered"];

export default async function PathPage() {
  await connection();
  const path = getPath();
  const settings = getSettings();
  const skillNames = new Map(getSkills().map((s) => [s.id, s.name]));
  const milestones = getMilestones();
  const statuses = assessmentStatuses();
  const t = today();
  const currentMonth = settings.startDate ? roadmapMonth(settings.startDate, t) : null;
  const monthLabels: Record<number, string> = {};
  if (settings.startDate) for (let m = 1; m <= TOTAL_MONTHS; m++) monthLabels[m] = shortMonth(monthStartDate(settings.startDate, m));
  const journey = journeyFrom(path);
  const topicsAll = path.phases.flatMap((p) => p.topics);
  const demonstrated = topicsAll.filter((x) => x.demonstrated).length;

  const sheets: PhaseSheet[] = path.phases.map((p, i) => {
    const topicIds = new Set(p.topics.map((x) => x.id));
    const ms = milestones.filter((m) => m.phaseId === p.id);
    return {
      id: p.id, ord: p.ord, title: p.title, landmark: journey.stations[i]!.landmark, months: p.months,
      monthRange: settings.startDate ? `${monthLabels[p.months[0]]} – ${monthLabels[p.months[1]]}` : null,
      summary: p.summary, deliverable: p.deliverable, exitGate: p.exitGate,
      skills: [...new Set(p.topics.flatMap((x) => x.skills))].map((s) => skillNames.get(s) ?? s),
      milestone: ms.length ? { title: ms.map((m) => m.title).join(" · "), criteria: ms.map((m) => m.completionCriteria).join(" ") } : null,
      topics: p.topics.map((x) => {
        const months = x.subtopics.map((s) => s.month);
        return {
          id: x.id, title: x.title, objective: x.objective, status: x.status,
          months: [Math.min(...months), Math.max(...months)] as [number, number],
          practised: x.counts.practised, proficient: x.counts.proficient, total: x.counts.total,
          subtopics: x.subtopics.map((s) => ({ title: s.title, state: subtopicMastery(s.progress) })),
        };
      }),
      assessments: ASSESSMENTS.filter((a) => topicIds.has(a.topicId)).map((a) => ({
        id: a.id, title: a.title, topicTitle: path.topicTitles[a.topicId] ?? a.topicId,
        state: statuses.get(a.id)?.state ?? "not-attempted", review: reviewMode(a),
      })),
    };
  });

  const road = <MilestoneRoad months={path.road} phases={path.phases} currentMonth={currentMonth} monthLabels={monthLabels} currentPhaseId={path.currentPhaseId} />;

  return (
    <PageEnter>
      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-8 sm:px-6 lg:pt-12">
        <header className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="text-[14px] text-muted">My Path</p>
            <h1 className="mt-1 font-serif text-[40px] leading-[1.04] sm:text-[56px]">The Roadmap</h1>
            <p className="mt-3 max-w-[60ch] text-[16px]">
              24 months, 6 stations, {path.overall.total} subtopics.{" "}
              {journey.currentIndex !== null ? <>You are walking towards <strong className="font-medium">{journey.stations[journey.currentIndex]!.landmark}</strong> (Phase {journey.stations[journey.currentIndex]!.ord}).</> : "Every station is passed."}{" "}
              {pctLabel(path.overall.practised, path.overall.total)} practised, {path.overall.proficient} proficient, {demonstrated} of {topicsAll.length} topics demonstrated by assessment.
            </p>
          </div>
        </header>

        <Suspense fallback={<div className="h-[640px] rounded-card bg-surface" />}>
          <RoadmapExplorer data={journey} sheets={sheets} fallback={road} />
        </Suspense>

        <section className="mt-16 border-t border-border pt-8" aria-labelledby="road-h">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="road-h" className="text-[14px] font-semibold">The calendar, month by month</h2>
              <p className="mt-2 text-[13px] text-muted">
                Each milestone fills by the share of that month’s subtopics you have practised. Watching a lesson alone does not fill it.
                {!settings.startDate && <> <TextLink href="/settings">Set a start date</TextLink> to see the calendar.</>}
              </p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2" aria-label="Status key">
                {LEGEND.map((s) => <li key={s} className="flex items-center gap-2 text-[13px]"><StatusMark status={s} /> {STATUS_LABEL[s]}</li>)}
              </ul>
            </div>
            <div className="lg:col-span-8">{road}</div>
          </div>
        </section>
      </div>
    </PageEnter>
  );
}
