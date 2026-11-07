"use client";
/**
 * Subtopic ladder: Learning (Studied) → Practising (Practised) → Proficient
 * (docs/JOURNEY.md §6; PRD §9 "lesson completion only indicates exposure").
 * Proficient opens an evidence field; it cannot be saved without one (validated
 * client, server and database). Demonstrated is NOT here: only a passed assessment gives it.
 */
import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toggleStep, type ActionState } from "@/app/actions";
import type { SubtopicProgress, Step } from "@/lib/progress";
import type { SubtopicPlan } from "@/lib/catalog";
import { StudyPlan } from "../StudyPlan";

const STEP_LABEL: Record<Step, string> = { exposed: "Studied", practised: "Practised", proficient: "Proficient" };

function StepButton({ subtopicId, title, step, on, disabledReason }: { subtopicId: string; title: string; step: Step; on: boolean; disabledReason?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(toggleStep, null);
  return (
    <form action={action} className="contents">
      <input type="hidden" name="subtopicId" value={subtopicId} />
      <input type="hidden" name="step" value={step} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending || !!disabledReason}
        aria-pressed={on}
        aria-label={`${STEP_LABEL[step]}: ${title}`}
        title={disabledReason ?? (on ? `Clear ${STEP_LABEL[step].toLowerCase()}` : `Mark ${STEP_LABEL[step].toLowerCase()}`)}
        className={`h-9 rounded-full px-3 text-[13px] transition-colors ${on
          ? step === "proficient" ? "bg-accent text-[var(--accent-ink)]" : "bg-ink text-ground"
          : "text-muted border border-control hover:text-ink hover:border-ink"} disabled:opacity-60`}
      >
        {pending ? "…" : STEP_LABEL[step]}
      </button>
      {state && !state.ok && <span role="alert" className="text-[12px] text-negative">{state.message}</span>}
    </form>
  );
}

function EvidenceForm({ subtopicId, onDone }: { subtopicId: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await toggleStep(prev, fd);
    if (r?.ok) onDone();
    return r;
  }, null);
  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="subtopicId" value={subtopicId} />
      <input type="hidden" name="step" value="proficient" />
      <input type="hidden" name="on" value="1" />
      <label className="field">
        <span>Evidence</span>
        <textarea name="evidence" className="input" required maxLength={2000} autoFocus aria-invalid={state?.errors?.evidence ? true : undefined}
          placeholder="Proficient means you solved an unfamiliar problem on your own. Link the commit, pull request or test run, or describe the problem and how you know your solution works." />
      </label>
      {state && !state.ok && <p role="alert" className="field-error">{state.message}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save evidence"}</button>
        <button type="button" className="btn btn-text" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

export function StepLadder({ subtopics, plans }: { subtopics: { id: string; title: string; month: number; progress: SubtopicProgress; evidence: string | null }[]; plans: Record<string, SubtopicPlan> }) {
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  // The next subtopic to work on opens its plan by default.
  const nextId = subtopics.find((s) => !s.progress.practised)?.id ?? null;
  return (
    <ul className="flex flex-col gap-2">
      {subtopics.map((s) => (
        <li key={s.id} className="card-row px-4 py-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[15px]">{s.title}</p>
              <p className="num text-[12px] text-muted">Month {s.month}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StepButton subtopicId={s.id} title={s.title} step="exposed" on={s.progress.exposed} />
              <StepButton subtopicId={s.id} title={s.title} step="practised" on={s.progress.practised} />
              {s.progress.proficient ? (
                <StepButton subtopicId={s.id} title={s.title} step="proficient" on />
              ) : (
                <button type="button" aria-expanded={evidenceFor === s.id} onClick={() => setEvidenceFor(evidenceFor === s.id ? null : s.id)}
                  className="h-9 rounded-full px-3 text-[13px] text-muted border border-control hover:text-ink hover:border-ink">
                  Proficient…
                </button>
              )}
            </div>
          </div>
          {plans[s.id] && (
            <details className="group mt-2" open={s.id === nextId}>
              <summary className="w-fit cursor-pointer list-none text-[13px] text-muted underline decoration-control underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show study plan</span><span className="hidden group-open:inline">Hide study plan</span>
                {plans[s.id]!.primary?.minutes ? <span className="num"> · {plans[s.id]!.primary!.minutes} min watch + {plans[s.id]!.exerciseMinutes} min practice</span> : <span className="num"> · {plans[s.id]!.exerciseMinutes} min practice</span>}
              </summary>
              <StudyPlan plan={plans[s.id]!} />
            </details>
          )}
          {s.progress.proficient && s.evidence && (
            <p className="mt-2 break-words text-[13px] text-muted"><span className="text-ink">Evidence:</span> {s.evidence}</p>
          )}
          <AnimatePresence initial={false}>
            {evidenceFor === s.id && !s.progress.proficient && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                <EvidenceForm subtopicId={s.id} onDone={() => setEvidenceFor(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}
