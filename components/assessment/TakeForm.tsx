"use client";
/**
 * The attempt form. Answers are held in state and mirrored to this browser as a draft,
 * so a failed submit, a reload or a long break loses nothing. Items arrive as publicItem()
 * views: answer keys, reference queries and reviewer guidance never reach this component.
 */
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { previewSql, submitAttempt, type ActionState } from "@/app/actions";
import type { SqlResult } from "@/lib/assessments/sql";
import { MAX_QUERY_CHARS, TYPE_LABEL, type PublicItem } from "@/lib/assessments/types";
import { FormMessage, Submit } from "@/components/forms/FormBits";

type FixtureView = { title: string; schema: string };
type Answers = Record<string, string | number[]>;

const readDraft = (key: string): Answers => {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}") as Answers; } catch { return {}; }
};
const writeDraft = (key: string, a: Answers | null) => {
  try { if (a) localStorage.setItem(key, JSON.stringify(a)); else localStorage.removeItem(key); } catch { /* a private window: the state above still holds the work */ }
};

export function TakeForm({ assessmentId, version, items, fixtures }: { assessmentId: string; version: number; items: PublicItem[]; fixtures: Record<string, FixtureView> }) {
  const router = useRouter();
  const draftKey = `urha-attempt:${assessmentId}:${version}`;
  const [answers, setAnswers] = useState<Answers>({});
  const [restored, setRestored] = useState(false);
  const loaded = useRef(false);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await submitAttempt(prev, fd);
    if (r?.ok && r.href) { writeDraft(draftKey, null); router.push(r.href); }
    return r;
  }, null);

  useEffect(() => {
    const d = readDraft(draftKey);
    loaded.current = true;
    if (Object.keys(d).length) { setAnswers(d); setRestored(true); }
  }, [draftKey]);
  useEffect(() => { if (loaded.current && Object.keys(answers).length) writeDraft(draftKey, answers); }, [answers, draftKey]);

  const set = (k: string, v: string | number[]) => setAnswers((a) => ({ ...a, [k]: v }));
  const text = (k: string) => (typeof answers[k] === "string" ? (answers[k] as string) : "");
  const chosen = (k: string) => (Array.isArray(answers[k]) ? (answers[k] as number[]) : []);

  return (
    <form action={action}>
      <input type="hidden" name="assessmentId" value={assessmentId} />
      {restored && <p role="status" className="mb-4 text-[13px] text-muted">Your unfinished answers were restored from this browser.</p>}
      <ol className="flex flex-col">
        {items.map((item, n) => {
          const key = `item:${item.id}`;
          const err = state?.errors?.[key];
          return (
            <li key={item.id} id={item.id} className="grid grid-cols-1 gap-3 border-t border-border py-7 md:grid-cols-[120px_1fr] md:gap-6">
              <div className="text-[13px] text-muted">
                <p className="num font-serif text-[28px] leading-none text-ink">{n + 1}</p>
                <p className="mt-2">{TYPE_LABEL[item.type]}</p>
                <p className="num">{item.points} {item.points === 1 ? "point" : "points"}{item.required ? ", must pass" : ""}</p>
              </div>
              <div className="min-w-0">
                <p className="max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed">{item.prompt}</p>
                {item.type === "debug" && item.code && <Code>{item.code}</Code>}
                {"context" in item && item.context && <p className="mt-2 max-w-[68ch] text-[14px] text-muted">{item.context}</p>}

                {(item.type === "mcq" || item.type === "debug") && (
                  <fieldset className="mt-4">
                    <legend className="sr-only">Answer to question {n + 1}</legend>
                    {item.multi && <p className="mb-2 text-[13px] text-muted">Choose all that apply.</p>}
                    <div className="flex flex-col gap-1">
                      {item.options.map((o, i) => (
                        <label key={i} className="flex cursor-pointer items-start gap-3 rounded-[10px] px-2 py-2 text-[15px] hover:bg-surface">
                          <input type={item.multi ? "checkbox" : "radio"} name={key} value={i} className="mt-1 flex-none"
                            checked={chosen(key).includes(i)}
                            onChange={(e) => set(key, item.multi ? (e.target.checked ? [...chosen(key), i] : chosen(key).filter((x) => x !== i)) : [i])} />
                          <span>{o}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {item.type === "sql" && (
                  <SqlField name={key} fixtureId={item.fixture} fixture={fixtures[item.fixture]} value={text(key)} onChange={(v) => set(key, v)} />
                )}

                {"rubric" in item && (
                  <div className="mt-4 flex flex-col gap-3">
                    {item.evidence !== "url" && (
                      <label className="field">
                        <span>{item.evidence === "text" ? "Your answer" : "Your note"}</span>
                        <textarea name={key} rows={item.evidence === "text" ? 8 : 5} className="input" value={text(key)} onChange={(e) => set(key, e.target.value)} aria-invalid={err ? true : undefined} />
                      </label>
                    )}
                    {item.evidence !== "text" && (
                      <label className="field">
                        <span>Link to the work</span>
                        <input type="url" name={`${key}:url`} className="input" inputMode="url" placeholder="https://github.com/…" value={text(`${key}:url`)} onChange={(e) => set(`${key}:url`, e.target.value)}
                          aria-invalid={state?.errors?.[`${key}:url`] ? true : undefined} />
                        {state?.errors?.[`${key}:url`] && <span className="field-error">{state.errors[`${key}:url`]}</span>}
                      </label>
                    )}
                    <details className="text-[14px]">
                      <summary className="w-fit cursor-pointer text-muted underline decoration-control underline-offset-4 hover:text-ink">How this is judged</summary>
                      <ul className="mt-2 flex max-w-[68ch] flex-col gap-1.5">
                        {item.rubric.map((c) => <li key={c.id}><span className="font-medium">{c.label}</span> <span className="num text-muted">({c.points})</span>: {c.descriptor}</li>)}
                      </ul>
                    </details>
                  </div>
                )}
                {err && <p className="field-error mt-2">{err}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Submit pendingText="Grading…">Submit for grading</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function Code({ children }: { children: string }) {
  return <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-[12px] bg-surface p-4 font-mono text-[13px] leading-relaxed">{children}</pre>;
}

function SqlField({ name, fixtureId, fixture, value, onChange }: { name: string; fixtureId: string; fixture?: FixtureView; value: string; onChange: (v: string) => void }) {
  const [result, setResult] = useState<SqlResult | null>(null);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    try { setResult(await previewSql(fixtureId, value)); }
    catch { setResult({ ok: false, error: "The query could not be run." }); }
    finally { setRunning(false); }
  };
  return (
    <div className="mt-4 flex flex-col gap-3">
      {fixture && (
        <details open>
          <summary className="w-fit cursor-pointer text-[14px] text-muted underline decoration-control underline-offset-4 hover:text-ink">{fixture.title}</summary>
          <Code>{fixture.schema}</Code>
        </details>
      )}
      <label className="field">
        <span>Your query</span>
        <textarea name={name} rows={8} maxLength={MAX_QUERY_CHARS} spellCheck={false} className="input font-mono text-[14px]" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <div>
        <button type="button" className="btn btn-secondary" disabled={running || !value.trim()} aria-busy={running} onClick={run}>{running ? "Running…" : "Run query"}</button>
      </div>
      <div aria-live="polite">
        {result && !result.ok && <p className="text-[14px] text-negative">{result.error}</p>}
        {result?.ok && (
          <div className="overflow-x-auto">
            <table className="num w-full text-left text-[13px]">
              <thead><tr className="border-b border-control">{result.columns.map((c, i) => <th key={i} scope="col" className="px-2 py-1.5 font-medium">{c}</th>)}</tr></thead>
              <tbody>
                {result.rows.slice(0, 50).map((r, i) => <tr key={i} className="border-b border-border">{r.map((v, j) => <td key={j} className="px-2 py-1.5">{v === null ? <span className="text-muted">NULL</span> : String(v)}</td>)}</tr>)}
              </tbody>
            </table>
            <p className="mt-2 text-[13px] text-muted">
              {result.rows.length === 0 ? "No rows." : `${result.rows.length} row${result.rows.length === 1 ? "" : "s"}${result.rows.length > 50 || result.truncated ? ", first 50 shown" : ""}.`} This shows what your query returns, not whether it is right.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
