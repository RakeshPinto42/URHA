"use client";
/** The compact now-playing bar, docked bottom-right whenever a track is loaded (any screen). */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMusic } from "./MusicProvider";
import { Icon } from "../Icon";
import { EASE } from "../Motion";

export const fmt = (s: number) => (Number.isFinite(s) && s >= 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "–:––");

export function MusicBar() {
  const m = useMusic();
  const onMusicPage = usePathname() === "/meditation/music";
  return (
    <AnimatePresence>
      {m.current && !onMusicPage && (
        <motion.div
          role="region" aria-label="Music player"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: EASE }}
          className="night fixed bottom-3 left-3 right-3 z-40 rounded-[18px] border border-border bg-surface p-3 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.28)] sm:left-auto sm:w-[400px]"
        >
          <div className="flex items-center gap-3">
            <button type="button" onClick={m.toggle} aria-label={m.status === "playing" ? "Pause music" : "Play music"}
              className="grid h-11 w-11 flex-none place-items-center rounded-full bg-primary text-[var(--primary-ink)] transition-transform active:scale-95">
              <Icon name={m.status === "playing" ? "pause" : "play"} size={16} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px]">{m.current.title}</p>
              <p className="truncate text-[12px] text-muted">{m.current.collectionTitle} · {m.status === "loading" ? "Loading…" : `${fmt(m.time)} / ${fmt(m.duration || m.current.durationSec)}`}</p>
            </div>
            <button type="button" onClick={m.next} disabled={m.index >= m.queue.length - 1} aria-label="Next track" className="grid h-11 w-9 place-items-center text-muted hover:text-ink disabled:opacity-40"><Icon name="next" size={16} /></button>
            <Link href="/meditation/music" className="grid h-11 w-9 place-items-center text-muted hover:text-ink" aria-label="Open the music room"><Icon name="meditation" size={16} /></Link>
            <button type="button" onClick={m.stop} aria-label="Stop and close the player" className="grid h-11 w-9 place-items-center text-muted hover:text-ink"><Icon name="close" size={16} /></button>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-active" aria-hidden="true">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (m.time / (m.duration || m.current.durationSec || 1)) * 100)}%` }} />
          </div>
          {m.error && <p role="alert" className="mt-2 text-[12px] text-warning">{m.error}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
