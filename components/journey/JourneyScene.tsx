"use client";
/**
 * The Way to the Summit — the 3D journey (docs/JOURNEY.md §4–5).
 *
 * A view, not a control: every action here also exists as HTML beside it, and the
 * canvas is aria-hidden. Loaded only through components/journey/Journey.tsx with
 * next/dynamic (ssr: false), so three.js never reaches other routes.
 *
 * Budget: procedural geometry only (no textures to download), no shadow maps, no
 * post-processing, DPR clamped to 1.5, fog hides the far plane. Still (reduced motion or
 * paused): the frameloop is "demand", the camera cuts and the world holds at full dawn.
 *
 * Home opens on a title sequence (docs/DESIGN.md §13): night to sunrise as the camera
 * comes down to the walker. One number drives it, `dawn` (0 night, 1 risen). The colours
 * are the glass of lib/cinema.ts: each phase owns a hue on the path and on its beacon.
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  heightAt, pathPoint, stationPosition, stationT, STATION_AT, treeSites, LAKE, fbm,
  overviewShot, walkerShot, stationShot, type Shot, type Vec3,
} from "@/lib/journey/world";
import type { JourneyData } from "@/lib/journey/model";
import { paneAt } from "@/lib/cinema";

export type CameraMode = { kind: "overview" } | { kind: "walker" } | { kind: "station"; index: number };

export type SceneProps = {
  data: JourneyData;
  mode: CameraMode;
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reduced: boolean;
  active: boolean; // on screen and tab visible
  lite: boolean;   // small screens: lighter geometry
  labels: React.RefObject<(HTMLElement | null)[]>;
  onContextLost: () => void;
  sequence: number; // 0: no title sequence. Each increase plays the sunrise again.
};
type DawnRef = React.RefObject<number>;

/* Full dawn: tangerine fog over emerald land, cobalt overhead, the far ridges magenta and blue. */
const FOG = { color: "#ff9a6b", near: 130, far: 470 };
const NIGHT_FOG = "#101a4f";
const SKY_HORIZON = "#ffd23f";
const SKY_LOW = "#ff7a3c";
const SKY_MID = "#f0407e";
const SKY_ZENITH = "#1e3fae";
const SUNRISE_SECONDS = 7;
const sunDir = (rise: number) => new THREE.Vector3(0.42, -0.1 + rise * 0.36, -1).normalize();
const easeDawn = (t: number) => t * t * (3 - 2 * t);

export default function JourneyScene(props: SceneProps) {
  const { reduced, active, onContextLost } = props;
  return (
    <Canvas
      className="journey-canvas"
      flat
      dpr={[1, props.lite ? 1.25 : 1.5]}
      frameloop={active && !reduced ? "always" : "demand"}
      gl={{ antialias: !props.lite, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 46, near: 0.5, far: 800, position: [4, 58, 116] }}
      onCreated={({ gl, scene }) => {
        scene.fog = new THREE.Fog(props.sequence > 0 && !reduced ? NIGHT_FOG : FOG.color, FOG.near, FOG.far);
        scene.background = new THREE.Color(FOG.color);
        gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onContextLost(); }, { once: true });
      }}
      aria-hidden="true"
    >
      <World {...props} />
    </Canvas>
  );
}

/* ================================================================ world */

function World({ data, mode, onHover, onSelect, reduced, lite, labels, sequence, selectedId }: SceneProps) {
  const dawn = useRef(sequence > 0 && !reduced ? 0 : 1);
  return (
    <>
      <Daybreak dawn={dawn} sequence={sequence} reduced={reduced} />
      <Sky dawn={dawn} reduced={reduced} />
      <Terrain lite={lite} />
      <Ridges dawn={dawn} />
      <Trees lite={lite} />
      <Lake dawn={dawn} reduced={reduced} />
      <PathRibbon walkerT={data.walkerT} reduced={reduced} />
      {data.stations.map((s, i) => (
        <StationMark key={s.id} index={i} id={s.id} state={s.state} selected={s.id === selectedId}
          onHover={onHover} onSelect={onSelect} reduced={reduced} />
      ))}
      <Walker t={data.walkerT} reduced={reduced} />
      <Haze dawn={dawn} reduced={reduced} />
      <Motes reduced={reduced} count={lite ? 120 : 320} />
      {!reduced && <Birds />}
      <CameraRig data={data} mode={mode} reduced={reduced} dawn={dawn} sequence={sequence} />
      <LabelProjector count={data.stations.length} labels={labels} />
    </>
  );
}

