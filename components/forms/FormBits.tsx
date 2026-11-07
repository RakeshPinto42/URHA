"use client";
import { useId } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

export function Submit({ children, className = "btn btn-primary", pendingText = "Saving…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state?.message) return <p role="status" aria-live="polite" className="sr-only" />;
  return (
    <p role={state.ok ? "status" : "alert"} aria-live="polite" className={`text-[13px] ${state.ok ? "text-positive" : "text-negative"}`}>
      {state.message}
    </p>
  );
}

type FieldProps = {
  label: string; name: string; state: ActionState; hint?: string;
  children?: (p: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "children">;

/** The value to show: what the user just submitted (after a failed save), else the default. */
export function keep(state: ActionState, name: string, fallback: string | number | null | undefined): string | number {
  return state?.values?.[name] ?? fallback ?? "";
}

/** Label above, hint and error tied by aria-describedby (DESIGN §8.1). */
export function Field({ label, name, state, hint, children, ...input }: FieldProps) {
  const id = useId();
  const err = state?.errors?.[name];
  const describedBy = [hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  const a11y = { id, "aria-invalid": err ? true : undefined, "aria-describedby": describedBy };
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {children ? children(a11y) : <input name={name} className="input" {...a11y} {...input} {...("defaultValue" in input ? { defaultValue: keep(state, name, input.defaultValue as string) } : {})} />}
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {err && <span id={`${id}-err`} className="field-error">{err}</span>}
    </label>
  );
}
