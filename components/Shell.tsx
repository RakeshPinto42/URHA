"use client";
/**
 * The frame of the whole application: the Compass over everything, and each destination's own
 * daylight on the pages inside it. The Meditation room and the Studio hide the frame for focus.
 */
import { usePathname } from "next/navigation";
import { SECTIONS, sectionOf } from "@/lib/cinema";
import { destinationOf } from "@/lib/realm/destinations";
import { Compass, RoomTabs } from "./realm/Compass";
import { Veil } from "./realm/veil";

/** Pages whose opening is a live world, which lifts the veil itself. */
const STAGES = ["/", "/career", "/discovery", "/academy"];
/** Working pages whose band is a live world. The veil waits for its first frame, or lifts itself. */
const LIVE = ["/skills", "/tasks", "/academy/", "/assessments", "/projects", "/discovery/"];

export function Shell({ children, studio }: { children: React.ReactNode; studio: boolean }) {
  const pathname = usePathname();
  const immersive = pathname === "/meditation" || pathname.startsWith("/meditation/") || pathname === "/studio";
  const stage = STAGES.includes(pathname) || LIVE.some((p) => pathname === p || pathname.startsWith(p));
  const veil = <Veil pathname={pathname} hasStage={stage} />;

  if (immersive) return <>{veil}{children}</>;

  const room = SECTIONS[sectionOf(pathname)].pane;
  const destination = destinationOf(pathname);
  return (
    <div className={`room min-h-screen ${destination ? `room--${destination.room}` : ""}`}
      style={destination ? undefined : ({ "--section": room.bright, "--section-deep": room.deep } as React.CSSProperties)}>
      {veil}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn btn-primary">Skip to content</a>
      <Compass studio={studio} />
      <main id="main" className="min-w-0"><RoomTabs pathname={pathname} />{children}</main>
    </div>
  );
}
