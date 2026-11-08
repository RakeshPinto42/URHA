import { cookies } from "next/headers";
import { guardOrigin, jsonBody, refused, SESSION_COOKIE, SESSION_SECONDS, sessionValue, tokenMatches } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

const MAX_TRIES = 5;
const WINDOW_MS = 60_000;
const tries = ((globalThis as { __urhaUnlock?: number[] }).__urhaUnlock ??= []);

/** Unlocks this browser with the access token. Only the origin can be checked: it is not unlocked yet. */
export async function POST(request: Request) {
  const g = guardOrigin(request);
  if (!g.ok) return refused(g);
  const now = Date.now();
  while (tries.length && now - tries[0]! > WINDOW_MS) tries.shift();
  if (tries.length >= MAX_TRIES) return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  tries.push(now);
  const body = await jsonBody(request);
  const value = tokenMatches(body?.token) ? sessionValue() : null;
  if (!value) return Response.json({ error: "That token is not valid." }, { status: 401 });
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true, sameSite: "strict", secure: request.headers.get("origin")!.startsWith("https:"), path: "/", maxAge: SESSION_SECONDS,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const g = guardOrigin(request);
  if (!g.ok) return refused(g);
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
