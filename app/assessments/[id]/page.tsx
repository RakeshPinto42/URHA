import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { assessmentStatuses, getPath, listAttempts } from "@/lib/data";
import { getAssessment, maxPoints, publicItem, reviewMode } from "@/lib/assessments";
import { FIXTURES } from "@/lib/assessments/fixtures";
import { DIFFICULTY_LABEL, percentOf, reviewerLabel, REVIEW_LABEL } from "@/lib/assessments/labels";
import { localDay } from "@/lib/dates";
import { PageEnter } from "@/components/Motion";
import { Canvas } from "@/components/ui";
import { TakeForm } from "@/components/assessment/TakeForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: getAssessment(id)?.title ?? "Assessment" };
}

const SCORING = {
  auto: "Every question is checked deterministically the moment you submit.",
  mixed: "Choice and SQL questions are checked deterministically when you submit. Written and practical answers wait for a named reviewer, and the result is not final until then.",
  human: "A named reviewer scores your work against the rubric. The result is not final until then.",
} as const;

export default async function AssessmentPage({ params }: Props) {
  await connection();
  const { id } = await params;
  const a = getAssessment(id);
  if (!a) notFound();
  const path = getPath();
  const phase = path.phases.find((p) => p.topics.some((t) => t.id === a.topicId));
  const state = assessmentStatuses().get(a.id)!;
  const attempts = listAttempts(a.id);
  const required = a.items.filter((i) => i.required).length;
  const fixtures = Object.fromEntries(a.items.flatMap((i) => (i.type === "sql" && FIXTURES[i.fixture] ? [[i.fixture, { title: FIXTURES[i.fixture]!.title, schema: FIXTURES[i.fixture]!.schema }]] : [])));

  return (
    <PageEnter>
      <Canvas>
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
          <Link href="/assessments" className="hover:text-ink">Assessments</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={`/academy/${a.topicId}`} className="hover:text-ink">{path.topicTitles[a.topicId]}</Link>
        </nav>
        <header className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-[36px] leading-[1.08] sm:text-[44px]">{a.title}</h1>
            <p className="mt-3 max-w-[60ch] text-[17px]">{a.summary}</p>
            <h2 className="mt-6 text-[14px] font-semibold">You will show that you can</h2>
            <ul className="mt-2 flex max-w-[64ch] list-disc flex-col gap-1 pl-5 text-[15px]">{a.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 self-start text-[14px] lg:col-span-4">
            <Fact label="Difficulty" value={DIFFICULTY_LABEL[a.difficulty]} />
            <Fact label="Time" value={`About ${Math.round((a.minutes / 60) * 10) / 10} h`} />
            <Fact label="To pass" value={`${a.passPercent}% of ${maxPoints(a)} points`} />
            <Fact label="Questions" value={`${a.items.length}${required ? `, ${required} must pass` : ""}`} />
            <Fact label="Phase" value={phase ? `${phase.ord}` : "—"} />
            <Fact label="Scoring" value={REVIEW_LABEL[reviewMode(a)]} />
          </dl>
        </header>

        <p className="mb-8 max-w-[68ch] text-[14px] text-muted">
          {SCORING[reviewMode(a)]} Retake it whenever you like: every attempt is kept and the best pass counts.
        </p>

        {attempts.length > 0 && (
          <section aria-labelledby="history-h" className="mb-10">
            <h2 id="history-h" className="text-[14px] font-semibold">
              Your attempts{state.state === "passed" ? ": passed" : state.state === "awaiting-review" ? ": one awaits review" : ""}
            </h2>
            <ul className="mt-2 flex flex-col">
              {attempts.map((x, i) => (
                <li key={x.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-border py-2 text-[14px]">
                  <Link href={`/assessments/attempt/${x.id}`} className="underline decoration-control underline-offset-4 hover:decoration-current">Attempt {attempts.length - i}, {localDay(x.submittedAt)}</Link>
                  <span className="num text-muted">
                    {x.status === "awaiting_review" ? "Awaiting review" : `${percentOf(x.points, x.maxPoints)}%, ${x.status === "passed" ? "passed" : "not passed"}`}
                    {x.reviewer ? `, ${reviewerLabel(x.reviewer).toLowerCase()}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="mb-4 text-[14px] font-semibold">{attempts.length ? "Take it again" : "The assessment"}</h2>
        <TakeForm assessmentId={a.id} version={a.version} items={a.items.map(publicItem)} fixtures={fixtures} />
      </Canvas>
    </PageEnter>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[13px] text-muted">{label}</dt><dd className="num">{value}</dd></div>;
}
