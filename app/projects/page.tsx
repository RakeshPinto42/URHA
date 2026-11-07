import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getMilestones, getPath, listEvidence } from "@/lib/data";
import { localDay } from "@/lib/dates";
import { PageEnter } from "@/components/Motion";
import { Canvas, StatusLabel } from "@/components/ui";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";
import { EvidenceForm, RemoveEvidence } from "@/components/forms/EvidenceForm";

export const metadata: Metadata = { title: "Projects" };

const KIND_LABEL: Record<string, string> = { project: "Repository or pull request", test_result: "Test results", file_ref: "File or document" };

export default async function ProjectsPage() {
  await connection();
  const path = getPath();
  const milestones = getMilestones();
  const topics = path.phases.flatMap((p) => p.topics);

  return (
    <PageEnter>
      <FrontispieceBand art="mount" section="projects" height="medium">
        <p className="text-[14px] text-[#f7f7f5]/85">Projects · The Practice</p>
        <RisingTitle text="LedgerSync v2" className="mt-1 font-serif text-[40px] leading-[1.05] sm:text-[52px]" />
        <p className="mt-2 max-w-[62ch] text-[16px] text-[#f7f7f5]/90">One evolving enterprise AI solution for finance reconciliation, grown milestone by milestone with the curriculum. Your finance expertise is the domain; the engineering is what you build. Hearing is not enough: the house is built by doing.</p>
      </FrontispieceBand>
      <Canvas>
        <ol className="flex flex-col gap-3">
          {milestones.map((m) => {
            const phase = path.phases.find((p) => p.id === m.phaseId)!;
            const linked = topics.filter((t) => t.milestoneId === m.id);
            const evidence = listEvidence({ milestoneId: m.id });
            return (
              <li key={m.id} className="panel grid grid-cols-1 gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <p className="num text-[13px] text-muted">Milestone {m.ord} · Phase {phase.ord}</p>
                  <h2 className="mt-1 text-[18px] font-medium leading-snug">{m.title}</h2>
                </div>
                <dl className="flex flex-col gap-2 text-[14px] md:col-span-5">
                  <div><dt className="text-muted">Business problem</dt><dd>{m.businessProblem}</dd></div>
                  <div><dt className="text-muted">Technical objective</dt><dd>{m.technicalObjective}</dd></div>
                  <div><dt className="text-muted">Done when</dt><dd>{m.completionCriteria}</dd></div>
                </dl>
                <div className="md:col-span-3">
                  <p className="text-[13px] text-muted">Topics that build it</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {linked.map((t) => (
                      <li key={t.id} className="flex flex-col">
                        <Link href={`/academy/${t.id}`} className="text-[14px] hover:underline">{t.title}</Link>
                        <StatusLabel status={t.status} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-border pt-4 md:col-span-12">
                  <h3 className="text-[13px] font-semibold">Evidence</h3>
                  {evidence.length > 0 ? (
                    <ul className="mb-3 mt-2 flex flex-col gap-1.5 text-[14px]">
                      {evidence.map((e) => (
                        <li key={e.id} className="flex flex-wrap items-baseline gap-x-3">
                          {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4 hover:decoration-current">{e.title}</a> : <span>{e.title}</span>}
                          <span className="num text-[13px] text-muted">{KIND_LABEL[e.kind] ?? e.kind}, {localDay(e.createdAt)}{e.topicId ? `, ${path.topicTitles[e.topicId] ?? ""}` : ""}</span>
                          {e.attemptId === null && <RemoveEvidence id={e.id} title={e.title} />}
                          {e.body && <p className="w-full max-w-[68ch] text-[13px] text-muted">{e.body}</p>}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mb-3 mt-1 text-[14px] text-muted">Nothing yet. Link the work once it meets “done when”.</p>}
                  {linked.length > 0 && <EvidenceForm milestoneId={m.id} topics={linked.map((t) => ({ id: t.id, title: t.title }))} />}
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-[13px] text-muted">Evidence here appears on the topic’s skills in The Mastery. It supports a skill but does not make it Demonstrated; only a passed assessment does.</p>
      </Canvas>
    </PageEnter>
  );
}
