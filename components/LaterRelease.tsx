import Link from "next/link";
import { Canvas } from "./ui";
import { FrontispieceBand, RisingTitle } from "./Frontispiece";
import type { ArtId } from "@/lib/art";
import type { SectionId } from "@/lib/cinema";
import { PageEnter } from "./Motion";

/** Honest placeholder for a Release 2 section: what it will do, and where the related data lives today. No fake controls. */
export function LaterRelease({ title, purpose, plans, now, art, section }: { art: ArtId; section: SectionId; title: string; purpose: string; plans: string[]; now: { href: string; label: string }[] }) {
  return (
    <PageEnter>
      <FrontispieceBand art={art} section={section} height="compact" showCaption={false}>
        <RisingTitle text={title} className="font-serif text-[40px] leading-[1.05] sm:text-[52px]" />
        <p className="mt-2 max-w-[62ch] text-[15px] text-[#f7f7f5]/90">{purpose}</p>
      </FrontispieceBand>
      <Canvas>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <section className="panel md:col-span-7" aria-labelledby="plan-h">
            <h2 id="plan-h" className="text-[14px] font-semibold">Arrives in Release 2</h2>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px]">{plans.map((p) => <li key={p}>{p}</li>)}</ul>
          </section>
          <section className="panel md:col-span-5" aria-labelledby="now-h">
            <h2 id="now-h" className="text-[14px] font-semibold">Available now</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[15px]">
              {now.map((n) => <li key={n.href}><Link href={n.href} className="underline decoration-control underline-offset-4 hover:decoration-current">{n.label}</Link></li>)}
            </ul>
          </section>
        </div>
      </Canvas>
    </PageEnter>
  );
}
