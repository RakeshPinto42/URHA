// Reads public metadata for YouTube videos (title, channel, duration, publish date,
// playability/embeddability and chapter timestamps from the description).
// Used to VERIFY curated resources, never to download content.
//   node scripts/yt-meta.mjs <id> [<id> ...]        → prints a summary
//   node scripts/yt-meta.mjs --json <id> ...        → prints JSON
const args = process.argv.slice(2);
const json = args[0] === "--json";
const ids = json ? args.slice(1) : args;

export async function meta(id) {
  const res = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}&hl=en`, {
    headers: { "Accept-Language": "en-GB,en;q=0.9", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return { id, ok: false, error: `HTTP ${res.status}` };
  const html = await res.text();
  const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var\s|<\/script>)/s);
  if (!m) return { id, ok: false, error: "no player response" };
  const p = JSON.parse(m[1]);
  const v = p.videoDetails;
  if (!v) return { id, ok: false, error: p.playabilityStatus?.reason ?? "unavailable" };
  const chapters = [];
  for (const line of (v.shortDescription ?? "").split("\n")) {
    const c = line.match(/^\s*\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?\s*[-–—|:]?\s*(.+)$/);
    if (c) {
      const parts = c[1].split(":").map(Number);
      const sec = parts.reduce((a, b) => a * 60 + b, 0);
      chapters.push({ t: c[1], sec, title: c[2].trim().slice(0, 90) });
    }
  }
  return {
    id, ok: true,
    title: v.title, channel: v.author, durationSec: Number(v.lengthSeconds),
    published: p.microformat?.playerMicroformatRenderer?.publishDate?.slice(0, 10) ?? null,
    playable: p.playabilityStatus?.status, embeddable: p.playabilityStatus?.playableInEmbed ?? null,
    chapters,
  };
}

if (ids.length && /yt-meta.mjs$/.test(process.argv[1] ?? "")) {
  for (const id of ids) {
    const r = await meta(id).catch((e) => ({ id, ok: false, error: String(e) }));
    if (json) { console.log(JSON.stringify(r)); continue; }
    if (!r.ok) { console.log(`FAIL ${id} ${r.error}`); continue; }
    const mm = `${Math.floor(r.durationSec / 60)}:${String(r.durationSec % 60).padStart(2, "0")}`;
    console.log(`OK   ${id} | ${r.title} | ${r.channel} | ${mm} | ${r.published} | embed=${r.embeddable} | chapters=${r.chapters.length}`);
    for (const c of r.chapters.slice(0, 60)) console.log(`       ${c.t.padStart(8)}  ${c.title}`);
  }
}
