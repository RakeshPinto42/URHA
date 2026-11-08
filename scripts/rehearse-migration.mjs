// Rehearses the database upgrade on a copy of data/urha.db and compares every personal and
// progress row. Reads the real file only. Usage: npm run db:rehearse
import { spawnSync } from "node:child_process";
const r = spawnSync("npx", ["vitest", "run", "test/migration-rehearsal.test.ts"], { stdio: "inherit", shell: true, env: { ...process.env, URHA_REHEARSE: "1" } });
process.exit(r.status ?? 1);
