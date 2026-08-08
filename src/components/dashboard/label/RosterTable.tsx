"use client";

/**
 * components/dashboard/label/RosterTable.tsx
 *
 * The label's landing surface: one row per artist.
 *
 * Why a table and not a chart. The job here is comparison across many named
 * entities plus identity — "who is doing what, and which of them needs me." A pie
 * of 40 artists is unreadable and a 40-series line chart is worse. A dense,
 * sortable table with one sparkline per row answers the question directly, and
 * scales from 2 artists to 200 without changing shape.
 *
 * Below `md` that table becomes a stacked card per artist. A horizontally
 * scrolling table is the wrong shape for a phone, and this is the label's primary
 * screen — the columns are re-laid out rather than pushed off-screen. Both
 * renderings read the same sorted `rows` and drive the same `toggle`, so sorting
 * is not a desktop-only affordance.
 *
 * Colour is deliberately restrained. Rows carry no categorical hue — with an
 * unbounded roster there is no fixed hue order to assign, and cycling colours
 * would break the rule that colour follows the entity rather than its position.
 * The only hues present are the platform dot (fixed per platform, from theme.ts)
 * and status colours on the coverage flag. Everything else is ink.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ArrowDown, ArrowUp, ChevronRight, AlertTriangle } from "lucide-react";
import { Sparkline } from "@/components/dashboard/analytics-v2/charts";
import { Shimmer } from "@/components/dashboard/analytics-v2/primitives";
import {
  INK,
  STATUS,
  formatCompact,
  formatFull,
  platformColor,
} from "@/components/dashboard/analytics-v2/theme";
import type { Roster, RosterArtist } from "@/lib/api/analytics-v2";

type SortKey = "streams" | "name" | "share";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "streams", label: "Streams" },
  { key: "share", label: "Share" },
  { key: "name", label: "Name" },
];

/** A roster row whose data cannot reach a chart is worth saying out loud. */
function coverageGap(artist: RosterArtist): string | null {
  const dims = artist.coverage?.dimensions ?? [];
  // `platforms` is a map keyed by platform, not a list.
  const incomplete = dims.filter((d) =>
    Object.values(d.platforms ?? {}).some((p) => !p.available || !p.complete)
  );
  if (incomplete.length === 0) return null;
  return incomplete.length === 1
    ? `${incomplete[0].label ?? incomplete[0].key} incomplete`
    : `${incomplete.length} breakdowns incomplete`;
}

function shareLabel(share: number): string {
  return share > 0 && share < 0.001 ? "<0.1%" : `${(share * 100).toFixed(1)}%`;
}

/**
 * Declared at module scope, not inside RosterTable. A component created during
 * render is a new type on every pass, so React unmounts and remounts it — the sort
 * buttons would lose focus mid-interaction.
 */
