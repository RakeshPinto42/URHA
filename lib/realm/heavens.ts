/**
 * What surrounds the buildings: the celestial sky, the sea of cloud, standing clouds, shafts of
 * light you can walk through, and the distant peaks. Colours stay in the scene file, so the
 * Studio can change the time of day without touching this code.
 */
import * as THREE from "three";
import type { Generator } from "@/lib/cinema-engine/runtime";
import { FINISH, NOISE, num, seeded, str } from "./kit";

const vec3 = (v: unknown, fallback: [number, number, number]) =>
  new THREE.Vector3(...(Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : fallback)).normalize();

/* ---------------------------------------------------------- the sky */

export const celestialSky: Generator = (p) => {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uHorizon: { value: new THREE.Color(str(p.horizon, "#ffe6b8")) },
      uLow: { value: new THREE.Color(str(p.low, "#ffb37a")) },
      uMid: { value: new THREE.Color(str(p.mid, "#e78fb2")) },
      uHigh: { value: new THREE.Color(str(p.high, "#6d7be6")) },
      uZenith: { value: new THREE.Color(str(p.zenith, "#141a5e")) },
      uSun: { value: vec3(p.sun, [0.48, 0.33, -1]) },
      uSunPower: { value: num(p.sunPower, 10) },
      uStars: { value: num(p.stars, 0.7) },
      uMeteors: { value: num(p.meteors, 0) },
      uPlanet: { value: num(p.planet, 1) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uHorizon; uniform vec3 uLow; uniform vec3 uMid; uniform vec3 uHigh; uniform vec3 uZenith; uniform vec3 uSun;
      uniform float uSunPower; uniform float uStars; uniform float uPlanet; uniform float uTime; uniform float uMeteors; varying vec3 vDir;
      ${NOISE}
      vec3 planet(vec3 d, vec3 c, float r, vec3 tint, vec3 base) {
        vec3 o = cross(c, vec3(0.0, 1.0, 0.0)); o = normalize(o); vec3 u = cross(o, c);
        vec2 q = vec2(dot(d, o), dot(d, u)) / r;
        float l = length(q);
        vec3 col = base;
        if (dot(d, c) > 0.0) {
          // The ring passes behind the planet, then in front of it.
          vec2 rq = vec2(q.x * cos(0.4) + q.y * sin(0.4), (-q.x * sin(0.4) + q.y * cos(0.4)) * 3.2);
          float rl = length(rq);
          float ring = smoothstep(1.35, 1.42, rl) * (1.0 - smoothstep(2.05, 2.15, rl)) * (0.45 + 0.4 * sin(rl * 38.0) * sin(rl * 11.0));
          if (rq.y > 0.0 || l > 1.0) col = mix(col, tint * 1.1, ring * 0.6);
          if (l < 1.0) {
            vec3 n = vec3(q, sqrt(1.0 - l * l));
            float lit = clamp(dot(n, normalize(vec3(0.6, -0.5, 0.45))), 0.0, 1.0);
            vec3 surface = tint * (0.1 + 1.15 * lit) * (0.82 + 0.3 * sin(q.y * 14.0 + sin(q.x * 3.0)));
            col = mix(col, surface, smoothstep(1.0, 0.97, l) * 0.74);
          }
          col += tint * 0.12 * smoothstep(1.5, 1.0, l) * (1.0 - smoothstep(0.98, 1.0, l));
        }
        return col;
      }
      void main() {
        vec3 d = normalize(vDir);
        float h = max(d.y, 0.0);
        vec3 col = mix(uHorizon, uLow, smoothstep(0.0, 0.1, h));
        col = mix(col, uMid, smoothstep(0.08, 0.26, h));
        col = mix(col, uHigh, smoothstep(0.22, 0.5, h));
        col = mix(col, uZenith, smoothstep(0.42, 0.86, h));

        // The cosmos shows through the upper sky: a nebula, then stars.
        float cosmos = smoothstep(0.26, 0.62, h) * uStars;
        vec2 np = vec2(atan(d.x, d.z) * 1.6, h * 3.2);
        float nebula = fbm(np + fbm(np * 1.4 + 3.0) * 1.2);
        col += cosmos * (vec3(0.42, 0.14, 0.6) * smoothstep(0.42, 0.8, nebula) + vec3(0.08, 0.34, 0.55) * smoothstep(0.5, 0.86, 1.0 - nebula));
        vec2 g = vec2(atan(d.x, d.z) * 130.0, d.y * 210.0);
        vec2 cell = floor(g);
        float star = step(0.985, hash(cell)) * smoothstep(0.5, 0.05, length(fract(g) - 0.5));
        col += star * cosmos * (1.2 + 1.8 * hash(cell + 3.0));

        // Long cirrus lit from below.
        vec2 sp = vec2(d.x / (h + 0.25), h * 8.0);
        float streak = smoothstep(0.44, 0.78, fbm(sp * vec2(1.4, 2.4) + vec2(uTime * 0.01, 0.0)));
        col = mix(col, mix(vec3(1.0, 0.86, 0.66), vec3(1.0, 0.62, 0.72), smoothstep(0.04, 0.32, h)), streak * 0.62 * smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.34, 0.56, h)));

        // Now and then a meteor crosses the upper sky.
        if (uMeteors > 0.0) {
          for (int i = 0; i < 3; i++) {
            float fi = float(i);
            float cycle = 7.0 + fi * 3.0;
            float t = mod(uTime + fi * 4.1, cycle) / 1.3;
            float k = floor((uTime + fi * 4.1) / cycle);
            vec2 start = vec2(hash(vec2(k, fi)) * 3.0 - 1.5, 0.55 + hash(vec2(fi, k)) * 0.3);
            vec2 dir = normalize(vec2(-0.8, -0.35));
            vec2 q = vec2(atan(d.x, -d.z), d.y) - (start + dir * t * 0.9);
            float along = dot(q, dir), across = abs(q.x * dir.y - q.y * dir.x);
            float trail = smoothstep(0.0025, 0.0, across) * smoothstep(-0.32, 0.0, along) * step(along, 0.0) * step(t, 1.0);
            col += vec3(0.85, 0.9, 1.0) * trail * (1.0 + along * 3.0) * 2.4 * uMeteors;
          }
        }

        if (uPlanet > 0.0) {
          col = planet(d, normalize(vec3(-0.44, 0.5, -0.92)), 0.052, vec3(0.92, 0.78, 1.0), col);
          col = planet(d, normalize(vec3(0.15, 0.82, -0.62)), 0.035, vec3(0.8, 0.9, 1.0), col);
        }

        // The sun: a wide warm bloom, and a disc bright enough for the light shafts to catch.
        float s = max(dot(d, uSun), 0.0);
        col += vec3(1.0, 0.72, 0.42) * (pow(s, 6.0) * 0.16 + pow(s, 40.0) * 0.28 + pow(s, 300.0) * 0.7);
        col += vec3(1.0, 0.93, 0.78) * uSunPower * smoothstep(0.99925, 0.99965, s);

        // Below the horizon there is only cloud light.
        col = mix(col, uHorizon * 1.04, smoothstep(0.02, -0.04, d.y));
        gl_FragColor = vec4(col, 1.0);
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), mat);
  mesh.scale.setScalar(num(p.radius, 1800));
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return { object: mesh, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};

