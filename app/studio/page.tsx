import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StudioLoader } from "@/components/studio/StudioLoader";
import { listSceneIds, studioEnabled } from "@/lib/studio-access";

export const metadata: Metadata = { title: "Cinematic Studio", robots: { index: false } };

/** Local only: see lib/studio-access.ts. */
export default async function StudioPage() {
  await connection();
  if (!studioEnabled()) notFound();
  return <StudioLoader scenes={await listSceneIds()} />;
}
