/**
 * Editing a scene, as pure functions: each takes a scene and returns a new one. The Studio
 * calls these, the runtime syncs to the result, and undo is just the previous value. No
 * React and no three.js, so all of it tests without a GPU.
 */
import { SCENE_VERSION, parseScene, type CinemaLight, type CinemaObject, type CinemaScene, type ParseResult, type Placement, type Vec3 } from "./schema";

/* ---------------------------------------------------------- ids */

export function uniqueId(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const stem = base.replace(/-\d+$/, "").slice(0, 56) || "object";
  if (!used.has(stem)) return stem;
  for (let n = 2; ; n++) if (!used.has(`${stem}-${n}`)) return `${stem}-${n}`;
}

const allIds = (s: CinemaScene) => [...s.objects.map((o) => o.id), ...s.lights.map((l) => l.id)];

/* ---------------------------------------------------------- objects */

export function addObject(s: CinemaScene, o: Omit<CinemaObject, "id"> & { id?: string }): CinemaScene {
  const id = uniqueId(o.id ?? o.generator, allIds(s));
  return { ...s, objects: [...s.objects, { ...o, id }] };
}

export function updateObject(s: CinemaScene, id: string, patch: Partial<CinemaObject>): CinemaScene {
  return { ...s, objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) };
}

export function removeObject(s: CinemaScene, id: string): CinemaScene {
  return { ...s, objects: s.objects.filter((o) => o.id !== id) };
}

/** A copy beside the original, so it can be seen rather than sitting exactly on top. */
export function duplicateObject(s: CinemaScene, id: string): CinemaScene {
  const o = s.objects.find((x) => x.id === id);
  if (!o) return s;
  const copy: CinemaObject = JSON.parse(JSON.stringify(o));
  copy.id = uniqueId(o.id, allIds(s));
  delete copy.environmentSource; // A scene has one sky to take reflections from.
  const at: Vec3 = o.placement?.position ?? [0, 0, 0];
  copy.placement = { position: [at[0] + 6, at[1], at[2]], rotation: o.placement?.rotation ?? [0, 0, 0], scale: o.placement?.scale ?? [1, 1, 1] };
  return { ...s, objects: [...s.objects, copy] };
}

export function renameObject(s: CinemaScene, id: string, wanted: string): CinemaScene {
  if (wanted === id) return s;
  return updateObject(s, id, { id: uniqueId(wanted, allIds(s)) });
}

/* ---------------------------------------------------------- lights */

/** A light to add: any kind, with its id optional. */
export type NewLight = CinemaLight extends infer L ? (L extends CinemaLight ? Omit<L, "id"> & { id?: string } : never) : never;

export function addLight(s: CinemaScene, l: NewLight): CinemaScene {
  const id = uniqueId(l.id ?? `${l.type}-light`, allIds(s));
  return { ...s, lights: [...s.lights, { ...l, id } as CinemaLight] };
}

export function updateLight(s: CinemaScene, id: string, patch: Partial<CinemaLight>): CinemaScene {
  return { ...s, lights: s.lights.map((l) => (l.id === id ? ({ ...l, ...patch } as CinemaLight) : l)) };
}

export function removeLight(s: CinemaScene, id: string): CinemaScene {
  return { ...s, lights: s.lights.filter((l) => l.id !== id) };
}

export function duplicateLight(s: CinemaScene, id: string): CinemaScene {
  const l = s.lights.find((x) => x.id === id);
  if (!l) return s;
  const copy = JSON.parse(JSON.stringify(l)) as CinemaLight;
  copy.id = uniqueId(l.id, allIds(s));
  return { ...s, lights: [...s.lights, copy] };
}

/* ---------------------------------------------------------- new scenes */

export function blankScene(id = "untitled"): CinemaScene {
  return {
    version: SCENE_VERSION, id, title: "Untitled scene",
    camera: { fov: 46, near: 0.5, far: 900 },
    environment: { fog: { color: "#203060", density: 0.002 }, exposure: 1, reflections: 0.5, bloom: { strength: 0.22, radius: 0.35, threshold: 1.25 } },
    timelines: [],
    lights: [
      { id: "sky-light", type: "hemisphere", sky: "#dfe8ff", ground: "#27304f", intensity: 1.2 },
      { id: "sun", type: "directional", color: "#fff1dc", intensity: 3, direction: [0.5, 0.7, 0.4], castShadow: true },
    ],
    objects: [
      { id: "sky", generator: "sky", visible: true, environmentSource: true, params: { horizon: "#ffd23f", low: "#ff7a3c", mid: "#f0407e", zenith: "#1e3fae", sunFrom: 0.2, sunTo: 0.2, sunPower: 9 } },
      { id: "ground", generator: "primitive", visible: true, params: { shape: "plane", size: 400, color: "#16324f", metalness: 0, roughness: 0.9 } },
    ],
  };
}

