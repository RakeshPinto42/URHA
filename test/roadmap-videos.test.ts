import { describe, expect, it } from "vitest";
import { roadmapPlan, SUBTOPIC_PLANS } from "@/lib/catalog";

const ids = [...SUBTOPIC_PLANS.keys()];

describe("videos on the roadmap", () => {
  it("gives every subtopic either a lesson or a stated reason", () => {
    expect(ids).toHaveLength(328);
    for (const id of ids) {
      const p = roadmapPlan(id);
      expect(p.lesson !== null || Boolean(p.pending), id).toBe(true);
    }
  });

  it("shows the 325 mapped videos, and only real watch links", () => {
    const videos = ids.map(roadmapPlan).flatMap((p) => (p.lesson?.kind === "video" ? [p.lesson] : []));
    expect(videos).toHaveLength(325);
    for (const v of videos) {
      expect(v.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}/);
      expect(v.minutes).toBeGreaterThan(0);
      expect(v.title && v.author).toBeTruthy();
    }
  });

  it("says so for a subtopic with no plan, rather than showing nothing", () => {
    expect(roadmapPlan("no-such:topic")).toEqual({ lesson: null, alternative: null, pending: expect.stringContaining("No study plan") });
  });
});