function Header({
  label,
  k,
  right = false,
  className = "",
  sort,
  asc,
  onSort,
}: {
  label: string;
  k?: SortKey;
  right?: boolean;
  className?: string;
  sort: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-3 py-3 text-[10px] font-semibold uppercase tracking-wider ${
        right ? "text-right" : "text-left"
      } ${className}`}
      style={{ color: INK.muted }}
      aria-sort={k && sort === k ? (asc ? "ascending" : "descending") : undefined}
    >
      {k ? (
        <button
          type="button"
          onClick={() => onSort(k)}
          className="inline-flex items-center gap-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
        >
          {label}
          <ArrowUpDown className="h-3 w-3 shrink-0" aria-hidden />
        </button>
      ) : (
        label
      )}
    </th>
  );
}

/**
 * The mobile sort control. The table headers are the desktop affordance and they
 * are gone below `md`, so sorting needs its own surface rather than disappearing
 * with the columns it lived in.
 */
function MobileSort({
  sort,
  asc,
  onSort,
}: {
  sort: SortKey;
  asc: boolean;
  onSort: (k: SortKey) => void;
}) {
  const Arrow = asc ? ArrowUp : ArrowDown;

  return (
    <div
      role="group"
      aria-label="Sort roster"
      className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-4 pb-3 sm:px-5 md:hidden"
    >
      <span className="font-body text-[10px] uppercase tracking-wider" style={{ color: INK.muted }}>
        Sort
      </span>
      {SORT_OPTIONS.map((opt) => {
        const active = opt.key === sort;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSort(opt.key)}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 font-body text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
              active
                ? "border-[#C30100]/45 bg-[#C30100]/15 text-white"
                : "border-transparent text-white/45 hover:border-white/10 hover:text-white/80",
            ].join(" ")}
          >
            {opt.label}
            {active && <Arrow className="h-3 w-3 shrink-0" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

function ArtistAvatar({ artist }: { artist: RosterArtist }) {
  const initial = (artist.name ?? "?").trim().charAt(0).toUpperCase();

  return artist.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={artist.image_url}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: "rgba(255,255,255,0.06)", color: INK.secondary }}
    >
      {initial}
    </span>
  );
}

function CoverageFlag({ gap }: { gap: string }) {
  // The gap sits on the artist's own row — never a page footnote. A label
  // scanning 40 rows cannot infer which one is short.
  return (
    <span
      className="mt-0.5 flex items-start gap-1 text-[10px] leading-tight"
      style={{ color: STATUS.warning }}
    >
      <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
      <span className="min-w-0 break-words">{gap}</span>
    </span>
  );
}

function TopPlatform({ artist }: { artist: RosterArtist }) {
  if (!artist.top_platform) {
    return (
      <span className="font-body text-xs" style={{ color: INK.faint }}>
        —
      </span>
    );
  }

  return (
    <span
      className="inline-flex min-w-0 max-w-full items-center gap-2 font-body text-xs"
      style={{ color: INK.secondary }}
    >
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: platformColor(artist.top_platform.key) }}
      />
      <span className="truncate">{artist.top_platform.label}</span>
    </span>
  );
}

/**
 * One artist as a stacked card. Used below `md` in place of a table row.
 *
 * The whole row is activated by a stretched <button> laid over it rather than by
 * wrapping the content: a real button can only contain phrasing content, and the
 * sparkline is a recharts <div>. The overlay keeps a genuine focusable control with
 * a visible ring — the desktop row leans on an sr-only link for that, which would
 * give a touch target no focus state at all.
 */
function ArtistCard({
  artist,
  index,
  onOpen,
}: {
  artist: RosterArtist;
  index: number;
  onOpen: () => void;
}) {
  const gap = coverageGap(artist);
  const points = (artist.trend ?? []).map((t) => ({ value: t.streams }));
  const name = artist.name ?? `Profile ${artist.artist_profile_id}`;

  return (
    <li
      className="av2-enter group relative"
      style={{ "--av2-delay": `${Math.min(index, 12) * 40}ms` } as React.CSSProperties}
    >
      <div className="flex items-start gap-3 px-4 py-3 transition-colors group-hover:bg-white/[0.02] group-focus-within:bg-white/[0.03] sm:px-5">
        <ArtistAvatar artist={artist} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div
                className="truncate font-body text-sm font-semibold"
                style={{ color: INK.primary }}
              >
                {name}
              </div>
              {gap && <CoverageFlag gap={gap} />}
            </div>
            <ChevronRight
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: INK.faint }}
              aria-hidden
            />
          </div>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div
                className="font-body text-base tabular-nums"
                style={{ color: INK.primary }}
                title={formatFull(artist.streams)}
              >
                {formatCompact(artist.streams)}
              </div>
              <div className="font-body text-[10px]" style={{ color: INK.muted }}>
                {shareLabel(artist.share)} of roster
              </div>
            </div>

            <div className="h-8 w-20 shrink-0 overflow-hidden xs:w-28">
              {points.length > 1 ? (
                <Sparkline points={points} height={32} />
              ) : (
                <div
                  className="flex h-full items-end justify-end font-body text-xs"
                  style={{ color: INK.faint }}
                >
                  —
                </div>
              )}
            </div>
          </div>

          <div className="mt-1.5 min-w-0">
            <TopPlatform artist={artist} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 h-full w-full rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#C30100]"
      >
        <span className="sr-only">Open {name}</span>
      </button>
    </li>
  );
}

export function RosterTable({
  roster,
  isLoading,
  onOpenArtist,
}: {
  roster: Roster | null;
  isLoading: boolean;
  onOpenArtist: (artistProfileId: number) => void;
}) {
  const [sort, setSort] = useState<SortKey>("streams");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => {
    const list = [...(roster?.artists ?? [])];
    list.sort((a, b) => {
      const d =
        sort === "name"
          ? (a.name ?? "").localeCompare(b.name ?? "")
          : sort === "share"
            ? a.share - b.share
            : a.streams - b.streams;
      return asc ? d : -d;
    });
    return list;
  }, [roster, sort, asc]);

  const toggle = (key: SortKey) => {
    if (key === sort) {
      setAsc((v) => !v);
      return;
    }
    setSort(key);
    setAsc(key === "name");
  };

  if (isLoading && !roster) {
    return (
      <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="px-4 pb-12 pt-4 text-center sm:px-5 sm:pb-16">
        <p className="font-body text-sm" style={{ color: INK.muted }}>
          No artists on your roster yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <MobileSort sort={sort} asc={asc} onSort={toggle} />

      {/* Phone: one stacked card per artist. No horizontal scroll. */}
      <ul className="divide-y divide-white/[0.04] pb-2 md:hidden">
        {rows.map((a, i) => (
          <ArtistCard
            key={a.artist_profile_id}
            artist={a}
            index={i}
            onOpen={() => onOpenArtist(a.artist_profile_id)}
          />
        ))}
      </ul>

      {/* Tablet and up: the dense table. Trend only once there is room for it. */}
      <div className="hidden overflow-x-auto pb-2 md:block">
        <table className="w-full min-w-[560px] border-collapse lg:min-w-[680px]">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Header
                label="Artist"
                k="name"
                className="pl-4 sm:pl-5"
                sort={sort}
                asc={asc}
                onSort={toggle}
              />
              <Header label="Streams" k="streams" right sort={sort} asc={asc} onSort={toggle} />
              <Header label="Share" k="share" right sort={sort} asc={asc} onSort={toggle} />
              <Header
                label="Trend"
                className="hidden lg:table-cell"
                sort={sort}
                asc={asc}
                onSort={toggle}
              />
              <Header label="Top platform" sort={sort} asc={asc} onSort={toggle} />
              <th scope="col" className="w-8 px-3 py-3 pr-4 sm:pr-5">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((a, i) => {
              const gap = coverageGap(a);
              const points = (a.trend ?? []).map((t) => ({ value: t.streams }));

              return (
                <tr
                  key={a.artist_profile_id}
                  className="av2-enter group cursor-pointer transition-colors"
                  style={
                    {
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      "--av2-delay": `${Math.min(i, 12) * 40}ms`,
                    } as React.CSSProperties
                  }
                  onClick={() => onOpenArtist(a.artist_profile_id)}
                >
                  <td className="px-3 py-3 pl-4 sm:pl-5">
                    <div className="flex items-center gap-3">
                      <ArtistAvatar artist={a} />
                      <div className="min-w-0 max-w-[200px] lg:max-w-[300px]">
                        <div
                          className="truncate font-body text-sm font-semibold"
                          style={{ color: INK.primary }}
                        >
                          {a.name ?? `Profile ${a.artist_profile_id}`}
                        </div>
                        {gap && <CoverageFlag gap={gap} />}
                      </div>
                    </div>
                  </td>

                  <td
                    className="whitespace-nowrap px-3 py-3 text-right font-body text-sm tabular-nums"
                    style={{ color: INK.primary }}
                    title={formatFull(a.streams)}
                  >
                    {formatCompact(a.streams)}
                  </td>

                  <td
                    className="whitespace-nowrap px-3 py-3 text-right font-body text-sm tabular-nums"
                    style={{ color: INK.secondary }}
                  >
                    {shareLabel(a.share)}
                  </td>

                  <td className="hidden px-3 py-3 lg:table-cell">
                    <div className="h-8 w-28 overflow-hidden">
                      {points.length > 1 ? (
                        <Sparkline points={points} height={32} />
                      ) : (
                        <span className="font-body text-xs" style={{ color: INK.faint }}>
                          —
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="max-w-[140px] lg:max-w-[200px]">
                      <TopPlatform artist={a} />
                    </div>
                  </td>

                  <td className="px-3 py-3 pr-4 text-right sm:pr-5">
                    <ChevronRight
                      className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60"
                      style={{ color: INK.secondary }}
                      aria-hidden
                    />
                    <Link
                      href="/dashboard/analytics-v2"
                      className="sr-only"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenArtist(a.artist_profile_id);
                      }}
                    >
                      Open {a.name ?? "artist"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
