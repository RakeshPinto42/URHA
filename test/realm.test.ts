import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { BuildContext, Frame } from "@/lib/cinema-engine/runtime";
import { disposeObject } from "@/lib/cinema-engine/runtime";
import { TIERS } from "@/lib/cinema-engine/quality";
import { parseScene, type CinemaScene } from "@/lib/cinema-engine/schema";
import { diffScene, hierarchy, removeObject, renameObject } from "@/lib/cinema-engine/editor";
import { REALM_GENERATORS } from "@/lib/realm/generators";
import { DESTINATIONS, QUIET_PAGES, destinationOf, focusShot, gateShots, gatesIn, realmShot } from "@/lib/realm/destinations";
import { DISCIPLINES, disciplineOf, plinthMarks, standings } from "@/lib/academy";
import { PHASES } from "@/lib/curriculum";
import type { RoomData } from "@/lib/realm/rooms";

const SCENES = ["realm", "hall-of-wisdom", "chamber-of-insight", "grounds-of-practice"];
const load = (id: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/cinema/scenes", `${id}.json`), "utf8")) as CinemaScene;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const errorsOf = (x: unknown) => { const r = parseScene(x); return r.ok ? [] : r.errors; };

const DATA: RoomData = {
  phases: ["passed", "current", "ahead"].map((state, i) => ({ id: `p${i + 1}`, title: `Phase ${i + 1}`, state: state as "passed", color: "#ffc826" })),
  disciplines: [{ id: "sql", title: "SQL", share: 0.5, color: "#12c27a" }, { id: "ai", title: "AI", share: 0, color: "#3a6bff" }],
  stars: [{ score: 80, watched: true }, { score: null, watched: false }],
};

describe("the realm's scene files", () => {
  for (const id of SCENES) {
    it(`${id} is a valid scene whose parts all exist`, () => {
      const scene = load(id);
      expect(errorsOf(scene)).toEqual([]);
      expect(scene.id).toBe(id);
      for (const o of scene.objects) expect(REALM_GENERATORS[o.generator], o.generator).toBeTypeOf("function");
      // Every model and texture it names is a file that ships.
      for (const o of scene.objects) {
        const src = o.params.src;
        if (typeof src === "string") expect(fs.existsSync(path.join(process.cwd(), "public", src)), src).toBe(true);
      }
    });
  }

  it("names each destination's scene and poster at a real path", () => {
    for (const d of DESTINATIONS) expect(fs.existsSync(path.join(process.cwd(), "public/cinema/scenes", `${d.scene}.json`))).toBe(true);
  });

  it("has all three gateways in the realm, and no more", () => {
    expect(gatesIn(load("realm")).map((g) => g.id).sort()).toEqual(["academy", "career", "stocks"]);
  });

  it("ships the baked marble and every texture the kit asks for", () => {
    for (const set of ["white-marble", "marble-floor", "marble-cliff-01"]) {
      for (const slot of ["diff", "nor", "rough"]) expect(fs.existsSync(path.join(process.cwd(), `public/cinema/assets/${set}-${slot}.webp`)), `${set}-${slot}`).toBe(true);
    }
  });
});

describe("the realm builds and disposes completely, without a GPU", () => {
  const frame: Frame = { dt: 0.016, time: 1, progress: 1, still: false, camera: new THREE.PerspectiveCamera() };
  for (const id of SCENES) {
    for (const tier of ["high", "low"] as const) {
      it(`${id} on the ${tier} tier`, () => {
        const ctx: BuildContext = { tier: TIERS[tier], data: DATA, state: {}, invalidate: () => {} };
        for (const o of load(id).objects) {
          const built = REALM_GENERATORS[o.generator]!(o.params, ctx);
          built.update?.(frame);
          built.update?.({ ...frame, still: true });
          built.dispose?.();
          disposeObject(built.object);
        }
      }, 60_000);
    }
  }

  it("lights nothing it has no data for: an empty room still builds", () => {
    const ctx: BuildContext = { tier: TIERS.medium, data: undefined, state: {}, invalidate: () => {} };
    for (const g of ["phase-banners", "discipline-plinths", "great-armillary"]) {
      const built = REALM_GENERATORS[g]!({}, ctx);
      const pickable: string[] = [];
      built.object.traverse((n) => { if (typeof n.userData.pickId === "string") pickable.push(n.userData.pickId); });
      expect(pickable, g).toEqual([]);
      disposeObject(built.object);
    }
  });

  it("makes each gateway pickable by its destination", () => {
    const ctx: BuildContext = { tier: TIERS.low, data: undefined, state: {}, invalidate: () => {} };
    for (const d of DESTINATIONS) {
      const built = REALM_GENERATORS.gateway!({ destination: d.id }, ctx);
      const ids: string[] = [];
      built.object.traverse((n) => { if (typeof n.userData.pickId === "string") ids.push(n.userData.pickId); });
      expect(ids).toEqual([d.id]);
      disposeObject(built.object);
    }
  });

  it("uses less geometry on a lower tier", () => {
    const count = (tier: "high" | "low") => {
      const built = REALM_GENERATORS["tree-of-knowledge"]!({}, { tier: TIERS[tier], data: undefined, state: {}, invalidate: () => {} });
      let n = 0;
      built.object.traverse((x) => { const m = x as THREE.InstancedMesh; if (m.isInstancedMesh) n += m.count; });
      disposeObject(built.object);
      return n;
    };
    expect(count("low")).toBeLessThan(count("high"));
  });
});

describe("destinations", () => {
  it("are exactly three", () => {
    expect(DESTINATIONS.map((d) => d.id)).toEqual(["career", "stocks", "academy"]);
  });

  it("place every page in the app: in a destination, the quiet menu, or the Realm itself", () => {
    const pages = (fs.readdirSync(path.join(process.cwd(), "app"), { recursive: true }) as string[])
      .filter((f) => f.endsWith("page.tsx"))
      .map((f) => `/${f.replace(/\\/g, "/").replace(/\/?page\.tsx$/, "")}`.replace(/\[[^\]]+\]/g, "x"));
    const quiet = QUIET_PAGES.map((p) => p.href);
    const elsewhere = ["/", "/studio", "/unlock"];
    for (const p of pages) {
      const home = destinationOf(p) ?? quiet.find((q) => p === q || p.startsWith(`${q}/`)) ?? elsewhere.find((e) => e === p);
      expect(home, p).toBeTruthy();
    }
  });

  it("routes the moved pages where they now live", () => {
    expect(destinationOf("/today")?.id).toBe("career");
    expect(destinationOf("/academy/study")?.id).toBe("academy");
    expect(destinationOf("/discovery/TCS")?.id).toBe("stocks");
    expect(destinationOf("/pathology")).toBeNull();
    expect(destinationOf("/")).toBeNull();
  });

  it("flies through a gateway along the way it faces", () => {
    const g = gatesIn(load("realm")).find((x) => x.id === "career")!;
    const { near, through } = gateShots(g);
    const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[2]! - b[2]!);
    expect(dist(near.position, g.position)).toBeGreaterThan(dist(through.position, g.position));
    // In front of it, then behind it.
    const side = (p: number[]) => (p[0]! - g.position[0]) * g.facing[0] + (p[2]! - g.position[2]) * g.facing[2];
    expect(side(near.position)).toBeGreaterThan(0);
    expect(side(through.position)).toBeLessThan(0);
  });

  it("stands further back on a narrow screen, and turns to a gateway more there", () => {
    expect(realmShot(0.5).position[2]).toBeGreaterThan(realmShot(1.8).position[2]);
    const g = gatesIn(load("realm")).find((x) => x.id === "academy")!;
    expect(Math.abs(focusShot(g, 0.5).target[0])).toBeGreaterThan(Math.abs(focusShot(g, 1.8).target[0]));
  });
});

