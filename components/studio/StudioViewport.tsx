"use client";
/**
 * The Studio's live view: the same runtime the app uses, plus orbit and walking cameras and
 * a move, rotate and scale tool. The scene comes in as a prop and the runtime syncs to it;
 * edits made here go back out as callbacks, so there is one source of truth.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { viewShot, walkStep, CAMERA_VIEWS, type CameraView } from "@/lib/cinema-engine/camera-views";
import type { TierId } from "@/lib/cinema-engine/quality";
import { CinemaRuntime } from "@/lib/cinema-engine/runtime";
import { loadTexture, modelSource } from "@/lib/cinema-engine/model-loader";
import type { CinemaScene, Placement, Vec3 } from "@/lib/cinema-engine/schema";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";
import { STATION_AT } from "@/lib/journey/world";
import { LANDMARK, type JourneyData } from "@/lib/journey/model";

export type GizmoMode = "translate" | "rotate" | "scale";
export type ViewportHandle = {
  scrub: (p: number) => void;
  play: (timeline: string) => void;
  currentView: () => { position: Vec3; target: Vec3 };
};

/** Stations for the journey's generators, so that world can be edited without real progress. */
const SAMPLE: JourneyData = {
  currentIndex: 1, fraction: 0.4, walkerT: 0.2,
  stations: STATION_AT.map((_, i) => ({
    id: `p${i + 1}`, ord: i + 1, title: `Phase ${i + 1}`, short: `Phase ${i + 1}`, landmark: LANDMARK[`p${i + 1}`] ?? "", months: [1, 2],
    state: i === 0 ? "passed" : i === 1 ? "current" : "ahead", practised: 0, total: 1,
  })),
};

const round = (v: THREE.Vector3 | THREE.Euler): Vec3 => [v.x, v.y, v.z].map((n) => Number(n.toFixed(3))) as Vec3;
const KEYS: Record<string, [keyof Walk, number]> = {
  KeyW: ["forward", 1], KeyS: ["forward", -1], KeyA: ["right", -1], KeyD: ["right", 1], KeyE: ["up", 1], KeyQ: ["up", -1],
  ArrowUp: ["forward", 1], ArrowDown: ["forward", -1], ArrowLeft: ["right", -1], ArrowRight: ["right", 1],
};
type Walk = { forward: number; right: number; up: number };

type Props = {
  scene: CinemaScene;
  /** A new value starts a fresh runtime: another scene file, or another tier. */
  session: string;
  tier: TierId;
  selectedId: string | null;
  gizmo: GizmoMode;
  view: CameraView;
  onSelect: (id: string | null) => void;
  onPlace: (id: string, placement: Placement) => void;
  onFailure: (message: string) => void;
  onAssetError: (src: string, why: string) => void;
};

