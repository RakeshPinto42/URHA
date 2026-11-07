import { sameOrigin } from "@/lib/studio-access";
import { scanState, startScan, stopScan } from "@/lib/stocks/scan";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(scanState(), { headers: { "Cache-Control": "no-store" } });
}

/** Starts or stops the market scan. `limit` runs part of the market, to try it quickly. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Scans must be started from this app." }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { action?: unknown; limit?: unknown };
  if (body.action === "stop") { stopScan(); return Response.json({ ok: true }); }
  const limit = typeof body.limit === "number" && Number.isInteger(body.limit) && body.limit > 0 ? body.limit : undefined;
  const r = await startScan(limit);
  return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 409 });
}
