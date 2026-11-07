/** The assessment registry. Adding an assessment = adding it to this list (validated in tests). */
import type { Assessment } from "./types";
import { PYTHON_ENGINEERING, SOFTWARE_ENGINEERING, SQL_FOUNDATIONS } from "./phase1";
import { BACKEND_ENGINEERING, LANGGRAPH, RAG_ARCHITECTURE } from "./later";
import { practicalAssessments } from "./practical";

const WRITTEN: Assessment[] = [
  PYTHON_ENGINEERING, SOFTWARE_ENGINEERING, SQL_FOUNDATIONS, BACKEND_ENGINEERING, RAG_ARCHITECTURE, LANGGRAPH,
];

/** Written assessments first, then a practical one for every other topic: each topic has exactly one. */
export const ASSESSMENTS: Assessment[] = [...WRITTEN, ...practicalAssessments(new Set(WRITTEN.map((a) => a.topicId)))];

const byId = new Map(ASSESSMENTS.map((a) => [a.id, a]));
export const getAssessment = (id: string): Assessment | undefined => byId.get(id);
export const assessmentsForTopic = (topicId: string): Assessment[] => ASSESSMENTS.filter((a) => a.topicId === topicId);

export * from "./types";
