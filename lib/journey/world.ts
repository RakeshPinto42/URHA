/**
 * The journey world — pure, deterministic geometry shared by the 3D scene and tests
 * (docs/JOURNEY.md §4). No three.js here: plain numbers, so it runs in Node.
 *
 * Coordinates: x right, y up, z towards the viewer. The path starts at the lake
 * shore near the viewer (z ≈ +38) and climbs to the summit far away (z ≈ -150).
 */

export type Vec3 = [number, number, number];

/* -------------------------------------------------------------- noise */

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { sum += amp * valueNoise(x * f, y * f); f *= 2.03; amp *= 0.5; }
  return sum; // ≈ 0..1
}

/* -------------------------------------------------------------- the path */

/** Waypoints of the winding path, near → far. Stations sit on some of them. */
export const PATH_POINTS: [number, number][] = [
  [-6, 38], [2, 30], [9, 20], [4, 9], [-8, 0], [-14, -12], [-6, -24], [8, -34], [16, -46],
  [9, -60], [-4, -70], [-14, -82], [-8, -96], [6, -106], [14, -118], [6, -132], [0, -146],
];

/** Index into PATH_POINTS for each of the seven stations (phase 1 … 7). */
export const STATION_AT = [2, 5, 8, 10, 12, 14, 16] as const;

/** Rise of the land along the path: the valley floor near, the summit far. */
function climb(z: number): number {
  const t = Math.min(1, Math.max(0, (38 - z) / 184)); // 0 at the shore, 1 at the summit
  return 1.2 + Math.pow(t, 1.7) * 34;
}

/** Catmull-Rom on the 2D control points; t in [0,1] along the whole path. */
export function pathXZ(t: number): [number, number] {
  const pts = PATH_POINTS;
  const n = pts.length - 1;
  const ft = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(ft), n - 1);
  const u = ft - i;
  const p0 = pts[Math.max(i - 1, 0)]!, p1 = pts[i]!, p2 = pts[i + 1]!, p3 = pts[Math.min(i + 2, n)]!;
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
}

/** Path parameter of station k (0-based). */
export const stationT = (k: number) => STATION_AT[k]! / (PATH_POINTS.length - 1);

