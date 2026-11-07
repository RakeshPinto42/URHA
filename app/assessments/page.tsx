import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getPath, listAttempts, type AssessmentState } from "@/lib/data";
import { ASSESSMENTS, getAssessment, reviewMode } from "@/lib/assessments";
import { DIFFICULTY_LABEL, percentOf, REVIEW_LABEL } from "@/lib/assessments/labels";
import { localDay } from "@/lib/dates";
import { LANDMARK } from "@/lib/journey/model";
import { PageEnter } from "@/components/Motion";
import { Canvas } from "@/components/ui";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";

export const metadata: Metadata = { title: "Assessments" };

function stateLabel(s: AssessmentState) {
  if (s.state === "passed") return { text: "Passed", cls: "chip chip-accent" };
  if (s.state === "awaiting-review") return { text: "Awaiting review", cls: "chip chip-warn" };
  if (s.state === "failed") return { text: `Best ${s.bestPercent ?? 0}%`, cls: "chip chip-warn" };
  return { text: "Not attempted", cls: "chip" };
}

export default async function AssessmentsPage() {
  await connection();
  const path = getPath();
  const statuses = assessmentStatuses();
  const attempts = listAttempts();
  const awaiting = attempts.filter((x) => x.status === "awaiting_review");
  const passed = ASSESSMENTS.filter((a) => statuses.get(a.id)?.state === "passed").length;
  const topics = path.phases.flatMap((p) => p.topics).length;

  return (
    <PageEnter>
      <FrontispieceBand art="samaritan" section="assessments" height="compact">
        <p className="text-[14px] text-[#f7f7f5]/85">Assessments</p>
        <RisingTitle text="The Proving" className="mt-1 font-serif text-[40px] leading-[1.05] sm:text-[52px]" />
        <p className="mt-2 max-w-[62ch] text-[15px] text-[#f7f7f5]/90">
            Finishing a lesson shows you were exposed to a topic. Passing here shows you can do it, and it is the only way a topic becomes Demonstrated.
            You have passed <span className="num">{passed}</span> of <span className="num">{topics}</span>.
          </p>
      </FrontispieceBand>
      <Canvas>

        {awaiting.length > 0 && (
          <section aria-labelledby="awaiting-h" className="mb-10">
            <h2 id="awaiting-h" className="text-[14px] font-semibold">Waiting for a reviewer</h2>
            <ul className="mt-2 flex flex-col">
              {awaiting.map((x) => (
                <li key={x.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-border py-2.5 text-[15px]">
                  <Link href={`/assessments/attempt/${x.id}#review`} className="underline decoration-control underline-offset-4 hover:decoration-current">{getAssessment(x.assessmentId)?.title ?? x.assessmentId}</Link>
                  <span className="num text-[13px] text-muted">Submitted {localDay(x.submittedAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-10">
          {path.phases.map((p) => {
            const items = p.topics.flatMap((t) => ASSESSMENTS.filter((a) => a.topicId === t.id));
            return (
              <section key={p.id} aria-labelledby={`${p.id}-a`} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <h2 id={`${p.id}-a`} className="font-serif text-[22px] leading-tight">{LANDMARK[p.id]}</h2>
                  <p className="num text-[13px] text-muted">Phase {p.ord}, months {p.months[0]}–{p.months[1]}</p>
                </div>
                <ul className="flex flex-col lg:col-span-9">
                  {items.map((a) => {
                    const s = stateLabel(statuses.get(a.id)!);
                    return (
                      <li key={a.id} className="flex flex-col gap-1.5 border-t border-border py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div className="min-w-0">
                          <Link href={`/assessments/${a.id}`} className="text-[16px] font-medium hover:underline">{a.title}</Link>
                          <p className="num text-[13px] text-muted">{DIFFICULTY_LABEL[a.difficulty]}, about {Math.round((a.minutes / 60) * 10) / 10} h, {a.passPercent}% to pass, {REVIEW_LABEL[reviewMode(a)]}</p>
                        </div>
                        <span className={`${s.cls} self-start`}>{s.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {attempts.length > 0 && (
          <section aria-labelledby="all-h" className="mt-12 border-t border-border pt-6">
            <h2 id="all-h" className="text-[14px] font-semibold">Every attempt</h2>
            <ul className="mt-2 flex flex-col gap-1 text-[14px]">
              {attempts.map((x) => (
                <li key={x.id} className="flex flex-wrap justify-between gap-x-4">
                  <Link href={`/assessments/attempt/${x.id}`} className="hover:underline">{getAssessment(x.assessmentId)?.title ?? x.assessmentId}</Link>
                  <span className="num text-muted">{localDay(x.submittedAt)}, {x.status === "awaiting_review" ? "awaiting review" : `${percentOf(x.points, x.maxPoints)}% ${x.status === "passed" ? "passed" : "not passed"}`}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Canvas>
    </PageEnter>
  );
}
