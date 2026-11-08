import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { EXERCISES, publicExercises } from "@/lib/practice/exercises";
import { EXPECT, runPlan } from "@/lib/practice/harness";
import { PHASES } from "@/lib/curriculum";

// The same Python the browser runs, with the same data, in Node. Skipped, with a reason,
// when the runtime has not been installed with `npm run python:fetch`.
const RUNTIME = path.join(process.cwd(), "public/python/runtime");
const DATA = path.join(process.cwd(), "public/practice/data");
const installed = fs.existsSync(path.join(RUNTIME, "manifest.json"));

type Py = Awaited<ReturnType<typeof import("pyodide").loadPyodide>>;
let py: Py;

async function attempt(e: (typeof EXERCISES)[number], code: string) {
  py.runPython(`import shutil, os\nos.chdir("/")\nshutil.rmtree("/home/pyodide/data", ignore_errors=True)\nos.makedirs("/home/pyodide/data", exist_ok=True)\nos.chdir("/home/pyodide/data")`);
  for (const f of e.datasets) py.FS.writeFile(`/home/pyodide/data/${f}`, fs.readFileSync(path.join(DATA, f), "utf8"));
  for (const [name, text] of Object.entries(e.files ?? {})) py.FS.writeFile(`/home/pyodide/data/${name}`, text);
  const plan = runPlan(e, code);
  const ns = py.globals.get("dict")();
  try {
    if (plan.sql !== null) ns.set("__sql", plan.sql);
    await py.runPythonAsync(plan.code, { globals: ns });
    py.runPython(EXPECT, { globals: ns });
    py.runPython(e.checks, { globals: ns });
    return (ns.get("_results").toJs() as [string, boolean, string][]).map(([label, passed, hint]) => ({ label, passed, hint }));
  } catch (err) {
    return [{ label: String(err).split("\n").filter(Boolean).at(-1) ?? String(err), passed: false, hint: "" }];
  } finally {
    ns.destroy();
  }
}

describe.skipIf(!installed)("every practice exercise, run in real Python", () => {
  beforeAll(async () => {
    const { loadPyodide } = await import("pyodide");
    py = await loadPyodide({ indexURL: `${RUNTIME}${path.sep}` });
    py.setStdout({ batched: () => {} });
    await py.loadPackage(["pandas"], { messageCallback: () => {} });
  }, 180_000);

  const marketReady = fs.existsSync(path.join(DATA, "market_prices.csv"));
  for (const e of EXERCISES.filter((x) => !x.market || marketReady)) {
    it(`${e.id}: the reference solution passes every check`, async () => {
      const results = await attempt(e, e.solution);
      expect(results.filter((r) => !r.passed)).toEqual([]);
      expect(results.length).toBeGreaterThanOrEqual(3);
    }, 60_000);

    it(`${e.id}: the untouched starter does not pass`, async () => {
      const results = await attempt(e, e.starter);
      expect(results.every((r) => r.passed)).toBe(false);
    }, 60_000);
  }
});

describe("the practice bank", () => {
  const topics = new Set(PHASES.flatMap((p) => p.topics.map((t) => t.id)));

  it("covers every discipline at every level", () => {
    for (const d of ["python", "sql", "pandas", "data", "ai", "finance"]) {
      const levels = new Set(EXERCISES.filter((e) => e.discipline === d).map((e) => e.level));
      expect([...levels].sort(), d).toEqual(["advanced", "foundation", "intermediate"]);
    }
  });

  it("links every exercise to a real curriculum topic", () => {
    for (const e of EXERCISES) expect(topics.has(e.topicId), `${e.id} -> ${e.topicId}`).toBe(true);
  });

  it("gives every exercise hints and an explanation", () => {
    for (const e of EXERCISES) {
      expect(e.hints.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.explanation.length, e.id).toBeGreaterThan(60);
    }
  });

  it("names only earlier exercises as what comes first", () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) for (const a of e.after ?? []) expect(ids.has(a), `${e.id} after ${a}`).toBe(true);
  });

  it("uses only datasets that ship, apart from the locally built market file", () => {
    for (const e of EXERCISES) for (const f of e.datasets.filter((x) => x !== "market_prices.csv")) expect(fs.existsSync(path.join(DATA, f)), `${e.id}: ${f}`).toBe(true);
  });

  it("never sends a solution to the browser", () => {
    for (const e of publicExercises()) expect("solution" in e).toBe(false);
  });

  it("keeps ids unique and file names safe", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) for (const f of [...e.datasets, ...Object.keys(e.files ?? {})]) expect(f).toMatch(/^[\w.-]{1,64}$/);
  });

  it("says the data is synthetic", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(DATA, "manifest.json"), "utf8")) as { note: string };
    expect(manifest.note).toMatch(/synthetic/i);
  });
});
