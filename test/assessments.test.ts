import { beforeEach, describe, expect, it } from "vitest";
import { openDb } from "@/lib/db";
import * as data from "@/lib/data";
import { PHASES, slug } from "@/lib/curriculum";
import { ASSESSMENTS, getAssessment, isAuto, publicItem } from "@/lib/assessments";
import { FIXTURES } from "@/lib/assessments/fixtures";
import { gradeAttempt, readHandIn } from "@/lib/assessments/attempt";
import { revisionFor, scoreRubric, summarise } from "@/lib/assessments/grade";
import { compareResults, runSql } from "@/lib/assessments/sql";
import { parseAttemptForm, parseEvidenceForm, parseReviewForm } from "@/lib/validate";
import { lowestMastery, topicMastery } from "@/lib/progress";

const g = globalThis as unknown as { __urhaDb?: ReturnType<typeof openDb> };
beforeEach(() => {
  g.__urhaDb?.close();
  g.__urhaDb = openDb(":memory:");
});

const subtopicIds = new Set(PHASES.flatMap((p) => p.topics.flatMap((t) => t.subtopics.map((s) => `${t.id}:${slug(s)}`))));
const topics = PHASES.flatMap((p) => p.topics);

/** A form with the right answer to every automatic item and a hand-in on every rubric item. */
function perfectForm(id: string) {
  const a = getAssessment(id)!;
  const fd = new FormData();
  for (const i of a.items) {
    const k = `item:${i.id}`;
    if (i.type === "mcq" || i.type === "debug") i.correct.forEach((c) => fd.append(k, String(c)));
    else if (i.type === "sql") fd.set(k, i.reference);
    else { fd.set(k, "My answer."); fd.set(`${k}:url`, "https://github.com/me/work"); }
  }
  return { a, fd };
}

async function submit(id: string, fd: FormData) {
  const a = getAssessment(id)!;
  const r = parseAttemptForm(a, fd);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  const gr = await gradeAttempt(a, r.value);
  return data.saveAttempt({ assessmentId: a.id, version: a.version, status: gr.summary.status, points: gr.summary.points, maxPoints: gr.summary.max, answers: gr.answers, evidence: gr.evidence });
}

function fullMarks(id: string, who = "self") {
  const a = getAssessment(id)!;
  const fd = new FormData();
  fd.set("who", who === "self" ? "self" : "other");
  if (who !== "self") fd.set("reviewerName", who);
  for (const i of a.items) if (!isAuto(i)) for (const c of i.rubric) fd.set(`score:${i.id}:${c.id}`, String(c.points));
  return fd;
}

function review(attemptId: number, id: string, fd: FormData) {
  const a = getAssessment(id)!;
  const r = parseReviewForm(a, fd);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  data.reviewAttempt(attemptId, r.value.reviewer, r.value.scores, (answers) => {
    const s = summarise(a, answers);
    return { status: s.status, points: s.points, max: s.max };
  });
}

describe("assessment registry", () => {
  it("gives every topic exactly one assessment", () => {
    for (const t of topics) expect(ASSESSMENTS.filter((a) => a.topicId === t.id), t.id).toHaveLength(1);
    expect(new Set(ASSESSMENTS.map((a) => a.id)).size).toBe(ASSESSMENTS.length);
  });
  it("points revision at real subtopics, and rubrics add up to the item's points", () => {
    for (const a of ASSESSMENTS) for (const i of a.items) {
      expect(i.revise.length, i.id).toBeGreaterThan(0);
      for (const r of i.revise) expect(subtopicIds.has(r.includes(":") ? r : `${a.topicId}:${r}`), `${i.id} → ${r}`).toBe(true);
      if (!isAuto(i)) expect(i.rubric.reduce((n, c) => n + c.points, 0), i.id).toBe(i.points);
    }
  });
  it("runs every reference query against its fixture", async () => {
    for (const a of ASSESSMENTS) for (const i of a.items) {
      if (i.type !== "sql") continue;
      expect(FIXTURES[i.fixture], i.id).toBeTruthy();
      const r = await runSql(i.fixture, i.reference);
      expect(r.ok && r.rows.length > 0, `${i.id}: ${JSON.stringify(r).slice(0, 200)}`).toBe(true);
    }
  }, 30_000);
  it("never sends answer keys, references or reviewer guidance to the browser", () => {
    for (const a of ASSESSMENTS) for (const i of a.items) {
      const v = publicItem(i) as Record<string, unknown>;
      for (const k of ["correct", "reference", "explain", "guidance", "revise"]) expect(v[k], `${i.id}.${k}`).toBeUndefined();
    }
  });
});

