"use client";
/** Scores each rubric criterion. A named person decides; the page never suggests a score. */
import { useActionState, useState } from "react";
import { submitReview, type ActionState } from "@/app/actions";
import type { Criterion } from "@/lib/assessments/types";
import { FormMessage, keep, Submit } from "@/components/forms/FormBits";

export type ReviewItem = { id: string; title: string; rubric: Criterion[]; guidance: string | null };

export function ReviewForm({ attemptId, items, defaultName }: { attemptId: number; items: ReviewItem[]; defaultName: string }) {
  const [state, action] = useActionState<ActionState, FormData>(submitReview, null);
  const [who, setWho] = useState(state?.values?.who ?? "self");
  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="attemptId" value={attemptId} />
      {items.map((item) => (
        <fieldset key={item.id} className="flex flex-col gap-3">
          <legend className="text-[15px] font-medium">{item.title}</legend>
          {item.guidance && <p className="max-w-[68ch] text-[14px] text-muted">{item.guidance}</p>}
          <ul className="flex flex-col gap-3">
            {item.rubric.map((c) => (
              <li key={c.id} className="grid grid-cols-[1fr_88px] items-start gap-4">
                <label htmlFor={`${item.id}-${c.id}`} className="text-[14px]">
                  <span className="font-medium">{c.label}</span>
                  <span className="block text-muted">{c.descriptor}</span>
                </label>
                <span className="flex items-center gap-1.5">
                  <input id={`${item.id}-${c.id}`} name={`score:${item.id}:${c.id}`} type="number" min={0} max={c.points} step={0.5} required
                    defaultValue={keep(state, `score:${item.id}:${c.id}`, "")} className="input num w-full" aria-label={`${c.label}, out of ${c.points}`} />
                  <span className="num flex-none text-[13px] text-muted">/ {c.points}</span>
                </span>
              </li>
            ))}
          </ul>
          {state?.errors?.[`score:${item.id}`] && <p className="field-error">{state.errors[`score:${item.id}`]}</p>}
          <label className="field">
            <span>Feedback</span>
            <textarea name={`feedback:${item.id}`} rows={3} className="input" defaultValue={keep(state, `feedback:${item.id}`, "")} placeholder="What was missing, and what to do about it." />
          </label>
        </fieldset>
      ))}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-medium">Who reviewed this?</legend>
        <label className="flex items-center gap-2 text-[15px]"><input type="radio" name="who" value="self" checked={who === "self"} onChange={() => setWho("self")} /> I reviewed my own work</label>
        <label className="flex items-center gap-2 text-[15px]"><input type="radio" name="who" value="other" checked={who === "other"} onChange={() => setWho("other")} /> Someone else did</label>
        {who === "other" && (
          <label className="field mt-1 max-w-[320px]">
            <span>Reviewer’s name</span>
            <input name="reviewerName" className="input" required defaultValue={keep(state, "reviewerName", defaultName)} />
            {state?.errors?.reviewerName && <span className="field-error">{state.errors.reviewerName}</span>}
          </label>
        )}
        <p className="text-[13px] text-muted">A self-review counts, and it stays labelled as a self-review wherever this result appears.</p>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4">
        <Submit pendingText="Saving review…">Save review</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
