import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getPath, getResources } from "@/lib/data";
import { PageEnter } from "@/components/Motion";
import { StatusLabel } from "@/components/ui";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";

export const metadata: Metadata = { title: "Academy" };

export default async function AcademyPage() {
  await connection();
  const path = getPath();
  const resources = getResources();
  const missingLinks = resources.filter((r) => !r.url).length;

  return (
    <PageEnter>
      <FrontispieceBand section="academy">
        <p className="text-[14px] text-[#f7f7f5]/80">Academy</p>
        <RisingTitle text="The Study" className="mt-2 font-serif text-[44px] leading-[1.02] sm:text-[60px]" />
        <p className="mt-3 max-w-[58ch] text-[17px] text-[#f7f7f5]/90">
          {path.phases.reduce((n, p) => n + p.topics.length, 0)} topics, each with an objective, lessons, resources and practical work.
          Studying is recorded apart from practice and evidence.
        </p>
      </FrontispieceBand>

      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-8 sm:px-6 lg:pt-10">
        <p className="mb-10 text-[14px] text-muted">
          Every subtopic has a verified study plan and an exercise. <Link href="/academy/coverage" className="text-ink underline decoration-control underline-offset-4">See roadmap coverage</Link>. {resources.length} further resources sit in the topic libraries{missingLinks > 0 ? `; ${missingLinks} Udemy course links are yours to add` : ""}.
        </p>

        <div className="flex flex-col gap-10">
          {path.phases.map((p) => (
            <section key={p.id} aria-labelledby={`${p.id}-h`}>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h2 id={`${p.id}-h`} className="text-[16px] font-semibold">Phase {p.ord} · {p.title}</h2>
                <span className="num flex-none text-[13px] text-muted">Months {p.months[0]}–{p.months[1]}</span>
              </div>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {p.topics.map((t) => {
                  const res = resources.filter((r) => r.topicId === t.id);
                  return (
                    <li key={t.id}>
                      <Link href={`/academy/${t.id}`} className="card-row flex h-full flex-col gap-2 p-4 transition-colors hover:bg-surface">
                        <span className="flex items-start justify-between gap-3">
                          <span className="text-[16px] font-medium">{t.title}</span>
                          <StatusLabel status={t.status} />
                        </span>
                        <span className="text-[14px] text-muted">{t.objective}</span>
                        <span className="num mt-auto text-[13px] text-muted">
                          {t.counts.practised}/{t.counts.total} practised · {res.length} {res.length === 1 ? "resource" : "resources"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PageEnter>
  );
}
