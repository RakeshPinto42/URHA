/**
 * Curated contemplative music (lib/music-source.json), with rights metadata verified on
 * Wikimedia Commons (data/music-verified.json via scripts/verify-music.mjs).
 * Only tracks whose verification status is "verified" are exposed to the app.
 */
import source from "@/lib/music-source.json";
import verified from "@/data/music-verified.json";
import type { ArtId } from "./art";

type V = { status: string; licence?: string; licenceUrl?: string | null; author?: string | null; durationSec?: number; page?: string; stream?: string; streamMime?: string };
const V_BY_FILE = verified.tracks as Record<string, V>;

export type Track = {
  id: string; title: string; composition: string; performer: string | null; licence: string; licenceUrl: string | null;
  durationSec: number; page: string; stream: string; collectionId: string; collectionTitle: string; art: ArtId;
  rightsBasis: string;
};
export type MusicCollection = { id: string; title: string; intro: string; art: ArtId; tracks: Track[] };

function rightsBasis(licence: string, performer: string | null): string {
  const l = licence.toLowerCase();
  if (l.includes("public domain")) {
    if (performer && /united states (air force|navy|marine|army)|u\.s\. (navy|marine|army|air force)|usaf|usn/i.test(performer)) {
      return "Public domain: a work of the US federal government (17 U.S.C. §105).";
    }
    return "Public domain as recorded on Wikimedia Commons (composition and recording).";
  }
  if (l.startsWith("cc0")) return "CC0: dedicated to the public domain by the rights holder.";
  return `${licence}: free to use with attribution, given here.`;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export const MUSIC: MusicCollection[] = source.collections.map((c) => ({
  id: c.id, title: c.title, intro: c.intro, art: c.art as ArtId,
  tracks: c.tracks
    .map((t): Track | null => {
      const v = V_BY_FILE[t.file];
      if (!v || v.status !== "verified" || !v.stream) return null;
      const performer = v.author ? v.author.replace(/^(Composition|Words|Tune):.*?(Performance:\s*)/i, "$2").slice(0, 120) : null;
      return {
        id: `${c.id}-${slugify(t.title)}`, title: t.title, composition: t.composition, performer,
        licence: v.licence!, licenceUrl: v.licenceUrl ?? null, durationSec: v.durationSec ?? 0, page: v.page!, stream: v.stream,
        collectionId: c.id, collectionTitle: c.title, art: c.art as ArtId, rightsBasis: rightsBasis(v.licence!, v.author ?? null),
      };
    })
    .filter((t): t is Track => t !== null),
}));

export const MUSIC_VERIFIED_AT = verified.verifiedAt;
