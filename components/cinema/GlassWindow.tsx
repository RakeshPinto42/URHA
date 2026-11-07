"use client";
/**
 * The window: seven lancets of stained glass, one per phase, each filled to the share
 * of its subtopics you have practised. The colour is the data. An unfilled pane stays
 * dark glass, so nothing here claims progress that has not been made. When the window
 * scrolls into view the panes rise and fill, once.
 */
import Link from "next/link";
import { useRef } from "react";
import { paneAt } from "@/lib/cinema";
import type { Station } from "@/lib/journey/model";
import { gsap, useGSAP } from "./gsap";
import { useCinemaStill } from "./motion-pref";

const STATE = { passed: "Passed", current: "You are here", ahead: "Ahead" } as const;

export function GlassWindow({ stations }: { stations: Station[] }) {
  const root = useRef<HTMLOListElement>(null);
  const still = useCinemaStill();

  useGSAP(() => {
    if (still) return;
    const trigger = { trigger: root.current, start: "top 88%", once: true };
    // fromTo with stated ends: the resting place must never depend on where a pane was caught.
    gsap.fromTo(".lancet__frame", { yPercent: 16, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "expo.out", stagger: 0.07, scrollTrigger: { ...trigger } });
    gsap.fromTo(".lancet__fill", { scaleY: 0 }, {
      scaleY: (_: number, el: HTMLElement) => Number(el.dataset.ratio ?? 0),
      duration: 1.2, ease: "power3.out", stagger: 0.07, delay: 0.25, scrollTrigger: { ...trigger },
    });
  }, { scope: root, dependencies: [still], revertOnUpdate: true });

  return (
    <ol ref={root} aria-label="Progress through the seven phases" className="glass-window grid grid-cols-7 gap-1.5 sm:gap-3">
      {stations.map((s, i) => {
        const pane = paneAt(i);
        const ratio = s.total > 0 ? s.practised / s.total : 0;
        return (
          <li key={s.id} className="min-w-0">
            <Link href={`/path?phase=${s.id}`} className="lancet group block" data-state={s.state}
              aria-label={`${s.landmark}, phase ${s.ord}: ${STATE[s.state]}, ${s.practised} of ${s.total} subtopics practised`}
              style={{ "--pane": pane.bright } as React.CSSProperties}>
              <span aria-hidden="true" className="lancet__frame">
                <span className="lancet__fill" data-ratio={ratio} style={{ transform: `scaleY(${ratio})` }} />
                <span className="lancet__leading" />
                <span className="lancet__sheen" />
              </span>
              <span aria-hidden="true" className="mt-2 block truncate text-center text-[13px] font-medium text-[#f7f7f5] sm:text-left">
                <span className="num sm:hidden">{s.ord}</span>
                <span className="hidden sm:inline">{s.landmark}</span>
              </span>
              <span aria-hidden="true" className="num hidden text-[12px] text-[#f7f7f5]/75 sm:block">{s.practised} of {s.total}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
