/**
 * The cinema scene format (docs/CINEMATIC_ENGINE_AUDIT.md §5).
 *
 * A scene is plain JSON: the one source of a cinematic, and what the Studio edits, exports
 * and imports. No React and no three.js here, so it runs anywhere and tests without a GPU.
 *
 * A value that changes through a scene's timeline is written [from, to]; the runtime moves it
 * as the timeline plays. So a sunrise is data, not code.
 *
 * Scene files are untrusted input, because they can be imported: `parseScene` validates all
 * of it and refuses anything it does not recognise.
 */

import { LOCAL_ASSET } from "./assets";

export const SCENE_VERSION = 1;

export type Vec3 = [number, number, number];
export type Animated<T> = T | [from: T, to: T];

export type CinemaLight =
  | { id: string; type: "ambient"; color: string; intensity: Animated<number> }
  | { id: string; type: "hemisphere"; sky: string; ground: string; intensity: Animated<number> }
  | { id: string; type: "spot"; color: string; intensity: Animated<number>; position: Vec3; target: Vec3; angle: number; penumbra: number; distance: number; castShadow?: boolean }
  | { id: string; type: "directional"; color: string; intensity: Animated<number>; direction: Vec3; castShadow?: boolean }
  | { id: string; type: "point"; color: string; intensity: Animated<number>; position: Vec3; distance: number };

/** Where an object sits, in world units and radians. */
export type Placement = { position: Vec3; rotation: Vec3; scale: Vec3 };

/** Simple repeating motion, for any object. */
export type Motion = { spin?: Vec3; float?: { height: number; speed: number } };

export type CinemaObject = {
  id: string;
  generator: string; // what builds it: a procedural generator registered with the runtime
  visible: boolean;
  placement?: Placement;
  motion?: Motion;
  /** The sky the reflections are captured from. */
  environmentSource?: boolean;
  params: Record<string, unknown>;
};

export type CinemaScene = {
  version: number;
  id: string;
  title: string;
  camera: { fov: number; near: number; far: number; position?: Vec3; target?: Vec3; speed?: number };
  environment: {
    fog: { color: Animated<string>; density: number };
    exposure: Animated<number>;
    reflections: Animated<number>;
    bloom: { strength: number; radius: number; threshold: number };
  };
  /** Named timelines. `seconds` is how long the [from, to] values take to play. */
  timelines: { id: string; seconds: number }[];
  lights: CinemaLight[];
  objects: CinemaObject[];
};

export type ParseResult = { ok: true; scene: CinemaScene } | { ok: false; errors: string[] };

const HEX = /^#[0-9a-f]{6}$/i;
const ID = /^[a-z][a-z0-9-]{0,63}$/;
const MAX_OBJECTS = 256;
const MAX_LIGHTS = 16;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isColor = (v: unknown): v is string => typeof v === "string" && HEX.test(v);
const isVec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every(isNumber);

/** A plain value or a [from, to] pair of them. */
const animated = (v: unknown, ok: (x: unknown) => boolean) => ok(v) || (Array.isArray(v) && v.length === 2 && v.every(ok));

/** Params hold only JSON data: nothing that could smuggle in a function or a remote address. */
function checkParams(v: unknown, at: string, errors: string[], depth = 0) {
  if (depth > 6) { errors.push(`${at}: nested too deeply`); return; }
  if (typeof v === "string") {
    if (/\.(src|map)$/.test(at) && !LOCAL_ASSET.test(v)) errors.push(`${at}: must be a file in /cinema/assets/`);
    if (v.length > 200) errors.push(`${at}: text too long`);
    if (/^(https?:)?\/\/|^data:|^javascript:/i.test(v)) errors.push(`${at}: remote addresses are not allowed`);
    return;
  }
  if (v === null || typeof v === "boolean" || isNumber(v)) return;
  if (Array.isArray(v)) { v.forEach((x, i) => checkParams(x, `${at}[${i}]`, errors, depth + 1)); return; }
  if (isObject(v)) { for (const [k, x] of Object.entries(v)) checkParams(x, `${at}.${k}`, errors, depth + 1); return; }
  errors.push(`${at}: not plain data`);
}

function checkLight(l: unknown, at: string, errors: string[]) {
  if (!isObject(l)) { errors.push(`${at}: not an object`); return; }
  if (typeof l.id !== "string" || !ID.test(l.id)) errors.push(`${at}.id: use lowercase letters, numbers and hyphens`);
  if (!animated(l.intensity, (x) => isNumber(x) && x >= 0)) errors.push(`${at}.intensity: must be a positive number or [from, to]`);
  if (l.type === "ambient") {
    if (!isColor(l.color)) errors.push(`${at}.color: must be #rrggbb`);
  } else if (l.type === "spot") {
    if (!isColor(l.color)) errors.push(`${at}.color: must be #rrggbb`);
    if (!isVec3(l.position) || !isVec3(l.target)) errors.push(`${at}: position and target must be [x, y, z]`);
    if (!isNumber(l.angle) || l.angle <= 0 || l.angle > Math.PI / 2) errors.push(`${at}.angle: must be above 0 and at most 90 degrees`);
    if (!isNumber(l.penumbra) || l.penumbra < 0 || l.penumbra > 1) errors.push(`${at}.penumbra: must be 0 to 1`);
    if (!isNumber(l.distance) || l.distance <= 0) errors.push(`${at}.distance: must be above 0`);
  } else if (l.type === "hemisphere") {
    if (!isColor(l.sky) || !isColor(l.ground)) errors.push(`${at}: sky and ground must be #rrggbb`);
  } else if (l.type === "directional") {
    if (!isColor(l.color)) errors.push(`${at}.color: must be #rrggbb`);
    if (!isVec3(l.direction)) errors.push(`${at}.direction: must be [x, y, z]`);
  } else if (l.type === "point") {
    if (!isColor(l.color)) errors.push(`${at}.color: must be #rrggbb`);
    if (!isVec3(l.position)) errors.push(`${at}.position: must be [x, y, z]`);
    if (!isNumber(l.distance) || l.distance <= 0) errors.push(`${at}.distance: must be above 0`);
  } else errors.push(`${at}.type: unknown light "${String(l.type)}"`);
}

