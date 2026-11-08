import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { AssetCache, LOCAL_ASSET } from "@/lib/cinema-engine/assets";
import { COMMON_GENERATORS } from "@/lib/cinema-engine/generators";
import { TIERS } from "@/lib/cinema-engine/quality";
import { disposeObject, type AssetSource, type BuildContext } from "@/lib/cinema-engine/runtime";
import { parseScene, type CinemaScene } from "@/lib/cinema-engine/schema";
import { JOURNEY_GENERATORS, scatterSites } from "@/lib/journey/scene-objects";
import { LAKE, STATION_AT, stationPosition } from "@/lib/journey/world";
import { blankScene, addObject } from "@/lib/cinema-engine/editor";

const root = process.cwd();
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("the asset cache", () => {
  const setup = () => {
    const load = vi.fn(async (url: string) => ({ url }));
    const free = vi.fn();
    return { load, free, cache: new AssetCache(load, free) };
  };

  it("loads a file once, however many use it", async () => {
    const { cache, load } = setup();
    const [a, b] = await Promise.all([cache.acquire("/a"), cache.acquire("/a")]);
    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("frees it only when the last user lets go", async () => {
    const { cache, free } = setup();
    await cache.acquire("/a"); await cache.acquire("/a");
    cache.release("/a"); await tick();
    expect(free).not.toHaveBeenCalled();
    cache.release("/a"); await tick();
    expect(free).toHaveBeenCalledTimes(1);
    expect(cache.size).toBe(0);
  });

  it("frees a file released while it was still loading", async () => {
    let finish: (v: object) => void = () => {};
    const free = vi.fn();
    const cache = new AssetCache(() => new Promise<object>((r) => { finish = r; }), free);
    void cache.acquire("/a");
    cache.release("/a");
    finish({});
    await tick();
    expect(free).toHaveBeenCalledTimes(1);
  });

  it("does not remember a failure, so a fixed file can load", async () => {
    let bad = true;
    const cache = new AssetCache(async () => { if (bad) throw new Error("nope"); return 1; }, () => {});
    await expect(cache.acquire("/a")).rejects.toThrow("nope");
    await tick();
    bad = false;
    await expect(cache.acquire("/a")).resolves.toBe(1);
  });
});

describe("what a scene may load", () => {
  it("allows only local assets", () => {
    expect(LOCAL_ASSET.test("/cinema/assets/boulder-01.glb")).toBe(true);
    for (const bad of ["https://evil.example/x.glb", "/cinema/assets/../secret.glb", "/cinema/assets/a/b.glb", "/api/backup", "/cinema/assets/x.exe", "/cinema/assets/.glb"]) {
      expect(LOCAL_ASSET.test(bad), bad).toBe(false);
    }
  });

  it("refuses a scene pointing a model elsewhere", () => {
    const scene = (params: object, generator = "model") => addObject(blankScene(), { generator, visible: true, params: params as Record<string, unknown> });
    expect(parseScene(scene({ src: "/cinema/assets/boulder-01.glb" })).ok).toBe(true);
    for (const src of ["/api/backup", "/cinema/assets/../../x.glb", "boulder.glb", "https://evil.example/x.glb"]) {
      expect(parseScene(scene({ src })).ok, src).toBe(false);
    }
    expect(parseScene(scene({})).ok).toBe(false);
    expect(parseScene(scene({ src: "/cinema/assets/photo.webp" })).ok).toBe(false);
    expect(parseScene(scene({ shape: "box", map: "/api/backup" }, "primitive")).ok).toBe(false);
    expect(parseScene(scene({ shape: "box", map: "/cinema/assets/stone.webp" }, "primitive")).ok).toBe(true);
  });
});

describe("loading models into a scene", () => {
  const proto = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()));
    return g;
  };
  const source = (o: THREE.Object3D | Error = proto()): AssetSource & { release: ReturnType<typeof vi.fn> } => {
    const release = vi.fn();
    return {
      release,
      models: { acquire: async () => { if (o instanceof Error) throw o; return o; }, release },
      loadTexture: async () => new THREE.Texture(),
    };
  };
  const ctx = (assets?: AssetSource, assetFailed = vi.fn()): BuildContext => ({ tier: TIERS.high, data: null, state: {}, invalidate: () => {}, assets, assetFailed });

  it("adds a shadowed copy that shares its geometry with the cache", async () => {
    const p = proto(), src = source(p);
    const { object } = COMMON_GENERATORS.model!({ src: "/cinema/assets/x.glb" }, ctx(src));
    await tick();
    const mesh = object.children[0]!.children[0] as THREE.Mesh;
    expect(mesh.castShadow).toBe(true);
    expect(mesh.geometry).toBe((p.children[0] as THREE.Mesh).geometry);
  });

  it("leaves shared geometry alone when a copy goes, and lets go of the cache", async () => {
    const p = proto(), src = source(p);
    const built = COMMON_GENERATORS.model!({ src: "/cinema/assets/x.glb" }, ctx(src));
    await tick();
    let freed = false;
    (p.children[0] as THREE.Mesh).geometry.addEventListener("dispose", () => { freed = true; });
    built.dispose!();
    disposeObject(built.object);
    expect(freed).toBe(false);
    expect(src.release).toHaveBeenCalledWith("/cinema/assets/x.glb");
  });

  it("the cache's own free does reach shared geometry", () => {
    const p = proto();
    p.userData.sharedAsset = true;
    let freed = false;
    (p.children[0] as THREE.Mesh).geometry.addEventListener("dispose", () => { freed = true; });
    disposeObject(p, { includeShared: true });
    expect(freed).toBe(true);
  });

  it("releases a model that finishes loading after its object was removed", async () => {
    const src = source();
    const built = COMMON_GENERATORS.model!({ src: "/cinema/assets/x.glb" }, ctx(src));
    built.dispose!();
    await tick();
    expect(src.release).toHaveBeenCalledTimes(1);
    expect(built.object.children).toHaveLength(0);
  });

  it("marks a failed model and reports it, without throwing", async () => {
    const failed = vi.fn();
    const { object } = COMMON_GENERATORS.model!({ src: "/cinema/assets/x.glb" }, ctx(source(new Error("corrupt")), failed));
    await tick();
    expect(object.children[0]!.name).toBe("missing-asset");
    expect(failed).toHaveBeenCalledWith("/cinema/assets/x.glb", "corrupt");
  });

  it("copes with a host that supplies no loaders", () => {
    const failed = vi.fn();
    COMMON_GENERATORS.model!({ src: "/cinema/assets/x.glb" }, ctx(undefined, failed));
    expect(failed).toHaveBeenCalled();
  });

  it("scatters in one draw call per mesh, and frees only its own position lists", async () => {
    const p = proto(), src = source(p);
    const built = JOURNEY_GENERATORS.scatter!({ src: "/cinema/assets/x.glb", count: 40 }, ctx(src));
    await tick();
    const [many] = built.object.children as THREE.InstancedMesh[];
    expect(built.object.children).toHaveLength(1);
    expect(many!.count).toBeGreaterThan(20);
    let geometryFreed = false, listFreed = false;
    (p.children[0] as THREE.Mesh).geometry.addEventListener("dispose", () => { geometryFreed = true; });
    many!.addEventListener("dispose", () => { listFreed = true; });
    built.dispose!();
    disposeObject(built.object);
    expect(listFreed).toBe(true);
    expect(geometryFreed).toBe(false);
    expect(src.release).toHaveBeenCalledTimes(1);
  });
});

