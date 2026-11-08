import { guardWrite, jsonBody, refused } from "@/lib/api-guard";
import { scanState, startScan, stopScan } from "@/lib/stocks/scan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(scanState(), { headers: { "Cache-Control": "no-store" } });
}

/** Starts or stops the market scan. `limit` runs part of the market, to try it quickly. */
export async function POST(request: Request) {
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const body = await jsonBody(request);
  if (!body) return Response.json({ error: "A JSON object is required." }, { status: 400 });
  const { action, limit } = body;
  if (action !== "start" && action !== "stop") return Response.json({ error: "The action must be start or stop." }, { status: 400 });
  if (action === "stop") { stopScan(); return Response.json({ ok: true }); }
  if (limit !== undefined && !(typeof limit === "number" && Number.isInteger(limit) && limit >= 1 && limit <= 5000)) {
    return Response.json({ error: "The limit must be a whole number from 1 to 5,000." }, { status: 400 });
  }
  const r = await startScan(limit);
  return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 409 });
}
