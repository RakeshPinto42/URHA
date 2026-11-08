/**
 * The architect's kit: the parts every building in the realm is made from, and the materials.
 *
 * Static parts merge into one mesh per material, and repeated parts are instanced, so a palace
 * of several hundred columns costs a handful of draw calls. Texture coordinates come from world
 * position, so marble keeps one scale across every surface it covers.
 *
 * No browser APIs, so everything here can be built and disposed in a test.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BuildContext } from "@/lib/cinema-engine/runtime";

export type Geo = THREE.BufferGeometry;

export const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : fallback);
export const str = (v: unknown, fallback: string) => (typeof v === "string" ? v : fallback);

/** Deterministic random numbers, so the world is the same each time it opens. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------- geometry helpers */

/** Moves a geometry: `y` is where its base sits only if the part was built from y = 0. */
export function at(g: Geo, x = 0, y = 0, z = 0, ry = 0, s: number | [number, number, number] = 1): Geo {
  const [sx, sy, sz] = typeof s === "number" ? [s, s, s] : s;
  return g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz),
  ));
}

/** A box resting on y. */
export const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0, ry = 0) =>
  at(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), x, y, z, ry);

/** A round drum resting on y. */
export const drum = (r: number, h: number, x = 0, y = 0, z = 0, seg = 48, rTop = r) =>
  at(new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0), x, y, z);

/** A turned shape, from [radius, height] points. */
export const lathe = (pts: [number, number][], seg = 32) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

