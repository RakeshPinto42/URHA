import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getAttempt, getPath, getSettings, listEvidence } from "@/lib/data";
import { getAssessment, isAuto, TYPE_LABEL, type Item } from "@/lib/assessments";
import { readHandIn } from "@/lib/assessments/attempt";
import { parseChoice, revisionFor, summarise } from "@/lib/assessments/grade";
import { percentOf, reviewerLabel } from "@/lib/assessments/labels";
import { localDay } from "@/lib/dates";
import { PageEnter } from "@/components/Motion";
import { Canvas, Notice, Panel } from "@/components/ui";
import { ReviewForm, type ReviewItem } from "@/components/assessment/ReviewForm";

export const metadata: Metadata = { title: "Assessment result" };

type Props = { params: Promise<{ id: string }> };

export default async function AttemptPage({ params }: Props) {
  await connection();
  const { id } = await params;
  const found = /^\d+$/.test(id) ? getAttempt(Number(id)) : null;
  if (!found) notFound();
  const { attempt, answers } = found;
  const a = getAssessment(attempt.assessmentId);
  if (!a) notFound();
  const path = getPath();
  const byItem = new Map(answers.map((x) => [x.itemId, x]));
  const summary = summarise(a, answers);
  const awaiting = attempt.status === "awaiting_review";
  const passed = attempt.status === "passed";
  const percent = percentOf(attempt.points, attempt.maxPoints);
  const failedRequired = a.items.filter((i) => summary.failedRequired.includes(i.id));
  const autoMax = a.items.filter(isAuto).reduce((n, i) => n + i.points, 0);

  const subtopics = new Map(path.phases.flatMap((p) => p.topics.flatMap((t) => t.subtopics.map((s) => [s.id, { title: s.title, topicId: t.id }] as const))));
  const revision = revisionFor(a, answers).map((rid) => subtopics.get(rid)).filter((x): x is { title: string; topicId: string } => !!x);
  const reviewItems: ReviewItem[] = a.items.flatMap((item) => (isAuto(item) ? [] : [{ id: item.id, title: `${a.items.indexOf(item) + 1}. ${TYPE_LABEL[item.type]}`, rubric: item.rubric, guidance: item.guidance ?? null }]));
  const evidence = listEvidence({ topicIds: [a.topicId] }).filter((e) => e.attemptId === attempt.id);

  return (
    <PageEnter>
      <Canvas>
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
          <Link href="/assessments" className="hover:text-ink">Assessments</Link> <span aria-hidden="true">/</span>{" "}
          <Link href={`/assessments/${a.id}`} className="hover:text-ink">{a.title}</Link>
        </nav>
        <header className="mb-8">
          <h1 className="font-serif text-[44px] leading-[1.05] sm:text-[56px]">{awaiting ? "Awaiting review" : passed ? "Passed" : "Not passed yet"}</h1>
          <p className="num mt-3 max-w-[64ch] text-[16px]">
            {awaiting
              ? `${summary.pendingReview} ${summary.pendingReview === 1 ? "answer waits" : "answers wait"} for a named reviewer.${autoMax ? ` Automatically scored so far: ${attempt.points} of ${autoMax} points.` : ""}`
              : `${attempt.points} of ${attempt.maxPoints} points (${percent}%). The pass mark is ${a.passPercent}%.`}
            {" "}Submitted {localDay(attempt.submittedAt)}.
            {attempt.reviewer ? ` ${reviewerLabel(attempt.reviewer)}.` : ""}
          </p>
          {passed && <p className="mt-2 max-w-[64ch] text-[15px]">{path.topicTitles[a.topicId]} is now Demonstrated, and this result is recorded as evidence on its skills.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {!awaiting && <Link href={`/assessments/${a.id}`} className={`btn ${passed ? "btn-secondary" : "btn-primary"}`}>{passed ? "Take it again" : "Retake the assessment"}</Link>}
            {!passed && !awaiting && <Link href={`/tasks?new=1&for=${a.topicId}&as=learn`} className="btn btn-secondary">Plan revision as a task</Link>}
            <Link href={`/academy/${a.topicId}`} className="btn btn-text">Back to the topic</Link>
          </div>
        </header>

        {!awaiting && !passed && failedRequired.length > 0 && (
          <div className="mb-6"><Notice tone="warn">
            {failedRequired.length === 1 ? "A question that must pass did not" : `${failedRequired.length} questions that must pass did not`}: {failedRequired.map((i) => `question ${a.items.indexOf(i) + 1}`).join(", ")}. The overall score alone cannot pass this assessment.
          </Notice></div>
        )}

        {awaiting && (
          <Panel title="Review this attempt" id="review" className="mb-8">
            <p className="mb-5 max-w-[68ch] text-[14px] text-muted">Read each answer below first, then score it against the rubric. Automatic scores are already final.</p>
            <ReviewForm attemptId={attempt.id} items={reviewItems} defaultName={getSettings().name} />
          </Panel>
        )}

        {!awaiting && revision.length > 0 && (
          <section aria-labelledby="revise-h" className="mb-8">
            <h2 id="revise-h" className="text-[14px] font-semibold">Revise these</h2>
            <ul className="mt-2 flex flex-col gap-1 text-[15px]">
              {revision.map((r) => <li key={r.title}><Link href={`/academy/${r.topicId}#lessons`} className="underline decoration-control underline-offset-4 hover:decoration-current">{r.title}</Link></li>)}
            </ul>
          </section>
        )}

        <h2 className="text-[14px] font-semibold">Question by question</h2>
        <ol className="mt-2 flex flex-col">
          {a.items.map((item, n) => {
            const ans = byItem.get(item.id);
            const scored = ans?.points !== null && ans?.points !== undefined;
            return (
              <li key={item.id} className="grid grid-cols-1 gap-2 border-t border-border py-6 md:grid-cols-[120px_1fr] md:gap-6">
                <div className="text-[13px] text-muted">
                  <p className="num font-serif text-[24px] leading-none text-ink">{n + 1}</p>
                  <p className="mt-2">{TYPE_LABEL[item.type]}</p>
                  <p className="num">{scored ? `${ans!.points} of ${item.points}` : `${item.points} points, unscored`}</p>
                </div>
                <div className="min-w-0">
                  <p className="max-w-[68ch] whitespace-pre-line text-[15px] leading-relaxed">{item.prompt}</p>
                  <h3 className="mt-3 text-[13px] text-muted">Your answer</h3>
                  <Answer item={item} response={ans?.response ?? ""} />
                  {ans?.feedback && (
                    <div className="mt-3">
                      <h3 className="text-[13px] text-muted">{ans.auto ? (ans.points === item.points ? "Correct" : "What went wrong") : "Reviewer’s feedback"}</h3>
                      <p className="max-w-[68ch] whitespace-pre-line text-[15px]">{ans.feedback}</p>
                    </div>
                  )}
                  {!isAuto(item) && scored && (
                    <ul className="num mt-3 flex flex-col gap-1 text-[14px]">
                      {item.rubric.map((c) => <li key={c.id} className="flex max-w-[52ch] justify-between gap-4"><span>{c.label}</span><span className="text-muted">{ans!.criteria[c.id] ?? 0} of {c.points}</span></li>)}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {evidence.length > 0 && (
          <section aria-labelledby="evidence-h" className="mt-6 border-t border-border pt-6">
            <h2 id="evidence-h" className="text-[14px] font-semibold">Evidence recorded from this attempt</h2>
            <ul className="mt-2 flex flex-col gap-1 text-[14px]">
              {evidence.map((e) => (
                <li key={e.id}>
                  {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4 hover:decoration-current">{e.title}</a> : e.title}
                  {e.demonstratedOn && <span className="num text-muted">, demonstrated {e.demonstratedOn}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </Canvas>
    </PageEnter>
  );
}

function Answer({ item, response }: { item: Item; response: string }) {
  if (item.type === "mcq" || item.type === "debug") {
    const chosen = parseChoice(response);
    return chosen.length ? <ul className="text-[15px]">{chosen.map((i) => <li key={i}>{item.options[i]}</li>)}</ul> : <p className="text-[15px] text-muted">No answer.</p>;
  }
  if (item.type === "sql") return <pre className="mt-1 overflow-x-auto rounded-[12px] bg-surface p-3 font-mono text-[13px]">{response || "No query."}</pre>;
  const h = readHandIn(response);
  return (
    <div className="text-[15px]">
      {h.url && <p className="break-words"><a href={h.url} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4 hover:decoration-current">{h.url}</a></p>}
      {h.text && <p className="max-w-[68ch] whitespace-pre-line">{h.text}</p>}
    </div>
  );
}
