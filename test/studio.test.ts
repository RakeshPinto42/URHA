import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { COMMON_GENERATORS } from "@/lib/cinema-engine/generators";
import {
  addLight, addObject, blankScene, commit, diffScene, duplicateLight, duplicateObject, importScene, redo, removeLight, removeObject,
  renameObject, serializeScene, startHistory, undo, uniqueId, updateLight, updateObject,
} from "@/lib/cinema-engine/editor";
import { CAMERA_VIEWS, viewShot, walkStep } from "@/lib/cinema-engine/camera-views";
import { parseScene, type CinemaScene } from "@/lib/cinema-engine/schema";
import { disposeObject, type BuildContext } from "@/lib/cinema-engine/runtime";
import { TIERS } from "@/lib/cinema-engine/quality";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";

const journey = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/cinema/scenes/journey.json"), "utf8")) as CinemaScene;
const known = Object.keys(JOURNEY_GENERATORS);
const box = { generator: "primitive", visible: true, params: { shape: "box", size: 4, color: "#ff0000" } };

describe("editing a scene", () => {
  it("gives every new thing a unique id", () => {
    expect(uniqueId("box", ["box", "box-2"])).toBe("box-3");
    expect(uniqueId("box-2", ["box", "box-2"])).toBe("box-3");
    const s = addObject(addObject(blankScene(), box), box);
    expect(s.objects.map((o) => o.id)).toEqual(["sky", "ground", "primitive", "primitive-2"]);
  });

  it("keeps ids unique across objects and lights", () => {
    const s = addObject(blankScene(), { ...box, id: "sun" });
    expect(s.objects.at(-1)!.id).toBe("sun-2");
  });

  it("never changes the scene it was given", () => {
    const s = blankScene();
    const before = JSON.stringify(s);
    updateObject(addObject(s, box), "primitive", { visible: false });
    removeObject(s, "ground");
    expect(JSON.stringify(s)).toBe(before);
  });

  it("duplicates beside the original, as an independent copy", () => {
    let s = addObject(blankScene(), { ...box, placement: { position: [1, 2, 3], rotation: [0, 0, 0], scale: [1, 1, 1] } });
    s = duplicateObject(s, "primitive");
    const copy = s.objects.at(-1)!;
    expect(copy.id).toBe("primitive-2");
    expect(copy.placement!.position).toEqual([7, 2, 3]);
    copy.params.color = "#00ff00";
    expect(s.objects.find((o) => o.id === "primitive")!.params.color).toBe("#ff0000");
  });

  it("does not make a second reflection source when the sky is duplicated", () => {
    const s = duplicateObject(blankScene(), "sky");
    expect(s.objects.filter((o) => o.environmentSource)).toHaveLength(1);
  });

  it("renames without colliding", () => {
    const s = renameObject(blankScene(), "ground", "sky");
    expect(s.objects.map((o) => o.id)).toEqual(["sky", "sky-2"]);
  });

  it("adds, edits, copies and removes lights", () => {
    let s = addLight(blankScene(), { type: "point", color: "#ff0000", intensity: 5, position: [0, 4, 0], distance: 30 });
    expect(s.lights.at(-1)!.id).toBe("point-light");
    s = updateLight(s, "point-light", { intensity: 9 });
    expect(s.lights.at(-1)!.intensity).toBe(9);
    s = duplicateLight(s, "point-light");
    expect(s.lights.at(-1)!.id).toBe("point-light-2");
    s = removeLight(s, "point-light-2");
    expect(s.lights.some((l) => l.id === "point-light-2")).toBe(false);
  });

  it("supports all the light types the brief names", () => {
    let s = blankScene();
    s = addLight(s, { type: "ambient", color: "#ffffff", intensity: 0.4 });
    s = addLight(s, { type: "spot", color: "#ffcc88", intensity: 40, position: [0, 20, 0], target: [0, 0, 0], angle: 0.5, penumbra: 0.4, distance: 80, castShadow: true });
    s = addLight(s, { type: "point", color: "#88ccff", intensity: 10, position: [4, 4, 4], distance: 30 });
    expect(new Set(s.lights.map((l) => l.type))).toEqual(new Set(["ambient", "hemisphere", "directional", "spot", "point"]));
    expect(parseScene(s).ok).toBe(true);
    const wide = { ...s, lights: [{ id: "x", type: "spot", color: "#ffffff", intensity: 1, position: [0, 0, 0], target: [0, 0, 0], angle: 2, penumbra: 2, distance: 1 }] };
    expect(parseScene(wide).ok).toBe(false);
  });

  it("every edit leaves a valid scene", () => {
    let s = blankScene();
    s = addObject(s, box);
    s = updateObject(s, "primitive", { placement: { position: [1, 2, 3], rotation: [0, 1, 0], scale: [2, 2, 2] }, motion: { spin: [0, 1, 0], float: { height: 1, speed: 2 } } });
    s = duplicateObject(s, "primitive");
    s = addLight(s, { type: "point", color: "#ffffff", intensity: 2, position: [0, 3, 0], distance: 20 });
    expect(parseScene(s)).toEqual({ ok: true, scene: s });
  });
});

