/**
 * The three destinations, as places: the Hall of Wisdom, the Chamber of Insight and the
 * Grounds of Practice. Each reads real progress through `ctx.data`, and shows nothing where
 * there is nothing to show: an unstarted phase is a dark banner, never a lit one.
 */
import * as THREE from "three";
import type { Built, Frame, Generator } from "@/lib/cinema-engine/runtime";
import {
  FINISH, approach, at, box, colonnade, cornice, dome, drum, glow, lathe, materials, merge, num, repeated, seeded, solid, str, type Geo,
} from "./kit";

export type PhaseMark = { id: string; title: string; state: "passed" | "current" | "ahead"; color: string };
export type DisciplineMark = { id: string; title: string; share: number; color: string };
export type InsightStar = { score: number | null; watched: boolean };
export type RoomData = { phases?: PhaseMark[]; disciplines?: DisciplineMark[]; stars?: InsightStar[] };

const dataOf = (d: unknown): RoomData => (typeof d === "object" && d !== null ? (d as RoomData) : {});

/* ---------------------------------------------------------- Hall of Wisdom */

/** The nave: columns, galleries of books, a coffered gold vault, and the great window. */
export const hallNave: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const g = new THREE.Group();
  const bays = Math.round(num(p.bays, 12)), bay = num(p.bay, 24), half = num(p.halfWidth, 28), aisle = num(p.aisle, 22), h = num(p.height, 50);
  const len = bays * bay;
  const stone: Geo[] = [], gold: Geo[] = [], dark: Geo[] = [];

  g.add(solid([at(new THREE.PlaneGeometry(half * 2 + aisle * 2 + 8, len + 100).rotateX(-Math.PI / 2), 0, 0, -len / 2 + 20)], mats.polished, { uv: 1 / 22, cast: false }));

  const cols: [number, number, number, number?, number?][] = [];
  for (let i = 0; i <= bays; i++) for (const side of [-1, 1]) cols.push([side * half, 0, -i * bay, 0, 3]);
  colonnade(cols, h, ctx, mats, g);

  // Entablature, then the barrel vault with its gold ribs and coffers.
  for (const side of [-1, 1]) {
    stone.push(...cornice(8, len + 40, side * half, h, -len / 2, 0, 1.6));
    stone.push(box(4, 200, len + 120, side * (half + aisle + 2), 0, -len / 2 + 20));
    stone.push(box(aisle, 2, len + 40, side * (half + aisle / 2), h * 0.52, -len / 2));
    gold.push(box(0.5, 1.2, len + 40, side * (half + 1.2), h * 0.52 + 2.4, -len / 2));
    // Gallery balustrade: a run of slim uprights along the upper floor.
    for (let i = 0; i < bays * 5; i++) gold.push(box(0.22, 3, 0.22, side * (half + 0.4), h * 0.52 + 2, -i * (bay / 5)));
  }
  const vault = new THREE.CylinderGeometry(half + 2, half + 2, len + 120, 64, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).translate(0, h + 3, -len / 2 + 20);
  vault.scale(-1, 1, 1);
  const flip = vault.index;
  if (flip) { const a = flip.array; for (let i = 0; i < a.length; i += 3) { const t = a[i]!; (a as Uint32Array)[i] = a[i + 1]!; (a as Uint32Array)[i + 1] = t; } }
  vault.computeVertexNormals();
  // A coffered vault: lapis panels in a gold grid, each with a small gilt star at its heart.
  const vaultMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, metalness: 0.3, envMapIntensity: 1.2 });
  const across = Math.round(num(p.coffersAcross, 9)), along = Math.round(bays * 3);
  vaultMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vCoffer;").replace("#include <uv_vertex>", "#include <uv_vertex>\nvCoffer = uv;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vCoffer;")
      .replace("#include <color_fragment>", /* glsl */`#include <color_fragment>
        vec2 cell = vec2(vCoffer.x * ${across.toFixed(1)}, vCoffer.y * ${along.toFixed(1)});
        vec2 f = abs(fract(cell) - 0.5);
        float frame = smoothstep(0.43, 0.46, max(f.x, f.y));
        float inset = smoothstep(0.36, 0.38, max(f.x, f.y)) * (1.0 - frame);
        float star = smoothstep(0.09, 0.0, length(fract(cell) - 0.5) - 0.02 * abs(sin(atan(fract(cell).y - 0.5, fract(cell).x - 0.5) * 4.0)));
        vec3 lapis = vec3(0.07, 0.1, 0.32), gold = vec3(1.0, 0.74, 0.3), stoneCol = vec3(0.93, 0.89, 0.82);
        diffuseColor.rgb = mix(mix(lapis, stoneCol, inset), gold, max(frame * 0.85, star));`)
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.75, 0.35) * star * 0.6;");
  };
  const vaultMesh = new THREE.Mesh(vault, vaultMat);
  vaultMesh.receiveShadow = true;
  g.add(vaultMesh);
  for (let i = 0; i <= bays; i++) {
    gold.push(at(new THREE.TorusGeometry(half + 1.2, 0.9, 8, 48, Math.PI), 0, h + 3, -i * bay));
    if (i < bays) for (let k = 1; k < 10; k++) {
      const a = (k / 10) * Math.PI;
      gold.push(at(new THREE.BoxGeometry(0.5, 0.5, bay), Math.cos(a) * (half + 1.4), h + 3 + Math.sin(a) * (half + 1.4), -i * bay - bay / 2));
    }
  }

  // The great window at the far end, and its round tracery.
  const wall = -len - 16;
  dark.push(box(half * 2 + aisle * 2 + 8, 200, 4, 0, 0, wall - 4));
  const R = num(p.windowRadius, 25);
  const pane = new THREE.Mesh(new THREE.CircleGeometry(R, 64), glow(str(p.windowColor, "#fff0c8"), num(p.windowStrength, 5)));
  pane.position.set(0, h * 0.68, wall - 1.8);
  g.add(pane);
  gold.push(at(new THREE.TorusGeometry(R, 1.3, 12, 96), 0, h * 0.68, wall - 1.2), at(new THREE.TorusGeometry(R * 0.52, 0.7, 10, 72), 0, h * 0.68, wall - 1.2));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI;
    gold.push(at(new THREE.BoxGeometry(R * 2, 0.5, 0.5).rotateZ(a), 0, h * 0.68, wall - 1.2));
  }
  gold.push(box(46, 2.2, 8, 0, 0, wall + 3));
  stone.push(box(44, 3, 12, 0, 0, wall + 8), box(36, 3, 10, 0, 3, wall + 6));

  // Skylights down the crown of the vault.
  const skylights: Geo[] = [];
  for (let i = 0; i < bays; i++) skylights.push(at(new THREE.PlaneGeometry(7, bay * 0.55).rotateX(Math.PI / 2), 0, h + 3 + half + 1.6, -i * bay - bay / 2));
  g.add(new THREE.Mesh(merge(skylights, null), glow("#fff2d2", 3.4)));

  // Books, two storeys of them along both walls.
  const rand = seeded(7);
  const palette = ["#7b2430", "#22386e", "#2d5a45", "#8a5a1e", "#4b2a62", "#a4422e", "#1f4d63", "#c29a4a"].map((c) => new THREE.Color(c));
  const shelves = Math.round(num(p.shelves, 10));
  const perShelf = Math.round(26 * Math.max(ctx.tier.detail, 0.5));
  const usableBays = bays;
  const total = 4 * usableBays * shelves * perShelf;
  const books = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 }), total);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3();
  let n = 0;
  for (const side of [-1, 1]) for (const storey of [0, 1]) {
    const base = storey === 0 ? 2 : h * 0.52 + 5;
    const rowH = (h * 0.5 - 7) / shelves;
    const wallX = side * (half + aisle - 2);
    for (let b = 0; b < usableBays; b++) {
      const z0 = -b * bay - 1.4;
      stone.push(box(5, h * 0.48, 1.4, wallX, base - 2, z0 + 1.4));
      for (let r = 0; r < shelves; r++) {
        const y = base + r * rowH;
        gold.push(box(6, 0.3, bay - 2, wallX, y - 0.3, z0 - bay / 2 + 1.4));
        let cursor = 0;
        for (let i = 0; i < perShelf; i++) {
          const w = 0.55 + rand() * 0.45;
          cursor += (bay - 3) / perShelf;
          const tall = rowH * (0.66 + rand() * 0.26);
          v.set(wallX - side * (0.4 + rand() * 0.5), y + tall / 2, z0 - cursor);
          m.compose(v, q.identity(), s.set(3.4, tall, w));
          books.setMatrixAt(n, m);
          books.setColorAt(n, palette[Math.floor(rand() * palette.length)]!);
          n += 1;
        }
      }
    }
  }
  books.count = n;
  books.instanceMatrix.needsUpdate = true;
  books.frustumCulled = false;
  books.castShadow = false;
  books.receiveShadow = true;
  g.add(books);

  g.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null }), solid(dark, mats.marble));
  return { object: g };
};

