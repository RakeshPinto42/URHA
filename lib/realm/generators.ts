/** Everything a realm scene can be built from. The Studio offers exactly these. */
import type { Generators } from "@/lib/cinema-engine/runtime";
import { COMMON_GENERATORS } from "@/lib/cinema-engine/generators";
import { celestialSky, cloudSea, clouds, farPeaks, flock, lightShafts } from "./heavens";
import { disciplinePlinths, greatArmillary, hallNave, observatory, phaseBanners, quadrangle, telescope } from "./rooms";
import { treeOfKnowledge } from "./tree";
import { arcades, court, dais, gateway, lightPaths, mirrorFloor, palace, skyBridge, skyIsle } from "./world";

export const REALM_GENERATORS: Generators = {
  ...COMMON_GENERATORS,
  "celestial-sky": celestialSky, "cloud-sea": cloudSea, clouds, "light-shafts": lightShafts, "far-peaks": farPeaks, flock,
  court, dais, palace, arcades, gateway, "light-paths": lightPaths, "sky-isle": skyIsle, "sky-bridge": skyBridge, "mirror-floor": mirrorFloor,
  "tree-of-knowledge": treeOfKnowledge,
  "hall-nave": hallNave, "phase-banners": phaseBanners,
  observatory, "great-armillary": greatArmillary, telescope,
  quadrangle, "discipline-plinths": disciplinePlinths,
};
