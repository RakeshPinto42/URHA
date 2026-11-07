// Checks whether each resource URL resolves and records the result in the database.
// "Resolves" means the server answered 2xx/3xx; it does not prove the content is right.
import Database from "better-sqlite3";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const db = new Database(process.env.URHA_DB_PATH || path.join(root, "data", "urha.db"), { fileMustExist: true });
const rows = db.prepare("SELECT id, url FROM resources WHERE url IS NOT NULL").all();
const update = db.prepare("UPDATE resources SET link_status = ?, link_http = ?, link_checked_at = datetime('now') WHERE id = ? AND url = ?");

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "Mozilla/5.0 (URHA link check)", Accept: "text/html,*/*" } });
      if (res.ok || method === "GET") return res.status;
    } catch {
      if (method === "GET") return null;
    }
  }
  return null;
}

for (const r of rows) {
  const status = await check(r.url);
  const ok = status !== null && status >= 200 && status < 400;
  // 401/403/429: the site refuses automated checks — that is not evidence the link is broken.
  const refused = status === 401 || status === 403 || status === 429;
  update.run(ok ? "resolves" : refused ? "unchecked" : "failed", status, r.id, r.url);
  console.log(`${ok ? "ok  " : refused ? "SKIP" : "FAIL"} ${status ?? "---"} ${r.url}`);
}
db.close();
