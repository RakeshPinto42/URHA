/**
 * The Grounds of Practice. Career decides what comes next; this groups the same curriculum by
 * what is being trained, so every exercise, challenge and project has one place to be practised.
 * It adds no content and no tables: exercises come from the study plans, challenges from the
 * assessments, and standing from the learner's own recorded progress.
 */
import { paneAt } from "./cinema";
import type { DisciplineMark } from "./realm/rooms";

export type DisciplineId = "python" | "sql" | "pandas" | "data" | "ai" | "finance" | "platform";

export type Discipline = { id: DisciplineId; title: string; line: string; match: RegExp; plinth: boolean };

/** First match wins, so a topic belongs to exactly one discipline. */
export const DISCIPLINES: readonly Discipline[] = [
  { id: "pandas", title: "Pandas", line: "Clean, join and reconcile real finance tables.", match: /pandas/i, plinth: true },
  { id: "sql", title: "SQL", line: "Query, model and prove results against a database.", match: /\bsql\b/i, plinth: true },
  { id: "python", title: "Python", line: "Write, test and review working code.", match: /python|software engineering/i, plinth: true },
  { id: "data", title: "Data engineering", line: "Build pipelines that can be rerun and trusted.", match: /ingestion and validation|data modelling|databricks|pyspark|data architecture/i, plinth: true },
  { id: "finance", title: "Finance automation", line: "Turn close and reporting work into systems.", match: /power bi|fp&a|commercial|finops/i, plinth: true },
  { id: "ai", title: "AI", line: "LLMs, retrieval, agents and evaluation.", match: /llm|prompt|knowledge ingestion|retrieval|rag|agent|langgraph|mcp|\bai\b/i, plinth: true },
  { id: "platform", title: "Platform and architecture", line: "APIs, cloud, security and system design.", match: /./, plinth: false },
];

export const disciplineOf = (topicTitle: string): Discipline => DISCIPLINES.find((d) => d.match.test(topicTitle))!;

type Counts = { practised: number; total: number };
export type TopicLike = { id: string; title: string; counts: Counts };

export type Standing = { discipline: Discipline; topics: TopicLike[]; practised: number; total: number };

export function standings(topics: TopicLike[]): Standing[] {
  return DISCIPLINES.map((discipline) => {
    const own = topics.filter((t) => disciplineOf(t.title).id === discipline.id);
    return {
      discipline, topics: own,
      practised: own.reduce((n, t) => n + t.counts.practised, 0),
      total: own.reduce((n, t) => n + t.counts.total, 0),
    };
  });
}

/** The six plinths in the Grounds: how brightly each burns is the share really practised. */
export function plinthMarks(list: Standing[]): DisciplineMark[] {
  return list.filter((s) => s.discipline.plinth).map((s, i) => ({
    id: s.discipline.id, title: s.discipline.title, share: s.total ? s.practised / s.total : 0, color: paneAt(i + 2).bright,
  }));
}
