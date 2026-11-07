import { sameOrigin } from "@/lib/studio-access";
import { parseAmfiCsv } from "@/lib/stocks/amfi";
import { parseFundamentalsCsv } from "@/lib/stocks/imports";
import { importFundamentals, saveSegments } from "@/lib/stocks/store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

/** Takes a CSV you exported yourself: ?kind=screener or ?kind=amfi. The file is untrusted. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Imports must come from this app." }, { status: 403 });
  const text = await request.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "This file is over 8 MB." }, { status: 413 });
  const kind = new URL(request.url).searchParams.get("kind");

  if (kind === "amfi") {
    const r = parseAmfiCsv(text);
    if (!r.ok) return Response.json({ error: r.errors.join(" ") }, { status: 422 });
    saveSegments(r.list.rows, r.list.periodEnd);
    return Response.json({ message: `Classified ${r.list.rows.length} companies from the list for the period to ${r.list.periodEnd}.` });
  }
  if (kind === "screener") {
    const r = parseFundamentalsCsv(text);
    if (!r.ok) return Response.json({ error: r.error }, { status: 422 });
    const { matched, unmatched } = importFundamentals("screener", r.rows);
    if (matched === 0) return Response.json({ error: "No row matched a company in the market list. Run a market scan first." }, { status: 422 });
    return Response.json({
      message: `Imported ${r.matched.length} measures for ${matched} ${matched === 1 ? "company" : "companies"}.${unmatched.length ? ` ${unmatched.length} rows did not match a listed company.` : ""}`
        + `${r.ignored.length ? ` Not used: ${r.ignored.slice(0, 8).join(", ")}.` : ""}`,
    });
  }
  return Response.json({ error: "Unknown import type." }, { status: 400 });
}
