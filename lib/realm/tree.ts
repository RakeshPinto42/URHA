/**
 * The Tree of Knowledge: URHA's emblem. Grown, not modelled, so it can be resized, recoloured or
 * regrown from the Studio. Its marks, each a parameter:
 *  - a braided trunk of strands spiralling into the crown (`braid`);
 *  - gold veins with light rising through them from the roots (`vein`, `pulse`);
 *  - turning rings of gold about the trunk, kin to the observatory's armillary (`halo`);
 *  - a crown that shimmers as wind passes over it, and leaves that fall and drift (`falling`).
 * The Grounds of Practice use the same generator as plain green trees, with all of that off.
 * Wind, shimmer, pulse and falling leaves all move in shaders, so animation costs no CPU.
 */
import * as THREE from "three";
import type { Generator } from "@/lib/cinema-engine/runtime";
import { at, merge, num, seeded, str, taper, type Geo } from "./kit";

type Tip = { at: THREE.Vector3; level: number };

function grow(start: THREE.Vector3, dir: THREE.Vector3, length: number, radius: number, level: number, max: number, rand: () => number, wood: Geo[], tips: Tip[]) {
  const pts = [start.clone()];
  const d = dir.clone();
  const stepLen = length / 3;
  for (let i = 0; i < 3; i++) {
    d.add(new THREE.Vector3(rand() - 0.5, (rand() - 0.5) * 0.5 + 0.05, rand() - 0.5).multiplyScalar(0.34)).normalize();
    pts.push(pts[i]!.clone().addScaledVector(d, stepLen));
  }
  const end = pts[3]!;
  const r1 = radius * 0.6;
  const steps = level < 2 ? 12 : 5;
  wood.push(taper(new THREE.CatmullRomCurve3(pts), radius, r1, steps, level < 2 ? 12 : level < 4 ? 6 : 4));
  if (level >= max) { tips.push({ at: end, level }); return; }
  const kids = level <= 1 ? 5 : 3;
  const offset = rand() * Math.PI * 2;
  for (let i = 0; i < kids; i++) {
    const az = offset + (i / kids) * Math.PI * 2 + rand() * 0.5;
    const out = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    // Near the trunk branches reach outward, so the crown spreads into a wide dome.
    const lift = level < 2 ? 0.2 + rand() * 0.25 : 0.34 + rand() * 0.4;
    const next = d.clone().multiplyScalar(level < 2 ? 0.2 : 0.42).add(out.multiplyScalar(1 - lift * 0.3)).add(new THREE.Vector3(0, lift, 0)).normalize();
    grow(end, next, length * (0.7 + rand() * 0.12), r1 * 0.72, level + 1, max, rand, wood, tips);
  }
  if (level >= 2) tips.push({ at: pts[2]!, level });
}

/** Strands that wind about one another from the roots to the crown. Returns the crown's base. */
function braid(strands: number, height: number, radius: number, turns: number, wood: Geo[]): THREE.Vector3 {
  for (let s = 0; s < strands; s++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const a = (s / strands) * Math.PI * 2 + t * turns * Math.PI * 2;
      const r = radius * 0.62 * (1 - 0.42 * t) * (1 + 0.25 * Math.sin(t * Math.PI));
      pts.push(new THREE.Vector3(Math.cos(a) * r, t * height, Math.sin(a) * r));
    }
    wood.push(taper(new THREE.CatmullRomCurve3(pts), radius * 0.55, radius * 0.4, 40, 14));
  }
  return new THREE.Vector3(0, height, 0);
}

/** The great roots, flowing out across the dais. */
function roots(radius: number, spread: number, count: number, rand: () => number, wood: Geo[]) {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.25;
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const reach = spread * (0.7 + rand() * 0.5);
    const pts = [
      out.clone().multiplyScalar(radius * 0.4).setY(radius * 2.1),
      out.clone().multiplyScalar(radius * 0.95).setY(radius * 0.8),
      out.clone().multiplyScalar(reach * 0.55).setY(radius * 0.12).add(new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(rand() * radius - radius / 2)),
      out.clone().multiplyScalar(reach).setY(-radius * 0.05),
    ];
    wood.push(taper(new THREE.CatmullRomCurve3(pts), radius * 0.42, radius * 0.07, 12, 8));
  }
}

