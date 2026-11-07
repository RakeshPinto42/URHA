import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import type { Metadata } from "next";
import { COLLECTIONS, findPassage, passageText, TRANSLATIONS } from "@/lib/scripture";
import { getBookmarks, getCollectionNote, getListening, getPassageReflections } from "@/lib/data";
import { COLLECTION_META } from "@/lib/collections";
import { ART } from "@/lib/art";
import { NARRATOR } from "@/lib/narration";
import { MUSIC } from "@/lib/music";
import { quoteForDay } from "@/lib/quotes";
import { localStamp, today } from "@/lib/dates";
import { NightRoom } from "@/components/meditation/NightRoom";
import { CollectionNotes } from "@/components/meditation/PassageForms";
import { Quote } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { LivingPicture } from "@/components/cinema/LivingPicture";
import { RisingTitle } from "@/components/Frontispiece";
import { SECTIONS, paneAt } from "@/lib/cinema";

export const metadata: Metadata = { title: "Meditation" };

/** Label and link for a listening/saved target: a curated passage, or "read:<Book>:<chapter>". */
function targetInfo(id: string): { label: string; href: string } | null {
  const f = findPassage(id);
  if (f) return { label: f.passage.ref, href: `/meditation/${id}` };
  const m = id.match(/^read:(.+):(\d+)$/);
  return m ? { label: `${m[1]} ${m[2]}`, href: `/meditation/read/${encodeURIComponent(m[1]!)}/${m[2]}` } : null;
}

