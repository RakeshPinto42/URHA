"use client";
/** Keeps three.js out of every other route: the Studio loads only here, and only in a browser. */
import dynamic from "next/dynamic";

const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => <p className="p-6 text-[14px] text-[#b8ad9c]">Loading the Studio…</p>,
});

export function StudioLoader({ scenes }: { scenes: string[] }) {
  return <Studio sceneIds={scenes} />;
}
