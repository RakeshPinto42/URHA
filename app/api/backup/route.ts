/**
 * GET /api/backup — a consistent snapshot of the database (better-sqlite3 online
 * backup API), streamed as a download, then deleted from the temp folder.
 * Local-only: the server binds to 127.0.0.1. Add auth before exposing it anywhere.
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tmp = path.join(os.tmpdir(), `urha-backup-${stamp}-${process.pid}.db`);
  try {
    await getDb().backup(tmp);
    const bytes = await fs.readFile(tmp);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="urha-backup-${stamp}.db"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[urha backup]", e);
    return new Response("Backup failed. Your data is unchanged; try again.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } finally {
    await fs.rm(tmp, { force: true });
  }
}
