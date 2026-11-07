"use client";
/** Adds practical evidence to a LedgerSync milestone, and removes evidence added by hand. */
import { useActionState, useRef, useState, useTransition } from "react";
import { addProjectEvidence, removeEvidence, type ActionState } from "@/app/actions";
import { Field, FormMessage, keep, Submit } from "./FormBits";

export function EvidenceForm({ milestoneId, topics }: { milestoneId: string; topics: { id: string; title: string }[] }) {
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await addProjectEvidence(prev, fd);
    if (r?.ok) { ref.current?.reset(); setOpen(false); }
    return r;
  }, null);
  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)} aria-expanded={false}>Add evidence</button>
        {state?.ok && <FormMessage state={state} />}
      </div>
    );
  }
  return (
    <form ref={ref} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name" name="title" state={state} defaultValue="" required maxLength={200} placeholder="Loader with validation" />
        <Field label="Link" name="url" state={state} defaultValue="" type="url" inputMode="url" placeholder="https://github.com/…" />
        <Field label="What is it?" name="kind" state={state}>
          {(p) => (
            <select {...p} name="kind" className="input" defaultValue={keep(state, "kind", "project")}>
              <option value="project">Repository or pull request</option>
              <option value="test_result">Test results</option>
              <option value="file_ref">File or document</option>
            </select>
          )}
        </Field>
        <Field label="Which topic does it show?" name="topicId" state={state}>
          {(p) => (
            <select {...p} name="topicId" className="input" defaultValue={keep(state, "topicId", topics[0]?.id)}>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          )}
        </Field>
      </div>
      <Field label="Note" name="body" state={state} hint="What it proves and how to check it.">
        {(p) => <textarea {...p} name="body" rows={3} maxLength={4000} className="input" defaultValue={keep(state, "body", "")} />}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Submit>Save evidence</Submit>
        <button type="button" className="btn btn-text" onClick={() => setOpen(false)}>Cancel</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function RemoveEvidence({ id, title }: { id: number; title: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button type="button" className="btn-text text-[13px] text-muted hover:text-ink" disabled={pending} aria-label={`Remove ${title}`}
        onClick={() => start(async () => { const r = await removeEvidence(id); setError(r?.ok ? null : r?.message ?? "Could not remove that."); })}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {error && <span role="alert" className="text-[13px] text-negative">{error}</span>}
    </>
  );
}
