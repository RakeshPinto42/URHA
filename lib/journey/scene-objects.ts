/**
 * The Way to the Summit, as cinema engine generators (docs/JOURNEY.md §4).
 *
 * Each generator builds one part of the world from the parameters in
 * public/cinema/scenes/journey.json. Everything is procedural: there is nothing to download,
 * and the surface detail is generated here. Colours stay in the scene file, so the Studio
 * can change them without touching this code.
 *
 * No browser APIs, so every generator can be built and disposed in a test.
 */
import * as THREE from "three";
import type { Built, Frame, Generator, Generators } from "@/lib/cinema-engine/runtime";
import { COMMON_GENERATORS } from "@/lib/cinema-engine/generators";
import {
  heightAt, pathPoint, stationPosition, stationT, STATION_AT, treeSites, LAKE, fbm,
} from "./world";
import type { JourneyData } from "./model";
import { paneAt } from "@/lib/cinema";

/** Three's standard ending for a custom shader: right with or without post-processing. */
const FINISH = /* glsl */`#include <tonemapping_fragment>
#include <colorspace_fragment>`;

const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);

/* ---------------------------------------------------------- surface detail */

/** A tiling normal map from layered noise: the grain of rock and soil, generated, not downloaded. */
function detailNormals(size = 256, scale = 7): THREE.DataTexture {
  const height = (x: number, y: number) => {
    // Sampling a torus-free wrap: noise periodic over the tile, so it repeats without seams.
    const u = (x / size) * Math.PI * 2, v = (y / size) * Math.PI * 2;
    return fbm(Math.cos(u) * scale + 9, Math.sin(u) * scale + Math.cos(v) * scale, 4) + fbm(Math.sin(v) * scale + 3, Math.cos(u) * scale, 3) * 0.5;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = height((x + 1) % size, y) - height((x + size - 1) % size, y);
    const dy = height(x, (y + 1) % size) - height(x, (y + size - 1) % size);
    const n = new THREE.Vector3(-dx * 5, -dy * 5, 1).normalize();
    data.set([(n.x * 0.5 + 0.5) * 255, (n.y * 0.5 + 0.5) * 255, (n.z * 0.5 + 0.5) * 255, 255], (y * size + x) * 4);
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** A soft round light, for a glow on tiers without bloom. */
function glowTexture(size = 64): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
    const a = Math.max(0, 1 - d) ** 2.2;
    data.set([255, 255, 255, a * 255], (y * size + x) * 4);
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function glowSprite(color: string, scale: number, opacity: number): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.set(scale, scale, 1);
  return s;
}

/* ---------------------------------------------------------- sky */

const sky: Generator = (p) => {
  const sunFrom = num(p.sunFrom, -0.1), sunTo = num(p.sunTo, 0.26);
  const sunDir = (rise: number) => new THREE.Vector3(0.42, sunFrom + rise * (sunTo - sunFrom), -1).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(str(p.horizon, "#ffd23f")) }, uLow: { value: new THREE.Color(str(p.low, "#ff7a3c")) },
      uMid: { value: new THREE.Color(str(p.mid, "#f0407e")) }, uZenith: { value: new THREE.Color(str(p.zenith, "#1e3fae")) },
      uSun: { value: sunDir(1) }, uRise: { value: 1 }, uTime: { value: 20 }, uSunPower: { value: num(p.sunPower, 14) },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uHorizon; uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uZenith; uniform vec3 uSun;
      uniform float uRise; uniform float uTime; uniform float uSunPower; varying vec3 vDir;
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
        vec3 night = mix(vec3(0.025, 0.04, 0.16), vec3(0.004, 0.008, 0.04), smoothstep(0.0, 0.5, h));
        vec3 col = mix(night, day, uRise);

        // Long streaks of cloud, lit from below: rose by the sun, gold at the horizon.
        vec2 sp = vec2(d.x / (h + 0.22), h * 6.0);
        float streak = smoothstep(0.42, 0.74, fbm(sp * vec2(1.2, 2.2) + vec2(uTime * 0.012, 0.0)));
        col = mix(col, mix(vec3(1.0, 0.72, 0.3), vec3(0.95, 0.22, 0.4), smoothstep(0.03, 0.3, h)), streak * 0.72 * uRise * smoothstep(0.0, 0.05, h));

        // The sun, far brighter than anything else, so it blooms; its shafts turn slowly around it.
        float s = max(dot(d, uSun), 0.0);
        float ang = atan(d.x - uSun.x, d.y - uSun.y);
        float rays = smoothstep(0.4, 0.8, noise(vec2(ang * 7.0 + uTime * 0.04, uTime * 0.03))) * pow(s, 7.0);
        col += vec3(1.0, 0.62, 0.26) * (rays * 0.45 + pow(s, 40.0) * 0.5 + pow(s, 6.0) * 0.08) * (0.25 + uRise * 0.75);
        col += vec3(1.0, 0.86, 0.6) * uSunPower * smoothstep(0.9975, 0.9992, s);

        // Stars, gone by sunrise.
        vec2 g = vec2(atan(d.x, d.z) * 90.0, d.y * 150.0);
        float star = step(0.992, hash(floor(g))) * smoothstep(0.42, 0.05, length(fract(g) - 0.5));
        col += star * 1.4 * (1.0 - smoothstep(0.0, 0.55, uRise)) * smoothstep(0.02, 0.2, h);
        gl_FragColor = vec4(col, 1.0);
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), mat);
  mesh.renderOrder = -1;
  return {
    object: mesh,
    update: (f) => {
      mat.uniforms.uRise!.value = f.progress;
      (mat.uniforms.uSun!.value as THREE.Vector3).copy(sunDir(f.progress));
      if (!f.still) mat.uniforms.uTime!.value += f.dt;
    },
  };
};

