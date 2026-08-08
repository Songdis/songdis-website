"use client";

/**
 * The recharts surfaces for analytics v2.
 *
 * House rules applied throughout:
 *  - One y-axis, always. Two measures of different scale get two charts.
 *  - Colour follows the entity: a platform keeps its hue when others are
 *    filtered out, and series are ordered by identity, not by value.
 *  - A single-series chart carries no legend box — the card title names it.
 *  - Nominal bars are all one hue; bar length already encodes the value, so
 *    spending colour on it too would waste the identity channel.
 *  - Suppressed points are null, and null renders as a gap, never as zero.
 *  - Solid hairline grid, thin marks, 4px rounded data-ends.
 */

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { platformLabel, type TimeseriesPoint } from "@/lib/api/analytics-v2";
import {
  AXIS_TICK,
  BRAND_MARK,
  GRID,
  INK,
  SURFACE,
  TOOLTIP_STYLE,
  formatCompact,
  formatDay,
  formatFull,
  orderPlatforms,
  platformColor,
} from "./theme";

/* ─── Tooltip ─────────────────────────────────────────────────── */

interface TooltipEntry {
  name?: string;
  value?: number | null;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormat = formatFull,
  labelFormat,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  valueFormat?: (n: number | null | undefined) => string;
  labelFormat?: (label: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const heading =
    typeof label === "string" && labelFormat ? labelFormat(label) : String(label ?? "");

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="font-body text-white/50 text-[10px] mb-1.5">{heading}</p>
      {payload.map((entry, i) => {
        const provisional = entry.payload?.provisional === true;
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-[2px] shrink-0"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
            <span className="font-body text-white/60 text-[11px]">{entry.name}</span>
            <span className="font-body text-white text-[11px] ml-auto tabular-nums">
              {entry.value === null || entry.value === undefined
                ? "Hidden"
                : valueFormat(entry.value)}
            </span>
            {provisional && i === 0 && (
              <span className="font-body text-[9px] text-[#fab219] ml-1">prov.</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Streams over time ───────────────────────────────────────── */

/**
 * One metric over the range. Single series, so no legend — the card heading
 * says what is plotted. A suppressed bucket comes through as null and
 * `connectNulls={false}` leaves it as a visible gap rather than a dip to zero.
 */
export function TimeseriesArea({
  points,
  metricLabel,
  valueFormat = formatFull,
  height = 240,
  crossfadeKey,
}: {
  points: TimeseriesPoint[];
  metricLabel: string;
  valueFormat?: (n: number | null | undefined) => string;
  height?: number;
  crossfadeKey?: string;
}) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        value: p.value,
        provisional: p.provisional,
      })),
    [points]
  );

  return (
    <div key={crossfadeKey} className="av2-crossfade">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="av2StreamsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND_MARK} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND_MARK} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="date"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tickFormatter={formatDay}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => formatCompact(v as number)}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.18)", strokeWidth: 1 }}
            content={
              <ChartTooltip valueFormat={valueFormat} labelFormat={formatDay} />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            name={metricLabel}
            stroke={BRAND_MARK}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#av2StreamsFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Platform mix ────────────────────────────────────────────── */

/**
 * Streams per platform. Bars rather than a donut: the values are usually close
 * enough that arc lengths would be guesswork, and this stays readable past six
 * platforms. Every bar is its platform's fixed hue, so the mix reads the same
 * here as it does everywhere else on the dashboard.
 */
export function PlatformMixBars({
  data,
  height = 220,
  crossfadeKey,
}: {
  data: Array<{ platform: string; streams: number }>;
  height?: number;
  crossfadeKey?: string;
}) {
  const rows = useMemo(() => {
    const byKey = new Map(data.map((d) => [d.platform, d.streams]));
    return orderPlatforms(data.map((d) => d.platform)).map((platform) => ({
      platform,
      label: platformLabel(platform),
      streams: byKey.get(platform) ?? 0,
      color: platformColor(platform),
    }));
  }, [data]);

  if (rows.length === 0) return null;

  return (
    <div key={crossfadeKey} className="av2-crossfade">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: -12 }} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={0}
            height={38}
            tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => formatCompact(v as number)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="streams" name="Streams" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {rows.map((row) => (
              <Cell key={row.platform} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Breakdown bars ──────────────────────────────────────────── */

export interface BreakdownRow {
  key: string;
  label: string;
  value: number | null;
  share: number | null;
  suppressed: boolean;
}

/**
 * A horizontal breakdown, drawn as HTML rather than recharts.
 *
 * Two reasons: the labels are long and arbitrary (country and source names), so
 * an HTML row lets the label sit outside the bar where it can never be clipped;
 * and a suppressed cell needs to render as a hatched, labelled row rather than
 * a zero-length bar, which a value-driven chart cannot express.
 *
 * One hue for every bar — these categories are nominal, and the bar length
 * already carries the magnitude.
 */
export function BreakdownBars({
  rows,
  total,
  valueFormat = formatFull,
  crossfadeKey,
  color = BRAND_MARK,
}: {
  rows: BreakdownRow[];
  total: number;
  valueFormat?: (n: number | null | undefined) => string;
  crossfadeKey?: string;
  color?: string;
}) {
  const max = useMemo(
    () => Math.max(1, ...rows.map((r) => r.value ?? 0)),
    [rows]
  );

  return (
    <div key={crossfadeKey} className="av2-crossfade flex flex-col gap-2.5">
      {rows.map((row) => {
        const pct = row.suppressed ? 0 : ((row.value ?? 0) / max) * 100;
        const share =
          row.share !== null && row.share !== undefined
            ? `${(row.share * 100).toFixed(1)}%`
            : total > 0 && row.value !== null
              ? `${(((row.value ?? 0) / total) * 100).toFixed(1)}%`
              : "—";

        return (
          <div key={row.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-body text-white/75 text-[11px] truncate">{row.label}</span>
              <span className="font-body text-white/45 text-[11px] shrink-0 tabular-nums">
                {row.suppressed ? (
                  <span className="text-white/35">Hidden</span>
                ) : (
                  <>
                    {valueFormat(row.value)}
                    <span className="text-white/25 ml-1.5">{share}</span>
                  </>
                )}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              {row.suppressed ? (
                // Hatched, not empty: a suppressed cell is hidden, not zero.
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    backgroundImage: `repeating-linear-gradient(45deg, ${INK.muted}55 0 4px, transparent 4px 8px)`,
                  }}
                  title="Too few streams to show without identifying listeners"
                />
              ) : (
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Hour of day ─────────────────────────────────────────────── */

/**
 * 24 UTC buckets. One hue — the bar height is the magnitude, so colouring by
 * value would re-encode what the chart already shows.
 */
export function HourOfDayBars({
  hours,
  height = 180,
  crossfadeKey,
}: {
  hours: Array<{ hour: number; streams: number }>;
  height?: number;
  crossfadeKey?: string;
}) {
  const data = useMemo(() => {
    const byHour = new Map(hours.map((h) => [h.hour, h.streams]));
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      streams: byHour.get(hour) ?? 0,
    }));
  }, [hours]);

  return (
    <div key={crossfadeKey} className="av2-crossfade">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }} barCategoryGap="18%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="hour"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={2}
            tickFormatter={(v) => String(v).padStart(2, "0")}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v) => formatCompact(v as number)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            content={
              <ChartTooltip labelFormat={(l) => `${String(l).padStart(2, "0")}:00 UTC`} />
            }
          />
          <Bar dataKey="streams" name="Streams" radius={[4, 4, 0, 0]} fill={BRAND_MARK} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Sparkline (stat tiles) ──────────────────────────────────── */

export function Sparkline({
  points,
  height = 34,
  color = BRAND_MARK,
}: {
  points: Array<{ value: number | null }>;
  height?: number;
  color?: string;
}) {
  if (points.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="av2SparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill="url(#av2SparkFill)"
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
