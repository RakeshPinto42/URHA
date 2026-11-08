"use client";
/**
 * The veil: the moment of light between two places. It covers the screen before a route changes
 * and lifts when the new place has drawn its first picture, so the world is never seen loading.
 * It takes no input, and if nothing lifts it, it lifts itself.
 */
import { useEffect, useRef, useSyncExternalStore } from "react";

type State = { shown: boolean; color: string };

let state: State = { shown: false, color: "#fff4dc" };
const listeners = new Set<() => void>();
let safety: ReturnType<typeof setTimeout> | undefined;

function set(next: State) {
  state = next;
  listeners.forEach((l) => l());
}

export const VEIL_MS = 420;

export function coverVeil(color: string) {
  clearTimeout(safety);
  set({ shown: true, color });
  // A page without a stage, or a failed one, must never leave the screen covered.
  safety = setTimeout(liftVeil, 3500);
}

export function liftVeil() {
  clearTimeout(safety);
  if (state.shown) set({ ...state, shown: false });
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const ROOM_LIGHT: Record<string, string> = { marble: "#fff4dc", midnight: "#0a0f33", garden: "#f4f8e6" };

export function Veil({ pathname, hasStage }: { pathname: string; hasStage: boolean }) {
  const v = useSyncExternalStore(subscribe, () => state, () => state);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    // A stage lifts the veil itself, on its first frame.
    if (hasStage) return;
    const t = setTimeout(liftVeil, 120);
    return () => clearTimeout(t);
  }, [pathname, hasStage]);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] transition-opacity ease-in-out motion-reduce:hidden"
      style={{ background: v.color, opacity: v.shown ? 1 : 0, transitionDuration: v.shown ? `${VEIL_MS}ms` : "900ms" }} />
  );
}
