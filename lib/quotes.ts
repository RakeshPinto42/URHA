/**
 * Quotation system (PRD §16).
 *
 * Four content types, never blended:
 * - "bible": text is NOT stored here. It is resolved at runtime from the
 *   public-domain translation files (data/scripture/*.json) so it is exact.
 * - "historical" / "scientific": author + original source + verification note.
 *   Each was checked against Wikiquote's sourced section on 2026-11-02.
 * - "urha": original reflections written for URHA. Never attributed to anyone else.
 */
import { verseText, type Translation } from "./scripture";

export type QuoteType = "bible" | "historical" | "scientific" | "urha";
export type Placement = "home" | "session" | "completion" | "meditation" | "weekly";

type QuoteBase = { id: string; type: QuoteType; placements: Placement[] };
export type BibleQuoteDef = QuoteBase & { type: "bible"; verseId: string; context: string };
export type SourcedQuoteDef = QuoteBase & {
  type: "historical" | "scientific";
  text: string;
  author: string;
  source: string;
  verification: string;
};
export type UrhaQuoteDef = QuoteBase & { type: "urha"; text: string };
export type QuoteDef = BibleQuoteDef | SourcedQuoteDef | UrhaQuoteDef;

export const QUOTES: QuoteDef[] = [
  { id: "b1", type: "bible", verseId: "q-prov-1-7", placements: ["home", "session"], context: "The opening motto of Proverbs, a collection of Hebrew wisdom sayings." },
  { id: "b2", type: "bible", verseId: "q-prov-4-7", placements: ["home", "session"], context: "A father's instruction to a son on valuing wisdom above possessions." },
  { id: "b3", type: "bible", verseId: "q-prov-18-15", placements: ["home", "session"], context: "One of the short independent sayings in Proverbs 10–22." },
  { id: "b4", type: "bible", verseId: "q-prov-24-3", placements: ["home", "completion"], context: "From the 'sayings of the wise' section (Proverbs 22:17–24:22) and its appendix." },
  { id: "b5", type: "bible", verseId: "q-prov-27-17", placements: ["home", "weekly"], context: "A proverb about how people sharpen one another." },
  { id: "b6", type: "bible", verseId: "q-eccl-9-10", placements: ["home", "session"], context: "The Teacher (Qoheleth) urging full effort within life's limits." },
  { id: "b7", type: "bible", verseId: "q-col-3-23", placements: ["home", "completion"], context: "Paul's letter to the church at Colossae, in household instructions." },
  { id: "b8", type: "bible", verseId: "q-jas-1-5", placements: ["home", "meditation"], context: "The letter of James, in a passage on trials and endurance." },
  { id: "b9", type: "bible", verseId: "q-mt-7-7", placements: ["home", "session"], context: "Part of the Sermon on the Mount (Matthew 5–7)." },
  { id: "b10", type: "bible", verseId: "q-php-4-8", placements: ["home", "meditation"], context: "Paul's letter to the Philippians, near its close." },
  { id: "b11", type: "bible", verseId: "q-mic-6-8", placements: ["home", "weekly"], context: "The prophet Micah summarising what is required of a person." },
  { id: "b12", type: "bible", verseId: "q-mt-7-24", placements: ["home", "completion"], context: "The closing parable of the Sermon on the Mount: the wise builder." },
  { id: "h1", type: "scientific", placements: ["home", "session"],
    text: "The first principle is that you must not fool yourself — and you are the easiest person to fool.",
    author: "Richard Feynman", source: "\"Cargo Cult Science\", Caltech commencement address, 1974",
    verification: "Checked against Wikiquote (sourced) on 2026-11-02." },
  { id: "h2", type: "scientific", placements: ["home", "completion"],
    text: "What I cannot create, I do not understand.",
    author: "Richard Feynman", source: "Written on his Caltech blackboard at the time of his death, February 1988 (Caltech Archives)",
    verification: "Checked against Wikiquote (sourced) on 2026-11-02." },
  { id: "h3", type: "scientific", placements: ["home", "session"],
    text: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra", source: "EWD498, \"How do we tell truths that might hurt?\", 1975",
    verification: "Checked against Wikiquote (sourced) on 2026-11-02." },
  { id: "h4", type: "historical", placements: ["home", "weekly"],
    text: "The process is mutual; for men learn while they teach.",
    author: "Seneca", source: "Epistulae Morales ad Lucilium, Letter VII.8 (trans. R. M. Gummere, 1917–25)",
    verification: "Checked against Wikiquote (sourced) on 2026-11-02." },
  { id: "h5", type: "scientific", placements: ["home", "session"],
    text: "Everyone knows that debugging is twice as hard as writing a program in the first place.",
    author: "Brian W. Kernighan and P. J. Plauger", source: "The Elements of Programming Style, 2nd edition, chapter 2, 1978",
    verification: "Checked against Wikiquote (sourced) on 2026-11-02." },
  { id: "u1", type: "urha", placements: ["home", "completion"], text: "Watching is not knowing. Building is knowing. Explaining it to someone else is proof." },
  { id: "u2", type: "urha", placements: ["home", "session"], text: "One honest hour of practice outweighs a week of collected tabs." },
  { id: "u3", type: "urha", placements: ["home", "weekly"], text: "The road is long on purpose. Each milestone only asks for the next step." },
  { id: "u4", type: "urha", placements: ["home", "completion"], text: "When it breaks and you know why, you have learnt it." },
];

export type ResolvedQuote = {
  id: string;
  type: QuoteType;
  text: string;
  attribution: string; // what is printed under the quote
  detail: string; // context or source, shown on demand
  typeLabel: string;
};

const TYPE_LABEL: Record<QuoteType, string> = {
  bible: "Scripture",
  historical: "Historical",
  scientific: "Science and engineering",
  urha: "URHA reflection",
};

/** Resolve a quote to printable text. Returns null (never invents) if scripture text is missing. */
export function resolveQuote(q: QuoteDef, translation: Translation = "web"): ResolvedQuote | null {
  if (q.type === "bible") {
    const v = verseText(q.verseId, translation);
    if (!v) return null;
    return { id: q.id, type: q.type, text: v.text, attribution: `${v.reference} (${v.translationShort})`, detail: q.context, typeLabel: TYPE_LABEL.bible };
  }
  if (q.type === "urha") {
    return { id: q.id, type: q.type, text: q.text, attribution: "URHA — original reflection", detail: "Written for URHA. Not attributed to any historical figure.", typeLabel: TYPE_LABEL.urha };
  }
  return { id: q.id, type: q.type, text: q.text, attribution: q.author, detail: `${q.source}. ${q.verification}`, typeLabel: TYPE_LABEL[q.type] };
}

/** Deterministic daily pick for a placement: same quote all day, no repeats on consecutive days. */
export function quoteForDay(placement: Placement, isoDate: string, translation: Translation = "web"): ResolvedQuote | null {
  const pool = QUOTES.filter((q) => q.placements.includes(placement));
  if (pool.length === 0) return null;
  const day = Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000);
  for (let i = 0; i < pool.length; i++) {
    const q = pool[(day + i) % pool.length]!;
    const r = resolveQuote(q, translation);
    if (r) return r;
  }
  return null;
}