/* ---------------------------------------------------------- land */

const terrain: Generator = (p, ctx) => {
  const W = 330, D = 320;
  const g = new THREE.PlaneGeometry(W, D, Math.round(190 * ctx.tier.detail), Math.round(200 * ctx.tier.detail));
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -50);
  const low = new THREE.Color(str(p.low, "#0c9c62")), grass = new THREE.Color(str(p.grass, "#58c22e")), rock = new THREE.Color(str(p.rock, "#c2476a"));
  const high = new THREE.Color(str(p.high, "#ffd2c4")), shore = new THREE.Color(str(p.shore, "#ffd166")), moss = new THREE.Color(str(p.moss, "#067a5e"));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const rel = y - (1.2 + Math.pow(Math.min(Math.max((38 - z) / 184, 0), 1), 1.7) * 34); // height over the valley floor
    const n = fbm(x * 0.2, z * 0.2, 2);
    if (y < LAKE.level + 0.6) c.copy(shore);
    else if (rel < 5) c.copy(low).lerp(grass, Math.min(Math.max(rel / 5, 0), 1));
    else if (rel < 16) c.copy(grass).lerp(rock, (rel - 5) / 11);
    else c.copy(rock).lerp(high, Math.min((rel - 16) / 14, 1));
    c.lerp(moss, Math.max(fbm(x * 0.05 + 2, z * 0.05 + 8, 3) - 0.45, 0) * (rel < 16 ? 1.5 : 0.3));
    c.offsetHSL(0, 0, (n - 0.5) * 0.1);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const normalMap = detailNormals();
  normalMap.repeat.set(num(p.detailRepeat, 42), num(p.detailRepeat, 42));
  const scale = num(p.detailStrength, 0.8);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: num(p.roughness, 0.92), metalness: 0, normalMap, normalScale: new THREE.Vector2(scale, scale) });
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  return { object: mesh };
};

