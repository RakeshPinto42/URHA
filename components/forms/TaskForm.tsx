"use client";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { changeTaskStatus, createTask, deleteTask, updateTask, type ActionState } from "@/app/actions";
import type { TaskView } from "@/lib/data";
import { CATEGORIES, CATEGORY_LABEL, PRIORITY_LABEL, RECURRENCES, RECURRENCE_LABEL, STATUSES, TASK_STATUS_LABEL, type TaskStatus } from "@/lib/taskLogic";
import { Field, FormMessage, Submit, keep } from "./FormBits";

export type Options = {
  phases: { id: string; label: string }[];
  topics: { id: string; label: string; phaseId: string }[];
  skills: { id: string; label: string }[];
  resources: { id: string; label: string; topicId: string }[];
};

type Defaults = Partial<Pick<TaskView, "title" | "description" | "category" | "phaseId" | "topicId" | "skillId" | "resourceId" | "priority" | "estMinutes" | "dueDate" | "deliverable" | "recurrence">>;

function Select({ name, label, value, options, state, allowEmpty = true, onChange }: {
  name: string; label: string; value?: string | number | null; options: { id: string | number; label: string }[]; state: ActionState; allowEmpty?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <Field label={label} name={name} state={state}>
      {(a) => (
        <select name={name} className="input" defaultValue={keep(state, name, value)} onChange={(e) => onChange?.(e.target.value)} {...a}>
          {allowEmpty && <option value="">—</option>}
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
}

export function TaskForm({ task, defaults, options, onCloseHref }: { task?: TaskView; defaults?: Defaults; options: Options; onCloseHref: string }) {
  const router = useRouter();
  const d: Defaults = task ?? defaults ?? {};
  const [topicId, setTopicId] = useState<string>(d.topicId ?? "");
  // React 19 resets a form after its action, and <select> ignores a changed defaultValue on reset;
  // remounting the form after a failed save restores every field from the echoed values.
  const attempt = useRef(0);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = task ? await updateTask(prev, fd) : await createTask(prev, fd);
    if (!r?.ok) attempt.current += 1;
    if (r?.ok && !task) router.push(onCloseHref);
    return r;
  }, null);
  const topic = options.topics.find((t) => t.id === topicId);
  const resources = topicId ? options.resources.filter((r) => r.topicId === topicId) : options.resources;

  return (
    <form key={attempt.current} action={action} className="flex flex-col gap-4" noValidate>
      {task && <input type="hidden" name="id" value={task.id} />}
      <Field label="Title" name="title" required maxLength={200} defaultValue={d.title ?? ""} state={state} autoFocus={!task} />
      <div className="grid grid-cols-2 gap-4">
        <Select name="category" label="Category" value={d.category ?? "learn"} allowEmpty={false} state={state}
          options={CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABEL[c] }))} />
        <Select name="priority" label="Priority" value={d.priority ?? 2} allowEmpty={false} state={state}
          options={([1, 2, 3] as const).map((p) => ({ id: p, label: PRIORITY_LABEL[p] }))} />
        <Field label="Due date" name="dueDate" type="date" defaultValue={d.dueDate ?? ""} state={state} />
        <Field label="Estimate (minutes)" name="estMinutes" type="number" min={0} max={1440} step={5} inputMode="numeric" defaultValue={d.estMinutes ?? ""} state={state} />
      </div>
      <Select name="recurrence" label="Repeats" value={d.recurrence ?? "none"} allowEmpty={false} state={state}
        options={RECURRENCES.map((r) => ({ id: r, label: RECURRENCE_LABEL[r] }))} />
      <Select name="topicId" label="Topic" value={d.topicId} state={state} options={options.topics} onChange={setTopicId} />
      <input type="hidden" name="phaseId" value={topic?.phaseId ?? d.phaseId ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select name="skillId" label="Skill" value={d.skillId} state={state} options={options.skills} />
        <Select name="resourceId" label="Resource" value={d.resourceId} state={state} options={resources} />
      </div>
      <Field label="Description" name="description" state={state}>
        {(a) => <textarea name="description" className="input" maxLength={4000} defaultValue={keep(state, "description", d.description)} {...a} />}
      </Field>
      <Field label="Deliverable" name="deliverable" maxLength={500} defaultValue={d.deliverable ?? ""} state={state} hint="What exists when this is done: a file, a test, a commit." />
      <div className="flex flex-wrap items-center gap-3">
        <Submit>{task ? "Save changes" : "Add task"}</Submit>
        {!task && <a href={onCloseHref} className="btn btn-text">Cancel</a>}
        <FormMessage state={state} />
      </div>
    </form>
  );
}

/** Status change with the fields each status needs (actual time and notes on done; a reason on blocked). */
export function TaskStatusForm({ task }: { task: TaskView }) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [state, action] = useActionState<ActionState, FormData>(async (p, fd) => {
    const r = await changeTaskStatus(p, fd);
    return r?.ok ? { ok: true, message: "Status saved." } : r;
  }, null);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id" value={task.id} />
      <Field label="Status" name="status" state={state}>
        {(a) => (
          <select name="status" className="input" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} {...a}>
            {STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}
          </select>
        )}
      </Field>
      {status === "blocked" && (
        <Field label="Blocked on" name="blockedReason" required defaultValue={task.blockedReason} state={state} maxLength={500} />
      )}
      {status === "done" && (
        <>
          <Field label="Actual time (minutes)" name="actualMinutes" type="number" min={0} max={1440} step={5} inputMode="numeric"
            defaultValue={task.actualMinutes ?? task.estMinutes ?? ""} state={state} hint="Counts towards this week’s study hours." />
          <Field label="Completion notes" name="completionNotes" state={state}>
            {(a) => <textarea name="completionNotes" className="input" maxLength={2000} defaultValue={keep(state, "completionNotes", task.completionNotes)} {...a} />}
          </Field>
        </>
      )}
      <div className="flex items-center gap-3">
        <Submit className="btn btn-secondary">Update status</Submit>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function DeleteTask({ id, title, afterHref }: { id: number; title: string; afterHref: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (p, fd) => {
    const r = await deleteTask(p, fd);
    if (r?.ok) router.push(afterHref);
    return r;
  }, null);
  if (!confirming) {
    return <button type="button" className="btn btn-text text-negative" onClick={() => setConfirming(true)}>Delete task</button>;
  }
  return (
    <form action={action} className="flex flex-col gap-2 rounded-[12px] bg-surface p-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-[14px]">Delete “{title}”? Its history and logged time go with it.</p>
      <div className="flex gap-2">
        <Submit className="btn btn-primary" pendingText="Deleting…">Delete</Submit>
        <button type="button" className="btn btn-text" onClick={() => setConfirming(false)}>Keep it</button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