/** Rings of gold, engraved with degrees, turning slowly about the trunk. */
function halo(radius: number, heights: number[], color: string) {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: 0.22, emissive: color, emissiveIntensity: 0.35 });
  const rings: THREE.Object3D[] = [];
  heights.forEach((y, i) => {
    const r = radius * (1.9 - i * 0.28);
    const ticks: Geo[] = [at(new THREE.TorusGeometry(r, 0.16, 6, 128).rotateX(Math.PI / 2))];
    for (let k = 0; k < 72; k++) {
      const a = (k / 72) * Math.PI * 2, big = k % 6 === 0;
      ticks.push(at(new THREE.BoxGeometry(0.12, 0.08, big ? 1.2 : 0.55).translate(0, 0, r + (big ? 0.6 : 0.3)), 0, 0, 0, a));
    }
    const ring = new THREE.Mesh(merge(ticks, null), gold);
    ring.position.y = y;
    ring.rotation.set((i - 1) * 0.16, 0, (i % 2 ? -1 : 1) * 0.1);
    rings.push(ring);
    g.add(ring);
  });
  return { group: g, rings };
}

/** Leaves let go of the crown and drift down, spinning. Computed wholly on the GPU. */
function fallingLeaves(count: number, crown: THREE.Vector3, spread: number, fall: number, color: string) {
  const blade = new THREE.PlaneGeometry(1.1, 1.8);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = blade.index;
  geo.setAttribute("position", blade.attributes.position!);
  geo.setAttribute("uv", blade.attributes.uv!);
  const rand = seeded(91);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) seeds.set([(rand() - 0.5) * 2, (rand() - 0.5) * 2, rand(), rand()], i * 4);
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geo.instanceCount = count;
  blade.dispose();
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uCrown: { value: crown }, uSpread: { value: spread }, uFall: { value: fall }, uColor: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */`
      attribute vec4 aSeed; uniform float uTime; uniform vec3 uCrown; uniform float uSpread; uniform float uFall; varying float vAlpha; varying float vShade;
      void main() {
        float period = 14.0 + aSeed.w * 10.0;
        float t = fract(uTime / period + aSeed.z);
        vec3 start = uCrown + vec3(aSeed.x * uSpread, -aSeed.w * 6.0, aSeed.y * uSpread);
        vec3 p = start + vec3(sin(t * 9.0 + aSeed.z * 20.0) * 4.0 + t * 10.0, -t * uFall, cos(t * 7.0 + aSeed.w * 20.0) * 3.0);
        float spin = t * 18.0 + aSeed.z * 40.0;
        mat3 r = mat3(cos(spin), 0.0, sin(spin), 0.0, 1.0, 0.0, -sin(spin), 0.0, cos(spin));
        mat3 tilt = mat3(1.0, 0.0, 0.0, 0.0, cos(spin * 0.7), -sin(spin * 0.7), 0.0, sin(spin * 0.7), cos(spin * 0.7));
        vec3 local = r * tilt * position;
        vShade = 0.65 + 0.35 * abs(cos(spin));
        vAlpha = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.85, t);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p + local, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; varying float vAlpha; varying float vShade;
      void main() {
        gl_FragColor = vec4(uColor * vShade * 1.6, vAlpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}

export const treeOfKnowledge: Generator = (p, ctx) => {
  const height = num(p.height, 42), radius = num(p.radius, 10);
  const rand = seeded(num(p.seed, 21));
  const wood: Geo[] = [], tips: Tip[] = [];
  const levels = ctx.tier.detail > 0.7 ? 5 : 4;
  const strands = Math.round(num(p.braid, 0));
  if (strands > 1) {
    const top = braid(strands, height * 0.95, radius, num(p.turns, 0.85), wood);
    grow(top, new THREE.Vector3(0, 1, 0), height * 0.62, radius * 0.72, 1, levels, rand, wood, tips);
  } else grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), height, radius, 0, levels, rand, wood, tips);
  roots(radius, num(p.rootSpread, 34), Math.round(num(p.roots, 11)), rand, wood);

  const time = { value: 0 };
  const bark = new THREE.MeshStandardMaterial({ color: str(p.bark, "#efe3cd"), roughness: 0.55, metalness: 0.15, envMapIntensity: 1.1 });
  const veinColor = new THREE.Color(str(p.vein, "#ffb84a"));
  const pulse = num(p.pulse, 0);
  // Gold runs through the bark in veins; with `pulse`, light rises through them from the roots.
  bark.onBeforeCompile = (shader) => {
    shader.uniforms.uVein = { value: veinColor };
    shader.uniforms.uTime = time;
    shader.uniforms.uPulse = { value: pulse };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTrunk;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTrunk = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTrunk; uniform vec3 uVein; uniform float uTime; uniform float uPulse;")
      .replace("#include <emissivemap_fragment>", /* glsl */`#include <emissivemap_fragment>
        float twist = atan(vTrunk.z, vTrunk.x);
        float vein = sin(vTrunk.y * 0.55 + sin(twist * 5.0 + vTrunk.y * 0.11) * 3.2);
        vein = max(smoothstep(0.965, 0.998, vein), smoothstep(0.975, 0.999, sin(twist * 9.0 - vTrunk.y * 0.42)) * 0.8);
        float rise = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(vTrunk.y * 0.11 - uTime * 1.3), 4.0);
        float glow = mix(1.0, rise * 2.4, uPulse);
        diffuseColor.rgb = mix(diffuseColor.rgb, uVein, vein * 0.85);
        totalEmissiveRadiance += uVein * vein * 1.3 * glow;`);
  };
  const trunk = new THREE.Mesh(merge(wood, 1 / 10), bark);
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const group = new THREE.Group();
  group.add(trunk);

  // Leaves: a small two-faced blade, thousands of times over.
  const perTip = Math.round(num(p.leavesPerTip, 64) * ctx.tier.particles);
  const usable = tips.filter((t) => t.level >= levels - 1 || t.level >= 3);
  const count = usable.length * perTip;
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.42, 0.8, 0.12, 0, 1.9, 0, -0.42, 0.8, 0.12], 3));
  leafGeo.setIndex([0, 1, 2, 0, 2, 3]);
  leafGeo.computeVertexNormals();
  const glowStrength = num(p.leafGlowStrength, 0.22);
  const leafMat = new THREE.MeshStandardMaterial({
    color: "#ffffff", roughness: 0.38, metalness: num(p.leafMetal, 0.55), side: THREE.DoubleSide,
    emissive: str(p.leafGlow, "#ff9e2c"), emissiveIntensity: glowStrength,
  });
  const shimmer = num(p.shimmer, 0);
  leafMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWind = time;
    shader.uniforms.uShimmer = { value: shimmer };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uWind; varying float vGust;")
      .replace("#include <begin_vertex>", /* glsl */`#include <begin_vertex>
        vec3 root = instanceMatrix[3].xyz;
        float phase = root.x * 0.13 + root.z * 0.17 + root.y * 0.07;
        // A gust crosses the crown: its leaves bend further, and catch the light.
        vGust = pow(0.5 + 0.5 * sin(root.x * 0.045 + root.z * 0.03 - uWind * 0.55), 6.0);
        transformed.x += sin(uWind * 1.1 + phase) * (0.12 + vGust * 0.22) * position.y;
        transformed.z += cos(uWind * 1.4 + phase * 1.6) * (0.1 + vGust * 0.16) * position.y;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uShimmer; varying float vGust;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 + vGust * uShimmer;");
  };
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, Math.max(count, 1));
  const a = new THREE.Color(str(p.leaf, "#ffc63d")), b = new THREE.Color(str(p.leafDeep, "#e8892a")), c = new THREE.Color(str(p.leafPale, "#fff0b0"));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), pos = new THREE.Vector3(), col = new THREE.Color();
  const blob = num(p.leafSpread, 13), size = num(p.leafSize, 2.3);
  const centre = new THREE.Vector3();
  let n = 0;
  for (const tip of usable) {
    centre.add(tip.at);
    for (let i = 0; i < perTip; i++) {
      const u = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1), r = blob * Math.cbrt(rand());
      pos.set(tip.at.x + Math.sin(v) * Math.cos(u) * r, tip.at.y + Math.cos(v) * r * 0.55, tip.at.z + Math.sin(v) * Math.sin(u) * r);
      e.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2);
      s.setScalar(size * (0.65 + rand() * 0.7));
      m.compose(pos, q.setFromEuler(e), s);
      leaves.setMatrixAt(n, m);
      const k = rand();
      leaves.setColorAt(n, col.copy(a).lerp(k < 0.5 ? b : c, Math.abs(k - 0.5) * 1.6));
      n += 1;
    }
  }
  if (usable.length) centre.divideScalar(usable.length);
  leaves.count = n;
  leaves.instanceMatrix.needsUpdate = true;
  // Thousands of leaves dominate a shadow pass, so only the top tier lets them cast.
  leaves.castShadow = ctx.tier.id === "high";
  leaves.receiveShadow = false;
  leaves.frustumCulled = false;
  group.add(leaves);

  // Fruit of light, hanging from the outer boughs.
  const fruitCount = Math.round(num(p.fruit, 110) * ctx.tier.particles);
  if (fruitCount > 0 && usable.length) {
    const fruit = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.75, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(str(p.fruitColor, "#ffe9b0")).multiplyScalar(2.6), toneMapped: false }), fruitCount);
    for (let i = 0; i < fruitCount; i++) {
      const tip = usable[Math.floor(rand() * usable.length)]!;
      pos.copy(tip.at).add(new THREE.Vector3((rand() - 0.5) * 7, -3 - rand() * 7, (rand() - 0.5) * 7));
      m.compose(pos, q.identity(), s.set(0.8, 1.5, 0.8).multiplyScalar(0.7 + rand() * 0.8));
      fruit.setMatrixAt(i, m);
    }
    fruit.frustumCulled = false;
    group.add(fruit);
  }

  let rings: THREE.Object3D[] = [];
  if (p.halo === true) {
    const h = halo(radius, [height * 0.32, height * 0.56, height * 0.8], str(p.haloColor, "#ffcf6a"));
    rings = h.rings;
    group.add(h.group);
  }

  let falling: ReturnType<typeof fallingLeaves> | null = null;
  const fallCount = Math.round(num(p.falling, 0) * ctx.tier.particles);
  if (fallCount > 0) {
    falling = fallingLeaves(fallCount, centre.clone(), blob * 3.2, centre.y + 4, str(p.leaf, "#ffc63d"));
    group.add(falling.mesh);
  }

  // A warm light within the crown, where the device can afford one.
  if (ctx.tier.pointLights && num(p.crownLight, 0) > 0) {
    const light = new THREE.PointLight(str(p.leafGlow, "#ff9e2c"), num(p.crownLight, 0), height * 2.6, 1.6);
    light.position.copy(centre).add(new THREE.Vector3(0, -6, 0));
    group.add(light);
  }

  return {
    object: group,
    update: (f) => {
      if (f.still) return;
      time.value += f.dt;
      rings.forEach((r, i) => { r.rotation.y += f.dt * (i % 2 ? -0.05 : 0.07); });
      if (falling) falling.mat.uniforms.uTime!.value = time.value;
    },
  };
};
