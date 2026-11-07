// Shared outbound HTTP for data sources (server only): timeout, retry with
// backoff on 429/5xx/network (honours Retry-After), and a per-host minimum
// interval so sequential callers stay under provider rate limits.
// Errors are typed; nothing is thrown to callers.

export type HttpErrorKind = "unavailable" | "not-found" | "rate-limited" | "malformed" | "auth";
export type HttpResult = { ok: true; json: unknown; status: number } | { ok: false; kind: HttpErrorKind; message: string; status: number | null };

export type HttpOptions = {
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: unknown;
  /** Minimum gap between requests to the same host (rate-limit courtesy). */
  minIntervalMs?: number;
  /** Label used in error messages, e.g. "TejHQ /v1/status". */
  label?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const DEFAULT_UA = "NexEra2/0.1";
const lastCall = new Map<string, Promise<number>>();
const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Serialises calls per host and spaces them by minIntervalMs. */
async function throttle(host: string, minIntervalMs: number, sleep: (ms: number) => Promise<void>): Promise<void> {
  if (minIntervalMs <= 0) return;
  const prev = lastCall.get(host) ?? Promise.resolve(0);
  const mine = prev.then(async (t) => {
    const wait = t + minIntervalMs - Date.now();
    if (wait > 0) await sleep(wait);
    return Date.now();
  });
  lastCall.set(host, mine);
  await mine;
}

function retryAfterMs(r: Response): number | null {
  const v = r.headers?.get?.("retry-after");
  if (!v) return null;
  const s = Number(v);
  if (Number.isFinite(s)) return Math.min(s * 1000, 30_000);
  const d = Date.parse(v);
  return Number.isFinite(d) ? Math.min(Math.max(d - Date.now(), 0), 30_000) : null;
}

const kindFor = (status: number): HttpErrorKind =>
  status === 404 ? "not-found" : status === 429 ? "rate-limited" : status === 401 || status === 403 ? "auth" : "unavailable";

export async function getJson(url: string, opts: HttpOptions = {}): Promise<HttpResult> {
  const { timeoutMs = 10_000, retries = 2, minIntervalMs = 0, method = "GET", fetchImpl = fetch, sleep = realSleep } = opts;
  const label = opts.label ?? url;
  const host = new URL(url).host;
  const headers: Record<string, string> = { "User-Agent": DEFAULT_UA, Accept: "application/json", ...opts.headers };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  let lastStatus: number | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(host, minIntervalMs, sleep);
    let r: Response;
    try {
      r = await fetchImpl(url, {
        method, headers, signal: AbortSignal.timeout(timeoutMs),
        // Next caches fetch by default, which froze provider answers at their first reply.
        cache: "no-store",
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    } catch (e) {
      if (attempt < retries) { await sleep(1000 * 2 ** attempt); continue; }
      const name = (e as { name?: string }).name;
      const why = name === "TimeoutError" || name === "AbortError" ? `no response within ${timeoutMs / 1000} s` : e instanceof Error ? e.message : "network error";
      return { ok: false, kind: "unavailable", message: `${label} unreachable: ${why}`, status: lastStatus };
    }
    lastStatus = r.status;
    if ((r.status === 429 || r.status >= 500) && attempt < retries) {
      await r.body?.cancel().catch(() => undefined);
      await sleep(retryAfterMs(r) ?? 1000 * 2 ** attempt);
      continue;
    }
    if (!r.ok) {
      await r.body?.cancel().catch(() => undefined);
      return { ok: false, kind: kindFor(r.status), message: `${label} → HTTP ${r.status}`, status: r.status };
    }
    try {
      return { ok: true, json: (await r.json()) as unknown, status: r.status };
    } catch {
      return { ok: false, kind: "malformed", message: `${label} returned non-JSON`, status: r.status };
    }
  }
  return { ok: false, kind: "unavailable", message: `${label} failed after retries`, status: lastStatus };
}
