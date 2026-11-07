"use client";
/** Round check control that completes a task in one click. Optimistic; reverts with a message on failure. */
import { useOptimistic, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { quickStatus } from "@/app/actions";

export function TaskDoneButton({ id, title, done = false }: { id: number; title: string; done?: boolean }) {
  const [optimisticDone, setOptimistic] = useOptimistic(done);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="relative flex-none">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimisticDone}
        aria-label={`${optimisticDone ? "Reopen" : "Complete"} “${title}”`}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            setOptimistic(!optimisticDone);
            const r = await quickStatus(id, optimisticDone ? "todo" : "done");
            if (!r?.ok) setError(r?.message ?? "Could not update.");
          })
        }
        className="-m-2.5 grid h-11 w-11 place-items-center rounded-full"
      >
        <span className={`grid h-[22px] w-[22px] place-items-center rounded-full transition-colors ${optimisticDone ? "bg-ink text-ground" : "border-[1.5px] border-control hover:border-ink"}`}>
          {optimisticDone && (
            <motion.svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.18 }}>
              <motion.path d="M5 12l5 5 9-10" />
            </motion.svg>
          )}
        </span>
      </button>
      {error && <span role="alert" className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-raised px-2 py-1 text-[12px] text-negative shadow">{error}</span>}
    </span>
  );
}
