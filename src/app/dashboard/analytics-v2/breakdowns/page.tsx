"use client";

/**
 * Analytics v2 — Breakdowns.
 *
 * Two things this page exists to get right:
 *
 * 1. The rows can legitimately sum to less than the headline total. That is not
 *    a rounding error — some feeds cannot contribute to some dimensions — so the
 *    arithmetic is shown beside the chart rather than explained in a footnote.
 *
 * 2. Outside-grain dimensions (gender, device, age…) are groupable only. The
 *    picker marks them, and the client pre-empts the unsupported combinations
 *    the API 422s on so the artist gets an explanation instead of a round trip.
 */

import { useMemo, useState } from "react";
import {
  IN_GRAIN_DIMENSIONS,
  OUTSIDE_GRAIN_DIMENSIONS,
  dimensionLabel,
  isOutsideGrain,
  validateBreakdown,
  type Dimension,
} from "@/lib/api/analytics-v2";
import { useAnalyticsV2, useBreakdown, useCoverage } from "@/lib/hooks/useAnalyticsV2";
import { AnalyticsV2Shell } from "@/components/dashboard/analytics-v2/Shell";
import {
  CoverageAside,
  CoverageMatrix,
} from "@/components/dashboard/analytics-v2/CoveragePanel";
import { BreakdownBars } from "@/components/dashboard/analytics-v2/charts";
import {
  Card,
  CardHeader,
  ErrorPanel,
  EmptyState,
  RowsSkeleton,
  SuppressedTag,
  SuppressionNote,
  TableView,
} from "@/components/dashboard/analytics-v2/primitives";
import { formatFull } from "@/components/dashboard/analytics-v2/theme";

const GROUPS: Array<{ label: string; dimensions: readonly string[]; note?: string }> = [
  {
    label: "Exact",
    dimensions: ["platform", ...IN_GRAIN_DIMENSIONS],
    note: "Combinable with any filter.",
  },
  {
    label: "Grouped only",
    dimensions: OUTSIDE_GRAIN_DIMENSIONS,
    note: "Folded at ingest — can be grouped, but not crossed with another filter.",
  },
];

export default function AnalyticsV2BreakdownsPage() {
  return (
    <AnalyticsV2Shell>
      <BreakdownsContent />
    </AnalyticsV2Shell>
  );
}

function BreakdownsContent() {
  const { range, scopeToken, filters, platforms } = useAnalyticsV2();
  const [dimension, setDimension] = useState<Dimension>("country");

  const breakdown = useBreakdown(dimension);
  const coverage = useCoverage();

  // The same check the API runs, so the reason is on screen before the request.
  const preflight = useMemo(
    () => validateBreakdown(dimension, filters),
    [dimension, filters]
  );

  const data = breakdown.data;
  const rows = useMemo(
    () =>
      (data?.items ?? []).map((item) => ({
        key: item.key,
        label: item.label || item.key,
        value: item.value,
        share: item.share,
        suppressed: item.suppressed,
      })),
    [data]
  );

  const shown = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);

  return (
    <>
      <Card index={0}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="Break streams down by"
            subtitle="Rows are ranked; every bar is one colour because the length already carries the value"
          />

          <div className="flex flex-col gap-3">
            {GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col gap-1.5">
                <p className="font-body text-white/35 text-[10px] uppercase tracking-wider">
                  {group.label}
                  {group.note && (
                    <span className="normal-case tracking-normal text-white/25 ml-2">
                      {group.note}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.dimensions.map((key) => {
                    const active = dimension === key;
                    const blocked = validateBreakdown(key as Dimension, filters) !== null;

                    return (
                      <button
                        key={key}
                        onClick={() => setDimension(key as Dimension)}
                        aria-pressed={active}
                        title={
                          blocked
                            ? "Not available with the filters you have applied"
                            : undefined
                        }
                        className={[
                          "font-body text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
                          active
                            ? "text-white bg-[#C30100]/15 border-[#C30100]/45"
                            : blocked
                              ? "text-white/25 border-white/[0.05] line-through"
                              : "text-white/50 border-white/[0.08] hover:text-white hover:border-white/25",
                        ].join(" ")}
                      >
                        {dimensionLabel(key)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card index={1}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title={`Streams by ${dimensionLabel(dimension).toLowerCase()}`}
            subtitle={`${range.from} to ${range.to}${platforms.length > 0 ? ` · ${platforms.length} platform filter${platforms.length > 1 ? "s" : ""}` : ""}`}
          />

          {preflight ? (
            <ErrorPanel
              error={`A ${dimensionLabel(dimension).toLowerCase()} breakdown isn't available with these filters.`}
              errors={preflight}
            />
          ) : breakdown.isLoading ? (
            <RowsSkeleton rows={6} />
          ) : breakdown.error ? (
            <ErrorPanel
              error={breakdown.error}
              errors={breakdown.errors}
              onRetry={breakdown.refresh}
            />
          ) : rows.length === 0 ? (
            <EmptyState message={`Nothing reported a ${dimensionLabel(dimension).toLowerCase()} for this range.`} />
          ) : (
            <div className={breakdown.isStale ? "av2-stale" : "av2-fresh"}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 lg:gap-5">
                <div className="min-w-0 order-2 lg:order-1">
                  <BreakdownBars
                    crossfadeKey={`${scopeToken}:${dimension}:${range.from}:${range.to}`}
                    rows={rows}
                    total={data?.total ?? 0}
                  />
                </div>

                <div className="order-1 lg:order-2">
                  <CoverageAside
                    coverage={data?.coverage}
                    dimension={dimension}
                    total={data?.total}
                    shown={shown}
                    suppressedCount={data?.suppressed?.length ?? 0}
                  />
                </div>
              </div>

              <SuppressionNote count={data?.suppressed?.length ?? 0} />

              {isOutsideGrain(dimension) && (
                <p className="font-body text-white/25 text-[10px] mt-2">
                  {dimensionLabel(dimension)} is folded per-dimension at ingest, so it can
                  be grouped but not crossed with another filter.
                </p>
              )}

              <TableView
                caption={`Streams by ${dimensionLabel(dimension).toLowerCase()}`}
                rows={data?.items ?? []}
                rowKey={(item) => item.key}
                columns={[
                  {
                    key: "label",
                    header: dimensionLabel(dimension),
                    render: (item) => item.label || item.key,
                  },
                  {
                    key: "value",
                    header: "Streams",
                    align: "right",
                    render: (item) =>
                      item.suppressed ? <SuppressedTag /> : formatFull(item.value),
                  },
                  {
                    key: "share",
                    header: "Share",
                    align: "right",
                    render: (item) =>
                      item.share === null || item.share === undefined
                        ? "—"
                        : `${(item.share * 100).toFixed(1)}%`,
                  },
                  {
                    key: "tracks",
                    header: "Tracks",
                    align: "right",
                    render: (item) => formatFull(item.tracks),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </Card>

      <Card index={2}>
        <div className="p-4 sm:p-5">
          <CardHeader
            title="What each platform reports"
            subtitle="Why a breakdown can add up to less than the headline total"
          />

          {coverage.isLoading ? (
            <RowsSkeleton rows={5} />
          ) : coverage.error ? (
            <ErrorPanel
              error={coverage.error}
              errors={coverage.errors}
              onRetry={coverage.refresh}
            />
          ) : (
            <div className={coverage.isStale ? "av2-stale" : "av2-fresh"}>
              <CoverageMatrix coverage={coverage.data} />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
