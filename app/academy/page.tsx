import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getPath } from "@/lib/data";
import { ASSESSMENTS } from "@/lib/assessments";
import { pendingUnits, type CareerUnit } from "@/lib/career";
import { SUBTOPIC_PLANS } from "@/lib/catalog";
import { PROJECTS, PHASES } from "@/lib/curriculum";
import { disciplineOf, plinthMarks, standings, type Standing } from "@/lib/academy";
import { pctLabel } from "@/lib/progress";
import { PageEnter } from "@/components/Motion";
import { Meter, Notice, TextLink } from "@/components/ui";
import { RoomHero } from "@/components/realm/RoomHero";
import { EXERCISES, LEVEL_LABEL, type Exercise } from "@/lib/practice/exercises";
import { practiceStatus, type ExerciseStatus } from "@/lib/practice/progress";

export const metadata: Metadata = { title: "Academy" };

const CHALLENGE_LABEL = { "not-attempted": "Not attempted", "awaiting-review": "Awaiting review", failed: "Not passed yet", passed: "Passed" } as const;

function Exercise({ unit }: { unit: CareerUnit }) {
  return (
    <>
      <p className="mt-1 text-[15px] font-medium">
        <Link href={`/academy/${unit.topic.id}#lessons`} className="hover:underline">{unit.subtopic.title}</Link>
      </p>
      {unit.plan?.exercise && <p className="mt-1 max-w-[62ch] text-[14px] text-muted">{unit.plan.exercise}{unit.plan.exerciseMinutes ? ` About ${unit.plan.exerciseMinutes} minutes.` : ""}</p>}
    </>
  );
}

function DisciplineRow({ s, next, challenges, practice }: { s: Standing; next: CareerUnit | undefined; challenges: { id: string; title: string; state: keyof typeof CHALLENGE_LABEL }[]; practice: { passed: number; total: number; next: Exercise | null } }) {
  return (
    <li id={s.discipline.id} className="grid grid-cols-1 gap-4 border-t border-border py-6 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h3 className="font-display text-[26px] leading-tight">{s.discipline.title}</h3>
        <p className="mt-1 text-[14px] text-muted">{s.discipline.line}</p>
        <div className="mt-3 max-w-[260px]"><Meter value={s.practised} max={Math.max(s.total, 1)} label={`${s.discipline.title}: ${s.practised} of ${s.total} practised`} /></div>
        <p className="num mt-1 text-[13px] text-muted">{s.practised} of {s.total} exercises practised, {pctLabel(s.practised, s.total)}</p>
        {practice.total > 0 && (
          <p className="mt-2 text-[14px]">
            <span className="num">{practice.passed} of {practice.total}</span> <span className="text-muted">practice exercises passed.</span>{" "}
            {practice.next ? <TextLink href={`/academy/practice?c=${practice.next.id}`}>Next: {practice.next.title}</TextLink> : <span className="text-positive">All passed.</span>}
          </p>
        )}
      </div>
      <div className="lg:col-span-5">
        <p className="text-[13px] text-muted">Next exercise</p>
        {next ? <Exercise unit={next} /> : <p className="mt-1 text-[14px]">Every exercise here is practised.</p>}
      </div>
      <div className="lg:col-span-3">
        <p className="text-[13px] text-muted">Challenges</p>
        {challenges.length === 0 ? <p className="mt-1 text-[14px] text-muted">None written for this discipline yet.</p> : (
          <ul className="mt-1 flex flex-col gap-1.5 text-[14px]">
            {challenges.slice(0, 3).map((c) => (
              <li key={c.id}><Link href={`/assessments/${c.id}`} className="hover:underline">{c.title}</Link> <span className="text-[12px] text-muted">{CHALLENGE_LABEL[c.state]}</span></li>
            ))}
            {challenges.length > 3 && <li><TextLink href="/assessments" className="text-[13px]">{challenges.length - 3} more</TextLink></li>}
          </ul>
        )}
      </div>
    </li>
  );
}

