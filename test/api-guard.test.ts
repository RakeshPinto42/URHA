import { afterEach, describe, expect, it, vi } from "vitest";
import { guardRead, guardWrite, hasAccess, jsonBody, readLimited, sessionValue, SESSION_COOKIE, SYMBOL, tokenMatches } from "@/lib/api-guard";

const TOKEN = "a-long-enough-access-token-value";
const req = (headers: Record<string, string>, init: RequestInit = {}) => new Request("http://x/api", { method: "POST", ...init, headers });
const local = { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" };

afterEach(() => vi.unstubAllEnvs());

describe("on the owner's machine", () => {
  it("allows a same-origin write", () => expect(guardWrite(req(local)).ok).toBe(true));
  it("refuses another site", () => expect(guardWrite(req({ ...local, origin: "https://evil.example" }))).toMatchObject({ ok: false, status: 403 }));
  it("refuses a request with no origin", () => expect(guardWrite(req({ host: local.host }))).toMatchObject({ ok: false, status: 403 }));
  it("refuses a malformed origin", () => expect(guardWrite(req({ ...local, origin: "not a url" })).ok).toBe(false));
  it("refuses a cross-site fetch even with a forged origin", () => expect(guardWrite(req({ ...local, "sec-fetch-site": "cross-site" })).ok).toBe(false));
  it("accepts the browser's own same-origin marker", () => expect(guardWrite(req({ ...local, "sec-fetch-site": "same-origin" })).ok).toBe(true));
});

describe("away from the owner's machine", () => {
  const hosted = { host: "urha.example.com", origin: "https://urha.example.com" };

  it("fails closed with no token configured", () => {
    expect(guardWrite(req(hosted))).toMatchObject({ ok: false, status: 401 });
    expect(guardRead(req(hosted))).toMatchObject({ ok: false, status: 401 });
  });

  it("is not fooled by forwarded headers or a rebinding host", () => {
    expect(guardWrite(req({ ...hosted, "x-forwarded-host": "127.0.0.1", "x-forwarded-for": "127.0.0.1" })).ok).toBe(false);
    expect(hasAccess("127.0.0.1.evil.example", undefined)).toBe(false);
    expect(hasAccess("localhost.evil.example:3100", undefined)).toBe(false);
  });

  it("ignores a token too short to be safe", () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", "short");
    expect(tokenMatches("short")).toBe(false);
    expect(sessionValue()).toBeNull();
  });

  it("needs a signed session once a token is set, even on loopback", () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", TOKEN);
    expect(guardWrite(req(local)).ok).toBe(false);
    const cookie = `${SESSION_COOKIE}=${sessionValue()}`;
    expect(guardWrite(req({ ...hosted, cookie })).ok).toBe(true);
  });

  it("refuses a forged, tampered or expired session", () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", TOKEN);
    const good = sessionValue()!;
    expect(hasAccess(hosted.host, "9999999999999.deadbeef")).toBe(false);
    expect(hasAccess(hosted.host, `${good}x`)).toBe(false);
    expect(hasAccess(hosted.host, `${Number(good.split(".")[0]) + 1}.${good.split(".")[1]}`)).toBe(false);
    expect(hasAccess(hosted.host, sessionValue(Date.now() - 13 * 3600 * 1000)!)).toBe(false);
    expect(hasAccess(hosted.host, "garbage")).toBe(false);
  });

  it("still requires the same origin with a session", () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", TOKEN);
    const cookie = `${SESSION_COOKIE}=${sessionValue()}`;
    expect(guardWrite(req({ ...hosted, cookie, origin: "https://evil.example" }))).toMatchObject({ ok: false, status: 403 });
  });

  it("has no bypass in development or test", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(guardWrite(req(hosted)).ok).toBe(false);
    vi.stubEnv("NODE_ENV", "test");
    expect(guardWrite(req(hosted)).ok).toBe(false);
  });

  it("checks the token without accepting near misses", () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", TOKEN);
    expect(tokenMatches(TOKEN)).toBe(true);
    for (const bad of [`${TOKEN}x`, TOKEN.slice(1), "", null, 5, {}]) expect(tokenMatches(bad)).toBe(false);
  });
});

describe("request bodies", () => {
  const json = (body: string) => req({ ...local, "content-type": "application/json" }, { body });

  it("accepts an object only", async () => {
    expect(await jsonBody(json('{"a":1}'))).toEqual({ a: 1 });
    for (const bad of ["null", "[]", "5", '"x"', "{bad"]) expect(await jsonBody(json(bad)), bad).toBeNull();
  });

  it("refuses the wrong content type, which plain forms from other sites would send", async () => {
    expect(await jsonBody(req({ ...local, "content-type": "text/plain" }, { body: '{"a":1}' }))).toBeNull();
  });

  it("stops at the limit on the declared size", async () => {
    expect(await readLimited(req({ "content-length": "999999" }, { body: "x" }), 10)).toBeNull();
  });

  it("stops at the limit even when the declared size lies", async () => {
    let pulled = 0;
    const body = new ReadableStream({ pull(c) { pulled++; c.enqueue(new Uint8Array(1024)); } });
    const r = new Request("http://x/api", { method: "POST", body, duplex: "half" } as RequestInit);
    expect(await readLimited(r, 4096)).toBeNull();
    expect(pulled).toBeLessThan(10);
  });

  it("reads what fits", async () => expect(await readLimited(req({}, { body: "hello" }), 10)).toBe("hello"));
});

