import { describe, expect, it } from "vitest";
import { allTopics, phaseLoads, type Measured } from "@/lib/blueprint";
import { CAREER_PROFILE } from "@/lib/blueprint";
import { PHASES } from "@/lib/curriculum";
import { LEARNING_MAP, parseRef } from "@/lib/learning-map";
import { UNIT_VIDEOS } from "@/lib/unit-videos";
import verified from "@/data/videos-verified.json";
import source from "@/lib/videos-source.json";

type Row = { status: string; id?: string; title?: string; channel?: string; durationSec: number; published?: string; embeddable?: boolean; verifiedAt?: string };
const videos = (verified as unknown as { videos: Record<string, Row> }).videos;
const current: Record<string, string[]> = Object.fromEntries(PHASES.flatMap((p) => p.topics.map((t) => [t.id, t.subtopics])));
const primary = new Map(Object.entries(LEARNING_MAP).flatMap(([id, es]) => es.map(([title, p]) => [`${id}::${title}`, p])));

/** Blueprint units with no video primary in the current map: what Stage 2 had to cover. */
function needed(): string[] {
  return allTopics().flatMap((t) => [
    ...t.carries.flatMap((c) => (c.take === "all" ? current[c.from]! : c.take).filter((s) => primary.get(`${c.from}::${s}`)?.startsWith("d-")).map((s) => `${t.id}::${s}`)),
    ...t.adds.map((s) => `${t.id}::${s}`),
  ]);
}
const units = Object.entries(UNIT_VIDEOS).flatMap(([topic, subs]) => Object.entries(subs).map(([title, u]) => ({ key: `${topic}::${title}`, u })));
const specs = units.flatMap(({ u }) => [u.primary, u.alternative].filter((s): s is string => !!s));

describe("PRD §5: every unit has a video or a stated reason", () => {
  it("covers exactly the units that needed a video", () => {
    expect(units.map((x) => x.key).sort()).toEqual(needed().sort());
  });

  it("never leaves a gap unexplained", () => {
    for (const { key, u } of units) {
      if (u.primary === null) expect(u.pending.length, key).toBeGreaterThan(15);
    }
  });

  it("uses only videos that passed the watch-page check", () => {
    for (const s of specs) expect(videos[parseRef(s).key]?.status, s).toBe("verified");
  });

  it("keeps every timestamp inside its video, in order", () => {
    for (const s of specs) {
      const r = parseRef(s), v = videos[r.key]!;
      if (r.start !== null) expect(r.start, s).toBeLessThan(v.durationSec);
      if (r.end !== null) { expect(r.end, s).toBeLessThanOrEqual(v.durationSec); expect(r.end, s).toBeGreaterThan(r.start ?? 0); }
    }
  });

  it("uses an embeddable primary, so a lesson can always play in the workspace", () => {
    for (const { key, u } of units) if (u.primary) expect(videos[parseRef(u.primary).key]!.embeddable, key).toBe(true);
  });

  it("records the mandatory metadata for every video added in Stage 2 (§5)", () => {
    const stage2 = (source.videos as { key: string; id: string; why: string; difficulty?: string; objectives?: string[]; relevance?: string }[]).filter((v) => v.difficulty);
    expect(stage2.length).toBeGreaterThan(50);
    for (const v of stage2) {
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

  it("states honestly that Pending units are a minority, and counts them", () => {
    const open = units.filter((x) => x.u.primary === null).length;
    expect(open).toBeLessThan(units.length / 2);
    expect(units.length).toBe(134);
  });
});

describe("PRD §9: the load with real durations", () => {
  const measured = Object.fromEntries(Object.entries(LEARNING_MAP).map(([topic, entries]) => [topic, Object.fromEntries(entries.map(([title, p, , , minutes]) => {
    const r = parseRef(p);
    if (r.key.startsWith("d-")) return [title, { watch: null, practise: minutes }];
    const whole = videos[r.key]!.durationSec;
    return [title, { watch: ((r.end ?? whole) - (r.start ?? 0)) / 60, practise: minutes }];
  }))])) as Record<string, Record<string, Measured>>;
  const actual = Object.fromEntries(units.filter((x) => x.u.primary).map(({ key, u }) => {
    const r = parseRef(u.primary!);
    return [key, ((r.end ?? videos[r.key]!.durationSec) - (r.start ?? 0)) / 60];
  }));

  it("stays within the weekly hours once real video lengths replace the estimates", () => {
    for (const l of phaseLoads(measured, undefined, actual)) expect(l.hoursPerWeek, l.title).toBeLessThanOrEqual(CAREER_PROFILE.weeklyHours.max);
  });
});
