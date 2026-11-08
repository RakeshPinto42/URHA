/**
 * Frontispiece: the band that opens a working page. Inside a destination it is the live world
 * itself, seen from this page's own place along the destination's path; elsewhere it is a still
 * of the Realm. The page's heading and words sit in it either way.
 */
import { Fragment } from "react";
import { DESTINATIONS, type DestinationId } from "@/lib/realm/destinations";
import type { SectionId } from "@/lib/cinema";
import { RoomHero } from "./realm/RoomHero";

const HEIGHT = {
  tall: "min-h-[440px] sm:min-h-[560px]",
  medium: "min-h-[340px] sm:min-h-[440px]",
  compact: "min-h-[300px] sm:min-h-[340px]",
};

/** Each working page's place in its destination: how far along the walk, the circle or the pool. */
const PLACE: Partial<Record<SectionId, { destination: DestinationId; start: number }>> = {
  today: { destination: "career", start: 0.15 }, path: { destination: "career", start: 0.25 },
  skills: { destination: "career", start: 0.45 }, tasks: { destination: "career", start: 0.65 }, career: { destination: "career", start: 0.3 },
  discovery: { destination: "stocks", start: 0.5 },
  academy: { destination: "academy", start: 0.3 }, assessments: { destination: "academy", start: 0.55 }, projects: { destination: "academy", start: 0.8 },
};

export function FrontispieceBand({ section, children, height = "medium", start }: { section: SectionId; children: React.ReactNode; height?: keyof typeof HEIGHT; start?: number }) {
  const place = PLACE[section];
  if (place) {
    const d = DESTINATIONS.find((x) => x.id === place.destination)!;
    return (
      <RoomHero destination={place.destination} variant="band" start={start ?? place.start}
        label={`${d.place}, seen from this page.`}>
        <div className={`band__copy flex flex-col justify-end ${HEIGHT[height]}`}>{children}</div>
      </RoomHero>
    );
  }
  return (
    <section className={`band relative isolate overflow-hidden ${HEIGHT[height]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cinema/posters/realm.webp" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div aria-hidden="true" className="band__scrim absolute inset-0 -z-10" />
      <div className="band__copy mx-auto flex h-full min-h-[inherit] w-full max-w-column flex-col justify-end px-4 pb-7 pt-20 text-[#f7f7f5] sm:px-6 sm:pb-9">
        {children}
      </div>
    </section>
  );
}

/** A title whose words rise out of a mask one after another. Real text, in CSS. */
export function RisingTitle({ text, id, className = "" }: { text: string; id?: string; className?: string }) {
  return (
    <h1 id={id} className={`rising ${className}`}>
      {text.split(" ").map((word, i) => (
        <Fragment key={`${word}${i}`}>
          <span className="rising__mask">
            <span className="rising__word" style={{ "--i": i } as React.CSSProperties}>{word}</span>
          </span>{" "}
        </Fragment>
      ))}
    </h1>
  );
}
