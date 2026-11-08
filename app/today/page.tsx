import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { homeModel } from "@/lib/home";
import { greetingFor, formatMinutes, relativeDay, longDate } from "@/lib/dates";
import { pctLabel } from "@/lib/progress";
import { quoteForDay } from "@/lib/quotes";
import { CATEGORY_LABEL } from "@/lib/taskLogic";
import { MilestoneRoad } from "@/components/MilestoneRoad";
import { PageEnter, Reveal } from "@/components/Motion";
import { Empty, Figure, Meter, Panel, Quote, StatusLabel, TextLink } from "@/components/ui";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { TaskDoneButton } from "@/components/forms/TaskDoneButton";
import { Icon } from "@/components/Icon";
import { HomeJourney } from "@/components/journey/HomeJourney";
import { GlassWindow } from "@/components/cinema/GlassWindow";
import { RisingTitle } from "@/components/Frontispiece";
import { journeyFrom } from "@/lib/journey/model";

export const metadata: Metadata = { title: "Today" };

export default async function Today() {
  await connection();
  const m = homeModel();
  const quote = quoteForDay("home", m.today);
  const name = m.settings.name ? `, ${m.settings.name}` : "";
  const targetMin = Math.round(m.settings.weeklyTargetHours * 60);
  const journey = journeyFrom(m.path);
  const topicList = m.path.phases.flatMap((p) => p.topics);
  const topicCount = topicList.length;
  const demonstratedTopics = topicList.filter((t) => t.demonstrated).length;
  const next = journey.currentIndex === null ? null : journey.stations[journey.currentIndex]!;

  // The finding under the greeting: one sentence, from the data.
  const finding = !m.settings.startDate
    ? "Set the day your path begins and the road will show where you stand."
    : m.currentMonth === 0
      ? `Your path begins on ${longDate(m.settings.startDate)}.`
      : m.currentMonth! > 24
        ? "The 24-month road is behind you. What remains is practice and evidence."
        : `Month ${m.currentMonth} of 24${m.scheduledPhase && m.phase && m.scheduledPhase.id !== m.phase.id
            ? ` · the calendar says Phase ${m.scheduledPhase.ord}, your work is in Phase ${m.phase.ord}`
            : m.phase ? ` · Phase ${m.phase.ord}: ${m.phase.title}` : ""}.`;

  return (
    <PageEnter>
      {/* The Journey (docs/JOURNEY.md §5, level 1): the walker on the path, looking to the next station. */}
      <section aria-labelledby="greeting" className="journey-hero relative isolate flex flex-col sm:block">
        <div className="journey-hero__copy relative z-10 px-4 pt-8 sm:pointer-events-none sm:absolute sm:inset-x-0 sm:top-0 sm:px-6 sm:pt-10 lg:pt-14">
          <div className="mx-auto w-full max-w-column">
            <div className="sm:pointer-events-auto sm:max-w-[680px]">
              <p className="text-[14px] text-muted sm:text-white/85">{longDate(m.today)} · The Journey</p>
              <RisingTitle id="greeting" text={`${greetingFor()}${name}.`} className="mt-3 max-w-[18ch] font-serif text-[40px] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[68px] sm:text-white" />
              <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed text-ink sm:text-white">{finding}</p>
              {next && (
                <p className="mt-3 max-w-[64ch] text-[15px] text-ink sm:text-white">
                  <span className="text-muted sm:text-white/85">Next destination:</span> {next.landmark}, end of month {next.months[1]} · <span className="num">{next.practised} of {next.total}</span> subtopics practised
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {m.focus ? (
                  <Link href={`/academy/${m.focus.id}`} className="btn btn-primary">Continue the journey</Link>
                ) : (
                  <Link href="/path" className="btn btn-primary">See the whole path</Link>
                )}
                <Link href="/path" className="btn btn-secondary bg-white/80">Open the roadmap</Link>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0 z-[1] hidden sm:block lg:rounded-b-[28px]" />
        <div className="journey-hero__scene relative mt-6 h-[52vh] min-h-[340px] sm:mt-0 sm:h-[min(84vh,780px)] sm:min-h-[560px] lg:rounded-b-[28px] lg:overflow-hidden">
          <HomeJourney data={journey} fallback={
            <div className="mx-auto flex h-full w-full max-w-column flex-col justify-end px-4 pb-8 sm:px-6">
              <MilestoneRoad compact months={m.path.road} phases={m.path.phases} currentMonth={m.currentMonth} monthLabels={m.monthLabels} currentPhaseId={m.path.currentPhaseId} />
            </div>
          } />
        </div>
      </section>

      <section aria-labelledby="window-h" className="glass-hall mt-4 overflow-hidden px-4 py-8 sm:mx-6 sm:rounded-[28px] sm:px-8 sm:py-10 lg:mx-auto lg:max-w-[1160px]">
        <h2 id="window-h" className="mb-5 font-serif text-[30px] leading-tight text-[#f7f7f5]">Six panes of the way</h2>
        <GlassWindow stations={journey.stations} />
      </section>

      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-8 sm:px-6 lg:pt-10">
        {quote && (
          <section aria-label="For today" className="grid grid-cols-1 gap-4 border-b border-border pb-8 lg:grid-cols-12">
            <h2 className="text-[14px] font-semibold lg:col-span-3">For today</h2>
            <div className="lg:col-span-9"><Quote quote={quote} size="sm" /></div>
          </section>
        )}

        {/* The Milestone Road */}
        <Reveal className="mt-8">
          <Panel title="The road" id="road" action={<TextLink href="/path" className="text-[13px]">Open My Path</TextLink>}>
            {!m.settings.startDate ? (
              <div className="grid gap-6 md:grid-cols-2">
                <MilestoneRoad compact months={m.path.road} phases={m.path.phases} currentMonth={null} currentPhaseId={m.path.currentPhaseId} />
                <div>
                  <p className="mb-4 text-[14px]">When does month 1 begin? The road and the calendar pace are measured from this date. You can change it later in Settings.</p>
                  <SettingsForm compact defaults={{ startDate: m.today, weeklyTargetHours: m.settings.weeklyTargetHours, name: m.settings.name }} />
                </div>
              </div>
            ) : (
              <>
                <MilestoneRoad months={m.path.road} phases={m.path.phases} currentMonth={m.currentMonth} monthLabels={m.monthLabels} currentPhaseId={m.path.currentPhaseId} />
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[14px]">
                  <span><span className="num font-medium">{pctLabel(m.path.overall.practised, m.path.overall.total)}</span> <span className="text-muted">practised ({m.path.overall.practised} of {m.path.overall.total} subtopics)</span></span>
                  <span><span className="num font-medium">{m.path.overall.proficient}</span> <span className="text-muted">proficient with evidence</span></span>
                  <span><span className="num font-medium">{demonstratedTopics}</span> <span className="text-muted">of {topicCount} topics demonstrated by assessment</span></span>
                </div>
              </>
            )}
          </Panel>
        </Reveal>

        {/* Today + this week */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
          <Panel title="Today's priorities" id="today"
            action={<TextLink href="/tasks" className="text-[13px]">All tasks</TextLink>}>
            {m.priorities.length === 0 ? (
              <Empty action={<Link href="/tasks?new=1" className="btn btn-secondary"><Icon name="plus" /> Plan a task</Link>}>
                Nothing is due today. {m.pendingCount > 0 ? `${m.pendingCount} open ${m.pendingCount === 1 ? "task has" : "tasks have"} later or no dates.` : "No open tasks yet."}
              </Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {m.priorities.slice(0, 5).map((t) => (
                  <li key={t.id} className="card-row flex min-h-[56px] items-center gap-3 px-4 py-2.5">
                    <TaskDoneButton id={t.id} title={t.title} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/tasks?task=${t.id}`} className="block truncate text-[15px] hover:underline">{t.title}</Link>
                      <span className="text-[13px] text-muted">
                        {CATEGORY_LABEL[t.category]}{t.topicId ? ` · ${m.path.topicTitles[t.topicId] ?? ""}` : ""}{t.estMinutes ? ` · ${formatMinutes(t.estMinutes)}` : ""}
                      </span>
                    </div>
                    {t.status === "blocked" && <span className="chip chip-warn flex-none" title={t.blockedReason}>Blocked</span>}
                    <span className={`flex-none text-[13px] ${t.dueDate! < m.today ? "text-negative" : "text-muted"}`}>
                      {t.dueDate! < m.today ? `Overdue · ${relativeDay(t.dueDate!, m.today)}` : "Today"}
                    </span>
                  </li>
                ))}
                {m.priorities.length > 5 && <li className="px-1 text-[13px] text-muted"><TextLink href="/tasks">{m.priorities.length - 5} more due</TextLink></li>}
              </ul>
            )}
          </Panel>

          {m.focusAssessment && (
            <Panel title="What proves this topic" id="proof" action={<TextLink href="/assessments" className="text-[13px]">All assessments</TextLink>}>
              <p className="text-[15px]"><Link href={`/assessments/${m.focusAssessment.id}`} className="font-medium hover:underline">{m.focusAssessment.title}</Link></p>
              <p className="mt-1 text-[14px] text-muted">
                {m.focusAssessmentState?.state === "passed" ? "Passed." : m.focusAssessmentState?.state === "awaiting-review" ? "Submitted and waiting for review." : m.focusAssessmentState?.state === "failed" ? `Not passed yet: best ${m.focusAssessmentState.bestPercent ?? 0}%.` : `Not attempted. ${m.focusAssessment.passPercent}% to pass.`}
                {m.awaitingReview > 0 && <> <TextLink href="/assessments">{m.awaitingReview} {m.awaitingReview === 1 ? "attempt awaits" : "attempts await"} review</TextLink>.</>}
              </p>
            </Panel>
          )}

          <Panel title="Recent achievements" id="achievements">
            {m.achievements.length === 0 ? (
              <p className="text-[14px] text-muted">None yet. Practise a subtopic, pass an assessment, or finish a Build, Test or Assess task.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {m.achievements.map((a, i) => (
                  <li key={i} className="flex flex-col">
                    <Link href={a.href} className="truncate text-[14px] hover:underline">{a.title}</Link>
                    <span className="text-[12px] text-muted">{a.kind === "demonstrated" ? "Assessment passed" : a.kind === "proficient" ? "Proficient, with evidence" : a.kind === "practised" ? "Practised" : "Task done"} · {relativeDay(a.at, m.today)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          </div>

          <Panel title="This week" id="week" className="flex flex-col lg:col-span-4">
            <div className="flex flex-1 flex-col gap-5">
              <div>
                <Figure label="Study time logged" value={formatMinutes(m.week.actualMinutes)} caption={`of ${m.settings.weeklyTargetHours} h target`} />
                <div className="mt-2"><Meter value={m.week.actualMinutes} max={targetMin} label="Study time against weekly target" /></div>
                {m.week.unloggedCount > 0 && <p className="mt-2 text-[13px] text-muted">{m.week.unloggedCount} completed {m.week.unloggedCount === 1 ? "task has" : "tasks have"} no time logged.</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Figure label="Completed" value={m.week.doneCount} />
                <Figure label="Open" value={m.pendingCount} caption={m.blockedCount ? `${m.blockedCount} blocked` : undefined} />
                <div className="col-span-2"><Figure label="Planned" value={formatMinutes(m.week.plannedMinutes)} caption="estimates on tasks due this week" /></div>
              </div>
              <Link href="/tasks?view=week" className="btn btn-secondary mt-auto self-start">Review the week</Link>
            </div>
          </Panel>
        </div>

        {/* Focus, milestone, achievements */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Panel title="Current focus" id="focus">
            {m.focus ? (
              <div className="flex flex-col gap-3">
                <Link href={`/academy/${m.focus.id}`} className="text-[18px] font-medium leading-snug hover:underline">{m.focus.title}</Link>
                <StatusLabel status={m.focus.status} />
                {m.nextSubtopic && <p className="text-[14px]"><span className="text-muted">Next:</span> {m.nextSubtopic.title}</p>}
                <p className="num text-[13px] text-muted">{m.focus.counts.practised} of {m.focus.counts.total} subtopics practised</p>
              </div>
            ) : (
              <p className="text-[14px] text-muted">Every topic is complete. Keep demonstrating evidence where it is still missing.</p>
            )}
          </Panel>
          <Panel title="Next milestone" id="milestone" action={<TextLink href="/projects" className="text-[13px]">Project</TextLink>}>
            {m.milestone ? (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] text-muted">LedgerSync v2</p>
                <p className="text-[18px] font-medium leading-snug">{m.milestone.title}</p>
                <p className="text-[14px]">{m.milestone.completionCriteria}</p>
              </div>
            ) : m.phase ? (
              <p className="text-[14px]">{m.phase.deliverable}</p>
            ) : (
              <p className="text-[14px] text-muted">—</p>
            )}
            {m.phase && <p className="mt-3 text-[13px] text-muted">Phase {m.phase.ord} exit gate: {m.phase.exitGate}</p>}
          </Panel>
        </div>

      </div>
    </PageEnter>
  );
}
