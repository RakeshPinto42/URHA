/**
 * What changed between the seven-phase path and the six-phase path of docs/PRD.md.
 * Used only by lib/curriculum-migration.ts.
 */

/** Subtopics that moved to another topic: [from, to, title]. Their ids change, so progress is carried. */
export const MOVED_SUBTOPICS: [from: string, to: string, title: string][] = [
 [
  "python-engineering",
  "python-foundations",
  "Python fundamentals where gaps exist"
 ],
 [
  "python-engineering",
  "python-foundations",
  "Data structures and collections"
 ],
 [
  "python-engineering",
  "python-foundations",
  "Functions and modular programming"
 ],
 [
  "python-engineering",
  "python-foundations",
  "Exception handling"
 ],
 [
  "python-engineering",
  "python-foundations",
  "File handling"
 ],
 [
  "python-engineering",
  "python-foundations",
  "JSON processing"
 ],
 [
  "python-engineering",
  "python-foundations",
  "Virtual environments"
 ],
 [
  "sql-foundations",
  "pandas-analysis",
  "Selective pandas for loading and checking data"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "HTTP fundamentals"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "REST architecture"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "FastAPI"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "Pydantic"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "Request and response validation"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "API routing"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "Error handling"
 ],
 [
  "backend-engineering",
  "api-essentials",
  "API testing"
 ]
];

/** Subtopics deliberately removed. Any progress on them is archived, never deleted. */
export const DROPPED_SUBTOPICS: { topic: string; subtopic: string; reason: string }[] = [
  {
    "topic": "llm-engineering",
    "subtopic": "Anthropic APIs",
    "reason": "PRD §11 names OpenAI API / Azure OpenAI as the one primary stack."
  },
  {
    "topic": "observability",
    "subtopic": "Langfuse",
    "reason": "PRD §11 names LangSmith."
  }
];

/** Where a task with no topic goes. A task with a topic follows its topic. */
export const PHASE_MOVES: Record<string, string> = { p1: "p1", p2: "p3", p3: "p3", p4: "p4", p5: "p5", p6: "p5", p7: "p6" };