/** Conifers give the land its scale. One instanced draw call per tier of branches. */
const trees: Generator = (p, ctx) => {
  const sites = treeSites(Math.round(num(p.count, 900) * ctx.tier.detail));
  const dark = new THREE.Color(str(p.dark, "#04584f")), light = new THREE.Color(str(p.light, "#12a15a"));
  const make = (r: number, h: number, yOff: number) => {
    const m = new THREE.InstancedMesh(new THREE.ConeGeometry(r, h, 7), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), sites.length);
    const d = new THREE.Object3D(), c = new THREE.Color();
    sites.forEach((s, i) => {
      d.position.set(s.x, s.y + yOff * s.scale, s.z);
      d.scale.setScalar(s.scale);
      d.rotation.y = s.shade * 6.28;
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, c.copy(dark).lerp(light, s.shade));
    });
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const group = new THREE.Group();
  group.add(make(1.7, 4.2, 2.2), make(1.15, 3.4, 4.6));
  return { object: group };
};

/** Distant ridges, stepping back into the haze. */
const ridges: Generator = (p) => {
  const group = new THREE.Group();
  const night = new THREE.Color(str(p.night, "#050920"));
  const layers = (p.layers as { z: number; base: number; amp: number; seed: number; color: string }[]) ?? [];
  const mats = layers.map((r) => {
    const pts: number[] = [], idx: number[] = [];
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
    const mat = new THREE.MeshBasicMaterial({ color: r.color, side: THREE.DoubleSide });
    group.add(new THREE.Mesh(g, mat));
    return { mat, day: new THREE.Color(r.color) };
  });
  return { object: group, update: (f) => mats.forEach((m) => m.mat.color.copy(night).lerp(m.day, f.progress)) };
};

/* ---------------------------------------------------------- water */

/** A real reflective surface: it mirrors the captured sky, and takes the sun as a highlight. */
const lake: Generator = (p) => {
  const normalMap = detailNormals(256, 4);
  normalMap.repeat.set(8, 6);
  const secondary = num(p.ripple, 0.35);
  const mat = new THREE.MeshStandardMaterial({
    color: str(p.color, "#0a3a9c"), metalness: num(p.metalness, 0.75), roughness: num(p.roughness, 0.14),
    normalMap, normalScale: new THREE.Vector2(secondary, secondary),
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat);
  mesh.position.set(LAKE.x, LAKE.level, LAKE.z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(LAKE.rx * 1.05, LAKE.rz * 1.05, 1);
  mesh.receiveShadow = true;
  return {
    object: mesh,
    update: (f) => { if (!f.still) { normalMap.offset.x += f.dt * 0.012; normalMap.offset.y -= f.dt * 0.008; } },
  };
};

/* ---------------------------------------------------------- the path */

function ribbon(width: number, lift: number): THREE.BufferGeometry {
  const steps = 420;
  const pts: number[] = [], idx: number[] = [], ts: number[] = [], colors: number[] = [];
  const c = new THREE.Color(), next = new THREE.Color();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = pathPoint(t, lift);
    const q = pathPoint(Math.min(1, t + 0.002), lift);
    const r = pathPoint(Math.max(0, t - 0.002), lift);
    const dx = q[0] - r[0], dz = q[2] - r[2];
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    const w = width * (1 - t * 0.35); // Narrows as it climbs: perspective helps the path feel long.
    pts.push(a[0] + nx * w, a[1], a[2] + nz * w, a[0] - nx * w, a[1], a[2] - nz * w);
    ts.push(t, t);
    // Each stretch carries the hue of the station it leads to, blending at the station.
    let k = 0;
    while (k < STATION_AT.length - 1 && t > stationT(k)) k++;
    const from = k === 0 ? 0 : stationT(k - 1);
    const u = Math.min(Math.max((t - from) / Math.max(stationT(k) - from, 1e-4), 0), 1);
    c.set(paneAt(k).bright).lerp(next.set(paneAt(k + 1).bright), u > 0.8 ? (u - 0.8) * 2.5 : 0);
    colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i < steps) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  g.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));
  g.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(idx);
  return g;
}

