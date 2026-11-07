import type { Metadata } from "next";
import credits from "@/public/images/credits.json";
import artCredits from "@/public/art/credits.json";
import modelCredits from "@/public/cinema/credits.json";
import { MUSIC, MUSIC_VERIFIED_AT } from "@/lib/music";
import { NARRATOR } from "@/lib/narration";
import { VIDEOS_VERIFIED_AT, DOCS_CHECKED_AT } from "@/lib/catalog";
import { TRANSLATIONS } from "@/lib/scripture";
import { QUOTES } from "@/lib/quotes";
import { PageEnter } from "@/components/Motion";
import { Canvas, ScreenTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Sources and credits" };

type Credit = { file: string; title: string; creator: string; license: string; licenseUrl: string; page: string; via: string; credit: string };

export default function CreditsPage() {
  const sourced = QUOTES.filter((q) => q.type === "historical" || q.type === "scientific");
  return (
    <PageEnter>
      <Canvas>
        <ScreenTitle title="Sources and credits" sub="Every picture, text and quotation in URHA, with its source and licence." />
        <div className="flex flex-col gap-12">
          <section aria-labelledby="img-h">
            <h2 id="img-h" className="mb-3 text-[16px] font-medium">Pictures</h2>
            <ul className="flex flex-col gap-3 text-[14px]">
              {([...(credits as Credit[]), ...(artCredits as Credit[])]).map((c) => (
                <li key={c.file}>
                  <a href={c.page} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4 hover:decoration-current">{c.title}</a>
                  {" "}by {c.creator}, <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">{c.license}</a>, via {c.via}.
                  <span className="text-muted"> Cropped for layout.{c.file.includes("/art/") ? " A painting is an artist’s imagining, not a historical record or portrait." : ""}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="models-h">
            <h2 id="models-h" className="mb-3 text-[16px] font-medium">3D models</h2>
            <ul className="flex flex-col gap-3 text-[14px]">
              {(modelCredits as { file: string; title: string; creator: string; license: string; licenseUrl: string; page: string; via: string }[]).map((c) => (
                <li key={c.file}>
                  <a href={c.page} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">{c.title}</a>
                  {" "}by {c.creator}, <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">{c.license}</a>, via {c.via}.
                  <span className="text-muted"> Optimised for the web.</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="bib-h">
            <h2 id="bib-h" className="mb-3 text-[16px] font-medium">Scripture</h2>
            <ul className="flex flex-col gap-2 text-[14px]">
              {TRANSLATIONS.map((t) => <li key={t.id}>{t.name} ({t.short}) — {t.note}</li>)}
              <li className="text-muted">Text retrieved from bible-api.com and bundled with URHA so it works offline.</li>
            </ul>
          </section>
          <section aria-labelledby="nar-h">
            <h2 id="nar-h" className="mb-3 text-[16px] font-medium">Scripture narration</h2>
            <p className="text-[14px]">{NARRATOR.name}, {NARRATOR.translation} ({NARRATOR.description}) Streamed from <a href={NARRATOR.source} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">eBible.org</a>, not stored by URHA. Terms: “{NARRATOR.terms}” The device voice option is synthetic text-to-speech provided by your browser.</p>
          </section>
          <section aria-labelledby="mus-h">
            <h2 id="mus-h" className="mb-3 text-[16px] font-medium">Music</h2>
            <p className="mb-3 text-[13px] text-muted">Licences verified on Wikimedia Commons on {MUSIC_VERIFIED_AT.slice(0, 10)}. Streamed from upload.wikimedia.org.</p>
            <ul className="flex flex-col gap-2 text-[14px]">
              {MUSIC.flatMap((c) => c.tracks).map((t) => (
                <li key={t.id}><a href={t.page} target="_blank" rel="noopener noreferrer" className="underline decoration-control underline-offset-4">{t.title}</a> — {t.composition}{t.performer ? `; ${t.performer}` : ""}. <span className="text-muted">{t.rightsBasis}</span></li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="res-h">
            <h2 id="res-h" className="mb-3 text-[16px] font-medium">Learning resources</h2>
            <p className="text-[14px]">Videos remain on YouTube with their creators; URHA links to them. Titles, channels, durations and chapters verified on {VIDEOS_VERIFIED_AT.slice(0, 10)}; documentation links checked on {DOCS_CHECKED_AT.slice(0, 10)}.</p>
          </section>
          <section aria-labelledby="q-h">
            <h2 id="q-h" className="mb-3 text-[16px] font-medium">Quotations</h2>
            <ul className="flex flex-col gap-3 text-[14px]">
              {sourced.map((q) => q.type !== "bible" && q.type !== "urha" && (
                <li key={q.id}><span className="text-ink">{q.author}</span> — {q.source}. <span className="text-muted">{q.verification}</span></li>
              ))}
              <li className="text-muted">Lines marked “URHA — original reflection” were written for URHA and are not attributed to anyone else.</li>
            </ul>
          </section>
          <section aria-labelledby="t-h">
            <h2 id="t-h" className="mb-3 text-[16px] font-medium">Typefaces</h2>
            <p className="text-[14px]">Instrument Sans and Instrument Serif (SIL Open Font License); Noto Sans Syriac (SIL Open Font License).</p>
          </section>
        </div>
      </Canvas>
    </PageEnter>
  );
}
