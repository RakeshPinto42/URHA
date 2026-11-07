import type { IconName } from "@/lib/nav";

/** One outline icon set, 16px, 1.5px stroke (DESIGN §9). Decorative: always aria-hidden. */
const PATHS: Record<IconName | "menu" | "close" | "play" | "pause" | "prev" | "next" | "bookmark" | "bookmarked" | "external" | "check" | "plus", string> = {
  home: "M3 10.5 12 3l9 7.5V21H3z M9 21v-6h6v6",
  path: "M4 20c4-1 4-6 8-8s4-7 8-8 M4 20h.01 M20 4h.01",
  academy: "M4 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z M20 5h-6 M20 5v13h-6",
  tasks: "M9 6h11 M9 12h11 M9 18h11 M4 6l1 1 2-2 M4 12l1 1 2-2 M4 18l1 1 2-2",
  skills: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  projects: "M3 7h7l2 2h9v11H3z",
  assess: "M9 11l3 3 8-8 M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
  journal: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h4",
  meditation: "M12 3c-4 4-4 10 0 18 4-8 4-14 0-18z M3 14c3 0 6 2 9 7 3-5 6-7 9-7",
  insights: "M3 20h18 M6 16l4-5 3 3 5-7",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12l2-1-1-3-2 .2-1.3-1.5.2-2-3-1-1 2h-2l-1-2-3 1 .2 2L5 8.2 3 8l-1 3 2 1v0l-2 1 1 3 2-.2 1.3 1.5-.2 2 3 1 1-2h2l1 2 3-1-.2-2 1.3-1.5 2 .2 1-3z",
  backup: "M12 3v12 M7 10l5 5 5-5 M4 21h16",
  credits: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8h.01 M11 12h1v5h1",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  close: "M6 6l12 12 M18 6 6 18",
  play: "M7 4l13 8-13 8z",
  pause: "M7 4h4v16H7z M13 4h4v16h-4z",
  prev: "M18 5 9 12l9 7z M6 5v14",
  next: "M6 5l9 7-9 7z M18 5v14",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  bookmarked: "M6 3h12v18l-6-4-6 4z",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
  check: "M5 12l5 5 9-10",
  plus: "M12 5v14 M5 12h14",
};

export function Icon({ name, size = 16, className = "" }: { name: keyof typeof PATHS; size?: number; className?: string }) {
  const filled = name === "bookmarked" || name === "play" || name === "pause";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`flex-none ${className}`}>
      <path d={PATHS[name]} />
    </svg>
  );
}
