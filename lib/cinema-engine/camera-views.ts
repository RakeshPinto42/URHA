/**
 * The Studio's camera views (brief §3). Pure geometry, so it tests without a GPU.
 * Each view is a starting shot around whatever is being looked at. The Studio then moves it
 * with orbit controls, or with keys in first-person and third-person.
 */
import type { Vec3 } from "./schema";

export type CameraView = "orbit" | "top-down" | "isometric" | "first-person" | "third-person";

export const CAMERA_VIEWS: { id: CameraView; label: string; orbits: boolean }[] = [
  { id: "orbit", label: "Orbit", orbits: true },
  { id: "top-down", label: "Top-down", orbits: true },
  { id: "isometric", label: "Isometric", orbits: true },
  { id: "first-person", label: "First-person", orbits: false },
  { id: "third-person", label: "Third-person", orbits: false },
];

/** `fogScale` keeps a far-back view from drowning in the fog a scene was tuned for up close. */
export type ViewShot = { position: Vec3; target: Vec3; fov: number | null; fogScale: number };

const EYE_HEIGHT = 2;

/**
 * A view of `focus` from `distance`. `fov` is null where the scene's own field of view
 * applies. Isometric narrows it, because a long lens approaches the flat isometric look.
 */
export function viewShot(view: CameraView, focus: Vec3, distance: number): ViewShot {
  const [x, y, z] = focus;
  const d = Math.max(distance, 4);
  switch (view) {
    case "top-down": return { position: [x, y + d * 1.4, z + 0.01], target: focus, fov: null, fogScale: 1 };
    case "isometric": {
      const far = d * 3; // Further back and much narrower, keeping the subject the same size.
      return { position: [x + far, y + far * 0.816, z + far], target: focus, fov: 12, fogScale: 0.1 };
    }
    case "first-person": return { position: [x, y + EYE_HEIGHT, z + d * 0.25], target: [x, y + EYE_HEIGHT, z - d], fov: null, fogScale: 1 };
    case "third-person": return { position: [x, y + d * 0.35, z + d * 0.7], target: [x, y + 1, z], fov: null, fogScale: 1 };
    default: return { position: [x + d * 0.6, y + d * 0.5, z + d * 0.8], target: focus, fov: null, fogScale: 1 };
  }
}

/** One frame of walking: where the camera goes for the keys held, facing `yaw`. */
export function walkStep(position: Vec3, yaw: number, keys: { forward: number; right: number; up: number }, speed: number, dt: number): Vec3 {
  const step = speed * dt;
  const sin = Math.sin(yaw), cos = Math.cos(yaw);
  return [
    position[0] + (-sin * keys.forward + cos * keys.right) * step,
    position[1] + keys.up * step,
    position[2] + (-cos * keys.forward - sin * keys.right) * step,
  ];
}
