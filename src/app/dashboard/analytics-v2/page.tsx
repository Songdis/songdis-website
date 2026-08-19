"use client";

import { Globe2, ListMusic, Music4, Radio } from "lucide-react";
import { coverageGap, hasCoverageGap, platformLabel } from "@/lib/api/analytics-v2";
import {
  granularityForRange,
  useAnalyticsV2,
  useEngagement,
  useSummary,
  useTimeseries,
} from "@/lib/hooks/useAnalyticsV2";
import { AnalyticsV2Shell } from "@/components/dashboard/analytics-v2/Shell";
import { CoverageAside, CoverageNotes } from "@/components/dashboard/analytics-v2/CoveragePanel";
import {
  PlatformMixBars,
  TimeseriesArea,
} from "@/components/dashboard/analytics-v2/charts";
import {
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorPanel,
  Legend,
  StatTile,
  SuppressionNote,
  TableView,
} from "@/components/dashboard/analytics-v2/primitives";
import {
  formatCompact,
  formatFull,
  formatRate,
  orderPlatforms,
  platformColor,
} from "@/components/dashboard/analytics-v2/theme";

export default function AnalyticsV2OverviewPage() {
  return (
    <AnalyticsV2Shell>
      <OverviewContent />
    </AnalyticsV2Shell>
  );
}

