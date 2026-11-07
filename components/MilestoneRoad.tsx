"use client";
/**
 * The Milestone Road — URHA's signature element (DESIGN §1).
 * 24 Roman-milestone markers, grouped by phase. Each fills from the base by the
 * share of that month's scheduled subtopics that are *practised* (exposure alone
 * does not fill it). The current month carries a "Now" marker.
 */
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "./Motion";
import { PHASE_SHORT } from "@/lib/curriculum";
import { paneAt } from "@/lib/cinema";

export type RoadProps = {
  months: { month: number; phaseId: string; total: number; practised: number }[];
  phases: { id: string; ord: number; title: string; months: [number, number] }[];
  currentMonth: number | null; // null: no start date; 0: before start; >24: beyond
  monthLabels?: Record<number, string>; // e.g. "Nov 26"
  currentPhaseId: string | null;
  compact?: boolean;
};

export function MilestoneRoad({ months, phases, currentMonth, monthLabels, currentPhaseId, compact = false }: RoadProps) {
  const reduce = useReducedMotion();
  const h = compact ? 44 : 72;
  return (
    <div className="w-full">
      <ol className="road grid w-full items-end gap-x-[3px] sm:gap-x-1" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }} aria-label="Roadmap months">
        {months.map((m, i) => {
          const ratio = m.total > 0 ? m.practised / m.total : 0;
          const isNow = currentMonth === m.month;
          const phaseStart = i === 0 || months[i - 1]!.phaseId !== m.phaseId;
          const phase = phases.find((p) => p.id === m.phaseId);
          const pane = paneAt(phases.findIndex((p) => p.id === m.phaseId));
          return (
            <li key={m.month} className={`relative flex flex-col items-center ${phaseStart && i > 0 ? "ml-1 sm:ml-2" : ""}`}>
              <span className="sr-only">
                Month {m.month}{monthLabels?.[m.month] ? ` (${monthLabels[m.month]})` : ""}, {phase ? `phase ${phase.ord}` : ""}: {m.practised} of {m.total} subtopics practised{isNow ? ". You are here." : ""}
              </span>
              <span aria-hidden="true" className={`mb-1 h-4 text-[11px] font-medium leading-4 ${isNow ? "text-ink" : "invisible"}`}>{isNow ? "Now" : "·"}</span>
              <span aria-hidden="true" className="stone relative block w-full overflow-hidden rounded-t-full"
                style={{ height: h, background: `color-mix(in srgb, ${pane.bright} ${isNow ? 42 : 22}%, var(--raised))`, boxShadow: isNow ? "0 0 0 1.5px var(--text)" : undefined }}>
                <motion.span
                  className="absolute inset-x-0 bottom-0 block origin-bottom"
                  style={{ height: "100%", background: pane.bright }}
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={{ scaleY: ratio }}
                  transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : i * 0.015 }}
                />
              </span>
              {!compact && (
                <span aria-hidden="true" className="num mt-1.5 text-[11px] text-muted">{m.month}</span>
              )}
            </li>
          );
        })}
      </ol>
      <div aria-hidden="true" className="mt-2 grid w-full gap-x-[3px] sm:gap-x-1" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
        {phases.map((p, i) => {
          const span = p.months[1] - p.months[0] + 1;
          const current = p.id === currentPhaseId;
          return (
            <Link key={p.id} href={`/path#${p.id}`} tabIndex={-1}
              className={`truncate border-t-[3px] pt-1 text-[12px] ${i > 0 ? "ml-1 sm:ml-2" : ""} ${current ? "font-medium text-ink" : "text-muted"} hover:text-ink`}
              style={{ gridColumn: `span ${span} / span ${span}`, borderColor: paneAt(i).bright }} title={p.title}>
              {compact ? `P${p.ord}` : <><span className="num">P{p.ord}</span><span className="hidden md:inline"> · {PHASE_SHORT[p.id] ?? p.title}</span></>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
