/**
 * Assessment definitions (docs/JOURNEY.md §6). Versioned content in code; attempts and
 * evidence live in SQLite. Answer keys never leave the server: client components get
 * `publicItem()` views only.
 */

export type Difficulty = "foundation" | "intermediate" | "advanced";

type Base = {
  id: string;
  prompt: string;
  points: number;
  /** A required item must reach REQUIRED_SHARE of its points for the attempt to pass. */
  required?: boolean;
  /** Subtopic slugs (within the assessment's topic) or full "topic:slug" ids to revise when missed. */
  revise: string[];
};

/** One or more correct options; all-or-nothing. */
export type McqItem = Base & { type: "mcq"; options: string[]; correct: number[]; explain: string };

/** Code with a defect; choose the line or explanation that identifies it. All-or-nothing. */
export type DebugItem = Base & { type: "debug"; language: "python" | "sql" | "http"; code: string; options: string[]; correct: number[]; explain: string };

/** A query run against a fixture; its result set is compared with the reference query's. */
export type SqlItem = Base & { type: "sql"; fixture: string; reference: string; ordered: boolean; explain: string };

export type Criterion = { id: string; label: string; points: number; descriptor: string };

/** Judged by a person against the rubric. Never scored automatically, never by an AI. */
export type RubricItem = Base & {
  type: "concept" | "scenario" | "architecture" | "code" | "project";
  context?: string;
  rubric: Criterion[];
  /** What the learner must hand in. */
  evidence: "text" | "url" | "url-and-text";
  /** Shown to the reviewer after submission, never before. */
  guidance?: string;
};

export type Item = McqItem | DebugItem | SqlItem | RubricItem;
export type AutoItem = McqItem | DebugItem | SqlItem;

export type Assessment = {
  id: string;
  version: number;
  topicId: string;
  skills: string[];
  title: string;
  summary: string;
  objectives: string[];
  difficulty: Difficulty;
  passPercent: number;
  minutes: number;
  items: Item[];
};

export const REQUIRED_SHARE = 0.6;
export const MAX_QUERY_CHARS = 4000;

export const isAuto = (i: Item): i is AutoItem => i.type === "mcq" || i.type === "debug" || i.type === "sql";

export type ReviewMode = "auto" | "human" | "mixed";
export function reviewMode(a: Assessment): ReviewMode {
  const auto = a.items.filter(isAuto).length;
  return auto === a.items.length ? "auto" : auto === 0 ? "human" : "mixed";
}

export const maxPoints = (a: Assessment) => a.items.reduce((n, i) => n + i.points, 0);

export const TYPE_LABEL: Record<Item["type"], string> = {
  mcq: "Multiple choice", debug: "Debugging", sql: "SQL challenge", concept: "Concept", scenario: "Scenario",
  architecture: "Architecture and design", code: "Practical coding", project: "Project",
};

/** The part of an item safe to send to the browser: no answer keys, references or reviewer guidance. */
export type PublicItem =
  | { id: string; type: "mcq" | "debug"; prompt: string; points: number; required: boolean; options: string[]; multi: boolean; code?: string; language?: string }
  | { id: string; type: "sql"; prompt: string; points: number; required: boolean; fixture: string }
  | { id: string; type: RubricItem["type"]; prompt: string; points: number; required: boolean; context?: string; rubric: Criterion[]; evidence: RubricItem["evidence"] };

export function publicItem(i: Item): PublicItem {
  const base = { id: i.id, prompt: i.prompt, points: i.points, required: !!i.required };
  if (i.type === "mcq") return { ...base, type: "mcq", options: i.options, multi: i.correct.length > 1 };
  if (i.type === "debug") return { ...base, type: "debug", options: i.options, multi: i.correct.length > 1, code: i.code, language: i.language };
  if (i.type === "sql") return { ...base, type: "sql", fixture: i.fixture };
  return { ...base, type: i.type, context: i.context, rubric: i.rubric, evidence: i.evidence };
}
