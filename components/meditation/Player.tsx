"use client";
/**
 * Scripture player (PRD §15.1; CINEMATIC_DIRECTION §5).
 *
 * Sources, always labelled, never confused:
 *  1. Human narration (default): Winfred W. Henson's World English Bible recording,
 *     streamed per chapter from eBible.org. For passages that begin mid-chapter, the start
 *     is an ESTIMATE from text position, shown as such; the listener can save a better one.
 *  2. Your recording: a licensed file the listener attached (https).
 *  3. Device voice: the browser's speech synthesis, labelled "synthetic". Fallback only.
 *
 * Progress (seconds for recordings, verse for the device voice) is saved through Server
 * Actions so listening resumes. Music pauses when narration starts, and vice versa.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { recordListening, recordPosition, saveNarrationStart } from "@/app/actions";
import type { Verse } from "@/lib/scripture";
import { Icon } from "../Icon";

const RATES = [0.75, 1, 1.25, 1.5];
const fmt = (s: number) => (Number.isFinite(s) && s >= 0 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "–:––");

export type Recording = {
  url: string;
  narrator: string;
  translationShort: string; // the narration's translation (WEB)
  startFraction: number | null;
  endFraction: number | null;
  startVerse: number | null;
  savedStart: number | null; // listener-calibrated start (seconds)
};

type Props = {
  target: string; // passage id, or "read:<Book>:<chapter>"
  passageId: string | null; // only curated passages can save a calibrated start
  translation: string;
  translationShort: string;
  verses: Verse[];
  recording: Recording | null;
  own: { url: string; label: string; licence: string } | null;
  resume: { verseIndex: number; positionSec: number | null; finished: boolean } | null;
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
};

type Mode = "recording" | "own" | "voice";

export function PassageReader(props: Props) {
  const { target, passageId, translation, translationShort, verses, recording, own, resume, prev, next } = props;
  const [mode, setMode] = useState<Mode>(recording ? "recording" : own ? "own" : "voice");
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const audioEl = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedStart, setSavedStart] = useState<number | null>(recording?.savedStart ?? null);
  const positioned = useRef(false);
  const lastSaved = useRef(0);

  // ---- device voice (synthetic) state ----
  const [index, setIndex] = useState(Math.min(resume?.verseIndex ?? 0, Math.max(0, verses.length - 1)));
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [ttsSupported, setTtsSupported] = useState<boolean | null>(null);
  const playingRef = useRef(false);
  const indexRef = useRef(index);

  const estimate = recording && recording.startFraction !== null && duration ? Math.max(0, recording.startFraction * duration - 3) : null;
  const passageStart = savedStart ?? estimate;
  const passageEnd = recording && recording.endFraction !== null && duration ? recording.endFraction * duration : null;
  const audioMode = mode === "recording" || mode === "own";
  const src = mode === "recording" ? recording?.url : mode === "own" ? own?.url : undefined;

  // Music and narration never play over each other.
  useEffect(() => {
    const onMusic = () => {
      audioEl.current?.pause();
      if (playingRef.current) { playingRef.current = false; setPlaying(false); window.speechSynthesis?.cancel(); }
    };
    window.addEventListener("urha:music-play", onMusic);
    return () => window.removeEventListener("urha:music-play", onMusic);
  }, []);

  // ---- recording helpers ----
  const persist = useCallback((sec: number, finished: boolean) => {
    recordPosition(target, translation, Math.round(sec), finished).then((r) => { if (r && !r.ok) setError("Listening progress could not be saved."); });
  }, [target, translation]);

  const onLoaded = (el: HTMLAudioElement) => {
    el.playbackRate = rate;
    setDuration(el.duration);
    if (positioned.current) return;
    positioned.current = true;
    // Resume where the listener stopped; otherwise start at the passage.
    if (mode === "recording" && resume?.positionSec && !resume.finished && resume.positionSec < el.duration - 5) el.currentTime = resume.positionSec;
    else if (mode === "recording" && recording?.startFraction) el.currentTime = recording.savedStart ?? Math.max(0, recording.startFraction * el.duration - 3);
  };

  const toggleAudio = () => {
    const el = audioEl.current;
    if (!el) return;
    setError(null);
    if (el.paused) {
      window.dispatchEvent(new CustomEvent("urha:narration-play"));
      el.play().catch(() => setError("The recording could not start. Check your connection."));
    } else el.pause();
  };

  const skip = (d: number) => { const el = audioEl.current; if (el) el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + d)); };

  const saveStart = async (sec: number | null) => {
    if (!passageId) return;
    const r = await saveNarrationStart(passageId, sec);
    setMessage(r?.message ?? null);
    if (r?.ok) setSavedStart(sec);
  };

  useEffect(() => { if (audioEl.current) audioEl.current.playbackRate = rate; }, [rate]);

  // ---- device voice ----
  const saveVerse = useCallback((i: number, finished: boolean) => {
    recordListening(target, translation, i, finished).catch(() => undefined);
  }, [target, translation]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) { setTtsSupported(false); return; }
    setTtsSupported(true);
    const load = () => {
      const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
      setVoices(all);
      setVoiceName((cur) => cur || (all.find((v) => v.lang === "en-GB") ?? all[0])?.name || "");
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => { window.speechSynthesis.removeEventListener("voiceschanged", load); window.speechSynthesis.cancel(); };
  }, []);

  const speak = useCallback((i: number) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const verse = verses[i];
    if (!verse) return;
    const u = new SpeechSynthesisUtterance(verse.text);
    u.rate = rate;
    const v = voices.find((x) => x.name === voiceName);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onend = () => {
      if (!playingRef.current || indexRef.current !== i) return;
      if (i < verses.length - 1) { indexRef.current = i + 1; setIndex(i + 1); speak(i + 1); }
      else { playingRef.current = false; setPlaying(false); saveVerse(i, true); }
    };
    u.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") { playingRef.current = false; setPlaying(false); setError(`The device voice stopped (${e.error}).`); }
    };
    synth.speak(u);
  }, [verses, rate, voices, voiceName, saveVerse]);

  const toggleVoice = () => {
    setError(null);
    if (playingRef.current) { playingRef.current = false; setPlaying(false); window.speechSynthesis.cancel(); return; }
    window.dispatchEvent(new CustomEvent("urha:narration-play"));
    playingRef.current = true;
    setPlaying(true);
    saveVerse(indexRef.current, false);
    speak(indexRef.current);
  };

  const seekVerse = (i: number) => {
    const c = Math.max(0, Math.min(verses.length - 1, i));
    indexRef.current = c;
    setIndex(c);
    if (mode === "voice" && playingRef.current) speak(c);
  };

  const switchMode = (m: Mode) => {
    window.speechSynthesis?.cancel();
    audioEl.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setError(null);
    positioned.current = false;
    setMode(m);
  };

  const voice = voices.find((v) => v.name === voiceName);
  const sourceLabel = mode === "recording" ? `Human narration · ${recording?.narrator} · ${recording?.translationShort}` : mode === "own" ? `Your recording · ${own?.label || "attached audio"} · ${own?.licence}` : "Device voice · synthetic text-to-speech";
  const chip = (m: Mode, label: string) => (
    <button type="button" onClick={() => switchMode(m)} aria-pressed={mode === m} className={`h-9 rounded-full px-3 ${mode === m ? "bg-active text-ink" : "text-muted hover:text-ink"}`}>{label}</button>
  );

  return (
    <>
      <div className={`${playing ? "sticky top-0" : ""} z-20 -mx-4 mb-10 bg-ground px-4 py-3 sm:-mx-6 sm:px-6`} role="region" aria-label="Player">
        <div className="flex max-w-[72ch] flex-col gap-3 rounded-[20px] bg-surface p-3 sm:p-4">
          <div className="flex flex-wrap gap-1 text-[13px]" role="group" aria-label="Audio source">
            {recording && chip("recording", "Human narration")}
            {own && chip("own", "Your recording")}
            {chip("voice", "Device voice (synthetic)")}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {audioMode ? (
              <button type="button" onClick={() => skip(-15)} className="grid h-11 w-11 place-items-center rounded-full text-[12px] text-muted hover:text-ink" aria-label="Back 15 seconds">−15</button>
            ) : (
              <button type="button" onClick={() => seekVerse(index - 1)} disabled={index === 0} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-40" aria-label="Previous verse"><Icon name="prev" size={18} /></button>
            )}
            <motion.button type="button" onClick={audioMode ? toggleAudio : toggleVoice} disabled={mode === "voice" && ttsSupported === false}
              whileTap={{ scale: 0.94 }} className="grid h-12 w-12 flex-none place-items-center rounded-full bg-primary text-[var(--primary-ink)] disabled:opacity-40"
              aria-label={playing ? "Pause" : "Play"}>
              <Icon name={playing ? "pause" : "play"} size={18} />
            </motion.button>
            {audioMode ? (
              <button type="button" onClick={() => skip(15)} className="grid h-11 w-11 place-items-center rounded-full text-[12px] text-muted hover:text-ink" aria-label="Forward 15 seconds">+15</button>
            ) : (
              <button type="button" onClick={() => seekVerse(index + 1)} disabled={index >= verses.length - 1} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-40" aria-label="Next verse"><Icon name="next" size={18} /></button>
            )}
            <div className="min-w-0 flex-1">
              {audioMode ? (
                <>
                  <div className="relative">
                    {mode === "recording" && passageStart !== null && duration > 0 && (
                      <div aria-hidden="true" className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                        style={{ left: `${(passageStart / duration) * 100}%`, width: `${(((passageEnd ?? duration) - passageStart) / duration) * 100}%` }} />
                    )}
                    <input type="range" min={0} max={Math.max(1, Math.floor(duration))} step={1} value={Math.floor(time)}
                      onChange={(e) => { if (audioEl.current) audioEl.current.currentTime = Number(e.target.value); }}
                      className="relative w-full accent-[var(--accent)]" aria-label="Position" aria-valuetext={`${fmt(time)} of ${fmt(duration)}`} />
                  </div>
                  <p className="num text-[12px] text-muted">{fmt(time)} / {duration ? fmt(duration) : "loading…"}</p>
                </>
              ) : (
                <>
                  <input type="range" min={0} max={Math.max(0, verses.length - 1)} value={index} onChange={(e) => seekVerse(Number(e.target.value))}
                    className="w-full accent-[var(--accent)]" aria-label="Verse position" aria-valuetext={`Verse ${index + 1} of ${verses.length}`} />
                  <p className="num text-[12px] text-muted" aria-live="polite">Verse {index + 1} of {verses.length}</p>
                </>
              )}
            </div>
            <label className="flex-none">
              <span className="sr-only">Playback speed</span>
              <select value={rate} onChange={(e) => setRate(Number(e.target.value))} className="h-11 rounded-full bg-raised px-3 text-[13px] text-ink">
                {RATES.map((r) => <option key={r} value={r}>{r}×</option>)}
              </select>
            </label>
          </div>

          {audioMode && src && (
            <audio ref={audioEl} src={src} preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={(e) => { setPlaying(false); persist(e.currentTarget.currentTime, false); }}
              onEnded={(e) => { setPlaying(false); persist(e.currentTarget.duration, true); }}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                setTime(t);
                if (Math.abs(t - lastSaved.current) > 10) { lastSaved.current = t; persist(t, false); }
              }}
              onLoadedMetadata={(e) => onLoaded(e.currentTarget)}
              onError={() => setError(mode === "recording" ? "The narration could not be loaded from eBible.org. The text is below, and the device voice can read it instead." : "Your recording could not be loaded. Check the link.")} />
          )}

          <div className="flex flex-col gap-2 text-[12px] text-muted">
            <p>{sourceLabel}{mode === "voice" && voice ? ` · ${voice.name}` : ""}</p>
            {mode === "recording" && recording && translationShort !== recording.translationShort && (
              <p className="text-warning">The narration reads the {recording.translationShort}; the text shown is the {translationShort}, so some wording differs.</p>
            )}
            {mode === "recording" && recording?.startVerse && recording.startVerse > 1 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>The recording is the whole chapter. The passage (from verse {recording.startVerse}) starts at about <span className="num text-ink">{passageStart !== null ? fmt(passageStart) : "…"}</span>{savedStart !== null ? " (your saved point)" : " (estimated)"}.</span>
                {passageStart !== null && <button type="button" className="underline decoration-control underline-offset-4 hover:text-ink" onClick={() => { if (audioEl.current) audioEl.current.currentTime = passageStart; }}>Go to passage</button>}
                {passageId && <button type="button" className="underline decoration-control underline-offset-4 hover:text-ink" onClick={() => saveStart(audioEl.current?.currentTime ?? 0)}>Save current position as start</button>}
                {passageId && savedStart !== null && <button type="button" className="underline decoration-control underline-offset-4 hover:text-ink" onClick={() => saveStart(null)}>Use the estimate</button>}
              </div>
            )}
            {mode === "voice" && ttsSupported && (
              <label className="flex items-center gap-2">
                <span>Voice</span>
                <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="h-9 max-w-[240px] truncate rounded-full bg-raised px-2 text-ink">
                  {voices.length === 0 && <option value="">Default voice</option>}
                  {voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
                </select>
              </label>
            )}
            {mode === "voice" && ttsSupported === false && <p>This browser has no speech voice. The text is below to read.</p>}
            <p className="flex gap-3">
              {prev && <Link href={prev.href} className="hover:text-ink">← {prev.label}</Link>}
              {next && <Link href={next.href} className="hover:text-ink">{next.label} →</Link>}
            </p>
          </div>
          {message && <p role="status" className="text-[12px] text-positive">{message}</p>}
          {error && (
            <p role="alert" className="text-[13px] text-warning">
              {error} {mode === "recording" && <button type="button" onClick={() => switchMode("voice")} className="underline underline-offset-4">Use the device voice</button>}
            </p>
          )}
        </div>
      </div>

      <div className="prose-read font-serif text-[22px] leading-[1.65] sm:text-[24px]">
        {verses.map((v, i) => (
          <span key={`${v.chapter}:${v.verse}`} id={`v-${v.verse}`} className="scroll-mt-40">
            <button type="button" onClick={() => { if (mode !== "voice") switchMode("voice"); seekVerse(i); }} aria-label={`Read aloud from verse ${v.chapter}:${v.verse} with the device voice`}
              className="num mr-1 align-super font-sans text-[12px] text-[var(--rubric,var(--muted))] hover:text-accent">{v.verse}</button>
            <motion.span animate={{ opacity: mode === "voice" && playing ? (i === index ? 1 : 0.55) : 1 }} transition={{ duration: 0.2 }}>{v.text}</motion.span>{" "}
          </span>
        ))}
      </div>
    </>
  );
}
