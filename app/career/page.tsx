import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getPath, getSettings, getSkills, type TopicView } from "@/lib/data";
import { CAREER_MILESTONES, PHASES, PROJECTS } from "@/lib/curriculum";
import { ASSESSMENTS } from "@/lib/assessments";
import { embedUrl, pendingUnits, skillStandings, totalHours, weekOf, type CareerUnit } from "@/lib/career";
import { SUBTOPIC_PLANS, type CatalogResource } from "@/lib/catalog";
import { paneAt } from "@/lib/cinema";
import { MASTERY_LABEL, MASTERY_ORDER, STATUS_LABEL } from "@/lib/progress";
import { PageEnter } from "@/components/Motion";
import { Canvas, Notice, Panel, StatusLabel, TextLink } from "@/components/ui";
import { RoomHero } from "@/components/realm/RoomHero";
import { EXERCISES } from "@/lib/practice/exercises";
import { practiceStatus } from "@/lib/practice/progress";
import { journeyFrom } from "@/lib/journey/model";
import { StepLadder } from "@/components/forms/StepLadder";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Career Intelligence" };

const ASSESS_LABEL = { "not-attempted": "Not attempted", "awaiting-review": "Awaiting review", failed: "Not passed yet", passed: "Passed" } as const;
const hoursLabel = (h: number) => `${h < 1 ? `${Math.round(h * 60)} min` : `${Math.round(h * 10) / 10} h`}`;
const lengthLabel = (m: number | null) => (m === null ? "Length unknown" : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`);

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-[13px] text-muted">{label}</dt><dd className="mt-0.5 text-[15px]">{children}</dd></div>;
}

function Facts({ r }: { r: CatalogResource }) {
  return (
    <p className="num mt-1 text-[13px] text-muted">
      {r.author} · {lengthLabel(r.minutes)}{r.segment ? ` · watch ${r.segment}` : ""} · {r.difficulty ? `${r.difficulty[0]!.toUpperCase()}${r.difficulty.slice(1)}` : "Difficulty not rated yet"}
    </p>
  );
}

/** The Practice yard exercises that train a topic, so a lesson always leads to doing. */
function PracticeLinks({ topicId }: { topicId: string }) {
  const own = EXERCISES.filter((e) => e.topicId === topicId);
  if (!own.length) return null;
  const st = practiceStatus();
  return (
    <p className="mb-3 text-[14px]">
      <span className="text-muted">Practise it:</span>{" "}
      {own.map((e, i) => (
        <span key={e.id}>{i > 0 ? ", " : ""}<Link href={`/academy/practice?c=${e.id}`} className="underline decoration-control underline-offset-4">{e.title}</Link>{st[e.id]?.passed ? " ✓" : ""}{e.market ? <span className="text-muted"> (real prices, optional)</span> : null}</span>
      ))}
    </p>
  );
}

/** The lesson to do now, with everything needed to do it here. */
function NextLesson({ unit, topicDef }: { unit: CareerUnit; topicDef: { why: string; finance: string } | undefined }) {
  const { plan, subtopic, topic, phase } = unit;
  const video = plan?.primary?.kind === "video" ? plan.primary : null;
  const exposed = subtopic.progress.exposed;
  return (
    <section aria-labelledby="next-h" className="panel">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="next-h" className="text-[14px] font-semibold">{exposed ? "Next: do the exercise" : "Next lesson"}</h2>
        <p className="num text-[13px] text-muted">Phase {phase.ord} · {topic.title} · Month {subtopic.month}</p>
      </div>
      <p className="mt-2 font-serif text-[30px] leading-[1.1]">{subtopic.title}</p>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <PracticeLinks topicId={topic.id} />
          {video?.embeddable && video.videoId ? (
            <iframe src={embedUrl(video.videoId, video.startSec, video.endSec)} title={video.title} loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin"
              className="aspect-video w-full rounded-[14px] border-0 bg-ink" />
          ) : (
            <Notice>{video ? "This video cannot play inside the app, so use the link below." : plan?.pending ? `No video for this one. ${plan.pending}` : "No study plan is mapped to this subtopic yet."}</Notice>
          )}
          {plan?.primary && (
            <div className="mt-3">
              <a href={plan.primary.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[16px] font-medium underline decoration-control underline-offset-4">
                {plan.primary.title}<Icon name="external" size={14} className="mt-1" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
              <Facts r={plan.primary} />
              {plan.primary.caution && <p className="mt-1 text-[13px] text-muted">{plan.primary.caution}</p>}
            </div>
          )}
          {plan?.supplement && (
            <p className="mt-2 text-[14px] text-muted">
              Alternative: <a href={plan.supplement.url} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">{plan.supplement.title}<span className="sr-only"> (opens in a new tab)</span></a>
            </p>
          )}
        </div>
        <dl className="flex flex-col gap-3 lg:col-span-5">
          {plan?.outcome && <Fact label="What you will learn">You will be able to {plan.outcome}.</Fact>}
          {plan?.primary?.objectives?.length ? (
            <Fact label="This lesson covers"><ul className="list-disc pl-4">{plan.primary.objectives.map((o) => <li key={o}>{o}</li>)}</ul></Fact>
          ) : null}
          {(topicDef?.why || plan?.primary?.why) && <Fact label="Why you need it">{plan?.primary?.why ?? topicDef?.why}</Fact>}
          {plan && <Fact label={`Finance exercise, about ${plan.exerciseMinutes} min`}>{plan.exercise}</Fact>}
          <Fact label="Done when">You finish the exercise and mark it Practised. Proficient needs written evidence, and Demonstrated needs a passed assessment.</Fact>
        </dl>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-[13px] text-muted">Record your progress. Studied means you watched it, and that alone does not move the plan on. It moves on when you mark Practised.</p>
        <StepLadder subtopics={[subtopic]} plans={{}} />
      </div>
    </section>
  );
}

function WeekCard({ unit, index }: { unit: CareerUnit; index: number }) {
  const r = unit.plan?.primary;
  return (
    <li className="card-row flex gap-3 p-3">
      {r?.videoId ? (
        // A remote thumbnail: next/image would proxy it through this server for no benefit.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://i.ytimg.com/vi/${encodeURIComponent(r.videoId)}/mqdefault.jpg`} alt="" loading="lazy" width={128} height={72} className="hidden aspect-video w-32 flex-none rounded-[8px] object-cover sm:block" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium"><span className="num text-muted">{index + 1}.</span> {unit.subtopic.title}</p>
        {r ? (
          <>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[14px] underline decoration-control underline-offset-4">{r.title}<span className="sr-only"> (opens in a new tab)</span></a>
            <Facts r={r} />
          </>
        ) : <p className="text-[13px] text-muted">No video. {unit.plan?.pending}</p>}
        <p className="num mt-1 text-[12px] text-muted">
          <Link href={`/academy/${unit.topic.id}`} className="underline decoration-control underline-offset-4">{unit.topic.title}</Link> · about {hoursLabel(unit.hours)} with the exercise
        </p>
      </div>
    </li>
  );
}

