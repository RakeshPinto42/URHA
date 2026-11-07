import type { Metadata } from "next";
import { MUSIC, MUSIC_VERIFIED_AT } from "@/lib/music";
import { NightRoom } from "@/components/meditation/NightRoom";
import { MusicRoom } from "@/components/music/MusicRoom";

export const metadata: Metadata = { title: "Music" };

export default function MusicPage() {
  const count = MUSIC.reduce((n, c) => n + c.tracks.length, 0);
  return (
    <NightRoom back={{ href: "/meditation", label: "Meditation" }} title="Music">
      <div className="mx-auto w-full max-w-column px-4 pb-40 pt-6 sm:px-6 lg:pt-12">
        <header className="mb-12 max-w-[60ch]">
          <h1 className="font-serif text-[44px] leading-none sm:text-[60px]">Music for stillness</h1>
          <p className="mt-4 text-[17px] text-muted">
            {count} hymns, sacred works and quiet pieces in {MUSIC.length} collections. Every recording is public domain or openly licensed, streamed from Wikimedia Commons, and keeps playing while you study.
          </p>
        </header>
        <MusicRoom collections={MUSIC} />
        <footer className="mt-16 max-w-[70ch] text-[12px] text-muted">
          Licences verified on Wikimedia Commons on {MUSIC_VERIFIED_AT.slice(0, 10)}. Contemporary worship songs are copyrighted and are not included; a church streaming licence (such as CCLI) does not cover an app catalogue.
          CC BY recordings by Kevin MacLeod (incompetech.com) and the field recordists named on each source page are used under Creative Commons Attribution.
        </footer>
      </div>
    </NightRoom>
  );
}
