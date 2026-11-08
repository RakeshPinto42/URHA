/** Test helpers that respect the curriculum's rules rather than bypass them. */
import * as data from "@/lib/data";
import { EXERCISES } from "@/lib/practice/exercises";
import { recordAttempt } from "@/lib/practice/progress";

/** Completes a topic the way a learner must: every subtopic practised, every linked exercise passed. */
export function completeTopic(topicId: string) {
  const t = data.getPath().phases.flatMap((p) => p.topics).find((x) => x.id === topicId);
  if (!t) throw new Error(`No topic ${topicId}`);
  for (const id of t.prerequisites) completeTopic(id);
  for (const s of t.subtopics) if (!s.progress.practised) data.setStep(s.id, "practised", true, null);
  for (const e of EXERCISES.filter((x) => x.topicId === topicId)) recordAttempt({ exerciseId: e.id, passed: true, checksPassed: 3, checksTotal: 3, seconds: 0.1, code: "# test" });
}

/** Completes everything a topic depends on, so its own steps can be recorded. */
export function completePrerequisites(topicId: string) {
  const t = data.getPath().phases.flatMap((p) => p.topics).find((x) => x.id === topicId);
  for (const id of t?.prerequisites ?? []) completeTopic(id);
}
