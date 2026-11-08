// Installs the in-browser Python runtime for the Academy's practice yard.
//
//   npm run python:fetch
//
// The core comes from the pinned `pyodide` package (checked by npm on install). The pandas
// wheels come from Pyodide's own CDN, and each one must match the SHA-256 in that package's
// lockfile, or it is refused. Everything lands in public/python/runtime/ and is served from
// this site, so the app never fetches code from elsewhere at run time. The folder is not
// committed: it is about 30 MB, and this script rebuilds it exactly.
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PKG = path.join(ROOT, "node_modules/pyodide");
const OUT = path.join(ROOT, "public/python/runtime");
const WANT = ["pandas"];
const CORE = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

const { version } = JSON.parse(await fs.readFile(path.join(PKG, "package.json"), "utf8"));
const lock = JSON.parse(await fs.readFile(path.join(PKG, "pyodide-lock.json"), "utf8"));
const CDN = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

await fs.mkdir(OUT, { recursive: true });
for (const f of CORE) await fs.copyFile(path.join(PKG, f), path.join(OUT, f));

// Everything pandas needs, from the lockfile's own dependency list.
const need = new Set();
const add = (name) => {
  const key = name.toLowerCase();
  if (need.has(key)) return;
  const p = lock.packages[key];
  if (!p) throw new Error(`The lockfile has no package "${name}"`);
  need.add(key);
  (p.depends ?? []).forEach(add);
};
WANT.forEach(add);

for (const key of need) {
  const { file_name: file, sha256 } = lock.packages[key];
  if (!/^[\w.-]+\.whl$/.test(file)) throw new Error(`Unexpected file name: ${file}`);
  const target = path.join(OUT, file);
  const have = await fs.readFile(target).catch(() => null);
  if (have && createHash("sha256").update(have).digest("hex") === sha256) { console.log(`ok    ${file}`); continue; }
  const r = await fetch(CDN + file, { signal: AbortSignal.timeout(180000) });
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  const got = createHash("sha256").update(bytes).digest("hex");
  if (got !== sha256) throw new Error(`${file}: checksum mismatch, refused (expected ${sha256}, got ${got})`);
  await fs.writeFile(target, bytes);
  console.log(`fetched ${file}  ${(bytes.length / 1048576).toFixed(1)} MB`);
}
await fs.writeFile(path.join(OUT, "manifest.json"), `${JSON.stringify({ version, packages: [...need].sort() }, null, 1)}\n`);
console.log(`Python runtime ${version} ready in public/python/runtime`);
