"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { AppShell } from "../_components/AppShell";
import { PENDING_NAME_KEY } from "../_components/AuthShell";
import { useEpkArtists } from "../_components/useEpkArtists";
import { ArtistFinder } from "../_components/ArtistFinder";

export default function EpkHome() {
  const router = useRouter();
  const { data, error, create } = useEpkArtists();
  // The name typed on the landing page, if they came that way.
  const [pending] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem(PENDING_NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const submit = async (stageName: string, spotifyUrl: string | null) => {
    setBusy(true);
    setCreateError(null);
    const res = await create(stageName, spotifyUrl);
    if (res.id) {
      try {
        sessionStorage.removeItem(PENDING_NAME_KEY);
      } catch {}
      router.push(`/app/${res.id}`);
      return;
    }
    setCreateError(res.error ?? null);
    setBusy(false);
  };

  if (error) {
    return (
      <AppShell>
        <p className="text-white/60">{error}</p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      </AppShell>
    );
  }

  const first = data.artists.length === 0;
  const showForm = first || adding;

  return (
    <AppShell>
      {showForm ? (
        <div className="mx-auto max-w-[560px] py-10">
          <h1 className="text-[44px] leading-[1] sm:text-[56px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            {first ? "Let's find you." : "Add an artist."}
          </h1>
          <p className="mt-3 text-[15.5px] text-white/55">
            Search your artist name on Spotify, or paste your Spotify artist link. Your photo and
            releases come with it.
          </p>
          <ArtistFinder initialQuery={pending} busy={busy} error={createError} onCreate={(n, u) => void submit(n, u)} />
          {!first && (
            <button type="button" onClick={() => setAdding(false)} className="mt-8 text-[14px] text-white/40 hover:text-white">
              Cancel
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[40px] leading-[1] sm:text-[52px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
              Your press kits
            </h1>
            {data.can_create && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-[14px] text-white/80 hover:border-white/35 hover:text-white"
              >
                <Plus className="h-4 w-4" /> Add an artist
              </button>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.artists.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/app/${a.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-white/25"
                >
                  <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/[0.06] text-[20px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      a.stage_name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-semibold">{a.stage_name}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-white/45">
                      {a.is_published && a.slug ? `Live at ${a.slug}.getepk.si` : "Not published yet"}
                      {a.source === "songdis" && " · SongDis"}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-[#FF5A1F]" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  );
}
