/** Starts, stops and reports the historical validation of the verdicts. */
import { guardRead, guardWrite, jsonBody, refused } from "@/lib/api-guard";
import { backtestState, startBacktest, stopBacktest } from "@/lib/stocks/validation";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const g = guardRead(request);
  if (!g.ok) return refused(g);
  return json(backtestState());
}

export async function POST(request: Request) {
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const body = await jsonBody(request);
  if (!body) return json({ error: "A JSON object is required." }, 400);
  if (body.action === "stop") { stopBacktest(); return json({ ok: true }); }
  if (body.action !== "start") return json({ error: "The action must be start or stop." }, 400);
  const sample = body.sample ?? 150;
  if (!(typeof sample === "number" && Number.isInteger(sample) && sample >= 10 && sample <= 600)) return json({ error: "The sample must be a whole number from 10 to 600." }, 400);
  const r = await startBacktest(sample);
  return r.ok ? json(r) : json({ error: r.error }, 409);
}
