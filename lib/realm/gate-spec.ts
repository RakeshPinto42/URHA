/**
 * The measurements of the three gateways that more than one place needs: the 3D generator draws
 * the lapis plaque here, and the Realm page sets each destination's name on exactly that plaque.
 * Pure numbers, local to the gateway (y up, z towards the viewer), so both sides agree.
 */
import type { DestinationId } from "./destinations";

export type GateSpec = {
  /** Height of the opening's crown, which the camera uses to frame the gateway. */
  height: number;
  /** The inscription plaque: centre and size, on the gateway's face. */
  plaque: { x: number; y: number; z: number; width: number; height: number };
};

export const GATE_SPEC: Record<DestinationId, GateSpec> = {
  career: { height: 62, plaque: { x: 0, y: 72.5, z: 7.1, width: 44, height: 10 } },
  stocks: { height: 56, plaque: { x: 0, y: 4.8, z: 22, width: 40, height: 7.6 } },
  academy: { height: 58, plaque: { x: 0, y: 58.6, z: 8.6, width: 40, height: 9 } },
};
