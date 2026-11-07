// Fetches the exact public-domain text for every passage and quotation verse in
// lib/passages.json from bible-api.com (World English Bible and King James Version,
// both public domain) and writes data/scripture/<translation>.json.
//
// Run once (network required): npm run scripture:fetch
// The output is committed with the app so URHA works offline afterwards.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TRANSLATIONS = ["web", "kjv"];
const DELAY_MS = 2500; // stay well under the API's published rate limit
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const spec = JSON.parse(await readFile(path.join(ROOT, "lib/passages.json"), "utf8"));
const items = [
  ...spec.collections.flatMap((c) => c.passages),
  ...spec.quoteVerses,
];

async function fetchOne(query, translation, attempt = 1) {
  const url = `https://bible-api.com/${encodeURIComponent(query)}?translation=${translation}`;
  const res = await fetch(url, { headers: { "User-Agent": "URHA/0.1 (personal study app)" } });
  if (res.status === 429 && attempt <= 4) {
    await sleep(DELAY_MS * 4 * attempt);
    return fetchOne(query, translation, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body.verses) || body.verses.length === 0) throw new Error(`${url} -> no verses`);
  return {
    reference: body.reference,
    translationName: body.translation_name,
    translationNote: body.translation_note,
    verses: body.verses.map((v) => ({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      // Collapse the source's hard line wraps; keep the words exactly.
      text: String(v.text).replace(/\s+/g, " ").trim(),
    })),
  };
}

await mkdir(path.join(ROOT, "data/scripture"), { recursive: true });
for (const translation of TRANSLATIONS) {
  const out = {
    translation,
    source: "https://bible-api.com",
    fetchedAt: new Date().toISOString(),
    passages: {},
  };
  for (const item of items) {
    out.passages[item.id] = await fetchOne(item.query, translation);
    process.stdout.write(`${translation} ${item.ref} (${out.passages[item.id].verses.length} verses)\n`);
    await sleep(DELAY_MS);
  }
  const file = path.join(ROOT, `data/scripture/${translation}.json`);
  await writeFile(file, JSON.stringify(out, null, 1));
  console.log(`wrote ${file}`);
}

// Full chapters (WEB) for passages that are part of a chapter: verse character lengths,
// used to estimate the passage's start time inside a chapter-length recording.
const chapters = {};
for (const item of spec.collections.flatMap((c) => c.passages)) {
  const m = item.query.match(/^(.+?)\s(\d+):(\d+)/);
  if (!m) continue; // whole-chapter passages need no estimate
  const key = `${m[1]} ${m[2]}`;
  if (chapters[key]) continue;
  const full = await fetchOne(key, "web");
  chapters[key] = full.verses.map((v) => ({ verse: v.verse, chars: v.text.length }));
  process.stdout.write(`chapter ${key} (${full.verses.length} verses)\n`);
  await sleep(DELAY_MS);
}
await writeFile(path.join(ROOT, "data/scripture/chapters-web.json"), JSON.stringify(chapters));
console.log("wrote data/scripture/chapters-web.json");
