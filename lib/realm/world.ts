/**
 * The Realm of Wisdom: the floating court, the crescent palace, three gateways, the glowing
 * paths and the islands of the sky. Everything is placed by the scene file, so the Studio can
 * move a gateway and the camera, the paths and the panels follow.
 */
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Built, Frame, Generator } from "@/lib/cinema-engine/runtime";
import type { DestinationId } from "./destinations";
import { GATE_SPEC } from "./gate-spec";
import {
  FINISH, NOISE, approach, archWall, at, box, colonnade, cornice, dome, drum, foliage, glow, lathe, materials, merge, num, repeated, seeded, solid, stairs, str, type Geo,
} from "./kit";

/* ---------------------------------------------------------- land */

/** Rock tapering away beneath a platform, roughened so that no two ledges match. */
function underside(radius: number, depth: number, seed: number, seg = 72): Geo {
  const rand = seeded(seed);
  const profile: [number, number][] = [[radius, 0], [radius * 0.97, -depth * 0.06], [radius * 0.82, -depth * 0.2], [radius * 0.66, -depth * 0.42], [radius * 0.42, -depth * 0.68], [radius * 0.16, -depth * 0.9], [0.1, -depth]];
  const g = lathe(profile, seg);
  const stretched = new THREE.LatheGeometry(new THREE.CatmullRomCurve3(profile.map(([r, y]) => new THREE.Vector3(r, y, 0))).getPoints(26).map((v) => new THREE.Vector2(Math.max(v.x, 0.01), v.y)), seg);
  g.dispose();
  const p = stretched.attributes.position!;
  const bumps = Array.from({ length: 9 }, () => ({ f: 1 + Math.floor(rand() * 9), a: rand() * 6.28, h: rand() * 0.09 + 0.02 }));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > -radius * 0.01) continue;
    const a = Math.atan2(z, x), t = -y / depth;
    let k = 1;
    for (const b of bumps) k += Math.sin(a * b.f + b.a + t * 7 * b.h * 10) * b.h * Math.min(t * 3, 1);
    p.setXYZ(i, x * k, y + Math.sin(a * 13 + t * 9) * radius * 0.02, z * k);
  }
  stretched.computeVertexNormals();
  return stretched;
}

/** The court: marble floor, gold inlay, the balustrade and the rock beneath. */
export const court: Generator = (p, ctx) => {
  const r = num(p.radius, 200);
  const mats = materials(ctx);
  const g = new THREE.Group();
  const top = solid([at(new THREE.CircleGeometry(r, 96).rotateX(-Math.PI / 2))], mats.polished, { uv: 1 / 26, cast: false });
  const rock = solid([underside(r, r * 1.05, 4)], mats.rock, { uv: 1 / 40 });
  g.add(top, rock);

  const rings = num(p.rings, 4);
  const inlay: Geo[] = [];
  for (let i = 0; i < rings; i++) {
    const radius = 40 + i * ((r - 60) / rings);
    inlay.push(at(new THREE.RingGeometry(radius, radius + (i % 2 ? 0.5 : 1), 128).rotateX(-Math.PI / 2), 0, 0.03));
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    inlay.push(at(new THREE.PlaneGeometry(0.5, r - 44).rotateX(-Math.PI / 2).translate(0, 0, (r + 40) / 2), 0, 0.03, 0, a));
  }
  g.add(solid(inlay, mats.gold, { uv: null, cast: false }));

  // The balustrade.
  const count = Math.round(((r * Math.PI * 2) / 3.2) * ctx.tier.detail);
  const baluster = lathe([[0.42, 0], [0.42, 0.14], [0.2, 0.3], [0.5, 1.15], [0.2, 2.2], [0.34, 2.36], [0.34, 2.5]], 8);
  g.add(repeated(baluster, mats.marble, Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return [Math.cos(a) * (r - 1.5), 0, Math.sin(a) * (r - 1.5)] as [number, number, number];
  })));
  g.add(solid([
    at(new THREE.TorusGeometry(r - 1.5, 0.55, 6, 160).rotateX(Math.PI / 2).scale(1, 0.55, 1), 0, 2.7),
    at(new THREE.TorusGeometry(r - 1.5, 0.45, 6, 160).rotateX(Math.PI / 2).scale(1, 0.5, 1), 0, 0.2),
  ], mats.marble, { uv: 1 / 14 }));
  return { object: g };
};

