"use client";

/**
 * The small pieces every analytics-v2 surface is built from: the card shell,
 * shimmer skeletons, the count-up number, stat tiles, freshness and suppression
 * badges, and the table-view twin every chart ships with.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, EyeOff, Info, Table2 } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/useAnalyticsV2";
import {
  BRAND,
  INK,
  formatCompact,
  formatDateTime,
  formatDelta,
  formatFull,
  STATUS,
} from "./theme";

/* ─── Card ────────────────────────────────────────────────────── */

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger position in a grid — becomes an animation-delay. */
  index?: number;
  /** Adds the soft brand radial glow. Use sparingly: one per view. */
  glow?: boolean;
}

export function Card({ children, className = "", index = 0, glow = false }: CardProps) {
  return (
    <div
      className={[
        "av2-enter relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#180F0F]",
        glow ? "av2-glow" : "",
        className,
      ].join(" ")}
      style={{ "--av2-delay": `${Math.min(index, 12) * 55}ms` } as React.CSSProperties}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <p className="font-body text-white text-sm font-medium truncate">{title}</p>
        {subtitle && (
          <p className="font-body text-white/40 text-[11px] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─── Skeletons ───────────────────────────────────────────────── */

export function Shimmer({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`av2-shimmer rounded-md ${className}`} style={style} />;
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col gap-3" style={{ height }}>
      <div className="flex-1 flex items-end gap-2">
        {[38, 62, 45, 78, 55, 88, 70, 92, 64, 80].map((h, i) => (
          <Shimmer key={i} className="flex-1" style={{ height: `${h}%` }} />
        ))}
      </div>
      <Shimmer className="h-3 w-full" />
    </div>
  );
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
          <Shimmer className="h-3 flex-1" />
          <Shimmer className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ─── Count-up ────────────────────────────────────────────────── */

/**
 * Counts to `value` when it changes. Eased, ~700ms, and skipped entirely under
 * prefers-reduced-motion — the number simply appears at its final value.
 */
export function CountUp({
  value,
  format = formatFull,
  className = "",
  duration = 700,
}: {
  value: number | null | undefined;
  format?: (n: number | null | undefined) => string;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Under reduced motion the value is taken straight from props at render
    // time, so there is nothing to animate and nothing to store.
    if (reduced) return;
    if (value === null || value === undefined || !Number.isFinite(value)) return;

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast then settling, so the number lands rather than stops
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (to - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = to;
    };
  }, [value, reduced, duration]);

  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className={className}>—</span>;
  }

  return (
    <span className={className}>{format(reduced ? value : Math.round(shown))}</span>
  );
}

/* ─── Stat tile ───────────────────────────────────────────────── */

export function StatTile({
  label,
  value,
  format = formatCompact,
  deltaPct,
  previous,
  sub,
  icon,
  index = 0,
  loading = false,
  stale = false,
  highlight = false,
  compareLabel = "previous period",
}: {
  label: string;
  value: number | null | undefined;
  format?: (n: number | null | undefined) => string;
  deltaPct?: number | null;
  previous?: number | null;
  sub?: string;
  icon?: React.ReactNode;
  index?: number;
  loading?: boolean;
  stale?: boolean;
  highlight?: boolean;
  compareLabel?: string;
}) {
  const up = (deltaPct ?? 0) > 0;
  const flat = deltaPct === 0 || deltaPct === null || deltaPct === undefined;

  return (
    <Card
      index={index}
      glow={highlight}
      className={highlight ? "border-[#C30100]/30" : ""}
    >
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-body text-white/55 text-[11px] leading-tight">{label}</p>
          {icon && <span className="text-white/25 shrink-0">{icon}</span>}
        </div>

        {loading ? (
          <Shimmer className="h-8 w-24" />
        ) : (
          <div className={stale ? "av2-stale" : "av2-fresh"}>
            <p className="font-heading text-white text-2xl leading-none">
              <CountUp value={value} format={format} />
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 min-h-[18px]">
          {!loading && !flat && (
            <span
              className="font-body text-[10px] rounded-full px-2 py-0.5"
              style={{
                color: up ? STATUS.good : STATUS.critical,
                backgroundColor: up ? "rgba(12,163,12,0.14)" : "rgba(208,59,59,0.14)",
              }}
            >
              {formatDelta(deltaPct)}
            </span>
          )}
          {sub && <p className="font-body text-white/30 text-[10px] truncate">{sub}</p>}
        </div>

        {previous !== null && previous !== undefined && !loading && (
          <p className="font-body text-white/25 text-[10px]">
            {formatCompact(previous)} in the {compareLabel}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ─── Freshness & provisional ─────────────────────────────────── */

/**
 * When the numbers were last rebuilt, and whether the range can still be
 * restated. Both are stated plainly — a provisional range is not a footnote,
 * it changes how the artist should read every number on the page.
 */
export function FreshnessBar({
  lastRebuiltAt,
  stale = false,
}: {
  lastRebuiltAt?: string | null;
  /**
   * Accepted and ignored. Callers pass it because the API returns it, and it stays in the
   * signature so the shape does not have to change at every call site — but the badge is
   * no longer rendered here. See the note in the body.
   */
  provisional?: boolean;
  stale?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {/* "Updated", not "Rebuilt" — same fact, said in the reader's language. Deliberately
          NOT "last reported": this is when WE recomputed the rollups, whereas last-reported
          would be the newest stream date the data covers. Those are different dates (here,
          7 Aug versus 23 May) and labelling one as the other would misstate how current the
          numbers are. */}
      <span
        className="font-body text-white/35 text-[11px] flex items-center gap-1.5"
        title="When these figures were last recomputed from the partner data we hold."
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: stale ? INK.muted : STATUS.good }}
        />
        Updated {formatDateTime(lastRebuiltAt)}
      </span>

      {/* The provisional badge is intentionally NOT shown here. It is accurate — partners
          restate the last 45 days, so recent figures really can move — but on the freshness
          bar it read as a warning about the whole dashboard. The signal still exists in the
          API (`provisional`) and on the individual data points via ProvisionalBadge, which
          is where it can be tied to the specific numbers it applies to. */}
    </div>
  );
}

export function ProvisionalBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="font-body text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1"
      style={{ color: STATUS.warning, backgroundColor: "rgba(250,178,25,0.12)" }}
      title="Partners restate recent dates for up to 45 days, so these numbers can still change."
    >
      <AlertTriangle size={11} aria-hidden />
      {compact ? "Provisional" : "Provisional — may still change"}
    </span>
  );
}

/**
 * A suppressed cell is not zero and must never be drawn as one. k-anonymity
 * nulled it because the cell was too small to show safely.
 */
export function SuppressedTag({ label = "Suppressed" }: { label?: string }) {
  return (
    <span
      className="font-body text-[10px] rounded-full px-2 py-0.5 inline-flex items-center gap-1 text-white/45 bg-white/[0.05]"
      title="Too few streams to show without identifying listeners. Hidden, not zero."
    >
      <EyeOff size={11} aria-hidden />
      {label}
    </span>
  );
}

export function SuppressionNote({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <p className="font-body text-white/35 text-[11px] flex items-start gap-1.5">
      <EyeOff size={12} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        {count} {count === 1 ? "cell is" : "cells are"} hidden — too few streams to show
        without identifying listeners. Hidden is not zero, so the visible rows add up to
        less than the total.
      </span>
    </p>
  );
}

/* ─── Errors, empty, info ─────────────────────────────────────── */

/**
 * The 422 surface. `errors` is the Laravel field map and is the only place
 * per-field messages live, so every field is listed — showing just `error`
 * would hide the message that names the alternative.
 */
export function ErrorPanel({
  error,
  errors,
  onRetry,
}: {
  error: string | null;
  errors?: Record<string, string[]> | null;
  onRetry?: () => void;
}) {
  const fields = Object.entries(errors ?? {});

  return (
    <div className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/[0.07] p-4 flex flex-col gap-2">
      <p className="font-body text-white text-xs font-medium flex items-center gap-2">
        <AlertTriangle size={14} style={{ color: STATUS.critical }} aria-hidden />
        {error ?? "Could not load this data."}
      </p>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-1.5 pl-6">
          {fields.map(([field, messages]) => (
            <li key={field} className="font-body text-white/60 text-[11px]">
              <span className="text-white/40 capitalize">{field.replace(/_/g, " ")}: </span>
              {messages.join(" ")}
            </li>
          ))}
        </ul>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start font-body text-[11px] text-white/70 hover:text-white border border-white/10 hover:border-white/25 rounded-full px-3 py-1 transition-colors mt-1"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No data for this range",
  message = "Nothing was reported by any partner for the dates you picked.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
      <Info size={26} className="text-white/15" aria-hidden />
      <p className="font-body text-white/45 text-sm">{title}</p>
      <p className="font-body text-white/25 text-xs max-w-xs">{message}</p>
    </div>
  );
}

/* ─── Table view ──────────────────────────────────────────────── */

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

/**
 * The table-view twin. Every chart on this dashboard has one, so no value is
 * reachable only by hovering and colour is never the sole encoding.
 */
export function TableView<T>({
  rows,
  columns,
  caption,
  rowKey,
  defaultOpen = false,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  caption: string;
  rowKey: (row: T, i: number) => string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3 border-t border-white/[0.05] pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="font-body text-white/40 hover:text-white/75 text-[11px] flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:text-white"
      >
        <Table2 size={12} aria-hidden />
        {open ? "Hide" : "Show"} data table
        <ChevronDown
          size={12}
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="av2-module mt-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={[
                      "font-body text-white/35 text-[10px] uppercase tracking-wider font-normal pb-2 border-b border-white/[0.06] whitespace-nowrap",
                      col.align === "right" ? "text-right pl-3" : "text-left pr-3",
                    ].join(" ")}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={rowKey(row, i)} className="border-b border-white/[0.03] last:border-0">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={[
                        "font-body text-white/70 text-[11px] py-2 whitespace-nowrap",
                        col.align === "right"
                          ? "text-right pl-3 tabular-nums"
                          : "text-left pr-3",
                      ].join(" ")}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Legend ──────────────────────────────────────────────────── */

/**
 * Identity is never colour-alone: the swatch sits beside a text label in ink,
 * never a label tinted with the series colour.
 */
export function Legend({
  items,
  className = "",
}: {
  items: Array<{ key: string; label: string; color: string }>;
  className?: string;
}) {
  if (items.length < 2) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`}>
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px] shrink-0"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="font-body text-white/55 text-[11px]">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Small controls ──────────────────────────────────────────── */

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex items-center gap-1 flex-wrap">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              "font-body text-[11px] px-2.5 py-1 rounded-full transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
              active
                ? "text-white bg-[#C30100]/15 border border-[#C30100]/45"
                : "text-white/45 hover:text-white/80 border border-transparent hover:border-white/10",
            ].join(" ")}
          >
            {active && <Check size={10} className="inline mr-1 -mt-px" aria-hidden />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function GhostButton({
  children,
  onClick,
  title,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "font-body text-[11px] rounded-full px-3 py-1.5 border transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
        active
          ? "text-white border-[#C30100]/50 bg-[#C30100]/12"
          : "text-white/50 border-white/10 hover:text-white hover:border-white/25",
      ].join(" ")}
      style={active ? { boxShadow: `0 0 18px -8px ${BRAND}` } : undefined}
    >
      {children}
    </button>
  );
}