function OverviewContent() {
  const { range, scopeToken } = useAnalyticsV2();
  const summary = useSummary(true);
  const series = useTimeseries("streams");
  const engagement = useEngagement();

  const s = summary.data;
  const grain = granularityForRange(range);

  const platformRows = s
    ? orderPlatforms(s.by_platform.map((p) => p.platform)).map((platform) => ({
        platform,
        streams: s.by_platform.find((p) => p.platform === platform)?.streams ?? 0,
      }))
    : [];

  const platformShown = platformRows.reduce((sum, r) => sum + r.streams, 0);
  const platformGap = coverageGap(s?.coverage, "platform");

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          index={0}
          highlight
          label="Streams"
          value={s?.streams.total}
          deltaPct={s?.streams.delta_pct}
          previous={s?.streams.previous ?? undefined}
          loading={summary.isLoading}
          stale={summary.isStale}
          icon={<Radio size={15} />}
        />
        <StatTile
          index={1}
          label="Tracks streamed"
          value={s?.tracks_streamed}
          loading={summary.isLoading}
          stale={summary.isStale}
          icon={<ListMusic size={15} />}
        />
        <StatTile
          index={2}
          label="Countries reached"
          value={s?.countries}
          loading={summary.isLoading}
          stale={summary.isStale}
          icon={<Globe2 size={15} />}
        />
        <StatTile
          index={3}
          label="Avg streams / day"
          value={s?.avg_streams_per_day}
          loading={summary.isLoading}
          stale={summary.isStale}
          icon={<Music4 size={15} />}
        />
      </div>

      {summary.error && (
        <ErrorPanel
          error={summary.error}
          errors={summary.errors}
          onRetry={summary.refresh}
        />
      )}

      <Card index={4}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Streams over time"
            subtitle={`${grain === "day" ? "Daily" : grain === "week" ? "Weekly" : "Monthly"} totals · ${range.from} to ${range.to}`}
          />

          {series.isLoading ? (
            <ChartSkeleton height={240} />
          ) : series.error ? (
            <ErrorPanel error={series.error} errors={series.errors} onRetry={series.refresh} />
          ) : !series.data || series.data.points.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={series.isStale ? "av2-stale" : "av2-fresh"}>
              <TimeseriesArea
                crossfadeKey={`${scopeToken}:${range.from}:${range.to}:${grain}`}
                points={series.data.points}
                metricLabel="Streams"
              />

              <div className="mt-3">
                <CoverageNotes coverage={series.data.coverage} dimension="platform" />
              </div>

              <SuppressionNote count={series.data.suppressed?.length ?? 0} />

              <TableView
                caption="Streams by date"
                rows={series.data.points}
                rowKey={(p) => p.date}
                columns={[
                  { key: "date", header: "Date", render: (p) => p.date },
                  {
                    key: "value",
                    header: "Streams",
                    align: "right",
                    render: (p) =>
                      p.value === null ? (
                        <span className="text-white/35">Hidden</span>
                      ) : (
                        formatFull(p.value)
                      ),
                  },
                  {
                    key: "provisional",
                    header: "Status",
                    align: "right",
                    render: (p) => (p.provisional ? "Provisional" : "Settled"),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      <Card index={5}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Where the streams came from"
            subtitle="Each platform keeps its colour across every chart on this dashboard"
          />

          {summary.isLoading ? (
            <ChartSkeleton height={220} />
          ) : platformRows.length === 0 ? (
            <EmptyState message="No platform reported streams for this range." />
          ) : (
            <div className={summary.isStale ? "av2-stale" : "av2-fresh"}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 lg:gap-5">
                <div className="min-w-0 order-2 lg:order-1">
                  <PlatformMixBars
                    crossfadeKey={`${scopeToken}:${range.from}:${range.to}`}
                    data={platformRows}
                  />
                  <Legend
                    className="mt-3"
                    items={platformRows.map((r) => ({
                      key: r.platform,
                      label: platformLabel(r.platform),
                      color: platformColor(r.platform),
                    }))}
                  />
                </div>

                <div className="order-1 lg:order-2">
                  <CoverageAside
                    coverage={s?.coverage}
                    dimension="platform"
                    total={s?.streams.total}
                    shown={platformShown}
                    suppressedCount={s?.suppressed?.length ?? 0}
                  />
                </div>
              </div>

              <TableView
                caption="Streams by platform"
                rows={platformRows}
                rowKey={(r) => r.platform}
                columns={[
                  {
                    key: "platform",
                    header: "Platform",
                    render: (r) => (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                          style={{ backgroundColor: platformColor(r.platform) }}
                          aria-hidden
                        />
                        {platformLabel(r.platform)}
                      </span>
                    ),
                  },
                  {
                    key: "streams",
                    header: "Streams",
                    align: "right",
                    render: (r) => formatFull(r.streams),
                  },
                  {
                    key: "share",
                    header: "Share of total",
                    align: "right",
                    render: (r) =>
                      s && s.streams.total > 0
                        ? `${((r.streams / s.streams.total) * 100).toFixed(1)}%`
                        : "—",
                  },
                ]}
              />

              {hasCoverageGap(platformGap) && s && platformShown < s.streams.total && (
                <p className="font-body text-white/30 text-[10px] mt-2">
                  Platform rows sum to {formatCompact(platformShown)} against a headline
                  total of {formatCompact(s.streams.total)}. The total is read from the
                  rollup, never summed from this table.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card index={6}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="How people listened"
            subtitle="Rates are over the streams that carry the signal, not over every stream"
          />

          {engagement.isLoading ? (
            <ChartSkeleton height={120} />
          ) : engagement.error ? (
            <ErrorPanel
              error={engagement.error}
              errors={engagement.errors}
              onRetry={engagement.refresh}
            />
          ) : !engagement.data ? (
            <EmptyState />
          ) : (
            <div className={engagement.isStale ? "av2-stale" : "av2-fresh"}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Completion", value: engagement.data.overall.completed_rate },
                  { label: "Shuffle", value: engagement.data.overall.shuffle_rate },
                  { label: "Repeat", value: engagement.data.overall.repeat_rate },
                  { label: "Discovery", value: engagement.data.overall.discovery_rate },
                  { label: "Cached", value: engagement.data.overall.cached_rate },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3"
                  >
                    <p className="font-body text-white/45 text-[10px]">{m.label}</p>
                    <p className="font-heading text-white text-lg mt-1 leading-none">
                      {formatRate(m.value)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                  <p className="font-body text-white/45 text-[10px]">
                    Skips &amp; saves ({platformLabel(engagement.data.aggregated_feed.platform)})
                  </p>
                  <p className="font-body text-white text-sm mt-1">
                    {formatFull(engagement.data.aggregated_feed.skip_count)} skips ·{" "}
                    {formatFull(engagement.data.aggregated_feed.saves_count)} saves
                  </p>
                  <p className="font-body text-white/30 text-[10px] mt-1.5">
                    Only the aggregated feed reports these, and they are not part of any
                    total.
                  </p>
                </div>

                <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                  <p className="font-body text-white/45 text-[10px]">Coverage</p>
                  <div className="mt-1.5">
                    <CoverageNotes
                      coverage={engagement.data.coverage}
                      dimension="platform"
                    />
                  </div>
                </div>
              </div>

              <p className="font-body text-white/25 text-[10px] mt-3">
                No partner feed carries a listener id, so these are plays and behaviour —
                never unique listeners.
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