/** Six standing banners of light down the nave, one for each phase. Their state is real. */
export const phaseBanners: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const phases = dataOf(ctx.data).phases ?? [];
  const g = new THREE.Group();
  const spacing = num(p.spacing, 44), x = num(p.x, 19);
  const updates: ((f: Frame) => void)[] = [];
  g.userData.pickable = true;
  phases.forEach((ph, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = num(p.start, -84) - i * spacing;
    const holder = new THREE.Group();
    holder.position.set(side * x, 0, z);
    holder.rotation.y = -side * 0.5;
    const stone: Geo[] = [box(11, 1.4, 6), drum(1.5, 3, 0, 1.4, 0, 16)];
    const gold: Geo[] = [box(0.6, 26, 0.6, -5.2, 4.4, 0), box(0.6, 26, 0.6, 5.2, 4.4, 0), box(11.6, 0.6, 0.6, 0, 30, 0), at(new THREE.SphereGeometry(0.8, 12, 10), -5.2, 31, 0), at(new THREE.SphereGeometry(0.8, 12, 10), 5.2, 31, 0)];
    holder.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null }));
    const lit = ph.state !== "ahead";
    // Cloth lit from within: a passed phase glows softly, the current one brightest, one ahead not at all.
    const mat = new THREE.MeshStandardMaterial({ color: ph.color, roughness: 0.8, emissive: ph.color, emissiveIntensity: ph.state === "current" ? 0.55 : ph.state === "passed" ? 0.25 : 0, transparent: true, opacity: lit ? 0.95 : 0.55, side: THREE.DoubleSide });
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 24, 1, 12).translate(0, 17.6, 0), mat);
    holder.add(cloth);
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(12, 32, 4).translate(0, 16, 0), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.pickId = ph.id;
    holder.add(proxy);
    if (ph.state === "current") {
      updates.push((f) => { if (!f.still) mat.opacity = 0.84 + Math.sin(f.time * 1.6) * 0.12; });
      if (ctx.tier.pointLights) { const l = new THREE.PointLight(ph.color, 260, 50, 2); l.position.set(0, 18, 6); holder.add(l); }
    }
    g.add(holder);
  });
  return { object: g, update: (f) => updates.forEach((u) => u(f)) };
};