describe("symbols", () => {
  it("allows real ones", () => { for (const s of ["RELIANCE", "M&M", "BAJAJ-AUTO", "20MICRONS"]) expect(SYMBOL.test(s), s).toBe(true); });
  it("refuses anything else", () => { for (const s of ["", "a", "%", "../x", "A B", "<script>", "A".repeat(31)]) expect(SYMBOL.test(s), s).toBe(false); });
});

describe("every route that changes data", () => {
  it("goes through the guard", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const routes: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.name === "route.ts") routes.push(p);
    });
    walk("app/api");
    expect(routes.length).toBeGreaterThan(5);
    for (const r of routes) {
      const s = fs.readFileSync(r, "utf8");
      if (/export async function (POST|PUT|PATCH|DELETE)/.test(s)) expect(/guardWrite\(request\)|guardOrigin\(request\)/.test(s), r).toBe(true);
    }
  });
});

describe("private reads", () => {
  it("guards the database backup and the watchlist export", async () => {
    const fs = await import("node:fs");
    for (const r of ["app/api/backup/route.ts", "app/api/stocks/watchlist/route.ts"]) expect(fs.readFileSync(r, "utf8"), r).toContain("guardRead(request)");
  });
});

describe("the gate in front of the app", () => {
  const go = async (path: string, init: { method?: string; host?: string; cookie?: string } = {}) => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");
    const headers: Record<string, string> = { host: init.host ?? "urha.example.com" };
    if (init.cookie) headers.cookie = init.cookie;
    return proxy(new NextRequest(`http://${headers.host}${path}`, { method: init.method ?? "GET", headers }));
  };

  it("sends an outsider's page to /unlock", async () => {
    const r = await go("/career");
    expect(r.status).toBe(307);
    expect(r.headers.get("location")).toContain("/unlock");
  });

  it("refuses a Server Action, which arrives as a POST to a page", async () => {
    expect((await go("/tasks", { method: "POST" })).status).toBe(401);
    expect((await go("/settings", { method: "POST" })).status).toBe(401);
  });

  it("refuses every API route, including read-only ones", async () => {
    for (const p of ["/api/stocks/scan", "/api/studio/assets", "/api/backup"]) expect((await go(p)).status, p).toBe(401);
  });

  it("leaves only the unlock path open", async () => {
    expect((await go("/unlock")).headers.get("x-middleware-next")).toBe("1");
    expect((await go("/api/session", { method: "POST" })).headers.get("x-middleware-next")).toBe("1");
  });

  it("lets the owner through on loopback", async () => {
    expect((await go("/career", { host: "127.0.0.1:3100" })).headers.get("x-middleware-next")).toBe("1");
  });

  it("lets a valid session through, and no other", async () => {
    vi.stubEnv("URHA_ACCESS_TOKEN", TOKEN);
    expect((await go("/career", { cookie: `${SESSION_COOKIE}=${sessionValue()}` })).headers.get("x-middleware-next")).toBe("1");
    expect((await go("/career", { cookie: `${SESSION_COOKIE}=1.2` })).status).toBe(307);
    expect((await go("/career", { host: "127.0.0.1:3100" })).status).toBe(307);
  });

  it("refuses a change from another site, whatever X-Forwarded-Host claims", async () => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");
    const send = (headers: Record<string, string>) => proxy(new NextRequest("http://127.0.0.1:3100/career", { method: "POST", headers: { host: "127.0.0.1:3100", ...headers } }));
    expect(send({ origin: "https://evil.example", "x-forwarded-host": "evil.example" }).status).toBe(403);
    expect(send({}).status).toBe(403);
    expect(send({ origin: "http://127.0.0.1:3100" }).headers.get("x-middleware-next")).toBe("1");
  });

  it("refuses an oversized body on its declared size", async () => {
    const { proxy } = await import("@/proxy");
    const { NextRequest } = await import("next/server");
    const send = (path: string, size: number) => proxy(new NextRequest(`http://127.0.0.1:3100${path}`, { method: "POST", headers: { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "content-length": String(size) } }));
    expect(send("/api/stocks/import", 9e6).status).toBe(413);
    expect(send("/api/stocks/import", 1e9).status).toBe(413);
    expect(send("/api/studio/assets", 40e6).headers.get("x-middleware-next")).toBe("1");
    expect(send("/api/studio/assets", 60e6).status).toBe(413);
  });

  it("answers a broken address with 404", async () => expect((await go("/discovery/%E0%A4%A", { host: "127.0.0.1" })).status).toBe(404));
});
