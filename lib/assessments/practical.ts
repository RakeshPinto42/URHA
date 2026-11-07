/**
 * A practical assessment for every topic without a written one.
 *
 * Each is the topic's own practical assignment (lib/curriculum.ts), judged against one
 * shared rubric by a named reviewer. Nothing new is invented and nothing is auto-scored,
 * so every topic can reach Demonstrated honestly. A hand-written assessment for a topic
 * replaces its practical one simply by being added to WRITTEN in ./index.ts.
 */
import { PHASES, slug } from "../curriculum";
import type { Assessment, Criterion, Difficulty } from "./types";

const RUBRIC: Criterion[] = [
  { id: "works", label: "It works", points: 4, descriptor: "Running it does what the assignment asks on realistic input, including at least one failure case." },
  { id: "verified", label: "It is verified", points: 3, descriptor: "Tests or a repeatable check show it works, and their output is included." },
  { id: "own", label: "It is your own work", points: 3, descriptor: "Written or thoroughly reworked by you. Generated code you cannot explain line by line earns nothing here." },
  { id: "explained", label: "You can explain it", points: 2, descriptor: "The note states the main design decision, what you rejected and what you would change." },
];

const difficulty = (phaseOrder: number): Difficulty => (phaseOrder <= 2 ? "foundation" : phaseOrder <= 4 ? "intermediate" : "advanced");

export function practicalAssessments(writtenTopics: Set<string>): Assessment[] {
  return PHASES.flatMap((p) => p.topics.filter((t) => !writtenTopics.has(t.id)).map((t): Assessment => ({
    id: `${t.id}-practical`,
    version: 1,
    topicId: t.id,
    skills: t.skills,
    title: `${t.title}: practical assignment`,
    summary: "The topic’s practical assignment, built by you and reviewed against a rubric.",
    objectives: [t.objective],
    difficulty: difficulty(p.order),
    passPercent: 70,
    minutes: 240,
    items: [{
      id: `${t.id}-assignment`, type: "project", points: 12, required: true,
      revise: t.subtopics.map((s) => slug(s)),
      prompt: t.assignment,
      evidence: "url-and-text",
      rubric: RUBRIC,
      guidance: "Open the link and run the work yourself where you can. Score what you verified, not what the note claims.",
    }],
  })));
}
