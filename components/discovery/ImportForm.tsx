"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ImportForm({ kind, label, hint }: { kind: "screener" | "amfi"; label: string; hint: string }) {
  const router = useRouter();
  const picker = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const send = async (file: File) => {
    setBusy(true); setState(null);
    const r = await fetch(`/api/stocks/import?kind=${kind}`, { method: "POST", headers: { "Content-Type": "text/csv" }, body: file }).catch(() => null);
    setBusy(false);
    if (!r) { setState({ tone: "error", text: "The app's server did not respond." }); return; }
    const body = (await r.json().catch(() => ({}))) as { message?: string; error?: string };
    setState(r.ok ? { tone: "ok", text: body.message ?? "Imported." } : { tone: "error", text: body.error ?? "The import failed." });
    if (r.ok) router.refresh();
  };

  return (
    <div className="card-row p-3">
      <p className="text-[14px] font-medium">{label}</p>
      <p className="text-[13px] text-muted">{hint}</p>
      <button type="button" className="btn btn-secondary mt-2" disabled={busy} onClick={() => picker.current?.click()}>{busy ? "Importing…" : "Choose CSV"}</button>
      <input ref={picker} type="file" accept=".csv,text/csv" className="sr-only" aria-label={`Choose ${label}`} tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void send(f); }} />
      {state && <p role={state.tone === "error" ? "alert" : "status"} className={`mt-2 text-[13px] ${state.tone === "error" ? "text-negative" : ""}`}>{state.text}</p>}
    </div>
  );
}
