// Verifies every curated video against YouTube's public metadata and writes
// data/videos-verified.json (title, channel, duration, publish date, embeddable,
// chapters, verifiedAt). Run: npm run videos:verify
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { meta } from "./yt-meta.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const src = JSON.parse(await readFile(path.join(ROOT, "lib/videos-source.json"), "utf8"));
const out = { verifiedAt: new Date().toISOString(), method: "youtube.com watch-page metadata (ytInitialPlayerResponse)", videos: {} };
let failed = 0;
for (const v of src.videos) {
  const r = await meta(v.id).catch((e) => ({ id: v.id, ok: false, error: String(e) }));
  out.videos[v.key] = r.ok
    ? { status: "verified", id: v.id, title: r.title, channel: r.channel, durationSec: r.durationSec, published: r.published, embeddable: r.embeddable, chapters: r.chapters }
    : { status: "failed", id: v.id, error: r.error };
  if (!r.ok) failed++;
  process.stdout.write(`${r.ok ? "ok  " : "FAIL"} ${v.key} ${r.ok ? r.title : r.error}\n`);
}
await writeFile(path.join(ROOT, "data/videos-verified.json"), JSON.stringify(out, null, 1));
console.log(`${src.videos.length - failed} verified, ${failed} failed → data/videos-verified.json`);
