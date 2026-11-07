// Verifies every curated track on Wikimedia Commons (one batched API request per 50 files):
// file exists, licence is public domain / CC0 / CC BY / CC BY-SA, author/credit, duration,
// original URL and a browser-friendly MP3 transcode when the original is Ogg/FLAC.
// Writes data/music-verified.json. Run: npm run music:verify
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const src = JSON.parse(await readFile(path.join(ROOT, "lib/music-source.json"), "utf8"));
const files = src.collections.flatMap((c) => c.tracks.map((t) => t.file));
const strip = (s) => (s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ALLOWED = /^(public domain|pd|cc0|cc by(-sa)? [0-9.]+( [a-z]+)?|cc by(-sa)?)$/i;

const out = { verifiedAt: new Date().toISOString(), source: "commons.wikimedia.org API (videoinfo + extmetadata)", tracks: {} };
for (let i = 0; i < files.length; i += 50) {
  const batch = files.slice(i, i + 50);
  const p = new URLSearchParams({ action: "query", format: "json", titles: batch.map((f) => `File:${f}`).join("|"), prop: "videoinfo",
    viprop: "url|mime|size|duration|derivatives|extmetadata", viextmetadatafilter: "LicenseShortName|LicenseUrl|Artist|Credit|DateTimeOriginal" });
  const r = await fetch(`https://commons.wikimedia.org/w/api.php?${p}`, { headers: { "User-Agent": "URHA/0.2 (personal study app; verification)" } });
  const j = await r.json();
  const norm = Object.fromEntries((j.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const pg of Object.values(j.query?.pages ?? {})) {
    const file = (norm[pg.title] ?? pg.title).replace(/^File:/, "");
    const v = pg.videoinfo?.[0];
    if (!v) { out.tracks[file] = { status: "missing" }; continue; }
    const m = v.extmetadata ?? {};
    const licence = strip(m.LicenseShortName?.value);
    const mp3 = v.mime === "audio/mpeg" ? v.url : (v.derivatives ?? []).find((d) => /audio\/mpeg/.test(d.type))?.src ?? null;
    out.tracks[file] = {
      status: ALLOWED.test(licence) ? "verified" : "licence-not-allowed",
      licence, licenceUrl: m.LicenseUrl?.value ?? null, author: strip(m.Artist?.value).slice(0, 240) || null,
      recorded: strip(m.DateTimeOriginal?.value) || null, durationSec: Math.round(v.duration ?? 0),
      page: v.descriptionurl, original: v.url, mime: v.mime, stream: mp3 ?? v.url, streamMime: mp3 ? "audio/mpeg" : v.mime,
    };
  }
}
for (const f of files) if (!out.tracks[f]) out.tracks[f] = { status: "missing" };
await writeFile(path.join(ROOT, "data/music-verified.json"), JSON.stringify(out, null, 1));
for (const [f, t] of Object.entries(out.tracks)) console.log(`${t.status === "verified" ? "ok  " : "FAIL"} ${t.status} | ${t.licence ?? ""} | ${t.durationSec ?? ""}s | ${t.streamMime ?? ""} | ${f}`);
