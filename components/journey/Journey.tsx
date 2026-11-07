"use client";
/**
 * Journey: the wrapper around the 3D scene (docs/JOURNEY.md §5).
 *
 * - Decides whether 3D can run: WebGL available and the context not lost.
 *   Otherwise it renders `fallback` (the 2D Milestone Road) and nothing is lost but the picture.
 * - Loads three.js lazily (next/dynamic, ssr: false) so only Home and Path pay for it.
 * - Pauses rendering when the canvas is off-screen or the tab is hidden.
 * - The box carries the sky as a CSS gradient, so the scene never arrives over white.
 * - Still (reduced motion or paused): camera cuts, the world holds still (frameloop "demand").
 * - Station labels are HTML, positioned by the scene; they are mouse affordances only
 *   (aria-hidden, not focusable) because the station rail beside the scene is the
 *   accessible control.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { paneAt } from "@/lib/cinema";
import { useCinemaStill } from "../cinema/motion-pref";
import type { JourneyData } from "@/lib/journey/model";
import type { CameraMode } from "./JourneyCanvas";

const Scene = dynamic(() => import("./JourneyCanvas"), { ssr: false, loading: () => null });

let webgl: boolean | null = null; // probed once: every probe creates a GL context
function detectWebGL(): boolean {
  if (webgl !== null) return webgl;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    webgl = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl = false;
  }
  return webgl;
}
const subscribeNothing = () => () => {};
const useWebGL = () => useSyncExternalStore(subscribeNothing, detectWebGL, () => true);

const NOTICE = {
  lost: "The 3D view stopped because the graphics context was lost.",
  slow: "The 3D view was switched off because this device could not run it smoothly.",
  scene: "The 3D scene could not be loaded.",
};

export type JourneyProps = {
  data: JourneyData;
  mode: CameraMode;
  selectedId?: string | null;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  fallback: React.ReactNode;
  className?: string;
  showLabels?: boolean;
  sequence?: number; // Home's title sequence: each increase plays the sunrise.
};

export function Journey({ data, mode, selectedId = null, hoveredId = null, onHover, onSelect, fallback, className = "", showLabels = true, sequence = 0 }: JourneyProps) {
  const supported = useWebGL();
  const [unavailable, setUnavailable] = useState<"lost" | "slow" | "scene" | null>(null);
  const reduced = useCinemaStill();
  const box = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [localHover, setLocalHover] = useState<string | null>(null);
  const hover = onHover ? hoveredId : localHover;
  const setHover = onHover ?? setLocalHover;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // Never leave a pointer cursor behind when the scene unmounts.
  useEffect(() => () => { document.body.style.cursor = ""; }, []);

  if (!supported || unavailable) {
    return (
      <div className={className}>
        {fallback}
        {unavailable && <p className="mt-2 text-[12px] text-muted">{NOTICE[unavailable]} The road above shows the same progress.</p>}
      </div>
    );
  }

  return (
    <div ref={box} className={`journey relative overflow-hidden bg-[linear-gradient(180deg,#1e3fae_0%,#f0407e_40%,#ff7a3c_56%,#0c9c62_100%)] ${className}`}>
      <Scene
        data={data} mode={mode} selectedId={selectedId}
        onHover={setHover} onSelect={(id) => onSelect?.(id)}
        reduced={reduced} active={onScreen && tabVisible}
        labels={labels} onUnavailable={setUnavailable} sequence={sequence}
      />
      {showLabels && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {data.stations.map((s, i) => {
            const on = s.id === selectedId || s.id === hover;
            // From the walker's low viewpoint the far stations bunch together: name only the next two.
            const next = data.currentIndex ?? 6;
            if (mode.kind === "walker" && !on && (i < next || i > next + 1)) return null;
            // Close on one station, the others would only be clipped at the frame's edge.
            if (mode.kind === "station" && !on) return null;
            return (
              <span key={s.id}
                ref={(el) => { labels.current[i] = el; }}
                onPointerEnter={() => setHover(s.id)} onPointerLeave={() => setHover(null)}
                onClick={() => onSelect?.(s.id)}
                className={`journey-label pointer-events-auto absolute left-0 top-0 cursor-pointer select-none whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] leading-none opacity-0 transition-colors ${
                  on ? "bg-[#1f201d] text-white" : s.state === "current" ? "bg-white text-[#1f201d] ring-1 ring-[#1f201d]" : "bg-white/90 text-[#1f201d]"}`}>
                <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: paneAt(i).bright }} />
                <span className="num">{s.ord}</span> · {s.landmark}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
