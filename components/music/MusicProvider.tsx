"use client";
/**
 * App-wide music player state. Lives in the root layout so music continues while
 * moving between Meditation and study screens. One <audio> element; queue; volume
 * (remembered per device); Media Session (lock-screen / hardware keys) where supported.
 * Pauses itself when Scripture narration starts ("urha:narration-play").
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Track } from "@/lib/music";

type Status = "idle" | "loading" | "playing" | "paused" | "error";
type Ctx = {
  queue: Track[]; index: number; current: Track | null; status: Status; error: string | null;
  time: number; duration: number; volume: number;
  playQueue: (tracks: Track[], startAt?: number) => void;
  toggle: () => void; next: () => void; prev: () => void; seek: (t: number) => void;
  setVolume: (v: number) => void; jumpTo: (i: number) => void; removeAt: (i: number) => void; stop: () => void;
};
const MusicCtx = createContext<Ctx | null>(null);
export const useMusic = () => {
  const c = useContext(MusicCtx);
  if (!c) throw new Error("useMusic outside MusicProvider");
  return c;
};

const VOL_KEY = "urha.music.volume";

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const current = queue[index] ?? null;

  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(VOL_KEY));
      if (v > 0 && v <= 1) setVolumeState(v);
    } catch { /* storage unavailable: default volume */ }
  }, []);

  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);

  const load = useCallback((t: Track) => {
    const el = audio.current;
    if (!el) return;
    setError(null);
    setStatus("loading");
    el.src = t.stream;
    el.play().catch(() => { setStatus("error"); setError("This recording could not start. Check the connection, or choose another."); });
  }, []);

  const playQueue = useCallback((tracks: Track[], startAt = 0) => {
    if (!tracks.length) return;
    window.dispatchEvent(new CustomEvent("urha:music-play"));
    setQueue(tracks);
    setIndex(startAt);
    load(tracks[startAt]!);
  }, [load]);

  const jumpTo = useCallback((i: number) => {
    const t = queue[i];
    if (!t) return;
    setIndex(i);
    load(t);
  }, [queue, load]);

  const next = useCallback(() => { if (index < queue.length - 1) jumpTo(index + 1); else { setStatus("paused"); } }, [index, queue.length, jumpTo]);
  const prev = useCallback(() => {
    const el = audio.current;
    if (el && el.currentTime > 5) { el.currentTime = 0; return; }
    if (index > 0) jumpTo(index - 1);
  }, [index, jumpTo]);

  const toggle = useCallback(() => {
    const el = audio.current;
    if (!el || !current) return;
    if (el.paused) {
      window.dispatchEvent(new CustomEvent("urha:music-play"));
      el.play().catch(() => { setStatus("error"); setError("Playback was blocked or failed."); });
    } else el.pause();
  }, [current]);

  const seek = useCallback((t: number) => { if (audio.current) audio.current.currentTime = t; }, []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    try { localStorage.setItem(VOL_KEY, String(v)); } catch { /* ignore */ }
  }, []);
  const removeAt = useCallback((i: number) => {
    setQueue((q) => q.filter((_, j) => j !== i));
    if (i < index) setIndex((x) => x - 1);
  }, [index]);
  const stop = useCallback(() => { audio.current?.pause(); setQueue([]); setIndex(0); setStatus("idle"); }, []);

  // Narration takes precedence: pause music when Scripture audio starts.
  useEffect(() => {
    const onNarration = () => audio.current?.pause();
    window.addEventListener("urha:narration-play", onNarration);
    return () => window.removeEventListener("urha:narration-play", onNarration);
  }, []);

  // Media Session: lock-screen metadata and hardware keys.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.performer ?? current.composition, album: `URHA — ${current.collectionTitle}` });
    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [current, toggle, next, prev]);

  const value = useMemo<Ctx>(() => ({ queue, index, current, status, error, time, duration, volume, playQueue, toggle, next, prev, seek, setVolume, jumpTo, removeAt, stop }),
    [queue, index, current, status, error, time, duration, volume, playQueue, toggle, next, prev, seek, setVolume, jumpTo, removeAt, stop]);

  return (
    <MusicCtx.Provider value={value}>
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlaying={() => setStatus("playing")}
        onPause={() => setStatus((s) => (s === "error" ? s : "paused"))}
        onWaiting={() => setStatus("loading")}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={next}
        onError={() => { if (current) { setStatus("error"); setError("This recording could not be loaded from Wikimedia Commons."); } }}
      />
    </MusicCtx.Provider>
  );
}
