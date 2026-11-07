"use client";
/**
 * My Path — The Roadmap, levels 1 and 2 (docs/JOURNEY.md §5).
 *
 * Level 1, the journey: the 3D overview plus the station rail (the accessible control).
 * Level 2, a phase: the camera flies to its station and the phase sheet opens below
 * with months, competencies, topics, subtopics, the milestone, the exit gate and the
 * assessments it requires. Level 3 is the topic page in the Academy.
 *
 * Selection lives in the URL (?phase=p3) so Back and deep links work; Escape returns
 * to the overview.
 */
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Journey } from "./Journey";
import { EASE } from "../Motion";
import type { JourneyData } from "@/lib/journey/model";
import type { TopicStatus } from "@/lib/progress";
import { StatusLabel, StatusMark } from "../ui";
import { paneAt } from "@/lib/cinema";

export type PhaseSheet = {
  id: string; ord: number; title: string; landmark: string; months: [number, number]; monthRange: string | null;
  summary: string; deliverable: string; exitGate: string;
  skills: string[];
  milestone: { title: string; criteria: string } | null;
  topics: {
    id: string; title: string; objective: string; status: TopicStatus; months: [number, number];
    practised: number; proficient: number; total: number;
    subtopics: { title: string; state: "none" | "learning" | "practising" | "proficient" }[];
  }[];
  assessments: { id: string; title: string; topicTitle: string; state: "not-attempted" | "awaiting-review" | "failed" | "passed"; review: "auto" | "mixed" | "human" }[];
};

const SUB_MARK: Record<PhaseSheet["topics"][number]["subtopics"][number]["state"], TopicStatus> = {
  none: "not-started", learning: "in-progress", practising: "completed", proficient: "mastered",
};
const SUB_LABEL = { none: "Not started", learning: "Learning", practising: "Practising", proficient: "Proficient" } as const;
const ASSESS_LABEL = { "not-attempted": "Not attempted", "awaiting-review": "Awaiting review", failed: "Not passed yet", passed: "Passed" } as const;

