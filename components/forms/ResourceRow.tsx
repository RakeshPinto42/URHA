"use client";
import { useActionState, useState } from "react";
import { saveResource, type ActionState } from "@/app/actions";
import type { ResourceView } from "@/lib/data";
import { Field, FormMessage, Submit } from "./FormBits";
import { Icon } from "../Icon";

const KIND: Record<string, string> = { udemy: "Udemy", youtube: "YouTube", docs: "Documentation", course: "Course", article: "Article" };

function LinkState({ r }: { r: ResourceView }) {
  if (!r.url) return <span className="chip chip-warn">Link not added</span>;
  if (r.linkStatus === "resolves") return <span className="chip" title={`HTTP ${r.linkHttp} on ${r.linkCheckedAt?.slice(0, 10)}`}>Link resolves</span>;
  if (r.linkStatus === "failed") return <span className="chip chip-warn" title={`HTTP ${r.linkHttp ?? "no response"} on ${r.linkCheckedAt?.slice(0, 10)}`}>Link failed check</span>;
  if (r.linkHttp === 401 || r.linkHttp === 403 || r.linkHttp === 429) {
    return <span className="chip" title={`The site refused an automated check (HTTP ${r.linkHttp}) on ${r.linkCheckedAt?.slice(0, 10)}`}>Unverified · site blocks checks</span>;
  }
  return <span className="chip">Unverified link</span>;
}

export function ResourceRow({ r }: { r: ResourceView }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (p, fd) => {
    const res = await saveResource(p, fd);
    if (res?.ok) setEditing(false);
    return res;
  }, null);
  return (
    <li className="card-row p-4">
      <div>
        <div className="min-w-0">
          <p className="text-[12px] text-muted">{KIND[r.kind] ?? r.kind}{r.primary ? " · Primary" : ""}{r.hours ? ` · about ${r.hours} h` : ""}</p>
          {r.url ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1.5 text-[15px] font-medium hover:underline">
              {r.title} <Icon name="external" size={13} /><span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <p className="mt-0.5 text-[15px] font-medium">{r.title}</p>
          )}
          <p className="text-[13px] text-muted">{r.author}</p>
        </div>
        <div className="mt-2"><LinkState r={r} /></div>
      </div>
      {r.sections && <p className="mt-2 text-[14px]"><span className="text-muted">Use:</span> {r.sections}</p>}
      {!editing ? (
        <button type="button" className="btn-text mt-1 -ml-2 text-[13px]" onClick={() => setEditing(true)}>Edit link and sections</button>
      ) : (
        <form action={action} className="mt-3 flex flex-col gap-3" noValidate>
          <input type="hidden" name="id" value={r.id} />
          <Field label="Link" name="url" type="url" defaultValue={r.url ?? ""} placeholder="https://…" state={state} hint="Changing the link marks it unverified until the link check runs." />
          <Field label="Sections or lessons to use" name="sections" defaultValue={r.sections} state={state} />
          <Field label="Estimated hours" name="hours" type="number" min={0} max={500} step={0.5} defaultValue={r.hours ?? ""} state={state} />
          <div className="flex items-center gap-2">
            <Submit>Save</Submit>
            <button type="button" className="btn btn-text" onClick={() => setEditing(false)}>Cancel</button>
            <FormMessage state={state} />
          </div>
        </form>
      )}
    </li>
  );
}
