"use client";
/** The music room: collections with artwork, track lists, play-all, queue, volume and seek. */
import Image from "next/image";
import { ART } from "@/lib/art";
import type { MusicCollection } from "@/lib/music";
import { useMusic } from "./MusicProvider";
import { fmt } from "./MusicBar";
import { Icon } from "../Icon";

export function MusicRoom({ collections }: { collections: MusicCollection[] }) {
  const m = useMusic();
  const all = collections.flatMap((c) => c.tracks);
  return (
    <div className="flex flex-col gap-16">
      {m.current && (
        <section aria-labelledby="now-h" className="grid grid-cols-1 gap-6 rounded-[24px] bg-surface p-5 sm:p-6 lg:grid-cols-12">
          <div className="relative h-[200px] overflow-hidden rounded-img lg:col-span-4 lg:h-auto">
            <Image src={ART[m.current.art].src} alt={ART[m.current.art].alt} fill className="object-cover" style={{ objectPosition: ART[m.current.art].focus }} sizes="400px" />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div>
              <h2 id="now-h" className="text-[13px] text-muted">Now playing · {m.current.collectionTitle}</h2>
              <p className="mt-1 font-serif text-[34px] leading-tight">{m.current.title}</p>
              <p className="text-[14px] text-muted">{m.current.composition}{m.current.performer ? ` · ${m.current.performer}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={m.prev} aria-label="Previous track" className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ink"><Icon name="prev" size={18} /></button>
              <button type="button" onClick={m.toggle} aria-label={m.status === "playing" ? "Pause" : "Play"} className="grid h-14 w-14 place-items-center rounded-full bg-primary text-[var(--primary-ink)] active:scale-95"><Icon name={m.status === "playing" ? "pause" : "play"} size={20} /></button>
              <button type="button" onClick={m.next} disabled={m.index >= m.queue.length - 1} aria-label="Next track" className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-40"><Icon name="next" size={18} /></button>
              <div className="min-w-0 flex-1">
                <input type="range" min={0} max={Math.max(1, Math.floor(m.duration || m.current.durationSec))} value={Math.floor(m.time)} onChange={(e) => m.seek(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]" aria-label="Position" aria-valuetext={`${fmt(m.time)} of ${fmt(m.duration || m.current.durationSec)}`} />
                <p className="num text-[12px] text-muted">{m.status === "loading" ? "Loading…" : `${fmt(m.time)} / ${fmt(m.duration || m.current.durationSec)}`}</p>
              </div>
              <label className="hidden items-center gap-2 text-[12px] text-muted sm:flex">
                Volume
                <input type="range" min={0} max={1} step={0.05} value={m.volume} onChange={(e) => m.setVolume(Number(e.target.value))} className="w-24 accent-[var(--accent)]" aria-label="Volume" />
              </label>
            </div>
            <p className="text-[12px] text-muted">
              {m.current.rightsBasis} <a href={m.current.page} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">Source and licence</a>
            </p>
            {m.error && <p role="alert" className="text-[13px] text-warning">{m.error}</p>}
            {m.queue.length > 1 && (
              <details>
                <summary className="w-fit cursor-pointer text-[13px] text-muted underline decoration-control underline-offset-4">Queue · {m.queue.length - m.index - 1} up next</summary>
                <ol className="mt-3 flex flex-col">
                  {m.queue.map((t, i) => (
                    <li key={`${t.id}-${i}`} className={`flex items-center justify-between gap-3 border-b border-border py-2 text-[14px] ${i === m.index ? "text-accent" : i < m.index ? "text-muted" : ""}`}>
                      <button type="button" onClick={() => m.jumpTo(i)} className="min-w-0 flex-1 truncate text-left hover:underline">{t.title}</button>
                      {i !== m.index && <button type="button" onClick={() => m.removeAt(i)} className="text-[12px] text-muted hover:text-ink" aria-label={`Remove ${t.title} from the queue`}>Remove</button>}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>
        </section>
      )}

      <div className="flex justify-start">
        <button type="button" onClick={() => m.playQueue(all, 0)} className="btn btn-primary"><Icon name="play" size={14} /> Play all {all.length} pieces</button>
      </div>

      {collections.map((c) => (
        <section key={c.id} aria-labelledby={`mc-${c.id}`} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-4">
          <div className="lg:col-span-4">
            <div className="relative h-[160px] overflow-hidden rounded-img">
              <Image src={ART[c.art].src} alt="" fill className="object-cover" style={{ objectPosition: ART[c.art].focus }} sizes="(min-width: 1024px) 360px, 100vw" />
            </div>
            <h2 id={`mc-${c.id}`} className="mt-4 font-serif text-[28px] leading-tight">{c.title}</h2>
            <p className="mt-2 text-[14px] text-muted">{c.intro}</p>
            <button type="button" onClick={() => m.playQueue(c.tracks, 0)} className="btn btn-secondary mt-4"><Icon name="play" size={14} /> Play collection</button>
          </div>
          <ol className="flex flex-col lg:col-span-8">
            {c.tracks.map((t, i) => {
              const playing = m.current?.id === t.id;
              return (
                <li key={t.id} className="border-b border-border">
                  <button type="button" onClick={() => m.playQueue(c.tracks, i)} aria-current={playing ? "true" : undefined}
                    className={`flex min-h-[60px] w-full items-center gap-4 py-3 text-left hover:text-accent ${playing ? "text-accent" : ""}`}>
                    <Icon name={playing && m.status === "playing" ? "pause" : "play"} size={14} className="text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px]">{t.title}</span>
                      <span className="block truncate text-[12px] text-muted">{t.composition}{t.performer ? ` · ${t.performer}` : ""} · {t.licence}</span>
                    </span>
                    <span className="num flex-none text-[13px] text-muted">{fmt(t.durationSec)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
