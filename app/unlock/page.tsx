import type { Metadata } from "next";
import { Canvas } from "@/components/ui";
import { UnlockForm } from "@/components/discovery/UnlockForm";

export const metadata: Metadata = { title: "Unlock", robots: { index: false, follow: false } };

/** The one page open to everyone, because it is how the owner gets in away from their own machine. */
export default function UnlockPage() {
  return (
    <Canvas>
      <div className="mx-auto mt-10 max-w-[420px]">
        <h1 className="mb-4 font-serif text-[34px] leading-[1.1]">URHA is locked</h1>
        <UnlockForm />
      </div>
    </Canvas>
  );
}
