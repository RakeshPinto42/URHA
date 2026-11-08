"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Away from the owner's machine, the whole app needs the access token. */
export function UnlockForm() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
    if (!r) { setError("The app's server did not respond."); return; }
    if (!r.ok) { setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "This could not be unlocked."); return; }
    setToken("");
    router.replace("/");
    router.refresh();
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="card-row flex h-full flex-col gap-2 p-4">
      <p className="text-[13px] text-muted">Enter the access token to continue.</p>
      <label className="flex flex-col gap-1 text-[13px] text-muted">Access token
        <input type="password" autoComplete="current-password" className="input h-9" value={token} onChange={(e) => setToken(e.target.value)} required />
      </label>
      <button type="submit" className="btn btn-primary self-start">Unlock</button>
      {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
    </form>
  );
}
