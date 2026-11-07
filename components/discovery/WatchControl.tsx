"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WatchControl({ symbol, watched, thesis }: { symbol: string; watched: boolean; thesis: string }) {
  const router = useRouter();
  const [text, setText] = useState(thesis);
  const [note, setNote] = useState<string | null>(null);

  const send = async (body: object, done: string) => {
    const r = await fetch("/api/stocks/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, ...body }) }).catch(() => null);
    setNote(r?.ok ? done : "That could not be saved.");
    if (r?.ok) router.refresh();
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={`btn ${watched ? "btn-secondary" : "btn-primary"} self-start`} onClick={() => void send({ watched: !watched }, watched ? "Removed from the watchlist." : "Added to the watchlist.")}>
        {watched ? "Remove from watchlist" : "Add to watchlist"}
      </button>
      {watched && (
        <>
          <label className="flex flex-col gap-1 text-[13px] text-muted">Your thesis
            <textarea className="input min-h-[96px]" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Why this company, and what would prove you wrong." />
          </label>
          <button type="button" className="btn btn-secondary self-start" onClick={() => void send({ thesis: text }, "Thesis saved.")}>Save thesis</button>
        </>
      )}
      <p className="text-[13px] text-muted" aria-live="polite">{note}</p>
    </div>
  );
}