export default async function AcademyPage() {
  await connection();
  const path = getPath();
  const statuses = assessmentStatuses();
  const topics = path.phases.flatMap((p) => p.topics);
  const list = standings(topics);
  const pending = pendingUnits(path.phases, SUBTOPIC_PLANS);
  const next = pending[0] ?? null;
  const titleOf = new Map(topics.map((t) => [t.id, t.title]));
  const defs = PHASES.flatMap((p) => p.topics);
  const status: Record<string, ExerciseStatus> = practiceStatus();
  const practiceFor = (id: string) => {
    const own = EXERCISES.filter((e) => e.discipline === id);
    return { passed: own.filter((e) => status[e.id]?.passed).length, total: own.length, next: own.find((e) => !status[e.id]?.passed) ?? null };
  };
  const nextExercise = EXERCISES.find((e) => !status[e.id]?.passed) ?? null;
  const passedCount = EXERCISES.filter((e) => status[e.id]?.passed).length;
  const challengesFor = (id: string) => ASSESSMENTS
    .filter((a) => disciplineOf(titleOf.get(a.topicId) ?? "").id === id)
    .map((a) => ({ id: a.id, title: a.title, state: statuses.get(a.id)?.state ?? ("not-attempted" as const) }));

  return (
    <PageEnter>
      <RoomHero destination="academy" title="Grounds of Practice" data={{ disciplines: plinthMarks(list) }}
        label="A sunlit marble quadrangle with a long pool, cloisters, trees and six lit plinths, one for each discipline."
        pickPrefix="/academy#">
        <p className="mt-3 max-w-[56ch] text-[17px] text-white/95">Career sets the journey. Here you train for it, through exercises, challenges and projects.</p>
      </RoomHero>

      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-10 sm:px-6">
        {next ? (
          <section aria-labelledby="now-h" className="max-w-[72ch]">
            <h2 id="now-h" className="font-display text-[20px] text-muted">Practise now</h2>
            <p className="mt-2 font-display text-[36px] leading-[1.1]">{next.subtopic.title}</p>
            {next.plan?.exercise && <p className="mt-3 text-[17px] leading-relaxed">{next.plan.exercise}</p>}
            <p className="num mt-2 text-[13px] text-muted">{next.topic.title}, month {next.subtopic.month}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/academy/${next.topic.id}#lessons`} className="btn btn-primary">Open this exercise</Link>
              <Link href={`/tasks?new=1&for=${next.topic.id}&as=build`} className="btn btn-secondary">Plan it as a task</Link>
              <Link href="/academy/practice" className="btn btn-secondary">Open the Practice yard</Link>
            </div>
          </section>
        ) : <Notice>Every exercise is practised. Open the challenges to demonstrate what remains.</Notice>}

        <section aria-labelledby="yard-h" className="mt-12 grid grid-cols-1 gap-4 border-t border-border pt-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="yard-h" className="font-display text-[22px]">The Practice yard</h2>
            <p className="num mt-1 text-[14px] text-muted">{passedCount} of {EXERCISES.length} exercises passed, saved with your progress.</p>
          </div>
          <div className="lg:col-span-8">
            {nextExercise ? (
              <>
                <p className="text-[13px] text-muted">Recommended next · {LEVEL_LABEL[nextExercise.level]}</p>
                <p className="mt-1 text-[18px] font-medium">{nextExercise.title}</p>
                <p className="mt-1 max-w-[70ch] text-[14px] text-muted">{nextExercise.brief}</p>
                <Link href={`/academy/practice?c=${nextExercise.id}`} className="btn btn-primary mt-3">Practise it now</Link>
              </>
            ) : <p className="text-[15px]">Every exercise is passed. Keep the code: it is evidence for the matching topics.</p>}
          </div>
        </section>

        <section aria-labelledby="disciplines-h" className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="disciplines-h" className="font-display text-[26px]">Disciplines</h2>
            <TextLink href="/academy/study" className="text-[14px]">Browse all topics and lessons</TextLink>
          </div>
          <ul className="mt-4">
            {list.map((s) => (
              <DisciplineRow key={s.discipline.id} s={s} next={pending.find((u) => disciplineOf(u.topic.title).id === s.discipline.id)} challenges={challengesFor(s.discipline.id)} practice={practiceFor(s.discipline.id)} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="projects-h" className="mt-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="projects-h" className="font-display text-[26px]">Projects</h2>
            <TextLink href="/projects" className="text-[14px]">Open the project evidence</TextLink>
          </div>
          <ol className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
            {PROJECTS.map((p) => {
              const built = topics.filter((t) => defs.find((d) => d.id === t.id)?.project === p.id);
              return (
                <li key={p.id} className="border-t border-border pt-3">
                  <p className="text-[16px] font-medium"><span className="num text-muted">{p.id}</span> {p.title}</p>
                  <p className="num text-[13px] text-muted">{built.filter((t) => t.demonstrated).length} of {built.length} topics demonstrated</p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </PageEnter>
  );
}
