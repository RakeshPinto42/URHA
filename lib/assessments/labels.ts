import type { Difficulty, ReviewMode } from "./types";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { foundation: "Foundation", intermediate: "Intermediate", advanced: "Advanced" };
export const reviewerLabel = (reviewer: string) => (reviewer === "self" ? "Self-reviewed" : `Reviewed by ${reviewer}`);
export const percentOf = (points: number | null, max: number | null) => (points !== null && max ? Math.floor((points / max) * 100) : 0);

export const REVIEW_LABEL: Record<ReviewMode, string> = { auto: "scored automatically", mixed: "auto-scored and reviewed", human: "reviewed against a rubric" };
