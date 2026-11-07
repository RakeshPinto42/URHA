/**
 * The light through the glass (docs/DESIGN.md §13): one palette for the whole app.
 *
 * Seven panes of stained glass in dawn order: each phase of the path takes one, and each
 * section of the app takes one as its room colour. Pure data, so the 3D scene, the
 * shaders, the shell and the tests all read the same values.
 *
 * - `bright` is light: fills, beams and the 3D world. Never text on white.
 * - `deep` is ink: text, controls and focus rings. Tested at 4.5:1 or better.
 */
export type Pane = { name: string; bright: string; deep: string };

export const GLASS: readonly Pane[] = [
  { name: "ruby", bright: "#ff3b4e", deep: "#c01f33" },
  { name: "saffron", bright: "#ff8a1f", deep: "#a54a06" },
  { name: "gold", bright: "#ffc826", deep: "#8a6400" },
  { name: "emerald", bright: "#12c27a", deep: "#0b7a4e" },
  { name: "lagoon", bright: "#0fb9d6", deep: "#0a7388" },
  { name: "cobalt", bright: "#3a6bff", deep: "#2450d8" },
  { name: "rose", bright: "#ff4fa3", deep: "#c0247a" },
];

/** The pane of a phase by index; wraps so a longer curriculum cannot run out of glass. */
export const paneAt = (index: number): Pane => GLASS[((index % GLASS.length) + GLASS.length) % GLASS.length]!;

export type SectionId = "home" | "path" | "academy" | "tasks" | "skills" | "projects" | "assessments" | "journal" | "meditation" | "insights" | "settings" | "credits";

/** Room colour by section. `light` is the second colour a living picture is lit with. */
export const SECTIONS: Record<SectionId, { pane: Pane; light: Pane }> = {
  home: { pane: GLASS[1]!, light: GLASS[6]! },
  path: { pane: GLASS[2]!, light: GLASS[1]! },
  academy: { pane: GLASS[5]!, light: GLASS[2]! },
  tasks: { pane: GLASS[0]!, light: GLASS[1]! },
  skills: { pane: GLASS[3]!, light: GLASS[2]! },
  projects: { pane: GLASS[1]!, light: GLASS[0]! },
  assessments: { pane: GLASS[6]!, light: GLASS[2]! },
  journal: { pane: GLASS[4]!, light: GLASS[2]! },
  meditation: { pane: GLASS[2]!, light: GLASS[5]! },
  insights: { pane: GLASS[4]!, light: GLASS[6]! },
  settings: { pane: GLASS[5]!, light: GLASS[4]! },
  credits: { pane: GLASS[3]!, light: GLASS[4]! },
};

const BY_PREFIX: [string, SectionId][] = [
  ["/path", "path"], ["/academy", "academy"], ["/tasks", "tasks"], ["/skills", "skills"], ["/projects", "projects"],
  ["/assessments", "assessments"], ["/journal", "journal"], ["/meditation", "meditation"], ["/insights", "insights"],
  ["/settings", "settings"], ["/credits", "credits"],
];

export function sectionOf(pathname: string): SectionId {
  return BY_PREFIX.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] ?? "home";
}

/** "#ff8a1f" → [1, 0.54, 0.12], the form a shader uniform takes. */
export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`hexToRgb: expected #rrggbb, received ${hex}`);
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** WCAG contrast ratio of two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, c] = hexToRgb(hex).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * c;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
