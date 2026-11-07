import Link from "next/link";
import { Canvas } from "@/components/ui";

export default function NotFound() {
  return (
    <Canvas>
      <h1 className="font-serif text-[40px]">This road does not exist.</h1>
      <p className="mt-3 text-[16px] text-muted">The page may have moved, or the link is mistyped.</p>
      <Link href="/" className="btn btn-primary mt-6">Return home</Link>
    </Canvas>
  );
}