/** Distance from (x,z) to the path, sampled (good enough for terrain carving). */
const PATH_SAMPLES: [number, number][] = Array.from({ length: 400 }, (_, i) => pathXZ(i / 399));
export function distanceToPath(x: number, z: number): number {
  let best = Infinity;
  for (const [px, pz] of PATH_SAMPLES) {
    const d = (px - x) ** 2 + (pz - z) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/* -------------------------------------------------------------- the land */

/** The lake: an ellipse on the left foreground (Galilee). */
export const LAKE = { x: -34, z: 22, rx: 26, rz: 16, level: 0.35 };

function lakeFactor(x: number, z: number): number {
  const d = ((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2;
  return d < 1 ? 1 - d : 0;
}

/** Terrain height without the path carve (for distant ridges and tests). */
export function rawHeight(x: number, z: number): number {
  const base = climb(z);
  const hills = fbm(x * 0.045 + 10, z * 0.045 + 3) * 14;
  // Flanks rise away from the centre line so the path runs through a valley.
  const flank = Math.pow(Math.min(Math.abs(x) / 60, 1), 1.6) * (10 + Math.max(0, -z) * 0.12);
  const lake = lakeFactor(x, z) * (base + hills + 2);
  return base + hills + flank - lake;
}

/** Terrain height with a soft trough carved along the path. */
export function heightAt(x: number, z: number): number {
  const h = rawHeight(x, z);
  if (x < -32 || x > 34) return h; // the path never strays this far; skips the nearest-point search
  const [px, pz] = nearestPathXZ(x, z);
  const d = Math.hypot(px - x, pz - z);
  if (d > TROUGH_FLAT + TROUGH_BLEND) return h;
  // Flat under the path itself (so the coarse terrain mesh cannot rise through the ribbon), then a soft shoulder.
  const bed = rawHeightSmooth(px, pz);
  const k = smooth(Math.min(Math.max(d - TROUGH_FLAT, 0) / TROUGH_BLEND, 1));
  return bed + (h - bed) * k;
}

const TROUGH_FLAT = 3;
const TROUGH_BLEND = 8;

/** A smoothed height under the path itself so the path does not jitter. */
function rawHeightSmooth(x: number, z: number): number {
  return climb(z) + fbm(x * 0.045 + 10, z * 0.045 + 3) * 14 * 0.55 + 0.25;
}

function nearestPathXZ(x: number, z: number): [number, number] {
  let best = Infinity, bp: [number, number] = PATH_SAMPLES[0]!;
  for (const p of PATH_SAMPLES) {
    const d = (p[0] - x) ** 2 + (p[1] - z) ** 2;
    if (d < best) { best = d; bp = p; }
  }
  return bp;
}

/** A point on the path at parameter t, lifted slightly above the ground. */
export function pathPoint(t: number, lift = 0.12): Vec3 {
  const [x, z] = pathXZ(t);
  return [x, rawHeightSmooth(x, z) + lift, z];
}

export function stationPosition(k: number): Vec3 {
  return pathPoint(stationT(k), 0);
}

/** Conifer sites: clumped, off the path, out of the lake, below the tree line. Deterministic. */
export function treeSites(count: number): { x: number; z: number; y: number; scale: number; shade: number }[] {
  const out: { x: number; z: number; y: number; scale: number; shade: number }[] = [];
  const stations = STATION_AT.map((_, k) => stationPosition(k));
  for (let i = 0; out.length < count && i < count * 14; i++) {
    const x = (hash(i, 3.1) - 0.5) * 300;
    const z = 92 - hash(i, 7.7) * 270;
    if (fbm(x * 0.03 + 4, z * 0.03 + 9, 3) < 0.46) continue; // clumps, with open meadow between
    if (lakeFactor(x * 0.92, z * 0.92) > 0 || (Math.abs(x) < 34 && distanceToPath(x, z) < 12)) continue;
    // Keep the camera's sightlines clear: the shore where every shot begins, and a lane in front of each station.
    if (z > 18 && Math.abs(x) < 70) continue;
    if (stations.some((s) => Math.abs(x - s[0] - (z - s[2]) * 0.25) < 15 && z > s[2] - 8 && z < s[2] + 46)) continue;
    const y = heightAt(x, z);
    if (y - climb(z) > 30 || y < LAKE.level + 1) continue;
    out.push({ x, z, y, scale: 0.55 + hash(i, 1.9) * 0.85, shade: hash(i, 5.3) });
  }
  return out;
}

/* -------------------------------------------------------------- progress → position */

/**
 * Where the walker stands, as a path parameter.
 * Phase k (0-based, the current one) runs from station k-1 (or the shore) to station k;
 * the walker has covered the share `fraction` of it (practised ÷ total subtopics).
 * `currentIndex` null means every phase is done: the walker is at the summit.
 */
export function walkerT(currentIndex: number | null, fraction: number): number {
  if (currentIndex === null) return 1;
  const f = Math.min(Math.max(fraction, 0), 1);
  const from = currentIndex === 0 ? 0 : stationT(currentIndex - 1);
  const to = stationT(currentIndex);
  return from + (to - from) * f;
}

/* -------------------------------------------------------------- camera shots */

export type Shot = { position: Vec3; target: Vec3 };

/** Overview: high above the shore, the whole path in frame with the ridges and sky behind it. */
export function overviewShot(aspect = 16 / 9): Shot {
  const back = aspect < 1 ? 120 : aspect < 1.4 ? 92 : 78; // narrower frames need more distance
  return { position: [4, 58, 38 + back], target: [0, 26, -80] };
}

/** Behind the walker, looking up the path to the next station. */
export function walkerShot(t: number, nextStation: number | null, aspect = 16 / 9): Shot {
  const back = Math.max(0, t - 0.06);
  const p = pathPoint(back, 0);
  const at = nextStation === null ? stationPosition(6) : stationPosition(nextStation);
  // Low behind the flame and aimed above the next station: the land fills the lower half,
  // the ridges and sky the upper half, and the sky is where Home sets its text.
  const lift = aspect < 1 ? 15 : 12;
  const back2 = aspect < 1 ? 34 : 44;
  const aim = at[1] + Math.hypot(at[0] - p[0], at[2] - p[2]) * (aspect < 1 ? 0.12 : 0.27) + 10;
  return { position: [p[0] + 3, p[1] + lift, p[2] + back2], target: [at[0] * 0.5, aim, at[2]] };
}

/** Close on a station, from the side the path arrives from. */
export function stationShot(k: number, aspect = 16 / 9): Shot {
  const s = stationPosition(k);
  const before = pathPoint(Math.max(0, stationT(k) - 0.05), 0);
  const dx = before[0] - s[0], dz = before[2] - s[2];
  const len = Math.hypot(dx, dz) || 1;
  const dist = aspect < 1 ? 46 : 34;
  // From down the path, looking slightly up: the landmark stands against the ridges.
  return {
    position: [s[0] + (dx / len) * dist * 0.7 + 8, s[1] + 9, s[2] + dist],
    target: [s[0], s[1] + 8, s[2]],
  };
}
