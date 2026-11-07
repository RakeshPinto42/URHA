import type { Metadata } from "next";
import { LaterRelease } from "@/components/LaterRelease";
export const metadata: Metadata = { title: "Insights" };
export default function Page() {
  return <LaterRelease art="galilee" section="insights" title="Insights" purpose="Progress and learning analytics that keep activity and competence apart."
    plans={["Weekly study hours and planned against actual effort over time", "Phase and topic completion, skill progression and assessment performance", "Project milestones and practical evidence", "Learning consistency"]}
    now={[{ href: "/", label: "This week's logged hours on Home" }, { href: "/tasks?view=week", label: "Planned against actual in the week view" }, { href: "/path", label: "Studied, practised and demonstrated counts on My Path" }]} />;
}
