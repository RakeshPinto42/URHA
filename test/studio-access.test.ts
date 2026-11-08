import { afterEach, describe, expect, it, vi } from "vitest";
import { setEditorMode, studioAllowed } from "@/lib/studio-access";

afterEach(() => { vi.unstubAllEnvs(); setEditorMode(false); });

describe("who may open the environment editor", () => {
  it("never a remote host, whatever else is true", () => {
    setEditorMode(true);
    vi.stubEnv("URHA_STUDIO", "1");
    for (const host of ["urha.example.com", "192.168.1.20:3100", null, "127.0.0.1.evil.com"]) expect(studioAllowed(host), String(host)).toBe(false);
  });

  it("on a production run, this machine only when editor mode is on", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("URHA_STUDIO", "");
    expect(studioAllowed("127.0.0.1:3100")).toBe(false);
    setEditorMode(true);
    expect(studioAllowed("127.0.0.1:3100")).toBe(true);
    expect(studioAllowed("localhost:3100")).toBe(true);
  });

  it("URHA_STUDIO=1 still opens it for scripted local use", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("URHA_STUDIO", "1");
    expect(studioAllowed("127.0.0.1:3100")).toBe(true);
  });
});
