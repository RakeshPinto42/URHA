"use client";
/**
 * The cut between sections: seven panes of glass stand over the new page and lift away.
 * It starts before the page paints, so the new page is revealed rather than covered,
 * and it never takes input. It runs only when the section changes, not on every link
 * inside one, and not on first load.
 */
import { useLayoutEffect, useRef } from "react";
import { GLASS } from "@/lib/cinema";
import { gsap } from "./gsap";
import { useCinemaStill } from "./motion-pref";

export function GlassWipe({ section }: { section: string }) {
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef(section);
  const still = useCinemaStill();

  useLayoutEffect(() => {
    if (previous.current === section) return;
    previous.current = section;
    const el = root.current;
    if (!el || still) return;
    const panes = Array.from(el.children);
    const tl = gsap.timeline({ onComplete: () => gsap.set(el, { autoAlpha: 0 }) });
    tl.set(el, { autoAlpha: 1 })
      .fromTo(panes, { scaleY: 1 }, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.5, ease: "expo.inOut", stagger: 0.04 });
    return () => { tl.kill(); gsap.set(el, { autoAlpha: 0 }); };
  }, [section, still]);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none invisible fixed inset-0 z-[60] flex opacity-0">
      {GLASS.map((p) => <div key={p.name} className="h-full flex-1" style={{ background: p.bright }} />)}
    </div>
  );
}