/** Texture coordinates from position, along the face's main axis. */
export function worldUV(g: Geo, scale: number): Geo {
  const p = g.attributes.position!, n = g.attributes.normal!;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    uv[i * 2] = u * scale;
    uv[i * 2 + 1] = v * scale;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Many geometries as one. Nothing else may hold on to the parts afterwards. */
export function merge(parts: Geo[], uvScale: number | null = 1 / 14): Geo {
  const flat = parts.map((part) => {
    const g = part.index ? part.toNonIndexed() : part;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (uvScale !== null) worldUV(g, uvScale);
    for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    return g;
  });
  const out = mergeGeometries(flat, false);
  if (!out) throw new Error("merge: these parts could not be combined");
  parts.forEach((p) => p.dispose());
  flat.forEach((p) => p.dispose());
  return out;
}

export function solid(parts: Geo[], material: THREE.Material, opts: { uv?: number | null; cast?: boolean; receive?: boolean } = {}): THREE.Mesh {
  const mesh = new THREE.Mesh(merge(parts, opts.uv === undefined ? 1 / 14 : opts.uv), material);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  return mesh;
}

/** One shape many times: each entry is [x, y, z, rotation about y, scale]. */
export function repeated(geometry: Geo, material: THREE.Material, places: [number, number, number, number?, number?][], cast = true): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, places.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  places.forEach(([x, y, z, ry = 0, s = 1], i) => {
    m.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, ry), new THREE.Vector3(s, s, s));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

/* ---------------------------------------------------------- classical parts */

/** A fluted shaft with entasis, standing on y = 0, radius 1 and the given height. */
function shaft(h: number, flutes: number): Geo {
  const seg = flutes * 4;
  const g = new THREE.CylinderGeometry(0.86, 1, h, seg, 12, true).translate(0, h / 2, 0);
  const p = g.attributes.position!;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x), r = Math.hypot(x, z);
    const fall = 1 - 0.16 * (y / h) + 0.05 * Math.sin((y / h) * Math.PI);
    const groove = Math.pow(Math.abs(Math.cos((a * flutes) / 2)), 0.6);
    const k = (fall / Math.max(r, 0.001)) * (0.925 + 0.075 * groove);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** A complete column of radius 1 and height `h`: stone, with its gold collars returned apart. */
export function column(h: number, detail: number) {
  const flutes = detail > 0.7 ? 20 : 12;
  const seg = detail > 0.7 ? 24 : 12;
  const stone = merge([
    box(2.9, 0.5, 2.9),
    at(lathe([[1.42, 0], [1.42, 0.2], [1.2, 0.34], [1.3, 0.5], [1.12, 0.72], [1, 0.8]], seg), 0, 0.5),
    at(shaft(h - 3.5, flutes), 0, 1.25),
    at(lathe([[0.88, 0], [1.02, 0.18], [1.3, 0.8], [1.68, 1.45]], seg), 0, h - 2.25),
    box(3.5, 0.5, 3.5, 0, h - 0.8),
  ], 1 / 9);
  const gold = merge([
    at(new THREE.TorusGeometry(0.96, 0.09, 8, seg).rotateX(Math.PI / 2), 0, h - 2.35),
    at(new THREE.TorusGeometry(1.04, 0.07, 8, seg).rotateX(Math.PI / 2), 0, 1.3),
  ], null);
  return { stone, gold };
}

/** Columns at the given places, each `scale` wide: a colonnade, in two draw calls. */
export function colonnade(places: [number, number, number, number?, number?][], h: number, ctx: BuildContext, mats: Mats, group: THREE.Group) {
  const width = places[0]?.[4] ?? 1; // Instances scale whole, so the part is drawn shorter by as much.
  const { stone, gold } = column(h / width, ctx.tier.detail);
  group.add(repeated(stone, mats.marble, places), repeated(gold, mats.gold, places, false));
}

/** A moulded band: three stepped courses, resting on y. */
export function cornice(w: number, d: number, x: number, y: number, z: number, ry = 0, scale = 1): Geo[] {
  return [
    box(w, 0.8 * scale, d, x, y, z, ry),
    box(w + 1.2 * scale, 0.5 * scale, d + 1.2 * scale, x, y + 0.8 * scale, z, ry),
    box(w + 2.2 * scale, 0.7 * scale, d + 2.2 * scale, x, y + 1.3 * scale, z, ry),
  ];
}

/** Flights of steps climbing away from +z, centred on x, starting at height y. */
export function stairs(w: number, count: number, rise: number, run: number, x: number, y: number, z: number, ry = 0): Geo[] {
  const out: Geo[] = [];
  const c = Math.cos(ry), s = Math.sin(ry);
  for (let i = 0; i < count; i++) {
    const depth = (count - i) * run;
    const dz = -(i * run + depth / 2); // Each step starts further back and runs to the top.
    out.push(box(w, rise, depth, x + s * dz, y + i * rise, z + c * dz, ry));
  }
  return out;
}

/** A dome from a springing circle: returns the shell and its gold ribs. */
export function dome(r: number, rise: number, seg: number, ribs: number) {
  const curve: [number, number][] = [];
  for (let i = 0; i <= 18; i++) {
    const t = (i / 18) * (Math.PI / 2);
    curve.push([Math.max(Math.cos(t) * r, 0.001), Math.sin(t) * rise]);
  }
  const shell = lathe(curve, seg);
  const riblets: Geo[] = [];
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * Math.PI * 2;
    const pts = curve.slice(0, 17).map(([cr, y]) => new THREE.Vector3(Math.cos(a) * (cr + r * 0.008), y + r * 0.004, Math.sin(a) * (cr + r * 0.008)));
    riblets.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, r * 0.014, 5));
  }
  return { shell, ribs: riblets };
}

/** A portal wall with a round-headed opening, facing +z, resting on y = 0. */
export function archWall(w: number, h: number, openW: number, openH: number, depth: number): Geo {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h);
  shape.lineTo(-w / 2, h);
  shape.closePath();
  const hole = new THREE.Path();
  const spring = openH - openW / 2;
  hole.moveTo(-openW / 2, 0);
  hole.lineTo(-openW / 2, spring);
  hole.absarc(0, spring, openW / 2, Math.PI, 0, true);
  hole.lineTo(openW / 2, 0);
  hole.closePath();
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 }).translate(0, 0, -depth / 2);
}

/** A tube that narrows along a curve. */
export function taper(curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, steps: number, radial: number): Geo {
  const g = new THREE.TubeGeometry(curve, steps, 1, radial, false);
  const p = g.attributes.position!, n = g.attributes.normal!;
  for (let i = 0; i < p.count; i++) {
    const ring = Math.floor(i / (radial + 1));
    const r = r0 + (r1 - r0) * (ring / steps);
    p.setXYZ(i, p.getX(i) + n.getX(i) * (r - 1), p.getY(i) + n.getY(i) * (r - 1), p.getZ(i) + n.getZ(i) * (r - 1));
  }
  return g;
}

