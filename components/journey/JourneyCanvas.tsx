"use client";
/**
 * The journey on the cinema engine (docs/CINEMATIC_ENGINE_AUDIT.md).
 *
 * A view, not a control: every action here also exists as HTML beside it, and the canvas is
 * aria-hidden. Loaded only through Journey.tsx with next/dynamic, so three.js never reaches
 * other routes. React owns this component's props; the runtime owns everything per frame.
 */
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CinemaRuntime } from "@/lib/cinema-engine/runtime";
import { pickTier } from "@/lib/cinema-engine/quality";
import { parseScene, type CinemaScene } from "@/lib/cinema-engine/schema";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";
import { overviewShot, stationPosition, stationShot, walkerShot, type Shot } from "@/lib/journey/world";
import type { JourneyData } from "@/lib/journey/model";

export type CameraMode = { kind: "overview" } | { kind: "walker" } | { kind: "station"; index: number };

export type SceneProps = {
  data: JourneyData;
  mode: CameraMode;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reduced: boolean;
  active: boolean; // on screen and tab visible
  labels: React.RefObject<(HTMLElement | null)[]>;
  onUnavailable: (why: "lost" | "slow" | "scene") => void;
  sequence: number; // 0: no title sequence. Each increase plays the sunrise again.
};

const SCENE_URL = "/cinema/scenes/journey.json";
let sceneFile: Promise<CinemaScene> | null = null;

/** The scene file, fetched once and validated like any other outside input. */
function loadScene(): Promise<CinemaScene> {
  sceneFile ??= fetch(SCENE_URL).then(async (r) => {
    if (!r.ok) throw new Error(`${SCENE_URL}: HTTP ${r.status}`);
    const parsed = parseScene(await r.json());
    if (!parsed.ok) throw new Error(`${SCENE_URL}: ${parsed.errors.join("; ")}`);
    return parsed.scene;
  }).catch((e) => { sceneFile = null; throw e; });
  return sceneFile;
}

function shotFor(mode: CameraMode, data: JourneyData, aspect: number): Shot {
  if (mode.kind === "station") return stationShot(mode.index, aspect);
  if (mode.kind === "walker") return walkerShot(data.walkerT, data.currentIndex, aspect);
  return overviewShot(aspect);
}

/** The device's GPU name, where the browser shares it. */
function gpuName(canvas: HTMLCanvasElement): string | null {
  const gl = canvas.getContext("webgl2");
  if (!gl) return null;
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  return info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
}

export default function JourneyCanvas(props: SceneProps) {
  const { data, mode, selectedId, reduced, active, labels, onHover, onSelect, onUnavailable, sequence } = props;
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<CinemaRuntime | null>(null);
  const latest = useRef({ mode, data, sequence, onHover, onSelect, labels });
  latest.current = { mode, data, sequence, onHover, onSelect, labels };

  // A change in what the world shows rebuilds it; hover and selection only update it.
  const worldKey = useMemo(() => `${data.walkerT}|${data.stations.map((s) => s.state).join(",")}`, [data]);

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const canvas = document.createElement("canvas");
    canvas.className = "journey-canvas absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);

    const anchors = data.stations.map((_, i) => {
      const p = stationPosition(i);
      return new THREE.Vector3(p[0], p[1] + 13, p[2]);
    });
    const v = new THREE.Vector3();
    const projectLabels = (camera: THREE.PerspectiveCamera) => {
      const els = latest.current.labels.current;
      if (!els) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      anchors.forEach((a, i) => {
        const el = els[i];
        if (!el) return;
        v.copy(a).project(camera);
        const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
        el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = visible ? "1" : "0";
        el.style.visibility = visible ? "visible" : "hidden";
      });
    };

    let lastHover: string | null = null;
    const move = (e: PointerEvent) => {
      const id = runtime.current?.pick(e.clientX, e.clientY) ?? null;
      if (id === lastHover) return;
      lastHover = id;
      canvas.style.cursor = id ? "pointer" : "";
      latest.current.onHover(id);
    };
    const leave = () => { if (lastHover) { lastHover = null; latest.current.onHover(null); } };
    const click = (e: MouseEvent) => {
      const id = runtime.current?.pick(e.clientX, e.clientY);
      if (id) latest.current.onSelect(id);
    };

    loadScene().then((scene) => {
      if (cancelled) return;
      const override = new URLSearchParams(window.location.search).get("cinema");
      const tier = pickTier({ renderer: gpuName(document.createElement("canvas")), mobile: window.matchMedia("(max-width: 700px)").matches, override });
      const r = new CinemaRuntime({
        canvas, scene, generators: JOURNEY_GENERATORS, tier, still: reduced, data,
        onFrame: projectLabels,
        onTooSlow: () => onUnavailable("slow"),
        onContextLost: () => onUnavailable("lost"),
        watchFrames: override === null,
      });
      runtime.current = r;
      r.setState({ selectedId });
      r.fit();
      const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
      const goal = shotFor(latest.current.mode, latest.current.data, aspect);
      const opening = latest.current.sequence > 0 && !reduced;
      if (opening) {
        // The title sequence begins high over the valley and comes down to the walker.
        const o = overviewShot(aspect);
        r.shot({ position: [o.position[0], o.position[1] + 34, o.position[2] + 26], target: o.target }, { cut: true });
        r.shot(goal, { speed: 0.75 });
        r.play("sunrise");
      } else r.shot(goal, { cut: true });
      observer = new ResizeObserver(() => r.fit());
      observer.observe(canvas);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerleave", leave);
      canvas.addEventListener("click", click);
      // The ?cinema= test flag also exposes the runtime, so its tier and memory can be inspected.
      if (override !== null) (window as unknown as { __cinema?: CinemaRuntime }).__cinema = r;
    }).catch((e) => {
      console.warn("The 3D scene could not start.", e);
      if (!cancelled) onUnavailable("scene");
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
    // The world is rebuilt only when what it shows, or stillness, changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldKey, reduced]);

  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    const c = r.renderer.domElement;
    r.shot(shotFor(mode, data, c.clientWidth / Math.max(c.clientHeight, 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => { runtime.current?.setState({ selectedId }); }, [selectedId]);

  useEffect(() => {
    const r = runtime.current;
    if (!r) return;
    if (active) r.start(); else r.stop();
  }, [active]);

  // Replaying the sunrise, after the first time.
  const played = useRef(sequence);
  useEffect(() => {
    if (sequence === played.current) return;
    played.current = sequence;
    const r = runtime.current;
    if (!r || reduced) return;
    const c = r.renderer.domElement;
    const aspect = c.clientWidth / Math.max(c.clientHeight, 1);
    const o = overviewShot(aspect);
    r.shot({ position: [o.position[0], o.position[1] + 34, o.position[2] + 26], target: o.target }, { cut: true });
    r.shot(shotFor(latest.current.mode, latest.current.data, aspect), { speed: 0.75 });
    r.play("sunrise");
  }, [sequence, reduced]);

  return <div ref={host} className="absolute inset-0" />;
}
