import { NextResponse, type NextRequest } from "next/server";
import { guardOrigin, hasAccess, SESSION_COOKIE } from "@/lib/api-guard";

/**
 * The gate in front of the whole app. URHA has no accounts, so a page or Server Action reachable
 * from outside the owner's machine would expose or change everything. Server Actions arrive here
 * as POSTs to their page, so this covers all of them, including any added later. API routes keep
 * their own checks as a second layer.
 *
 * Without access: pages go to /unlock, and everything else gets a 401. A broken address fails
 * inside Next's own router as a 500, so it is answered here as the bad link it is.
 *
 * Every change must also come from this app. Next's own Server Action check compares the origin
 * with X-Forwarded-Host, which a caller can set, so it is not relied on here.
 */
const STUDIO_MAX_BYTES = 50 * 1024 * 1024;
const MAX_BYTES = 8 * 1024 * 1024;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  try {
    decodeURIComponent(pathname);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (pathname === "/unlock" || pathname === "/api/session") return NextResponse.next();
  const reading = request.method === "GET" || request.method === "HEAD";
  if (!hasAccess(request.headers.get("host"), request.cookies.get(SESSION_COOKIE)?.value)) {
    if (pathname.startsWith("/api/") || !reading) return NextResponse.json({ error: "Unlock this app to continue." }, { status: 401 });
    return NextResponse.redirect(new URL("/unlock", request.url));
  }
  if (!reading) {
    const origin = guardOrigin(request);
    if (!origin.ok) return NextResponse.json({ error: origin.error }, { status: origin.status });
    // Refused on the declared size, so a huge or stalled upload never reaches the buffer.
    const limit = pathname.startsWith("/api/studio/") ? STUDIO_MAX_BYTES : MAX_BYTES;
    if (Number(request.headers.get("content-length") ?? 0) > limit) return NextResponse.json({ error: "This upload is too large." }, { status: 413 });
  }
  return NextResponse.next();
}

/** Everything except build output and public media, none of which holds private data. */
export const config = { matcher: ["/((?!_next/static|_next/image|cinema/|python/|practice/data/|art/|images/|icon\\.svg|favicon).*)"] };