/** The stepped dais the tree rises from. */
/**
 * The stepped mount the tree rises from. With tall terraces and a grand stair it lifts the tree
 * above the gateways in front of it, so the way to wisdom is a climb, and nothing hides the trunk.
 */
export const dais: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const r = num(p.radius, 44), steps = Math.round(num(p.steps, 5)), rise = num(p.rise, 1.1), inset = num(p.inset, 3.4);
  const parts: Geo[] = [], gold: Geo[] = [];
  for (let i = 0; i < steps; i++) {
    const radius = r - i * inset;
    parts.push(drum(radius, rise, 0, i * rise, 0, 96));
    gold.push(at(new THREE.TorusGeometry(radius - 0.05, rise > 2 ? 0.22 : 0.1, 6, 128).rotateX(Math.PI / 2), 0, (i + 1) * rise));
  }
  const height = steps * rise;
  const stair = num(p.stair, 0);
  if (stair > 0) {
    // A straight flight up the front, from the court to the summit, with gold-capped cheeks.
    const count = Math.round(height / 1.05), run = (r - (r - (steps - 1) * inset) + 4) / count;
    parts.push(...stairs(stair, count, height / count, run, 0, 0, r + 2));
    for (const side of [-1, 1]) {
      const x = side * (stair / 2 + 1.6);
      for (let i = 0; i < count; i += 4) {
        const z = r + 2 - i * run - run * 2, y = i * (height / count);
        parts.push(box(3, 2.4, run * 4 + 0.1, x, y, z));
        gold.push(box(3.2, 0.25, run * 4 + 0.1, x, y + 2.4, z));
      }
    }
  }
  const g = new THREE.Group();
  g.add(solid(parts, mats.marble), solid(gold, mats.gold, { uv: null, cast: false }));
  return { object: g };
};

/** Mirror finish on a floor. Costs a second render, so only the highest tier has it. */
export const mirrorFloor: Generator = (p, ctx) => {
  const group = new THREE.Group();
  const size = ctx.tier.mirror;
  if (size === 0) return { object: group };
  const r = num(p.radius, 150);
  const geo = p.shape === "rect" ? new THREE.PlaneGeometry(num(p.width, 90), num(p.length, 300)) : new THREE.CircleGeometry(r, 64);
  const mirror = new Reflector(geo, {
    textureWidth: Math.round(1024 * size * 2), textureHeight: Math.round(576 * size * 2), clipBias: 0.002, multisample: 0,
    shader: {
      name: "MirrorFloor",
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uStrength: { value: num(p.strength, 0.5) } },
      vertexShader: /* glsl */`
        uniform mat4 textureMatrix; varying vec4 vProj; varying vec3 vWorld;
        void main() { vProj = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; uniform float uStrength; varying vec4 vProj; varying vec3 vWorld;
        void main() {
          vec3 view = normalize(cameraPosition - vWorld);
          float f = 0.12 + 0.88 * pow(1.0 - clamp(view.y, 0.0, 1.0), 4.0);
          vec2 uv = vProj.xy / vProj.w;
          vec3 c = texture2D(tDiffuse, uv).rgb;
          gl_FragColor = vec4(c, clamp(f * uStrength, 0.0, 1.0));
          ${FINISH}
        }`,
    },
  });
  (mirror.material as THREE.Material).transparent = true;
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = num(p.y, 0.05);
  mirror.renderOrder = -1;
  group.add(mirror);
  return { object: group, dispose: () => mirror.dispose() };
};

/* ---------------------------------------------------------- the palace */

/** A pavilion: a block, a drum, a great ribbed dome and a crystal spire. */
function pavilion(x: number, z: number, y: number, w: number, h: number, r: number, stone: Geo[], gold: Geo[], glass: Geo[]) {
  stone.push(box(w, h, w, x, y, z), ...cornice(w + 2, w + 2, x, y + h, z, 0, 1.4));
  const top = y + h + 2;
  stone.push(box(w * 0.86, 6, w * 0.86, x, top, z), drum(r + 2, 3, x, top + 6, z, 64), drum(r, r * 0.55, x, top + 9, z, 64), drum(r + 1.6, 2, x, top + 9 + r * 0.55, z, 64));
  const spring = top + 11 + r * 0.55;
  const d = dome(r, r * 1.2, 72, 20);
  gold.push(at(d.shell, x, spring, z));
  for (const rib of d.ribs) stone.push(at(rib, x, spring, z));
  const crown = spring + r * 1.2;
  stone.push(drum(r * 0.2, r * 0.26, x, crown - r * 0.04, z, 16));
  gold.push(at(dome(r * 0.2, r * 0.22, 24, 1).shell, x, crown + r * 0.22, z), at(new THREE.SphereGeometry(r * 0.05, 16, 12), x, crown + r * 0.48, z));
  glass.push(at(new THREE.ConeGeometry(r * 0.04, r * 0.5, 6).translate(0, r * 0.25, 0), x, crown + r * 0.5, z));
}

