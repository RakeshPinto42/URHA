"use client";
/**
 * A destination's world, behind its whole working page. The opening fills the screen; as the
 * page scrolls, the camera moves through the place (down the nave, round the instrument, along
 * the pool), and the working page rides over it on a sheet of the room's own daylight.
 *
 * Cost: the world animates only while the opening is in view. Below that, the loop stops and a
 * frame is drawn only when the scroll moves the camera, so reading the page costs no GPU.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { byId, roomShot, type DestinationId } from "@/lib/realm/destinations";
import { useCinemaStill } from "../cinema/motion-pref";
import { Stage, type StageApi } from "./Stage";
import type { RoomData } from "@/lib/realm/rooms";
import type { Vec3 } from "@/lib/cinema-engine/schema";

export function RoomHero({ destination, title, label, data, pickPrefix, children, variant = "hero", start = 0 }: {
  destination: DestinationId; title?: string; label: string; data?: RoomData;
  /** "band" opens a working page: shorter, at its own place in the world, with the page's own heading. */
  variant?: "hero" | "band";
  /** Where along the destination's path this page stands, 0 to 1. */
  start?: number;
  /** Choosing a real thing in the world goes to this address plus its id. */
  pickPrefix?: string;
  children?: React.ReactNode;
}) {
  const d = byId(destination)!;
  const router = useRouter();
  const still = useCinemaStill();
  const api = useRef<StageApi | null>(null);
  const [deep, setDeep] = useState(false);

  /** Where the camera stands for a scroll position: 0 is the opening, 1 the foot of the page. */
  const shotAt = useCallback((a: StageApi, s: number) => {
    const position = a.scene.camera.position ?? [0, 12, 60];
    const target = a.scene.camera.target ?? [0, 12, 0];
    return roomShot(destination, { position, target }, a.aspect(), Math.min(1, start + s * (1 - start) * 0.6));
  }, [destination, start]);

  const progress = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    return Math.min(Math.max(window.scrollY / max, 0), 1);
  };

  const opening = useCallback((a: StageApi) => {
    const rest = shotAt(a, progress());
    if (still) { a.runtime.shot(rest, { cut: true }); return; }
    // The glide begins inside the room, a little forward and to one side, then settles.
    const p = rest.position, t = rest.target;
    const dx = t[0] - p[0], dz = t[2] - p[2], len = Math.hypot(dx, dz) || 1;
    const start: Vec3 = [p[0] + 9, p[1] + 6, p[2] + (dz / len) * 14];
    a.runtime.shot({ position: start, target: t }, { cut: true });
    a.runtime.shot(rest, { speed: 0.7 });
  }, [still, shotAt]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const below = window.scrollY > window.innerHeight * 0.55;
      setDeep(below);
      const a = api.current;
      if (!a) return;
      // Above the fold the running loop glides there; below it each scroll draws one frame.
      a.runtime.shot(shotAt(a, progress()), below || still ? { cut: true } : { speed: 1.6 });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [shotAt, still]);

  return (
    <section aria-labelledby={variant === "hero" ? "room-title" : undefined} aria-label={variant === "band" ? d.place : undefined} data-room-hero={d.room} className={`room-hero relative isolate ${variant === "band" ? "room-hero--band" : ""}`}>
      <div className="room-hero__stage">
        <Stage sceneId={d.scene} poster={d.poster} label={label} className="absolute inset-0" data={data} opening={opening} paused={deep}
          onReady={(a) => { api.current = a; }}
          onPick={(id) => { if (pickPrefix) router.push(`${pickPrefix}${id}`); }} />
        <div aria-hidden="true" className={`room-hero__shade pointer-events-none absolute inset-0 ${deep ? "is-deep" : ""}`} />
      </div>
      <div className="room-hero__copy">
        {variant === "hero" ? (
          <>
            <p className="font-serif text-[20px] italic leading-tight text-white/90">{d.place}</p>
            <h1 id="room-title" className="font-display mt-1 text-[44px] leading-[1.02] tracking-[0.005em] text-white sm:text-[68px]">{title}</h1>
            {children}
          </>
        ) : children}
      </div>
    </section>
  );
}
