"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { request } from "@/lib/api/core";

export interface SpotifyArtist {
  spotify_id: string | null;
  name: string | null;
  spotify_url: string | null;
  image_url: string | null;
  followers: number;
}

const ARTIST_LINK = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?artist\/[A-Za-z0-9]+/i;

/** Spotify stopped sending follower counts to apps like ours; 0 means "unknown", not zero. */
function followers(n: number): string {
  if (!n) return "On Spotify";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M followers`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K followers`;
  return n === 1 ? "1 follower" : `${n} followers`;
}

/**
 * Find yourself on Spotify by name, or paste your artist link. Picking one brings the photo,
 * genres and Spotify link onto the new kit. Not on Spotify yet is fine too.
 */
export function ArtistFinder({
  initialQuery,
  busy,
  error,
  onCreate,
}: {
  initialQuery: string;
  busy: boolean;
  error: string | null;
  onCreate: (stageName: string, spotifyUrl: string | null) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SpotifyArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [picked, setPicked] = useState<SpotifyArtist | null>(null);
  const [nameOnly, setNameOnly] = useState(false);
  const [stageName, setStageName] = useState(initialQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const look = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    const text = q.trim();
    timer.current = setTimeout(async () => {
      const mine = ++seq.current;
      if (text.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      setSearchError(null);

      const link = text.match(ARTIST_LINK)?.[0];
      let found: SpotifyArtist[] = [];
      if (link) {
        const res = await request<{ artist?: SpotifyArtist } & SpotifyArtist>(
          "/verify-spotify-url",
          { method: "POST", body: JSON.stringify({ spotify_url: `https://${link}` }) },
          true
        );
        if (mine !== seq.current) return;
        const artist = (res.data as { artist?: SpotifyArtist } | null)?.artist;
        if (artist) found = [artist];
        else setSearchError(res.error ?? "We couldn't find that artist link.");
      } else {
        const res = await request<{ artists?: SpotifyArtist[] }>(
          `/search/artists?query=${encodeURIComponent(text)}`,
          { method: "GET" },
          true
        );
        if (mine !== seq.current) return;
        found = ((res.data as { artists?: SpotifyArtist[] } | null)?.artists ?? []).slice(0, 6);
        if (res.error) setSearchError("Spotify search isn't answering right now. You can carry on with just the name.");
      }
      setResults(found);
      setSearching(false);
    }, text.match(ARTIST_LINK) ? 0 : 350);
  };

  // Search for the name they typed on the landing page.
  useEffect(() => {
    if (initialQuery.trim()) look(initialQuery);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (a: SpotifyArtist) => {
    setPicked(a);
    setStageName(a.name ?? query);
  };

  const ready = stageName.trim().length >= 2 && !busy && (picked || nameOnly);

  return (
    <div>
      {!picked && !nameOnly && (
        <>
          <label className="relative mt-8 block">
            <Search className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-white/30" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                look(e.target.value);
              }}
              placeholder="Search Spotify, or paste your link"
              aria-label="Search Spotify for your artist name, or paste your Spotify artist link"
              className="w-full border-b-2 border-white/20 bg-transparent pb-3 pl-10 text-[26px] outline-none placeholder:text-white/20 focus:border-[#FF5A1F] sm:text-[30px]"
              style={{ fontFamily: "var(--font-epk-serif)" }}
            />
          </label>

          <div className="mt-4 min-h-[60px]" aria-live="polite">
            {searching && (
              <p className="flex items-center gap-2 text-[14px] text-white/45">
                <Loader2 className="h-4 w-4 animate-spin" /> Looking on Spotify…
              </p>
            )}
            {!searching && searchError && <p className="text-[14px] text-[#FF7A5C]">{searchError}</p>}
            {!searching && results.length > 0 && (
              <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                {results.map((a) => (
                  <li key={a.spotify_id ?? a.spotify_url ?? a.name} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => choose(a)}
                      className="flex min-w-0 flex-1 items-center gap-3.5 px-4 py-3 text-left transition hover:bg-white/[0.05]"
                    >
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                        {a.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-semibold">{a.name}</span>
                        <span className="block text-[13px] text-white/45">{followers(a.followers ?? 0)}</span>
                      </span>
                      <span className="text-[13px] text-white/40">That&apos;s me</span>
                    </button>
                    {a.spotify_url && (
                      <a
                        href={a.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-4 py-3 text-[12.5px] text-white/35 hover:text-[#1ED760]"
                        aria-label={`Open ${a.name} on Spotify`}
                      >
                        Check ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-[14px] text-white/45">Nobody by that name on Spotify.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setNameOnly(true);
              if (!stageName.trim() && !ARTIST_LINK.test(query)) setStageName(query.trim());
            }}
            className="mt-6 text-[14px] text-white/55 underline underline-offset-4 hover:text-white"
          >
            Not on Spotify yet? Use just your name
          </button>
        </>
      )}

      {(picked || nameOnly) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onCreate(stageName.trim(), picked?.spotify_url ?? null);
          }}
          className="mt-8"
        >
          {picked && (
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4">
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                {picked.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picked.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[17px] font-semibold">
                  {picked.name} <Check className="h-4 w-4 text-[#1ED760]" aria-label="On Spotify" />
                </span>
                <span className="block text-[13px] text-white/45">
                  {followers(picked.followers ?? 0)} · your photo and releases come with it
                </span>
              </span>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-[13px] text-white/50">Name on your press kit</span>
            <input
              autoFocus={nameOnly}
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              maxLength={50}
              placeholder="Artist name"
              className="w-full border-b-2 border-white/20 bg-transparent pb-3 text-[32px] outline-none placeholder:text-white/20 focus:border-[#FF5A1F]"
              style={{ fontFamily: "var(--font-epk-serif)" }}
            />
          </label>

          {error && <p className="mt-3 text-[14px] text-[#FF7A5C]">{error}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={!ready}
              className="rounded-full bg-[#FF5A1F] px-6 py-3.5 text-[15px] font-semibold text-black transition hover:brightness-105 disabled:opacity-50"
            >
              {busy ? "Setting it up…" : "Build my press kit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setNameOnly(false);
              }}
              className="text-[14px] text-white/50 hover:text-white"
            >
              {picked ? "Not me" : "Search Spotify instead"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