function TrackBar({ value, max, pane, label }: { value: number; max: number; pane: string; label: string }) {
  const pct = max > 0 ? Math.floor((value / max) * 100) : 0;
  return (
    <span role="img" aria-label={label} className="block h-2 overflow-hidden rounded-full bg-control/40">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: pane }} />
    </span>
  );
}

export default async function CareerPage() {
  await connection();
  const path = getPath();
  const settings = getSettings();
  const statuses = assessmentStatuses();
  const pending = pendingUnits(path.phases, SUBTOPIC_PLANS);
  const next = pending[0] ?? null;
  const week = weekOf(pending, settings.weeklyTargetHours);
  const phase = next?.phase ?? path.phases.at(-1)!;
  const topicDef = next ? PHASES.flatMap((p) => p.topics).find((t) => t.id === next.topic.id) : undefined;
  const skills = skillStandings(getSkills(), path.phases, phase.id);
  const earned = skills.filter((s) => s.mastery === "demonstrated");
  const open = skills.filter((s) => s.mastery !== "demonstrated").sort((a, b) => MASTERY_ORDER.indexOf(b.mastery) - MASTERY_ORDER.indexOf(a.mastery));
  const assignments: TopicView[] = phase.topics.filter((t) => t.status !== "completed" && t.status !== "mastered").slice(0, 4);
  const allTopics = path.phases.flatMap((p) => p.topics.map((t) => ({ ...t, phaseId: p.id })));
  const defs = PHASES.flatMap((p) => p.topics);
  const journey = journeyFrom(path);
  const phaseAssessments = ASSESSMENTS.filter((a) => phase.topics.some((t) => t.id === a.topicId));

  return (
    <PageEnter>
      <RoomHero destination="career" title="Hall of Wisdom" data={{ phases: journey.stations.map((s, i) => ({ id: s.id, title: s.title, state: s.state, color: paneAt(i).bright })) }}
        label="A vast marble hall lined with two storeys of books, under a gold vault, with six banners of light and a great round window at the far end."
        pickPrefix="/path?phase=">
        <p className="mt-2 text-[19px] text-white">Enterprise AI Solutions Architect</p>
        <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#f7f7f5]/90" aria-label="Career destination">
          {CAREER_MILESTONES.map((m, i) => (
            <li key={m.title} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">→</span>}{m.title}
            </li>
          ))}
        </ol>
      </RoomHero>

      <Canvas>
        <div className="flex flex-col gap-8">
          <section aria-labelledby="journey-h">
            <h2 id="journey-h" className="sr-only">The six learning phases</h2>
            <ol className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
              {path.phases.map((p, i) => {
                const pane = paneAt(i);
                const here = p.id === phase.id;
                return (
                  <li key={p.id}>
                    <Link href={`/path?phase=${p.id}`} className={`block h-full rounded-[16px] p-3 transition-colors ${here ? "text-white" : "bg-surface hover:bg-active"}`}
                      style={here ? { background: pane.deep } : undefined} aria-current={here ? "step" : undefined}>
                      <span className="num block text-[12px] opacity-80">Phase {p.ord} · Months {p.months[0]}–{p.months[1]}</span>
                      <span className="mt-1 block min-h-[40px] text-[14px] font-medium leading-tight">{p.title}</span>
                      <span className="mt-2 block"><TrackBar value={p.counts.practised} max={p.counts.total} pane={here ? "#fff" : pane.bright} label={`${p.counts.practised} of ${p.counts.total} practised`} /></span>
                      <span className="num mt-1 block text-[12px] opacity-80">{here ? "You are here · " : ""}{p.counts.practised} of {p.counts.total}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          {next ? <NextLesson unit={next} topicDef={topicDef} /> : <Notice>Every subtopic is practised. Open the Assessments to demonstrate what remains.</Notice>}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section aria-labelledby="week-h" className="lg:col-span-8">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="week-h" className="text-[14px] font-semibold">This week</h2>
                <p className="num text-[13px] text-muted">About {hoursLabel(totalHours(week))} of your {settings.weeklyTargetHours} h target · <TextLink href="/settings">Change hours</TextLink></p>
              </div>
              <ol className="flex flex-col gap-2">{week.map((u, i) => <WeekCard key={u.subtopic.id} unit={u} index={i} />)}</ol>
              <p className="num mt-2 text-[12px] text-muted">{pending.length} subtopics still to practise, about {Math.round(totalHours(pending))} hours. Times allow for pausing and first attempts.</p>
            </section>

            <Panel title="Skills" className="lg:col-span-4" action={<TextLink href="/skills" className="text-[13px]">Open</TextLink>}>
              <p className="text-[13px] text-muted">{earned.length} of {skills.length} demonstrated</p>
              {earned.length > 0 && <ul className="mt-2 flex flex-wrap gap-1">{earned.map((s) => <li key={s.id} className="chip chip-accent">{s.name}</li>)}</ul>}
              <ul className="mt-3 flex flex-col gap-2">
                {open.map((s) => (
                  <li key={s.id}>
                    <p className="flex items-baseline justify-between gap-2 text-[14px]"><span className="min-w-0">{s.name}</span><span className="flex-none text-[12px] text-muted">{s.mastery === "none" ? "Not started" : MASTERY_LABEL[s.mastery]}</span></p>
                    <TrackBar value={MASTERY_ORDER.indexOf(s.mastery)} max={MASTERY_ORDER.length - 1} pane="var(--accent)" label={`${s.name}: ${s.mastery === "none" ? "Not started" : MASTERY_LABEL[s.mastery]}`} />
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Practical assignments">
              <ul className="flex flex-col gap-3">
                {assignments.map((t) => (
                  <li key={t.id}>
                    <Link href={`/academy/${t.id}#assignment`} className="text-[15px] font-medium hover:underline">{t.title}</Link>
                    <p className="text-[14px]">{t.assignment}</p>
                    <p className="text-[12px] text-muted">{STATUS_LABEL[t.status]}</p>
                  </li>
                ))}
                {assignments.length === 0 && <li className="text-[14px] text-muted">Nothing open in this phase.</li>}
              </ul>
            </Panel>
            <Panel title="Portfolio projects" action={<TextLink href="/projects" className="text-[13px]">Open</TextLink>}>
              <ul className="flex flex-col gap-3">
                {PROJECTS.map((p) => {
                  const built = allTopics.filter((t) => defs.find((d) => d.id === t.id)?.project === p.id);
                  const done = built.filter((t) => t.demonstrated).length;
                  return (
                    <li key={p.id}>
                      <p className="text-[15px] font-medium"><span className="num text-muted">{p.id}</span> {p.title}</p>
                      <p className="num text-[12px] text-muted">{done} of {built.length} topics demonstrated</p>
                    </li>
                  );
                })}
              </ul>
            </Panel>
            <Panel title="Knowledge assessments" action={<TextLink href="/assessments" className="text-[13px]">Open</TextLink>}>
              <p className="mb-2 text-[13px] text-muted">In Phase {phase.ord}</p>
              {phaseAssessments.length === 0 ? <p className="text-[14px] text-muted">No assessment is written for this phase yet, so its topics cannot reach Demonstrated.</p> : (
                <ul className="flex flex-col gap-2">
                  {phaseAssessments.map((a) => {
                    const state = statuses.get(a.id)?.state ?? "not-attempted";
                    return (
                      <li key={a.id} className="flex items-start justify-between gap-2 text-[14px]">
                        <Link href={`/assessments/${a.id}`} className="min-w-0 hover:underline">{a.title}</Link>
                        <span className={`chip flex-none ${state === "passed" ? "chip-accent" : ""}`}>{ASSESS_LABEL[state]}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          {next && <p className="text-[13px] text-muted">Current topic: <StatusLabel status={next.topic.status} /> <Link href={`/academy/${next.topic.id}`} className="underline decoration-control underline-offset-4">{next.topic.title}</Link></p>}
        </div>
      </Canvas>
    </PageEnter>
  );
}