/** A river of coloured light. The walked part burns bright; the rest is dim glass. */
const path: Generator = (p, ctx) => {
  const data = ctx.data as JourneyData;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3,
    uniforms: { uTime: { value: 8 }, uWalker: { value: data.walkerT }, uGlow: { value: num(p.glow, 1.6) } },
    vertexShader: /* glsl */`
      attribute float aT; attribute vec3 aColor; varying float vT; varying vec3 vC;
      void main() { vT = aT; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform float uWalker; uniform float uGlow; varying float vT; varying vec3 vC;
      void main() {
        float walked = 1.0 - smoothstep(uWalker - 0.002, uWalker + 0.002, vT);
        float pulse = pow(fract(vT * 7.0 - uTime * 0.16), 18.0);
        vec3 ahead = mix(vC, vec3(1.0, 0.95, 0.85), 0.18) * 0.8 + vC * pulse * 1.2;
        vec3 lit = (mix(vC, vec3(1.0), 0.28) + vec3(1.0) * pulse) * uGlow;
        gl_FragColor = vec4(mix(ahead, lit, walked), 1.0);
        ${FINISH}
      }`,
  });
  return {
    object: new THREE.Mesh(ribbon(num(p.width, 1.9), 0.3), mat),
    update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; },
  };
};

/* ---------------------------------------------------------- stations */

/** One landmark per phase, in stone stained with its own glass. The silhouette carries the meaning. */
function landmark(index: number): THREE.Group {
  const hue = new THREE.Color(paneAt(index).bright);
  const stone = new THREE.MeshStandardMaterial({ color: new THREE.Color("#ffe9cf").lerp(hue, 0.42), roughness: 0.82, flatShading: true });
  const dark = new THREE.MeshStandardMaterial({ color: new THREE.Color("#5a3550").lerp(hue, 0.5), roughness: 0.7, metalness: 0.15, flatShading: true });
  const group = new THREE.Group();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...position);
    m.rotation.set(...rotation);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  switch (index) {
    case 0: // The Well
      add(new THREE.CylinderGeometry(1.6, 1.8, 1.2, 10, 1, true), stone, [0, 0.6, 0]);
      add(new THREE.TorusGeometry(1.6, 0.22, 6, 14), dark, [0, 1.2, 0], [Math.PI / 2, 0, 0]);
      add(new THREE.BoxGeometry(0.25, 2.4, 0.25), dark, [-1.3, 2.2, 0]);
      add(new THREE.BoxGeometry(0.25, 2.4, 0.25), dark, [1.3, 2.2, 0]);
      add(new THREE.BoxGeometry(3.2, 0.25, 0.3), dark, [0, 3.45, 0]);
      break;
    case 1: // The Bridge
      group.rotation.y = 0.5;
      add(new THREE.TorusGeometry(2.6, 0.55, 6, 18, Math.PI), stone, [0, 1.6, 0]);
      add(new THREE.BoxGeometry(6.8, 0.4, 1.4), dark, [0, 3.3, 0]);
      break;
    case 2: { // The Library
      add(new THREE.CylinderGeometry(1.5, 1.8, 6.4, 8), stone, [0, 3.2, 0]);
      add(new THREE.ConeGeometry(1.9, 1.6, 8), dark, [0, 7.1, 0]);
      const lit = new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffb347", emissiveIntensity: 5 });
      add(new THREE.BoxGeometry(0.6, 1, 0.1), lit, [0, 4.6, 1.55]);
      break;
    }
    case 3: // The Crossroads
      add(new THREE.BoxGeometry(0.45, 5.2, 0.45), dark, [0, 2.6, 0]);
      add(new THREE.BoxGeometry(2.2, 0.55, 0.15), stone, [0.9, 4.4, 0], [0, 0, -0.12]);
      add(new THREE.BoxGeometry(2.2, 0.55, 0.15), stone, [-0.9, 3.5, 0], [0, 0.6, 0.1]);
      add(new THREE.CylinderGeometry(1.6, 2, 0.8, 7), stone, [0, 0.4, 0]);
      break;
    case 4: // The Watchtower
      add(new THREE.BoxGeometry(2, 9, 2), stone, [0, 4.5, 0]);
      add(new THREE.BoxGeometry(2.8, 0.6, 2.8), dark, [0, 9.3, 0]);
      break;
    default: // The Summit cairn
      add(new THREE.DodecahedronGeometry(1.8, 0), stone, [0, 0.9, 0]);
      add(new THREE.DodecahedronGeometry(1.2, 0), dark, [0.2, 2.8, 0.1], [0.3, 0.5, 0]);
      add(new THREE.DodecahedronGeometry(0.8, 0), stone, [0, 4.1, 0]);
      add(new THREE.BoxGeometry(0.25, 3.6, 0.25), dark, [0, 6.4, 0]);
  }
  return group;
}

