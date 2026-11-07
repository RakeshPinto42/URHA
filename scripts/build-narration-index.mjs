// Builds data/audio/henson-web.json: for every book of the World English Bible, the
// per-chapter MP3 URLs of Winfred W. Henson's recording on eBible.org (streamed, never
// bundled). Terms (ebible.org/eng-web/audio/): "You may download, copy, and listen to this
// recording of the Holy Bible freely." Chapter order comes from the files' global sequence numbers.
import { writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE = "https://ebible.org/eng-web/audio/";
const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": "URHA/0.2 (personal study app)" }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
};
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);

const ORD = { First: "1", Second: "2", Third: "3" };
function canonical(dir) {
  const words = decodeURIComponent(dir).replace(/\/$/, "").replace(/^\d+_/, "").split("_");
  if (ORD[words[0]]) words[0] = ORD[words[0]];
  const name = words.join(" ");
  return name === "Revelations" ? "Revelation" : name;
}

const index = await get(BASE);
const dirs = hrefs(index).filter((h) => /^\d{2}_[A-Za-z_]+\/$/.test(h));
const books = [];
for (const dir of dirs) {
  const html = await get(BASE + dir);
  // " (1)" files are byte-identical duplicate uploads on the server (checked by size); skip them.
  const files = hrefs(html).filter((h) => /\.mp3$/i.test(h) && !/ \(1\)\.mp3$/i.test(decodeURIComponent(h)));
  // Sort by the 4-digit global sequence number in each file name (e.g. "01 0929 Matthew-Chapter One.mp3").
  const seq = (f) => Number((decodeURIComponent(f).match(/(\d{4})\s/) ?? [])[1] ?? Infinity);
  files.sort((a, b) => seq(a) - seq(b));
  books.push({ book: canonical(dir), dir: decodeURIComponent(dir), chapters: files.map((f) => BASE + dir + f) });
  process.stdout.write(`${canonical(dir)}: ${files.length}\n`);
  await new Promise((r) => setTimeout(r, 300));
}
const out = {
  narrator: "Winfred W. Henson",
  translation: "World English Bible",
  source: BASE,
  terms: "You may download, copy, and listen to this recording of the Holy Bible freely. (ebible.org/eng-web/audio/)",
  builtAt: new Date().toISOString(),
  books,
};
await writeFile(path.join(ROOT, "data/audio/henson-web.json"), JSON.stringify(out, null, 1));
console.log(`${books.length} books, ${books.reduce((n, b) => n + b.chapters.length, 0)} chapter files`);
