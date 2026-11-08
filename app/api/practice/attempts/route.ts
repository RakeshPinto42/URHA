/**
 * Records a practice attempt in URHA's database. Same guard as every other write: access, and
 * a request from this app's own pages. The checks ran in the learner's browser, so this is the
 * learner's own record of their practice, stored with their other progress.
 */
import { guardWrite, jsonBody, refused } from "@/lib/api-guard";
import { MAX_CODE, parseAttempt, practiceStatus, recordAttempt } from "@/lib/practice/progress";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const body = await jsonBody(request, MAX_CODE + 4096);
  if (!body) return json({ error: "Send a JSON object of at most 54 KB." }, 400);
  const parsed = parseAttempt(body);
  if (!parsed.ok) return json({ error: parsed.error }, 422);
  recordAttempt(parsed.value);
  const status = practiceStatus()[parsed.value.exerciseId];
  return json({ saved: true, status });
}
