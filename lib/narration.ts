/**
 * Human narration (Winfred W. Henson, World English Bible) via eBible.org, streamed.
 * Index: data/audio/henson-web.json (scripts/build-narration-index.mjs).
 *
 * Recordings are per chapter. For a passage that starts mid-chapter, the start time is
 * ESTIMATED from the verse's character position within the full chapter text
 * (data/scripture/chapters-web.json) and always labelled as an estimate; the listener
 * can adjust and save their own start point.
 */
import henson from "@/data/audio/henson-web.json";
import chaptersWeb from "@/data/scripture/chapters-web.json";

export const NARRATOR = {
  name: henson.narrator,
  translation: henson.translation,
  source: henson.source,
  terms: henson.terms,
  description: "Professional voice artist; complete World English Bible, one recording per chapter.",
};

export type Book = { book: string; chapters: number };
export const BOOKS: Book[] = henson.books.map((b) => ({ book: b.book, chapters: b.chapters.length }));
const BY_BOOK = new Map(henson.books.map((b) => [b.book.toLowerCase(), b]));

/** "psalm" → "Psalms", "1 corinthians" → "1 Corinthians". Returns null if unknown. */
export function canonicalBook(name: string): string | null {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  const key = n === "psalm" ? "psalms" : n === "revelations" ? "revelation" : n;
  return BY_BOOK.get(key)?.book ?? null;
}

export function chapterAudio(book: string, chapter: number): string | null {
  const b = BY_BOOK.get(book.toLowerCase());
  if (!b || !Number.isInteger(chapter) || chapter < 1) return null;
  return b.chapters[chapter - 1] ?? null;
}

export type PassageAudio = {
  url: string;
  book: string;
  chapter: number;
  startVerse: number | null; // null: the passage is the whole chapter
  /** Fraction (0–1) of the chapter's text before the passage; null if whole chapter or unknown. */
  startFraction: number | null;
  endFraction: number | null;
};

/** Parse a passage query such as "matthew 14:22-33", "psalm 23" or "1 kings 19:9-13". */
export function parseQuery(query: string): { book: string; chapter: number; from: number | null; to: number | null } | null {
  const m = query.trim().match(/^(.+?)\s(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!m) return null;
  const book = canonicalBook(m[1]!);
  if (!book) return null;
  const from = m[3] ? Number(m[3]) : null;
  return { book, chapter: Number(m[2]), from, to: m[4] ? Number(m[4]) : from };
}

const CHAPTERS = chaptersWeb as Record<string, { verse: number; chars: number }[]>;

export function passageAudio(query: string): PassageAudio | null {
  const q = parseQuery(query);
  if (!q) return null;
  const url = chapterAudio(q.book, q.chapter);
  if (!url) return null;
  if (q.from === null) return { url, book: q.book, chapter: q.chapter, startVerse: null, startFraction: null, endFraction: null };
  const key = query.trim().toLowerCase().match(/^(.+?\s\d+):/)?.[1] ?? "";
  const verses = CHAPTERS[key];
  if (!verses) return { url, book: q.book, chapter: q.chapter, startVerse: q.from, startFraction: null, endFraction: null };
  const total = verses.reduce((n, v) => n + v.chars, 0);
  const before = verses.filter((v) => v.verse < q.from!).reduce((n, v) => n + v.chars, 0);
  const through = verses.filter((v) => v.verse <= (q.to ?? q.from!)).reduce((n, v) => n + v.chars, 0);
  return { url, book: q.book, chapter: q.chapter, startVerse: q.from, startFraction: total ? before / total : null, endFraction: total ? through / total : null };
}