const LANDMARK_SCALE = 1.8;
/** Beacon height above each landmark's base. */
const BEACON_Y = [4.2, 4.4, 8.6, 5.8, 10.4, 8.6].map((y) => y * LANDMARK_SCALE);

/** A column of coloured light standing on a station. */
function beam(color: string, height: number, radius: number) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.5 }, uTime: { value: 3 } },
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
        float up = 1.0 - vUv.y;
        float fall = pow(1.0 - up, 2.2);
        float soft = pow(abs(dot(normalize(vN), normalize(vV))), 2.4);
        float flow = 0.7 + 0.3 * sin(up * 26.0 - uTime * 1.8);
        gl_FragColor = vec4(uColor * 2.2, fall * soft * flow * uOpacity);
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.5, radius, height, 16, 1, true), mat);
  mesh.position.y = height / 2;
  mesh.renderOrder = 2;
  mesh.raycast = () => {}; // Light, not a thing: it must not take clicks meant for what is behind it.
  return { mesh, mat };
}

/** All the stations, from the journey data. Clicks reach them through `pickId`. */
const stations: Generator = (_p, ctx) => {
  const data = ctx.data as JourneyData;
  const group = new THREE.Group();
  group.userData.pickable = true;
  const updates: ((f: Frame) => void)[] = [];
  data.stations.forEach((s, index) => {
    const at = stationPosition(index);
    const h = heightAt(at[0], at[2]);
    const hue = paneAt(index).bright;
    const lit = s.state === "passed" || s.state === "current";
    const station = new THREE.Group();
    station.position.set(at[0], (Number.isFinite(h) ? h : 0) - 0.2, at[2]);
    station.userData.pickId = s.id;

    const body = landmark(index);
    body.scale.setScalar(LANDMARK_SCALE);
    const wrap = new THREE.Group();
    wrap.add(body);
    station.add(wrap);

    const { mesh, mat } = beam(hue, lit ? 90 : 46, lit ? 2.3 : 1.2);
    station.add(mesh);
    const strength = s.state === "current" ? 0.8 : s.state === "passed" ? 0.6 : 0.2;

    // A generous invisible target, so landmarks are easy to click.
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 18, 8), new THREE.MeshBasicMaterial());
    hit.position.y = 7;
    hit.visible = false;
    station.add(hit);

    let pulse: THREE.Group | null = null;
    if (lit) {
      pulse = new THREE.Group();
      pulse.position.y = BEACON_Y[index] ?? 6;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(hue).multiplyScalar(8) }));
      core.raycast = () => {};
      pulse.add(core, glowSprite(hue, s.state === "current" ? 12 : 8, ctx.tier.bloomScale ? 0.45 : 0.95));
      if (s.state === "current" && ctx.tier.pointLights) {
        const light = new THREE.PointLight(hue, 90, 42, 1.8);
        pulse.add(light);
      }
      station.add(pulse);
    }
    updates.push((f) => {
      mat.uniforms.uOpacity!.value = ctx.state.selectedId === s.id ? 0.95 : strength;
      if (f.still) return;
      mat.uniforms.uTime!.value += f.dt;
      if (pulse && s.state === "current") pulse.scale.setScalar(1 + Math.sin(f.time * 2.2) * 0.14);
    });
    group.add(station);
  });
  return { object: group, update: (f) => updates.forEach((u) => u(f)) };
};

/* ---------------------------------------------------------- the walker */