/** Runs the sunrise: moves `dawn` on, and with it the light and the fog. */
function Daybreak({ dawn, sequence, reduced }: { dawn: DawnRef; sequence: number; reduced: boolean }) {
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const seen = useRef(sequence);
  const { scene, invalidate } = useThree();
  const night = useMemo(() => new THREE.Color(NIGHT_FOG), []);
  const day = useMemo(() => new THREE.Color(FOG.color), []);

  useEffect(() => {
    if (reduced) dawn.current = 1;
    else if (sequence !== seen.current) dawn.current = 0;
    seen.current = sequence;
    invalidate();
  }, [sequence, reduced, dawn, invalidate]);

  useFrame((_, dt) => {
    if (dawn.current < 1) dawn.current = Math.min(1, dawn.current + Math.min(dt, 0.25) / SUNRISE_SECONDS); // real seconds, on a slow GPU too
    const e = easeDawn(dawn.current);
    (scene.fog as THREE.Fog).color.copy(night).lerp(day, e);
    if (hemi.current) hemi.current.intensity = 0.6 + e * 2.2;
    if (sun.current) sun.current.intensity = 0.2 + e * 2.2;
    if (fill.current) fill.current.intensity = 0.3 + e * 1.4;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#fff6e0", "#2b5fc0", 3.5]} />
      <directionalLight ref={fill} position={[-50, 60, 90]} intensity={2.2} color="#fff0f4" />
      <directionalLight ref={sun} position={[120, 60, -240]} intensity={2.4} color="#ffc27a" />
    </>
  );
}

/* ================================================================ camera */

function shotFor(mode: CameraMode, data: JourneyData, aspect: number): Shot {
  if (mode.kind === "station") return stationShot(mode.index, aspect);
  if (mode.kind === "walker") {
    const next = data.currentIndex === null ? null : data.currentIndex;
    return walkerShot(data.walkerT, next, aspect);
  }
  return overviewShot(aspect);
}

function CameraRig({ data, mode, reduced, dawn, sequence }: { data: JourneyData; mode: CameraMode; reduced: boolean; dawn: DawnRef; sequence: number }) {
  const { camera, size, invalidate } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const shot = useMemo(() => shotFor(mode, data, aspect), [mode, data, aspect]);
  const target = useRef(new THREE.Vector3(...shot.target));
  const first = useRef(true);

  // Cut on first frame and under reduced motion; otherwise fly (damped) in useFrame.
  useEffect(() => {
    if (first.current || reduced) {
      camera.position.set(...shot.position);
      target.current.set(...shot.target);
      camera.lookAt(target.current);
      first.current = false;
      invalidate();
    }
  }, [shot, reduced, camera, invalidate]);

  // The title sequence begins high over the valley; the rig below brings the camera down.
  useEffect(() => {
    if (sequence === 0 || reduced) return;
    const o = overviewShot(aspect);
    camera.position.set(o.position[0], o.position[1] + 34, o.position[2] + 26);
    target.current.set(...o.target);
    camera.lookAt(target.current);
    // Starts the shot once per sequence, not on every resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence, reduced]);

  const goalPos = useMemo(() => new THREE.Vector3(...shot.position), [shot]);
  const goalTarget = useMemo(() => new THREE.Vector3(...shot.target), [shot]);
  const sway = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    if (reduced) return;
    const rate = dawn.current < 1 ? 0.75 : 1.9; // the title sequence is a slow descent
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * rate); // frame-rate independent damping
    camera.position.lerp(goalPos, k);
    target.current.lerp(goalTarget, k);
    // A slow breath so the scene is alive at rest, never more than ~0.6 units.
    const t = state.clock.elapsedTime;
    sway.current.set(Math.sin(t * 0.21) * 0.6, Math.sin(t * 0.17 + 1) * 0.35, 0);
    camera.position.add(sway.current);
    camera.lookAt(target.current);
    camera.position.sub(sway.current);
  });
  return null;
}

/** Projects each station's label anchor to the screen and moves the HTML label there. */
function LabelProjector({ count, labels }: { count: number; labels: React.RefObject<(HTMLElement | null)[]> }) {
  const { camera, size } = useThree();
  const anchors = useMemo(() => Array.from({ length: count }, (_, i) => {
    const p = stationPosition(i);
    return new THREE.Vector3(p[0], p[1] + 13, p[2]);
  }), [count]);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const els = labels.current;
    if (!els) return;
    // This runs before the frame renders. When still, that frame may be the only one, so the
    // camera's matrices must be brought up to date here or labels land where it used to be.
    camera.updateMatrixWorld();
    anchors.forEach((a, i) => {
      const el = els[i];
      if (!el) return;
      v.copy(a).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.visibility = visible ? "visible" : "hidden";
    });
  });
  return null;
}

