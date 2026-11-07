/**
 * Who can reach the Studio. It writes files and URHA has no login, so a hosted build must
 * never expose it: it exists in development, or where the owner turns it on for a local run
 * with URHA_STUDIO=1.
 */
import fs from "node:fs/promises";
import path from "node:path";

export const studioEnabled = () => process.env.NODE_ENV !== "production" || process.env.URHA_STUDIO === "1";

export const SCENES_DIR = path.join(process.cwd(), "public", "cinema", "scenes");

export async function listSceneIds(): Promise<string[]> {
  const files = await fs.readdir(SCENES_DIR).catch(() => []);
  return files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort();
}

/** True when the request came from this same site, so another site cannot drive the save. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
