"use client";
/** Small labelled controls for the Inspector. Every one has a real label, so all of it works by keyboard. */
import { useEffect, useState } from "react";
import type { Animated, Vec3 } from "@/lib/cinema-engine/schema";

const LABEL = "flex items-center justify-between gap-3 text-[12px] text-[#b8ad9c]";
const INPUT = "h-7 min-w-0 rounded border border-[#3a3f52] bg-[#0e1018] px-1.5 text-[12px] text-[#efe9df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9b56f]";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[#262a38] px-3 py-3">
      <h3 className="mb-2 text-[12px] font-semibold text-[#efe9df]">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function NumberField({ label, value, onChange, step = 0.1, min, max }: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <label className={LABEL}>
      <span className="truncate">{label}</span>
      <input type="number" className={`${INPUT} w-24`} value={value} step={step} min={min} max={max}
        onChange={(e) => { const n = e.target.valueAsNumber; if (Number.isFinite(n)) onChange(n); }} />
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={LABEL}>
      <span className="truncate">{label}</span>
      <input type="color" className="h-7 w-24 cursor-pointer rounded border border-[#3a3f52] bg-[#0e1018]" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Applied on leaving the field, so a half-typed id never renames anything.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className={LABEL}>
      <span className="truncate">{label}</span>
      <input className={`${INPUT} w-40`} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => { if (draft !== value) onChange(draft); }} />
    </label>
  );
}

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className={LABEL}>
      <span className="truncate">{label}</span>
      <select className={`${INPUT} w-24`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={LABEL}>
      <span>{label}</span>
      <input type="checkbox" className="h-4 w-4 accent-[#d9b56f]" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Vec3Field({ label, value, onChange, step = 0.5 }: { label: string; value: Vec3; onChange: (v: Vec3) => void; step?: number }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-[12px] text-[#b8ad9c]">{label}</legend>
      <div className="grid grid-cols-3 gap-1">
        {(["x", "y", "z"] as const).map((axis, i) => (
          <label key={axis} className="flex min-w-0 items-center gap-1 text-[11px] text-[#9a8f7f]">
            <span aria-hidden="true">{axis}</span>
            <span className="sr-only">{label} {axis}</span>
            <input type="number" className={`${INPUT} w-full`} step={step} value={value[i]}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (!Number.isFinite(n)) return;
                const next = [...value] as Vec3;
                next[i] = n;
                onChange(next);
              }} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** A value that may run from one number to another along a timeline. */
export function AnimatedNumber({ label, value, onChange, step = 0.05 }: { label: string; value: Animated<number>; onChange: (v: Animated<number>) => void; step?: number }) {
  if (!Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-1">
        <NumberField label={label} value={value} onChange={onChange} step={step} />
        <button type="button" className="self-end text-[11px] text-[#d9b56f] underline" onClick={() => onChange([value, value])}>Animate along timeline</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <NumberField label={`${label}, start`} value={value[0]} onChange={(n) => onChange([n, value[1]])} step={step} />
      <NumberField label={`${label}, end`} value={value[1]} onChange={(n) => onChange([value[0], n])} step={step} />
      <button type="button" className="self-end text-[11px] text-[#d9b56f] underline" onClick={() => onChange(value[1])}>Keep one value</button>
    </div>
  );
}

export function AnimatedColor({ label, value, onChange }: { label: string; value: Animated<string>; onChange: (v: Animated<string>) => void }) {
  if (!Array.isArray(value)) return <ColorField label={label} value={value} onChange={onChange} />;
  return (
    <>
      <ColorField label={`${label}, start`} value={value[0]} onChange={(c) => onChange([c, value[1]])} />
      <ColorField label={`${label}, end`} value={value[1]} onChange={(c) => onChange([value[0], c])} />
    </>
  );
}

/** Any object's settings, from the settings themselves: new object types need no new form. */
export function ParamFields({ params, onChange }: { params: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void }) {
  return (
    <>
      {Object.entries(params).map(([key, value]) => {
        const set = (v: unknown) => onChange({ ...params, [key]: v });
        const label = key.replace(/([A-Z])/g, " $1").toLowerCase();
        if (typeof value === "number") return <NumberField key={key} label={label} value={value} onChange={set} />;
        if (typeof value === "boolean") return <CheckField key={key} label={label} value={value} onChange={set} />;
        if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) return <ColorField key={key} label={label} value={value} onChange={set} />;
        if (typeof value === "string") return <TextField key={key} label={label} value={value} onChange={set} />;
        return <JsonField key={key} label={label} value={value} onChange={set} />;
      })}
    </>
  );
}

/** Lists and nested settings, edited as JSON. A typing mistake is reported, not applied. */
function JsonField({ label, value, onChange }: { label: string; value: unknown; onChange: (v: unknown) => void }) {
  const text = JSON.stringify(value, null, 1);
  const [draft, setDraft] = useState(text);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setDraft(text); setError(null); }, [text]);
  return (
    <label className="flex flex-col gap-1 text-[12px] text-[#b8ad9c]">
      {label}
      <textarea className={`${INPUT} h-28 py-1 font-mono text-[11px]`} value={draft} aria-invalid={!!error}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          try { onChange(JSON.parse(draft)); setError(null); } catch { setError("This is not valid JSON, so it was not applied."); }
        }} />
      {error && <span role="alert" className="text-[#f0b35a]">{error}</span>}
    </label>
  );
}
