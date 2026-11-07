import { describe, expect, it } from "vitest";
import { GLASS, SECTIONS, contrast, hexToRgb, paneAt, sectionOf } from "@/lib/cinema";
import { NAV, UTILITY_NAV } from "@/lib/nav";

describe("the glass palette", () => {
  it("has one pane per phase", () => expect(GLASS).toHaveLength(7));

  it("keeps ink colours readable on white and on the tinted room surface", () => {
    for (const p of GLASS) {
      expect(contrast(p.deep, "#ffffff"), p.name).toBeGreaterThanOrEqual(4.5);
      // .room --surface: 9% of the bright pane over #f7f7f3 (globals.css).
      const base = [0xf7, 0xf7, 0xf3];
      const mixed = hexToRgb(p.bright).map((v, i) => Math.round(v * 255 * 0.09 + base[i]! * 0.91));
      const surface = `#${mixed.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      expect(contrast(p.deep, surface), `${p.name} on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("wraps phases past the seventh and never returns nothing", () => {
    expect(paneAt(7)).toBe(GLASS[0]);
    expect(paneAt(-1)).toBe(GLASS[6]);
  });

  it("rejects a colour a shader could not use", () => {
    expect(() => hexToRgb("red")).toThrow(/expected #rrggbb/);
    expect(hexToRgb("#ff0000")).toEqual([1, 0, 0]);
  });
});

describe("section colours", () => {
  it("resolves every navigation item to its own section", () => {
    for (const n of [...NAV, ...UTILITY_NAV]) {
      const s = sectionOf(n.href);
      expect(SECTIONS[s], n.href).toBeDefined();
      if (n.href !== "/") expect(s, n.href).toBe(n.href.slice(1));
    }
  });

  it("keeps nested pages in their section and does not match on a shared prefix", () => {
    expect(sectionOf("/academy/topic-1")).toBe("academy");
    expect(sectionOf("/meditation/read/John/3")).toBe("meditation");
    expect(sectionOf("/pathology")).toBe("home");
    expect(sectionOf("/")).toBe("home");
  });
});
