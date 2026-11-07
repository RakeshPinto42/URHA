import { describe, expect, it } from "vitest";
import {
  ARCHITECTURE_TRACK, CAREER_MILESTONES, CAREER_PROFILE, MILESTONES, PHASES, PROJECTS, SKILLS, STACK, slug,
} from "@/lib/curriculum";
import { DROPPED_SUBTOPICS, MOVED_SUBTOPICS } from "@/lib/curriculum-moves";
import { LEARNING_MAP, parseRef } from "@/lib/learning-map";
import { SUBTOPIC_PLANS } from "@/lib/catalog";
import { phaseLoads, type UnitMinutes } from "@/lib/study-load";
import old from "./fixtures/curriculum-v3.json";
import verified from "@/data/videos-verified.json";
import source from "@/lib/videos-source.json";

type Row = { status: string; id?: string; title?: string; channel?: string; durationSec: number; embeddable?: boolean; verifiedAt?: string };
const videos = (verified as unknown as { videos: Record<string, Row> }).videos;
const topics = PHASES.flatMap((p) => p.modules.flatMap((m) => m.topics.map((t) => ({ ...t, phaseId: p.id, moduleId: m.id }))));
const byId = new Map(topics.map((t) => [t.id, t]));
const entries = Object.entries(LEARNING_MAP).flatMap(([topic, es]) => es.map((e) => ({ topic, e })));