describe("where scattered things stand", () => {
  const opts = { count: 60, seed: 3, near: 4, far: 24, scaleMin: 1, scaleMax: 2 };
  it("is the same on every visit", () => expect(scatterSites(opts)).toEqual(scatterSites(opts)));
  it("stays out of the lake and clear of every landmark", () => {
    for (const s of scatterSites(opts)) {
      expect(((s.x - LAKE.x) / LAKE.rx) ** 2 + ((s.z - LAKE.z) / LAKE.rz) ** 2).toBeGreaterThanOrEqual(1);
      for (let k = 0; k < STATION_AT.length; k++) {
        const p = stationPosition(k);
        expect(Math.hypot(p[0] - s.x, p[2] - s.z)).toBeGreaterThanOrEqual(9);
      }
    }
  });
});

describe("what ships", () => {
  const dir = path.join(root, "public/cinema/assets");
  const files = fs.readdirSync(dir);
  const credits = JSON.parse(fs.readFileSync(path.join(root, "public/cinema/credits.json"), "utf8")) as { file: string; license: string; page: string; licenseUrl: string; creator: string }[];
  const scene = JSON.parse(fs.readFileSync(path.join(root, "public/cinema/scenes/journey.json"), "utf8")) as CinemaScene;

  it("credits every model, with a real licence and source", () => {
    for (const f of files) {
      const c = credits.find((x) => x.file === `public/cinema/assets/${f}`);
      expect(c, f).toBeDefined();
      // Textures baked here are this project's own work; everything else comes from Poly Haven.
      if (c!.license === "Own work") { expect(c!.page, f).toBe("scripts/bake-marble.mjs"); continue; }
      expect(c!.license, f).toBe("CC0");
      expect(c!.page, f).toMatch(/^https:\/\/polyhaven\.com\/a\//);
    }
    for (const c of credits) expect(files, c.file).toContain(path.basename(c.file));
  });

  it("keeps each model small enough for a web page", () => {
    for (const f of files) expect(fs.statSync(path.join(dir, f)).size, f).toBeLessThan(1_500_000);
    // What one page can download: every model its scene names, and all the shared textures.
    const textures = files.filter((f) => f.endsWith(".webp"));
    const scenesDir = path.join(root, "public/cinema/scenes");
    for (const file of fs.readdirSync(scenesDir)) {
      const s = JSON.parse(fs.readFileSync(path.join(scenesDir, file), "utf8")) as CinemaScene;
      const models = [...new Set(s.objects.map((o) => o.params.src).filter((x): x is string => typeof x === "string").map((x) => path.basename(x)))];
      const bytes = [...models, ...textures].reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
      expect(bytes, file).toBeLessThan(6_000_000);
    }
  });

  it("serves the Draco decoder from this site", () => {
    for (const f of ["draco_decoder.wasm", "draco_wasm_wrapper.js"]) expect(fs.existsSync(path.join(root, "public/cinema/draco", f)), f).toBe(true);
  });

  it("uses only models that exist", () => {
    for (const o of scene.objects) {
      const src = o.params.src;
      if (typeof src === "string") expect(files, o.id).toContain(path.basename(src));
    }
  });

  it("allows WebAssembly without allowing eval in production", () => {
    const config = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
    expect(config).toContain("'wasm-unsafe-eval'");
    expect(config).toContain("worker-src 'self' blob:");
    expect(config).toContain("connect-src 'self' blob:");
    expect(config).toMatch(/isDev \? " 'unsafe-eval'" : ""/);
  });
});
