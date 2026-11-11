"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Delete a press kit, with the artist name typed to confirm.
 *
 * A getepk artist goes with it; a SongDis artist keeps their profile and releases and only
 * loses the kit (the server decides, this copy just says which).
 */
export function DeleteKit({
  name,
  songdis,
  onDelete,
}: {
  name: string;
  songdis: boolean;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = typed.trim().toLowerCase() === name.trim().toLowerCase();

  const go = async () => {
    if (!match) return;
    setBusy(true);
    setError(null);
    const res = await onDelete();
    if (!res.ok) {
      setError(res.error ?? "Could not delete this press kit.");
      setBusy(false);
    }
  };

  return (
    <section className="mt-16 border-t border-white/[0.07] pt-8">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[13.5px] text-white/40 hover:text-[#FF7A5C]"
        >
          <Trash2 className="h-4 w-4" /> Delete this press kit
        </button>
      ) : (
        <div className="max-w-[520px] rounded-2xl border border-[#FF5A1F]/30 bg-[#FF5A1F]/[0.05] p-5">
          <h2 className="text-[17px] font-semibold">Delete {name}&apos;s press kit?</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-white/60">
            {songdis
              ? "The page goes offline and its photos, quotes and added releases are removed. Your SongDis profile and releases are not touched."
              : "The page goes offline, and the artist, photos, quotes and releases on it are removed. This can't be undone."}
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] text-white/50">
              Type <span className="text-white">{name}</span> to confirm
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="w-full rounded-xl bg-black/30 px-4 py-2.5 text-[15px] outline-none ring-1 ring-white/15 focus:ring-[#FF5A1F]"
            />
          </label>
          {error && <p className="mt-3 text-[13.5px] text-[#FF7A5C]">{error}</p>}
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => void go()}
              disabled={!match || busy}
              className="rounded-full bg-[#FF5A1F] px-5 py-2.5 text-[14px] font-semibold text-black disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete press kit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
              }}
              className="text-[14px] text-white/50 hover:text-white"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