/** Foliage as real blades of leaf, each turned its own way, at thousands to the draw call. */
export function foliage(spots: [number, number, number, number][], colors: string[], seed = 3): THREE.InstancedMesh {
  const rand = seeded(seed);
  const blade = new THREE.BufferGeometry();
  blade.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.5, 0.75, 0.14, 0, 1.8, 0, -0.5, 0.75, 0.14], 3));
  blade.setIndex([0, 1, 2, 0, 2, 3]);
  blade.computeVertexNormals();
  const perSpot = 26;
  const mesh = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, side: THREE.DoubleSide }), spots.length * perSpot);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  const tints = colors.map((x) => new THREE.Color(x));
  let n = 0;
  for (const [x, y, z, r] of spots) for (let i = 0; i < perSpot; i++) {
    v.set(x + (rand() - 0.5) * r * 2, y + (rand() - 0.5) * r * 1.3, z + (rand() - 0.5) * r * 2);
    e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
    m.compose(v, q.setFromEuler(e), s.setScalar(0.5 + rand() * 0.6));
    mesh.setMatrixAt(n, m);
    mesh.setColorAt(n, c.copy(tints[Math.floor(rand() * tints.length)]!));
    n += 1;
  }
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

/* ---------------------------------------------------------- materials */

export type Mats = {
  marble: THREE.MeshStandardMaterial;
  polished: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  crystal: THREE.MeshPhysicalMaterial;
  dark: THREE.MeshStandardMaterial;
};

function texturise(m: THREE.MeshStandardMaterial, name: string, ctx: BuildContext, repeat = 1, withRoughness = true) {
  const a = ctx.assets;
  if (!a) return;
  const put = (slot: "map" | "normalMap" | "roughnessMap", file: string, data: boolean) => {
    const src = `/cinema/assets/${name}-${file}.webp`;
    a.loadTexture(src, { data }).then((t) => {
      t.repeat.set(repeat, repeat);
      m[slot] = t;
      m.needsUpdate = true;
      ctx.invalidate();
    }, (e) => ctx.assetFailed?.(src, e instanceof Error ? e.message : String(e)));
  };
  put("map", "diff", false);
  put("normalMap", "nor", true);
  if (withRoughness) put("roughnessMap", "rough", true);
}

/** One set for the whole scene: shared materials are what make merged meshes cheap. */
export function materials(ctx: BuildContext): Mats {
  const held = ctx.state.__mats as Mats | undefined;
  if (held) return held;
  const marble = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, metalness: 0, envMapIntensity: 0.9 });
  const polished = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, metalness: 0, envMapIntensity: 1.3 });
  const rock = new THREE.MeshStandardMaterial({ color: "#c9bfb2", roughness: 1, metalness: 0 });
  texturise(marble, "white-marble", ctx);
  texturise(polished, "marble-floor", ctx);
  texturise(rock, "marble-cliff-01", ctx);
  rock.normalScale.set(1.2, 1.2);
  const mats: Mats = {
    marble, polished, rock,
    gold: new THREE.MeshStandardMaterial({ color: "#ffc35c", metalness: 1, roughness: 0.26, envMapIntensity: 1.5 }),
    bronze: new THREE.MeshStandardMaterial({ color: "#a8713a", metalness: 0.95, roughness: 0.38, envMapIntensity: 1.2 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: "#d6ecff", metalness: 0, roughness: 0.04, transparent: true, opacity: 0.62, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.4, envMapIntensity: 2.4, emissive: "#6ea8ff", emissiveIntensity: 0.25 }),
    dark: new THREE.MeshStandardMaterial({ color: "#0f1533", metalness: 0.2, roughness: 0.6 }),
  };
  ctx.state.__mats = mats;
  return mats;
}

/** A self-lit material, bright enough to catch the bloom. */
export const glow = (color: string, strength: number) => {
  const c = new THREE.Color(color).multiplyScalar(strength);
  const m = new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  return m;
};

/** Three's standard ending for a custom shader: right with or without post-processing. */
export const FINISH = /* glsl */`#include <tonemapping_fragment>
#include <colorspace_fragment>`;

export const NOISE = /* glsl */`
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }`;

/* ---------------------------------------------------------- hover and reveal */

/** Eases a number towards a goal, frame-rate independently. */
export const approach = (value: number, goal: number, dt: number, rate = 5) => value + (goal - value) * (1 - Math.exp(-dt * rate));
