import { connection } from "next/server";
import { homeModel } from "@/lib/home";
import { RealmHome, type RealmNext } from "@/components/realm/RealmHome";

/** The Realm of Wisdom. The day's work, once here, now lives at /today. */
export default async function Realm() {
  await connection();
  const m = homeModel();
  const next: RealmNext = m.focus
    ? { label: "Continue with", title: m.focus.title, href: `/academy/${m.focus.id}` }
    : null;
  return <RealmHome next={next} />;
}