describe("export and import (brief §5)", () => {
  it("restores a fully edited scene exactly", () => {
    let s = blankScene("exact");
    s = addObject(s, { ...box, placement: { position: [1.5, 2.25, -3], rotation: [0.1, 0.2, 0.3], scale: [2, 1, 0.5] }, motion: { spin: [0, 0.5, 0], float: { height: 0.5, speed: 1.5 } } });
    s = addObject(s, { generator: "particles", visible: false, params: { count: 200, color: "#00ffaa", area: 80, height: 12, size: 60 } });
    s = addLight(s, { type: "directional", color: "#ffeeaa", intensity: [0.1, 3], direction: [1, 1, 0], castShadow: true });
    s = { ...s, camera: { ...s.camera, fov: 35, position: [10, 20, 30], target: [1, 2, 3], speed: 12 } };
    s = { ...s, environment: { ...s.environment, fog: { color: ["#000000", "#ffffff"], density: 0.01 }, exposure: [0.5, 1.2], bloom: { strength: 0.8, radius: 0.5, threshold: 1 } } };
    s = { ...s, timelines: [{ id: "reveal", seconds: 4 }] };
    const back = importScene(serializeScene(s), [...known]);
    expect(back).toEqual({ ok: true, scene: s });
  });

  it("round-trips the shipped journey scene", () => {
    expect(importScene(serializeScene(journey), known)).toEqual({ ok: true, scene: journey });
  });

  it("exports the same bytes each time, so saved scenes diff cleanly", () => {
    expect(serializeScene(journey)).toBe(serializeScene(JSON.parse(serializeScene(journey))));
  });

  it("explains a file that is not JSON", () => {
    expect(importScene("not json {", known)).toEqual({ ok: false, errors: ["This file is not valid JSON."] });
  });

  it("refuses an object type this engine cannot build", () => {
    const s = addObject(blankScene(), { generator: "dragon", visible: true, params: {} });
    expect(importScene(serializeScene(s), known)).toEqual({ ok: false, errors: ['Unknown object type "dragon".'] });
  });

  it("refuses bad placements, motion and camera values", () => {
    const bad = (patch: object) => parseScene({ ...blankScene(), ...patch });
    const obj = (x: object) => ({ objects: [{ id: "a", generator: "primitive", visible: true, params: {}, ...x }] });
    expect(bad(obj({ placement: { position: [0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } })).ok).toBe(false);
    expect(bad(obj({ motion: { spin: "fast" } })).ok).toBe(false);
    expect(bad(obj({ motion: { float: { height: 1 } } })).ok).toBe(false);
    expect(bad({ camera: { fov: 40, near: 1, far: 10, speed: -1 } }).ok).toBe(false);
  });
});

describe("undo and redo", () => {
  const a = blankScene();
  const b = addObject(a, box);
  const c = removeObject(b, "ground");

  it("steps back and forward through edits", () => {
    let h = commit(commit(startHistory(a), b), c);
    h = undo(h); expect(h.present).toBe(b);
    h = undo(h); expect(h.present).toBe(a);
    h = undo(h); expect(h.present).toBe(a);
    h = redo(h); expect(h.present).toBe(b);
    h = redo(h); h = redo(h); expect(h.present).toBe(c);
  });

  it("a new edit discards what could have been redone", () => {
    let h = undo(commit(startHistory(a), b));
    h = commit(h, c);
    expect(h.future).toEqual([]);
    expect(redo(h).present).toBe(c);
  });

  it("treats one drag of a slider as one step", () => {
    let h = startHistory(a);
    for (let i = 0; i < 20; i++) h = commit(h, updateObject(a, "ground", { visible: i % 2 === 0 }), "ground.visible");
    expect(h.past).toHaveLength(1);
    expect(undo(h).present).toBe(a);
  });

  it("does not grow without limit", () => {
    let h = startHistory(a);
    for (let i = 0; i < 150; i++) h = commit(h, { ...a, title: `v${i}` });
    expect(h.past.length).toBe(100);
  });
});

describe("the diff does only what is needed", () => {
  const base = addObject(blankScene(), box);

  it("sees nothing when nothing changed", () => {
    const d = diffScene(base, JSON.parse(JSON.stringify(base)));
    expect(d).toEqual({ removeObjects: [], addObjects: [], rebuildObjects: [], placeObjects: [], removeLights: [], addLights: [], environment: false, camera: false, materials: false });
  });

  it("moves an object without rebuilding it", () => {
    const d = diffScene(base, updateObject(base, "primitive", { placement: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } }));
    expect(d.placeObjects.map((o) => o.id)).toEqual(["primitive"]);
    expect(d.rebuildObjects).toEqual([]);
  });

  it("hides an object without rebuilding it", () => {
    expect(diffScene(base, updateObject(base, "primitive", { visible: false })).rebuildObjects).toEqual([]);
  });

  it("rebuilds only an object whose content changed", () => {
    const d = diffScene(base, updateObject(base, "primitive", { params: { ...box.params, color: "#00ff00" } }));
    expect(d.rebuildObjects.map((o) => o.id)).toEqual(["primitive"]);
    expect(d.placeObjects).toEqual([]);
  });

  it("swaps a changed light, and spots added and removed things", () => {
    const d = diffScene(base, removeObject(updateLight(base, "sun", { intensity: 9 }), "ground"));
    expect(d.removeLights).toEqual(["sun"]);
    expect(d.addLights.map((l) => l.id)).toEqual(["sun"]);
    expect(d.removeObjects).toEqual(["ground"]);
  });

  it("notices environment and camera changes", () => {
    expect(diffScene(base, { ...base, camera: { ...base.camera, fov: 30 } }).camera).toBe(true);
    expect(diffScene(base, { ...base, environment: { ...base.environment, exposure: 2 } }).environment).toBe(true);
  });
});