/* ---------------------------------------------------------- the sea of cloud */

export const cloudSea: Generator = (p) => {
  const mat = new THREE.ShaderMaterial({
    fog: false, depthWrite: false, transparent: true,
    uniforms: {
      uLit: { value: new THREE.Color(str(p.lit, "#fff3df")) }, uShade: { value: new THREE.Color(str(p.shade, "#c9a3c4")) },
      uFar: { value: new THREE.Color(str(p.far, "#ffe6b8")) }, uSun: { value: vec3(p.sun, [0.48, 0.33, -1]) }, uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uFar; uniform vec3 uSun; uniform float uTime; varying vec3 vWorld;
      ${NOISE}
      float cloud(vec2 p) { return fbm(p + 0.9 * vec2(fbm(p * 0.7 + 4.0), fbm(p * 0.7 + 9.0))); }
      void main() {
        vec2 p = vWorld.xz * 0.0046 + vec2(uTime * 0.006, uTime * 0.0025);
        float a = cloud(p), b = cloud(p + uSun.xz * 0.05);
        float lit = clamp(0.5 + (a - b) * 7.0, 0.0, 1.0);
        vec3 col = mix(uShade, uLit, smoothstep(0.1, 0.9, lit) * 0.7 + smoothstep(0.32, 0.68, a) * 0.45);
        vec3 view = normalize(vWorld - cameraPosition);
        col += vec3(1.0, 0.76, 0.46) * pow(max(dot(view, normalize(vec3(uSun.x, 0.1, uSun.z))), 0.0), 18.0) * 0.5;
        float dist = length(vWorld.xz - cameraPosition.xz);
        col = mix(col, uFar, smoothstep(280.0, 1300.0, dist));
        gl_FragColor = vec4(col, smoothstep(1800.0, 1450.0, dist));
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(num(p.radius, 1800), 64).rotateX(-Math.PI / 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -5;
  return { object: mesh, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};

/** A soft puff of cloud with its lighting baked into the green channel. Generated, not downloaded. */
function puffTexture(size = 160): THREE.DataTexture {
  const rand = seeded(11);
  const blobs = Array.from({ length: 16 }, () => {
    const a = rand() * Math.PI * 2, r = rand() * 0.27;
    return { x: 0.5 + Math.cos(a) * r, y: 0.47 + Math.sin(a) * r * 0.62, s: 0.1 + rand() * 0.13 };
  });
  const density = (x: number, y: number) => {
    let d = 0;
    for (const b of blobs) d += Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.s * b.s));
    return Math.min(d * 0.75, 1.4);
  };
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const x = i / size, y = j / size;
    const d = density(x, y);
    const edge = Math.min(Math.min(x, 1 - x), Math.min(y, 1 - y)) * 7;
    const alpha = Math.min(Math.max((d - 0.2) / 0.5, 0), 1) * Math.min(edge, 1);
    const lit = Math.min(Math.max(0.55 + (d - density(x + 0.07, y + 0.1)) * 0.85, 0), 1);
    data.set([255, lit * 255, 255, alpha * 255], (j * size + i) * 4);
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** Standing clouds that always face the camera. They are lit, sorted by size, and cheap. */
export const clouds: Generator = (p, ctx) => {
  const count = Math.round(num(p.count, 360) * ctx.tier.particles);
  const inner = num(p.inner, 190), outer = num(p.outer, 900), low = num(p.low, -70), high = num(p.high, 8);
  const clear = num(p.clear, 300);
  const rand = seeded(num(p.seed, 5));
  const geo = new THREE.InstancedBufferGeometry();
  const plane = new THREE.PlaneGeometry(1, 1);
  geo.index = plane.index;
  geo.setAttribute("position", plane.attributes.position!);
  geo.setAttribute("uv", plane.attributes.uv!);
  const list = Array.from({ length: count }, () => {
    let a = rand() * Math.PI * 2;
    const t = Math.pow(rand(), 0.7), r = inner + (outer - inner) * t;
    // Nothing stands between the viewpoint and the court: such a cloud moves out to the side.
    if (Math.sin(a) > 0 && Math.abs(Math.cos(a) * r) < clear) a += Math.cos(a) >= 0 ? -1.4 : 1.4;
    return { x: Math.cos(a) * r, y: low + (high - low) * rand() * (0.4 + t * 0.6), z: Math.sin(a) * r, s: (60 + rand() * 110) * (1 + t * 1.6), seed: rand() * 100 };
  }).sort((a, b) => b.s - a.s);
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((c) => [c.x, c.y, c.z])), 3));
  geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(new Float32Array(list.flatMap((c) => [c.s, c.seed])), 2));
  geo.instanceCount = count;
  const texture = puffTexture();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: {
      uMap: { value: texture }, uTime: { value: 0 },
      uLit: { value: new THREE.Color(str(p.lit, "#fff6e6")) }, uShade: { value: new THREE.Color(str(p.shade, "#d4a4bd")) }, uFar: { value: new THREE.Color(str(p.far, "#ffe0b0")) },
      uOpacity: { value: num(p.opacity, 0.92) },
    },
    vertexShader: /* glsl */`
      attribute vec3 aOffset; attribute vec2 aScale; uniform float uTime; varying vec2 vUv; varying float vFar;
      void main() {
        vUv = uv;
        vec3 c = aOffset; c.x += sin(uTime * 0.012 + aScale.y) * 14.0 + uTime * 0.25; c.z += cos(uTime * 0.01 + aScale.y) * 10.0;
        vec4 mv = viewMatrix * vec4(c, 1.0);
        float dist = -mv.z;
        vFar = smoothstep(260.0, 1150.0, dist);
        mv.xy += position.xy * aScale.x * vec2(1.7, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uFar; uniform float uOpacity; varying vec2 vUv; varying float vFar;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        vec3 col = mix(uShade, uLit, smoothstep(0.25, 0.8, t.g));
        col = mix(col, uFar, vFar * 0.82);
        gl_FragColor = vec4(col, t.a * uOpacity);
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  return { object: mesh, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; }, dispose: () => texture.dispose() };
};

/* ---------------------------------------------------------- shafts of light */

/** Soft blades of light in the air: volumetric in effect, a few transparent quads in cost. */
export const lightShafts: Generator = (p, ctx) => {
  const count = Math.max(2, Math.round(num(p.count, 10) * Math.max(ctx.tier.detail, 0.6)));
  const length = num(p.length, 90), width = num(p.width, 12), spread = num(p.spread, 60);
  const rand = seeded(num(p.seed, 3));
  const tilt = num(p.tilt, 0.5);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.PlaneGeometry(width * (0.6 + rand() * 0.8), length, 1, 1).translate(0, -length / 2, 0);
    const seed = rand() * 10;
    g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(g.attributes.position!.count).fill(seed), 1));
    g.rotateZ(tilt).rotateY(rand() * 0.5 - 0.25);
    g.translate((i / (count - 1) - 0.5) * spread, 0, (rand() - 0.5) * num(p.depth, 20));
    parts.push(g);
  }
  const positions: number[] = [], uvs: number[] = [], seeds: number[] = [], index: number[] = [];
  parts.forEach((g, n) => {
    const base = n * 4;
    positions.push(...(g.attributes.position!.array as Float32Array));
    uvs.push(...(g.attributes.uv!.array as Float32Array));
    seeds.push(...(g.attributes.aSeed!.array as Float32Array));
    index.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    g.dispose();
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geo.setIndex(index);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color(str(p.color, "#ffdca0")) }, uStrength: { value: num(p.strength, 0.3) }, uTime: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float aSeed; varying vec2 vUv; varying float vSeed;
      void main() { vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uStrength; uniform float uTime; varying vec2 vUv; varying float vSeed;
      void main() {
        float across = smoothstep(0.0, 0.42, vUv.x) * smoothstep(1.0, 0.58, vUv.x);
        float along = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.8, vUv.y) * (0.45 + 0.55 * vUv.y);
        float breath = 0.8 + 0.2 * sin(uTime * 0.3 + vSeed * 6.0);
        gl_FragColor = vec4(uColor, across * along * breath * uStrength);
        ${FINISH}
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  return { object: mesh, update: (f) => { if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};

/* ---------------------------------------------------------- the far country */

/** Crystal mountains on the edge of the world, seen through haze. */
export const farPeaks: Generator = (p, ctx) => {
  const rand = seeded(num(p.seed, 8));
  const count = Math.round(num(p.count, 90) * ctx.tier.detail);
  const radius = num(p.radius, 1050);
  const base = new THREE.ConeGeometry(1, 1, 5, 1).translate(0, 0.5, 0);
  const mat = new THREE.MeshBasicMaterial({ color: str(p.color, "#d9b7cf"), fog: false });
  const mesh = new THREE.InstancedMesh(base, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const color = new THREE.Color(), near = new THREE.Color(str(p.color, "#d9b7cf")), far = new THREE.Color(str(p.far, "#ffe6b8"));
  for (let i = 0; i < count; i++) {
    const a = rand() * Math.PI * 2, r = radius * (0.85 + rand() * 0.3);
    const h = 90 + rand() * rand() * 340, w = h * (0.22 + rand() * 0.2);
    e.set((rand() - 0.5) * 0.14, rand() * 6, (rand() - 0.5) * 0.14);
    m.compose(new THREE.Vector3(Math.cos(a) * r, -60, Math.sin(a) * r), q.setFromEuler(e), new THREE.Vector3(w, h, w));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, color.copy(near).lerp(far, 0.25 + rand() * 0.5));
  }
  mesh.frustumCulled = false;
  return { object: mesh };
};

/* ---------------------------------------------------------- life in the air */

/** Birds wheeling in a slow circle: the realm is inhabited. Moved on the GPU. */
export const flock: Generator = (p, ctx) => {
  const count = Math.max(3, Math.round(num(p.count, 14) * Math.max(ctx.tier.particles, 0.5)));
  const wing = new THREE.BufferGeometry();
  wing.setAttribute("position", new THREE.Float32BufferAttribute([-1.6, 0, 0.2, 0, 0, -0.5, 0, 0, 0.9, 1.6, 0, 0.2, 0, 0, -0.5, 0, 0, 0.9], 3));
  wing.setAttribute("aSide", new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0], 1));
  wing.setIndex([0, 1, 2, 3, 2, 1]);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = wing.index;
  geo.setAttribute("position", wing.attributes.position!);
  geo.setAttribute("aSide", wing.attributes.aSide!);
  const rand = seeded(num(p.seed, 4));
  geo.setAttribute("aBird", new THREE.InstancedBufferAttribute(new Float32Array(Array.from({ length: count }, () => [rand() * 6.28, (rand() - 0.5) * 2, rand(), rand()]).flat()), 4));
  geo.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uRadius: { value: num(p.radius, 260) }, uHeight: { value: num(p.height, 150) }, uSpeed: { value: num(p.speed, 0.05) }, uColor: { value: new THREE.Color(str(p.color, "#fffaf0")) }, uSize: { value: num(p.size, 2.2) } },
    vertexShader: /* glsl */`
      attribute float aSide; attribute vec4 aBird; uniform float uTime; uniform float uRadius; uniform float uHeight; uniform float uSpeed; uniform float uSize; varying float vShade;
      void main() {
        float a = aBird.x + uTime * uSpeed * (0.9 + aBird.z * 0.2);
        float r = uRadius * (0.86 + aBird.w * 0.28);
        vec3 c = vec3(cos(a) * r, uHeight + aBird.y * 18.0 + sin(uTime * 0.4 + aBird.x) * 6.0, sin(a) * r);
        vec3 fwd = normalize(vec3(-sin(a), 0.0, cos(a)));
        vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
        float flap = sin(uTime * (5.0 + aBird.z * 2.0) + aBird.x * 9.0);
        vec3 lp = position * uSize;
        lp.y += abs(aSide) * flap * 1.3 * uSize;
        vec3 p = c + side * lp.x + vec3(0.0, lp.y, 0.0) + fwd * lp.z;
        vShade = 0.75 + 0.25 * flap;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vShade;
      void main() { gl_FragColor = vec4(uColor * vShade, 1.0);
        ${FINISH}
      }`,
  });
  wing.dispose();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { object: mesh, update: (f) => { mesh.visible = !f.still; if (!f.still) mat.uniforms.uTime!.value += f.dt; } };
};