export const StudioViewport = forwardRef<ViewportHandle, Props>(function StudioViewport(
  { scene, session, tier, selectedId, gizmo, view, onSelect, onPlace, onFailure, onAssetError }, ref,
) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef<{ runtime: CinemaRuntime; orbit: OrbitControls; gizmo: TransformControls } | null>(null);
  const latest = useRef({ scene, selectedId, view, onSelect, onPlace, onFailure, onAssetError });
  latest.current = { scene, selectedId, view, onSelect, onPlace, onFailure, onAssetError };
  const [ready, setReady] = useState(0);

  useImperativeHandle(ref, () => ({
    scrub: (p) => live.current?.runtime.setProgress(p),
    play: (t) => live.current?.runtime.play(t),
    currentView: () => {
      const l = live.current;
      return l ? { position: round(l.runtime.camera.position), target: round(l.orbit.target) } : { position: [0, 20, 60], target: [0, 0, 0] };
    },
  }));

  useEffect(() => {
    const box = host.current;
    if (!box) return;
    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-label", "Scene preview. Use the panels to edit with a keyboard.");
    box.appendChild(canvas);

    const walk: Walk = { forward: 0, right: 0, up: 0 };
    let yaw = 0, pitch = 0, last = performance.now();
    let looking: { x: number; y: number; yaw: number; pitch: number } | null = null;
    const moved = { pending: false };

    let runtime: CinemaRuntime;
    const orbitRef: { current: OrbitControls | null } = { current: null };
    try {
      runtime = new CinemaRuntime({
        canvas, scene: latest.current.scene, generators: JOURNEY_GENERATORS, tier, still: false, data: SAMPLE,
        freeCamera: true, watchFrames: false, assets: { models: modelSource, loadTexture },
        onAssetError: (src, why) => latest.current.onAssetError(src, why),
        onFrame: (camera) => {
          const now = performance.now();
          const dt = Math.min((now - last) / 1000, 0.1);
          last = now;
          const o = orbitRef.current;
          if (!o) return;
          const mode = latest.current.view;
          const orbits = CAMERA_VIEWS.find((v) => v.id === mode)?.orbits;
          if (orbits) { o.update(); runtime.focus(o.target); return; }
          const speed = latest.current.scene.camera.speed ?? 16;
          const id = latest.current.selectedId;
          if (mode === "third-person" && id) {
            // Keys drive the selected object, and the camera follows behind it.
            const holder = runtime.holder(id);
            if (!holder) return;
            const before = holder.position.clone();
            holder.position.set(...walkStep(holder.position.toArray() as Vec3, 0, walk, speed, dt));
            if (walk.forward || walk.right || walk.up) moved.pending = true;
            camera.position.add(holder.position.clone().sub(before));
            o.target.copy(holder.position);
            camera.lookAt(holder.position);
          } else {
            camera.position.set(...walkStep(camera.position.toArray() as Vec3, yaw, walk, speed, dt));
            camera.rotation.set(pitch, yaw, 0, "YXZ");
            o.target.copy(camera.position).add(new THREE.Vector3(0, 0, -20).applyEuler(camera.rotation));
          }
          camera.updateMatrixWorld();
          runtime.focus(o.target);
        },
      });
    } catch (e) {
      canvas.remove();
      latest.current.onFailure(e instanceof Error ? e.message : "The 3D view could not start.");
      return;
    }

    const orbit = new OrbitControls(runtime.camera, canvas);
    orbit.enableDamping = true;
    orbitRef.current = orbit;
    const c = latest.current.scene.camera;
    const start = viewShot("orbit", [0, 10, -20], 110);
    runtime.camera.position.set(...(c.position ?? start.position));
    orbit.target.set(...(c.target ?? start.target));
    orbit.update();

    const tool = new TransformControls(runtime.camera, canvas);
    const helper = tool.getHelper();
    runtime.addHelper(helper);
    tool.addEventListener("dragging-changed", (e) => {
      orbit.enabled = !e.value;
      if (e.value || !tool.object) return;
      const o = tool.object;
      latest.current.onPlace(o.name, { position: round(o.position), rotation: round(o.rotation), scale: round(o.scale) });
    });

    live.current = { runtime, orbit, gizmo: tool };
    (window as unknown as { __cinema?: CinemaRuntime }).__cinema = runtime;
    runtime.fit();
    const observer = new ResizeObserver(() => runtime.fit());
    observer.observe(canvas);

    let downAt: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      downAt = { x: e.clientX, y: e.clientY };
      if (latest.current.view === "first-person") looking = { x: e.clientX, y: e.clientY, yaw, pitch };
    };
    const drag = (e: PointerEvent) => {
      if (!looking) return;
      yaw = looking.yaw - (e.clientX - looking.x) * 0.004;
      pitch = Math.min(Math.max(looking.pitch - (e.clientY - looking.y) * 0.004, -1.4), 1.4);
    };
    const up = (e: PointerEvent) => {
      looking = null;
      const clicked = downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 5;
      downAt = null;
      if (clicked && !tool.dragging && !tool.axis) latest.current.onSelect(runtime.pickObject(e.clientX, e.clientY));
    };
    const typing = (e: KeyboardEvent) => (e.target as HTMLElement).matches?.("input, textarea, select");
    const keydown = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (!k || typing(e) || CAMERA_VIEWS.find((v) => v.id === latest.current.view)?.orbits) return;
      walk[k[0]] = k[1];
      e.preventDefault();
    };
    const keyup = (e: KeyboardEvent) => {
      const k = KEYS[e.code];
      if (!k) return;
      walk[k[0]] = 0;
      if (moved.pending && !walk.forward && !walk.right && !walk.up) {
        moved.pending = false;
        const id = latest.current.selectedId;
        const h = id ? runtime.holder(id) : null;
        if (h) latest.current.onPlace(h.name, { position: round(h.position), rotation: round(h.rotation), scale: round(h.scale) });
      }
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", drag);
    canvas.addEventListener("pointerup", up);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    setReady((n) => n + 1);

    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", drag);
      canvas.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      observer.disconnect();
      tool.detach();
      runtime.removeHelper(helper);
      tool.dispose();
      orbit.dispose();
      runtime.dispose();
      live.current = null;
      canvas.remove();
    };
  }, [session, tier]);

  useEffect(() => { live.current?.runtime.sync(scene); }, [scene]);

  useEffect(() => {
    const l = live.current;
    if (!l) return;
    const o = selectedId ? l.runtime.holder(selectedId) : null;
    if (o) l.gizmo.attach(o); else l.gizmo.detach();
  }, [selectedId, scene, ready]);

  useEffect(() => { live.current?.gizmo.setMode(gizmo); }, [gizmo, ready]);

  useEffect(() => {
    const l = live.current;
    if (!l) return;
    const walking = !CAMERA_VIEWS.find((v) => v.id === view)?.orbits;
    l.orbit.enabled = !walking;
    l.gizmo.enabled = !walking;
    const h = selectedId ? l.runtime.holder(selectedId) : null;
    const focus = (h ? h.position.toArray() : l.orbit.target.toArray()) as Vec3;
    const s = viewShot(view, focus, h ? 40 : Math.max(l.runtime.camera.position.distanceTo(l.orbit.target), 40));
    l.runtime.camera.position.set(...s.position);
    l.orbit.target.set(...s.target);
    l.runtime.camera.fov = s.fov ?? latest.current.scene.camera.fov;
    l.runtime.camera.updateProjectionMatrix();
    l.runtime.camera.lookAt(l.orbit.target);
    l.runtime.setFogScale(s.fogScale);
    // The camera mode is a way of viewing, so it is not an edit to the scene.
  }, [view, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="absolute inset-0" />;
});
