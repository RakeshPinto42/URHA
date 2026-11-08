/** Downloads the exchanges' own price files on request, and checks TejHQ against them. */
import { guardRead, guardWrite, jsonBody, refused } from "@/lib/api-guard";
import { bseState, startBseHistory, stopBseHistory } from "@/lib/stocks/bse-history";
import { fetchOfficial, latestAgreement, officialCoverage } from "@/lib/stocks/official";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const busy = ((globalThis as { __urhaOfficial?: { running: boolean } }).__urhaOfficial ??= { running: false });

export async function GET(request: Request) {
  const g = guardRead(request);
  if (!g.ok) return refused(g);
  const { summary, ...bse } = bseState();
  return json({ coverage: officialCoverage(), agreement: latestAgreement(), running: busy.running, bse: { ...bse, built: summary ? { latest: summary.latest, sessions: summary.sessions, read: summary.read } : null } });
}

export async function POST(request: Request) {
  const g = guardWrite(request);
  if (!g.ok) return refused(g);
  const body = (await jsonBody(request)) as { action?: unknown } | null;
  // The year of BSE files for BSE-only companies: a long, paced job that reports progress.
  if (body?.action === "bse-history") { const r = startBseHistory(); return r.ok ? json({ ok: true }) : json({ error: r.error }, 409); }
  if (body?.action === "bse-stop") { stopBseHistory(); return json({ ok: true }); }
  if (body?.action !== undefined) return json({ error: "Unknown action." }, 400);
  if (busy.running) return json({ error: "A download is already in progress." }, 409);
  busy.running = true;
  try {
    return json(await fetchOfficial());
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "The download failed." }, 502);
  } finally {
    busy.running = false;
  }
}