describe("PRD §4: the sequence", () => {
  it("has the six phases in the PRD's order, covering 24 months without gaps", () => {
    expect(PHASES.map((p) => p.title)).toEqual([
      "Programming, SQL and databases", "Data engineering and finance analytics", "Applied AI and RAG",
      "AI agents and evaluation", "Software engineering, integration and cloud", "Enterprise AI solutions architecture",
    ]);
    let next = 1;
    for (const p of PHASES) { expect(p.months[0]).toBe(next); next = p.months[1] + 1; }
    expect(next - 1).toBe(24);
  });

  it("gives every phase modules, and every module topics", () => {
    for (const p of PHASES) {
      expect(p.modules.length, p.id).toBeGreaterThan(0);
      for (const m of p.modules) expect(m.topics.length, m.id).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
    const mods = PHASES.flatMap((p) => p.modules.map((m) => m.id));
    expect(new Set(mods).size).toBe(mods.length);
    for (const t of topics) expect(new Set(t.subtopics.map(slug)).size, t.id).toBe(t.subtopics.length);
  });

  it("only ever requires a topic that comes earlier, so the order is always achievable", () => {
    const seen = new Set<string>();
    for (const t of topics) {
      for (const pre of t.prerequisites) expect(seen.has(pre), `${t.id} needs ${pre}`).toBe(true);
      seen.add(t.id);
    }
  });

  it("enforces the PRD's example chain through real prerequisites", () => {
    const reaches = (from: string, to: string): boolean => {
      const stack = [from], visited = new Set<string>();
      while (stack.length) {
        const id = stack.pop()!;
        if (id === to) return true;
        if (visited.has(id)) continue;
        visited.add(id);
        stack.push(...(byId.get(id)?.prerequisites ?? []));
      }
      return false;
    };
    const chain = ["python-foundations", "pandas-analysis", "data-pipelines", "llm-engineering", "rag-architecture", "agent-engineering", "reliable-agents", "reliability-engineering"];
    for (let i = 1; i < chain.length; i++) expect(reaches(chain[i]!, chain[i - 1]!), `${chain[i]} → ${chain[i - 1]}`).toBe(true);
  });

  it("gives each topic its reason, finance use, objective, assignment and subtopics", () => {
    for (const t of topics) {
      for (const k of ["why", "finance", "objective", "summary", "assignment"] as const) expect(t[k].length, `${t.id} ${k}`).toBeGreaterThan(20);
      expect(t.subtopics.length, t.id).toBeGreaterThan(0);
    }
  });

  it("gives each phase a deliverable and an exit gate", () => {
    for (const p of PHASES) { expect(p.deliverable.length, p.id).toBeGreaterThan(20); expect(p.exitGate.length, p.id).toBeGreaterThan(20); }
  });

  it("runs security, testing, Git, documentation and architecture through every phase", () => {
    for (const p of PHASES) for (const [k, v] of Object.entries(p.threads)) expect(v.length, `${p.id} ${k}`).toBeGreaterThan(10);
  });

  it("uses only known skills", () => {
    const known = new Set(SKILLS.map((s) => s.id));
    for (const t of topics) { expect(t.skills.length, t.id).toBeGreaterThan(0); for (const s of t.skills) expect(known.has(s), `${t.id}: ${s}`).toBe(true); }
  });

  it("links only to real milestones", () => {
    const known = new Set(MILESTONES.map((m) => m.id));
    for (const t of topics) if (t.milestone) expect(known.has(t.milestone), t.id).toBe(true);
    for (const m of MILESTONES) expect(topics.some((t) => t.milestone === m.id), m.id).toBe(true);
  });
});

describe("nothing was lost from the seven-phase curriculum", () => {
  const before = old as unknown as { topics: { id: string }[]; subtopics: { topic_id: string; title: string }[] };

  it("carries every one of the 258 old subtopics, or drops it for a stated reason", () => {
    expect(before.subtopics).toHaveLength(258);
    const moved = new Map(MOVED_SUBTOPICS.map(([from, to, title]) => [`${from}::${title}`, to]));
    const dropped = new Set(DROPPED_SUBTOPICS.map((d) => `${d.topic}::${d.subtopic}`));
    for (const s of before.subtopics) {
      const key = `${s.topic_id}::${s.title}`;
      if (dropped.has(key)) continue;
      expect(byId.get(moved.get(key) ?? s.topic_id)?.subtopics, key).toContain(s.title);
    }
    for (const d of DROPPED_SUBTOPICS) expect(d.reason.length).toBeGreaterThan(10);
  });

  it("keeps every old topic id, so its assessment follows it", () => {
    for (const t of before.topics) expect(byId.has(t.id), t.id).toBe(true);
  });
});

describe("PRD coverage", () => {
  const has = (e: { item: string; topic: string; subtopic: string }) => expect(byId.get(e.topic)?.subtopics, e.item).toContain(e.subtopic);

  it("teaches all 19 items of the §11 primary stack", () => {
    expect(STACK).toHaveLength(19);
    STACK.forEach(has);
  });

  it("covers all 20 items of §12", () => {
    expect(ARCHITECTURE_TRACK).toHaveLength(20);
    ARCHITECTURE_TRACK.forEach(has);
  });

  it("teaches no second cloud, agent framework or vector database (§11)", () => {
    expect(topics.flatMap((t) => t.subtopics).join(" | ")).not.toMatch(/\b(AWS|GCP|Google Cloud|CrewAI|AutoGen|Pinecone|Chroma|Qdrant|Weaviate|Langfuse)\b/);
  });

  it("places the five projects and links each to topics in its phases", () => {
    expect(PROJECTS.map((p) => p.id)).toEqual(["P1", "P2", "P3", "P4", "P5"]);
    for (const p of PROJECTS) {
      const linked = topics.filter((t) => t.project === p.id);
      expect(linked.length, p.id).toBeGreaterThan(0);
      for (const t of linked) expect(p.phases, `${t.id} in ${p.id}`).toContain(t.phaseId);
    }
  });

  it("orders the three career milestones through the phases, and each rests on project proof", () => {
    const ord = CAREER_MILESTONES.map((m) => PHASES.find((p) => p.id === m.afterPhase)!.order);
    expect(ord).toEqual([...ord].sort((a, b) => a - b));
    expect(ord.at(-1)).toBe(6);
    for (const m of CAREER_MILESTONES) expect(m.proof.length).toBeGreaterThan(0);
  });
});

describe("PRD §5: every unit has a video or a stated reason", () => {
  it("maps every subtopic to a plan", () => {
    for (const t of topics) for (const s of t.subtopics) expect(SUBTOPIC_PLANS.get(`${t.id}:${slug(s)}`), `${t.id}/${s}`).toBeDefined();
  });

  it("uses YouTube as the primary resource everywhere", () => {
    for (const { topic, e } of entries) if (e[1]) expect(e[1].startsWith("d-"), `${topic}/${e[0]}`).toBe(false);
  });

  it("never leaves a gap unexplained, and keeps gaps rare", () => {
    const gaps = entries.filter(({ e }) => e[1] === null);
    for (const { e } of gaps) expect(e[5]?.length, e[0]).toBeGreaterThan(15);
    for (const { e } of entries) if (e[1]) expect(e[5], e[0]).toBeUndefined();
    expect(gaps.length).toBeLessThanOrEqual(3);
  });

  it("uses only videos that passed the watch-page check", () => {
    for (const { e } of entries) for (const s of [e[1], e[2]]) {
      if (s && !s.startsWith("d-")) expect(videos[parseRef(s).key]?.status, s).toBe("verified");
    }
  });

  it("keeps every timestamp inside its video, in order", () => {
    for (const { e } of entries) for (const s of [e[1], e[2]]) {
      if (!s || s.startsWith("d-")) continue;
      const r = parseRef(s), v = videos[r.key]!;
      if (r.start !== null) expect(r.start, s).toBeLessThan(v.durationSec);
      if (r.end !== null) { expect(r.end, s).toBeLessThanOrEqual(v.durationSec); expect(r.end, s).toBeGreaterThan(r.start ?? 0); }
    }
  });

  it("uses an embeddable primary, so a lesson can always play in the workspace", () => {
    for (const { topic, e } of entries) if (e[1]) expect(videos[parseRef(e[1]).key]!.embeddable, `${topic}/${e[0]}`).toBe(true);
  });

  it("records the mandatory metadata for the videos that have it (§5)", () => {
    const withMeta = (source.videos as { key: string; why: string; difficulty?: string; objectives?: string[]; relevance?: string }[]).filter((v) => v.difficulty);
    expect(withMeta.length).toBeGreaterThan(100);
    for (const v of withMeta) {
      const row = videos[v.key]!;
      expect(row.id, v.key).toMatch(/^[\w-]{11}$/);
      expect(row.title && row.channel && row.durationSec > 0, v.key).toBeTruthy();
      expect(row.verifiedAt, v.key).toBeTruthy();
      expect(["beginner", "intermediate", "advanced"], v.key).toContain(v.difficulty);
      expect(v.objectives?.length, v.key).toBeGreaterThan(0);
      expect(v.why.length, v.key).toBeGreaterThan(15);
      expect(["chapters", "title"], v.key).toContain(v.relevance);
    }
  });
});

describe("PRD §9: study load", () => {
  const units = Object.fromEntries(Object.entries(LEARNING_MAP).map(([topic, es]) => [topic, es.map(([, primary, , , minutes]): UnitMinutes => {
    if (!primary) return { watch: null, practise: minutes };
    const r = parseRef(primary);
    return { watch: ((r.end ?? videos[r.key]!.durationSec) - (r.start ?? 0)) / 60, practise: minutes };
  })]));
  const loads = phaseLoads(PHASES, PROJECTS, units);

  it("stays inside the learner's stated hours in every phase", () => {
    for (const l of loads) expect(l.hoursPerWeek, l.title).toBeLessThanOrEqual(CAREER_PROFILE.weeklyHours.max);
  });

  it("does not leave a phase far under-filled", () => {
    for (const l of loads) expect(l.hoursPerWeek, l.title).toBeGreaterThanOrEqual(CAREER_PROFILE.weeklyHours.min - 2);
  });

  it("refuses to estimate a topic with no study time", () => {
    expect(() => phaseLoads(PHASES, PROJECTS, {})).toThrow(/No study time/);
  });
});
