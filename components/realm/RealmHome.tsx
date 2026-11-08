"use client";
/**
 * The Realm of Wisdom: the front door of URHA. Three gateways stand in a living world, and each
 * has a real link floating above it, so the keyboard, screen readers and a machine without
 * WebGL all reach the same three places. Choosing one flies the camera through its gateway.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DESTINATIONS, byId, focusShot, gateShots, gatesIn, plaqueOf, realmShot, type Destination, type DestinationId, type GateSpot } from "@/lib/realm/destinations";
import { useCinemaStill } from "../cinema/motion-pref";
import { Stage, type StageApi } from "./Stage";
import { ROOM_LIGHT, VEIL_MS, coverVeil } from "./veil";

export type RealmNext = { label: string; title: string; href: string } | null;

const FROM = "urha.realm.from";
const SEEN = "urha.realm.seen";

function take(key: string): string | null {
  try {
    const v = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    return v;
  } catch {
    return null;
  }
}

function firstVisit(): boolean {
  try {
    if (window.sessionStorage.getItem(SEEN)) return false;
    window.sessionStorage.setItem(SEEN, "1");
    return true;
  } catch {
    return false;
  }
}

export function RealmHome({ next }: { next: RealmNext }) {
  const router = useRouter();
  const still = useCinemaStill();
  const [hover, setHover] = useState<DestinationId | null>(null);
  const [leaving, setLeaving] = useState<DestinationId | null>(null);
  const api = useRef<StageApi | null>(null);
  const gates = useRef<GateSpot[]>([]);
  const panels = useRef<Partial<Record<DestinationId, HTMLElement | null>>>({});
  const anchors = useRef<{ id: DestinationId; center: THREE.Vector3; left: THREE.Vector3; right: THREE.Vector3 }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const v = useMemo(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] as const, []);
  /** Sets each name exactly on its plaque: the plaque's centre, its width on screen, and its tilt. */
  const project = useCallback((camera: THREE.PerspectiveCamera, size: { w: number; h: number }) => {
    const screen = (p: THREE.Vector3) => [(p.x * 0.5 + 0.5) * size.w, (-p.y * 0.5 + 0.5) * size.h] as const;
    for (const { id, center, left, right } of anchors.current) {
      const el = panels.current[id];
      if (!el) continue;
      v[0].copy(center).project(camera);
      v[1].copy(left).project(camera);
      v[2].copy(right).project(camera);
      const [x, y] = screen(v[0]), [lx, ly] = screen(v[1]), [rx, ry] = screen(v[2]);
      el.style.setProperty("--x", `${x.toFixed(1)}px`);
      el.style.setProperty("--y", `${y.toFixed(1)}px`);
      el.style.setProperty("--w", `${Math.hypot(rx - lx, ry - ly).toFixed(1)}px`);
      el.style.setProperty("--a", `${Math.atan2(ry - ly, rx - lx).toFixed(4)}rad`);
      el.style.opacity = v[0].z < 1 ? "1" : "0";
    }
  }, [v]);

  const focus = useCallback((id: DestinationId | null) => {
    setHover(id);
    const a = api.current;
    if (!a || leaving) return;
    a.runtime.setState({ hoveredGate: id });
    const g = gates.current.find((x) => x.id === id);
    a.runtime.shot(g ? focusShot(g, a.aspect()) : realmShot(a.aspect()), { speed: 1 });
  }, [leaving]);

  /** Through the gateway: the camera approaches, the arch floods with light, the veil falls. */
  const enter = useCallback((d: Destination) => {
    const a = api.current;
    const g = gates.current.find((x) => x.id === d.id);
    try { window.sessionStorage.setItem(FROM, d.id); } catch { /* the return flight is only a nicety */ }
    if (!a || !g || still) { router.push(d.href); return; }
    setLeaving(d.id);
    a.runtime.setState({ selectedGate: d.id, hoveredGate: null });
    const shots = gateShots(g);
    a.runtime.shot(shots.near, { speed: 1.5 });
    timers.current.push(setTimeout(() => a.runtime.shot(shots.through, { speed: 2.1 }), 820));
    timers.current.push(setTimeout(() => coverVeil(ROOM_LIGHT[d.room]!), 1250));
    timers.current.push(setTimeout(() => router.push(d.href), 1250 + VEIL_MS));
  }, [router, still]);

  const opening = useCallback((a: StageApi) => {
    gates.current = gatesIn(a.scene);
    anchors.current = gates.current.map((g) => {
      const p = plaqueOf(g);
      return { id: g.id, center: new THREE.Vector3(...p.center), left: new THREE.Vector3(...p.left), right: new THREE.Vector3(...p.right) };
    });
    const rest = realmShot(a.aspect());
    const from = byId(take(FROM) ?? "");
    const back = from ? gates.current.find((g) => g.id === from.id) : null;
    if (still) { a.runtime.shot(rest, { cut: true }); return; }
    if (back) {
      a.runtime.shot(gateShots(back).near, { cut: true });
      a.runtime.shot(rest, { speed: 0.8 });
    } else if (firstVisit()) {
      a.runtime.shot({ position: [0, 210, 860], target: [0, 120, 0] }, { cut: true });
      a.runtime.shot(rest, { speed: 0.42 });
      a.runtime.play("dawn");
    } else a.runtime.shot(rest, { cut: true });
  }, [still]);

  // The world leans a little towards the pointer.
  useEffect(() => {
    if (still) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      api.current?.runtime.setLean((e.clientX / window.innerWidth - 0.5) * 7, -(e.clientY / window.innerHeight - 0.5) * 3.2);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [still]);

  return (
    <div className={`realm-home relative h-[100svh] min-h-[560px] overflow-hidden bg-[#1b1a4a] ${leaving ? "is-leaving" : ""}`}>
      <Stage sceneId="realm" poster="/cinema/posters/realm.webp" className="absolute inset-0"
        label="A floating marble palace above the clouds, with a golden tree at its centre and three gateways before it."
        opening={opening} onFrame={project} onReady={(a) => { api.current = a; }}
        onHover={(id) => focus(id as DestinationId | null)}
        onPick={(id) => { const d = byId(id); if (d) enter(d); }} />
      <div aria-hidden="true" className="realm-home__shade pointer-events-none absolute inset-0" />

      <div className="realm-title pointer-events-none absolute inset-x-0 top-[72px] z-10 px-4 text-center sm:top-[84px]">
        <h1 className="sr-only">URHA, the eternal realm of knowledge</h1>
        <p className="font-display text-[15px] tracking-[0.04em] text-white/95 sm:text-[17px]">Seek Knowledge. Discover Wisdom. Achieve Mastery.</p>
      </div>

      <nav aria-label="Destinations" className="realm-gates absolute inset-0 z-20">
        {DESTINATIONS.map((d) => (
          <Link key={d.id} href={d.href} ref={(el) => { panels.current[d.id] = el; }}
            data-destination={d.id} data-active={hover === d.id || undefined}
            className="gate-panel" onPointerEnter={() => focus(d.id)} onPointerLeave={() => focus(null)} onFocus={() => focus(d.id)} onBlur={() => focus(null)}
            onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); enter(d); }}>
            <span className="gate-panel__plate">
              <span className="gate-panel__name">{d.name}</span>
              <span className="gate-panel__place">{d.place}</span>
            </span>
            <span className="gate-panel__purpose">{d.purpose}</span>
          </Link>
        ))}
      </nav>

      {next && (
        <p className="realm-next absolute bottom-4 left-1/2 z-20 w-[min(92vw,620px)] -translate-x-1/2 text-center text-[14px] text-white">
          <span className="text-white/80">{next.label}</span>{" "}
          <Link href={next.href} className="underline decoration-white/50 underline-offset-4 hover:decoration-white">{next.title}</Link>
        </p>
      )}
    </div>
  );
}
