import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { BOOKS, NARRATOR, canonicalBook, chapterAudio } from "@/lib/narration";
import { isTranslation, TRANSLATIONS, type Translation } from "@/lib/scripture";
import { getBookmarks, getListening } from "@/lib/data";
import { loadChapter } from "@/lib/reader";
import { NightRoom } from "@/components/meditation/NightRoom";
import { PassageReader } from "@/components/meditation/Player";
import { BookmarkButton } from "@/components/meditation/PassageForms";

type Props = { params: Promise<{ book: string; chapter: string }>; searchParams: Promise<{ t?: string }> };

function resolve(bookParam: string, chapterParam: string) {
  const book = canonicalBook(decodeURIComponent(bookParam));
  const chapter = Number(chapterParam);
  const meta = BOOKS.find((b) => b.book === book);
  if (!book || !meta || !Number.isInteger(chapter) || chapter < 1 || chapter > meta.chapters) return null;
  return { book, chapter, total: meta.chapters };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const r = resolve(p.book, p.chapter);
  return { title: r ? `${r.book} ${r.chapter}` : "Chapter" };
}

export default async function ChapterPage({ params, searchParams }: Props) {
  await connection();
  const p = await params;
  const sp = await searchParams;
  const r = resolve(p.book, p.chapter);
  if (!r) notFound();
  const translation: Translation = isTranslation(sp.t) ? sp.t : "web";
  const tMeta = TRANSLATIONS.find((t) => t.id === translation)!;
  const target = `read:${r.book}:${r.chapter}`;
  const listening = getListening().find((l) => l.passageId === target);
  const text = await loadChapter(r.book, r.chapter, translation);
  const audioUrl = chapterAudio(r.book, r.chapter);
  const bookIdx = BOOKS.findIndex((b) => b.book === r.book);
  const prev = r.chapter > 1 ? { book: r.book, ch: r.chapter - 1 } : bookIdx > 0 ? { book: BOOKS[bookIdx - 1]!.book, ch: BOOKS[bookIdx - 1]!.chapters } : null;
  const next = r.chapter < r.total ? { book: r.book, ch: r.chapter + 1 } : bookIdx < BOOKS.length - 1 ? { book: BOOKS[bookIdx + 1]!.book, ch: 1 } : null;
  const href = (b: string, c: number) => `/meditation/read/${encodeURIComponent(b)}/${c}?t=${translation}`;

  return (
    <NightRoom back={{ href: "/meditation/read", label: "All books" }} title={`${r.book} ${r.chapter}`}>
      <div className="mx-auto w-full max-w-column px-4 pb-32 sm:px-6">
        <header className="flex flex-col gap-6 pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between lg:pt-14">
          <div>
            <h1 className="font-serif text-[44px] leading-none sm:text-[60px]">{r.book} {r.chapter}</h1>
            <p className="mt-3 text-[14px] text-muted">{tMeta.name} · {tMeta.note}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Translation" className="flex gap-1 rounded-full bg-surface p-1">
              {TRANSLATIONS.map((t) => (
                <Link key={t.id} href={`/meditation/read/${encodeURIComponent(r.book)}/${r.chapter}?t=${t.id}`} aria-current={t.id === translation ? "true" : undefined}
                  className={`flex h-9 items-center rounded-full px-4 text-[13px] ${t.id === translation ? "bg-active text-ink" : "text-muted hover:text-ink"}`}>{t.short}</Link>
              ))}
            </nav>
            <BookmarkButton passageId={target} on={getBookmarks().has(target)} />
          </div>
        </header>

        {!text.ok ? (
          <div role="alert" className="max-w-[60ch] rounded-[12px] bg-[var(--warning-bg)] px-4 py-3 text-[14px] text-warning">
            {text.error} <Link href={href(r.book, r.chapter)} className="underline underline-offset-4">Try again</Link>
          </div>
        ) : (
          <>
            <PassageReader
              key={`${target}-${translation}`}
              target={target}
              passageId={null}
              translation={translation}
              translationShort={tMeta.short}
              verses={text.verses}
              recording={audioUrl ? { url: audioUrl, narrator: NARRATOR.name, translationShort: "WEB", startFraction: null, endFraction: null, startVerse: null, savedStart: null } : null}
              own={null}
              resume={listening && listening.translation === translation ? { verseIndex: listening.verseIndex, positionSec: listening.positionSec, finished: listening.finished } : null}
              prev={prev ? { href: href(prev.book, prev.ch), label: `${prev.book} ${prev.ch}` } : null}
              next={next ? { href: href(next.book, next.ch), label: `${next.book} ${next.ch}` } : null}
            />
            <p className="mt-6 max-w-[72ch] text-[12px] text-muted">
              Biblical text: {tMeta.name} (public domain), from {text.source}, cached on this device. Narration: {NARRATOR.name}, {NARRATOR.translation}, streamed from eBible.org.
            </p>
          </>
        )}
      </div>
    </NightRoom>
  );
}
