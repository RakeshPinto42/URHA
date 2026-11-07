// Checks each official-documentation URL in lib/docs-source.json and writes data/docs-verified.json.
// "resolves" = 2xx/3xx after redirects (the final URL is recorded). 401/403/429 = site refuses checks.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const ROOT = path.resolve(import.meta.dirname, "..");
const src = JSON.parse(await readFile(path.join(ROOT, "lib/docs-source.json"), "utf8"));
const out = { checkedAt: new Date().toISOString(), docs: {} };
for (const d of src.docs) {
  let status = null, finalUrl = null;
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(d.url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (URHA link check)", Accept: "text/html,*/*" } });
      status = r.status; finalUrl = r.url;
      if (r.ok) break;
    } catch { status = null; }
  }
  const ok = status !== null && status < 400;
  out.docs[d.key] = { status: ok ? "resolves" : [401, 403, 429].includes(status) ? "refused" : "failed", http: status, finalUrl };
  console.log(`${ok ? "ok  " : "FAIL"} ${status ?? "---"} ${d.key} ${finalUrl && finalUrl !== d.url ? "→ " + finalUrl : ""}`);
}
await writeFile(path.join(ROOT, "data/docs-verified.json"), JSON.stringify(out, null, 1));
