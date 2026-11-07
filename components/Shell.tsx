"use client";
/**
 * Open-plane shell (DESIGN §6): labelled sidebar on the page ground, one hairline,
 * no top bar on desktop. Below 900px the sidebar folds into a 48px bar whose menu
 * opens a full-screen sheet. The Meditation room hides the shell for focus.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NAV, UTILITY_NAV, isActive, type NavItem } from "@/lib/nav";
import { Icon } from "./Icon";
import { Wordmark } from "./Wordmark";
import { SECTIONS, sectionOf } from "@/lib/cinema";
import { GlassWipe } from "./cinema/GlassWipe";
import { MotionToggle } from "./cinema/motion-pref";

function NavLinks({ items, pathname, onNavigate, pill }: { items: NavItem[]; pathname: string; onNavigate?: () => void; pill: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const room = SECTIONS[sectionOf(item.href)].pane;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-[34px] items-center gap-2.5 rounded-lg px-3 text-[14px] transition-colors ${
                active ? "font-medium text-ink" : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {active && (
                <motion.span layoutId={pill} aria-hidden="true" className="absolute inset-0 rounded-lg bg-active"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}>
                  <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full" style={{ background: room.bright }} />
                </motion.span>
              )}
              <span className="relative flex" style={{ color: room.deep }}><Icon name={item.icon} /></span>
              <span className="relative flex-1 truncate">{item.label}</span>
              {item.release === 2 && <span className="relative text-[12px] text-muted">Release 2</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const immersive = pathname === "/meditation" || pathname.startsWith("/meditation/");

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const section = sectionOf(pathname);
  const room = SECTIONS[section].pane;

  if (immersive) return <><GlassWipe section={section} />{children}</>;

  const current = [...NAV, ...UTILITY_NAV].find((n) => isActive(pathname, n.href));

  return (
    <div className="room min-h-screen lg:grid lg:grid-cols-[232px_1fr]"
      style={{ "--section": room.bright, "--section-deep": room.deep } as React.CSSProperties}>
      <GlassWipe section={section} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn btn-primary">Skip to content</a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border px-3 py-6 lg:flex" aria-label="URHA">
        <Link href="/" className="mb-8 px-3" aria-label="URHA home"><Wordmark /></Link>
        <nav aria-label="Primary" className="flex-1"><NavLinks items={NAV} pathname={pathname} pill="nav-pill" /></nav>
        <nav aria-label="Utilities" className="mt-6"><NavLinks items={UTILITY_NAV} pathname={pathname} pill="nav-pill" /></nav>
        <MotionToggle className="mt-1 flex h-[34px] w-full items-center gap-2.5 rounded-lg px-3 text-[14px] text-muted hover:bg-surface hover:text-ink aria-pressed:text-ink" />
        <p className="mt-4 px-3 text-[12px] text-faint">NexEra 2.0 presents</p>
      </aside>

      {/* Phone / tablet bar */}
      <div className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-ground px-4 lg:hidden">
        <Link href="/" aria-label="URHA home"><Wordmark compact /></Link>
        <span className="text-[15px] font-medium">{current?.label ?? ""}</span>
        <button ref={menuButton} type="button" className="-mr-2 grid h-11 w-11 place-items-center" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(true)}>
          <Icon name="menu" size={20} />
          <span className="sr-only">Open menu</span>
        </button>
      </div>
      {open && (
        <div id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu" className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ground px-4 pb-8 lg:hidden">
          <div className="flex h-12 items-center justify-between">
            <Wordmark compact />
            <button type="button" className="-mr-2 grid h-11 w-11 place-items-center" onClick={() => { setOpen(false); menuButton.current?.focus(); }} autoFocus>
              <Icon name="close" size={20} />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Primary" className="mt-4 [&_a]:h-11 [&_a]:text-[16px]"><NavLinks items={NAV} pathname={pathname} pill="sheet-pill" onNavigate={() => setOpen(false)} /></nav>
          <nav aria-label="Utilities" className="mt-6 [&_a]:h-11 [&_a]:text-[16px]"><NavLinks items={UTILITY_NAV} pathname={pathname} pill="sheet-pill" onNavigate={() => setOpen(false)} /></nav>
          <MotionToggle className="mt-2 flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-[16px] text-muted aria-pressed:text-ink" />
        </div>
      )}

      <main id="main" className="min-w-0">{children}</main>
    </div>
  );
}
