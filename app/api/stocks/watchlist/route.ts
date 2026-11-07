import { sameOrigin } from "@/lib/studio-access";
import { loadDiscovery, watchlistCsv } from "@/lib/stocks/discovery";
import { getCompany, listWatch, setThesis, setWatched } from "@/lib/stocks/store";

export const dynamic = "force-dynamic";

/** The watchlist as a CSV download. */
export async function GET() {
  const watch = listWatch();
  const theses = new Map(watch.map((w) => [w.symbol, w.thesis]));
  const rows = loadDiscovery().rows.filter((r) => r.watched);
  return new Response(watchlistCsv(rows, theses), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="urha-watchlist-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Changes must come from this app." }, { status: 403 });
  const b = (await request.json().catch(() => ({}))) as { symbol?: unknown; watched?: unknown; thesis?: unknown };
  if (typeof b.symbol !== "string" || !getCompany(b.symbol)) return Response.json({ error: "Unknown company." }, { status: 404 });
  if (typeof b.watched === "boolean") setWatched(b.symbol, b.watched);
  if (typeof b.thesis === "string") setThesis(b.symbol, b.thesis.slice(0, 2000));
  return Response.json({ ok: true });
}