const walker: Generator = (_p, ctx) => {
  const data = ctx.data as JourneyData;
  const group = new THREE.Group();
  group.position.set(...pathPoint(data.walkerT, 0.4));
  const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 6), new THREE.MeshStandardMaterial({ color: "#5a4a36", roughness: 0.8 }));
  staff.position.y = 0.5;
  staff.castShadow = true;
  group.add(staff);
  const flame = new THREE.Group();
  flame.position.y = 1.35;
  flame.add(new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffb347").multiplyScalar(7) })));
  flame.add(glowSprite("#ffb020", 6, ctx.tier.bloomScale ? 0.4 : 0.95));
  if (ctx.tier.pointLights) flame.add(new THREE.PointLight("#ffa040", 60, 26, 1.8));
  group.add(flame);
  return {
    object: group,
    update: (f) => { if (!f.still) flame.scale.set(1 + Math.sin(f.time * 9) * 0.05, 1 + Math.sin(f.time * 7.3 + 1) * 0.12, 1); },
  };
};

/* ---------------------------------------------------------- mist, motes, birds */

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
    ${FINISH}
  }`;

type Sheet = { position: [number, number, number]; size: [number, number]; seed: number; opacity: number; round?: boolean; speed?: number };

const haze: Generator = (p) => {
  const group = new THREE.Group();
  const updates = ((p.sheets as Sheet[]) ?? []).map((s) => {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG,
      uniforms: {
        uTime: { value: s.seed * 10 }, uSeed: { value: s.seed }, uOpacity: { value: s.opacity },
        uColor: { value: new THREE.Color(str(s.round ? p.cloud : p.mist, "#ffc2a8")) }, uRound: { value: s.round ? 1 : 0 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s.size[0], s.size[1]), mat);
    mesh.position.set(...s.position);
    group.add(mesh);
    return (f: Frame) => {
      mat.uniforms.uOpacity!.value = s.opacity * (0.3 + f.progress * 0.7);
      if (f.still) return;
      mat.uniforms.uTime!.value += f.dt * (s.speed ?? 1);
      if (s.round) mesh.position.x = s.position[0] + Math.sin(mat.uniforms.uTime!.value * 0.03) * 12;
    };
  });
  return { object: group, update: (f) => updates.forEach((u) => u(f)) };
};

/** Fireflies in every colour of the glass. */
const motes: Generator = (p, ctx) => {
  const N = Math.round(num(p.count, 320) * ctx.tier.particles);
  const pos = new Float32Array(N * 3), seed = new Float32Array(N), tint = new Float32Array(N * 3);
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
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 } },
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
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(mix(vTint, vec3(1.0), 0.35) * 3.0, (1.0 - smoothstep(0.1, 0.5, d)) * vA);
        ${FINISH}
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return { object: points, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};

/** A small flock crossing the sunrise. Flat V shapes; they flap by scaling. */
const birds: Generator = (p) => {
  const N = num(p.count, 9);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([-1.5, 0.45, 0, 0, 0, 0.22, 0, 0, -0.22, 1.5, 0.45, 0, 0, 0, 0.22, 0, 0, -0.22], 3));
  g.setIndex([0, 1, 2, 3, 4, 5]);
  const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: str(p.color, "#2a1140"), side: THREE.DoubleSide, fog: false }), N);
  m.frustumCulled = false;
  const d = new THREE.Object3D();
  return {
    object: m,
    update: (f) => {
      if (f.still) { m.visible = false; return; }
      const lead = ((f.time * 0.016) % 1) * 460 - 230; // crosses the valley in about a minute
      for (let i = 0; i < N; i++) {
        const row = Math.ceil(i / 2), side = i % 2 ? -1 : 1;
        d.position.set(lead - row * 5.5, 86 + side * row * 2.2 + Math.sin(f.time * 0.5 + i) * 1.1, -118 + side * row * 3);
        d.scale.set(1.3, 1.3 * (0.35 + Math.abs(Math.sin(f.time * 5 + i * 1.4)) * 1.1), 1.3);
        d.updateMatrix();
        m.setMatrixAt(i, d.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    },
  };
};

export const JOURNEY_GENERATORS: Generators = { sky, terrain, trees, ridges, lake, path, stations, walker, haze, motes, birds, ...COMMON_GENERATORS };

export type { Built };
