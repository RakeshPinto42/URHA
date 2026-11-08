import { guardRead, guardWrite, jsonBody, refused, SYMBOL } from "@/lib/api-guard";
import { loadDiscovery, watchlistCsv } from "@/lib/stocks/discovery";
import { getCompany, listWatch, setThesis, setWatched } from "@/lib/stocks/store";

export const dynamic = "force-dynamic";

/** The watchlist as a CSV download. Theses are private, so this needs access too. */
export async function GET(request: Request) {
  const g = guardRead(request);
  if (!g.ok) return refused(g);
  const theses = new Map(listWatch().map((w) => [w.symbol, w.thesis]));
  const rows = loadDiscovery().rows.filter((r) => r.watched);
  return new Response(watchlistCsv(rows, theses), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="urha-watchlist-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

export async function POST(request: Request) {
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const b = await jsonBody(request);
  if (!b) return Response.json({ error: "A JSON object is required." }, { status: 400 });
  const { symbol, watched, thesis } = b;
  if (typeof symbol !== "string" || !SYMBOL.test(symbol) || !getCompany(symbol)) return Response.json({ error: "Unknown company." }, { status: 404 });
  if (watched !== undefined && typeof watched !== "boolean") return Response.json({ error: "Watched must be true or false." }, { status: 400 });
  if (thesis !== undefined && (typeof thesis !== "string" || thesis.length > 2000)) return Response.json({ error: "A thesis must be text of up to 2,000 characters." }, { status: 400 });
  if (typeof watched === "boolean") setWatched(symbol, watched);
  if (typeof thesis === "string") setThesis(symbol, thesis);
  return Response.json({ ok: true });
}