/** Validates an unknown value as a scene. Every problem is reported, not only the first. */
export function parseScene(input: unknown): ParseResult {
  const errors: string[] = [];
  if (!isObject(input)) return { ok: false, errors: ["scene: not an object"] };
  const s = input;
  if (s.version !== SCENE_VERSION) errors.push(`version: expected ${SCENE_VERSION}, found ${String(s.version)}`);
  if (typeof s.id !== "string" || !ID.test(s.id)) errors.push("id: use lowercase letters, numbers and hyphens");
  if (typeof s.title !== "string" || s.title.length === 0 || s.title.length > 120) errors.push("title: must be 1 to 120 characters");

  const c = s.camera;
  if (!isObject(c) || !isNumber(c.fov) || c.fov < 10 || c.fov > 120 || !isNumber(c.near) || c.near <= 0 || !isNumber(c.far) || c.far <= (c.near as number)) {
    errors.push("camera: needs fov 10–120, near above 0 and far beyond near");
  }

  if (isObject(c)) {
    if (c.position !== undefined && !isVec3(c.position)) errors.push("camera.position: must be [x, y, z]");
    if (c.target !== undefined && !isVec3(c.target)) errors.push("camera.target: must be [x, y, z]");
    if (c.speed !== undefined && (!isNumber(c.speed) || c.speed <= 0)) errors.push("camera.speed: must be above 0");
  }

  const e = s.environment;
  if (!isObject(e)) errors.push("environment: missing");
  else {
    const fog = e.fog;
    if (!isObject(fog) || !animated(fog.color, isColor) || !isNumber(fog.density) || fog.density < 0) errors.push("environment.fog: needs a colour and a density of 0 or more");
    if (!animated(e.exposure, (x) => isNumber(x) && x > 0)) errors.push("environment.exposure: must be above 0");
    if (!animated(e.reflections, (x) => isNumber(x) && x >= 0)) errors.push("environment.reflections: must be 0 or more");
    const b = e.bloom;
    if (!isObject(b) || !isNumber(b.strength) || b.strength < 0 || !isNumber(b.radius) || b.radius < 0 || !isNumber(b.threshold) || b.threshold < 0) errors.push("environment.bloom: needs strength, radius and threshold of 0 or more");
  }

  if (!Array.isArray(s.timelines)) errors.push("timelines: must be a list");
  else s.timelines.forEach((t, i) => {
    if (!isObject(t) || typeof t.id !== "string" || !ID.test(t.id) || !isNumber(t.seconds) || t.seconds <= 0) errors.push(`timelines[${i}]: needs an id and seconds above 0`);
  });

  if (!Array.isArray(s.lights) || s.lights.length > MAX_LIGHTS) errors.push(`lights: must be a list of at most ${MAX_LIGHTS}`);
  else s.lights.forEach((l, i) => checkLight(l, `lights[${i}]`, errors));

  if (!Array.isArray(s.objects) || s.objects.length > MAX_OBJECTS) errors.push(`objects: must be a list of at most ${MAX_OBJECTS}`);
  else {
    const seen = new Set<string>();
    s.objects.forEach((o, i) => {
      const at = `objects[${i}]`;
      if (!isObject(o)) { errors.push(`${at}: not an object`); return; }
      if (typeof o.id !== "string" || !ID.test(o.id)) errors.push(`${at}.id: use lowercase letters, numbers and hyphens`);
      else if (seen.has(o.id)) errors.push(`${at}.id: "${o.id}" is used twice`);
      else seen.add(o.id);
      if (typeof o.generator !== "string" || !ID.test(o.generator)) errors.push(`${at}.generator: invalid`);
      if (typeof o.visible !== "boolean") errors.push(`${at}.visible: must be true or false`);
      if (!isObject(o.params)) errors.push(`${at}.params: must be an object`);
      else {
        checkParams(o.params, `${at}.params`, errors);
        if ((o.generator === "model" || o.generator === "scatter") && !(typeof o.params.src === "string" && o.params.src.endsWith(".glb"))) errors.push(`${at}.params.src: needs a .glb file`);
      }
      if (o.placement !== undefined) {
        const p = o.placement;
        if (!isObject(p) || !isVec3(p.position) || !isVec3(p.rotation) || !isVec3(p.scale)) errors.push(`${at}.placement: needs position, rotation and scale as [x, y, z]`);
      }
      if (o.motion !== undefined) {
        const m = o.motion;
        const floatOk = !isObject(m) || m.float === undefined || (isObject(m.float) && isNumber(m.float.height) && isNumber(m.float.speed));
        if (!isObject(m) || (m.spin !== undefined && !isVec3(m.spin)) || !floatOk) errors.push(`${at}.motion: spin must be [x, y, z], and float needs height and speed`);
      }
    });
  }

  return errors.length ? { ok: false, errors } : { ok: true, scene: input as unknown as CinemaScene };
}

/** The value of an animated number at progress t (0–1). */
export function resolveNumber(v: Animated<number>, t: number): number {
  return Array.isArray(v) ? v[0] + (v[1] - v[0]) * t : v;
}

/** The two ends of an animated value, for values the runtime blends itself. */
export const ends = <T>(v: Animated<T>): [T, T] => (Array.isArray(v) ? (v as [T, T]) : [v as T, v as T]);
