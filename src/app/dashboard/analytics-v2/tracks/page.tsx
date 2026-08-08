"use client";

/**
 * Analytics v2 — Tracks.
 *
 * A sortable, searchable, paged list; selecting a row opens the detail panel
 * without leaving the page, so the artist keeps the list they were reading.
 *
 * `tracks_streamed` is its own column rather than a derived one: YouTube can
 * report a stream count of zero on a row that still counts as streamed, so the
 * two numbers legitimately disagree.
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Music4, Search, X } from "lucide-react";
import {
  platformLabel,
  type TrackListItem,
  type TrackSort,
} from "@/lib/api/analytics-v2";
import {
  granularityForRange,
  useAnalyticsV2,
  useTrackDetail,
  useTracks,
} from "@/lib/hooks/useAnalyticsV2";
import { AnalyticsV2Shell } from "@/components/dashboard/analytics-v2/Shell";
import { CoverageNotes } from "@/components/dashboard/analytics-v2/CoveragePanel";
import { TimeseriesArea } from "@/components/dashboard/analytics-v2/charts";
import {
  Card,
  CardHeader,
  ChartSkeleton,
  CountUp,
  EmptyState,
  ErrorPanel,
  GhostButton,
  Legend,
  RowsSkeleton,
  SegmentedControl,
} from "@/components/dashboard/analytics-v2/primitives";
import {
  formatCompact,
  formatFull,
  formatRate,
  platformColor,
} from "@/components/dashboard/analytics-v2/theme";

const PER_PAGE = 25;

const SORTS: Array<{ value: TrackSort; label: string }> = [
  { value: "streams", label: "Streams" },
  { value: "tracks_streamed", label: "Tracks streamed" },
  { value: "completed_rate", label: "Completion" },
  { value: "title", label: "Title" },
];

export default function AnalyticsV2TracksPage() {
  return (
    <AnalyticsV2Shell>
      <TracksContent />
    </AnalyticsV2Shell>
  );
}

function TracksContent() {
  const { range } = useAnalyticsV2();
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TrackSort>("streams");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TrackListItem | null>(null);

  // Debounced so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(rawSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const tracks = useTracks({ search, sort, order, page, per_page: PER_PAGE });

  const items = tracks.data?.items ?? [];
  const total = tracks.data?.meta?.total ?? tracks.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <Card index={0}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Tracks"
            subtitle={`${formatFull(total)} in range · ${range.from} to ${range.to}`}
          />

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                size={14}
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                type="text"
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Search titles"
                aria-label="Search tracks by title"
                className="w-full bg-[#140C0C] border border-white/[0.08] rounded-xl pl-9 pr-8 py-2 font-body text-white text-xs placeholder:text-white/25 outline-none focus:border-[#C30100]/50 transition-colors"
              />
              {rawSearch && (
                <button
                  onClick={() => setRawSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <SegmentedControl<TrackSort>
              ariaLabel="Sort tracks by"
              value={sort}
              options={SORTS}
              onChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            />

            <GhostButton
              onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
              title={order === "desc" ? "Highest first" : "Lowest first"}
            >
              <ArrowUpDown size={12} aria-hidden />
              {order === "desc" ? "High to low" : "Low to high"}
            </GhostButton>
          </div>

          {tracks.isLoading ? (
            <RowsSkeleton rows={8} />
          ) : tracks.error ? (
            <ErrorPanel error={tracks.error} errors={tracks.errors} onRetry={tracks.refresh} />
          ) : items.length === 0 ? (
            <EmptyState
              title={search ? "No track matches that search" : "No tracks in this range"}
              message={
                search
                  ? "Try a shorter search, or widen the date range."
                  : "Nothing was reported by any partner for the dates you picked."
              }
            />
          ) : (
            <div className={tracks.isStale ? "av2-stale" : "av2-fresh"}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="sr-only">
                    Tracks with streams in the selected range
                  </caption>
                  <thead>
                    <tr>
                      {[
                        { key: "title", label: "Track", align: "left" },
                        { key: "streams", label: "Streams", align: "right" },
                        { key: "tracks_streamed", label: "Streamed", align: "right" },
                        { key: "completed_rate", label: "Completion", align: "right" },
                        { key: "platforms", label: "Platforms", align: "right" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          scope="col"
                          className={[
                            "font-body text-white/35 text-[10px] uppercase tracking-wider font-normal pb-2 border-b border-white/[0.06] whitespace-nowrap",
                            col.align === "right" ? "text-right pl-3" : "text-left pr-3",
                          ].join(" ")}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((track) => (
                      <tr
                        key={track.track_id}
                        onClick={() => setSelected(track)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(track);
                          }
                        }}
                        className="border-b border-white/[0.03] last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:bg-white/[0.04]"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-[#0E0808] border border-white/[0.06] shrink-0 flex items-center justify-center">
                              <Music4 size={12} className="text-white/25" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="font-body text-white text-xs truncate block max-w-[220px]">
                                {track.title ?? `Track ${track.track_id}`}
                              </span>
                              {track.artists && (
                                <span className="font-body text-white/35 text-[10px] truncate block max-w-[220px]">
                                  {track.artists}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pl-3 text-right font-body text-white/75 text-xs tabular-nums">
                          {formatFull(track.streams)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-body text-white/50 text-xs tabular-nums">
                          {formatFull(track.tracks_streamed)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-body text-white/50 text-xs tabular-nums">
                          {formatRate(track.completed_rate)}
                        </td>
                        <td className="py-2.5 pl-3">
                          <span className="flex items-center gap-1 justify-end">
                            {track.platforms.map((p) => (
                              <span
                                key={p}
                                title={platformLabel(p)}
                                className="w-2 h-2 rounded-[2px] shrink-0"
                                style={{ backgroundColor: platformColor(p) }}
                              />
                            ))}
                            <span className="sr-only">
                              {track.platforms.map(platformLabel).join(", ")}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3">
                <CoverageNotes coverage={tracks.data?.coverage} dimension="platform" />
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/[0.05]">
                  <p className="font-body text-white/35 text-[11px]">
                    Page {page} of {pages}
                  </p>
                  <div className="flex items-center gap-2">
                    <GhostButton
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      title="Previous page"
                    >
                      Previous
                    </GhostButton>
                    <GhostButton
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      title="Next page"
                    >
                      Next
                    </GhostButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <TrackDetailPanel track={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

/* ─── Detail ──────────────────────────────────────────────────── */