/** The crescent palace. It stands behind the tree, so its two great domes frame the crown. */
export const palace: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const g = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [], glass: Geo[] = [], rock: Geo[] = [];
  const base = num(p.base, 30), span = num(p.span, 230);

  // The terrace and the rock it stands on.
  stone.push(box(span * 2 + 240, base - 4, 200, 0, 0, -36), ...cornice(span * 2 + 240, 200, 0, base - 4, -36, 0, 2));
  stone.push(box(span * 2 + 150, 10, 150, 0, base, -56));
  rock.push(at(underside(310, 320, 9), 0, 0, -36, 0, [1.25, 1, 0.5]));

  // The grand staircase, climbing to the terrace, with landings.
  stone.push(...stairs(120, Math.round(base), 1, 2.1, 0, 0, 104));
  stone.push(box(12, base + 5, 66, -66, 0, 92 - 16), box(12, base + 5, 66, 66, 0, 92 - 16));
  for (const x of [-66, 66]) {
    stone.push(drum(3.4, 5, x, base + 5, 106 - 44, 24));
    gold.push(at(lathe([[3.6, 0], [4.6, 1.4], [3, 2.4], [0.1, 2.6]], 24), x, base + 10, 106 - 44));
  }

  // The central gallery behind the tree.
  const floor = base + 10;
  const cols: [number, number, number, number?, number?][] = [];
  const colH = 54, colR = 2.5;
  const n = Math.round(30 * Math.max(ctx.tier.detail, 0.7));
  for (let i = 0; i < n; i++) {
    const x = -span * 0.8 + (i / (n - 1)) * span * 1.6;
    cols.push([x, floor, 8, 0, colR]);
    cols.push([x, floor, -12, 0, colR]);
  }
  stone.push(box(span * 1.6 + 10, colH + 4, 34, 0, floor, -50));
  stone.push(...cornice(span * 1.6 + 26, 58, 0, floor + colH, -6, 0, 2.6), box(span * 1.6, 12, 44, 0, floor + colH + 6.5, -8), ...cornice(span * 1.6 + 4, 46, 0, floor + colH + 18.5, -8, 0, 1.6));
  const windows = new THREE.Group();
  const lit: Geo[] = [];
  for (let i = 0; i < 17; i++) {
    const x = -span * 0.72 + (i / 16) * span * 1.44;
    lit.push(at(new THREE.PlaneGeometry(7, 34), x, floor + 22, -32.8));
    lit.push(at(new THREE.CircleGeometry(3.5, 24), x, floor + 39, -32.8));
  }
  windows.add(new THREE.Mesh(merge(lit, null), glow("#ffd58a", 1.6)));
  g.add(windows);

  // The great pavilions, then their lesser neighbours and the far spires.
  pavilion(-span, -18, floor, 112, 74, 50, stone, gold, glass);
  pavilion(span, -18, floor, 112, 74, 50, stone, gold, glass);
  const front: [number, number, number, number?, number?][] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) front.push([side * span + (i - 3.5) * 14.4, floor, 44, 0, 2.7]);
    pavilion(side * span * 0.42, -14, floor + colH + 20, 40, 8, 20, stone, gold, glass);
    const sx = side * (span + 128);
    stone.push(box(40, 14, 40, sx, floor, -30), drum(13, 118, sx, floor + 14, -30, 32, 8.5), drum(14, 3, sx, floor + 132, -30, 32));
    gold.push(at(dome(8.8, 20, 32, 1).shell, sx, floor + 135, -30));
    glass.push(at(new THREE.ConeGeometry(2.4, 42, 6).translate(0, 21, 0), sx, floor + 155, -30));
  }

  colonnade(cols, colH, ctx, mats, g);
  const pav = new THREE.Group();
  colonnade(front, 66, ctx, mats, pav);
  g.add(pav);
  stone.push(...cornice(112, 12, -span, floor + 66, 44, 0, 1.6), ...cornice(112, 12, span, floor + 66, 44, 0, 1.6));

  g.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null }), solid(glass, mats.crystal, { uv: null, cast: false }), solid(rock, mats.rock, { uv: 1 / 50 }));
  return { object: g };
};