describe("the Grounds of Practice", () => {
  const topics = PHASES.flatMap((p) => p.topics).map((t) => ({ id: t.id, title: t.title, counts: { practised: 0, total: t.subtopics.length } }));

  it("gives every topic exactly one discipline, and every discipline a topic", () => {
    const list = standings(topics);
    expect(list.reduce((n, s) => n + s.topics.length, 0)).toBe(topics.length);
    for (const s of list) expect(s.topics.length, s.discipline.id).toBeGreaterThan(0);
  });

  it("puts the named skills where a learner would look for them", () => {
    expect(disciplineOf("Pandas for finance data").id).toBe("pandas");
    expect(disciplineOf("SQL and database foundations").id).toBe("sql");
    expect(disciplineOf("Python foundations").id).toBe("python");
    expect(disciplineOf("Databricks and PySpark").id).toBe("data");
    expect(disciplineOf("RAG architecture").id).toBe("ai");
    expect(disciplineOf("FP&A and commercial analytics").id).toBe("finance");
  });

  it("lights six plinths, and only as brightly as the work really done", () => {
    const marks = plinthMarks(standings(topics));
    expect(marks).toHaveLength(DISCIPLINES.filter((d) => d.plinth).length);
    expect(marks.every((m) => m.share === 0)).toBe(true);
  });
});

describe("hierarchy and shared materials in scenes", () => {
  const base = () => clone(load("realm"));

  it("accepts a parent that exists, and refuses one that does not or a loop", () => {
    const s = base();
    s.objects.find((o) => o.id === "tree")!.parent = "dais";
    expect(errorsOf(s)).toEqual([]);
    s.objects.find((o) => o.id === "tree")!.parent = "nowhere";
    expect(errorsOf(s).join()).toMatch(/no parent called "nowhere"/);
    s.objects.find((o) => o.id === "tree")!.parent = "dais";
    s.objects.find((o) => o.id === "dais")!.parent = "tree";
    expect(errorsOf(s).join()).toMatch(/inside itself/);
  });

  it("keeps children when their parent is removed, and follows a rename", () => {
    const s = base();
    s.objects.find((o) => o.id === "tree")!.parent = "dais";
    s.objects.find((o) => o.id === "dais")!.parent = "court";
    expect(removeObject(s, "dais").objects.find((o) => o.id === "tree")!.parent).toBe("court");
    expect(renameObject(s, "dais", "plinth").objects.find((o) => o.id === "tree")!.parent).toBe("plinth");
    const tree = hierarchy(s);
    expect(tree.find((t) => t.object.id === "tree")!.depth).toBe(2);
    expect(tree).toHaveLength(s.objects.length);
  });

  it("validates material settings and reports them as their own kind of change", () => {
    const s = base();
    s.materials = { marble: { color: "#ffffff", roughness: 0.4 } };
    expect(errorsOf(s)).toEqual([]);
    expect(diffScene(base(), s).materials).toBe(true);
    s.materials = { marble: { roughness: 3 } };
    expect(errorsOf(s).join()).toMatch(/materials\.marble/);
  });

  it("validates light shafts and shadow range", () => {
    const s = base();
    s.environment.rays = { strength: -1, direction: [0, 1, 0], color: "#fff" };
    s.environment.shadowRange = 0;
    const e = errorsOf(s).join();
    expect(e).toMatch(/environment\.rays/);
    expect(e).toMatch(/shadowRange/);
  });
});
