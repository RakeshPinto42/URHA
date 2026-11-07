/**
 * On-demand chapter text for the Scripture reader. Public-domain WEB/KJV text from
 * bible-api.com, cached in SQLite after the first fetch so each chapter is requested once.
 * Server-only. Failures are returned as errors, never as invented text.
 */
import "server-only";
import { getCachedChapter, putCachedChapter } from "./data";
import type { Translation, Verse } from "./scripture";

const SOURCE = "https://bible-api.com";

export type ChapterResult = { ok: true; verses: Verse[]; source: string; fetchedAt: string } | { ok: false; error: string };

export async function loadChapter(book: string, chapter: number, t: Translation): Promise<ChapterResult> {
  const cached = getCachedChapter(t, book, chapter);
  if (cached) return { ok: true, verses: cached.verses.map((v) => ({ book, chapter, verse: v.verse, text: v.text })), source: cached.source, fetchedAt: cached.fetchedAt };
  try {
    const url = `${SOURCE}/${encodeURIComponent(`${book} ${chapter}`)}?translation=${t}`;
    const res = await fetch(url, { headers: { "User-Agent": "URHA/0.2 (personal study app)" }, signal: AbortSignal.timeout(12000), cache: "no-store" });
    if (res.status === 429) return { ok: false, error: "The scripture service is rate-limiting requests. Wait a minute and try again." };
    if (!res.ok) return { ok: false, error: `The scripture service answered ${res.status}.` };
    const body = (await res.json()) as { verses?: { chapter: number; verse: number; text: string }[] };
    const verses = (body.verses ?? []).filter((v) => v.chapter === chapter).map((v) => ({ verse: v.verse, text: String(v.text).replace(/\s+/g, " ").trim() }));
    if (!verses.length) return { ok: false, error: "No verses were returned for this chapter." };
    putCachedChapter(t, book, chapter, verses, SOURCE);
    return { ok: true, verses: verses.map((v) => ({ book, chapter, verse: v.verse, text: v.text })), source: SOURCE, fetchedAt: new Date().toISOString() };
  } catch {
    return { ok: false, error: "The chapter could not be fetched. Check the connection and try again." };
  }
}
