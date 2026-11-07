import { describe, expect, it } from "vitest";
import {
  ARCHITECTURE_TRACK, BLUEPRINT, CAREER_MILESTONES, CAREER_PROFILE, DROPPED, LEDGERSYNC_MOVES, PROJECTS, STACK,
  allTopics, phaseLoads, subtopicsOf, type Measured,
} from "@/lib/blueprint";
import { MILESTONES, PHASES, SKILLS } from "@/lib/curriculum";
import { LEARNING_MAP, parseRef } from "@/lib/learning-map";
import videos from "@/data/videos-verified.json";

const current: Record<string, string[]> = Object.fromEntries(PHASES.flatMap((p) => p.topics.map((t) => [t.id, t.subtopics])));
const topics = allTopics();
const byId = new Map(topics.map((t) => [t.id, t]));

function measured(): Record<string, Record<string, Measured>> {
  const v = (videos as unknown as { videos: Record<string, { durationSec: number }> }).videos;
  return Object.fromEntries(Object.entries(LEARNING_MAP).map(([topic, entries]) => [topic, Object.fromEntries(entries.map(([title, primary, , , minutes]) => {
    const r = parseRef(primary);
    if (r.key.startsWith("d-")) return [title, { watch: null, practise: minutes }];
    const whole = v[r.key]!.durationSec;
    return [title, { watch: ((r.end ?? whole) - (r.start ?? 0)) / 60, practise: minutes }];
  }))]));
}

describe("PRD §4: the sequence", () => {
  it("has the six phases in the PRD's order, covering 24 months without gaps", () => {
    expect(BLUEPRINT.map((p) => p.title)).toEqual([
      "Programming, SQL and databases", "Data engineering and finance analytics", "Applied AI and RAG",
      "AI agents and evaluation", "Software engineering, integration and cloud", "Enterprise AI solutions architecture",
    ]);
    let next = 1;
    for (const p of BLUEPRINT) { expect(p.months[0]).toBe(next); next = p.months[1] + 1; }
    expect(next - 1).toBe(24);
  });

  it("gives every phase modules, and every module topics", () => {
    for (const p of BLUEPRINT) {
      expect(p.modules.length, p.id).toBeGreaterThan(0);
      for (const m of p.modules) expect(m.topics.length, m.id).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    expect(new Set(topics.map((t) => t.id)).size).toBe(topics.length);
    const mods = BLUEPRINT.flatMap((p) => p.modules.map((m) => m.id));
    expect(new Set(mods).size).toBe(mods.length);
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

  it("gives each topic a reason, a finance application and subtopics", () => {
    for (const t of topics) {
      expect(t.why.length, t.id).toBeGreaterThan(20);
      expect(t.finance.length, t.id).toBeGreaterThan(20);
      expect(subtopicsOf(t, current).length, t.id).toBeGreaterThan(0);
    }
  });

  it("runs security, testing, Git, documentation and architecture through every phase", () => {
    for (const p of BLUEPRINT) for (const [k, v] of Object.entries(p.threads)) expect(v.length, `${p.id} ${k}`).toBeGreaterThan(10);
  });

  it("uses only known skills, plus the two the new phase needs", () => {
    const known = new Set([...SKILLS.map((s) => s.id), "data", "analytics"]);
    for (const t of topics) { expect(t.skills.length, t.id).toBeGreaterThan(0); for (const s of t.skills) expect(known.has(s), `${t.id}: ${s}`).toBe(true); }
  });
});

describe("nothing is lost from the current curriculum", () => {
  it("carries every one of the 258 subtopics exactly once, or drops it for a stated reason", () => {
    const carried = new Map<string, number>();
    for (const t of topics) for (const c of t.carries) {
      for (const title of c.take === "all" ? current[c.from]! : c.take) {
        const key = `${c.from}::${title}`;
        carried.set(key, (carried.get(key) ?? 0) + 1);
      }
    }
    const dropped = new Set(DROPPED.map((d) => `${d.topic}::${d.subtopic}`));
    const everything = Object.entries(current).flatMap(([id, subs]) => subs.map((s) => `${id}::${s}`));
    expect(everything).toHaveLength(258);
    for (const key of everything) {
      if (dropped.has(key)) expect(carried.get(key) ?? 0, key).toBe(0);
      else expect(carried.get(key), key).toBe(1);
    }
    for (const key of carried.keys()) expect(everything.includes(key), `unknown subtopic ${key}`).toBe(true);
  });

  it("keeps every existing topic id, so its assessment can follow it", () => {
    for (const id of Object.keys(current)) expect(byId.has(id), id).toBe(true);
  });

  it("moves every LedgerSync milestone into a project", () => {
    expect(Object.keys(LEDGERSYNC_MOVES).sort()).toEqual(MILESTONES.map((m) => m.id).sort());
    for (const p of Object.values(LEDGERSYNC_MOVES)) expect(PROJECTS.some((x) => x.id === p)).toBe(true);
  });
});

describe("PRD coverage", () => {
  const has = (e: { item: string; topic: string; subtopic: string }) => {
    const t = byId.get(e.topic);
    expect(t, e.item).toBeDefined();
    expect(subtopicsOf(t!, current), e.item).toContain(e.subtopic);
  };

  it("teaches all 19 items of the §11 primary stack", () => {
    expect(STACK).toHaveLength(19);
    STACK.forEach(has);
  });

  it("covers all 20 items of §12", () => {
    expect(ARCHITECTURE_TRACK).toHaveLength(20);
    ARCHITECTURE_TRACK.forEach(has);
  });

  it("teaches no second cloud, agent framework or vector database (§11)", () => {
    const text = topics.flatMap((t) => subtopicsOf(t, current)).join(" | ");
    expect(text).not.toMatch(/\b(AWS|GCP|Google Cloud|CrewAI|AutoGen|Pinecone|Chroma|Qdrant|Weaviate)\b/);
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
    const ord = CAREER_MILESTONES.map((m) => BLUEPRINT.find((p) => p.id === m.afterPhase)!.ord);
    expect(ord).toEqual([...ord].sort((a, b) => a - b));
    expect(ord.at(-1)).toBe(6);
    for (const m of CAREER_MILESTONES) expect(m.proof.length).toBeGreaterThan(0);
  });
});

describe("PRD §9: study load", () => {
  const loads = phaseLoads(measured());

  it("stays inside the learner's stated hours in every phase", () => {
    for (const l of loads) {
      expect(l.hoursPerWeek, l.title).toBeLessThanOrEqual(CAREER_PROFILE.weeklyHours.max);
    }
  });

  it("does not leave a phase far under-filled", () => {
    for (const l of loads) expect(l.hoursPerWeek, l.title).toBeGreaterThanOrEqual(CAREER_PROFILE.weeklyHours.min - 2);
  });

  it("refuses to estimate a subtopic with no measured time", () => {
    expect(() => phaseLoads({})).toThrow(/No measured time/);
  });
});
