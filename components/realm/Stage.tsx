"use client";
/**
 * Where a world appears on a page. The poster is shown first and stays if the world cannot run:
 * no WebGL, a slow machine, or a lost context. The page around it works the same in every case.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { StageApi, StageCanvasProps } from "./StageCanvas";
import { useCinemaStill } from "../cinema/motion-pref";
import { liftVeil } from "./veil";

const StageCanvas = dynamic(() => import("./StageCanvas"), { ssr: false });

type Props = Omit<StageCanvasProps, "still" | "active" | "onFirstFrame" | "onUnavailable"> & {
  /** Stop the loop: the host still draws single frames by moving the camera. */
  paused?: boolean;
  poster: string;
  /** What to say if the world is unavailable. Everything on the page still works. */
  label: string;
  className?: string;
};

function hasWebGL(): boolean {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function Stage({ poster, label, className = "absolute inset-0", paused = false, ...rest }: Props) {
  const still = useCinemaStill();
  const box = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => { setSupported(hasWebGL()); }, []);
  useEffect(() => {
    if (supported === false) liftVeil();
  }, [supported]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e?.isIntersecting ?? true), { threshold: 0.02 });
    io.observe(el);
    const tab = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", tab);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", tab); };
  }, []);

  const showWorld = supported === true && !failed;
  return (
    <div ref={box} role="img" aria-label={label} className={`${className} overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${drawn && showWorld ? "opacity-0" : "opacity-100"}`} />
      {showWorld && (
        <StageCanvas {...rest} still={still} active={onScreen && visible && !paused}
          onFirstFrame={() => { setDrawn(true); liftVeil(); }}
          onUnavailable={() => { setFailed(true); setDrawn(false); liftVeil(); }} />
      )}
    </div>
  );
}

export type { StageApi };
