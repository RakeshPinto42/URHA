import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { openDb } from "@/lib/db";

/**
 * Rehearses the upgrade on a copy of the owner's real database and compares every row of every
 * personal and progress table, column by column. Opt-in (npm run db:rehearse), because it reads
 * the real file; it only ever reads it, and the copy is deleted afterwards.
 */
const REAL = process.env.URHA_REAL_DB ?? path.join(process.cwd(), "data/urha.db");
// Curriculum content is re-synced from code on every start; everything else belongs to the owner.
const CONTENT = new Set(["skills", "phases", "milestones", "topics", "topic_prereqs", "topic_skills", "subtopics", "resources", "scripture_cache"]);

describe.skipIf(!process.env.URHA_REHEARSE || !fs.existsSync(REAL))("migration rehearsal on a copy of the real database", () => {
  it("upgrades without changing a single row of personal or progress data", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "urha-rehearse-"));
    const copy = path.join(dir, "urha.db");
    // A byte copy: the real files are never opened, so not even the shared-memory index is touched.
    // Run it while the app is stopped, so no write is half-way through the WAL.
    fs.copyFileSync(REAL, copy);
    if (fs.existsSync(REAL + "-wal")) fs.copyFileSync(REAL + "-wal", copy + "-wal");
    const before = new Database(copy, { readonly: true });
    const from = before.pragma("user_version", { simple: true }) as number;
    const tables = (before.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((t) => t.name).filter((t) => !CONTENT.has(t));
    const snapshot = (db: Database.Database, t: string, cols: string[]) =>
      db.prepare(`SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM "${t}" ORDER BY rowid`).all().map((r) => JSON.stringify(r));
    const cols = Object.fromEntries(tables.map((t) => [t, (before.prepare(`PRAGMA table_info("${t}")`).all() as { name: string }[]).map((c) => c.name)]));
    const rows = Object.fromEntries(tables.map((t) => [t, snapshot(before, t, cols[t]!)]));
    before.close();

    const db = openDb(copy);
    const to = db.pragma("user_version", { simple: true }) as number;
    const changed: string[] = [];
    for (const t of tables) {
      const now = snapshot(db, t, cols[t]!);
      if (JSON.stringify(now) !== JSON.stringify(rows[t])) changed.push(`${t}: ${rows[t]!.length} rows before, ${now.length} after`);
    }
    const integrity = db.pragma("integrity_check", { simple: true });
    const fk = db.pragma("foreign_key_check") as unknown[];
    db.close();
    const backups = fs.existsSync(path.join(dir, "backups")) ? fs.readdirSync(path.join(dir, "backups")) : [];
    process.stderr.write("REHEARSAL " + JSON.stringify({ from, to, compared: Object.fromEntries(tables.map((t) => [t, rows[t]!.length])), backups }) + String.fromCharCode(10));
    fs.rmSync(dir, { recursive: true, force: true });

    expect(changed).toEqual([]);
    expect(integrity).toBe("ok");
    expect(fk).toEqual([]);
    expect(to).toBeGreaterThan(from === to ? from - 1 : from);
    if (from !== to) expect(backups.length).toBeGreaterThan(0);
  }, 120_000);
});
