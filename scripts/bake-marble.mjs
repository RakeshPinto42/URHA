// Bakes the realm's white marble into WebP: colour, normal and roughness, tiling without a seam.
// Poly Haven has no white veined marble, so this is generated here, and it is ours to ship.
//
//   npm run assets:marble
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve(import.meta.dirname, "../public/cinema/assets");
const SIZE = 1024;

/** Value noise that wraps at `period`, so what is built from it tiles. */
function noiseField(period, seed) {
  const grid = new Float32Array(period * period);
  let s = seed >>> 0;
  for (let i = 0; i < grid.length; i++) {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    grid[i] = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return (u, v) => {
    const x = u * period, y = v * period;
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const at = (a, b) => grid[((b + period) % period) * period + ((a + period) % period)];
    const su = xf * xf * (3 - 2 * xf), sv = yf * yf * (3 - 2 * yf);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * su;
    const low = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * su;
    return top + (low - top) * sv;
  };
}

function fbm(seed, base, octaves) {
  const layers = Array.from({ length: octaves }, (_, i) => noiseField(base << i, seed + i * 31));
  return (u, v) => {
    let sum = 0, amp = 0.5;
    for (const f of layers) { sum += amp * f(u, v); amp *= 0.5; }
    return sum;
  };
}

const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

/** How strongly a vein runs through a point, 0 to 1, and a soft cloud across the slab. */
function stone(seed, strength) {
  const warp = fbm(seed, 3, 6), warp2 = fbm(seed + 7, 3, 6), cloud = fbm(seed + 13, 2, 5), fine = fbm(seed + 21, 8, 4);
  return (u, v) => {
    const w = warp(u, v), w2 = warp2(u, v);
    // Whole turns across the tile, so the sine waves meet themselves at the edges.
    const a = Math.sin(Math.PI * 2 * (u * 2 + v * 1) + w * 15);
    const b = Math.sin(Math.PI * 2 * (u * 1 - v * 3) + w2 * 19);
    const major = Math.pow(1 - Math.abs(a), 16) * smooth(0.36, 0.6, w2);
    const minor = Math.pow(1 - Math.abs(b), 26) * smooth(0.4, 0.62, w) * 0.6;
    return { vein: Math.min((major + minor) * strength, 1), cloud: cloud(u, v), fine: fine(u, v) };
  };
}

async function bake(name, field) {
  const color = Buffer.alloc(SIZE * SIZE * 3), normal = Buffer.alloc(SIZE * SIZE * 3), rough = Buffer.alloc(SIZE * SIZE * 3);
  const height = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const p = field(x / SIZE, y / SIZE);
    const i = (y * SIZE + x) * 3;
    color[i] = p.r * 255; color[i + 1] = p.g * 255; color[i + 2] = p.b * 255;
    rough[i] = rough[i + 1] = rough[i + 2] = p.rough * 255;
    height[y * SIZE + x] = p.height;
  }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const h = (a, b) => height[((b + SIZE) % SIZE) * SIZE + ((a + SIZE) % SIZE)];
    const dx = (h(x + 1, y) - h(x - 1, y)) * 3, dy = (h(x, y + 1) - h(x, y - 1)) * 3;
    const l = Math.hypot(dx, dy, 1), i = (y * SIZE + x) * 3;
    normal[i] = (-dx / l * 0.5 + 0.5) * 255; normal[i + 1] = (dy / l * 0.5 + 0.5) * 255; normal[i + 2] = (1 / l * 0.5 + 0.5) * 255;
  }
  const raw = { raw: { width: SIZE, height: SIZE, channels: 3 } };
  await sharp(color, raw).webp({ quality: 84 }).toFile(path.join(OUT, `${name}-diff.webp`));
  await sharp(normal, raw).webp({ quality: 86 }).toFile(path.join(OUT, `${name}-nor.webp`));
  await sharp(rough, raw).webp({ quality: 74 }).toFile(path.join(OUT, `${name}-rough.webp`));
  const credits = path.join(OUT, "../credits.json");
  const list = JSON.parse(await fs.readFile(credits, "utf8"));
  const mine = ["diff", "nor", "rough"].map((slot) => ({
    file: `public/cinema/assets/${name}-${slot}.webp`, title: `${name} (${slot})`, creator: "URHA", license: "Own work",
    licenseUrl: null, page: "scripts/bake-marble.mjs", via: "Generated", triangles: null, modified: "Baked at 1024 px",
  }));
  const next = [...list.filter((c) => !mine.some((m) => m.file === c.file)), ...mine].sort((a, b) => a.file.localeCompare(b.file));
  await fs.writeFile(credits, `${JSON.stringify(next, null, 1)}\n`);
  console.log(`${name}: baked`);
}

const wall = stone(5, 0.9);
await bake("white-marble", (u, v) => {
  const s = wall(u, v);
  const base = 0.93 + (s.cloud - 0.5) * 0.09 + (s.fine - 0.5) * 0.03;
  const k = s.vein * 0.3;
  return { r: base - k * 0.42, g: base - k * 0.42, b: base - k * 0.34, rough: 0.34 + s.vein * 0.24 + s.fine * 0.1, height: -s.vein * 0.3 + s.fine * 0.06 };
});

const floorStone = stone(23, 1);
const SLABS = 3;
await bake("marble-floor", (u, v) => {
  const su = (u * SLABS) % 1, sv = (v * SLABS) % 1;
  const col = Math.floor(u * SLABS), row = Math.floor(v * SLABS);
  // Alternate slabs are laid at right angles, as real book-matched floors are.
  const turned = (col + row) % 2 === 1;
  const s = floorStone(turned ? (v + col * 0.31) % 1 : (u + row * 0.17) % 1, turned ? (u + row * 0.23) % 1 : (v + col * 0.29) % 1);
  const edge = Math.min(su, 1 - su, sv, 1 - sv);
  const joint = 1 - smooth(0.0018, 0.0055, edge);
  const base = 0.9 + (s.cloud - 0.5) * 0.12 + (turned ? -0.018 : 0.012);
  const k = s.vein * 0.6;
  const r = base - k * 0.38, g = base - k * 0.4, b = base - k * 0.32;
  return {
    r: r + (0.82 - r) * joint, g: g + (0.62 - g) * joint, b: b + (0.28 - b) * joint,
    rough: 0.16 + s.vein * 0.2 + joint * 0.3, height: -joint * 0.7,
  };
});
