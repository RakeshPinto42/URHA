"use client";
/**
 * A realm scene on the cinema engine. A view, not a control: every action here also exists as
 * HTML beside it, and the canvas is aria-hidden. Loaded only through Stage.tsx with next/dynamic,
 * so three.js never reaches a page that does not show a world.
 */
import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { CinemaRuntime, type Shot } from "@/lib/cinema-engine/runtime";
import { loadTexture, modelSource } from "@/lib/cinema-engine/model-loader";
import { pickTier } from "@/lib/cinema-engine/quality";
import { parseScene, type CinemaScene } from "@/lib/cinema-engine/schema";
import { REALM_GENERATORS } from "@/lib/realm/generators";

const scenes = new Map<string, Promise<CinemaScene>>();

/** A scene file, fetched once and validated like any other outside input. */
function loadScene(id: string): Promise<CinemaScene> {
  const held = scenes.get(id);
  if (held) return held;
  const url = `/cinema/scenes/${id}.json`;
  const made = fetch(url).then(async (r) => {
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    const parsed = parseScene(await r.json());
    if (!parsed.ok) throw new Error(`${url}: ${parsed.errors.join("; ")}`);
    return parsed.scene;
  }).catch((e) => { scenes.delete(id); throw e; });
  scenes.set(id, made);
  return made;
}

function gpuName(): string | null {
  const gl = document.createElement("canvas").getContext("webgl2");
  if (!gl) return null;
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
}

export type StageApi = {
  runtime: CinemaRuntime;
  scene: CinemaScene;
  aspect: () => number;
};

export type StageCanvasProps = {
  sceneId: string;
  data?: unknown;
  still: boolean;
  active: boolean;
  /** The first shot. The scene's own camera is used without one. */
  opening: (api: StageApi) => void;
  onFrame?: (camera: THREE.PerspectiveCamera, size: { w: number; h: number }) => void;
  onReady: (api: StageApi) => void;
  onFirstFrame: () => void;
  onUnavailable: (why: "lost" | "slow" | "scene") => void;
  onHover?: (id: string | null) => void;
  onPick?: (id: string) => void;
};

export default function StageCanvas(props: StageCanvasProps) {
  const { sceneId, still, active } = props;
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<CinemaRuntime | null>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);

    let last: string | null = null;
    const move = (e: PointerEvent) => {
      const id = runtime.current?.pick(e.clientX, e.clientY) ?? null;
      if (id === last) return;
      last = id;
      canvas.style.cursor = id ? "pointer" : "";
      latest.current.onHover?.(id);
    };
    const leave = () => { if (last) { last = null; latest.current.onHover?.(null); } };
    const click = (e: MouseEvent) => {
      const id = runtime.current?.pick(e.clientX, e.clientY);
      if (id) latest.current.onPick?.(id);
    };

    loadScene(sceneId).then((scene) => {
      if (cancelled) return;
      const override = new URLSearchParams(window.location.search).get("cinema");
      const tier = pickTier({ renderer: gpuName(), mobile: window.matchMedia("(max-width: 700px)").matches, override });
      const r = new CinemaRuntime({
        canvas, scene, generators: REALM_GENERATORS, tier, still, data: latest.current.data,
        onFrame: (camera) => latest.current.onFrame?.(camera, { w: canvas.clientWidth, h: canvas.clientHeight }),
        onFirstFrame: () => latest.current.onFirstFrame(),
        onTooSlow: () => latest.current.onUnavailable("slow"),
        onContextLost: () => latest.current.onUnavailable("lost"),
        watchFrames: override === null,
        assets: { models: modelSource, loadTexture },
        // A decorative part failing is not worth losing the world for: it is reported and skipped.
        onAssetError: (src, why) => console.warn(`The 3D asset ${src} could not load: ${why}`),
      });
      runtime.current = r;
      r.fit();
      const api: StageApi = { runtime: r, scene, aspect: () => canvas.clientWidth / Math.max(canvas.clientHeight, 1) };
      latest.current.opening(api);
      latest.current.onReady(api);
      if (still) r.invalidate();
      observer = new ResizeObserver(() => r.fit());
      observer.observe(canvas);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerleave", leave);
      canvas.addEventListener("click", click);
      // The ?cinema= test flag also exposes the runtime, so its tier and memory can be inspected.
      // Exposed for local diagnostics: tier, render scale and memory are read from here in tests.
      (window as unknown as { __cinema?: CinemaRuntime }).__cinema = r;
    }).catch((e) => {
      console.warn("The 3D scene could not start.", e);
      if (!cancelled) latest.current.onUnavailable("scene");
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("click", click);
      runtime.current?.dispose();
      runtime.current = null;
      canvas.remove();
    };
    // A world is rebuilt only when it is a different world, or stillness changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, still]);

  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    if (active) r.start(); else r.stop();
  }, [active]);

  return <div ref={host} className="absolute inset-0" />;
}

export type { Shot };
