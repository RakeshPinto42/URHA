import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { FrameWatch, TIERS, nextTierDown, pickTier } from "@/lib/cinema-engine/quality";
import { parseScene, resolveNumber, ends, type CinemaScene } from "@/lib/cinema-engine/schema";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";
import type { BuildContext, Frame } from "@/lib/cinema-engine/runtime";
import type { JourneyData } from "@/lib/journey/model";
import { STATION_AT } from "@/lib/journey/world";

// A node-only copy of the runtime's disposal walk would drift, so the real one is used. Its module
// pulls in browser-free three.js addons only, which import fine in Node.
import { disposeObject } from "@/lib/cinema-engine/runtime";

const scene = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/cinema/scenes/journey.json"), "utf8")) as CinemaScene;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const errorsOf = (x: unknown) => { const r = parseScene(x); return r.ok ? [] : r.errors; };

describe("the scene format", () => {
  it("accepts the journey scene as shipped", () => {
    expect(errorsOf(scene)).toEqual([]);
  });

  it("survives a JSON round trip unchanged, which export and import rely on", () => {
    const r = parseScene(JSON.parse(JSON.stringify(scene)));
    expect(r.ok && r.scene).toEqual(scene);
  });

  it("names every problem at once", () => {
    const bad = clone(scene);
    bad.version = 99;
    bad.camera.fov = 500;
    bad.environment.exposure = -1;
    bad.objects[0]!.id = "Not Valid";
    const errors = errorsOf(bad);
    expect(errors.length).toBe(4);
    expect(errors.join()).toMatch(/version/);
    expect(errors.join()).toMatch(/camera/);
    expect(errors.join()).toMatch(/exposure/);
    expect(errors.join()).toMatch(/objects\[0\]\.id/);
  });

  it("refuses duplicate object ids", () => {
    const bad = clone(scene);
    bad.objects[1]!.id = bad.objects[0]!.id;
    expect(errorsOf(bad).join()).toMatch(/used twice/);
  });

  it("refuses a bad colour and an unknown light", () => {
    const bad = clone(scene) as unknown as { lights: Record<string, unknown>[] };
    bad.lights[1]!.color = "red";
    bad.lights[2]!.type = "laser";
    expect(errorsOf(bad).join()).toMatch(/#rrggbb/);
    expect(errorsOf(bad).join()).toMatch(/unknown light/);
  });

  it("refuses remote addresses hidden in parameters, because imported files are untrusted", () => {
    for (const url of ["https://evil.example/x.glb", "//evil.example/x.glb", "data:text/html,x", "javascript:alert(1)"]) {
      const bad = clone(scene);
      bad.objects[0]!.params.deep = { list: [{ src: url }] };
      expect(errorsOf(bad).join(), url).toMatch(/remote addresses/);
    }
  });

  it("refuses things that are not a scene at all", () => {
    for (const x of [null, 1, "scene", [], {}]) expect(parseScene(x).ok).toBe(false);
  });

  it("refuses absurd sizes rather than trying to build them", () => {
    const bad = clone(scene);
    bad.objects = Array.from({ length: 257 }, (_, i) => ({ id: `o${i}`, generator: "sky", visible: true, params: {} }));
    expect(errorsOf(bad).join()).toMatch(/at most 256/);
  });

  it("resolves animated values along a timeline", () => {
    expect(resolveNumber(2, 0.5)).toBe(2);
    expect(resolveNumber([0, 10], 0.25)).toBe(2.5);
    expect(ends("#000000")).toEqual(["#000000", "#000000"]);
    expect(ends(["#000000", "#ffffff"])).toEqual(["#000000", "#ffffff"]);
  });
});

describe("quality tiers", () => {
  it("picks a tier from the device", () => {
    expect(pickTier({ renderer: "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650)", mobile: false })).toBe("high");
    expect(pickTier({ renderer: "ANGLE (AMD, AMD Radeon(TM) Graphics)", mobile: false })).toBe("medium");
    expect(pickTier({ renderer: "ANGLE (Intel, Intel(R) UHD Graphics)", mobile: false })).toBe("medium");
    expect(pickTier({ renderer: "Google SwiftShader", mobile: false })).toBe("low");
    expect(pickTier({ renderer: "ANGLE (NVIDIA, RTX 4090)", mobile: true })).toBe("low");
    expect(pickTier({ renderer: null, mobile: false })).toBe("medium");
  });

  it("honours an override, and ignores a nonsense one", () => {
    expect(pickTier({ renderer: "Google SwiftShader", mobile: false, override: "high" })).toBe("high");
    expect(pickTier({ renderer: "Google SwiftShader", mobile: false, override: "ultra" })).toBe("low");
  });

  it("each tier is cheaper than the one above", () => {
    expect(TIERS.high.shadowMap).toBeGreaterThan(TIERS.medium.shadowMap);
    expect(TIERS.low.shadowMap).toBe(0);
    expect(TIERS.low.bloomScale).toBe(0);
    expect(TIERS.medium.detail).toBeLessThan(TIERS.high.detail);
    expect(nextTierDown("high")).toBe("medium");
    expect(nextTierDown("low")).toBeNull();
  });

  const run = (w: FrameWatch, frames: number, ms: number, lowest = false) => {
    let last = "ok";
    for (let i = 0; i < frames; i++) { const v = w.record(ms, lowest); if (v !== "ok") last = v; }
    return last;
  };

  it("ignores the slow first frames, when shaders compile", () => {
    expect(run(new FrameWatch(), 60, 500)).toBe("ok");
  });
  it("steps down when the machine stays slow, and not when it is fine", () => {
    expect(run(new FrameWatch(), 200, 16)).toBe("ok");
    expect(run(new FrameWatch(), 200, 60)).toBe("step-down");
  });
  it("gives up only when even the lowest tier is unusable", () => {
    expect(run(new FrameWatch(), 200, 60, true)).toBe("ok");
    expect(run(new FrameWatch(), 200, 150, true)).toBe("too-slow");
  });
  it("is not fooled by a hidden tab's long gap", () => {
    const w = new FrameWatch();
    run(w, 60, 16);
    w.record(100000, false);
    expect(run(w, 89, 16)).toBe("ok");
  });
});

describe("the journey world builds and disposes completely", () => {
  const data: JourneyData = {
    currentIndex: 1, fraction: 0.5, walkerT: 0.3,
    stations: STATION_AT.map((_, i) => ({
      id: `p${i + 1}`, ord: i + 1, title: "t", short: "s", landmark: `L${i}`, months: [1, 2] as [number, number],
      state: i === 0 ? "passed" as const : i === 1 ? "current" as const : "ahead" as const, practised: 0, total: 1,
    })),
  };
  const ctx = (tier: keyof typeof TIERS): BuildContext => ({ tier: TIERS[tier], data, state: {}, invalidate: () => {} });
  const frame: Frame = { dt: 0.016, time: 1, progress: 0.5, still: false, camera: new THREE.PerspectiveCamera() };

  it("has a generator for every object in the scene", () => {
    for (const o of scene.objects) expect(JOURNEY_GENERATORS[o.generator], o.generator).toBeDefined();
  });

  for (const tier of ["high", "low"] as const) {
    it(`frees every geometry, material and texture on the ${tier} tier`, () => {
      for (const o of scene.objects) {
        const built = JOURNEY_GENERATORS[o.generator]!(o.params, ctx(tier));
        built.update?.(frame);

        const owned = new Set<THREE.EventDispatcher<{ dispose: object }>>();
        built.object.traverse((n) => {
          const m = n as THREE.Mesh;
          if (m.geometry) owned.add(m.geometry as never);
          for (const mat of Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) {
            owned.add(mat as never);
            for (const v of Object.values(mat)) if (v instanceof THREE.Texture) owned.add(v as never);
          }
        });
        expect(owned.size, o.id).toBeGreaterThan(0);

        const freed = new Set<unknown>();
        for (const x of owned) x.addEventListener("dispose", () => freed.add(x));
        built.dispose?.();
        disposeObject(built.object);
        expect(freed.size, o.id).toBe(owned.size);
      }
    });
  }

  it("makes stations pickable by phase id, and light never blocks a click", () => {
    const o = scene.objects.find((x) => x.generator === "stations")!;
    const built = JOURNEY_GENERATORS.stations!(o.params, ctx("low"));
    expect(built.object.userData.pickable).toBe(true);
    const ids: string[] = [];
    built.object.traverse((n) => { if (typeof n.userData.pickId === "string") ids.push(n.userData.pickId); });
    expect(ids).toEqual(data.stations.map((s) => s.id));
  });

  it("uses less geometry on a lower tier", () => {
    const o = scene.objects.find((x) => x.generator === "terrain")!;
    const verts = (t: "high" | "low") => ((JOURNEY_GENERATORS.terrain!(o.params, ctx(t)).object as THREE.Mesh).geometry.attributes.position!.count);
    expect(verts("low")).toBeLessThan(verts("high"));
  });

  it("captures reflections only from the sky", () => {
    expect(scene.objects.filter((o) => o.environmentSource).map((o) => o.id)).toEqual(["sky"]);
  });
});
