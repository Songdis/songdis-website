"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { request } from "@/lib/api/core";
import { Arrow } from "./Poster";

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
 * releases and Spotify link onto the new kit. Not released yet is fine too.
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
  onCreate: (stageName: string, spotifyUrl: string | null, image: string | null) => void;
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
    timer.current = setTimeout(
      async () => {
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
          const res = await request<{ artist?: SpotifyArtist }>(
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
          if (res.error) setSearchError("Spotify search isn't answering right now. You can start with just your name.");
        }
        setResults(found);
        setSearching(false);
      },
      text.match(ARTIST_LINK) ? 0 : 450
    );
  };

  // Search for the name they typed on the landing page.
  useEffect(() => {
    if (initialQuery.trim()) look(initialQuery);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = stageName.trim().length >= 2 && !busy && (picked || nameOnly);

  if (picked || nameOnly) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onCreate(stageName.trim(), picked?.spotify_url ?? null, picked?.image_url ?? null);
        }}
        className="mt-8"
      >
        {picked && (
          <div className="mb-7 flex items-center gap-4 bg-[#F4F4F4] p-4 text-[#101010]">
            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#101010]/10">
              {picked.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={picked.image_url} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="ed block truncate text-[30px]">{picked.name}</span>
              <span className="block text-[13.5px] text-[#3A3A3A]">Your photo, releases and links come with it</span>
            </span>
          </div>
        )}

        <label className="block">
          <span className="el mb-2 block text-[11px] text-white/55">Name on your press kit</span>
          <input
            autoFocus={nameOnly}
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            maxLength={50}
            placeholder="Artist name"
            className="ed w-full border-b-[3px] border-white/25 bg-transparent pb-2 text-[52px] text-white outline-none placeholder:text-white/20 focus:border-[#FF77CD]"
          />
        </label>

        {error && <p className="mt-3 text-[14.5px] font-semibold text-[#FF8A6B]">{error}</p>}

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button type="submit" disabled={!ready} className="group flex min-h-[52px] items-stretch disabled:opacity-50">
            <span className="grid w-[52px] place-items-center bg-[#F4F4F4]">
              <Arrow color="#101010" />
            </span>
            <span className="el flex items-center bg-[#FF77CD] px-6 text-[13px] text-[#101010] group-hover:underline">
              {busy ? "Building it…" : "Build my EPK"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setNameOnly(false);
            }}
            className="text-[14px] font-semibold text-white/55 hover:text-white"
          >
            {picked ? "Not me" : "Search Spotify instead"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <label className="mt-8 flex min-h-[56px] items-center gap-3 rounded-full bg-[#2A2A2A] px-5 focus-within:ring-2 focus-within:ring-[#FF77CD]">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            look(e.target.value);
          }}
          placeholder="Search your name, or paste your Spotify link"
          aria-label="Search Spotify for your artist name, or paste your Spotify artist link"
          className="min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/40"
        />
        {searching && <Loader2 className="h-5 w-5 animate-spin text-white/50" aria-label="Searching" />}
      </label>

      <div className="mt-6 min-h-[80px]" aria-live="polite">
        {!searching && searchError && <p className="text-[14.5px] text-[#FF8A6B]">{searchError}</p>}
        {results.length > 0 && (
          <>
            <p className="text-[17px] font-extrabold">Artists</p>
            <ul className="mt-3 flex flex-col gap-1">
              {results.map((a) => (
                <li key={a.spotify_id ?? a.spotify_url ?? a.name} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(a);
                      setStageName(a.name ?? query);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition hover:bg-white/[0.06]"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                      {a.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.image_url} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16.5px] font-bold">{a.name}</span>
                      <span className="block text-[13px] text-white/50">{followers(a.followers ?? 0)}</span>
                    </span>
                    <span className="el shrink-0 rounded-full bg-white px-3.5 py-2 text-[10.5px] text-[#101010]">That&apos;s me</span>
                  </button>
                  {a.spotify_url && (
                    <a
                      href={a.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-2 py-3 text-[12.5px] text-white/40 hover:text-[#1ED760]"
                      aria-label={`Open ${a.name} on Spotify`}
                    >
                      Check ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] text-white/45">Not you? Keep typing, or paste your Spotify artist link.</p>
          </>
        )}
        {!searching && !searchError && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-[14.5px] text-white/50">Nobody by that name on Spotify.</p>
        )}
      </div>

      <p className="mt-8 text-[14px] text-white/55">
        Not released yet?{" "}
        <button
          type="button"
          onClick={() => {
            setNameOnly(true);
            if (!stageName.trim() && !ARTIST_LINK.test(query)) setStageName(query.trim());
          }}
          className="font-extrabold text-[#FF77CD] hover:underline"
        >
          Start without music
        </button>
      </p>
    </div>
  );
}
