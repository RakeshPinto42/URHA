/**
 * Frontispiece: the living picture that opens a section (docs/DESIGN.md §13). The
 * letterbox opens and the title rises in CSS, so a band needs no script to end visible;
 * the moving light is LivingPicture, drawn over the real painting.
 *  - "tall" and "medium" open a chapter; "compact" keeps a working screen close to its work.
 * The band recedes on scroll (CSS scroll timeline; static where unsupported).
 */
import { Fragment } from "react";
import { ART, type ArtId } from "@/lib/art";
import { SECTIONS, type Pane, type SectionId } from "@/lib/cinema";
import { LivingPicture } from "./cinema/LivingPicture";

const HEIGHT = {
  tall: "min-h-[440px] sm:min-h-[560px]",
  medium: "min-h-[340px] sm:min-h-[440px]",
  compact: "min-h-[280px] sm:min-h-[320px]",
};

export function FrontispieceBand({ art, section, panes, children, height = "medium", priority = true, showCaption = true }: {
  art: ArtId; section: SectionId; panes?: { pane: Pane; light: Pane }; children: React.ReactNode;
  height?: keyof typeof HEIGHT; priority?: boolean; showCaption?: boolean;
}) {
  const a = ART[art];
  const { pane, light } = panes ?? SECTIONS[section];
  return (
    <section className={`band relative isolate overflow-hidden lg:rounded-b-[28px] ${HEIGHT[height]}`}>
      <LivingPicture picture={a} shadow={pane.bright} light={light.bright} priority={priority} className="band__picture" />
      {/* Neutral, and only under the text, so the words keep AA contrast over a moving picture. */}
      <div aria-hidden="true" className="band__scrim absolute inset-0 -z-10" />
      <div aria-hidden="true" className="band__bar band__bar--top" />
      <div aria-hidden="true" className="band__bar band__bar--bottom" />
      <div className="band__copy mx-auto flex h-full min-h-[inherit] w-full max-w-column flex-col justify-end px-4 pb-7 pt-16 text-[#f7f7f5] sm:px-6 sm:pb-9">
        {children}
        {showCaption && <p className="mt-5 max-w-[60ch] text-[12px] text-[#f7f7f5]/80">{a.caption}</p>}
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
