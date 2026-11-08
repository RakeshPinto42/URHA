import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getPath, getResources, getSettings, getSkills, getTask, listTasks, weekStats, type TaskView } from "@/lib/data";
import { addDays, formatMinutes, isIsoDate, longDate, relativeDay, today as todayIso, weekDays, weekStart } from "@/lib/dates";
import { CATEGORIES, CATEGORY_LABEL, PRIORITY_LABEL, RECURRENCE_LABEL, STATUSES, TASK_STATUS_LABEL, compareTasks, type Category, type TaskStatus } from "@/lib/taskLogic";
import { PageEnter } from "@/components/Motion";
import { Empty, Figure, Meter, Panel, TextLink } from "@/components/ui";
import { TaskDoneButton } from "@/components/forms/TaskDoneButton";
import { DeleteTask, TaskForm, TaskStatusForm, type Options } from "@/components/forms/TaskForm";
import { Icon } from "@/components/Icon";
import { FrontispieceBand, RisingTitle } from "@/components/Frontispiece";

export const metadata: Metadata = { title: "My Tasks" };

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "all", label: "All open" },
  { id: "history", label: "Completed" },
] as const;
type View = (typeof VIEWS)[number]["id"];
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function TasksPage({ searchParams }: { searchParams: Promise<SP> }) {
  await connection();
  const sp = await searchParams;
  const view: View = (VIEWS.find((v) => v.id === one(sp.view))?.id ?? "today") as View;
  const t = todayIso();
  const weekRef = isIsoDate(one(sp.week)) ? one(sp.week) : t;
  const filters = {
    priority: ["1", "2", "3"].includes(one(sp.priority)) ? Number(one(sp.priority)) : null,
    category: CATEGORIES.includes(one(sp.category) as Category) ? (one(sp.category) as Category) : null,
    status: STATUSES.includes(one(sp.status) as TaskStatus) ? (one(sp.status) as TaskStatus) : null,
    topic: one(sp.topic) || null,
  };
  const path = getPath();
  const skills = getSkills();
  const resources = getResources();
  const settings = getSettings();
  const options: Options = {
    phases: path.phases.map((p) => ({ id: p.id, label: `Phase ${p.ord}` })),
    topics: path.phases.flatMap((p) => p.topics.map((x) => ({ id: x.id, label: `P${p.ord} · ${x.title}`, phaseId: p.id }))),
    skills: skills.map((s) => ({ id: s.id, label: s.name })),
    resources: resources.map((r) => ({ id: r.id, label: r.title, topicId: r.topicId })),
  };

  const all = listTasks();
  const matches = (x: TaskView) =>
    (!filters.priority || x.priority === filters.priority) &&
    (!filters.category || x.category === filters.category) &&
    (!filters.status || x.status === filters.status) &&
    (!filters.topic || x.topicId === filters.topic);
  const tasks = all.filter(matches);
  const open = tasks.filter((x) => x.status !== "done");
  const overdue = open.filter((x) => x.dueDate && x.dueDate < t && x.status !== "deferred").sort(compareTasks);
  const dueToday = open.filter((x) => x.dueDate === t).sort(compareTasks);
  const inProgressUndated = open.filter((x) => !x.dueDate && x.status === "in_progress");
  const week = weekStats(weekRef);

  const selected = one(sp.task) ? getTask(Number(one(sp.task))) : null;
  const creating = one(sp.new) === "1";
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const base: Record<string, string | null> = { view, priority: filters.priority ? String(filters.priority) : null, category: filters.category, status: filters.status, topic: filters.topic, week: view === "week" && weekRef !== t ? weekRef : null };
    Object.entries({ ...base, ...patch }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/tasks?${s}` : "/tasks";
  };
  const closeHref = qs({});
  const topicTitle = (id: string | null) => (id ? path.topicTitles[id] ?? "" : "");
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const Row = ({ x, showDate = true }: { x: TaskView; showDate?: boolean }) => (
    <li className={`card-row flex min-h-[56px] items-center gap-3 px-4 py-2.5 ${selected?.id === x.id ? "bg-active" : ""}`}>
      <TaskDoneButton id={x.id} title={x.title} done={x.status === "done"} />
      <div className="min-w-0 flex-1">
        <Link href={qs({ task: String(x.id) })} className={`block truncate text-[15px] hover:underline ${x.status === "done" ? "text-muted line-through" : ""}`}>{x.title}</Link>
        <span className="block truncate text-[13px] text-muted">
          {CATEGORY_LABEL[x.category]}{x.topicId ? ` · ${topicTitle(x.topicId)}` : ""}{x.estMinutes ? ` · ${formatMinutes(x.estMinutes)}` : ""}
          {x.recurrence !== "none" ? ` · ${RECURRENCE_LABEL[x.recurrence].toLowerCase()}` : ""}
        </span>
      </div>
      <span className="flex flex-none flex-col items-end gap-1 text-[13px]">
        {x.status === "blocked" && <span className="chip chip-warn" title={x.blockedReason}>Blocked</span>}
        {x.status === "deferred" && <span className="chip">Deferred</span>}
        {x.status === "in_progress" && <span className="chip">In progress</span>}
        {x.priority === 1 && x.status !== "done" && <span className="text-ink">High</span>}
        {showDate && x.dueDate && <span className={x.dueDate < t && x.status !== "done" ? "text-negative" : "text-muted"}>{relativeDay(x.dueDate, t)}</span>}
      </span>
    </li>
  );

  const List = ({ items, empty, showDate }: { items: TaskView[]; empty: string; showDate?: boolean }) =>
    items.length === 0 ? <p className="rounded-[12px] border border-dashed border-control px-4 py-3 text-[14px] text-muted">{empty}</p>
      : <ul className="flex flex-col gap-2">{items.map((x) => <Row key={x.id} x={x} showDate={showDate} />)}</ul>;

  const sideOpen = creating || !!selected;
  const prefill = {
    // Prefill comes from ?for=<topic>&as=<category> (or an active topic filter); it never acts as a list filter.
    topicId: options.topics.some((x) => x.id === one(sp.for)) ? one(sp.for) : filters.topic,
    category: CATEGORIES.includes(one(sp.as) as Category) ? (one(sp.as) as Category) : undefined,
    dueDate: view === "today" ? t : null,
  };

  return (
    <PageEnter>
      <FrontispieceBand section="tasks" height="compact">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14px] text-[#f7f7f5]/85">The Discipline</p>
            <RisingTitle text="My Tasks" className="mt-1 font-serif text-[40px] leading-[1.04] sm:text-[52px]" />
            <p className="mt-2 text-[15px] text-[#f7f7f5]/90">
              {dueToday.length} due today{overdue.length ? <> · <span className="font-medium">{overdue.length} overdue</span></> : ""}
              {open.filter((x) => x.status === "blocked").length ? ` · ${open.filter((x) => x.status === "blocked").length} blocked` : ""}
              {" "}· {formatMinutes(week.actualMinutes)} logged this week of {settings.weeklyTargetHours} h
            </p>
          </div>
          <Link href={qs({ new: "1", task: null })} className="btn self-start bg-[#f7f7f5] text-[#1f201d] hover:opacity-90 sm:self-auto"><Icon name="plus" /> New task</Link>
        </div>
      </FrontispieceBand>
      <div className="mx-auto w-full max-w-column px-4 pb-24 pt-6 sm:px-6">

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Task views" className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {VIEWS.map((v) => (
              <Link key={v.id} href={qs({ view: v.id, week: null })} aria-current={view === v.id ? "page" : undefined}
                className={`flex h-9 flex-none items-center rounded-full px-4 text-[14px] ${view === v.id ? "bg-ink text-ground" : "text-muted hover:bg-surface hover:text-ink"}`}>
                {v.label}
              </Link>
            ))}
          </nav>
          <details className="group relative">
            <summary className="btn btn-secondary w-fit cursor-pointer list-none">Filters{activeFilters ? ` · ${activeFilters}` : ""}</summary>
            <form method="get" action="/tasks" className="mt-2 grid grid-cols-2 gap-3 rounded-[16px] bg-surface p-4 md:absolute md:right-0 md:z-20 md:w-[520px] md:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              <input type="hidden" name="view" value={view} />
              <label className="field"><span>Priority</span>
                <select name="priority" className="input" defaultValue={filters.priority ?? ""}><option value="">Any</option>{[1, 2, 3].map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p as 1 | 2 | 3]}</option>)}</select></label>
              <label className="field"><span>Category</span>
                <select name="category" className="input" defaultValue={filters.category ?? ""}><option value="">Any</option>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></label>
              <label className="field"><span>Status</span>
                <select name="status" className="input" defaultValue={filters.status ?? ""}><option value="">Any</option>{STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}</select></label>
              <label className="field"><span>Topic</span>
                <select name="topic" className="input" defaultValue={filters.topic ?? ""}><option value="">Any</option>{options.topics.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
              <div className="col-span-2 flex gap-2"><button type="submit" className="btn btn-primary">Apply</button><a href={`/tasks?view=${view}`} className="btn btn-text">Clear</a></div>
            </form>
          </details>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${sideOpen ? "lg:grid-cols-12" : ""}`}>
          {/* Side panel first in source so phones see the form before the list */}
          {sideOpen && (
            <aside className="lg:order-2 lg:col-span-5" aria-label={creating ? "New task" : "Task details"}>
              <div className="panel lg:sticky lg:top-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold">{creating ? "New task" : "Task"}</h2>
                  <Link href={closeHref} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Close"><Icon name="close" /></Link>
                </div>
                {creating && <TaskForm options={options} defaults={prefill} onCloseHref={closeHref} />}
                {selected && (
                  <div className="flex flex-col gap-6">
                    {selected.status === "done" && (
                      <p className="text-[14px] text-muted">Completed {relativeDay(selected.completedOn!, t).toLowerCase()}{selected.actualMinutes != null ? ` · ${formatMinutes(selected.actualMinutes)} logged` : " · no time logged"}.</p>
                    )}
                    <TaskStatusForm key={`s-${selected.id}`} task={selected} />
                    <div className="border-t border-border pt-6"><TaskForm key={`f-${selected.id}`} task={selected} options={options} onCloseHref={closeHref} /></div>
                    <DeleteTask id={selected.id} title={selected.title} afterHref={closeHref} />
                  </div>
                )}
                {!creating && !selected && <p className="text-[14px] text-muted">That task no longer exists. <TextLink href={closeHref}>Back to the list</TextLink></p>}
              </div>
            </aside>
          )}

          <div className={`flex flex-col gap-6 ${sideOpen ? "lg:order-1 lg:col-span-7" : ""}`}>
            {all.length === 0 && view !== "history" ? (
              <Empty action={<Link href={qs({ new: "1" })} className="btn btn-primary"><Icon name="plus" /> Plan your first task</Link>}>
                No tasks yet. Open a topic in the Academy and turn its practical assignment into a task, or add one here.
              </Empty>
            ) : view === "today" ? (
              <>
                {overdue.length > 0 && <section aria-labelledby="ov"><h2 id="ov" className="mb-2 text-[14px] font-semibold text-negative">Overdue</h2><List items={overdue} empty="" /></section>}
                <section aria-labelledby="td"><h2 id="td" className="mb-2 text-[14px] font-semibold">Today · {longDate(t)}</h2><List items={dueToday} empty="Nothing due today." showDate={false} /></section>
                {inProgressUndated.length > 0 && <section aria-labelledby="ip"><h2 id="ip" className="mb-2 text-[14px] font-semibold">In progress, no date</h2><List items={inProgressUndated} empty="" /></section>}
              </>
            ) : view === "week" ? (
              <WeekView tasks={tasks} weekRef={weekRef} today={t} week={week} targetHours={settings.weeklyTargetHours} qs={qs} Row={Row} />
            ) : view === "all" ? (
              <>
                {(["in_progress", "todo", "blocked", "deferred"] as TaskStatus[]).map((s) => {
                  const items = open.filter((x) => x.status === s).sort(compareTasks);
                  return items.length ? <section key={s} aria-labelledby={`st-${s}`}><h2 id={`st-${s}`} className="mb-2 text-[14px] font-semibold">{TASK_STATUS_LABEL[s]} <span className="num font-normal text-muted">{items.length}</span></h2><List items={items} empty="" /></section> : null;
                })}
                {open.length === 0 && <p className="text-[14px] text-muted">No open tasks match.</p>}
              </>
            ) : (
              <History tasks={tasks.filter((x) => x.status === "done")} today={t} qs={qs} />
            )}
          </div>
        </div>
      </div>
    </PageEnter>
  );
}

