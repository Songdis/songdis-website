"use client";

/**
 * Analytics v2 — Trends.
 *
 * One metric at a time on one axis. Metrics of different scale (a rate and a
 * count) never share a plot: a second y-axis would let the reader infer a
 * correlation the data doesn't contain.
 */

import { useState } from "react";
import { Clock } from "lucide-react";
import { METRIC_LABELS, METRICS, RATE_METRICS, type Metric } from "@/lib/api/analytics-v2";
import {
  granularityForRange,
  useAnalyticsV2,
  useHourly,
  useTimeseries,
} from "@/lib/hooks/useAnalyticsV2";
import { AnalyticsV2Shell } from "@/components/dashboard/analytics-v2/Shell";
import { CoverageNotes } from "@/components/dashboard/analytics-v2/CoveragePanel";
import { HourOfDayBars, TimeseriesArea } from "@/components/dashboard/analytics-v2/charts";
import {
  Card,
  CardHeader,
  ChartSkeleton,
  EmptyState,
  ErrorPanel,
  SegmentedControl,
  SuppressionNote,
  TableView,
} from "@/components/dashboard/analytics-v2/primitives";
import {
  formatDuration,
  formatFull,
  formatRate,
} from "@/components/dashboard/analytics-v2/theme";

export default function AnalyticsV2TrendsPage() {
  return (
    <AnalyticsV2Shell>
      <TrendsContent />
    </AnalyticsV2Shell>
  );
}

/** The formatter a metric's units call for. */
function formatterFor(metric: Metric) {
  if (RATE_METRICS.has(metric)) return formatRate;
  if (metric === "avg_duration") return formatDuration;
  return formatFull;
}

const METRIC_OPTIONS = METRICS.map((m) => ({ value: m, label: METRIC_LABELS[m] }));

function TrendsContent() {
  const { range, scopeToken } = useAnalyticsV2();
  const [metric, setMetric] = useState<Metric>("streams");

  const series = useTimeseries(metric);
  const hourly = useHourly();

  const grain = granularityForRange(range);
  const format = formatterFor(metric);

  return (
    <>
      <Card index={0}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title={METRIC_LABELS[metric]}
            subtitle={`${grain === "day" ? "Daily" : grain === "week" ? "Weekly" : "Monthly"} · one metric, one axis`}
          />

          <div className="mb-4">
            <SegmentedControl<Metric>
              ariaLabel="Metric"
              value={metric}
              options={METRIC_OPTIONS}
              onChange={setMetric}
            />
          </div>

          {series.isLoading ? (
            <ChartSkeleton height={260} />
          ) : series.error ? (
            <ErrorPanel error={series.error} errors={series.errors} onRetry={series.refresh} />
          ) : !series.data || series.data.points.length === 0 ? (
            <EmptyState message={`No ${METRIC_LABELS[metric].toLowerCase()} reported for this range.`} />
          ) : (
            <div className={series.isStale ? "av2-stale" : "av2-fresh"}>
              <TimeseriesArea
                crossfadeKey={`${scopeToken}:${metric}:${range.from}:${range.to}`}
                points={series.data.points}
                metricLabel={METRIC_LABELS[metric]}
                valueFormat={format}
                height={260}
              />

              <div className="mt-3">
                <CoverageNotes coverage={series.data.coverage} dimension="platform" />
              </div>

              <SuppressionNote count={series.data.suppressed?.length ?? 0} />

              <TableView
                caption={`${METRIC_LABELS[metric]} by date`}
                rows={series.data.points}
                rowKey={(p) => p.date}
                columns={[
                  { key: "date", header: "Date", render: (p) => p.date },
                  {
                    key: "value",
                    header: METRIC_LABELS[metric],
                    align: "right",
                    render: (p) =>
                      p.value === null ? (
                        <span className="text-white/35">Hidden</span>
                      ) : (
                        format(p.value)
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

      <Card index={1}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Hour of day"
            subtitle="Stream starts, in UTC"
            action={<Clock size={15} className="text-white/25" aria-hidden />}
          />

          {hourly.isLoading ? (
            <ChartSkeleton height={180} />
          ) : hourly.error ? (
            <ErrorPanel error={hourly.error} errors={hourly.errors} onRetry={hourly.refresh} />
          ) : !hourly.data || hourly.data.hours.length === 0 ? (
            <EmptyState message="No feed reported timestamps for this range." />
          ) : (
            <div className={hourly.isStale ? "av2-stale" : "av2-fresh"}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 lg:gap-5">
                <div className="min-w-0 order-2 lg:order-1">
                  <HourOfDayBars
                    crossfadeKey={`${scopeToken}:${range.from}:${range.to}`}
                    hours={hourly.data.hours}
                  />
                </div>

                {/* The "what this chart covers" aside was removed with the rest of the
                    coverage notes — see CoveragePanel.tsx. It is worth knowing that feeds
                    without a timestamp (Deezer, Spotify aggregated) cannot appear in this
                    chart at all, so the hourly bars sum to less than the headline total.
                    Nothing on screen says so now. Restore this aside alongside
                    SHOW_COVERAGE_NOTES if that becomes a question. */}
              </div>

              <TableView
                caption="Streams by hour of day, UTC"
                rows={hourly.data.hours}
                rowKey={(h) => String(h.hour)}
                columns={[
                  {
                    key: "hour",
                    header: "Hour (UTC)",
                    render: (h) => `${String(h.hour).padStart(2, "0")}:00`,
                  },
                  {
                    key: "streams",
                    header: "Streams",
                    align: "right",
                    render: (h) => formatFull(h.streams),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