/* ---------------------------------------------------------- export and import */

/** The exact file a scene exports to. Stable, so saved scenes diff cleanly in Git. */
export const serializeScene = (s: CinemaScene) => `${JSON.stringify(s, null, 2)}\n`;

/** Reads an imported file. Text that is not JSON gets a plain error, as a bad scene does. */
export function importScene(text: string, knownGenerators: string[]): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["This file is not valid JSON."] };
  }
  const parsed = parseScene(value);
  if (!parsed.ok) return parsed;
  const known = new Set(knownGenerators);
  const unknown = [...new Set(parsed.scene.objects.map((o) => o.generator).filter((g) => !known.has(g)))];
  return unknown.length ? { ok: false, errors: unknown.map((g) => `Unknown object type "${g}".`) } : parsed;
}

/* ---------------------------------------------------------- history */

export type History = { past: CinemaScene[]; present: CinemaScene; future: CinemaScene[]; mergeKey: string | null };

const LIMIT = 100;

export const startHistory = (scene: CinemaScene): History => ({ past: [], present: scene, future: [], mergeKey: null });

/**
 * Records an edit. Consecutive edits with the same key are one undo step, so dragging a
 * slider does not fill the history with every value it passed through.
 */
export function commit(h: History, next: CinemaScene, mergeKey: string | null = null): History {
  if (next === h.present) return h;
  if (mergeKey !== null && mergeKey === h.mergeKey) return { ...h, present: next, future: [] };
  return { past: [...h.past, h.present].slice(-LIMIT), present: next, future: [], mergeKey };
}

export function undo(h: History): History {
  const prev = h.past.at(-1);
  if (!prev) return h;
  return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future], mergeKey: null };
}

export function redo(h: History): History {
  const next = h.future[0];
  if (!next) return h;
  return { past: [...h.past, h.present], present: next, future: h.future.slice(1), mergeKey: null };
}

/* ---------------------------------------------------------- what changed */

export type SceneDiff = {
  removeObjects: string[];
  addObjects: CinemaObject[];
  rebuildObjects: CinemaObject[];  // what it is changed: it must be built again
  placeObjects: CinemaObject[];    // only where it is, or whether it shows
  removeLights: string[];
  addLights: CinemaLight[];
  environment: boolean;
  camera: boolean;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** What the runtime must do to move from one scene to the next, doing no more than that. */
export function diffScene(a: CinemaScene, b: CinemaScene): SceneDiff {
  const before = new Map(a.objects.map((o) => [o.id, o]));
  const after = new Map(b.objects.map((o) => [o.id, o]));
  const d: SceneDiff = {
    removeObjects: a.objects.filter((o) => !after.has(o.id)).map((o) => o.id),
    addObjects: b.objects.filter((o) => !before.has(o.id)),
    rebuildObjects: [], placeObjects: [],
    removeLights: [], addLights: [],
    environment: !same(a.environment, b.environment),
    camera: !same(a.camera, b.camera),
  };
  for (const o of b.objects) {
    const old = before.get(o.id);
    if (!old || same(old, o)) continue;
    if (old.generator !== o.generator || !same(old.params, o.params) || old.environmentSource !== o.environmentSource) d.rebuildObjects.push(o);
    else d.placeObjects.push(o);
  }
  const lightsAfter = new Map(b.lights.map((l) => [l.id, l]));
  const lightsBefore = new Map(a.lights.map((l) => [l.id, l]));
  for (const l of a.lights) if (!same(l, lightsAfter.get(l.id))) d.removeLights.push(l.id);
  for (const l of b.lights) if (!same(l, lightsBefore.get(l.id))) d.addLights.push(l);
  return d;
}

export const defaultPlacement = (): Placement => ({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
