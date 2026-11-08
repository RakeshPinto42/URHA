import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { StudioLoader } from "@/components/studio/StudioLoader";
import { listSceneIds, studioAllowed } from "@/lib/studio-access";

export const metadata: Metadata = { title: "Environment editor", robots: { index: false } };

/** Development, URHA_STUDIO=1, or Editor mode from Settings; and only from this machine. See lib/studio-access.ts. */
export default async function StudioPage() {
  await connection();
  if (!studioAllowed((await headers()).get("host"))) notFound();
  return <StudioLoader scenes={await listSceneIds()} />;
}
