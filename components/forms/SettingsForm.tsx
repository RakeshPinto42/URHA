"use client";
import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/app/actions";
import { Field, FormMessage, Submit } from "./FormBits";

export function SettingsForm({ defaults, compact = false }: { defaults: { startDate: string; weeklyTargetHours: number; name: string }; compact?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettings, null);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : ""}`}>
        <Field label="Path start date" name="startDate" type="date" required defaultValue={defaults.startDate} state={state}
          hint={compact ? undefined : "Month 1 of the 24-month roadmap begins on this date."} />
        <Field label="Weekly study target (hours)" name="weeklyTargetHours" type="number" min={1} max={80} step={0.5} required
          defaultValue={defaults.weeklyTargetHours} state={state} inputMode="decimal" />
      </div>
      {!compact && <Field label="Name for the greeting (optional)" name="name" defaultValue={defaults.name} maxLength={60} state={state} autoComplete="given-name" />}
      {compact && <input type="hidden" name="name" value={defaults.name} />}
      <div className="flex items-center gap-4">
        <Submit>{compact ? "Begin the path" : "Save settings"}</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
