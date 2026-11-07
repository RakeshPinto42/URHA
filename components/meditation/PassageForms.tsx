"use client";
import { useActionState, useOptimistic, useRef, useTransition } from "react";
import { deleteReflection, saveAudioSource, saveCollectionNote, saveReflection, toggleSaved, type ActionState } from "@/app/actions";
import type { JournalEntry } from "@/lib/data";
import { Field, FormMessage, Submit } from "../forms/FormBits";
import { Icon } from "../Icon";
import { localStamp } from "@/lib/dates";

export function BookmarkButton({ passageId, on }: { passageId: string; on: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(on);
  const [pending, start] = useTransition();
  return (
    <button type="button" aria-pressed={optimistic} disabled={pending}
      onClick={() => start(async () => { setOptimistic(!optimistic); await toggleSaved(passageId, !optimistic); })}
      className={`btn ${optimistic ? "btn-secondary text-accent" : "btn-secondary"}`}>
      <Icon name={optimistic ? "bookmarked" : "bookmark"} size={14} /> {optimistic ? "Bookmarked" : "Bookmark"}
    </button>
  );
}

const PROMPTS = [
  { name: "understood", label: "What I understood" },
  { name: "stoodOut", label: "What stood out" },
  { name: "questioned", label: "What I question" },
  { name: "apply", label: "What I want to apply" },
  { name: "personal", label: "My personal reflection" },
] as const;

export function ReflectionJournal({ passageId, entries }: { passageId: string; entries: JournalEntry[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<ActionState, FormData>(async (p, fd) => {
    const r = await saveReflection(p, fd);
    if (r?.ok) formRef.current?.reset();
    return r;
  }, null);
  const [, start] = useTransition();
  return (
    <div className="flex flex-col gap-8">
      <form ref={formRef} action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="passageId" value={passageId} />
        {PROMPTS.map((p) => (
          <Field key={p.name} label={p.label} name={p.name} state={state}>
            {(a) => <textarea name={p.name} className="input min-h-[72px]" maxLength={4000} {...a} />}
          </Field>
        ))}
        <div className="flex items-center gap-3">
          <Submit>Save reflection</Submit>
          <FormMessage state={state} />
        </div>
        <p className="text-[12px] text-muted">Private. Stored only in URHA’s local database on this machine.</p>
      </form>
      {entries.length > 0 && (
        <ol className="flex flex-col gap-6">
          {entries.map((e) => (
            <li key={e.id} className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between text-[12px] text-muted">
                <span>{localStamp(e.createdAt).date} {localStamp(e.createdAt).time}</span>
                <button type="button" className="btn-text text-[12px]" onClick={() => start(async () => { await deleteReflection(e.id); })}>Delete</button>
              </div>
              <dl className="flex flex-col gap-2 text-[15px]">
                {PROMPTS.map((p) => e[p.name] ? (<div key={p.name}><dt className="text-[13px] text-muted">{p.label}</dt><dd className="whitespace-pre-wrap">{e[p.name]}</dd></div>) : null)}
                {e.revisit ? <div><dt className="text-[13px] text-muted">What I should revisit</dt><dd className="whitespace-pre-wrap">{e.revisit}</dd></div> : null}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function AudioSourceForm({ passageId, current }: { passageId: string; current: { url: string; label: string; licence: string } | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAudioSource, null);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="passageId" value={passageId} />
      <p className="text-[14px] text-muted">
        Attach a recording you are licensed to play — for example a public-domain reading, or an audio file you own. URHA does not download or redistribute recordings.
      </p>
      <Field label="Audio file link (https)" name="url" type="url" defaultValue={current?.url ?? ""} state={state} placeholder="https://…/john-15.mp3" />
      <Field label="Narrator or edition" name="label" defaultValue={current?.label ?? ""} state={state} maxLength={120} />
      <Field label="Licence or permission" name="licence" defaultValue={current?.licence ?? ""} state={state} maxLength={200} hint="For example: Public domain (LibriVox), or Personal purchase." />
      <div className="flex flex-wrap items-center gap-3">
        <Submit className="btn btn-secondary">{current ? "Update recording" : "Attach recording"}</Submit>
        {current && <button type="submit" name="remove" value="1" className="btn btn-text">Remove</button>}
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function CollectionNotes({ collectionId, body }: { collectionId: string; body: string }) {
  const [state, action] = useActionState<ActionState, FormData>(saveCollectionNote, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="collectionId" value={collectionId} />
      <label className="field">
        <span>Personal notes on this collection</span>
        <textarea name="body" className="input min-h-[96px]" maxLength={4000} defaultValue={body} placeholder="What this theme is asking of you right now." />
      </label>
      <div className="flex items-center gap-3">
        <Submit className="btn btn-secondary">Save notes</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
