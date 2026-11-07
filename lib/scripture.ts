/**
 * Access to the bundled public-domain scripture text (data/scripture/*.json,
 * produced by scripts/fetch-scripture.mjs). Server-only: reads JSON from disk.
 * Missing files return null so the UI can show "text unavailable" instead of
 * inventing anything.
 */
import fs from "node:fs";
import path from "node:path";
import passages from "./passages.json";

export type Translation = "web" | "kjv";
export const TRANSLATIONS: { id: Translation; name: string; short: string; note: string }[] = [
  { id: "web", name: "World English Bible", short: "WEB", note: "Public domain. Modern English." },
  { id: "kjv", name: "King James Version", short: "KJV", note: "Public domain in most countries (Crown patent applies in the UK)." },
];

export type Verse = { book: string; chapter: number; verse: number; text: string };
type PassageText = { reference: string; translationName: string; translationNote: string; verses: Verse[] };
type ScriptureFile = { translation: Translation; source: string; fetchedAt: string; passages: Record<string, PassageText> };

const cache = new Map<Translation, ScriptureFile | null>();

function load(t: Translation): ScriptureFile | null {
  if (cache.has(t)) return cache.get(t)!;
  let file: ScriptureFile | null = null;
  try {
    const p = path.join(process.cwd(), "data", "scripture", `${t}.json`);
    file = JSON.parse(fs.readFileSync(p, "utf8")) as ScriptureFile;
  } catch {
    file = null;
  }
  cache.set(t, file);
  return file;
}

export function isTranslation(v: unknown): v is Translation {
  return v === "web" || v === "kjv";
}

export function passageText(id: string, t: Translation): (PassageText & { source: string; fetchedAt: string }) | null {
  const f = load(t);
  const p = f?.passages[id];
  return p && f ? { ...p, source: f.source, fetchedAt: f.fetchedAt } : null;
}

export function verseText(id: string, t: Translation): { text: string; reference: string; translationShort: string } | null {
  const p = passageText(id, t);
  if (!p) return null;
  const short = TRANSLATIONS.find((x) => x.id === t)!.short;
  return { text: p.verses.map((v) => v.text).join(" "), reference: p.reference, translationShort: short };
}

export type PassageMeta = { id: string; ref: string; query: string };
export type CollectionMeta = { id: string; title: string; focus: string; passages: PassageMeta[] };
export const COLLECTIONS: CollectionMeta[] = passages.collections;

export function findPassage(id: string): { collection: CollectionMeta; passage: PassageMeta; index: number } | null {
  for (const c of COLLECTIONS) {
    const index = c.passages.findIndex((p) => p.id === id);
    if (index >= 0) return { collection: c, passage: c.passages[index]!, index };
  }
  return null;
}

/** Previous/next passage across all collections, in reading order. */
export function neighbours(id: string): { prev: PassageMeta | null; next: PassageMeta | null } {
  const all = COLLECTIONS.flatMap((c) => c.passages);
  const i = all.findIndex((p) => p.id === id);
  return { prev: i > 0 ? all[i - 1]! : null, next: i >= 0 && i < all.length - 1 ? all[i + 1]! : null };
}
