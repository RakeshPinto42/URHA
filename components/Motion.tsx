"use client";
/**
 * Motion (DESIGN §10).
 * - Entrances and scroll reveals are CSS (globals.css): they need no script, so
 *   content is never left hidden if JavaScript fails, and reduced motion removes them.
 * - Framer Motion is used where motion carries meaning in interactive components:
 *   the Milestone Road fill, task completion, the evidence drawer and the player.
 *   MotionConfig reducedMotion="user" makes those transforms instant on request.
 */
import { MotionConfig } from "framer-motion";

export const EASE = [0.2, 0.8, 0.2, 1] as const;

export function Motion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Route entrance: opacity + 8px rise, 220ms. */
export function PageEnter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`page-enter ${className}`}>{children}</div>;
}

/** Section reveal as it scrolls into view (scroll-driven CSS where supported; static otherwise). */
export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}