/** Curved colonnades, embracing the court on both sides. */
export const arcades: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const r = num(p.radius, 152), h = num(p.height, 30), gap = num(p.gap, 0.42);
  const g = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [];
  const cols: [number, number, number, number?, number?][] = [];
  const perSide = Math.round(num(p.columns, 18) * Math.max(ctx.tier.detail, 0.7));
  const reach = num(p.reach, 1.3);
  for (const side of [-1, 1]) {
    for (let i = 0; i < perSide; i++) {
      const a = -Math.PI / 2 + side * (gap + (i / (perSide - 1)) * reach);
      for (const rr of [r, r + 11]) cols.push([Math.cos(a) * rr, 1, Math.sin(a) * rr, 0, 1.5]);
    }
    // A curved roof, as short straight spans between the columns.
    for (let i = 0; i < perSide - 1; i++) {
      const a0 = -Math.PI / 2 + side * (gap + (i / (perSide - 1)) * reach);
      const a1 = -Math.PI / 2 + side * (gap + ((i + 1) / (perSide - 1)) * reach);
      const am = (a0 + a1) / 2, rm = r + 5.5;
      const span = Math.hypot(Math.cos(a1) - Math.cos(a0), Math.sin(a1) - Math.sin(a0)) * rm + 0.6;
      stone.push(...cornice(span, 17, Math.cos(am) * rm, h + 1, Math.sin(am) * rm, -am + Math.PI / 2, 1));
      gold.push(box(span, 0.5, 18.4, Math.cos(am) * rm, h + 3.2, Math.sin(am) * rm, -am + Math.PI / 2));
    }
  }
  colonnade(cols, h, ctx, mats, g);
  g.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null, cast: false }));
  return { object: g };
};

/* ---------------------------------------------------------- the gateways */