/* ---------------------------------------------------------- Chamber of Insight */

/** The observatory: a dark ribbed dome open to the stars, with a star map for a floor. */
export const observatory: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const R = num(p.radius, 80), wallH = num(p.wall, 34);
  const g = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [], bronze: Geo[] = [];
  const floorMat = new THREE.MeshStandardMaterial({ color: "#10173f", metalness: 0.5, roughness: 0.28, envMapIntensity: 1.3 });
  g.add(solid([at(new THREE.CircleGeometry(R + 8, 96).rotateX(-Math.PI / 2))], floorMat, { uv: 1 / 30, cast: false }));

  // The floor is a celestial chart in brass.
  const rings = [18, 30, 42, 56, 70];
  rings.forEach((r, i) => gold.push(at(new THREE.RingGeometry(r, r + (i % 2 ? 0.28 : 0.6), 128).rotateX(-Math.PI / 2), 0, 0.03)));
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2, big = i % 15 === 0;
    gold.push(at(new THREE.PlaneGeometry(big ? 0.4 : 0.14, big ? 5 : 2).rotateX(-Math.PI / 2).translate(0, 0, 72), 0, 0.04, 0, a));
  }
  for (let i = 0; i < 12; i++) gold.push(at(new THREE.PlaneGeometry(0.24, 52).rotateX(-Math.PI / 2).translate(0, 0, 44), 0, 0.03, 0, (i / 12) * Math.PI * 2));

  // Wall of tall arches.
  const n = Math.round(num(p.bays, 24));
  const cols: [number, number, number, number?, number?][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    cols.push([Math.cos(a) * R, 0, Math.sin(a) * R, -a, 2.2]);
    stone.push(box(3, wallH, ((R + 6) * Math.PI * 2) / n + 0.6, Math.cos(a + Math.PI / n) * (R + 6), 0, Math.sin(a + Math.PI / n) * (R + 6), -(a + Math.PI / n)));
    if (i % 2) gold.push(at(new THREE.PlaneGeometry(9, wallH * 0.7).rotateY(-(a + Math.PI / n) - Math.PI / 2), Math.cos(a + Math.PI / n) * (R + 4.3), wallH * 0.42, Math.sin(a + Math.PI / n) * (R + 4.3)));
  }
  colonnade(cols, wallH, ctx, mats, g);
  stone.push(at(new THREE.CylinderGeometry(R + 9, R + 9, 3.4, 96, 1, true).translate(0, 1.7, 0), 0, wallH));
  gold.push(at(new THREE.TorusGeometry(R + 1, 0.7, 10, 128).rotateX(Math.PI / 2), 0, wallH + 3.6));

  // The dome: ribs only, with lapis panels, and a long slit open to the sky.
  const domeH = num(p.dome, 66);
  const d = dome(R + 8, domeH, 96, 32);
  const shell = d.shell;
  const pos = shell.attributes.position!;
  for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + wallH + 3.4);
  const inside = new THREE.MeshStandardMaterial({ color: "#1a2466", metalness: 0.65, roughness: 0.42, side: THREE.BackSide, envMapIntensity: 1.6 });
  const slitWidth = num(p.slit, 0.21);
  inside.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDome;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvDome = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDome;")
      .replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        if (abs(vDome.x) < ${(slitWidth * (R + 8)).toFixed(2)} && vDome.z < 6.0) discard;`);
  };
  const shellMesh = new THREE.Mesh(shell, inside);
  g.add(shellMesh);
  for (const rib of d.ribs) gold.push(at(rib, 0, wallH + 3.4));

  // Painted constellations on the dome.
  const rand = seeded(42);
  const sparks: [number, number, number, number?, number?][] = [];
  for (let i = 0; i < 300; i++) {
    const az = rand() * 6.28, el = 0.12 + rand() * 1.2;
    sparks.push([Math.cos(az) * Math.cos(el) * (R + 6), wallH + 3.4 + Math.sin(el) * domeH * 0.97, Math.sin(az) * Math.cos(el) * (R + 6), 0, 0.14 + rand() * 0.3]);
  }
  g.add(repeated(new THREE.OctahedronGeometry(1, 0), glow("#ffe2a6", 3), sparks, false));

  // Reading desks around the rim, each with a lamp.
  const desks: [number, number, number, number?, number?][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    desks.push([Math.cos(a) * 58, 0, Math.sin(a) * 58, -a + Math.PI / 2, 1]);
  }
  const deskGeo = merge([box(11, 3.4, 3.6), box(11.6, 0.3, 4.2, 0, 3.4, 0)]);
  g.add(repeated(deskGeo, mats.bronze, desks));
  g.add(repeated(new THREE.SphereGeometry(0.5, 12, 10), glow("#ffd98c", 4), desks.map(([x, , z]) => [x, 5, z]), false));

  g.add(solid(stone, mats.marble), solid(gold, mats.gold, { uv: null, cast: false }));
  if (bronze.length) g.add(solid(bronze, mats.bronze, { uv: null }));
  return { object: g };
};

/** The great instrument at the centre. Each real company researched is one star around it. */
export const greatArmillary: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const R = num(p.radius, 22);
  const stars = (dataOf(ctx.data).stars ?? []).slice(0, 240);
  const g = new THREE.Group();
  g.add(solid([drum(R * 0.58, 2, 0, 0, 0, 48), drum(R * 0.34, 2, 0, 2, 0, 48)], mats.marble));
  g.add(solid([at(lathe([[R * 0.2, 0], [R * 0.06, R * 0.24], [R * 0.05, R * 0.62], [R * 0.1, R * 0.66]], 24), 0, 4)], mats.bronze, { uv: null }));
  const spin = new THREE.Group();
  spin.position.y = R + 12;
  const rings = [
    new THREE.Mesh(new THREE.TorusGeometry(R, 0.55, 16, 128), mats.gold),
    new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, 0.42, 14, 128).rotateX(Math.PI / 2), mats.bronze),
    new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.36, 14, 128).rotateY(1.1), mats.gold),
    new THREE.Mesh(new THREE.TorusGeometry(R * 0.58, 0.3, 12, 128).rotateX(0.7), mats.bronze),
  ];
  rings.forEach((r) => { r.castShadow = true; spin.add(r); });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.14, 2), mats.crystal);
  const heart = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.07, 1), glow("#bcd0ff", 5));
  spin.add(core, heart);
  g.add(spin);

  const orbit = new THREE.Group();
  orbit.position.y = R + 12;
  if (stars.length) {
    const rand = seeded(3);
    const places: [number, number, number, number?, number?][] = [];
    const watch: [number, number, number, number?, number?][] = [];
    stars.forEach((s) => {
      const a = rand() * 6.28, b = (rand() - 0.5) * 1.1, r = R * (1.3 + rand() * 0.55);
      const size = 0.16 + ((s.score ?? 30) / 100) * 0.5;
      (s.watched ? watch : places).push([Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r, 0, size * (s.watched ? 1.5 : 1)]);
    });
    const dot = new THREE.OctahedronGeometry(1, 0);
    if (places.length) orbit.add(repeated(dot, glow("#ffe9bf", 3), places, false));
    if (watch.length) orbit.add(repeated(dot.clone(), glow("#7fd8ff", 4.5), watch, false));
  }
  g.add(orbit);
  const light = ctx.tier.pointLights ? new THREE.PointLight("#9bb4ff", 2400, 90, 1.7) : null;
  if (light) { light.position.y = R + 12; g.add(light); }
  return {
    object: g,
    update: (f) => {
      if (f.still) return;
      rings[0]!.rotation.y += f.dt * 0.08;
      rings[1]!.rotation.z += f.dt * 0.11;
      rings[2]!.rotation.x -= f.dt * 0.09;
      rings[3]!.rotation.y -= f.dt * 0.14;
      orbit.rotation.y += f.dt * 0.03;
    },
  };
};

/** A brass telescope on its mount, aimed through the slit. */
export const telescope: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const L = num(p.length, 44);
  const g = new THREE.Group();
  g.add(solid([drum(7, 2, 0, 0, 0, 32), drum(2.6, 13, 0, 2, 0, 16, 1.6)], mats.marble));
  const tube = new THREE.Group();
  tube.position.y = 16;
  tube.rotation.x = num(p.tilt, 0.72);
  const parts = [
    at(new THREE.CylinderGeometry(3.1, 3.1, L * 0.5, 32).rotateX(Math.PI / 2), 0, 0, -L * 0.1),
    at(new THREE.CylinderGeometry(2.4, 2.4, L * 0.38, 32).rotateX(Math.PI / 2), 0, 0, L * 0.3),
    at(new THREE.CylinderGeometry(1.2, 1.2, L * 0.16, 16).rotateX(Math.PI / 2), 0, 0, L * 0.54),
    at(new THREE.CylinderGeometry(3.7, 3.4, 2, 32).rotateX(Math.PI / 2), 0, 0, -L * 0.36),
  ];
  tube.add(solid(parts, mats.bronze, { uv: null }));
  tube.add(solid([at(new THREE.TorusGeometry(3.2, 0.3, 8, 40), 0, 0, -L * 0.2), at(new THREE.TorusGeometry(3.2, 0.3, 8, 40), 0, 0, L * 0.1), at(new THREE.TorusGeometry(2.5, 0.25, 8, 40), 0, 0, L * 0.48)], mats.gold, { uv: null, cast: false }));
  g.add(tube);
  return { object: g };
};

/* ---------------------------------------------------------- Grounds of Practice */

/** The quadrangle: cloisters on four sides, a long pool, lawns and stepped seating. */
export const quadrangle: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const W = num(p.width, 150), L = num(p.length, 210), h = num(p.height, 24);
  const g = new THREE.Group();
  const stone: Geo[] = [], gold: Geo[] = [];
  g.add(solid([at(new THREE.PlaneGeometry(W * 3, L * 3).rotateX(-Math.PI / 2))], mats.polished, { uv: 1 / 24, cast: false }));

  const grass = new THREE.MeshStandardMaterial({ color: "#5d9a50", roughness: 0.95 });
  const lawns: Geo[] = [];
  for (const side of [-1, 1]) for (const z of [-L * 0.27, L * 0.27]) lawns.push(box(W * 0.3, 0.5, L * 0.36, side * W * 0.27, 0, z));
  g.add(solid(lawns, grass, { uv: null, cast: false }));

  const cols: [number, number, number, number?, number?][] = [];
  const nL = 18, nW = 12;
  for (let i = 0; i <= nL; i++) for (const side of [-1, 1]) cols.push([side * W * 0.5, 0.6, -L / 2 + (i / nL) * L, 0, 1.4]);
  for (let i = 1; i < nW; i++) if (Math.abs(i - nW / 2) > 1.6) cols.push([-W / 2 + (i / nW) * W, 0.6, -L / 2, 0, 1.4]);
  colonnade(cols, h, ctx, mats, g);
  for (const side of [-1, 1]) {
    stone.push(...cornice(16, L + 18, side * (W * 0.5 + 6), h + 0.6, 0, 0, 1.2), box(4, h + 22, L + 60, side * (W * 0.5 + 15), 0, 0));
    stone.push(box(16, 1, L + 16, side * (W * 0.5 + 6), h + 3.2, 0));
    // Tiled roofs.
    const roof = new THREE.BoxGeometry(22, 1.2, L + 24).rotateZ(side * -0.4);
    gold.push(at(roof, side * (W * 0.5 + 8), h + 8, 0));
  }
  stone.push(...cornice(W + 32, 16, 0, h + 0.6, -L / 2 - 6, 0, 1.2), box(W + 60, h + 26, 4, 0, 0, -L / 2 - 16));
  // The central arch at the end of the pool, and its lit opening.
  stone.push(box(32, 54, 12, -34, 0, -L / 2 - 8), box(32, 54, 12, 34, 0, -L / 2 - 8), box(100, 16, 12, 0, 40, -L / 2 - 8), ...cornice(102, 14, 0, 56, -L / 2 - 8, 0, 1.6));
  const opening = new THREE.Mesh(merge([at(new THREE.PlaneGeometry(36, 26), 0, 13, 0), at(new THREE.CircleGeometry(18, 40), 0, 26, 0)], null), glow("#ffe7b4", 1.5));
  opening.position.set(0, 0, -L / 2 - 13);
  g.add(opening);

  // The pool.
  stone.push(box(W * 0.2 + 2.4, 0.9, L * 0.84 + 2.4, 0, 0, 0));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.2, L * 0.84).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: "#8fd0da", roughness: 0.03, metalness: 0.55, envMapIntensity: 1.8, clearcoat: 1 }));
  water.position.y = 0.95;
  g.add(water);
  // Light glinting off the water as it moves.
  const glintMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv;
      void main() {
        vec2 p = vUv * vec2(6.0, 40.0);
        float w = sin(p.x * 3.1 + sin(p.y * 0.7 + uTime * 0.9) * 2.0 + uTime * 0.6) * sin(p.y * 1.3 - uTime * 0.7 + sin(p.x * 2.0));
        float glint = pow(max(w, 0.0), 14.0);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * glint * 0.9, glint);
        ${FINISH}
      }`,
  });
  const glints = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.2, L * 0.84).rotateX(-Math.PI / 2), glintMat);
  glints.position.y = 1.05;
  glints.renderOrder = 3;
  g.add(glints);

  // Stepped seating before the arch, where practice is watched and discussed.
  for (let i = 0; i < 5; i++) stone.push(box(26 - i, 0.9, 30, -W * 0.27, 0.5 + i * 0.9, -L * 0.42 + i * 1.5));

  g.add(solid(stone, mats.marble), solid(gold, mats.bronze, { uv: null }));
  return { object: g, update: (f) => { if (!f.still) glintMat.uniforms.uTime!.value += f.dt; } };
};

