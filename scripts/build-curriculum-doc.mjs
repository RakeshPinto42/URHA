// Generates docs/CURRICULUM_MAP.md from lib/curriculum.ts, lib/learning-map.ts and the
// verification files. Run: npm run curriculum:doc   (Node 22.18+ strips TypeScript types natively.)
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PHASES, slug } from "../lib/curriculum.ts";
import { LEARNING_MAP, parseRef } from "../lib/learning-map.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = async (p) => JSON.parse(await readFile(path.join(ROOT, p), "utf8"));
const vv = await read("data/videos-verified.json");
const dv = await read("data/docs-verified.json");
const vs = await read("lib/videos-source.json");
const ds = await read("lib/docs-source.json");
const why = new Map(vs.videos.map((v) => [v.key, v.why]));
const docMeta = new Map(ds.docs.map((d) => [d.key, d]));
const clock = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };

function cell(spec) {
  if (!spec) return "—";
  const r = parseRef(spec);
  if (r.key.startsWith("d-")) { const d = docMeta.get(r.key); return `[${d.title}](${d.url}) · ${d.author} (docs)`; }
  const v = vv.videos[r.key];
  const s = r.start ?? 0, e = r.end ?? v.durationSec;
  const seg = r.start !== null || r.end !== null ? ` · ${clock(s)}–${clock(e)}` : "";
  return `[${v.title.replace(/\|/g, "/")}](https://www.youtube.com/watch?v=${v.id}${s ? `&t=${s}s` : ""}) · ${v.channel}${seg} · ${Math.max(1, Math.round((e - s) / 60))} min`;
}

let md = `# URHA — Curated curriculum map\n\nGenerated ${new Date().toISOString().slice(0, 10)} by \`npm run curriculum:doc\`. Do not edit by hand.\n\n`;
md += `Videos verified against YouTube public metadata on ${vv.verifiedAt.slice(0, 10)} (title, channel, duration, chapters). Documentation links checked on ${dv.checkedAt.slice(0, 10)}. Every subtopic: one primary resource, an optional supplement, an exercise with practice minutes.\n\n`;
let total = 0, vid = 0, docs = 0, sup = 0, watch = 0, practice = 0;
for (const p of PHASES) {
  md += `## Phase ${p.order} — ${p.title} (months ${p.months[0]}–${p.months[1]})\n\n**Exit gate:** ${p.exitGate}\n\n`;
  for (const t of p.topics) {
    md += `### ${t.title}\n\n| Subtopic | Primary | If it helps | Exercise | Practice |\n|---|---|---|---|---|\n`;
    for (const [title, primary, supplement, exercise, minutes] of LEARNING_MAP[t.id]) {
      const r = parseRef(primary);
      total++; practice += minutes; if (supplement) sup++;
      if (r.key.startsWith("d-")) docs++; else { vid++; const v = vv.videos[r.key]; watch += ((r.end ?? v.durationSec) - (r.start ?? 0)) / 60; }
      md += `| ${title} | ${cell(primary)} | ${cell(supplement)} | ${exercise.replace(/\|/g, "/")} | ${minutes} min |\n`;
    }
    md += "\n";
  }
}
md = md.replace("Every subtopic: one primary", `**${total} subtopics; ${vid} video-led, ${docs} docs-led; ${sup} with a supplement; about ${Math.round(watch / 60)} h of focused watching and ${Math.round(practice / 60)} h of exercises.** Every subtopic: one primary`);
md += `## Video reasons\n\n| Video | Why it is included |\n|---|---|\n` + vs.videos.map((v) => `| ${vv.videos[v.key].title.replace(/\|/g, "/")} — ${vv.videos[v.key].channel} | ${v.why} |`).join("\n") + "\n";
await writeFile(path.join(ROOT, "docs/CURRICULUM_MAP.md"), md);
console.log(`docs/CURRICULUM_MAP.md: ${total} subtopics, ${vid} video, ${docs} docs, ${Math.round(watch / 60)} h watch, ${Math.round(practice / 60)} h practice`);
