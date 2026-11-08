/**
 * The three destinations, and which of them every route belongs to. Pure data: the shell, the
 * world and the tests all read this. Gate positions live in the scene file instead, so the
 * Studio can move a gateway; `gateShots` turns one into camera moves.
 */
import type { CinemaScene, Vec3 } from "@/lib/cinema-engine/schema";
import { GATE_SPEC } from "./gate-spec";

export type DestinationId = "career" | "stocks" | "academy";

export type SubPage = { href: string; label: string };

export type Destination = {
  id: DestinationId;
  name: string;
  place: string;
  purpose: string;
  href: string;
  scene: string;
  poster: string;
  /** The three rooms each have their own daylight, which the page takes on. */
  room: "marble" | "midnight" | "garden";
  pages: SubPage[];
  /** Routes that sit inside this destination. */
  prefixes: string[];
};

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "career", name: "Career", place: "The Path of Wisdom", purpose: "Your roadmap, six phases and what to learn next.",
    href: "/career", scene: "hall-of-wisdom", poster: "/cinema/posters/hall-of-wisdom.webp", room: "marble",
    pages: [
      { href: "/career", label: "Hall of Wisdom" }, { href: "/today", label: "Today" }, { href: "/path", label: "Roadmap" },
      { href: "/skills", label: "Skills" }, { href: "/tasks", label: "Tasks" },
    ],
    prefixes: ["/career", "/today", "/path", "/skills", "/tasks"],
  },
  {
    id: "stocks", name: "Rare Stocks", place: "The Chamber of Insight", purpose: "Screen, research and watch overlooked Indian companies.",
    href: "/discovery", scene: "chamber-of-insight", poster: "/cinema/posters/chamber-of-insight.webp", room: "midnight",
    pages: [{ href: "/discovery", label: "Chamber of Insight" }],
    prefixes: ["/discovery"],
  },
  {
    id: "academy", name: "Academy", place: "The Grounds of Practice", purpose: "Exercises, challenges and projects to build real skill.",
    href: "/academy", scene: "grounds-of-practice", poster: "/cinema/posters/grounds-of-practice.webp", room: "garden",
    pages: [
      { href: "/academy", label: "Grounds of Practice" }, { href: "/academy/practice", label: "Practice yard" }, { href: "/academy/study", label: "Study" },
      { href: "/assessments", label: "Challenges" }, { href: "/projects", label: "Projects" },
    ],
    prefixes: ["/academy", "/assessments", "/projects"],
  },
];