/** Six plinths, one for each discipline. How high the crystal burns is real progress. */
export const disciplinePlinths: Generator = (p, ctx) => {
  const mats = materials(ctx);
  const items = dataOf(ctx.data).disciplines ?? [];
  const g = new THREE.Group();
  const x = num(p.x, 40), start = num(p.start, 62), step = num(p.step, 56);
  const shapes = [new THREE.OctahedronGeometry(1, 0), new THREE.ConeGeometry(1, 2, 6)];
  const spinners: THREE.Object3D[] = [];
  g.userData.pickable = true;
  items.forEach((d, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = start - Math.floor(i / 2) * step;
    const h = new THREE.Group();
    h.position.set(side * x, 0.5, z);
    const stone: Geo[] = [box(11, 1.2, 11), box(8.4, 1, 8.4, 0, 1.2, 0), at(lathe([[3.4, 0], [2.2, 0.8], [1.9, 7], [3.2, 8]], 24), 0, 2.2)];
    h.add(solid(stone, mats.marble));
    h.add(solid([drum(3.4, 0.4, 0, 10.2, 0, 24)], mats.gold, { uv: null }));
    const lit = 0.25 + d.share * 3;
    const gem = new THREE.Mesh(shapes[i % 2]!.clone(), glow(d.color, lit));
    gem.position.y = 15;
    gem.scale.set(1.8, 2.8, 1.8);
    h.add(gem);
    spinners.push(gem);
    const proxy = new THREE.Mesh(new THREE.BoxGeometry(12, 22, 12).translate(0, 11, 0), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.pickId = d.id;
    h.add(proxy);
    if (ctx.tier.pointLights && d.share > 0) { const l = new THREE.PointLight(d.color, 400 + d.share * 1800, 50, 1.8); l.position.y = 16; h.add(l); }
    g.add(h);
  });
  shapes.forEach((s) => s.dispose());
  const built: Built = {
    object: g,
    update: (f) => {
      if (f.still) return;
      spinners.forEach((s, i) => {
        s.rotation.y += f.dt * 0.5;
        s.position.y = approach(s.position.y, 15 + Math.sin(f.time * 0.9 + i) * 0.7, f.dt, 8);
      });
    },
  };
  return built;
};
