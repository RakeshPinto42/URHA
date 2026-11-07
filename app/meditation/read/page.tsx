import Link from "next/link";
import type { Metadata } from "next";
import { BOOKS, NARRATOR } from "@/lib/narration";
import { NightRoom } from "@/components/meditation/NightRoom";

export const metadata: Metadata = { title: "Read and listen" };

export default function ReaderIndex() {
  const ot = BOOKS.slice(0, 39);
  const nt = BOOKS.slice(39);
  const Group = ({ title, books }: { title: string; books: typeof BOOKS }) => (
    <section aria-labelledby={`g-${title}`} className="flex flex-col gap-4">
      <h2 id={`g-${title}`} className="font-serif text-[28px]">{title}</h2>
      <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b) => (
          <li key={b.book} className="border-b border-border">
            <details className="group">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between py-2 text-[16px] hover:text-accent [&::-webkit-details-marker]:hidden">
                {b.book}<span className="num text-[13px] text-muted">{b.chapters}</span>
              </summary>
              <ol className="grid grid-cols-6 gap-1 pb-3 sm:grid-cols-8" aria-label={`${b.book} chapters`}>
                {Array.from({ length: b.chapters }, (_, i) => (
                  <li key={i}><Link href={`/meditation/read/${encodeURIComponent(b.book)}/${i + 1}`} className="num grid h-10 place-items-center rounded-md text-[13px] hover:bg-active">{i + 1}</Link></li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <NightRoom back={{ href: "/meditation", label: "Meditation" }} title="Read and listen">
      <div className="mx-auto w-full max-w-column px-4 pb-32 pt-6 sm:px-6 lg:pt-12">
        <header className="mb-12 max-w-[62ch]">
          <h1 className="font-serif text-[44px] leading-none sm:text-[60px]">Read and listen</h1>
          <p className="mt-4 text-[17px] text-muted">
            Any chapter of the World English Bible, read by {NARRATOR.name} — a human narrator, one recording per chapter — with the text beside it. The King James text is available too.
          </p>
        </header>
        <div className="flex flex-col gap-14">
          <Group title="Old Testament" books={ot} />
          <Group title="New Testament" books={nt} />
        </div>
      </div>
    </NightRoom>
  );
}
