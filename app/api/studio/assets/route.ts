/**
 * Lists the models and textures the Studio can use, and takes in a GLB. Absent unless the
 * Studio is enabled (lib/studio-access.ts). An upload is untrusted: it must really be a GLB,
 * its name is rebuilt from scratch, and it can never replace an existing file.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { guardWrite, refused } from "@/lib/api-guard";
import { studioAllowed } from "@/lib/studio-access";

export const dynamic = "force-dynamic";

const ASSETS = path.join(process.cwd(), "public", "cinema", "assets");
const CREDITS = path.join(process.cwd(), "public", "cinema", "credits.json");
const MAX_BYTES = 50 * 1024 * 1024;
const LARGE_BYTES = 5 * 1024 * 1024;
const GLB_MAGIC = 0x46546c67; // "glTF"

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  if (!studioAllowed(request.headers.get("host"))) return json({ error: "Not found." }, 404);
  const files = await fs.readdir(ASSETS).catch(() => [] as string[]);
  const url = (f: string) => `/cinema/assets/${f}`;
  return json({
    models: files.filter((f) => f.endsWith(".glb")).sort().map(url),
    textures: files.filter((f) => /\.(webp|jpg|png)$/.test(f)).sort().map(url),
  });
}

export async function POST(request: Request) {
  if (!studioAllowed(request.headers.get("host"))) return json({ error: "Not found." }, 404);
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) return json({ error: "This model is over 50 MB. Run it through npm run assets:optimize first." }, 413);

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return json({ error: "This model is over 50 MB. Run it through npm run assets:optimize first." }, 413);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12 || view.getUint32(0, true) !== GLB_MAGIC || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== bytes.length) {
    return json({ error: "This is not a valid GLB file. A .gltf can be converted with npm run assets:optimize." }, 422);
  }

  const raw = new URL(request.url).searchParams.get("name") ?? "model";
  const stem = raw.replace(/\.glb$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 56) || "model";
  await fs.mkdir(ASSETS, { recursive: true });
  const taken = new Set(await fs.readdir(ASSETS));
  let name = stem;
  for (let n = 2; taken.has(`${name}.glb`); n++) name = `${stem}-${n}`;
  await fs.writeFile(path.join(ASSETS, `${name}.glb`), bytes, { flag: "wx" }); // wx: never overwrite.

  const list = JSON.parse(await fs.readFile(CREDITS, "utf8").catch(() => "[]")) as unknown[];
  list.push({ file: `public/cinema/assets/${name}.glb`, title: name, creator: "Not recorded", license: "Licence not recorded", licenseUrl: "#", page: "#", via: "a Studio import" });
  await fs.writeFile(CREDITS, `${JSON.stringify(list, null, 1)}\n`);

  return json({
    src: `/cinema/assets/${name}.glb`,
    // A production server serves public/ as it was when it started.
    needsRestart: process.env.NODE_ENV === "production",
    note: bytes.length > LARGE_BYTES ? "It is large: run npm run assets:optimize before shipping it, and add its licence to public/cinema/credits.json." : "Add its licence to public/cinema/credits.json before shipping it.",
  });
}