/** Everything else stays one step away, in the menu, without becoming a fourth destination. */
export const QUIET_PAGES: readonly SubPage[] = [
  { href: "/meditation", label: "Meditation" }, { href: "/journal", label: "Journal" }, { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" }, { href: "/credits", label: "Sources and credits" },
];

export function destinationOf(pathname: string): Destination | null {
  return DESTINATIONS.find((d) => d.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) ?? null;
}

export function byId(id: string): Destination | null {
  return DESTINATIONS.find((d) => d.id === id) ?? null;
}

/* ---------------------------------------------------------- camera */

export type GateSpot = { id: DestinationId; position: Vec3; facing: Vec3; height: number; ry: number; scale: number };

/** Where each gateway stands in a scene, read from the scene itself. */
export function gatesIn(scene: CinemaScene): GateSpot[] {
  const out: GateSpot[] = [];
  for (const o of scene.objects) {
    if (o.generator !== "gateway") continue;
    const id = o.params.destination;
    if (id !== "career" && id !== "stocks" && id !== "academy") continue;
    const position = o.placement?.position ?? [0, 0, 0];
    const ry = o.placement?.rotation[1] ?? 0;
    const scale = o.placement?.scale[0] ?? 1;
    out.push({ id, position, facing: [Math.sin(ry), 0, Math.cos(ry)], height: GATE_SPEC[id].height * scale, ry, scale });
  }
  return out;
}

export type CameraShot = { position: Vec3; target: Vec3 };

/** The plaque's centre and its two ends, in world space, where the page sets the name. */
export function plaqueOf(g: GateSpot): { center: Vec3; left: Vec3; right: Vec3 } {
  const s = GATE_SPEC[g.id].plaque;
  const c = Math.cos(g.ry), n = Math.sin(g.ry), k = g.scale;
  const local = (x: number, y: number, z: number): Vec3 => [g.position[0] + (x * c + z * n) * k, g.position[1] + y * k, g.position[2] + (-x * n + z * c) * k];
  return { center: local(s.x, s.y, s.z + 0.2), left: local(s.x - s.width / 2, s.y, s.z + 0.2), right: local(s.x + s.width / 2, s.y, s.z + 0.2) };
}

const along = (a: Vec3, dir: Vec3, k: number, y = 0): Vec3 => [a[0] + dir[0] * k, a[1] + dir[1] * k + y, a[2] + dir[2] * k];

/** The three camera moves for a gateway: drawn towards it, on its threshold, and through it. */
export function gateShots(g: GateSpot) {
  const eye = g.height * 0.42;
  return {
    near: { position: along(g.position, g.facing, 70, eye), target: along(g.position, g.facing, 0, eye) } satisfies CameraShot,
    through: { position: along(g.position, g.facing, -26, eye), target: along(g.position, g.facing, -90, eye) } satisfies CameraShot,
  };
}

/**
 * The camera inside a destination as its page scrolls: `s` is 0 at the opening and 1 at the
 * foot of the page. The Hall walks towards its window, the Chamber circles its instrument, and
 * the Grounds walk the length of the pool. Narrow screens stand further back.
 */
export function roomShot(id: DestinationId, rest: CameraShot, aspect: number, s: number): CameraShot {
  const [px, py, pz] = rest.position, [tx, ty, tz] = rest.target;
  const back = aspect < 1 ? 26 : 0;
  const dx = tx - px, dz = tz - pz, len = Math.hypot(dx, dz) || 1;
  const ux = dx / len, uz = dz / len;
  const e = s * s * (3 - 2 * s);
  if (id === "stocks") {
    const r0 = Math.hypot(px - tx, pz - tz) + back, a0 = Math.atan2(pz - tz, px - tx), a = a0 + e * 1.7;
    return { position: [tx + Math.cos(a) * (r0 - e * 12), py + e * 22, tz + Math.sin(a) * (r0 - e * 12)], target: [tx, ty + e * 6, tz] };
  }
  const walk = id === "career" ? 205 : 160;
  return {
    position: [px - ux * back + ux * walk * e, py + (id === "academy" ? e * 12 : e * 4), pz - uz * back + uz * walk * e],
    target: [tx, ty + (id === "academy" ? e * 4 : 0), tz],
  };
}

/** Where to stand to see the whole realm: further back on a narrow screen. */
export function realmShot(aspect: number): CameraShot {
  const back = aspect >= 1.5 ? 335 : aspect >= 1 ? 400 : 520;
  const rise = aspect >= 1 ? 50 : 64;
  return { position: [0, rise, back], target: [0, aspect >= 1 ? 88 : 112, -10] };
}

/** On a phone only one gateway fits, so the camera turns to the one in focus. */
export function focusShot(g: GateSpot, aspect: number): CameraShot {
  const base = realmShot(aspect);
  const pull = aspect >= 1 ? 0.14 : 0.62;
  const to: Vec3 = [g.position[0] + g.facing[0] * 110, 16, g.position[2] + g.facing[2] * 110];
  return {
    position: [base.position[0] + (to[0] - base.position[0]) * pull, base.position[1] + (to[1] - base.position[1]) * pull, base.position[2] + (to[2] - base.position[2]) * pull],
    target: [base.target[0] + (g.position[0] - base.target[0]) * pull, base.target[1] + (g.height * 0.6 - base.target[1]) * pull, base.target[2] + (g.position[2] - base.target[2]) * pull],
  };
}
