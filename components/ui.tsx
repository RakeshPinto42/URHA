/** Shared server-safe primitives. Tokens only; no raw colours. */
import Link from "next/link";
import { STATUS_LABEL, type TopicStatus } from "@/lib/progress";
import type { ResolvedQuote } from "@/lib/quotes";

export function Canvas({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-column px-4 pb-24 pt-8 sm:px-6 lg:pt-12 ${className}`}>{children}</div>;
}

export function ScreenTitle({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        {sub && <p className="mt-2 max-w-[70ch] text-[15px] text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-none flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className = "", id }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  const headingId = id ? `${id}-h` : undefined;
  return (
    <section className={`panel ${className}`} aria-labelledby={headingId} id={id}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 id={headingId} className="text-[14px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Figure({ label, value, unit, caption }: { label: string; value: React.ReactNode; unit?: string; caption?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="num text-[28px] font-normal leading-tight">
        {value}
        {unit && <span className="ml-1 text-[14px] text-muted">{unit}</span>}
      </span>
      {caption && <span className="text-[13px] text-muted">{caption}</span>}
    </div>
  );
}

/** Six status marks, each a distinct shape so state never relies on colour (DESIGN §5). */
export function StatusMark({ status, size = 14 }: { status: TopicStatus; size?: number }) {
  const c = size / 2;
  const r = c - 1.25;
  const shape = (() => {
    switch (status) {
      case "not-started":
        return <circle cx={c} cy={c} r={r} fill="none" stroke="var(--control)" strokeWidth={1.5} />;
      case "ready":
        return (<><circle cx={c} cy={c} r={r} fill="none" stroke="var(--text)" strokeWidth={1.5} /><circle cx={c} cy={c} r={size / 7} fill="var(--text)" /></>);
      case "in-progress":
        return (<><circle cx={c} cy={c} r={r} fill="none" stroke="var(--text)" strokeWidth={1.5} /><path d={`M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill="var(--text)" /></>);
      case "completed":
        return <circle cx={c} cy={c} r={r + 0.75} fill="var(--text)" />;
      case "needs-revision":
        return (<><circle cx={c} cy={c} r={r + 0.75} fill="var(--warning)" /><rect x={c - 0.9} y={c - r / 1.6} width={1.8} height={r * 0.9} fill="var(--ground)" /><circle cx={c} cy={c + r / 2} r={0.95} fill="var(--ground)" /></>);
      case "mastered":
        return (<><circle cx={c} cy={c} r={r + 0.75} fill="var(--accent)" /><circle cx={c} cy={c} r={r / 2} fill="none" stroke="var(--ground)" strokeWidth={1.5} /></>);
    }
  })();
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="flex-none">{shape}</svg>;
}

export function StatusLabel({ status }: { status: TopicStatus }) {
  return (
    <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap text-[13px] text-muted">
      <StatusMark status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[14px] border border-dashed border-control px-4 py-4 text-[14px] text-muted">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "error" }) {
  const cls = tone === "error" ? "text-negative" : tone === "warn" ? "bg-[var(--warning-bg)] text-warning" : "bg-surface text-muted";
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-[12px] px-4 py-3 text-[14px] ${cls}`}>{children}</div>;
}

export function Quote({ quote, size = "lg" }: { quote: ResolvedQuote; size?: "lg" | "sm" }) {
  return (
    <figure className="flex flex-col gap-3">
      <blockquote className={`font-serif ${size === "lg" ? "text-[24px] leading-[1.3] sm:text-[28px]" : "text-[20px] leading-[1.35]"}`}>
        <p>{quote.type === "bible" || quote.type === "urha" ? quote.text : `“${quote.text}”`}</p>
      </blockquote>
      <figcaption className="flex flex-col gap-1 text-[13px] text-muted">
        <span><span className="text-ink">{quote.attribution}</span> · {quote.typeLabel}</span>
        <details className="group">
          <summary className="w-fit cursor-pointer list-none underline decoration-control underline-offset-4 hover:decoration-current">
            {quote.type === "bible" ? "Context" : "Source"}
          </summary>
          <p className="mt-1 max-w-[60ch]">{quote.detail}</p>
        </details>
      </figcaption>
    </figure>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <Link href={href} className={`underline decoration-control underline-offset-4 hover:decoration-current ${className}`}>{children}</Link>;
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-active">
        <div className="meter-fill h-full rounded-full" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
