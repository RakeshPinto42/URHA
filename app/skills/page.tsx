import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getPath, getSkills, listAttempts, listEvidence } from "@/lib/data";
import { LEVELS } from "@/lib/curriculum";
import { ASSESSMENTS, getAssessment } from "@/lib/assessments";
import { lowestMastery, MASTERY_LABEL, MASTERY_ORDER, type Mastery } from "@/lib/progress";
import { localDay } from "@/lib/dates";
import { PageEnter } from "@/components/Motion";
import { Canvas, TextLink } from "@/components/ui";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";

export const metadata: Metadata = { title: "Skills" };

const STATES: { id: Exclude<Mastery, "none">; meaning: string }[] = [
  { id: "learning", meaning: "Studied the concepts." },
  { id: "practising", meaning: "Did the guided exercises." },
  { id: "proficient", meaning: "Solved unfamiliar problems alone, with evidence." },
  { id: "demonstrated", meaning: "Passed the assessment." },
];

const KIND_LABEL = { submission: "Submission", test_result: "Test result", score: "Assessment score", project: "Project", review: "Review", file_ref: "File" } as const;

export default async function SkillsPage() {
  await connection();
  const skills = getSkills();
  const path = getPath();
  const topics = path.phases.flatMap((p) => p.topics.map((t) => ({ ...t, phaseOrd: p.ord })));
  const attempts = listAttempts();
  const currentOrd = path.phases.find((p) => p.id === path.currentPhaseId)?.ord ?? path.phases.length;

  return (
    <PageEnter>
      <FrontispieceBand art="path" section="skills" height="compact">
        <p className="text-[14px] text-[#f7f7f5]/85">Skills</p>
        <RisingTitle text="The Mastery" className="mt-1 font-serif text-[40px] leading-[1.05] sm:text-[52px]" />
        <p className="mt-2 max-w-[66ch] text-[15px] text-[#f7f7f5]/90">Twelve skills. Each one holds the lowest state across the topics that build it, counting the phases you have reached and any topic you have started early, so a skill is Demonstrated only when each of those topics has a passed assessment. Watching a course never raises a state.</p>
      </FrontispieceBand>
      <Canvas>

        <ol className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="The four mastery states">
          {STATES.map((s, i) => (
            <li key={s.id} className="rounded-[16px] bg-surface p-4">
              <MasteryTrack state={s.id} small />
              <p className="mt-3 text-[15px] font-medium"><span className="num text-muted">{i + 1}.</span> {MASTERY_LABEL[s.id]}</p>
              <p className="text-[13px] text-muted">{s.meaning}</p>
            </li>
          ))}
        </ol>

        <ul className="flex flex-col gap-3">
          {skills.map((s) => {
            const related = topics.filter((t) => t.skills.includes(s.id));
            // JOURNEY §6: judged on the phases reached so far, plus any topic already worked on ahead of schedule.
            const reached = related.filter((t) => t.phaseOrd <= currentOrd || t.mastery !== "none");
            const state = reached.length ? lowestMastery(reached.map((t) => t.mastery)) : "none";
            const relatedIds = related.map((t) => t.id);
            const evidence = listEvidence({ topicIds: relatedIds, skillId: s.id });
            const handIns = related.flatMap((t) => t.subtopics.filter((x) => x.progress.proficient && x.evidence).map((x) => ({ ...x, topicId: t.id })));
            const evidenceCount = evidence.length + handIns.length;
            const skillAssessments = ASSESSMENTS.filter((a) => a.skills.includes(s.id) || relatedIds.includes(a.topicId));
            const history = attempts.filter((x) => skillAssessments.some((a) => a.id === x.assessmentId));
            const demonstratedCount = related.filter((t) => t.demonstrated).length;
            const target = LEVELS.find((l) => l.level === s.target)?.name ?? "—";
            return (
              <li key={s.id} className="card-row">
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-1 items-center gap-3 p-4 sm:grid-cols-12 [&::-webkit-details-marker]:hidden">
                    <span className="sm:col-span-5">
                      <span className="block text-[16px] font-medium">{s.name}</span>
                      <span className="num block text-[13px] text-muted">
                        {related.length} topic{related.length === 1 ? "" : "s"} · {demonstratedCount} demonstrated · {evidenceCount} evidence record{evidenceCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="sm:col-span-5"><MasteryTrack state={state} /></span>
                    <span className="flex items-center justify-between gap-2 sm:col-span-2 sm:justify-end">
                      <span className="text-[14px] font-medium">{MASTERY_LABEL[state]}</span>
                      <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">⌄</span>
                    </span>
                  </summary>
                  <div className="grid grid-cols-1 gap-6 border-t border-rule px-4 pb-5 pt-4 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                      <h3 className="text-[13px] font-semibold">Built through</h3>
                      <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                        {related.map((t) => {
                          const a = ASSESSMENTS.find((x) => x.topicId === t.id);
                          return (
                            <li key={t.id} className="flex items-start justify-between gap-3">
                              <span className="min-w-0">
                                <Link href={`/academy/${t.id}`} className="hover:underline">{t.title}</Link>
                                <span className="num block text-[12px] text-muted">
                                  Phase {t.phaseOrd} · {t.counts.practised}/{t.counts.total} practised · {t.counts.proficient} proficient · {a && <Link className="underline decoration-control underline-offset-2" href={`/assessments/${a.id}`}>assessment</Link>}
                                </span>
                              </span>
                              <span className="flex-none text-[13px]">{MASTERY_LABEL[t.mastery]}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="mt-3 text-[12px] text-muted">Target by month 24: {target}.</p>
                    </div>
                    <div className="lg:col-span-4">
                      <h3 className="text-[13px] font-semibold">Evidence</h3>
                      {evidenceCount === 0 ? (
                        <p className="mt-2 text-[14px] text-muted">None yet. Evidence comes from Proficient steps’ hand-ins, assessment submissions and reviews, and project records.</p>
                      ) : (<>
                        <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                          {evidence.slice(0, 6).map((e) => (
                            <li key={e.id}>
                              {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-2">{e.title}</a> : <span>{e.title}</span>}
                              <span className="block text-[12px] text-muted">{KIND_LABEL[e.kind]} · {localDay(e.createdAt)}{e.attemptId ? <> · <Link href={`/assessments/attempt/${e.attemptId}`} className="underline decoration-control underline-offset-2">attempt</Link></> : null}</span>
                            </li>
                          ))}
                        </ul>
                      {handIns.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                          {handIns.slice(0, 4).map((h) => (
                            <li key={h.id}>
                              <Link href={`/academy/${h.topicId}#lessons`} className="underline decoration-control underline-offset-2">{h.title}</Link>
                              <span className="block text-[12px] text-muted">Proficient step · {h.updatedAt ? localDay(h.updatedAt) : ""}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {evidence.length > 6 || handIns.length > 4 ? <p className="mt-2 text-[12px] text-muted">More on each topic’s page.</p> : null}
                      </>)}
                    </div>
                    <div className="lg:col-span-3">
                      <h3 className="text-[13px] font-semibold">Assessment history</h3>
                      {history.length === 0 ? (
                        <p className="mt-2 text-[14px] text-muted">No attempts yet.</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-2 text-[14px]">
                          {history.slice(0, 6).map((h) => (
                            <li key={h.id}>
                              <Link href={`/assessments/attempt/${h.id}`} className="hover:underline">{getAssessment(h.assessmentId)?.title ?? h.assessmentId}</Link>
                              <span className="num block text-[12px] text-muted">
                                {localDay(h.submittedAt)} · {h.status === "awaiting_review" ? "awaiting review" : `${h.points !== null && h.maxPoints ? Math.floor((h.points / h.maxPoints) * 100) : 0}% · ${h.status === "passed" ? "passed" : "not passed"}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-[13px] text-muted">
          Evidence is never generated for you, and no AI scores anything: choice and SQL items are checked deterministically, and practical work is reviewed against a rubric by a named reviewer. <TextLink href="/assessments">All assessments</TextLink>
        </p>
      </Canvas>
    </PageEnter>
  );
}

/** Four segments; filled up to the state reached. Shape plus text, never colour alone. */
function MasteryTrack({ state, small = false }: { state: Mastery; small?: boolean }) {
  const reached = MASTERY_ORDER.indexOf(state);
  return (
    <span className={`flex items-center gap-1 ${small ? "" : "w-full"}`} role="img" aria-label={`Mastery: ${MASTERY_LABEL[state]}`}>
      {STATES.map((s, i) => {
        const on = reached >= i + 1;
        const top = s.id === "demonstrated";
        return (
          <span key={s.id}
            className={`${small ? "h-2 w-8" : "h-2.5 flex-1"} rounded-full ${on ? (top ? "bg-accent" : "bg-ink") : "border border-control bg-transparent"}`} />
        );
      })}
    </span>
  );
}
