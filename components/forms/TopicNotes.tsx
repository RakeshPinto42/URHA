"use client";
import { useActionState } from "react";
import { setRevision, type ActionState } from "@/app/actions";
import { FormMessage, Submit } from "./FormBits";

/** Topic notes plus the manual "needs revision" flag (PRD §8 status). */
export function TopicNotes({ topicId, needsRevision, notes }: { topicId: string; needsRevision: boolean; notes: string }) {
  const [state, action] = useActionState<ActionState, FormData>(async (p, fd) => {
    const r = await setRevision(p, fd);
    return r?.ok ? { ok: true, message: "Saved." } : r;
  }, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="topicId" value={topicId} />
      <label className="field">
        <span>Notes</span>
        <textarea name="notes" className="input" defaultValue={notes} maxLength={1000} placeholder="What is still unclear, what to revisit, links to your own code." />
      </label>
      <label className="flex min-h-[44px] items-center gap-3 text-[14px]">
        <input type="checkbox" name="on" value="1" defaultChecked={needsRevision} className="h-5 w-5 accent-[var(--warning)]" />
        Needs revision — show this topic as needing another pass
      </label>
      <div className="flex items-center gap-3">
        <Submit className="btn btn-secondary">Save notes</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
