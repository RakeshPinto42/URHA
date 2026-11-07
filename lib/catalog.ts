/**
 * Resolves curated subtopic resources (lib/learning-map.ts) into display models,
 * using only verified metadata (data/videos-verified.json, data/docs-verified.json).
 */
import videosVerified from "@/data/videos-verified.json";
import docsVerified from "@/data/docs-verified.json";
import videosSource from "@/lib/videos-source.json";
import docsSource from "@/lib/docs-source.json";
import { LEARNING_MAP, parseRef } from "./learning-map";
import { LEARNING_OUTCOMES } from "./learning-outcomes";
import { PHASES, slug } from "./curriculum";

type VerifiedVideo = { status: string; id: string; title?: string; channel?: string; durationSec?: number; published?: string | null; embeddable?: boolean | null; error?: string };
const VIDEOS = videosVerified.videos as Record<string, VerifiedVideo>;
const DOCS = docsVerified.docs as Record<string, { status: string; http: number | null; finalUrl: string | null }>;
const WHY = new Map(videosSource.videos.map((v) => [v.key, v.why]));
const DOC_META = new Map(docsSource.docs.map((d) => [d.key, d]));

export const VIDEOS_VERIFIED_AT = videosVerified.verifiedAt;
export const DOCS_CHECKED_AT = docsVerified.checkedAt;

export type CatalogResource = {
  kind: "video" | "docs";
  title: string;
  author: string;
  url: string;
  why: string | null;
  segment: string | null; // "14:48:37 – 14:55:40"
  minutes: number | null; // length of what to watch
  verified: boolean;
  verification: string; // human sentence
  published: string | null; // verified publish date, videos only
  /** Why to take care with this resource; null when there is nothing to flag. */
  caution: string | null;
};

/**
 * Suitability, judged from verified metadata rather than asserted by hand: the foundations
 * age slowly, but anything from Phase 2 onwards (APIs, LLMs, agents, cloud) moves fast.
 */
const STALE_BEFORE_YEAR = { foundations: 2019, fastMoving: 2023 } as const;
function cautionFor(published: string | null, phaseOrder: number): string | null {
  const year = published ? Number(published.slice(0, 4)) : null;
  if (!year) return null;
  const limit = phaseOrder <= 1 ? STALE_BEFORE_YEAR.foundations : STALE_BEFORE_YEAR.fastMoving;
  return year < limit ? `Published ${year}. Check its commands and APIs against the current documentation.` : null;
}

export function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function resolveResource(spec: string, phaseOrder = 1): CatalogResource | null {
  const r = parseRef(spec);
  if (r.key.startsWith("d-")) {
    const meta = DOC_META.get(r.key);
    const v = DOCS[r.key];
    if (!meta) return null;
    return {
      kind: "docs", title: meta.title, author: meta.author, url: meta.url, why: null, segment: null, minutes: null,
      verified: v?.status === "resolves",
      verification: v?.status === "resolves" ? `Link resolves (checked ${DOCS_CHECKED_AT.slice(0, 10)})` : "Link not verified",
      published: null, caution: v?.status === "resolves" ? null : "This link could not be verified.",
    };
  }
  const v = VIDEOS[r.key];
  if (!v || v.status !== "verified" || !v.durationSec) return null; // never show an unverified video as a resource
  const start = r.start ?? 0;
  const end = r.end ?? v.durationSec;
  return {
    kind: "video",
    title: v.title!, author: v.channel!,
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}${start ? `&t=${start}s` : ""}`,
    why: WHY.get(r.key) ?? null,
    segment: r.start !== null || r.end !== null ? `${fmtClock(start)} – ${fmtClock(end)}` : null,
    minutes: Math.max(1, Math.round((end - start) / 60)),
    verified: true,
    verification: `Title, channel and duration verified on YouTube (${VIDEOS_VERIFIED_AT.slice(0, 10)})`,
    published: v.published ?? null, caution: cautionFor(v.published ?? null, phaseOrder),
  };
}

export type SubtopicPlan = { pending: string | null; primary: CatalogResource | null; supplement: CatalogResource | null; exercise: string; exerciseMinutes: number; outcome: string };

const PHASE_OF = new Map(PHASES.flatMap((p) => p.topics.map((t) => [t.id, p.order] as const)));

/** Keyed by subtopic id "<topic>:<slug>". */
export const SUBTOPIC_PLANS: Map<string, SubtopicPlan> = new Map(
  Object.entries(LEARNING_MAP).flatMap(([topic, entries]) =>
    entries.map(([title, primary, supplement, exercise, minutes, pending], i) => {
      const phase = PHASE_OF.get(topic) ?? 1;
      return [
        `${topic}:${slug(title)}`,
        {
          pending: pending ?? null, primary: primary ? resolveResource(primary, phase) : null, supplement: supplement ? resolveResource(supplement, phase) : null,
          exercise, exerciseMinutes: minutes, outcome: LEARNING_OUTCOMES[topic]?.[i] ?? "",
        },
      ] as const;
    }),
  ),
);

/** The small part of a resource the roadmap shows: it travels to the browser 328 times. */
export type RoadmapLesson = Pick<CatalogResource, "kind" | "title" | "author" | "url" | "minutes" | "segment" | "caution">;
export type RoadmapPlan = { lesson: RoadmapLesson | null; alternative: RoadmapLesson | null; pending: string | null };

const lessonOf = ({ kind, title, author, url, minutes, segment, caution }: CatalogResource): RoadmapLesson =>
  ({ kind, title, author, url, minutes, segment, caution });

/** What the roadmap shows under a subtopic. Only verified resources reach SUBTOPIC_PLANS. */
export function roadmapPlan(subtopicId: string): RoadmapPlan {
  const p = SUBTOPIC_PLANS.get(subtopicId);
  return {
    lesson: p?.primary ? lessonOf(p.primary) : null,
    alternative: p?.supplement ? lessonOf(p.supplement) : null,
    pending: p ? p.pending : "No study plan is mapped to this subtopic yet.",
  };
}

export type Coverage = { subtopics: number; videoPrimary: number; docsPrimary: number; withSupplement: number; watchMinutes: number; practiceMinutes: number };

export function coverageFor(topicIds: string[]): Coverage {
  const c: Coverage = { subtopics: 0, videoPrimary: 0, docsPrimary: 0, withSupplement: 0, watchMinutes: 0, practiceMinutes: 0 };
  for (const t of topicIds) for (const [title] of LEARNING_MAP[t] ?? []) {
    const p = SUBTOPIC_PLANS.get(`${t}:${slug(title)}`);
    if (!p) continue;
    c.subtopics++;
    if (p.primary?.kind === "video") c.videoPrimary++;
    if (p.primary?.kind === "docs") c.docsPrimary++;
    if (p.supplement) c.withSupplement++;
    c.watchMinutes += (p.primary?.minutes ?? 0);
    c.practiceMinutes += p.exerciseMinutes;
  }
  return c;
}
