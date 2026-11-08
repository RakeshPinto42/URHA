// The Academy's Python sandbox: Pyodide in a module worker.
//
// Isolation, in layers:
//  - It is a worker, so it has no page, no DOM and no cookies of its own to read.
//  - The runtime and pandas load first; then fetch, XHR, WebSocket, EventSource, importScripts
//    and the Python-to-JavaScript bridges are removed, so practice code cannot reach the network
//    or this app's API.
//  - Each run gets a fresh namespace and a fresh data folder.
//  - Output is capped. The page kills the whole worker if a run passes its time limit, and
//    recycles it when its memory grows too large.

import { loadPyodide } from "./runtime/pyodide.mjs";

const MAX_OUTPUT = 120_000;
let py = null;

function send(message) { self.postMessage(message); }

async function start() {
  const t0 = performance.now();
  py = await loadPyodide({ indexURL: "/python/runtime/" });
  await py.loadPackage(["pandas"], { messageCallback: () => {}, errorCallback: () => {} });
  // From here on, nothing in this worker can reach the network.
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches", "BroadcastChannel"]) {
    try { Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false }); } catch { /* not present */ }
  }
  py.runPython(`
import sys, builtins
for _m in ("js", "pyodide_js", "pyodide.http", "pyodide.code", "pyodide.ffi.wrappers", "micropip"):
    sys.modules[_m] = None
import pandas, numpy
pandas.set_option("display.width", 100)
pandas.set_option("display.max_columns", 20)
del _m
`);
  send({ type: "ready", seconds: (performance.now() - t0) / 1000, versions: py.runPython("import sys, pandas, numpy; f'Python {sys.version.split()[0]}, pandas {pandas.__version__}, numpy {numpy.__version__}'") });
}

async function run({ id, code, sql, files, checks }) {
  let out = "", clipped = false;
  const write = (text) => {
    if (clipped) return;
    if (out.length + text.length > MAX_OUTPUT) { out += text.slice(0, MAX_OUTPUT - out.length); clipped = true; return; }
    out += text;
  };
  py.setStdout({ batched: (s) => write(`${s}\n`) });
  py.setStderr({ batched: (s) => write(`${s}\n`) });

  // A fresh folder of data for every run.
  const dir = "/home/pyodide/data";
  py.runPython(`import shutil, os\nos.chdir("/")\nshutil.rmtree(${JSON.stringify(dir)}, ignore_errors=True)\nos.makedirs(${JSON.stringify(dir)}, exist_ok=True)\nos.chdir(${JSON.stringify(dir)})`);
  for (const [name, text] of Object.entries(files ?? {})) {
    if (!/^[\w.-]{1,64}$/.test(name)) continue;
    py.FS.writeFile(`${dir}/${name}`, text);
  }

  const ns = py.globals.get("dict")();
  // An SQL exercise: the shared harness runs this query against the data loaded as tables.
  if (typeof sql === "string") ns.set("__sql", sql);
  const t0 = performance.now();
  let error = null;
  try {
    await py.runPythonAsync(code, { globals: ns, filename: "practice.py" });
  } catch (e) {
    error = String(e.message ?? e).split("\n").filter((l) => !/File "\/lib\/python|_pyodide\/|pyodide\/_base/.test(l)).join("\n").trim();
  }
  const seconds = (performance.now() - t0) / 1000;

  let results = [];
  if (checks && !error) {
    try {
      py.runPython(`
_results = []
def expect(label, condition, hint=""):
    _results.append((str(label), bool(condition), str(hint)))
`, { globals: ns });
      py.runPython(checks, { globals: ns });
      results = ns.get("_results").toJs().map(([label, passed, hint]) => ({ label, passed, hint }));
    } catch (e) {
      const last = String(e.message ?? e).trim().split("\n").at(-1);
      results = [{ label: "The checks could not finish", passed: false, hint: last }];
    }
  }
  ns.destroy();
  const memoryMb = Math.round(py._module.HEAP8.length / 1048576);
  send({ type: "result", id, output: out, clipped, error, seconds, results, memoryMb });
}

self.onmessage = async (e) => {
  const m = e.data;
  if (!m || typeof m !== "object") return;
  if (m.type === "run" && typeof m.code === "string" && m.code.length <= 50_000 && (m.sql == null || (typeof m.sql === "string" && m.sql.length <= 50_000))) {
    if (!py) return send({ type: "result", id: m.id, output: "", clipped: false, error: "Python is still starting.", seconds: 0, results: [], memoryMb: 0 });
    try { await run(m); } catch (err) { send({ type: "result", id: m.id, output: "", clipped: false, error: String(err), seconds: 0, results: [], memoryMb: 0 }); }
  }
};

start().catch((err) => send({ type: "failed", error: String(err?.message ?? err) }));
