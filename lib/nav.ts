/** Primary navigation (PRD §4). `release: 2` tags a section that is not built yet; it still routes to an honest page. */
export type NavItem = { href: string; label: string; release: 1 | 2; icon: IconName };
export type IconName = "home" | "path" | "academy" | "tasks" | "skills" | "projects" | "assess" | "journal" | "meditation" | "insights" | "settings" | "backup" | "credits";

export const NAV: NavItem[] = [
  { href: "/", label: "Home", release: 1, icon: "home" },
  { href: "/path", label: "My Path", release: 1, icon: "path" },
  { href: "/academy", label: "Academy", release: 1, icon: "academy" },
  { href: "/tasks", label: "My Tasks", release: 1, icon: "tasks" },
  { href: "/skills", label: "Skills", release: 1, icon: "skills" },
  { href: "/projects", label: "Projects", release: 1, icon: "projects" },
  { href: "/assessments", label: "Assessments", release: 1, icon: "assess" },
  { href: "/journal", label: "Journal", release: 2, icon: "journal" },
  { href: "/meditation", label: "Meditation", release: 1, icon: "meditation" },
  { href: "/insights", label: "Insights", release: 2, icon: "insights" },
];

export const UTILITY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", release: 1, icon: "settings" },
  { href: "/credits", label: "Sources and credits", release: 1, icon: "credits" },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
