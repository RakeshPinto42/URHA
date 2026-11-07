import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getPath } from "@/lib/data";
import { coverageFor, DOCS_CHECKED_AT, VIDEOS_VERIFIED_AT } from "@/lib/catalog";
import { PageEnter } from "@/components/Motion";
import { Canvas, ScreenTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Roadmap coverage" };

const h = (min: number) => `${Math.round(min / 6) / 10} h`;

export default async function CoveragePage() {
  await connection();
  const path = getPath();
  const all = coverageFor(path.phases.flatMap((p) => p.topics.map((t) => t.id)));

  return (
    <PageEnter>
      <Canvas>
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted"><Link href="/academy" className="hover:text-ink">Academy</Link></nav>
        <ScreenTitle title="Roadmap coverage"
          sub={`Every one of the ${all.subtopics} subtopics has a primary resource and an exercise. ${all.videoPrimary} are taught by a verified video segment and ${all.docsPrimary} by official documentation; ${all.withSupplement} add a second resource. About ${h(all.watchMinutes)} of focused watching and ${h(all.practiceMinutes)} of exercises across 24 months.`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <caption className="sr-only">Resource coverage by phase and topic</caption>
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-normal">Phase and topic</th>
                <th className="py-2 pr-4 text-right font-normal">Subtopics</th>
                <th className="py-2 pr-4 text-right font-normal">Video primary</th>
                <th className="py-2 pr-4 text-right font-normal">Docs primary</th>
                <th className="py-2 pr-4 text-right font-normal">With supplement</th>
                <th className="py-2 pr-4 text-right font-normal">Watch</th>
                <th className="py-2 text-right font-normal">Practice</th>
              </tr>
            </thead>
            <tbody>
              {path.phases.map((p) => {
                const pc = coverageFor(p.topics.map((t) => t.id));
                return [
                  <tr key={p.id} className="border-b border-border bg-surface">
                    <th scope="row" className="py-2.5 pl-2 pr-4 font-semibold">Phase {p.ord} · {p.title}</th>
                    <td className="num py-2.5 pr-4 text-right">{pc.subtopics}</td>
                    <td className="num py-2.5 pr-4 text-right">{pc.videoPrimary}</td>
                    <td className="num py-2.5 pr-4 text-right">{pc.docsPrimary}</td>
                    <td className="num py-2.5 pr-4 text-right">{pc.withSupplement}</td>
                    <td className="num py-2.5 pr-4 text-right">{h(pc.watchMinutes)}</td>
                    <td className="num py-2.5 pr-2 text-right">{h(pc.practiceMinutes)}</td>
                  </tr>,
                  ...p.topics.map((t) => {
                    const c = coverageFor([t.id]);
                    return (
                      <tr key={t.id} className="border-b border-rule">
                        <th scope="row" className="py-2 pl-6 pr-4 font-normal"><Link href={`/academy/${t.id}`} className="hover:underline">{t.title}</Link></th>
                        <td className="num py-2 pr-4 text-right">{c.subtopics}</td>
                        <td className="num py-2 pr-4 text-right">{c.videoPrimary}</td>
                        <td className="num py-2 pr-4 text-right">{c.docsPrimary}</td>
                        <td className="num py-2 pr-4 text-right">{c.withSupplement}</td>
                        <td className="num py-2 pr-4 text-right">{h(c.watchMinutes)}</td>
                        <td className="num py-2 pr-2 text-right">{h(c.practiceMinutes)}</td>
                      </tr>
                    );
                  }),
                ];
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          Videos verified against YouTube's public metadata on {VIDEOS_VERIFIED_AT.slice(0, 10)} (title, channel, duration, chapters); documentation links checked on {DOCS_CHECKED_AT.slice(0, 10)}.
          Re-run <code>npm run videos:verify</code> and <code>npm run docs:check</code> to refresh. Watching a segment never marks a subtopic practised.
        </p>
      </Canvas>
    </PageEnter>
  );
}
