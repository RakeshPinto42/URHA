// SQL sandbox for assessment SQL challenges (lib/assessments/sql.ts).
// Runs in its own short-lived process so a runaway query can be killed outright
// (better-sqlite3 cannot interrupt a running statement in-process).
// stdin: {"setup": "<fixture SQL>", "query": "<one SELECT/WITH statement>", "limit": 500}
// stdout: {"ok":true,"columns":[...],"rows":[[...]...],"truncated":bool} | {"ok":false,"error":"..."}
import Database from "better-sqlite3";

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => { input += c; if (input.length > 200_000) fail("Input too large."); });
process.stdin.on("end", () => {
  let req;
  try { req = JSON.parse(input); } catch { return fail("Bad request."); }
  const db = new Database(":memory:");
  try {
    db.exec(String(req.setup ?? ""));
  } catch (e) {
    return fail(`Fixture failed to load: ${e.message}`);
  }
  let stmt;
  try {
    stmt = db.prepare(String(req.query ?? ""));
  } catch (e) {
    return fail(e.message);
  }
  if (!stmt.reader || !stmt.readonly) return fail("Only a single read-only query (SELECT or WITH … SELECT) is allowed.");
  try {
    stmt.raw(true);
    const limit = Math.min(Number(req.limit) || 500, 2000);
    const rows = [];
    let truncated = false;
    for (const r of stmt.iterate()) {
      if (rows.length >= limit) { truncated = true; break; }
      rows.push(r);
    }
    const columns = stmt.columns().map((c) => c.name);
    out({ ok: true, columns, rows, truncated });
  } catch (e) {
    fail(e.message);
  }
});

function out(o) { process.stdout.write(JSON.stringify(o)); process.exit(0); }
function fail(msg) { out({ ok: false, error: String(msg).slice(0, 400) }); }
