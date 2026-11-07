import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";
import { findPassage, isTranslation, neighbours, passageText, TRANSLATIONS, type Translation } from "@/lib/scripture";
import { getAudioSource, getBookmarks, getListening, getNarrationOffset, getPassageReflections } from "@/lib/data";
import { KIND_LABEL, REFLECTIONS } from "@/lib/reflections";
import { NARRATOR, passageAudio } from "@/lib/narration";
import { NightRoom } from "@/components/meditation/NightRoom";
import { PassageReader } from "@/components/meditation/Player";
import { AudioSourceForm, BookmarkButton, ReflectionJournal } from "@/components/meditation/PassageForms";

type Props = { params: Promise<{ passageId: string }>; searchParams: Promise<{ t?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { passageId } = await params;
  return { title: findPassage(passageId)?.passage.ref ?? "Passage" };
}

const KIND_TONE: Record<string, string> = {
  summary: "text-muted", context: "text-muted", interpretation: "text-accent", urha: "text-accent", open: "text-[var(--rubric)]",
};

export default async function PassagePage({ params, searchParams }: Props) {
  await connection();
  const { passageId } = await params;
  const sp = await searchParams;
  const found = findPassage(passageId);
  if (!found) notFound();
  const listening = getListening().find((l) => l.passageId === passageId);
  const translation: Translation = isTranslation(sp.t) ? sp.t : isTranslation(listening?.translation) ? (listening!.translation as Translation) : "web";
  const text = passageText(passageId, translation);
  const tMeta = TRANSLATIONS.find((t) => t.id === translation)!;
  const { prev, next } = neighbours(passageId);
  const reflection = REFLECTIONS[passageId];
  const own = getAudioSource(passageId);
  const audio = passageAudio(found.passage.query);

  return (
    <NightRoom back={{ href: "/meditation", label: "Meditation" }} title={found.collection.title}>
      <div className="mx-auto w-full max-w-column px-4 sm:px-6">
        <header className="flex flex-col gap-6 pb-8 pt-8 sm:flex-row sm:items-end sm:justify-between lg:pt-14">
          <div>
            <p className="text-[13px] text-[var(--rubric)]">{found.collection.title}</p>
            <h1 className="mt-2 font-serif text-[44px] leading-none sm:text-[60px]">{found.passage.ref}</h1>
            <p className="mt-3 text-[14px] text-muted">{tMeta.name} · {tMeta.note}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Translation" className="flex gap-1 rounded-full bg-surface p-1">
              {TRANSLATIONS.map((t) => (
                <Link key={t.id} href={`/meditation/${passageId}?t=${t.id}`} aria-current={t.id === translation ? "true" : undefined}
                  className={`flex h-9 items-center rounded-full px-4 text-[13px] ${t.id === translation ? "bg-active text-ink" : "text-muted hover:text-ink"}`}>{t.short}</Link>
              ))}
            </nav>
            <BookmarkButton passageId={passageId} on={getBookmarks().has(passageId)} />
          </div>
        </header>

        {!text ? (
          <p role="alert" className="rounded-[12px] bg-[var(--warning-bg)] px-4 py-3 text-[14px] text-warning">
            The text of {found.passage.ref} ({tMeta.short}) is not available offline. Run <code>npm run scripture:fetch</code>.
          </p>
        ) : (
          <section aria-label={`${found.passage.ref}, ${tMeta.name}`}>
            <PassageReader
              key={translation}
              target={passageId}
              passageId={passageId}
              translation={translation}
              translationShort={tMeta.short}
              verses={text.verses}
              recording={audio ? { url: audio.url, narrator: NARRATOR.name, translationShort: "WEB", startFraction: audio.startFraction, endFraction: audio.endFraction, startVerse: audio.startVerse, savedStart: getNarrationOffset(passageId) } : null}
              own={own}
              resume={listening && listening.translation === translation ? { verseIndex: listening.verseIndex, positionSec: listening.positionSec, finished: listening.finished } : null}
              prev={prev ? { href: `/meditation/${prev.id}?t=${translation}`, label: prev.ref } : null}
              next={next ? { href: `/meditation/${next.id}?t=${translation}`, label: next.ref } : null}
            />
            <p className="mt-4 max-w-[72ch] text-[12px] text-muted">
              Biblical text: {text.translationName} ({text.translationNote}), retrieved from {text.source} on {text.fetchedAt.slice(0, 10)}.
              {audio && <> Narration: {NARRATOR.name}, {NARRATOR.translation}, streamed from <a href={NARRATOR.source} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">eBible.org</a> — “{NARRATOR.terms.split(" (")[0]}”</>}
              {" "}<Link href={`/meditation/read/${encodeURIComponent(audio?.book ?? "")}/${audio?.chapter ?? 1}`} className="underline decoration-control underline-offset-4">Read the whole chapter</Link>
            </p>
          </section>
        )}

        <div className="mt-24 grid grid-cols-1 gap-16 pb-32 lg:grid-cols-12 lg:gap-4">
          <section aria-labelledby="think-h" className="lg:col-span-7 lg:pr-12">
            <h2 id="think-h" className="font-serif text-[32px] leading-tight">Thinking it through</h2>
            <p className="mt-3 text-[14px] text-muted">
              Four layers, kept apart: the Biblical text above; then historical context; philosophical interpretation; and URHA’s own reflection.
              Nothing below is Scripture, and no reading is presented as the only one.
            </p>
            {reflection ? (
              <ol className="mt-8 flex flex-col gap-8">
                {reflection.map((s) => (
                  <li key={s.question}>
                    <h3 className="text-[17px] font-medium">{s.question}</h3>
                    <p className={`mt-1 text-[12px] ${KIND_TONE[s.kind]}`}>{KIND_LABEL[s.kind]}</p>
                    <p className="mt-2 text-[17px] leading-relaxed">{s.text}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-6 text-[15px] text-muted">No reflection has been written for this passage.</p>
            )}
          </section>
          <section aria-labelledby="journal-h" id="journal" className="scroll-mt-16 lg:col-span-5">
            <h2 id="journal-h" className="font-serif text-[32px] leading-tight">Your reflection</h2>
            <div className="mt-6"><ReflectionJournal passageId={passageId} entries={getPassageReflections(passageId)} /></div>
            <details className="mt-12 border-t border-border pt-6">
              <summary className="cursor-pointer text-[15px]">{own ? "Your attached recording" : "Attach your own licensed recording"}</summary>
              <div className="mt-4"><AudioSourceForm passageId={passageId} current={own} /></div>
            </details>
          </section>
        </div>
      </div>
    </NightRoom>
  );
}