function TrackDetailPanel({
  track,
  onClose,
}: {
  track: TrackListItem;
  onClose: () => void;
}) {
  const { range, scopeToken } = useAnalyticsV2();
  const grain = granularityForRange(range);
  const detail = useTrackDetail(track.track_id, { metric: "streams", granularity: grain });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const d = detail.data;

  const platformRows = useMemo(
    () =>
      (d?.platforms ?? []).map((p) => ({
        ...p,
        label: platformLabel(p.platform),
        color: platformColor(p.platform),
      })),
    [d]
  );

  return (
    <Card index={0} glow>
      <div className="p-4 sm:p-5">
        <CardHeader
          title={d?.track.title ?? track.title ?? `Track ${track.track_id}`}
          subtitle={
            [d?.track.artists ?? track.artists, d?.track.release_name, d?.track.isrc ?? track.isrc]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          action={
            <button
              onClick={onClose}
              aria-label="Close track detail"
              className="text-white/40 hover:text-white transition-colors focus-visible:outline-none"
            >
              <X size={18} />
            </button>
          }
        />

        {detail.isLoading ? (
          <ChartSkeleton height={200} />
        ) : detail.error ? (
          <ErrorPanel error={detail.error} errors={detail.errors} onRetry={detail.refresh} />
        ) : !d ? (
          <EmptyState />
        ) : (
          <div className={detail.isStale ? "av2-stale" : "av2-fresh"}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Streams", value: d.summary.streams.total, format: formatCompact },
                { label: "Tracks streamed", value: d.summary.tracks_streamed, format: formatCompact },
                { label: "Countries", value: d.summary.countries, format: formatCompact },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3"
                >
                  <p className="font-body text-white/45 text-[10px]">{m.label}</p>
                  <p className="font-heading text-white text-lg mt-1 leading-none">
                    <CountUp value={m.value} format={m.format} />
                  </p>
                </div>
              ))}
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                <p className="font-body text-white/45 text-[10px]">Completion</p>
                <p className="font-heading text-white text-lg mt-1 leading-none">
                  {formatRate(d.summary.engagement.completed_rate)}
                </p>
              </div>
            </div>

            {d.timeseries.points.length > 0 && (
              <TimeseriesArea
                crossfadeKey={`${scopeToken}:track:${track.track_id}:${range.from}:${range.to}`}
                points={d.timeseries.points}
                metricLabel="Streams"
                height={180}
              />
            )}

            {platformRows.length > 0 && (
              <div className="mt-4">
                <p className="font-body text-white/45 text-[10px] uppercase tracking-wider mb-2">
                  By platform
                </p>
                <Legend
                  items={platformRows.map((p) => ({
                    key: p.platform,
                    label: `${p.label} · ${formatCompact(p.streams)}`,
                    color: p.color,
                  }))}
                />
              </div>
            )}

            <div className="mt-4">
              <CoverageNotes coverage={d.summary.coverage} dimension="platform" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
