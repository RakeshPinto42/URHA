// Writes a consistent copy of the URHA database to data/backups/ (safe while running).
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = process.env.URHA_DB_PATH || path.join(root, "data", "urha.db");
if (!fs.existsSync(src)) {
  console.error(`No database at ${src}. Start URHA once to create it.`);
  process.exit(1);
}
const dir = path.join(root, "data", "backups");
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `urha-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
const db = new Database(src, { readonly: true, fileMustExist: true });
await db.backup(out);
db.close();
console.log(`Backup written: ${out}`);
