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

// Re-runs on the same day keep what already passed, so a rate limit never means starting over.
const today = out.verifiedAt.slice(0, 10);
const previous = await readFile(path.join(ROOT, "data/videos-verified.json"), "utf8").then(JSON.parse).catch(() => ({ videos: {} }));
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Polite: one request at a time, and YouTube's 429 means wait, not fail. */
async function check(id) {
  for (let attempt = 0; ; attempt++) {
    const r = await meta(id).catch((e) => ({ id, ok: false, error: String(e) }));
    if (r.ok || !/429/.test(r.error ?? "") || attempt === 3) return r;
    await sleep(30000 * (attempt + 1));
  }
}

for (const v of src.videos) {
  const kept = previous.videos[v.key];
  if (kept?.status === "verified" && kept.id === v.id && kept.verifiedAt === today) { out.videos[v.key] = kept; continue; }
  await sleep(1500);
  const r = await check(v.id);
  out.videos[v.key] = r.ok
    ? { status: "verified", verifiedAt: out.verifiedAt.slice(0, 10), id: v.id, title: r.title, channel: r.channel, durationSec: r.durationSec, published: r.published, embeddable: r.embeddable, chapters: r.chapters }
    : { status: "failed", id: v.id, error: r.error };
  if (!r.ok) failed++;
  process.stdout.write(`${r.ok ? "ok  " : "FAIL"} ${v.key} ${r.ok ? r.title : r.error}\n`);
}
await writeFile(path.join(ROOT, "data/videos-verified.json"), JSON.stringify(out, null, 1));
console.log(`${src.videos.length - failed} verified, ${failed} failed → data/videos-verified.json`);
