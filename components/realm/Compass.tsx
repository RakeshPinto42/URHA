"use client";
/**
 * The persistent navigation: the Realm, three destinations, and a quiet menu for everything
 * else. It stays over every page. A move between destinations passes through the veil, and a
 * move inside one does not, because that is the same place.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DESTINATIONS, QUIET_PAGES, byId, destinationOf, type Destination } from "@/lib/realm/destinations";
import { Icon } from "../Icon";
import { Wordmark } from "../Wordmark";
import { MotionToggle, useCinemaStill } from "../cinema/motion-pref";
import { ROOM_LIGHT, VEIL_MS, coverVeil } from "./veil";

function useGo() {
  const router = useRouter();
  const still = useCinemaStill();
  return (e: React.MouseEvent, href: string, room: string) => {
    if (still || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    coverVeil(ROOM_LIGHT[room] ?? ROOM_LIGHT.marble!);
    setTimeout(() => router.push(href), VEIL_MS);
  };
}

export function Compass({ studio }: { studio: boolean }) {
  const pathname = usePathname();
  const current = destinationOf(pathname);
  const go = useGo();
  const [open, setOpen] = useState(false);
  // Reading comes first: the Compass steps aside while scrolling down, and returns on the way up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setTucked(y > last && y > 160);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && (sheet.current?.contains(e.target as Node) || button.current?.contains(e.target as Node))) return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [open]);

  const enter = (d: Destination, e: React.MouseEvent) => {
    if (current?.id === d.id) return;
    try {
      if (pathname === "/") window.sessionStorage.setItem("urha.realm.from", d.id);
    } catch { /* the return flight is only a nicety */ }
    go(e, d.href, d.room);
  };

  return (
    <header className={`compass ${pathname === "/" ? "compass--over" : ""} ${tucked && !open ? "compass--tucked" : ""}`}>
      <div className="compass__bar">
        <Link href="/" aria-label="URHA, return to the Realm" className="compass__mark"
          onClick={(e) => {
            if (pathname === "/") return;
            try { if (current) window.sessionStorage.setItem("urha.realm.from", current.id); } catch { /* as above */ }
            go(e, "/", "midnight");
          }}>
          <Wordmark compact />
        </Link>
        <nav aria-label="Primary" className="compass__destinations">
          {DESTINATIONS.map((d) => (
            <Link key={d.id} href={d.href} aria-current={current?.id === d.id ? "true" : undefined} data-room={d.room} className="compass__link" onClick={(e) => enter(d, e)}>
              {d.name}
            </Link>
          ))}
        </nav>
        <button ref={button} type="button" className="compass__more" aria-expanded={open} aria-controls="compass-menu" onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? "close" : "menu"} size={18} />
          <span className="sr-only">{open ? "Close the menu" : "More pages"}</span>
        </button>
      </div>
      {open && (
        <div id="compass-menu" ref={sheet} className="compass__sheet">
          <nav aria-label="More pages">
            <ul>
              {QUIET_PAGES.map((p) => <li key={p.href}><Link href={p.href} aria-current={pathname === p.href ? "page" : undefined}>{p.label}</Link></li>)}
              {studio && <li><a href="/studio">Environment editor</a></li>}
            </ul>
          </nav>
          <MotionToggle className="compass__motion" />
        </div>
      )}
    </header>
  );
}

/** The pages inside a destination. */
export function RoomTabs({ pathname }: { pathname: string }) {
  const d = destinationOf(pathname);
  if (!d || d.pages.length < 2) return null;
  const best = [...d.pages].sort((a, b) => b.href.length - a.href.length).find((p) => pathname === p.href || pathname.startsWith(`${p.href}/`));
  return (
    <nav aria-label={`${d.name} pages`} className="room-tabs">
      <ul>
        {d.pages.map((p) => <li key={p.href}><Link href={p.href} aria-current={best?.href === p.href ? "page" : undefined}>{p.label}</Link></li>)}
      </ul>
    </nav>
  );
}

export { byId };
