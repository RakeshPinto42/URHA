/** One subtopic's study plan: primary resource, optional supplement, exercise. Server-safe. */
import type { CatalogResource, SubtopicPlan } from "@/lib/catalog";
import { Icon } from "./Icon";

function ResourceLine({ r, role }: { r: CatalogResource; role: "Primary" | "If it helps" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[12px] text-muted">
        {role} · {r.kind === "video" ? "Video" : "Official docs"} · {r.author}
        {r.kind === "video" && <> · <span className="num">{r.segment ? `${r.segment}, about ${r.minutes} min` : `${r.minutes} min`}</span></>}
      </p>
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-[14px] font-medium hover:underline">
        <span>{r.title}</span><Icon name="external" size={12} className="mt-1" /><span className="sr-only">(opens in a new tab{r.segment ? `, starts at ${r.segment.split(" – ")[0]}` : ""})</span>
      </a>
      {r.why && <p className="text-[13px] text-muted">{r.why}</p>}
      {r.caution && <p className="text-[13px] text-warning">{r.caution}</p>}
    </div>
  );
}

export function StudyPlan({ plan }: { plan: SubtopicPlan }) {
  return (
    <div className="mt-3 grid gap-4 rounded-[12px] bg-surface p-4 md:grid-cols-2">
      {plan.outcome && <p className="text-[15px] md:col-span-2"><span className="text-muted">You will be able to</span> {plan.outcome}.</p>}
      <div className="flex flex-col gap-3">
        {plan.primary ? <ResourceLine r={plan.primary} role="Primary" /> : <p className="text-[13px] text-muted">No verified resource yet. Use the topic's official documentation.</p>}
        {plan.supplement && <ResourceLine r={plan.supplement} role="If it helps" />}
      </div>
      <div>
        <p className="text-[12px] text-muted">Exercise · <span className="num">about {plan.exerciseMinutes} min</span></p>
        <p className="mt-0.5 text-[14px]">{plan.exercise}</p>
        <p className="mt-2 text-[12px] text-muted">Mark <span className="text-ink">Practised</span> when this is done; <span className="text-ink">Proficient</span> needs your own evidence, and <span className="text-ink">Demonstrated</span> needs the assessment.</p>
      </div>
    </div>
  );
}
