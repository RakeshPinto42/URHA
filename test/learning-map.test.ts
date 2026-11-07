import { LEARNING_OUTCOMES } from "@/lib/learning-outcomes";
import { SUBTOPIC_PLANS } from "@/lib/catalog";
import { describe, expect, it } from "vitest";
import { PHASES } from "@/lib/curriculum";
import { LEARNING_MAP, parseRef } from "@/lib/learning-map";
import videosVerified from "@/data/videos-verified.json";
import docsVerified from "@/data/docs-verified.json";
import videosSource from "@/lib/videos-source.json";
import docsSource from "@/lib/docs-source.json";

const videos = videosVerified.videos as Record<string, { status: string; durationSec?: number }>;
const docs = docsVerified.docs as Record<string, { status: string }>;

describe("curated resource map (CINEMATIC_DIRECTION §6)", () => {
  it("gives every subtopic a learning outcome, in step with the map", () => {
    for (const [topic, entries] of Object.entries(LEARNING_MAP)) {
      expect(LEARNING_OUTCOMES[topic]?.length, topic).toBe(entries.length);
    }
    expect(Object.keys(LEARNING_OUTCOMES).sort()).toEqual(Object.keys(LEARNING_MAP).sort());
    for (const p of SUBTOPIC_PLANS.values()) expect(p.outcome.length).toBeGreaterThan(10);
  });
  it("flags dated resources from verified metadata, and only those", () => {
    const flagged = [...SUBTOPIC_PLANS.values()].flatMap((p) => [p.primary, p.supplement]).filter((r) => r?.caution);
    for (const r of flagged) expect(r!.published ?? "", r!.title).toMatch(/^20[12]\d/);
    for (const r of flagged) expect(Number(r!.published!.slice(0, 4))).toBeLessThan(2023);
    expect(flagged.length).toBeGreaterThan(0);
  });
  it("maps every subtopic of the curriculum exactly once, and nothing else", () => {
    for (const p of PHASES) for (const t of p.topics) {
      const entries = LEARNING_MAP[t.id];
      expect(entries, t.id).toBeDefined();
      expect(entries!.map((e) => e[0]).sort(), t.id).toEqual([...t.subtopics].sort());
    }
    expect(Object.keys(LEARNING_MAP).sort()).toEqual(PHASES.flatMap((p) => p.topics.map((t) => t.id)).sort());
  });

  it("only references verified videos and resolving docs, with timestamps inside the real duration", () => {
    for (const [topic, entries] of Object.entries(LEARNING_MAP)) {
      for (const [sub, primary, supplement, exercise, minutes] of entries) {
        expect(exercise.length, `${topic}/${sub}`).toBeGreaterThan(25);
        expect(minutes).toBeGreaterThan(0);
        for (const spec of [primary, supplement].filter(Boolean) as string[]) {
          const r = parseRef(spec);
          if (r.key.startsWith("d-")) {
            expect(docs[r.key]?.status, `${sub}: ${spec}`).toBe("resolves");
            expect(r.start).toBeNull();
          } else {
            const v = videos[r.key];
            expect(v?.status, `${sub}: ${spec}`).toBe("verified");
            if (r.start !== null) expect(r.start, spec).toBeLessThan(v!.durationSec!);
            if (r.end !== null) {
              expect(r.end, spec).toBeLessThanOrEqual(v!.durationSec!);
              expect(r.end, spec).toBeGreaterThan(r.start!);
            }
          }
        }
        if (primary) expect(primary).not.toBe(supplement);
      }
    }
  });

  it("every curated video and doc has verification data and a written reason", () => {
    for (const v of videosSource.videos) {
      expect(videos[v.key]?.status, v.key).toBe("verified");
      expect(v.why.length).toBeGreaterThan(20);
    }
    for (const d of docsSource.docs) expect(docs[d.key], d.key).toBeDefined();
  });

  it("is selective: no subtopic carries more than two resources", () => {
    for (const entries of Object.values(LEARNING_MAP)) for (const e of entries) expect([e[1], e[2]].filter(Boolean).length).toBeLessThanOrEqual(2);
  });
});