describe("camera views (brief §3)", () => {
  it("offers the five views the brief names", () => {
    expect(CAMERA_VIEWS.map((v) => v.label)).toEqual(["Orbit", "Top-down", "Isometric", "First-person", "Third-person"]);
  });

  it("looks straight down in top-down, at the subject", () => {
    const s = viewShot("top-down", [10, 0, 5], 50);
    expect(s.position[0]).toBe(10);
    expect(s.position[1]).toBeGreaterThan(50);
    expect(s.target).toEqual([10, 0, 5]);
  });

  it("uses a long lens for isometric", () => {
    expect(viewShot("isometric", [0, 0, 0], 50).fov).toBe(12);
    expect(viewShot("isometric", [0, 0, 0], 50).fogScale).toBeLessThan(1);
    expect(viewShot("orbit", [0, 0, 0], 50).fov).toBeNull();
  });

  it("walks where the camera faces, at its speed", () => {
    const ahead = walkStep([0, 0, 0], 0, { forward: 1, right: 0, up: 0 }, 10, 1);
    expect(ahead[0]).toBeCloseTo(0);
    expect(ahead[2]).toBeCloseTo(-10);
    const [x, , z] = walkStep([0, 0, 0], Math.PI / 2, { forward: 1, right: 0, up: 0 }, 10, 1);
    expect(x).toBeCloseTo(-10);
    expect(z).toBeCloseTo(0);
  });
});

describe("common objects", () => {
  const ctx: BuildContext = { tier: TIERS.low, data: null, state: {}, invalidate: () => {} };

  it("gives a shape a real material", () => {
    const { object } = COMMON_GENERATORS.primitive!({ shape: "sphere", size: 2, color: "#102030", metalness: 0.9, roughness: 0.2, emissive: "#ff0000", emissiveIntensity: 3 }, ctx);
    const m = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect([m.metalness, m.roughness, m.emissiveIntensity]).toEqual([0.9, 0.2, 3]);
  });

  it("builds every shape, and frees it", () => {
    for (const shape of ["box", "sphere", "cylinder", "cone", "torus", "plane"]) {
      const { object } = COMMON_GENERATORS.primitive!({ shape }, ctx);
      const g = (object as THREE.Mesh).geometry;
      let freed = false;
      g.addEventListener("dispose", () => { freed = true; });
      disposeObject(object);
      expect(freed, shape).toBe(true);
    }
  });

  it("lays particles out the same way every time", () => {
    const pts = (o: THREE.Object3D) => Array.from(((o as THREE.Points).geometry.attributes.position as THREE.BufferAttribute).array);
    expect(pts(COMMON_GENERATORS.particles!({ count: 50 }, ctx).object)).toEqual(pts(COMMON_GENERATORS.particles!({ count: 50 }, ctx).object));
  });
});