describe("the SQL sandbox", () => {
  it("refuses anything but a single read-only query", async () => {
    for (const q of ["DROP TABLE accounts", "DELETE FROM ledger_entries", "INSERT INTO accounts VALUES ('a','b','c')", "ATTACH DATABASE 'x.db' AS x", "PRAGMA writable_schema = 1"]) {
      expect((await runSql("recon", q)).ok, q).toBe(false);
    }
  }, 30_000);
  it("kills a runaway query", async () => {
    const r = await runSql("recon", "WITH RECURSIVE c(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM c) SELECT count(*) FROM c");
    expect(r).toMatchObject({ ok: false });
  }, 15_000);
  it("compares results by value, not by column name, and honours order when asked", () => {
    const want = { columns: ["a", "b"], rows: [[1, "x"], [2, "y"]] };
    expect(compareResults({ columns: ["p", "q"], rows: [[2.001, "y"], [1, "x"]] }, want, false).equal).toBe(true);
    expect(compareResults({ columns: ["p", "q"], rows: [[2, "y"], [1, "x"]] }, want, true).equal).toBe(false);
    expect(compareResults({ columns: ["a"], rows: [[1], [2]] }, want, false).equal).toBe(false);
  });
});

describe("grading", () => {
  const auto = ASSESSMENTS.find((a) => a.items.every(isAuto));
  it("needs an answer to every question before grading", () => {
    const a = getAssessment("sql-foundations") ?? ASSESSMENTS[0]!;
    const r = parseAttemptForm(a, new FormData());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).length).toBe(a.items.length);
  });
  it("cannot pass with a required item failed, whatever the total", () => {
    const a = ASSESSMENTS.find((x) => x.items.some((i) => i.required && isAuto(i)) && x.items.length > 2)!;
    const req = a.items.find((i) => i.required && isAuto(i))!;
    const answers = a.items.map((i) => ({ itemId: i.id, points: i.id === req.id ? 0 : i.points }));
    const s = summarise(a, answers);
    expect(s.failedRequired).toContain(req.id);
    expect(s.status).toBe("failed");
  });
  it("leaves a rubric item pending: nothing is scored automatically", async () => {
    const { a, fd } = perfectForm("python-engineering");
    const r = parseAttemptForm(a, fd);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const gr = await gradeAttempt(a, r.value);
    expect(gr.summary.status).toBe("awaiting_review");
    for (const i of a.items) if (!isAuto(i)) expect(gr.answers.find((x) => x.itemId === i.id)!.points).toBeNull();
  });
  it("names revision only for what lost points", () => {
    const a = getAssessment("python-engineering")!;
    const answers = a.items.map((i, n) => ({ itemId: i.id, points: n === 0 ? 0 : i.points }));
    expect(revisionFor(a, answers)).toEqual(a.items[0]!.revise.map((r) => `${a.topicId}:${r}`));
    expect(auto === undefined || Array.isArray(auto.items)).toBe(true);
  });
  it("bounds rubric scores", () => {
    const i = getAssessment("python-engineering")!.items.find((x) => !isAuto(x))!;
    if (isAuto(i)) throw new Error("expected a rubric item");
    const ok = Object.fromEntries(i.rubric.map((c) => [c.id, c.points]));
    expect(scoreRubric(i, ok)).toEqual({ ok: true, points: i.points });
    expect(scoreRubric(i, { ...ok, [i.rubric[0]!.id]: i.rubric[0]!.points + 1 }).ok).toBe(false);
    expect(scoreRubric(i, { ...ok, [i.rubric[0]!.id]: 0.3 }).ok).toBe(false);
    expect(scoreRubric(i, {}).ok).toBe(false);
  });
});

