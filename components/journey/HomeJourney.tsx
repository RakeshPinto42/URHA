"use client";
/**
 * Home — The Journey. The scene stands behind the walker, looking up the path to the
 * next station. Choosing a station (in the scene or the list) opens it on My Path.
 *
 * The sunrise plays once per visit, so returning to Home does not hold anyone up, and
 * the words are readable from its first frame. "Replay the sunrise" plays it again.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Journey } from "./Journey";
import { useCinemaStill } from "../cinema/motion-pref";
import type { JourneyData } from "@/lib/journey/model";

const SEEN = "urha.sunrise";

function firstThisVisit(): boolean {
  try {
    if (window.sessionStorage.getItem(SEEN)) return false;
    window.sessionStorage.setItem(SEEN, "1");
    return true;
  } catch {
    return false; // Storage blocked: skip the sequence rather than replay it on every visit.
  }
}

export function HomeJourney({ data, fallback }: { data: JourneyData; fallback: React.ReactNode }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [sequence, setSequence] = useState(0);
  const still = useCinemaStill();

  useEffect(() => {
    if (firstThisVisit()) setSequence(1);
  }, []);

  return (
    <>
      <Journey data={data} mode={{ kind: "walker" }} hoveredId={hover} onHover={setHover} sequence={sequence}
        onSelect={(id) => router.push(`/path?phase=${id}`)}
        fallback={fallback} className="h-full w-full" />
      {!still && (
        <button type="button" onClick={() => setSequence((n) => n + 1)}
          className="btn absolute bottom-4 right-4 z-10 min-h-[36px] bg-[#0b0a09]/60 text-[13px] text-white hover:bg-[#0b0a09]/80">
          Replay the sunrise
        </button>
      )}
    </>
  );
}