/* ================================================================ sky */

function Sky({ dawn, reduced }: { dawn: DawnRef; reduced: boolean }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(SKY_HORIZON) }, uLow: { value: new THREE.Color(SKY_LOW) },
      uMid: { value: new THREE.Color(SKY_MID) }, uZenith: { value: new THREE.Color(SKY_ZENITH) },
      uSun: { value: sunDir(1) }, uRise: { value: 1 }, uTime: { value: 20 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uHorizon; uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uZenith; uniform vec3 uSun;
      uniform float uRise; uniform float uTime; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 day = mix(uHorizon, uLow, smoothstep(0.0, 0.1, h));
        day = mix(day, uMid, smoothstep(0.07, 0.24, h));
        day = mix(day, uZenith, smoothstep(0.2, 0.58, h));
        vec3 night = mix(vec3(0.07, 0.11, 0.34), vec3(0.015, 0.03, 0.13), smoothstep(0.0, 0.5, h));
        vec3 col = mix(night, day, uRise);

        // Long streaks of cloud, lit from below: rose by the sun, gold at the horizon.
        vec2 sp = vec2(d.x / (h + 0.22), h * 6.0);
        float streak = smoothstep(0.42, 0.74, fbm(sp * vec2(1.2, 2.2) + vec2(uTime * 0.012, 0.0)));
        col = mix(col, mix(vec3(1.0, 0.82, 0.45), vec3(1.0, 0.36, 0.56), smoothstep(0.03, 0.3, h)), streak * 0.72 * uRise * smoothstep(0.0, 0.05, h));

        // The sun, its bloom, and shafts of light turning slowly around it.
        float s = max(dot(d, uSun), 0.0);
        float ang = atan(d.x - uSun.x, d.y - uSun.y);
        float rays = smoothstep(0.4, 0.8, noise(vec2(ang * 7.0 + uTime * 0.04, uTime * 0.03))) * pow(s, 7.0);
        col += vec3(1.0, 0.72, 0.36) * (rays * 0.55 + pow(s, 28.0) * 0.5 + pow(s, 5.0) * 0.14) * (0.25 + uRise * 0.75);
        col = mix(col, vec3(1.0, 0.97, 0.84), smoothstep(0.9975, 0.9992, s));

        // Stars, gone by sunrise.
        vec2 g = vec2(atan(d.x, d.z) * 90.0, d.y * 150.0);
        float star = step(0.992, hash(floor(g))) * smoothstep(0.42, 0.05, length(fract(g) - 0.5));
        col += star * (1.0 - smoothstep(0.0, 0.55, uRise)) * smoothstep(0.02, 0.2, h);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => {
    const e = easeDawn(dawn.current);
    mat.uniforms.uRise!.value = e;
    (mat.uniforms.uSun!.value as THREE.Vector3).copy(sunDir(e));
    if (!reduced) mat.uniforms.uTime!.value += dt;
  });
  return <mesh material={mat} renderOrder={-1}><sphereGeometry args={[600, 32, 16]} /></mesh>;
}

/* ================================================================ land */

const LAND = {
  low: new THREE.Color("#0c9c62"), grass: new THREE.Color("#58c22e"), rock: new THREE.Color("#c2476a"),
  high: new THREE.Color("#ffd2c4"), shore: new THREE.Color("#ffd166"), moss: new THREE.Color("#067a5e"),
};

