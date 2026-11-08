/**
 * What the Studio can open: both worlds' parts, and sample progress so a scene that reads real
 * data can be edited on its own. Sample values stay in the Studio and never reach the app.
 */
import type { Generators } from "@/lib/cinema-engine/runtime";
import { paneAt } from "@/lib/cinema";
import { LANDMARK, type JourneyData } from "@/lib/journey/model";
import { JOURNEY_GENERATORS } from "@/lib/journey/scene-objects";
import { STATION_AT } from "@/lib/journey/world";
import { REALM_GENERATORS } from "@/lib/realm/generators";
import type { RoomData } from "@/lib/realm/rooms";

export const ALL_GENERATORS: Generators = { ...JOURNEY_GENERATORS, ...REALM_GENERATORS };

const STATES = ["passed", "current", "ahead", "ahead", "ahead", "ahead"] as const;

export const SAMPLE_DATA: JourneyData & RoomData = {
  currentIndex: 1, fraction: 0.4, walkerT: 0.2,
  stations: STATION_AT.map((_, i) => ({
    id: `p${i + 1}`, ord: i + 1, title: `Phase ${i + 1}`, short: `Phase ${i + 1}`, landmark: LANDMARK[`p${i + 1}`] ?? "", months: [1, 2],
    state: STATES[i]!, practised: 0, total: 1,
  })),
  phases: STATES.map((state, i) => ({ id: `p${i + 1}`, title: `Phase ${i + 1}`, state, color: paneAt(i).bright })),
  disciplines: ["pandas", "sql", "python", "data", "finance", "ai"].map((id, i) => ({ id, title: id, share: (i + 1) / 7, color: paneAt(i + 2).bright })),
  stars: Array.from({ length: 60 }, (_, i) => ({ score: 30 + (i * 7) % 60, watched: i % 11 === 0 })),
};

/** Parts offered under Add, for building new realm scenes. */
export const REALM_PARTS = Object.keys(REALM_GENERATORS).filter((g) => !["primitive", "particles", "model"].includes(g)).sort();
