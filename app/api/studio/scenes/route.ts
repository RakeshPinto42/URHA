/**
 * Saves a Studio scene to public/cinema/scenes/. Absent unless the Studio is enabled
 * (lib/studio-access.ts). The scene is validated here too: the browser's word is not enough,
 * and its id is what names the file, so a valid id is what keeps the write in that folder.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { serializeScene } from "@/lib/cinema-engine/editor";
import { parseScene } from "@/lib/cinema-engine/schema";
import { SCENES_DIR, listSceneIds, sameOrigin, studioEnabled } from "@/lib/studio-access";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!studioEnabled()) return json({ error: "Not found." }, 404);
  return json({ scenes: await listSceneIds() });
}

export async function POST(request: Request) {
  if (!studioEnabled()) return json({ error: "Not found." }, 404);
  if (!sameOrigin(request)) return json({ error: "Saves must come from the Studio itself." }, 403);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: "This scene is too large to save." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "The request was not valid JSON." }, 400);
  }
  const parsed = parseScene(body);
  if (!parsed.ok) return json({ error: "The scene has problems.", details: parsed.errors }, 422);

  const file = path.join(SCENES_DIR, `${parsed.scene.id}.json`);
  if (path.dirname(file) !== SCENES_DIR) return json({ error: "Invalid scene id." }, 400);
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, serializeScene(parsed.scene), "utf8");
  await fs.rename(temp, file); // All or nothing: a failed save never leaves half a scene.
  return json({ saved: parsed.scene.id });
}
