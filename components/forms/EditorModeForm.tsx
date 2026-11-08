"use client";
import { useActionState } from "react";
import { setEditorModeAction, type ActionState } from "@/app/actions";

export function EditorModeForm({ on, byEnvironment }: { on: boolean; byEnvironment: boolean }) {
  const [state, act, pending] = useActionState<ActionState, FormData>(setEditorModeAction, null);
  return (
    <form action={act} className="flex flex-col gap-3">
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <p className="text-[14px]">
        Editor mode is <strong>{on ? "on" : "off"}</strong>.
        {byEnvironment ? " The editor is also open because this is a development run or URHA_STUDIO=1 is set." : ""}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={on ? "btn btn-secondary" : "btn btn-primary"} disabled={pending}>{on ? "Turn editor mode off" : "Turn editor mode on"}</button>
        {(on || byEnvironment) && <a href="/studio" className="btn btn-text">Open the environment editor</a>}
      </div>
      {state?.message && <p role="status" className={`text-[13px] ${state.ok ? "text-positive" : "text-negative"}`}>{state.message}</p>}
    </form>
  );
}