/** The living surface in each gateway. Selection floods it with light. */
function portal(color: string, kind: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uHot: { value: 0 }, uKind: { value: kind } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uTime; uniform float uHot; uniform float uKind; varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c);
        float n = fbm(c * 5.0 + vec2(uTime * 0.05, -uTime * 0.08));
        float a;
        vec3 col;
        if (uKind > 0.5) {
          // The observatory: a field of stars held in the ring.
          vec2 g = c * 34.0; vec2 cell = floor(g);
          float star = step(0.88, hash(cell)) * smoothstep(0.42, 0.0, length(fract(g) - 0.5)) * (0.5 + 0.5 * sin(uTime * 1.3 + hash(cell + 2.0) * 40.0));
          col = uColor * (0.5 + n) + vec3(star * 2.4);
          a = (0.1 + star * 0.7 + n * 0.16 + uHot * 0.4) * smoothstep(0.5, 0.46, r);
        } else {
          col = uColor * (0.8 + n * 0.5) * (0.9 + uHot);
          a = (0.34 + n * 0.22) * smoothstep(1.0, 0.1, vUv.y * (1.0 - uHot * 0.5)) + uHot * 0.5;
        }
        gl_FragColor = vec4(col * (1.0 + uHot * 2.2), clamp(a, 0.0, 1.0));
        ${FINISH}
      }`,
  });
}

/** The lapis plaque each gateway carries its name on. The page sets the words over it. */
function plaque(id: DestinationId, lapis: THREE.Material, gold: Geo[]): THREE.Mesh {
  const s = GATE_SPEC[id].plaque;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.width, s.height, 0.8), lapis);
  mesh.position.set(s.x, s.y, s.z - 0.4);
  const w = s.width / 2 + 0.6, h = s.height / 2 + 0.6;
  gold.push(
    box(s.width + 2.4, 0.6, 1.2, s.x, s.y + h - 0.3, s.z - 0.5), box(s.width + 2.4, 0.6, 1.2, s.x, s.y - h - 0.3, s.z - 0.5),
    box(0.6, s.height + 1.2, 1.2, s.x - w, s.y - h + 0.3, s.z - 0.5), box(0.6, s.height + 1.2, 1.2, s.x + w, s.y - h + 0.3, s.z - 0.5),
  );
  return mesh;
}

type Frame3 = { portalMat: THREE.ShaderMaterial; lapis: THREE.MeshStandardMaterial; update?: (f: Frame) => void };

function gateFrame(id: DestinationId, stone: Geo[], gold: Geo[], extra: THREE.Object3D[], ctx: Parameters<Generator>[1]): Frame3 {
  const mats = materials(ctx);
  const lapis = new THREE.MeshStandardMaterial({ color: "#16205e", metalness: 0.35, roughness: 0.32, emissive: "#3a52d8", emissiveIntensity: 0.12, envMapIntensity: 1.4 });
  extra.push(plaque(id, lapis, gold));

  if (id === "career") {
    // The Hall of Wisdom: a triumphal portal on a podium, colossal columns, an attic that carries
    // the name, and a radiant disc of gold above it all.
    stone.push(...stairs(90, 7, 0.9, 2.4, 0, 0, 38));
    stone.push(box(84, 6.3, 34, 0, 0, 0));
    stone.push(at(archWall(76, 58, 30, 50, 14), 0, 6.3, 0));
    stone.push(...cornice(84, 20, 0, 64.3, 0, 0, 2));
    stone.push(box(54, 12, 13, 0, 67.2, 0), ...cornice(56, 15, 0, 79.2, 0, 0, 1.2));
    const archY = 6.3 + 50 - 15;
    for (let i = 0; i < 13; i++) {
      const a = Math.PI * (i / 12);
      gold.push(at(new THREE.BoxGeometry(1, 1, 15), Math.cos(a) * 14.6, archY + Math.sin(a) * 14.6, 0));
    }
    gold.push(at(new THREE.TorusGeometry(15.3, 0.5, 8, 64, Math.PI), 0, archY, 7.2), at(new THREE.TorusGeometry(16.4, 0.25, 8, 64, Math.PI), 0, archY, 7.3));
    // The radiant disc: wisdom's sun over the door.
    const crown = 92;
    gold.push(at(new THREE.TorusGeometry(5.6, 0.6, 10, 48), 0, crown, 0), at(new THREE.CircleGeometry(4.4, 40), 0, crown, 0.1));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, long = i % 2 === 0;
      gold.push(at(new THREE.BoxGeometry(0.5, long ? 6 : 3.4, 0.5).translate(0, 6.2 + (long ? 3 : 1.7), 0).rotateZ(a), 0, crown, 0));
    }
    stone.push(box(10, 2.4, 6, 0, 81, 0));
    for (const side of [-1, 1]) {
      stone.push(box(9, 4, 9, side * 37, 6.3, 12));
      const obelisk = new THREE.Mesh(new THREE.ConeGeometry(3.4, 34, 4).translate(0, 17, 0), mats.crystal);
      obelisk.position.set(side * 37, 10.3, 12);
      extra.push(obelisk);
    }
    const places: [number, number, number, number?, number?][] = [[-31, 6.3, 10, 0, 2.7], [-22, 6.3, 10, 0, 2.7], [22, 6.3, 10, 0, 2.7], [31, 6.3, 10, 0, 2.7]];
    colonnade(places, 58, ctx, mats, extra[0] as THREE.Group);
    const portalMat = portal("#ffcf7a", 0);
    extra.push(new THREE.Mesh(new THREE.PlaneGeometry(30, 50).translate(0, 25 + 6.3, 0), portalMat));
    return { portalMat, lapis };
  }

  if (id === "stocks") {
    // The Chamber of Insight: an armillary sphere large enough to walk through, between two
    // astrolabe pillars, with the name cut into the threshold stone.
    const R = 26, cy = R + 8;
    stone.push(drum(36, 2, 0, 0, 0, 72), drum(31, 2, 0, 2, 0, 72), drum(27, 2, 0, 4, 0, 72));
    gold.push(drum(36.3, 0.35, 0, 1.8, 0, 72), drum(31.3, 0.35, 0, 3.8, 0, 72));
    stone.push(box(46, 8.4, 6, 0, 0.6, 18.2));
    gold.push(at(new THREE.TorusGeometry(R, 1.25, 18, 128), 0, cy, 0), at(new THREE.TorusGeometry(R + 2.6, 0.38, 10, 128), 0, cy, 0));
    gold.push(at(new THREE.TorusGeometry(R + 1, 1.1, 12, 64, Math.PI * 0.5).rotateZ(Math.PI * 1.25), 0, cy, 0));
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2, big = i % 8 === 0;
      gold.push(at(new THREE.BoxGeometry(0.22, big ? 2.4 : 1.3, 0.5).rotateZ(a - Math.PI / 2), Math.cos(a) * (R + 1.5 + (big ? 0.5 : 0)), cy + Math.sin(a) * (R + 1.5 + (big ? 0.5 : 0)), 0));
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      gold.push(at(new THREE.CircleGeometry(1.1, 6), Math.cos(a) * (R + 4.3), cy + Math.sin(a) * (R + 4.3), 0.3));
    }
    for (const side of [-1, 1]) {
      const x = side * (R + 9);
      stone.push(box(8, 6, 8, x, 0, 0), at(lathe([[2.8, 0], [3.4, 1], [2.1, 4], [1.8, 36], [2.6, 38], [1.4, 40]], 16), x, 6, 0));
      gold.push(at(new THREE.TorusGeometry(4.6, 0.4, 8, 48), x, 50, 0), at(new THREE.TorusGeometry(4.6, 0.25, 8, 48).rotateY(Math.PI / 2), x, 50, 0), at(new THREE.SphereGeometry(1.2, 16, 12), x, 50, 0));
      gold.push(at(new THREE.CylinderGeometry(0.3, 0.3, 4, 8), x, 45.5, 0));
    }
    const spin = new THREE.Group();
    spin.position.y = cy;
    const armil = [
      new THREE.Mesh(new THREE.TorusGeometry(R * 0.82, 0.55, 12, 96), mats.bronze),
      new THREE.Mesh(new THREE.TorusGeometry(R * 0.68, 0.45, 12, 96).rotateX(Math.PI / 2), mats.gold),
      new THREE.Mesh(new THREE.TorusGeometry(R * 0.54, 0.38, 12, 96).rotateY(Math.PI / 3), mats.bronze),
    ];
    armil.forEach((m) => { m.castShadow = true; spin.add(m); });
    spin.add(new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.1, 1), mats.crystal));
    extra.push(spin);
    // A small constellation turning about the ring.
    const rand = seeded(17);
    const stars: [number, number, number, number?, number?][] = Array.from({ length: 46 }, () => {
      const a = rand() * Math.PI * 2, r = R * (1.12 + rand() * 0.3);
      return [Math.cos(a) * r, Math.sin(a) * r, (rand() - 0.5) * 8, 0, 0.18 + rand() * 0.3];
    });
    const orbit = new THREE.Group();
    orbit.position.y = cy;
    orbit.add(repeated(new THREE.OctahedronGeometry(1, 0), glow("#cfd8ff", 3.2), stars, false));
    extra.push(orbit);
    const portalMat = portal("#7d8cff", 1);
    const field = new THREE.Mesh(new THREE.CircleGeometry(R - 0.8, 64), portalMat);
    field.position.set(0, cy, 0);
    extra.push(field);
    return {
      portalMat, lapis,
      update: (f) => {
        if (f.still) return;
        armil[0]!.rotation.y += f.dt * 0.1;
        armil[1]!.rotation.z += f.dt * 0.07;
        armil[2]!.rotation.x -= f.dt * 0.13;
        orbit.rotation.z += f.dt * 0.03;
      },
    };
  }

  // The Grounds of Practice: two stepped towers of hanging gardens, a pergola of gold beams,
  // and the name on the lintel between them.
  stone.push(...stairs(72, 5, 0.9, 2.4, 0, 0, 30));
  stone.push(box(96, 4.5, 26, 0, 0, 0));
  const tiers: { y: number; w: number; d: number }[] = [];
  for (const side of [-1, 1]) {
    let w = 30, d = 24, y = 4.5;
    for (let i = 0; i < 5; i++) {
      const tall = i === 4 ? 6 : 10;
      stone.push(box(w, tall, d, side * 33, y, 0), box(w + 1.6, 1, d + 1.6, side * 33, y + tall, 0));
      if (side === 1) tiers.push({ y: y + tall + 1, w, d });
      y += tall + 1;
      w -= 4.5;
      d -= 3;
    }
  }
  stone.push(box(42, 10, 16, 0, 53.6, 0), ...cornice(46, 18, 0, 63.6, 0, 0, 1.4));
  for (let i = 0; i < 6; i++) gold.push(box(86, 0.8, 0.8, 0, 67.6, -7 + i * 2.8));
  gold.push(box(0.8, 0.8, 16, -40, 67.6, 0), box(0.8, 0.8, 16, 40, 67.6, 0));
  const portalMat = portal("#a8e6a4", 0);
  extra.push(new THREE.Mesh(new THREE.PlaneGeometry(36, 49).translate(0, 24.5 + 4.5, 0), portalMat));

  // Gardens on every terrace, and vines hanging from the lintel.
  const rand = seeded(29);
  const spots: [number, number, number, number][] = [];
  for (const side of [-1, 1]) {
    for (const t of tiers) {
      for (let i = 0; i < 44; i++) {
        const edge = rand() < 0.7 ? 1 : -1;
        spots.push([side * 33 + (rand() - 0.5) * t.w, t.y + rand() * 1.5 - rand() * rand() * 7, edge * (t.d / 2 + 0.5) + (rand() - 0.5) * 2, 1.2 + rand() * 1.5]);
      }
    }
  }
  // Vines fall from the cornice on either side of the plaque, never across it.
  for (let i = 0; i < 70; i++) spots.push([(rand() < 0.5 ? -1 : 1) * (23 + rand() * 19), 67 - rand() * rand() * 12, 8 + rand() * 2, 1.1 + rand()]);
  extra.push(foliage(spots, ["#6fae56", "#4f9449", "#94c468", "#3c7a44", "#b7d973"]));
  return { portalMat, lapis };
}

/** One of the three gateways. `destination` chooses which, and is what clicking it reports. */
export const gateway: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const raw = str(p.destination, "career");
  const id: DestinationId = raw === "stocks" || raw === "academy" ? raw : "career";
  const h = GATE_SPEC[id].height;
  const g = new THREE.Group();
  const columns = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [], extra: THREE.Object3D[] = [columns];
  const { portalMat, lapis, update } = gateFrame(id, stone, gold, extra, ctx);
  g.add(...extra);
  if (stone.length) g.add(solid(stone, mats.marble));
  if (gold.length) g.add(solid(gold, mats.gold, { uv: null }));

  const light = ctx.tier.pointLights ? new THREE.PointLight(str(p.light, "#ffcb7d"), 0, 120, 1.6) : null;
  if (light) { light.position.set(0, h * 0.5, 16); g.add(light); }

  // Thin arches and rings are hard to hit, so an invisible box takes the pointer.
  const size = id === "career" ? [86, 96] : id === "stocks" ? [76, 64] : [96, 72];
  const proxy = new THREE.Mesh(new THREE.BoxGeometry(size[0]!, size[1]!, 26).translate(0, size[1]! / 2, 0), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.userData.pickId = id;
  g.add(proxy);
  g.userData.pickable = true;

  let hot = 0;
  const built: Built = {
    object: g,
    update: (f) => {
      update?.(f);
      const goal = ctx.state.selectedGate === id ? 1 : ctx.state.hoveredGate === id ? 0.5 : 0;
      hot = f.still ? goal : approach(hot, goal, f.dt, ctx.state.selectedGate === id ? 2.4 : 6);
      portalMat.uniforms.uHot!.value = hot;
      lapis.emissiveIntensity = 0.12 + hot * 0.7;
      if (!f.still) portalMat.uniforms.uTime!.value += f.dt;
      if (light) light.intensity = 220 + hot * 4200;
    },
  };
  return built;
};

/* ---------------------------------------------------------- the glowing paths */

/** From the dais to each gateway, with light travelling outward along the stone. */
export const lightPaths: Generator = (p, ctx) => {
  const routes = (Array.isArray(p.routes) ? p.routes : []) as { id?: string; to?: [number, number]; color?: string }[];
  const start = num(p.from, 42), width = num(p.width, 4.4);
  const g = new THREE.Group();
  const updates: ((f: Frame) => void)[] = [];
  for (const r of routes) {
    const to = r.to ?? [0, 60];
    const a = Math.atan2(to[1], to[0]);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * start, 0.1, Math.sin(a) * start),
      new THREE.Vector3(to[0] * 0.55 + Math.sin(a) * 7, 0.1, to[1] * 0.55 - Math.cos(a) * 7),
      new THREE.Vector3(to[0], 0.1, to[1]),
    ]);
    const N = 48;
    const pos: number[] = [], uv: number[] = [], index: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, c = curve.getPoint(t), tan = curve.getTangent(t);
      const nx = -tan.z, nz = tan.x;
      pos.push(c.x + (nx * width) / 2, 0.12, c.z + (nz * width) / 2, c.x - (nx * width) / 2, 0.12, c.z - (nz * width) / 2);
      uv.push(0, t, 1, t);
      if (i < N) { const b = i * 2; index.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(index);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { uColor: { value: new THREE.Color(r.color ?? "#ffcf7a") }, uTime: { value: 3 }, uHot: { value: 0 } },
      vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uTime; uniform float uHot; varying vec2 vUv;
        void main() {
          float across = abs(vUv.x - 0.5) * 2.0;
          float core = smoothstep(0.34, 0.0, across);
          float edge = smoothstep(0.95, 0.82, across) * smoothstep(0.76, 0.84, across);
          float flow = pow(0.5 + 0.5 * sin(vUv.y * 22.0 - uTime * 1.8), 6.0);
          float i = core * (0.34 + flow * 0.9 + uHot * 1.1) + edge * (0.55 + uHot * 0.7);
          gl_FragColor = vec4(uColor * (1.6 + uHot), i * smoothstep(0.0, 0.05, vUv.y));
          ${FINISH}
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    g.add(mesh);
    let hot = 0;
    updates.push((f) => {
      const goal = ctx.state.selectedGate === r.id ? 1.4 : ctx.state.hoveredGate === r.id ? 0.9 : 0;
      hot = f.still ? goal : approach(hot, goal, f.dt);
      mat.uniforms.uHot!.value = hot;
      if (!f.still) mat.uniforms.uTime!.value += f.dt;
    });
  }
  return { object: g, update: (f) => updates.forEach((u) => u(f)) };
};

/* ---------------------------------------------------------- the islands of the sky */

/** A small floating island with a round temple-like pavilion or a tree-free garden lawn. */
export const skyIsle: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const r = num(p.radius, 34);
  const rand = seeded(num(p.seed, 2));
  const g = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [];
  stone.push(drum(r, 1.6, 0, 0, 0, 48));
  g.add(solid([underside(r, r * 1.3, num(p.seed, 2) + 40, 28)], mats.rock, { uv: 1 / 22 }));
  const pr = r * 0.46, h = r * 0.62;
  const n = 10;
  const cols: [number, number, number, number?, number?][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    cols.push([Math.cos(a) * pr, 2.5, Math.sin(a) * pr, 0, r * 0.04]);
  }
  stone.push(drum(pr + 3, 1, 0, 1.6, 0, 32), drum(pr + 1.6, h * 0.1, 0, 2.5 + h, 0, 32));
  const d = dome(pr + 0.6, pr * 0.92, 32, 10);
  gold.push(at(d.shell, 0, 2.5 + h * 1.1, 0));
  gold.push(at(new THREE.SphereGeometry(pr * 0.08, 12, 10), 0, 2.5 + h * 1.1 + pr * 0.98, 0));
  // Evergreen around the rim, so each island reads as a place.
  const spots: [number, number, number, number][] = [];
  for (let i = 0; i < 46; i++) {
    const a = rand() * 6.28, rr = r * (0.66 + rand() * 0.28);
    spots.push([Math.cos(a) * rr, 3 + rand() * r * 0.1, Math.sin(a) * rr, r * 0.06 + rand() * r * 0.05]);
  }
  g.add(foliage(spots, ["#5fa56f", "#3f8a5c", "#8cc08a"], num(p.seed, 2)));
  colonnade(cols, h, ctx, mats, g);
  g.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null }));
  return { object: g };
};

/** A slender bridge of light between two points. */
export const skyBridge: Generator = (p) => {
  const a = new THREE.Vector3(...((p.from as [number, number, number]) ?? [0, 0, 0]));
  const b = new THREE.Vector3(...((p.to as [number, number, number]) ?? [100, 0, 0]));
  const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -num(p.sag, 14), 0));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 36, num(p.width, 0.8), 6), glow(str(p.color, "#ffd28a"), 1.8));
  return { object: mesh };
};