function WeekView({ tasks, weekRef, today, week, targetHours, qs, Row }: {
  tasks: TaskView[]; weekRef: string; today: string; week: ReturnType<typeof weekStats>; targetHours: number;
  qs: (p: Record<string, string | null>) => string; Row: (p: { x: TaskView; showDate?: boolean }) => React.ReactNode;
}) {
  const days = weekDays(weekRef);
  const start = weekStart(weekRef);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold">Week of {longDate(start)}</h2>
        <div className="flex gap-1">
          <Link href={qs({ view: "week", week: addDays(start, -7) })} className="btn btn-text">← Previous</Link>
          {start !== weekStart(today) && <Link href={qs({ view: "week", week: null })} className="btn btn-text">This week</Link>}
          <Link href={qs({ view: "week", week: addDays(start, 7) })} className="btn btn-text">Next →</Link>
        </div>
      </div>
      <Panel title="Planned against actual" id="wk">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Figure label="Planned" value={formatMinutes(week.plannedMinutes)} caption="estimates due this week" />
          <Figure label="Logged" value={formatMinutes(week.actualMinutes)} caption="on completed tasks" />
          <Figure label="Target" value={`${targetHours} h`} />
          <Figure label="Completed" value={week.doneCount} caption={week.unloggedCount ? `${week.unloggedCount} without time` : undefined} />
        </div>
        <div className="mt-4"><Meter value={week.actualMinutes} max={targetHours * 60} label="Logged against weekly target" /></div>
      </Panel>
      <ol className="flex flex-col gap-5">
        {days.map((d) => {
          const items = tasks.filter((x) => x.dueDate === d || (x.status === "done" && x.completedOn === d && x.dueDate !== d)).sort(compareTasks);
          return (
            <li key={d} aria-labelledby={`d-${d}`}>
              <h3 id={`d-${d}`} className={`mb-2 text-[14px] ${d === today ? "font-semibold" : "text-muted"}`}>{longDate(d)}{d === today ? " · Today" : ""}</h3>
              {items.length ? <ul className="flex flex-col gap-2">{items.map((x) => <Row key={x.id} x={x} showDate={false} />)}</ul>
                : <p className="text-[13px] text-faint">—</p>}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function History({ tasks, today, qs }: { tasks: TaskView[]; today: string; qs: (p: Record<string, string | null>) => string }) {
  const sorted = [...tasks].sort((a, b) => ((a.completedOn ?? "") < (b.completedOn ?? "") ? 1 : -1));
  if (sorted.length === 0) return <p className="rounded-[12px] border border-dashed border-control px-4 py-3 text-[14px] text-muted">Nothing completed yet.</p>;
  return (
    <section aria-labelledby="hist">
      <h2 id="hist" className="mb-2 text-[14px] font-semibold">Completion history <span className="num font-normal text-muted">{sorted.length}</span></h2>
      <ul className="flex flex-col">
        {sorted.map((x) => (
          <li key={x.id} className="flex flex-col gap-1 border-b border-rule py-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={qs({ task: String(x.id) })} className="text-[15px] hover:underline">{x.title}</Link>
              <p className="text-[13px] text-muted">{CATEGORY_LABEL[x.category]}{x.completionNotes ? ` · ${x.completionNotes}` : ""}</p>
            </div>
            <div className="num flex-none text-right text-[13px]">
              <span className="block">{x.completedOn ? relativeDay(x.completedOn, today) : "—"}</span>
              <span className="block text-muted">{x.actualMinutes != null ? formatMinutes(x.actualMinutes) : "—"}{x.estMinutes ? ` of ${formatMinutes(x.estMinutes)} est.` : ""}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