function Terrain({ lite }: { lite: boolean }) {
  const geom = useMemo(() => {
    const W = 330, D = 320;
    const g = new THREE.PlaneGeometry(W, D, lite ? 110 : 190, lite ? 120 : 200);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, -50);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const y = heightAt(x, z);
      pos.setY(i, y);
      const rel = (y - (1.2 + Math.pow(Math.min(Math.max((38 - z) / 184, 0), 1), 1.7) * 34)); // height over the valley floor
      const n = fbm(x * 0.2, z * 0.2, 2);
      if (y < LAKE.level + 0.6) c.copy(LAND.shore);
      else if (rel < 5) c.copy(LAND.low).lerp(LAND.grass, Math.min(Math.max(rel / 5, 0), 1));
      else if (rel < 16) c.copy(LAND.grass).lerp(LAND.rock, (rel - 5) / 11);
      else c.copy(LAND.rock).lerp(LAND.high, Math.min((rel - 16) / 14, 1));
      // Large patches of darker meadow and fine mottling keep slopes from reading as one flat colour.
      c.lerp(LAND.moss, Math.max(fbm(x * 0.05 + 2, z * 0.05 + 8, 3) - 0.45, 0) * (rel < 16 ? 1.5 : 0.3));
      c.offsetHSL(0, 0, (n - 0.5) * 0.1);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [lite]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <mesh geometry={geom}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

/** Conifers give the land its scale. One instanced draw call per tier. */
function Trees({ lite }: { lite: boolean }) {
  const { lower, upper } = useMemo(() => {
    const sites = treeSites(lite ? 320 : 900);
    const make = (r: number, h: number, yOff: number) => {
      const m = new THREE.InstancedMesh(new THREE.ConeGeometry(r, h, 6), new THREE.MeshLambertMaterial(), sites.length);
      const d = new THREE.Object3D();
      const dark = new THREE.Color("#04584f"), light = new THREE.Color("#12a15a"), c = new THREE.Color();
      sites.forEach((s, i) => {
        d.position.set(s.x, s.y + yOff * s.scale, s.z);
        d.scale.setScalar(s.scale);
        d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
        m.setColorAt(i, c.copy(dark).lerp(light, s.shade));
      });
      m.instanceMatrix.needsUpdate = true;
      return m;
    };
    return { lower: make(1.7, 4.2, 2.2), upper: make(1.15, 3.4, 4.6) };
  }, [lite]);
  useEffect(() => () => [lower, upper].forEach((m) => {
    m.geometry.dispose();
    (m.material as THREE.Material).dispose();
    m.dispose();
  }), [lower, upper]);
  return <><primitive object={lower} /><primitive object={upper} /></>;
}

/** Three distant ridges, magenta to cobalt; the fog turns each one paler. */
function Ridges({ dawn }: { dawn: DawnRef }) {
  const geoms = useMemo(() => [
    { z: -215, base: 34, amp: 44, seed: 1, color: "#2b3fa8" },
    { z: -265, base: 40, amp: 62, seed: 7, color: "#b02a86" },
    { z: -325, base: 46, amp: 86, seed: 13, color: "#f2557a" },
  ].map((r) => {
    const pts: number[] = [];
    const idx: number[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const x = -360 + (720 * i) / N;
      const peak = r.base + fbm(x * 0.012 + r.seed, r.seed, 4) * r.amp + Math.max(0, 1 - Math.abs(x - 10) / 120) * 22;
      pts.push(x, -20, r.z, x, peak, r.z + Math.sin(i) * 3);
      if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return { g, day: new THREE.Color(r.color), mat: new THREE.MeshBasicMaterial({ color: r.color, side: THREE.DoubleSide }) };
  }), []);
  useEffect(() => () => geoms.forEach((x) => { x.g.dispose(); x.mat.dispose(); }), [geoms]);
  const night = useMemo(() => new THREE.Color("#0a1038"), []);
  useFrame(() => {
    const e = easeDawn(dawn.current);
    geoms.forEach((r) => r.mat.color.copy(night).lerp(r.day, e));
  });
  return <>{geoms.map((r, i) => <mesh key={i} geometry={r.g} material={r.mat} />)}</>;
}

/* ================================================================ water */

function Lake({ dawn, reduced }: { dawn: DawnRef; reduced: boolean }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uTime: { value: 0 }, uDeep: { value: new THREE.Color("#0b4fc4") }, uShallow: { value: new THREE.Color("#19d3c5") },
      uSky: { value: new THREE.Color("#ff5a8a") }, uSun: { value: new THREE.Color("#ffd66b") },
      uFog: { value: new THREE.Color(FOG.color) }, uFogNear: { value: FOG.near }, uFogFar: { value: FOG.far }, uRise: { value: 1 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vWorld; varying float vDepth;
      void main() {
        vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz;
        vec4 mv = viewMatrix * w; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uSky; uniform vec3 uSun;
      uniform vec3 uFog; uniform float uFogNear; uniform float uFogFar; uniform float uRise;
      varying vec2 vUv; varying vec3 vWorld; varying float vDepth;
      void main() {
        vec2 c = vUv - 0.5; float r = length(c) * 2.0;
        vec3 col = mix(uDeep, uShallow, smoothstep(0.5, 1.0, r));
        float w = sin(vWorld.x * 0.9 + uTime * 0.6) * sin(vWorld.z * 1.3 - uTime * 0.45);
        // The sky on the water, in bands that shift with the ripples.
        float band = sin(vWorld.z * 0.32 + w * 0.8 + uTime * 0.18) * 0.5 + 0.5;
        col = mix(col, uSky, smoothstep(0.35, 0.95, band) * 0.5);
        col += uSun * smoothstep(0.72, 1.0, w) * (1.0 - r * 0.6) * 0.9;
        col *= 0.3 + uRise * 0.7;
        float edge = 1.0 - smoothstep(0.92, 1.0, r);
        float f = smoothstep(uFogNear, uFogFar, vDepth);
        gl_FragColor = vec4(mix(col, uFog, f), 0.95 * edge);
      }`,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => {
    mat.uniforms.uRise!.value = easeDawn(dawn.current);
    if (!reduced) mat.uniforms.uTime!.value += dt;
  });
  return (
    <mesh material={mat} position={[LAKE.x, LAKE.level, LAKE.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[LAKE.rx * 1.05, LAKE.rz * 1.05, 1]}>
      <circleGeometry args={[1, 64]} />
    </mesh>
  );
}

/* ================================================================ path */

function ribbon(width: number, lift: number): THREE.BufferGeometry {
  const steps = 420;
  const pts: number[] = [];
  const idx: number[] = [];
  const ts: number[] = [];
  const colors: number[] = [];
  const c = new THREE.Color(), next = new THREE.Color();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = pathPoint(t, lift);
    const q = pathPoint(Math.min(1, t + 0.002), lift);
    const r = pathPoint(Math.max(0, t - 0.002), lift);
    const dx = q[0] - r[0], dz = q[2] - r[2];
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    // Narrows as it climbs: perspective helps, the path feels long.
    const w = width * (1 - t * 0.35);
    pts.push(p[0] + nx * w, p[1], p[2] + nz * w, p[0] - nx * w, p[1], p[2] - nz * w);
    ts.push(t, t);
    // Each stretch of path carries the hue of the station it leads to, blending at the station.
    let k = 0;
    while (k < STATION_AT.length - 1 && t > stationT(k)) k++;
    const from = k === 0 ? 0 : stationT(k - 1);
    const u = Math.min(Math.max((t - from) / Math.max(stationT(k) - from, 1e-4), 0), 1);
    c.set(paneAt(k).bright).lerp(next.set(paneAt(k + 1).bright), u > 0.8 ? (u - 0.8) * 2.5 : 0);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < steps) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));
  g.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  return g;
}

/** A river of coloured light. The walked part burns bright with a pulse running up it; the rest is dim glass. */
function PathRibbon({ walkerT, reduced }: { walkerT: number; reduced: boolean }) {
  const geom = useMemo(() => ribbon(1.9, 0.3), []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3,
    uniforms: { uTime: { value: 8 }, uWalker: { value: walkerT } },
    vertexShader: /* glsl */`
      attribute float aT; attribute vec3 aColor; varying float vT; varying vec3 vC;
      void main() { vT = aT; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uWalker; varying float vT; varying vec3 vC;
      void main() {
        float walked = 1.0 - smoothstep(uWalker - 0.002, uWalker + 0.002, vT);
        float pulse = pow(fract(vT * 7.0 - uTime * 0.16), 18.0);
        vec3 ahead = mix(vC, vec3(1.0, 0.95, 0.85), 0.18) + vC * pulse * 0.5;
        vec3 lit = mix(vC, vec3(1.0), 0.28) * 1.15 + vec3(1.0) * pulse * 0.7;
        gl_FragColor = vec4(mix(ahead, lit, walked), 1.0);
      }`,
  }), [walkerT]);
  useEffect(() => () => geom.dispose(), [geom]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => { if (!reduced) mat.uniforms.uTime!.value += dt; });
  return <mesh geometry={geom} material={mat} />;
}

/* ================================================================ stations */

/** One landmark per phase, in stone stained with its own glass. The silhouette carries the meaning. */
function Landmark({ index }: { index: number }) {
  const hue = useMemo(() => new THREE.Color(paneAt(index).bright), [index]);
  const stoneColor = useMemo(() => new THREE.Color("#ffe9cf").lerp(hue, 0.42), [hue]);
  const darkColor = useMemo(() => new THREE.Color("#5a3550").lerp(hue, 0.5), [hue]);
  const stone = <meshLambertMaterial color={stoneColor} flatShading />;
  const dark = <meshLambertMaterial color={darkColor} flatShading />;
  switch (index) {
    case 0: // The Well
      return (
        <group>
          <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[1.6, 1.8, 1.2, 10, 1, true]} />{stone}</mesh>
          <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.6, 0.22, 6, 14]} />{dark}</mesh>
          <mesh position={[-1.3, 2.2, 0]}><boxGeometry args={[0.25, 2.4, 0.25]} />{dark}</mesh>
          <mesh position={[1.3, 2.2, 0]}><boxGeometry args={[0.25, 2.4, 0.25]} />{dark}</mesh>
          <mesh position={[0, 3.45, 0]}><boxGeometry args={[3.2, 0.25, 0.3]} />{dark}</mesh>
        </group>
      );
    case 1: // The Bridge
      return (
        <group rotation={[0, 0.5, 0]}>
          <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0]}><torusGeometry args={[2.6, 0.55, 6, 18, Math.PI]} />{stone}</mesh>
          <mesh position={[0, 3.3, 0]}><boxGeometry args={[6.8, 0.4, 1.4]} />{dark}</mesh>
        </group>
      );
    case 2: // The Library
      return (
        <group>
          <mesh position={[0, 3.2, 0]}><cylinderGeometry args={[1.5, 1.8, 6.4, 8]} />{stone}</mesh>
          <mesh position={[0, 7.1, 0]}><coneGeometry args={[1.9, 1.6, 8]} />{dark}</mesh>
          <mesh position={[0, 4.6, 1.55]}><boxGeometry args={[0.6, 1, 0.1]} /><meshBasicMaterial color="#ffd27a" /></mesh>
        </group>
      );
    case 3: // The Crossroads
      return (
        <group>
          <mesh position={[0, 2.6, 0]}><boxGeometry args={[0.45, 5.2, 0.45]} />{dark}</mesh>
          <mesh position={[0.9, 4.4, 0]} rotation={[0, 0, -0.12]}><boxGeometry args={[2.2, 0.55, 0.15]} />{stone}</mesh>
          <mesh position={[-0.9, 3.5, 0]} rotation={[0, 0.6, 0.1]}><boxGeometry args={[2.2, 0.55, 0.15]} />{stone}</mesh>
          <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[1.6, 2, 0.8, 7]} />{stone}</mesh>
        </group>
      );
    case 4: // The Watchtower
      return (
        <group>
          <mesh position={[0, 4.5, 0]}><boxGeometry args={[2, 9, 2]} />{stone}</mesh>
          <mesh position={[0, 9.3, 0]}><boxGeometry args={[2.8, 0.6, 2.8]} />{dark}</mesh>
        </group>
      );
    default: // The Summit cairn
      return (
        <group>
          <mesh position={[0, 0.9, 0]}><dodecahedronGeometry args={[1.8, 0]} />{stone}</mesh>
          <mesh position={[0.2, 2.8, 0.1]} rotation={[0.3, 0.5, 0]}><dodecahedronGeometry args={[1.2, 0]} />{dark}</mesh>
          <mesh position={[0, 4.1, 0]}><dodecahedronGeometry args={[0.8, 0]} />{stone}</mesh>
          <mesh position={[0, 6.4, 0]}><boxGeometry args={[0.25, 3.6, 0.25]} />{dark}</mesh>
        </group>
      );
  }
}

/** Landmarks are drawn at a human-ish unit and scaled up so they read at a distance. */
const LANDMARK_SCALE = 1.8;
/** Beacon height above each landmark's base. */
const BEACON_Y = [4.2, 4.4, 8.6, 5.8, 10.4, 8.6].map((y) => y * LANDMARK_SCALE);

let glowTex: THREE.Texture | null = null;
function glowTexture(): THREE.Texture {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

function Glow({ position, scale, opacity = 1, color = "#ffe6ad" }: { position: Vec3; scale: number; opacity?: number; color?: string }) {
  const tex = useMemo(() => glowTexture(), []);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
    </sprite>
  );
}

/** A column of coloured light standing on a station. */
function Beam({ color, opacity, height, radius, reduced }: { color: string; opacity: number; height: number; radius: number; reduced: boolean }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uTime: { value: 3 } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity; uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float up = 1.0 - vUv.y;                  // 0 at the station, 1 at the top of the beam
        float fall = pow(1.0 - up, 2.2);         // brightest at the ground, gone before the top
        float soft = pow(abs(dot(normalize(vN), normalize(vV))), 2.4); // no hard edge on the column
        float flow = 0.7 + 0.3 * sin(up * 26.0 - uTime * 1.8);
        gl_FragColor = vec4(uColor, fall * soft * flow * uOpacity);
      }`,
  }), [color, opacity]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, dt) => { if (!reduced) mat.uniforms.uTime!.value += dt; });
  return (
    <mesh material={mat} position={[0, height / 2, 0]} renderOrder={2}>
      <cylinderGeometry args={[radius * 1.5, radius, height, 16, 1, true]} />
    </mesh>
  );
}

function StationMark({ index, id, state, selected, onHover, onSelect, reduced }: {
  index: number; id: string; state: "passed" | "current" | "ahead"; selected: boolean;
  onHover: (id: string | null) => void; onSelect: (id: string) => void; reduced: boolean;
}) {
  const p = useMemo(() => stationPosition(index), [index]);
  const ground = heightAtSafe(p[0], p[2]);
  const pulse = useRef<THREE.Group>(null);
  const hue = paneAt(index).bright;
  useFrame((s) => {
    if (reduced) return;
    if (pulse.current && state === "current") {
      const k = 1 + Math.sin(s.clock.elapsedTime * 2.2) * 0.14;
      pulse.current.scale.setScalar(k);
    }
  });
  const by = BEACON_Y[index] ?? 6;
  const over = (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(id); document.body.style.cursor = "pointer"; };
  const out = () => { onHover(null); document.body.style.cursor = ""; };
  const lit = state === "passed" || state === "current";
  const strength = selected ? 0.95 : state === "current" ? 0.8 : state === "passed" ? 0.6 : 0.2;
  return (
    <group position={[p[0], ground - 0.2, p[2]]}
      onPointerOver={over} onPointerOut={out}
      onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
      <group scale={LANDMARK_SCALE}><Landmark index={index} /></group>
      <Beam color={hue} opacity={strength} height={lit || selected ? 90 : 46} radius={lit || selected ? 2.3 : 1.2} reduced={reduced} />
      {/* A generous invisible hit target so landmarks are easy to click. */}
      <mesh position={[0, 7, 0]} visible={false}><cylinderGeometry args={[7, 7, 18, 8]} /><meshBasicMaterial /></mesh>
      {lit && (
        <group ref={pulse} position={[0, by, 0]}>
          <mesh><sphereGeometry args={[0.42, 10, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <Glow position={[0, 0, 0]} scale={state === "current" ? 12 : 8} opacity={0.95} color={hue} />
        </group>
      )}
    </group>
  );
}

function heightAtSafe(x: number, z: number) {
  const h = heightAt(x, z);
  return Number.isFinite(h) ? h : 0;
}

/* ================================================================ the walker */

function Walker({ t, reduced }: { t: number; reduced: boolean }) {
  const p = useMemo(() => pathPoint(t, 0.4), [t]);
  const flame = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (reduced || !flame.current) return;
    const e = s.clock.elapsedTime;
    flame.current.scale.set(1 + Math.sin(e * 9) * 0.05, 1 + Math.sin(e * 7.3 + 1) * 0.12, 1);
  });
  return (
    <group position={p}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.12, 0.16, 1, 6]} /><meshLambertMaterial color="#5a4a36" /></mesh>
      <group ref={flame} position={[0, 1.35, 0]}>
        <mesh><coneGeometry args={[0.32, 0.9, 8]} /><meshBasicMaterial color="#fff2b0" /></mesh>
        <Glow position={[0, 0.1, 0]} scale={6} opacity={0.95} color="#ffb020" />
      </group>
    </group>
  );
}

