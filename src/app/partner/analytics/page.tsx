"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PartnerLayout from "@/components/partner/PartnerLayout";
import StatTile from "@/components/partner/StatTile";
import { TimeseriesArea } from "@/components/dashboard/analytics-v2/charts";
import type { TimeseriesPoint } from "@/lib/api/analytics-v2";
import {
  fetchPartnerAnalyticsSummary,
  fetchPartnerReleases,
  fetchPartnerStreamsByRelease,
  fetchPartnerTimeseries,
  type AnalyticsCoverage,
  type PartnerAnalyticsSummary,
  type PartnerRelease,
  type PartnerReleaseStreams,
} from "@/lib/api/partner";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "28D", days: 28 },
  { label: "90D", days: 90 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Coverage sits WITH the numbers, never in a footnote. A total that is low because a third
 * of the catalogue has not been matched into the analytics layer is a different fact from
 * a total that is low because nobody listened, and the reader cannot tell them apart
 * without this.
 */
function CoverageNote({ coverage }: { coverage: AnalyticsCoverage }) {
  if (coverage.tracks_without_analytics <= 0) return null;

  return (
    <p className="font-body text-amber-300/70 text-xs mt-3">
      {coverage.tracks_without_analytics} of {coverage.assigned_tracks} shared tracks have no
      reporting data matched to them yet, so the figures above cover{" "}
      {coverage.tracks_with_analytics} track
      {coverage.tracks_with_analytics === 1 ? "" : "s"}.
    </p>
  );
}

export default function PartnerAnalyticsPage() {
  const [days, setDays] = useState(28);
  const [summary, setSummary] = useState<PartnerAnalyticsSummary | null>(null);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [byRelease, setByRelease] = useState<PartnerReleaseStreams[]>([]);
  const [releases, setReleases] = useState<PartnerRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const range = { from: isoDaysAgo(days), to: todayIso() };

    const [summaryRes, seriesRes, byReleaseRes, releasesRes] = await Promise.all([
      fetchPartnerAnalyticsSummary(range),
      fetchPartnerTimeseries(range),
      fetchPartnerStreamsByRelease(range),
      fetchPartnerReleases(),
    ]);

    const failure =
      summaryRes.error ?? seriesRes.error ?? byReleaseRes.error ?? releasesRes.error;

    if (failure) {
      setError(failure);
      setLoading(false);
      return;
    }

    setError(null);
    setSummary(summaryRes.data);
    setSeries(
      (seriesRes.data?.series ?? []).map((p) => ({
        date: p.date,
        value: p.streams,
        provisional: false,
      }))
    );
    setByRelease(byReleaseRes.data?.releases ?? []);
    setReleases(releasesRes.data ?? []);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const titleById = useMemo(() => {
    const map = new Map<number, PartnerRelease>();
    releases.forEach((r) => map.set(r.id, r));
    return map;
  }, [releases]);

  const maxStreams = byRelease[0]?.streams ?? 0;

  return (
    <PartnerLayout pageTitle="Analytics">
      <div className="flex gap-1.5 mb-4">
        {RANGES.map((range) => (
          <button
            key={range.days}
            onClick={() => setDays(range.days)}
            className={[
              "font-heading uppercase text-[10px] tracking-widest px-3 py-2 rounded-full border transition-colors",
              days === range.days
                ? "border-[#C30100] bg-[#C30100]/20 text-white"
                : "border-white/10 text-white/50 hover:text-white hover:border-white/25",
            ].join(" ")}
          >
            {range.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl h-72 animate-pulse" />
      )}

      {!loading && error && (
        <div className="bg-[#1A0808] border border-[#C30100]/40 rounded-2xl p-5">
          <p className="font-body text-white text-sm">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 font-heading uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] px-4 py-2 text-white hover:bg-[#C30100] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatTile label="Streams" value={summary.streams.toLocaleString()} />
            <StatTile label="Completed" value={summary.completed_streams.toLocaleString()} />
            <StatTile label="Discovery" value={summary.discovery_streams.toLocaleString()} />
            <StatTile label="Repeat" value={summary.repeat_streams.toLocaleString()} />
          </div>

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mt-4">
            <h3 className="font-heading text-white uppercase text-sm tracking-[0.18em] mb-4">
              Streams over time
            </h3>

            <TimeseriesArea points={series} metricLabel="Streams" height={240} />

            <CoverageNote coverage={summary.coverage} />
          </div>

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mt-4">
            <h3 className="font-heading text-white uppercase text-sm tracking-[0.18em] mb-4">
              By release
            </h3>

            {byRelease.length === 0 ? (
              <p className="font-body text-white/40 text-sm">
                No streaming data reported for these releases in this period.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byRelease.map((row) => {
                  const release = titleById.get(row.release_id);
                  const width = maxStreams > 0 ? (row.streams / maxStreams) * 100 : 0;

                  return (
                    <li key={row.release_id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-body text-white text-sm truncate min-w-0">
                          {release?.release_title ?? `Release #${row.release_id}`}
                        </span>
                        <span className="font-body text-white/50 text-xs shrink-0">
                          {row.streams.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#E5342F] rounded-full"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </PartnerLayout>
  );
}
