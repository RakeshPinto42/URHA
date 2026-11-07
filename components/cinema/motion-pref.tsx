"use client";
/**
 * "Pause animation": the pictures move for longer than five seconds, so people need a
 * way to stop them (WCAG 2.2.2). The choice is a per-browser convenience kept in
 * localStorage; if storage is blocked it lasts for the visit. The system's reduced-motion
 * setting always wins, which is why `useCinemaStill` is the one check the cinema makes.
 */
import { useEffect, useSyncExternalStore } from "react";
import { Icon } from "../Icon";

const KEY = "urha.motion";
const listeners = new Set<() => void>();
let paused: boolean | null = null;

function read(): boolean {
  if (paused !== null) return paused;
  try { paused = window.localStorage.getItem(KEY) === "paused"; } catch { paused = false; }
  return paused;
}

function write(next: boolean) {
  paused = next;
  try { window.localStorage.setItem(KEY, next ? "paused" : "playing"); } catch { /* kept in memory for this visit */ }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/* The server cannot know this setting, so it is read after hydration, not during it. */
const REDUCED = "(prefers-reduced-motion: reduce)";
const readReduced = () => window.matchMedia(REDUCED).matches;
function subscribeReduced(l: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", l);
  return () => mq.removeEventListener("change", l);
}

export const useMotionPaused = () => useSyncExternalStore(subscribe, read, () => false);

/** True when nothing should move: the person paused it, or the system asks for less motion. */
export function useCinemaStill(): boolean {
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, () => false);
  return useMotionPaused() || reduced;
}

export function MotionToggle({ className = "" }: { className?: string }) {
  const isPaused = useMotionPaused();
  useEffect(() => {
    if (isPaused) document.documentElement.dataset.motion = "paused";
    else delete document.documentElement.dataset.motion;
  }, [isPaused]);
  return (
    <button type="button" aria-pressed={isPaused} onClick={() => write(!isPaused)} className={className}>
      <Icon name={isPaused ? "play" : "pause"} size={14} />
      <span>Pause animation</span>
    </button>
  );
}