/* ================================================================ mist, cloud, motes */

const HAZE_VERT = /* glsl */`
  varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HAZE_FRAG = /* glsl */`
  uniform float uTime; uniform float uSeed; uniform float uOpacity; uniform vec3 uColor; uniform float uRound;
  varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
  void main() {
    vec2 p = vUv * vec2(6.0, 1.6) + vec2(uTime * 0.018 + uSeed, uSeed * 0.3);
    float d = fbm(p);
    float band = uRound > 0.5
      ? 1.0 - smoothstep(0.15, 0.5, length((vUv - 0.5) * vec2(1.0, 2.2)))
      : smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y)) * smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    gl_FragColor = vec4(uColor, smoothstep(0.35, 0.8, d) * band * uOpacity);
  }`;

function HazeSheet({ position, size, seed, opacity, round = false, speed = 1, reduced, dawn }: {
  position: Vec3; size: [number, number]; seed: number; opacity: number; round?: boolean; speed?: number; reduced: boolean; dawn: DawnRef;
}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: seed * 10 }, uSeed: { value: seed }, uOpacity: { value: opacity }, uColor: { value: new THREE.Color(round ? "#ffc2a8" : "#ffd9c7") }, uRound: { value: round ? 1 : 0 } },
    vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG,
  }), [seed, opacity, round]);
  useEffect(() => () => mat.dispose(), [mat]);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    mat.uniforms.uOpacity!.value = opacity * (0.3 + easeDawn(dawn.current) * 0.7);
    if (reduced) return;
    mat.uniforms.uTime!.value += dt * speed;
    if (round && mesh.current) mesh.current.position.x = position[0] + Math.sin(mat.uniforms.uTime!.value * 0.03) * 12;
  });
  return <mesh ref={mesh} material={mat} position={position}><planeGeometry args={size} /></mesh>;
}

function Haze({ dawn, reduced }: { dawn: DawnRef; reduced: boolean }) {
  const common = { dawn, reduced };
  return (
    <>
      {/* Mist sheets between the depth layers: thin, so the colour of the land comes through. */}
      <HazeSheet position={[0, 6, -8]} size={[220, 14]} seed={1.3} opacity={0.05} {...common} />
      <HazeSheet position={[0, 14, -40]} size={[260, 18]} seed={4.1} opacity={0.12} {...common} />
      <HazeSheet position={[0, 26, -96]} size={[300, 22]} seed={7.7} opacity={0.28} {...common} />
      <HazeSheet position={[0, 42, -170]} size={[420, 30]} seed={2.2} opacity={0.36} {...common} />
      {/* Clouds drifting past the peaks. */}
      <HazeSheet position={[-70, 92, -260]} size={[150, 46]} seed={3.3} opacity={0.8} round speed={1.4} {...common} />
      <HazeSheet position={[90, 110, -300]} size={[180, 52]} seed={9.1} opacity={0.7} round speed={1.1} {...common} />
      <HazeSheet position={[10, 74, -215]} size={[120, 30]} seed={5.6} opacity={0.55} round speed={1.7} {...common} />
    </>
  );
}

/** A small flock crossing the sunrise. Nine flat V shapes; they flap by scaling. */
function Birds() {
  const mesh = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-1.5, 0.45, 0, 0, 0, 0.22, 0, 0, -0.22, 1.5, 0.45, 0, 0, 0, 0.22, 0, 0, -0.22], 3));
    g.setIndex([0, 1, 2, 3, 4, 5]);
    const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: "#2a1140", side: THREE.DoubleSide, fog: false }), 9);
    m.frustumCulled = false;
    return m;
  }, []);
  useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); mesh.dispose(); }, [mesh]);
  const d = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const lead = ((t * 0.016) % 1) * 460 - 230; // crosses the valley in about a minute
    for (let i = 0; i < 9; i++) {
      const row = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
      d.position.set(lead - row * 5.5, 86 + side * row * 2.2 + Math.sin(t * 0.5 + i) * 1.1, -118 + side * row * 3);
      d.scale.set(1.3, 1.3 * (0.35 + Math.abs(Math.sin(t * 5 + i * 1.4)) * 1.1), 1.3);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}

/** Fireflies in every colour of the glass. */
function Motes({ reduced, count }: { reduced: boolean; count: number }) {
  const { geom, mat } = useMemo(() => {
    const N = count;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const tint = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const z = 40 - Math.random() * 120;
      const x = (Math.random() - 0.5) * 90;
      pos.set([x, heightAt(x, z) + 1 + Math.random() * 9, z], i * 3);
      seed[i] = Math.random() * 100;
      c.set(paneAt(i).bright);
      tint.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 } },
      vertexShader: /* glsl */`
        uniform float uTime; attribute float aSeed; attribute vec3 aTint; varying float vA; varying vec3 vTint;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.3 + aSeed) * 0.9; p.y += sin(uTime * 0.21 + aSeed * 1.7) * 0.7; p.z += cos(uTime * 0.17 + aSeed) * 0.9;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = clamp(70.0 / -mv.z, 2.0, 9.0);
          vTint = aTint;
          vA = 0.55 + 0.45 * sin(uTime * 0.8 + aSeed * 3.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying float vA; varying vec3 vTint;
        void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(mix(vTint, vec3(1.0), 0.35), (1.0 - smoothstep(0.1, 0.5, d)) * vA); }`,
    });
    return { geom: g, mat: m };
  }, [count]);
  useEffect(() => () => { geom.dispose(); mat.dispose(); }, [geom, mat]);
  useFrame((_, dt) => { if (!reduced) mat.uniforms.uTime!.value += dt; });
  return <points geometry={geom} material={mat} />;
}

