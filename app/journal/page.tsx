import type { Metadata } from "next";
import { LaterRelease } from "@/components/LaterRelease";
export const metadata: Metadata = { title: "Journal" };
export default function Page() {
  return <LaterRelease art="leaf" section="journal" title="Journal" purpose="A private repository of concepts, code examples, errors and their fixes, decisions and open questions."
    plans={["Note types: concept, code example, error and solution, technical decision, project insight, useful resource, reflection, open question", "Markdown and code snippets", "Links to topics and projects", "Search across every note"]}
    now={[{ href: "/academy", label: "Topic notes on every Academy topic" }, { href: "/meditation", label: "Passage reflections in the Quiet Room" }]} />;
}
