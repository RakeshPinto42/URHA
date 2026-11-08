// The 3D asset pipeline (docs/CINEMATIC_ENGINE_AUDIT.md §7).
//
//   npm run assets:add -- <polyhaven-id> [--ratio 0.25]   fetch a CC0 model, optimise it, credit it
//   npm run assets:texture -- <polyhaven-id>              fetch a CC0 PBR texture set as WebP, credit it
//   npm run assets:optimize -- <file.glb> <name>          optimise a model of your own
//   npm run assets:decoders                               copy the Draco decoder into public/
//
// Sources stay in assets-src/ (not committed). What ships is in public/cinema/assets/.
// Downloads are untrusted: only https files from Poly Haven's own hosts, only inside the
// folder made for that asset, and processed by gltf-transform without a shell.
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public/cinema/assets");
const CREDITS = path.join(ROOT, "public/cinema/credits.json");
const CLI = path.join(ROOT, "node_modules/@gltf-transform/cli/bin/cli.js");
const run = promisify(execFile);
const AGENT = { "User-Agent": "urha-asset-pipeline" };
const NAME = /^[a-z][a-z0-9-]{0,63}$/;

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;

async function download(url, file) {
  const u = new URL(url);
  if (u.protocol !== "https:" || !/(^|\.)polyhaven\.(org|com)$/.test(u.hostname)) throw new Error(`Refusing to download from ${u.hostname}`);
  const r = await fetch(url, { headers: AGENT, signal: AbortSignal.timeout(120000) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, new Uint8Array(await r.arrayBuffer()));
}

/** Optimises one model into public/cinema/assets, and reports what it saved. */
async function optimize(input, name, ratio) {
  if (!NAME.test(name)) throw new Error(`"${name}" must be lowercase letters, numbers and hyphens`);
  await fs.mkdir(OUT, { recursive: true });
  const out = path.join(OUT, `${name}.glb`);
  const args = [CLI, "optimize", input, out, "--compress", "draco", "--texture-compress", "webp", "--texture-size", "1024", "--instance", "false"];
  if (ratio) args.push("--simplify", "true", "--simplify-ratio", String(ratio), "--simplify-error", "0.01");
  else args.push("--simplify", "false");
  await run(process.execPath, args, { cwd: ROOT, maxBuffer: 1 << 26 });
  const { size } = await fs.stat(out);
  console.log(`${name}.glb  ${mb(size)}`);
  return size;
}

async function credit(entry) {
  const list = JSON.parse(await fs.readFile(CREDITS, "utf8").catch(() => "[]"));
  await fs.mkdir(path.dirname(CREDITS), { recursive: true });
  const next = [...list.filter((c) => c.file !== entry.file), entry].sort((a, b) => a.file.localeCompare(b.file));
  await fs.writeFile(CREDITS, `${JSON.stringify(next, null, 1)}\n`);
}

async function add(id, ratio) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error(`Invalid id "${id}"`);
  const info = await (await fetch(`https://api.polyhaven.com/assets?t=models`, { headers: AGENT })).json();
  const meta = info[id];
  if (!meta) throw new Error(`Poly Haven has no model "${id}"`);
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: AGENT })).json();
  const gltf = files.gltf?.["1k"]?.gltf;
  if (!gltf) throw new Error(`"${id}" has no 1k glTF`);

  const dir = path.join(SRC, id);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const main = path.join(dir, "model.gltf");
  await download(gltf.url, main);
  for (const [rel, f] of Object.entries(gltf.include ?? {})) {
    const target = path.resolve(dir, rel);
    if (!target.startsWith(dir + path.sep)) throw new Error(`Unsafe path in download: ${rel}`);
    await download(f.url, target);
  }
  const name = slug(id);
  await optimize(main, name, ratio);
  await credit({
    file: `public/cinema/assets/${name}.glb`, title: meta.name, creator: Object.keys(meta.authors ?? {}).join(", ") || "Poly Haven",
    license: "CC0", licenseUrl: "https://polyhaven.com/license", page: `https://polyhaven.com/a/${id}`, via: "Poly Haven",
    triangles: meta.polycount ?? null, modified: "Optimised: Draco geometry, WebP textures at 1024 px",
  });
}

/** A PBR set for procedural architecture: colour, normal and roughness, at 1024 px, as WebP. */
async function texture(id) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error(`Invalid id "${id}"`);
  const { default: sharp } = await import("sharp");
  const meta = (await (await fetch("https://api.polyhaven.com/assets?t=textures", { headers: AGENT })).json())[id];
  if (!meta) throw new Error(`Poly Haven has no texture "${id}"`);
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: AGENT })).json();
  const name = slug(id);
  const dir = path.join(SRC, id);
  await fs.mkdir(OUT, { recursive: true });
  for (const [slot, key, quality] of [["diff", "Diffuse", 82], ["nor", "nor_gl", 88], ["rough", "Rough", 72]]) {
    const jpg = files[key]?.["1k"]?.jpg?.url;
    if (!jpg) throw new Error(`"${id}" has no 1k ${key}`);
    const source = path.join(dir, `${slot}.jpg`);
    await download(jpg, source);
    const out = path.join(OUT, `${name}-${slot}.webp`);
    await sharp(source).resize(1024).webp({ quality }).toFile(out);
    console.log(`${name}-${slot}.webp  ${mb((await fs.stat(out)).size)}`);
    await credit({
      file: `public/cinema/assets/${name}-${slot}.webp`, title: `${meta.name} (${slot})`, creator: Object.keys(meta.authors ?? {}).join(", ") || "Poly Haven",
      license: "CC0", licenseUrl: "https://polyhaven.com/license", page: `https://polyhaven.com/a/${id}`, via: "Poly Haven",
      triangles: null, modified: "Converted to WebP at 1024 px",
    });
  }
}

async function decoders() {
  const from = path.join(ROOT, "node_modules/three/examples/jsm/libs/draco/gltf");
  const to = path.join(ROOT, "public/cinema/draco");
  await fs.mkdir(to, { recursive: true });
  for (const f of ["draco_decoder.wasm", "draco_wasm_wrapper.js"]) await fs.copyFile(path.join(from, f), path.join(to, f));
  console.log("Draco decoder copied to public/cinema/draco");
}

const [command, ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf(n); return i < 0 ? null : rest[i + 1]; };
if (command === "add") await add(rest[0], flag("--ratio"));
else if (command === "texture") await texture(rest[0]);
else if (command === "optimize") await optimize(path.resolve(rest[0]), rest[1], flag("--ratio"));
else if (command === "decoders") await decoders();
else { console.error("Use: add <polyhaven-id> [--ratio 0.25], texture <polyhaven-id>, optimize <file> <name> [--ratio 0.25], or decoders"); process.exit(1); }
