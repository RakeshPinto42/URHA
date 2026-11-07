/**
 * Runs a learner's SQL against a fixture in a separate process (scripts/sql-sandbox.mjs)
 * with a hard time limit, then compares its result set with the reference query's.
 * Deterministic: no model judges the answer.
 */
import "server-only";
import { execFile } from "node:child_process";
import path from "node:path";
import { FIXTURES } from "./fixtures";
import { MAX_QUERY_CHARS } from "./types";

export type SqlResult = { ok: true; columns: string[]; rows: unknown[][]; truncated: boolean } | { ok: false; error: string };

const TIMEOUT_MS = 3000;

export function runSql(fixtureId: string, query: string): Promise<SqlResult> {
  const fx = FIXTURES[fixtureId];
  if (!fx) return Promise.resolve({ ok: false, error: `Unknown fixture "${fixtureId}".` });
  const q = query.trim().replace(/;\s*$/, "");
  if (!q) return Promise.resolve({ ok: false, error: "No query was given." });
  if (q.length > MAX_QUERY_CHARS) return Promise.resolve({ ok: false, error: `The query is longer than ${MAX_QUERY_CHARS} characters.` });
  const script = path.join(process.cwd(), "scripts", "sql-sandbox.mjs");
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [script], { timeout: TIMEOUT_MS, killSignal: "SIGKILL", maxBuffer: 2_000_000, windowsHide: true },
      (err, stdout) => {
        if (err && (err as NodeJS.ErrnoException & { killed?: boolean }).killed) return resolve({ ok: false, error: `The query ran longer than ${TIMEOUT_MS / 1000} s and was stopped.` });
        try {
          resolve(JSON.parse(stdout) as SqlResult);
        } catch {
          resolve({ ok: false, error: "The query could not be run." });
        }
      });
    child.stdin?.end(JSON.stringify({ setup: fx.sql, query: q, limit: 500 }));
  });
}

/** Normalise a value so 12.5, 12.50 and 12.500000001 compare equal; NULL stays distinct. */
function norm(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "number" || typeof v === "bigint") return (Math.round(Number(v) * 100) / 100).toFixed(2);
  return String(v).trim();
}

export type Comparison = { equal: true } | { equal: false; reason: string };

/** Compares result sets by value (column names are not compared). */
export function compareResults(got: { columns: string[]; rows: unknown[][] }, want: { columns: string[]; rows: unknown[][] }, ordered: boolean): Comparison {
  if (got.columns.length !== want.columns.length) {
    return { equal: false, reason: `Expected ${want.columns.length} column${want.columns.length === 1 ? "" : "s"}, got ${got.columns.length}.` };
  }
  if (got.rows.length !== want.rows.length) {
    return { equal: false, reason: `Expected ${want.rows.length} row${want.rows.length === 1 ? "" : "s"}, got ${got.rows.length}.` };
  }
  const key = (r: unknown[]) => r.map(norm).join(" | ");
  const a = got.rows.map(key), b = want.rows.map(key);
  if (!ordered) { a.sort(); b.sort(); }
  const i = a.findIndex((r, k) => r !== b[k]);
  if (i === -1) return { equal: true };
  return { equal: false, reason: ordered ? `Row ${i + 1} differs (check the ORDER BY as well as the values).` : "The rows contain different values." };
}
