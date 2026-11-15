"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { formatReleaseDate, releaseYear } from "../_format";

export interface StudioRelease {
  id: number;
  title: string;
  cover: string | null;
  spotify_url: string | null;
  type: string | null;
  released_on: string | null;
  year: string | null;
  isFeatured: boolean;
}

/** How many show before "Show all": the newest (large) plus 8 fills whole rows on phone, tablet and desktop. */
const FIRST = 9;

const display: CSSProperties = { fontFamily: "var(--font-studio-display)" };

function ReleaseLink({ slug, r, className, children }: { slug: string | null; r: StudioRelease; className?: string; children: ReactNode }) {
  // Added releases link out; SongDis releases have their own page (see PressKitView).
  return r.spotify_url ? (
    <a href={r.spotify_url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={`/k/${slug}/r/${r.id}`} className={className}>
      {children}
    </Link>
  );
}

function badge(r: StudioRelease): string {
  if (r.type === "single") return "New single";
  if (r.type === "album_ep") return "New album";
  return "Latest";
}

/** Releases as a grid going down the page: the newest large, the rest in a tidy grid. */
export default function StudioReleases({ slug, releases }: { slug: string | null; releases: StudioRelease[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? releases : releases.slice(0, FIRST);
  const more = releases.length - FIRST;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((r) => (
          <ReleaseLink
            key={r.spotify_url ?? `songdis:${r.id}`}
            slug={slug}
            r={r}
            className={`group min-w-0 ${r.isFeatured ? "col-span-2 sm:row-span-2" : ""}`}
          >
            <span className="relative block aspect-square overflow-hidden rounded-[22px] bg-[var(--pk-tint)] shadow-[0_18px_40px_-24px_rgba(0,0,0,.45)]">
              {r.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.cover} alt={r.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
              )}
              {r.isFeatured && (
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#151515] backdrop-blur">
                  {badge(r)}
                </span>
              )}
              <span className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-white text-[#151515] opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
              </span>
            </span>
            <span className={`mt-3 block truncate font-bold text-[var(--pk-text)] ${r.isFeatured ? "text-[22px]" : "text-[15px]"}`} style={display}>
              {r.title}
            </span>
            <span className="block text-[13px] text-[var(--pk-muted)]">
              {r.isFeatured && r.released_on ? formatReleaseDate(r.released_on) : r.year ? releaseYear(r.year) : ""}
            </span>
          </ReleaseLink>
        ))}
      </div>
      {more > 0 && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--pk-line)] bg-white px-5 py-3 text-[14px] font-semibold text-[var(--pk-text)] transition hover:border-[var(--pk-accent)]"
        >
          {all ? "Show fewer" : `Show all ${releases.length} releases`}
        </button>
      )}
    </>
  );
}
