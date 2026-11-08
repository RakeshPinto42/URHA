/**
 * Who may change data or read private exports. URHA has one owner and no accounts.
 *
 * On the owner's machine, only a loopback address passes, so a page in another site or a DNS
 * rebinding attempt cannot reach these routes. Anywhere else, access needs URHA_ACCESS_TOKEN set
 * and a session unlocked with it. With no token configured, a hosted build refuses: it fails closed.
 *
 * Forwarded headers are never trusted, and there is no test or development exception here.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "urha_session";
export const SESSION_SECONDS = 12 * 3600;
const MIN_TOKEN_LENGTH = 24;

export type Guard = { ok: true } | { ok: false; status: number; error: string };

const LOOPBACK = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
const configuredToken = () => { const t = process.env.URHA_ACCESS_TOKEN ?? ""; return t.length >= MIN_TOKEN_LENGTH ? t : null; };
const sign = (token: string, expires: string) => createHmac("sha256", token).update(`urha-session:${expires}`).digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const tokenMatches = (candidate: unknown): boolean => {
  const token = configuredToken();
  return !!token && typeof candidate === "string" && same(candidate, token);
};

export function sessionValue(now = Date.now()): string | null {
  const token = configuredToken();
  if (!token) return null;
  const expires = String(now + SESSION_SECONDS * 1000);
  return `${expires}.${sign(token, expires)}`;
}

function sessionIsValid(value: string | undefined, now = Date.now()): boolean {
  const token = configuredToken();
  if (!token || !value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || !/^\d+$/.test(expires) || Number(expires) <= now) return false;
  return same(mac, sign(token, expires));
}

const cookieIn = (request: Request) => request.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);

/** Whether this request's host may see private data at all. */
export function hasAccess(host: string | null, session: string | undefined): boolean {
  if (configuredToken()) return sessionIsValid(session);
  return !!host && LOOPBACK.test(host);
}

/** Reads of private data, such as the watchlist export. */
export function guardRead(request: Request): Guard {
  return hasAccess(request.headers.get("host"), cookieIn(request)) ? { ok: true } : { ok: false, status: 401, error: "Unlock this app to continue." };
}

/** True only for a request made by this app's own pages. */
export function guardOrigin(request: Request): Guard {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return { ok: false, status: 403, error: "Changes must come from this app." };
  let originHost: string;
  try { originHost = new URL(origin).host; } catch { return { ok: false, status: 403, error: "Changes must come from this app." }; }
  if (originHost !== host) return { ok: false, status: 403, error: "Changes must come from this app." };
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return { ok: false, status: 403, error: "Changes must come from this app." };
  return { ok: true };
}

/** Changes. Needs access, and must come from this app's own pages. */
export function guardWrite(request: Request): Guard {
  const access = guardRead(request);
  return access.ok ? guardOrigin(request) : access;
}

export const refused = (g: Extract<Guard, { ok: false }>) => Response.json({ error: g.error }, { status: g.status, headers: { "Cache-Control": "no-store" } });

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** A JSON body that must be an object. Anything else is null, so handlers cannot trip on it. */
export async function jsonBody(request: Request, maxBytes = 16 * 1024): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const text = await readLimited(request, maxBytes);
  if (text === null) return null;
  try { const v: unknown = JSON.parse(text); return isRecord(v) ? v : null; } catch { return null; }
}

/** Reads a body up to a limit, stopping as soon as it is passed rather than buffering it all. */
export async function readLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export const SYMBOL = /^[A-Z0-9&_-]{1,30}$/;
