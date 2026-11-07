import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getMilestones, getPath, getResources, getSkills, listTasks } from "@/lib/data";
import { assessmentsForTopic, reviewMode } from "@/lib/assessments";
import { DIFFICULTY_LABEL, REVIEW_LABEL } from "@/lib/assessments/labels";
import { MASTERY_LABEL } from "@/lib/progress";
import { quoteForDay } from "@/lib/quotes";
import { today } from "@/lib/dates";
import { CATEGORY_LABEL, TASK_STATUS_LABEL } from "@/lib/taskLogic";
import { PageEnter } from "@/components/Motion";
import { Panel, Quote, StatusLabel, TextLink } from "@/components/ui";
import { StepLadder } from "@/components/forms/StepLadder";
import { ResourceRow } from "@/components/forms/ResourceRow";
import { TopicNotes } from "@/components/forms/TopicNotes";
import { Icon } from "@/components/Icon";
import { SUBTOPIC_PLANS, coverageFor } from "@/lib/catalog";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";
import { paneAt } from "@/lib/cinema";
import type { ArtId } from "@/lib/art";

/** One painting for each phase's topics, so moving through the path changes the picture. */
const PHASE_ART: ArtId[] = ["study", "road", "codex", "water", "end", "mount", "path"];

type Props = { params: Promise<{ topicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { topicId } = await params;
  return { title: getPath().topicTitles[topicId] ?? "Topic" };
}

export default async function TopicPage({ params }: Props) {
  await connection();
  const { topicId } = await params;
  const path = getPath();
  const phase = path.phases.find((p) => p.topics.some((t) => t.id === topicId));
  const topic = phase?.topics.find((t) => t.id === topicId);
  if (!phase || !topic) notFound();

  const skills = getSkills().filter((s) => topic.skills.includes(s.id));
  const resources = getResources(topic.id);
  const milestone = getMilestones().find((m) => m.id === topic.milestoneId) ?? null;
  const tasks = listTasks().filter((t) => t.topicId === topic.id);
  const prereqs = topic.prerequisites.map((id) => path.phases.flatMap((p) => p.topics).find((t) => t.id === id)!).filter(Boolean);
  const finished = topic.status === "completed" || topic.status === "mastered";
  const quote = quoteForDay(finished ? "completion" : "session", today());
  const assessments = assessmentsForTopic(topic.id);
  const statuses = assessmentStatuses();
  const byKind = (kinds: string[]) => resources.filter((r) => kinds.includes(r.kind));
  const groups = [
    { title: "Udemy", items: byKind(["udemy"]) },
    { title: "YouTube", items: byKind(["youtube"]) },
    { title: "Documentation and reading", items: byKind(["docs", "article", "course"]) },
  ].filter((g) => g.items.length);

  return (
    <PageEnter>
      <FrontispieceBand art={PHASE_ART[(phase.ord - 1) % PHASE_ART.length]!} section="academy" height="compact" showCaption={false}
        panes={{ pane: paneAt(phase.ord - 1), light: paneAt(phase.ord + 1) }}>
        <nav aria-label="Breadcrumb" className="mb-3 text-[13px] text-[#f7f7f5]/85">
          <Link href="/academy" className="hover:underline">Academy</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={`/path#${phase.id}`} className="hover:underline">Phase {phase.ord}</Link>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-[62ch]">
            <RisingTitle text={topic.title} className="font-serif text-[34px] leading-[1.08] sm:text-[44px]" />
            <p className="mt-2 text-[16px] text-[#f7f7f5]/90">{topic.objective}</p>
          </div>
          <span className="w-fit flex-none rounded-full bg-white px-3 py-1 text-ink"><StatusLabel status={topic.status} /></span>
        </div>
      </FrontispieceBand>
      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-8 sm:px-6">

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <Panel title="Concept" id="concept">
              <p className="prose-read">{topic.summary}</p>
              {prereqs.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[13px] text-muted">Prerequisites</h3>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {prereqs.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 text-[14px]">
                        <TextLink href={`/academy/${p.id}`}>{p.title}</TextLink>
                        <StatusLabel status={p.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <Panel title="Lessons" id="lessons" action={<span className="num text-[13px] text-muted">{topic.counts.exposed} learning · {topic.counts.practised} practising · {topic.counts.proficient} proficient</span>}>
              {(() => { const c = coverageFor([topic.id]); return (
                <p className="num mb-2 text-[13px] text-muted">Study plan: {c.videoPrimary} video segments and {c.docsPrimary} official docs as primary resources · about {Math.round(c.watchMinutes / 60 * 10) / 10} h to watch and {Math.round(c.practiceMinutes / 60 * 10) / 10} h of exercises.</p>
              ); })()}
              <p className="mb-4 text-[14px] text-muted">
                <span className="text-ink">Studied</span> (Learning) means you watched or read it. <span className="text-ink">Practised</span> (Practising) means you did the guided exercise.{" "}
                <span className="text-ink">Proficient</span> means you solved an unfamiliar problem on your own, with evidence. <span className="text-ink">Demonstrated</span> comes only from passing the topic’s assessment below.
              </p>
              <StepLadder subtopics={topic.subtopics} plans={Object.fromEntries(topic.subtopics.filter((s) => SUBTOPIC_PLANS.has(s.id)).map((s) => [s.id, SUBTOPIC_PLANS.get(s.id)!]))} />
            </Panel>

            <Panel title="Practical assignment" id="assignment">
              <p className="prose-read">{topic.assignment}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/tasks?new=1&for=${topic.id}&as=build`} className="btn btn-primary"><Icon name="plus" /> Plan this as a task</Link>
                <Link href={`/tasks?new=1&for=${topic.id}&as=learn`} className="btn btn-secondary">Plan a study session</Link>
              </div>
            </Panel>

            <Panel title="Assessment" id="assessment" action={<span className="text-[13px] text-muted">{MASTERY_LABEL[topic.mastery]}</span>}>
                <ul className="flex flex-col gap-3">
                  {assessments.map((a) => {
                    const st = statuses.get(a.id)!;
                    return (
                      <li key={a.id} className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link href={`/assessments/${a.id}`} className="text-[16px] font-medium hover:underline">{a.title}</Link>
                          <p className="mt-1 text-[14px] text-muted">{a.summary}</p>
                          <p className="num mt-1 text-[13px] text-muted">{DIFFICULTY_LABEL[a.difficulty]} · about {Math.round(a.minutes / 60 * 10) / 10} h · pass {a.passPercent}% · {REVIEW_LABEL[reviewMode(a)]}</p>
                        </div>
                        <span className={`chip flex-none ${st.state === "passed" ? "chip-accent" : st.state === "not-attempted" ? "" : "chip-warn"}`}>
                          {st.state === "passed" ? "Passed" : st.state === "awaiting-review" ? "Awaiting review" : st.state === "failed" ? `Not passed yet · best ${st.bestPercent ?? 0}%` : "Not attempted"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
            </Panel>
          </div>

          <aside className="flex flex-col gap-4 lg:col-span-4">
            <Panel title="Resources" id="resources">
              {groups.length === 0 ? (
                <p className="text-[14px] text-muted">No resource is assigned to this topic yet. The practical assignment and official documentation are enough to start.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {groups.map((g) => (
                    <div key={g.title}>
                      <h3 className="mb-2 text-[13px] text-muted">{g.title}</h3>
                      <ul className="flex flex-col gap-2">{g.items.map((r) => <ResourceRow key={r.id} r={r} />)}</ul>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Related project" id="project">
              {milestone ? (
                <div className="flex flex-col gap-2 text-[14px]">
                  <p className="text-[13px] text-muted">LedgerSync v2 · milestone {milestone.ord}</p>
                  <p className="text-[16px] font-medium">{milestone.title}</p>
                  <p><span className="text-muted">Business problem:</span> {milestone.businessProblem}</p>
                  <TextLink href="/projects" className="text-[13px]">See the project</TextLink>
                </div>
              ) : <p className="text-[14px] text-muted">—</p>}
            </Panel>

            <Panel title="Skills" id="skills">
              <ul className="flex flex-col gap-1 text-[14px]">{skills.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
            </Panel>

            <Panel title="Tasks for this topic" id="tasks" action={<TextLink href={`/tasks?topic=${topic.id}`} className="text-[13px]">Open</TextLink>}>
              {tasks.length === 0 ? (
                <p className="text-[14px] text-muted">None planned.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-[14px]">
                  {tasks.slice(0, 5).map((t) => (
                    <li key={t.id} className="flex justify-between gap-3">
                      <Link href={`/tasks?task=${t.id}`} className="truncate hover:underline">{t.title}</Link>
                      <span className="flex-none text-[13px] text-muted">{TASK_STATUS_LABEL[t.status]} · {CATEGORY_LABEL[t.category]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Notes" id="notes">
              <TopicNotes topicId={topic.id} needsRevision={topic.needsRevision} notes={topic.revisionNotes} />
            </Panel>

            {quote && (
              <div className="px-1 pt-4">
                <Quote quote={quote} size="sm" />
              </div>
            )}
          </aside>
        </div>
      </div>
    </PageEnter>
  );
}
