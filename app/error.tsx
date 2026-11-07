"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto w-full max-w-column px-4 pt-12 sm:px-6">
      <h1 className="text-[24px] font-semibold">Something went wrong loading this page.</h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-muted">
        Your saved data is unchanged. If this keeps happening, check that the database file in <code>data/</code> is readable and that no other copy of URHA is running.
        {error.digest ? ` Reference: ${error.digest}.` : ""}
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
