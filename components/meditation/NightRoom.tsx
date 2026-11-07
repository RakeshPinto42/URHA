/**
 * The Quiet Room frame: night tokens, a minimal bar, no dashboard chrome.
 * Entering crossfades from the daylight ground (700ms) using CSS animations so it
 * runs without JavaScript and ends visible even if scripts fail; the global
 * reduced-motion rule makes it instant.
 */
import Link from "next/link";
import { Icon } from "../Icon";
import { MotionToggle } from "../cinema/motion-pref";

export function NightRoom({ children, back, title }: { children: React.ReactNode; back: { href: string; label: string }; title?: string }) {
  return (
    <div className="night min-h-screen bg-ground text-ink">
      <div aria-hidden="true" className="night-veil pointer-events-none fixed inset-0 z-50 bg-white" />
      <a href="#room" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn btn-primary">Skip to content</a>
      <header className="mx-auto flex h-14 w-full max-w-column items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={back.href} className="-ml-2 inline-flex h-11 items-center gap-2 rounded-full px-2 text-[14px] text-muted hover:text-ink">
          <span aria-hidden="true">←</span> {back.label}
        </Link>
        {title && <span className="truncate text-[13px] text-muted">{title}</span>}
        <MotionToggle className="ml-auto inline-flex h-11 items-center gap-2 rounded-full px-2 text-[13px] text-muted hover:text-ink aria-pressed:text-ink" />
        <span className="flex items-baseline gap-2" aria-label="URHA">
          <span lang="syc" dir="rtl" className="font-syriac text-[18px] leading-none text-accent" aria-hidden="true">ܐܘܪܚܐ</span>
          <Icon name="meditation" className="text-muted" />
        </span>
      </header>
      <main id="room" className="night-rise">{children}</main>
    </div>
  );
}