export default async function MeditationPage() {
  await connection();
  const listening = getListening();
  const bookmarks = [...getBookmarks()];
  const reflections = getPassageReflections();
  const lastInfo = listening[0] ? targetInfo(listening[0].passageId) : null;
  const status = new Map(listening.map((l) => [l.passageId, l]));
  const quote = quoteForDay("meditation", today());
  const trackCount = MUSIC.reduce((n, c) => n + c.tracks.length, 0);
  const water = ART.water;

  return (
    <NightRoom back={{ href: "/", label: "Back to URHA" }}>
      {/* Opening window: the painting opens from a lit window to full bleed as you scroll (static under reduced motion). */}
      <section className="opening relative" aria-labelledby="med-h">
        <div className="opening__stage">
          <div className="opening__window absolute inset-0 isolate overflow-hidden">
            <LivingPicture picture={water} shadow={SECTIONS.meditation.light.bright} light={SECTIONS.meditation.pane.bright} priority className="opening__picture" />
            <div aria-hidden="true" className="band__scrim absolute inset-0" />
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-column px-4 pb-10 text-[#f7f7f5] sm:px-6 sm:pb-16">
            <p className="text-[14px] text-[#f7f7f5]/80">The Quiet Room</p>
            <RisingTitle id="med-h" text="Meditation" className="mt-2 font-serif text-[52px] leading-[0.95] sm:text-[84px]" />
            <p className="mt-4 max-w-[46ch] text-[18px] leading-relaxed text-[#f7f7f5]/90">Listen to Scripture read by a human voice, read slowly, and think it through honestly. Nothing here is measured.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {lastInfo ? (
                <Link href={lastInfo.href} className="btn bg-[#f7f7f5] text-[#0f0d0b] hover:opacity-90"><Icon name="play" size={14} /> Continue {lastInfo.label}</Link>
              ) : (
                <Link href="/meditation/mt-14-22" className="btn bg-[#f7f7f5] text-[#0f0d0b] hover:opacity-90"><Icon name="play" size={14} /> Begin with Matthew 14</Link>
              )}
              <Link href="/meditation/read" className="btn border border-[#f7f7f5]/60 text-[#f7f7f5] hover:bg-[#f7f7f5]/10">Read and listen</Link>
              <Link href="/meditation/music" className="btn border border-[#f7f7f5]/60 text-[#f7f7f5] hover:bg-[#f7f7f5]/10">Music</Link>
            </div>
            <p className="mt-6 text-[12px] text-[#f7f7f5]/70">{water.caption}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-column px-4 pb-40 sm:px-6">
        <section aria-label="Before you begin" className="grid grid-cols-1 gap-8 py-16 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-7">{quote && <Quote quote={quote} size="sm" />}</div>
          <dl className="grid grid-cols-1 gap-4 text-[14px] lg:col-span-5">
            <div><dt className="text-muted">Narration</dt><dd>{NARRATOR.name}: a human voice reading the complete World English Bible.</dd></div>
            <div><dt className="text-muted">Music</dt><dd>{trackCount} public-domain and openly licensed recordings, verified source by source.</dd></div>
            <div><dt className="text-muted">Your notes</dt><dd>Private, stored only on this device.</dd></div>
          </dl>
        </section>

        <div className="flex flex-col gap-24">
          {COLLECTIONS.map((c, i) => {
            const meta = COLLECTION_META[c.id]!;
            const art = ART[meta.art];
            const pane = paneAt(i);
            return (
              <section key={c.id} id={c.id} aria-labelledby={`c-${c.id}`} className="grid scroll-mt-10 grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-4">
                <div className="flex flex-col gap-4 lg:col-span-5 lg:pr-8">
                  <figure>
                    <div className="lit-plate relative h-[220px] overflow-hidden rounded-img sm:h-[280px]" style={{ "--pane": pane.bright } as React.CSSProperties}>
                      <Image src={art.src} alt={art.alt} fill placeholder="blur" className="drift object-cover" style={{ objectPosition: art.focus }} sizes="(min-width: 1024px) 440px, 100vw" />
                    </div>
                    <figcaption className="mt-2 text-[12px] text-muted">{art.caption}</figcaption>
                  </figure>
                  <h2 id={`c-${c.id}`} className="font-serif text-[34px] leading-tight">{c.title}</h2>
                  <p className="text-[15px] text-muted">{meta.intro}</p>
                  <details>
                    <summary className="w-fit cursor-pointer text-[14px] underline decoration-control underline-offset-4">Reflection questions and notes</summary>
                    <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-[15px]">{meta.questions.map((q) => <li key={q}>{q}</li>)}</ol>
                    <div className="mt-5"><CollectionNotes collectionId={c.id} body={getCollectionNote(c.id)} /></div>
                  </details>
                </div>
                <ul className="flex flex-col lg:col-span-7">
                  {c.passages.map((p) => {
                    const s = status.get(p.id);
                    const verses = passageText(p.id, "web")?.verses.length;
                    return (
                      <li key={p.id} className="border-b border-border">
                        <Link href={`/meditation/${p.id}`} className="flex min-h-[60px] flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 text-[18px] hover:text-accent">
                          <span className="flex items-center gap-3">
                            {p.ref}
                            {bookmarks.includes(p.id) && <span className="text-accent" title="Saved"><Icon name="bookmarked" size={13} /><span className="sr-only">Saved</span></span>}
                          </span>
                          <span className="num flex flex-none items-center gap-3 text-[13px] text-muted">
                            <span>Narrated</span>
                            {s && <span>{s.finished ? "Listened" : "In progress"}</span>}
                            {verses !== undefined && <span>{verses} {verses === 1 ? "verse" : "verses"}</span>}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <p className="text-[13px] text-muted">Suggested themes for reading and listening. Not every passage is a saying of Jesus, and none is offered as proof of anything.</p>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-12 border-t border-border pt-12 md:grid-cols-3">
          <section aria-labelledby="hist-h">
            <h2 id="hist-h" className="text-[16px] font-semibold">Listening history</h2>
            {listening.length === 0 ? <p className="mt-3 text-[14px] text-muted">Nothing listened to yet.</p> : (
              <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                {listening.slice(0, 8).map((l) => {
                  const info = targetInfo(l.passageId);
                  return info ? (
                    <li key={l.passageId} className="flex justify-between gap-3">
                      <Link href={info.href} className="hover:text-accent">{info.label}</Link>
                      <span className="text-[13px] text-muted">{TRANSLATIONS.find((t) => t.id === l.translation)?.short} · {localStamp(l.updatedAt).date}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </section>
          <section aria-labelledby="saved-h">
            <h2 id="saved-h" className="text-[16px] font-semibold">Saved passages</h2>
            {bookmarks.length === 0 ? <p className="mt-3 text-[14px] text-muted">Save a passage or chapter to return to it here.</p> : (
              <ul className="mt-3 flex flex-col gap-2 text-[15px]">
                {bookmarks.map((id) => { const info = targetInfo(id); return info ? <li key={id}><Link href={info.href} className="hover:text-accent">{info.label}</Link></li> : null; })}
              </ul>
            )}
          </section>
          <section aria-labelledby="refl-h">
            <h2 id="refl-h" className="text-[16px] font-semibold">Your recent reflections</h2>
            {reflections.length === 0 ? <p className="mt-3 text-[14px] text-muted">Private reflections you write after listening appear here.</p> : (
              <ul className="mt-3 flex flex-col gap-4">
                {reflections.slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <Link href={`/meditation/${r.passageId}#journal`} className="text-[15px] hover:text-accent">{findPassage(r.passageId)?.passage.ref}</Link>
                    <p className="line-clamp-2 text-[14px] text-muted">{r.personal || r.understood || r.stoodOut || r.questioned || r.apply || r.revisit}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="mt-16 max-w-[80ch] text-[12px] text-muted">
          Scripture: World English Bible and King James Version, both public domain. Narration: {NARRATOR.name}, via eBible.org (“{NARRATOR.terms.split(" (")[0]}”). Paintings are artists’ imaginings, shown as artworks; see Sources and credits.
        </footer>
      </div>
    </NightRoom>
  );
}
