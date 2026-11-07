/**
 * Quality tiers (docs/CINEMATIC_ENGINE_AUDIT.md §6). Pure, so it tests without a GPU.
 *
 * The tier is chosen once from what the device reports, then a running average of frame time
 * steps it down if the machine cannot keep up. It never steps back up in a visit, because
 * a scene that visibly flips between looks is worse than a steady, simpler one.
 */

export type TierId = "high" | "medium" | "low";

export type Tier = {
  id: TierId;
  pixelRatio: number;   // cap on device pixels per CSS pixel
  shadowMap: number;    // shadow texture size; 0 is no shadows
  bloomScale: number;   // bloom resolution against the screen; 0 is no bloom
  msaa: number;         // samples; 0 is off
  particles: number;    // share of particles kept
  detail: number;       // share of geometry kept
  pointLights: boolean; // moving coloured lights
};

export const TIERS: Record<TierId, Tier> = {
  high: { id: "high", pixelRatio: 1.75, shadowMap: 2048, bloomScale: 1, msaa: 4, particles: 1, detail: 1, pointLights: true },
  medium: { id: "medium", pixelRatio: 1.25, shadowMap: 1024, bloomScale: 0.5, msaa: 0, particles: 0.6, detail: 0.8, pointLights: false },
  low: { id: "low", pixelRatio: 1, shadowMap: 0, bloomScale: 0, msaa: 0, particles: 0.35, detail: 0.55, pointLights: false },
};

const ORDER: TierId[] = ["high", "medium", "low"];

export const isTierId = (v: unknown): v is TierId => ORDER.includes(v as TierId);

export function pickTier(device: { renderer: string | null; mobile: boolean; override?: unknown }): TierId {
  if (isTierId(device.override)) return device.override;
  const r = (device.renderer ?? "").toLowerCase();
  if (device.mobile || /swiftshader|llvmpipe|software|microsoft basic/.test(r)) return "low";
  if (/\b(geforce|nvidia|rtx|gtx|quadro|radeon (rx|pro)|arc)\b/.test(r)) return "high";
  return "medium"; // Integrated, unknown, or the browser hid it: the safe middle.
}

export function nextTierDown(id: TierId): TierId | null {
  return ORDER[ORDER.indexOf(id) + 1] ?? null;
}

const WARM_UP_FRAMES = 60;  // Shaders compile and textures upload here: not a fair measure.
const WINDOW = 90;
const TOO_SLOW_MS = 40;     // About 25 frames a second.
const UNUSABLE_MS = 100;    // About 10 frames a second, at the lowest tier.

export type FrameVerdict = "ok" | "step-down" | "too-slow";

/** Feed it frame times; it says when the running average has stayed too slow. */
export class FrameWatch {
  private seen = 0;
  private sum = 0;
  private count = 0;

  record(ms: number, atLowestTier: boolean): FrameVerdict {
    this.seen += 1;
    if (this.seen <= WARM_UP_FRAMES) return "ok";
    this.sum += Math.min(ms, 1000); // A background tab's long gap is not a slow frame.
    this.count += 1;
    if (this.count < WINDOW) return "ok";
    const average = this.sum / this.count;
    this.sum = 0;
    this.count = 0;
    if (atLowestTier) return average > UNUSABLE_MS ? "too-slow" : "ok";
    if (average > TOO_SLOW_MS) { this.seen = 0; return "step-down"; } // Give the new tier its own warm-up.
    return "ok";
  }
}
