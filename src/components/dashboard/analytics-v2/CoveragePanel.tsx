"use client";

const SHOW_COVERAGE_NOTES = false;

import { CircleSlash, Clock, Info, MinusCircle } from "lucide-react";
import {
  coverageGap,
  dimensionLabel,
  hasCoverageGap,
  platformLabel,
  type Coverage,
  type PeriodTotal,
} from "@/lib/api/analytics-v2";
import { INK, STATUS } from "./theme";


export function PeriodTotalNote({
  periodTotals,
  className = "",
}: {
  periodTotals: PeriodTotal[] | null | undefined;
  className?: string;
}) {
  if (!periodTotals || periodTotals.length === 0) return null;

  const streams = periodTotals.reduce((sum, p) => sum + (p.streams ?? 0), 0);

  if (streams <= 0) return null;

  return (
    <p
      className={`font-body text-white/45 text-[11px] flex items-start gap-1.5 ${className}`}
    >
      <Info size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden />
      <span>
        <span className="text-white/70">{streams.toLocaleString()}</span> streams from an
        earlier period are counted in your total but not shown here — the daily dates
        weren&rsquo;t recorded for them.
      </span>
    </p>
  );
}

function PlatformList({ keys }: { keys: string[] }) {
  return <span className="text-white/70">{keys.map(platformLabel).join(", ")}</span>;
}

export function CoverageNotes({
  coverage,
  dimension,
  className = "",
}: {
  coverage: Coverage | null | undefined;
  dimension: string;
  className?: string;
}) {
  if (!SHOW_COVERAGE_NOTES) return null;

  const gap = coverageGap(coverage, dimension);

  if (!hasCoverageGap(gap)) {
    return (
      <p
        className={`font-body text-white/35 text-[11px] flex items-start gap-1.5 ${className}`}
      >
        <Info size={12} className="mt-0.5 shrink-0" style={{ color: INK.muted }} aria-hidden />
        <span>Every platform reports {dimensionLabel(dimension).toLowerCase()} for this range.</span>
      </p>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {gap.unavailable.length > 0 && (
        <p className="font-body text-white/45 text-[11px] flex items-start gap-1.5">
          <CircleSlash size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden />
          <span>
            <PlatformList keys={gap.unavailable} /> {gap.unavailable.length === 1 ? "does" : "do"}{" "}
            not report {dimensionLabel(dimension).toLowerCase()}, so those streams are missing
            from this split — but they are still in the total.
          </span>
        </p>
      )}

      {gap.incomplete.length > 0 && (
        <p className="font-body text-white/45 text-[11px] flex items-start gap-1.5">
          <Clock size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.serious }} aria-hidden />
          <span>
            <PlatformList keys={gap.incomplete} /> delivered nothing for part of this range.
          </span>
        </p>
      )}

      {gap.excludedFromTotals.length > 0 && (
        <p className="font-body text-white/45 text-[11px] flex items-start gap-1.5">
          <MinusCircle size={12} className="mt-0.5 shrink-0" style={{ color: INK.muted }} aria-hidden />
          <span>
            <PlatformList keys={gap.excludedFromTotals} /> {gap.excludedFromTotals.length === 1 ? "does" : "do"}{" "}
            not count toward headline totals.
          </span>
        </p>
      )}
    </div>
  );
}


export function CoverageAside({
  coverage,
  dimension,
  total,
  shown,
  suppressedCount = 0,
}: {
  coverage: Coverage | null | undefined;
  dimension: string;
  total?: number;
  shown?: number;
  suppressedCount?: number;
}) {
  if (!SHOW_COVERAGE_NOTES) return null;

  const unaccounted =
    total !== undefined && shown !== undefined ? Math.max(total - shown, 0) : 0;

  return (
    <aside className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3 flex flex-col gap-2.5">
      <p className="font-body text-white/50 text-[10px] uppercase tracking-wider">
        What this split covers
      </p>

      {unaccounted > 0 && (
        <p className="font-body text-[11px] text-white/60">
          <span className="text-white font-medium">{unaccounted.toLocaleString()}</span> of{" "}
          {total?.toLocaleString()} streams aren&apos;t in the rows below
          {suppressedCount > 0 ? " (some hidden, some not reported)" : ""}.
        </p>
      )}

      <CoverageNotes coverage={coverage} dimension={dimension} />
    </aside>
  );
}



export function CoverageMatrix({ coverage }: { coverage: Coverage | null | undefined }) {
  if (!SHOW_COVERAGE_NOTES) return null;

  const dimensions = coverage?.dimensions ?? [];
  if (dimensions.length === 0) return null;

  const platforms = Array.from(
    new Set(dimensions.flatMap((d) => Object.keys(d.platforms ?? {})))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Which platforms report which dimension for the selected range
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="font-body text-white/35 text-[10px] uppercase tracking-wider font-normal text-left pb-2 pr-3 border-b border-white/[0.06]"
            >
              Dimension
            </th>
            {platforms.map((p) => (
              <th
                key={p}
                scope="col"
                className="font-body text-white/35 text-[10px] uppercase tracking-wider font-normal text-center pb-2 px-2 border-b border-white/[0.06] whitespace-nowrap"
              >
                {platformLabel(p)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => (
            <tr key={dim.key} className="border-b border-white/[0.03] last:border-0">
              <th
                scope="row"
                className="font-body text-white/70 text-[11px] font-normal text-left py-2 pr-3 whitespace-nowrap"
              >
                {dim.label || dimensionLabel(dim.key)}
              </th>
              {platforms.map((p) => {
                const cell = dim.platforms?.[p];
                const state = !cell?.available
                  ? { glyph: "—", text: "Not reported", color: INK.muted }
                  : !cell.complete
                    ? { glyph: "◐", text: "Partial", color: STATUS.serious }
                    : { glyph: "●", text: "Reported", color: STATUS.good };

                return (
                  <td key={p} className="text-center py-2 px-2">
                    <span
                      className="font-body text-[13px] leading-none"
                      style={{ color: state.color }}
                      aria-hidden
                    >
                      {state.glyph}
                    </span>
                    <span className="sr-only">{state.text}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        {[
          { glyph: "●", label: "Reported", color: STATUS.good },
          { glyph: "◐", label: "Partial for this range", color: STATUS.serious },
          { glyph: "—", label: "Not reported by this platform", color: INK.muted },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="text-[13px] leading-none" style={{ color: item.color }} aria-hidden>
              {item.glyph}
            </span>
            <span className="font-body text-white/45 text-[11px]">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
