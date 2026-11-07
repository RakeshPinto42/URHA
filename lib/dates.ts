/** Date helpers on local calendar dates as "YYYY-MM-DD" strings (no time zones in storage). */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(v: unknown): v is string {
  if (typeof v !== "string" || !ISO.test(v)) return false;
  const d = new Date(`${v}T00:00:00`);
  return !Number.isNaN(d.getTime()) && toIso(d) === v;
}

export function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(now: Date = new Date()): string {
  return toIso(now);
}

export function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/** Monday of the ISO week containing `iso`. */
export function weekStart(iso: string): string {
  const d = parse(iso);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return toIso(d);
}

export function weekDays(iso: string): string[] {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * 1-based roadmap month for `on`, given a start date. Month 1 begins on the
 * start date; each month boundary falls on the same day-of-month.
 * Returns 0 before the start date.
 */
export function roadmapMonth(start: string, on: string): number {
  if (on < start) return 0;
  const s = parse(start);
  const o = parse(on);
  let months = (o.getFullYear() - s.getFullYear()) * 12 + (o.getMonth() - s.getMonth());
  if (o.getDate() < s.getDate()) months -= 1;
  return months + 1;
}

/** First day of a 1-based roadmap month. */
export function monthStartDate(start: string, month: number): string {
  const s = parse(start);
  const d = new Date(s.getFullYear(), s.getMonth() + (month - 1), s.getDate());
  // Clamp overflow (e.g. 31 Jan + 1 month) to the last day of the target month.
  if (d.getDate() !== s.getDate()) d.setDate(0);
  return toIso(d);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function shortMonth(iso: string): string {
  const d = parse(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function longDate(iso: string): string {
  const d = parse(iso);
  return `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function relativeDay(iso: string, ref: string): string {
  if (iso === ref) return "Today";
  if (iso === addDays(ref, 1)) return "Tomorrow";
  if (iso === addDays(ref, -1)) return "Yesterday";
  return longDate(iso);
}

export function formatMinutes(min: number): string {
  if (min <= 0) return "0 m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} m`;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** SQLite `datetime('now')` values are UTC without a zone ("2026-11-01 21:13:05"); show them in local time. */
export function localStamp(sqlUtc: string): { date: string; time: string } {
  const d = new Date(`${sqlUtc.replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return { date: sqlUtc.slice(0, 10), time: "" };
  return { date: toIso(d), time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
}

/** The local calendar day of a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS"). */
export const localDay = (utc: string) => toIso(new Date(`${utc.replace(" ", "T")}Z`));