export function RoadmapExplorer({ data, sheets, fallback }: { data: JourneyData; sheets: PhaseSheet[]; fallback: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selectedId = params.get("phase");
  const selectedIndex = sheets.findIndex((s) => s.id === selectedId);
  const sheet = selectedIndex >= 0 ? sheets[selectedIndex]! : null;
  const [hover, setHover] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const select = useCallback((id: string | null) => {
    const q = id ? `?phase=${id}` : "";
    router.replace(`${pathname}${q}`, { scroll: false });
  }, [router, pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && selectedId) select(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, select]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="relative h-[46vh] min-h-[320px] overflow-hidden rounded-card bg-surface sm:h-[560px] lg:col-span-8 lg:h-[640px]">
          <Journey data={data}
            mode={selectedIndex >= 0 ? { kind: "station", index: selectedIndex } : { kind: "overview" }}
            selectedId={sheet?.id ?? null} hoveredId={hover} onHover={setHover}
            onSelect={(id) => select(id === selectedId ? null : id)}
            fallback={<div className="flex h-full flex-col justify-end p-5">{fallback}</div>}
            className="h-full w-full" />
          {sheet && (
            <button type="button" onClick={() => select(null)}
              className="btn btn-secondary absolute left-3 top-3 z-10 min-h-[36px] bg-white/90 text-[13px]">
              ← Whole journey
            </button>
          )}
        </div>

        {/* The station rail: the accessible control for the scene. */}
        <nav aria-label="Stations of the journey" className="lg:col-span-4">
          <ol className="flex flex-col gap-1.5">
            {data.stations.map((s, i) => {
              const on = s.id === sheet?.id;
              const pane = paneAt(i);
              const pct = s.total > 0 ? Math.floor((s.practised / s.total) * 100) : 0;
              return (
                <li key={s.id}>
                  <button type="button" aria-pressed={on} aria-controls="phase-sheet"
                    onClick={() => select(on ? null : s.id)}
                    onPointerEnter={() => setHover(s.id)} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(s.id)} onBlur={() => setHover(null)}
                    style={{ "--pane": pane.bright, "--pane-deep": pane.deep } as React.CSSProperties}
                    className={`station flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-left transition-colors ${
                      on ? "station--on" : hover === s.id ? "bg-active" : "bg-surface hover:bg-active"}`}>
                    <span className={`num flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] ${
                      on ? "bg-white text-[color:var(--pane-deep)]" : s.state === "ahead" ? "border-2 border-[color:var(--pane)]" : "bg-[color:var(--pane-deep)] text-white"}`}>
                      {s.ord}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{s.landmark} · {s.short}</span>
                      <span className={`num block text-[12px] ${on ? "text-white/90" : "text-muted"}`}>
                        Months {s.months[0]}–{s.months[1]} · {s.state === "passed" ? "Passed" : s.state === "current" ? "You are here" : "Ahead"} · {pct}% practised
                      </span>
                    </span>
                    <span aria-hidden="true" className="h-1.5 w-12 flex-none overflow-hidden rounded-full bg-control/50">
                      <span className="block h-full bg-[color:var(--pane)]" style={{ width: `${pct}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[12px] text-muted">
            Choose a station to see what it asks of you. In the scene the bright stretch of the path is what you have practised, and a tall beam of light marks a passed or current station. Escape returns to the whole journey.
          </p>
        </nav>
      </div>

      <div id="phase-sheet" ref={sheetRef} aria-live="polite" className="scroll-mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {sheet ? (
            <motion.section key={sheet.id} aria-labelledby={`${sheet.id}-h`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE }} className="mt-8">
              <PhaseDetail sheet={sheet} />
            </motion.section>
          ) : (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-8 text-[14px] text-muted">
              Choose a station to open its phase: months, competencies, topics, the milestone and the assessments that prove it.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PhaseDetail({ sheet }: { sheet: PhaseSheet }) {
  return (
    <>
      <header className="grid grid-cols-1 gap-4 border-b border-border pb-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="num text-[13px] text-muted">Phase {sheet.ord} · Months {sheet.months[0]}–{sheet.months[1]}{sheet.monthRange ? ` · ${sheet.monthRange}` : ""}</p>
          <h2 id={`${sheet.id}-h`} className="mt-1 font-serif text-[34px] leading-[1.08] sm:text-[42px]">{sheet.landmark}</h2>
          <p className="mt-1 text-[18px] font-medium">{sheet.title}</p>
          <p className="mt-3 max-w-[64ch] text-[15px] text-muted">{sheet.summary}</p>
        </div>
        <dl className="flex flex-col gap-3 text-[14px] lg:col-span-4">
          <div><dt className="text-[13px] text-muted">Competencies</dt><dd>{sheet.skills.join(", ") || "—"}</dd></div>
          <div><dt className="text-[13px] text-muted">Deliverable</dt><dd>{sheet.deliverable}</dd></div>
        </dl>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ol className="flex flex-col gap-2 lg:col-span-8" aria-label="Topics in this phase">
          {sheet.topics.map((t) => (
            <li key={t.id} className="card-row p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/academy/${t.id}`} className="text-[16px] font-medium hover:underline">{t.title}</Link>
                  <p className="mt-1 text-[14px] text-muted">{t.objective}</p>
                </div>
                <StatusLabel status={t.status} />
              </div>
              <p className="num mt-2 text-[13px] text-muted">
                Month{t.months[0] !== t.months[1] ? `s ${t.months[0]}–${t.months[1]}` : ` ${t.months[0]}`} · {t.practised} of {t.total} practised · {t.proficient} proficient
              </p>
              <details className="mt-2">
                <summary className="w-fit cursor-pointer text-[13px] underline decoration-control underline-offset-4">{t.subtopics.length} subtopics</summary>
                <ul className="mt-3 columns-1 gap-6 text-[14px] sm:columns-2">
                  {t.subtopics.map((s) => (
                    <li key={s.title} className="mb-1 flex break-inside-avoid items-center gap-2">
                      <StatusMark status={SUB_MARK[s.state]} size={12} /><span className="sr-only">{SUB_LABEL[s.state]}: </span>{s.title}
                    </li>
                  ))}
                </ul>
                <Link href={`/academy/${t.id}`} className="mt-3 inline-block text-[13px] underline decoration-control underline-offset-4">Open the lessons, resources and exercises</Link>
              </details>
            </li>
          ))}
        </ol>
        <aside className="flex flex-col gap-4 lg:col-span-4">
          {sheet.milestone && (
            <div className="card-row p-4">
              <h3 className="text-[14px] font-semibold">LedgerSync milestone</h3>
              <p className="mt-1 text-[15px] font-medium">{sheet.milestone.title}</p>
              <p className="mt-1 text-[14px]">{sheet.milestone.criteria}</p>
              <Link href="/projects" className="mt-2 inline-block text-[13px] underline decoration-control underline-offset-4">Project evidence</Link>
            </div>
          )}
          <div className="card-row p-4">
            <h3 className="text-[14px] font-semibold">Exit gate</h3>
            <p className="mt-1 text-[14px]">{sheet.exitGate}</p>
          </div>
          <div className="card-row p-4">
            <h3 className="text-[14px] font-semibold">Assessments that prove it</h3>
            {sheet.assessments.length === 0 ? (
              <p className="mt-1 text-[14px] text-muted">No assessment is written for this phase yet. Its topics can reach Proficient with evidence, but not Demonstrated.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {sheet.assessments.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 text-[14px]">
                    <span className="min-w-0">
                      <Link href={`/assessments/${a.id}`} className="hover:underline">{a.title}</Link>
                      <span className="block text-[12px] text-muted">{a.topicTitle} · {a.review === "auto" ? "Scored automatically" : a.review === "human" ? "Needs review" : "Auto-scored and reviewed"}</span>
                    </span>
                    <span className={`chip flex-none ${a.state === "passed" ? "chip-accent" : a.state === "failed" || a.state === "awaiting-review" ? "chip-warn" : ""}`}>{ASSESS_LABEL[a.state]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
