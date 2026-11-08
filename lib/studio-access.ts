/**
 * Who can reach the Studio, the environment editor. It writes files into public/ on the machine
 * running URHA, so it is never available to a remote session, even an unlocked one.
 *
 * It opens in three deliberate ways:
 *  - in development (`npm run dev`);
 *  - with URHA_STUDIO=1 on a local production run, for scripted use;
 *  - with Editor mode switched on in Settings, which is stored in the database and only works
 *    for requests from this machine (a loopback host).
 * Every write still passes guardWrite in its API route as well.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getDb, LOCAL_USER_ID } from "./db";

const LOOPBACK = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
export const isLoopback = (host: string | null | undefined) => !!host && LOOPBACK.test(host);

/** Open by the environment: development, or URHA_STUDIO=1. */
export const studioByEnvironment = () => process.env.NODE_ENV !== "production" || process.env.URHA_STUDIO === "1";

export function editorModeOn(): boolean {
  const row = getDb().prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'editor_mode'").get(LOCAL_USER_ID) as { value: string } | undefined;
  return row?.value === "1";
}

export function setEditorMode(on: boolean) {
  getDb().prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'editor_mode', ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value")
    .run(LOCAL_USER_ID, on ? "1" : "0");
}

/** Whether this request may use the Studio. Never for a host other than this machine. */
export function studioAllowed(host: string | null | undefined): boolean {
  if (!isLoopback(host)) return false;
  return studioByEnvironment() || editorModeOn();
}

/** Kept for code that only needs the environment's answer. */
export const studioEnabled = studioByEnvironment;

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
