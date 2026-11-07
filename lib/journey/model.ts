/**
 * The journey model: what the 3D scene and its HTML controls show.
 * Built on the server from the path; serialisable so it can cross into client components.
 */
import type { PathModel } from "../data";
import { PHASE_SHORT } from "../curriculum";
import { walkerT } from "./world";

export type StationState = "passed" | "current" | "ahead";

export type Station = {
  id: string; ord: number; title: string; short: string; landmark: string; months: [number, number];
  state: StationState; practised: number; total: number;
};

export type JourneyData = {
  stations: Station[];
  currentIndex: number | null; // null: all phases complete
  fraction: number;            // share of the current phase practised
  walkerT: number;             // path parameter of the walker
};

/** The landmark that stands for each phase (docs/JOURNEY.md §4). */
export const LANDMARK: Record<string, string> = {
  p1: "The Well", p2: "The Bridge", p3: "The Library", p4: "The Crossroads",
  p5: "The Watchtower", p6: "The Aqueduct", p7: "The Summit",
};

export function journeyFrom(path: PathModel): JourneyData {
  const ci = path.currentPhaseId ? path.phases.findIndex((p) => p.id === path.currentPhaseId) : null;
  const currentIndex = ci === -1 ? null : ci;
  const stations: Station[] = path.phases.map((p, i) => ({
    id: p.id, ord: p.ord, title: p.title, short: PHASE_SHORT[p.id] ?? p.title, landmark: LANDMARK[p.id] ?? `Station ${p.ord}`,
    months: p.months,
    state: currentIndex === null || i < currentIndex ? "passed" : i === currentIndex ? "current" : "ahead",
    practised: p.counts.practised, total: p.counts.total,
  }));
  const cur = currentIndex === null ? null : stations[currentIndex]!;
  const fraction = cur && cur.total > 0 ? cur.practised / cur.total : 0;
  return { stations, currentIndex, fraction, walkerT: walkerT(currentIndex, fraction) };
}
