import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { connection } from "next/server";
import { SCRATCHPAD, SCRATCH_DATASETS, publicExercises } from "@/lib/practice/exercises";
import { marketData } from "@/lib/practice/market";
import { practiceStatus } from "@/lib/practice/progress";
import { PHASES } from "@/lib/curriculum";
import { PageEnter } from "@/components/Motion";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";
import { Notice } from "@/components/ui";
import { PracticeYard, type Status } from "@/components/practice/PracticeYard";

export const metadata: Metadata = { title: "Practice yard" };

/** Present only once `npm run python:fetch` has installed the runtime. */
const runtimeInstalled = () => fs.existsSync(path.join(process.cwd(), "public/python/runtime/manifest.json"));

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await connection();
  const { c } = await searchParams;
  const all = practiceStatus();
  const status: Record<string, Status> = Object.fromEntries(Object.entries(all).map(([id, s]) => [id, { attempts: s.attempts, passed: s.passed, lastCode: s.lastCode, bestChecks: s.bestChecks, checksTotal: s.checksTotal }]));
  const topics = Object.fromEntries(PHASES.flatMap((p) => p.topics.map((t) => [t.id, t.title])));
  return (
    <PageEnter>
      <FrontispieceBand section="academy" height="compact">
        <p className="text-[14px] text-[#f7f7f5]/85">Academy</p>
        <RisingTitle text="The Practice Yard" className="mt-1 font-display text-[40px] leading-[1.05] sm:text-[54px]" />
        <p className="mt-2 max-w-[64ch] text-[16px] text-[#f7f7f5]/90">Python, SQL and pandas on a fictional group&apos;s 2025 books, checked as you go. Code runs in your browser; every run is saved to your progress. The data is synthetic.</p>
      </FrontispieceBand>
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-8 sm:px-6">
        {runtimeInstalled()
          ? <PracticeYard exercises={publicExercises()} scratchpad={SCRATCHPAD} scratchData={SCRATCH_DATASETS} topics={topics} initialStatus={status} initial={c ?? null} market={marketData()} />
          : <Notice>The Python runtime is not installed on this machine yet. Run <code>npm run python:fetch</code> once, then reload this page.</Notice>}
      </div>
    </PageEnter>
  );
}