describe("the path to Demonstrated", () => {
  const id = "python-engineering";

  it("a lesson, an exercise and proficiency never make a topic Demonstrated", () => {
    const t = () => data.getPath().phases[0]!.topics.find((x) => x.id === id)!;
    for (const s of t().subtopics) data.setStep(s.id, "proficient", true, "https://github.com/me/work");
    expect(t().mastery).toBe("proficient");
    expect(t().demonstrated).toBe(false);
    expect(t().status).toBe("completed");
  });

  it("awaiting review does not count; a passing review does, and records evidence", async () => {
    const { fd } = perfectForm(id);
    const attempt = await submit(id, fd);
    const topic = () => data.getPath().phases[0]!.topics.find((x) => x.id === id)!;
    expect(data.getAttempt(attempt)!.attempt.status).toBe("awaiting_review");
    expect(topic().demonstrated).toBe(false);
    expect(data.assessmentStatuses().get(id)!.state).toBe("awaiting-review");
    expect(data.listEvidence({ topicIds: [id] }).map((e) => e.kind)).toContain("submission");

    review(attempt, id, fullMarks(id));
    expect(data.getAttempt(attempt)!.attempt).toMatchObject({ status: "passed", reviewer: "self" });
    expect(topic().demonstrated).toBe(true);
    expect(topic().mastery).toBe("demonstrated");
    const ev = data.listEvidence({ topicIds: [id] });
    expect(ev.find((e) => e.kind === "review")!.title).toBe("Self-reviewed");
    expect(ev.find((e) => e.kind === "score")!.demonstratedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.recentAchievements(4)[0]).toMatchObject({ kind: "demonstrated" });
  }, 20_000);

  it("a failing review stays failed, keeps history, and a retake can still pass", async () => {
    const a = getAssessment(id)!;
    const first = await submit(id, perfectForm(id).fd);
    const low = fullMarks(id, "A. Mentor");
    for (const i of a.items) if (!isAuto(i)) for (const c of i.rubric) low.set(`score:${i.id}:${c.id}`, "0");
    review(first, id, low);
    expect(data.getAttempt(first)!.attempt).toMatchObject({ status: "failed", reviewer: "A. Mentor" });
    expect(data.passedTopicIds().has(id)).toBe(false);

    const second = await submit(id, perfectForm(id).fd);
    review(second, id, fullMarks(id, "A. Mentor"));
    expect(data.listAttempts(id)).toHaveLength(2);
    expect(data.assessmentStatuses().get(id)).toMatchObject({ state: "passed", attempts: 2, bestPercent: 100 });
  }, 20_000);

  it("refuses a second review and an unnamed reviewer", async () => {
    const attempt = await submit(id, perfectForm(id).fd);
    const noName = fullMarks(id);
    noName.set("who", "other");
    expect(parseReviewForm(getAssessment(id)!, noName).ok).toBe(false);
    review(attempt, id, fullMarks(id));
    expect(() => review(attempt, id, fullMarks(id))).toThrow(/not awaiting review/);
  }, 20_000);

  it("a practical assessment waits for review, then passes the topic", async () => {
    const practical = ASSESSMENTS.find((a) => a.id.endsWith("-practical"))!;
    const attempt = await submit(practical.id, perfectForm(practical.id).fd);
    expect(data.getAttempt(attempt)!.attempt.status).toBe("awaiting_review");
    review(attempt, practical.id, fullMarks(practical.id));
    expect(data.passedTopicIds().has(practical.topicId)).toBe(true);
    const handIn = data.getAttempt(attempt)!.answers[0]!;
    expect(readHandIn(handIn.response)).toEqual({ text: "My answer.", url: "https://github.com/me/work" });
  }, 20_000);
});

describe("project evidence", () => {
  const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };
  const base = { kind: "project", title: "Loader v1", milestoneId: "m1", topicId: "python-engineering" };

  it("needs a link or a note, and only accepts http(s)", () => {
    expect(parseEvidenceForm(form(base)).ok).toBe(false);
    expect(parseEvidenceForm(form({ ...base, url: "javascript:alert(1)" })).ok).toBe(false);
    expect(parseEvidenceForm(form({ ...base, url: "https://github.com/me/x" })).ok).toBe(true);
    expect(parseEvidenceForm(form({ ...base, body: "Ran the suite locally." })).ok).toBe(true);
  });

  it("supports a topic but never makes it Demonstrated, and can be removed", () => {
    const m = data.getMilestones()[0]!;
    data.addEvidence({ kind: "project", title: "Loader v1", url: "https://github.com/me/x", body: "", milestoneId: m.id, topicId: "python-engineering", skillId: null });
    const ev = data.listEvidence({ milestoneId: m.id });
    expect(ev).toHaveLength(1);
    expect(data.passedTopicIds().size).toBe(0);
    data.deleteEvidence(ev[0]!.id);
    expect(data.listEvidence({ milestoneId: m.id })).toHaveLength(0);
  });

  it("protects assessment records from deletion", async () => {
    await submit("python-engineering", perfectForm("python-engineering").fd);
    const rec = data.listEvidence({ topicIds: ["python-engineering"] })[0]!;
    expect(() => data.deleteEvidence(rec.id)).toThrow(/assessment records/);
  }, 20_000);
});

describe("aggregation", () => {
  it("is honest about the lowest state", () => {
    expect(lowestMastery(["demonstrated", "learning"])).toBe("learning");
    expect(topicMastery([{ exposed: true, practised: true, proficient: true }], false)).toBe("proficient");
    expect(topicMastery([{ exposed: false, practised: false, proficient: false }], true)).toBe("demonstrated");
  });
});
