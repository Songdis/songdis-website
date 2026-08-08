/**
 * components/dashboard/analytics-v2/theme.ts
 *
 * Chart tokens for the v2 dashboard. Every value here was validated against the
 * card surface #180F0F, not eyeballed.
 *
 * Two things that look like mistakes but aren't:
 *
 * 1. `BRAND_MARK` is #E5342F, not the brand red #C30100. Brand red measures
 *    2.98:1 on #180F0F — just under the 3:1 floor for a chart mark. #E5342F is
 *    the same hue (OKLCH 27.6 vs 29.3) stepped for the dark surface, at 4.37:1.
 *    #C30100 is still the brand colour everywhere it is chrome rather than data:
 *    borders, glows, badges, the active-tab rule.
 *
 * 2. `PLATFORM_COLORS` assigns a fixed hue per feed, in a fixed order, and the
 *    slot-8 red of the source palette is deliberately unused so no platform can
 *    impersonate the brand accent. Colour follows the platform, never its rank —
 *    filtering a platform out must not repaint the survivors.
 *
 * The seven-slot set passes all six checks on this surface (lightness band,
 * chroma floor, adjacent CVD dE 8.4, normal-vision dE 19.3, contrast >= 3:1).
 */

import { PLATFORMS } from "@/lib/api/analytics-v2";

/* ─── Surfaces & ink ──────────────────────────────────────────── */

export const SURFACE = "#180F0F";
export const PAGE = "#0E0808";
export const TOOLTIP_BG = "#1A0808";

export const INK = {
  primary: "#FFFFFF",
  secondary: "rgba(255,255,255,0.72)",
  muted: "#898781",
  faint: "rgba(255,255,255,0.35)",
} as const;

export const GRID = "rgba(255,255,255,0.05)";
export const AXIS = "rgba(255,255,255,0.10)";

/** Brand red — chrome only (borders, glow, badges). Never a chart mark. */
export const BRAND = "#C30100";
/** Brand red stepped for the dark chart surface. This is the mark colour. */
export const BRAND_MARK = "#E5342F";

/* ─── Status (fixed, never themed) ────────────────────────────── */

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

/* ─── Platform identity ───────────────────────────────────────── */

const SLOTS = [
  "#3987e5", // blue
  "#d95926", // orange
  "#199e70", // aqua
  "#c98500", // yellow
  "#d55181", // magenta
  "#008300", // green
  "#9085e9", // violet
] as const;

export const PLATFORM_COLORS: Record<string, string> = PLATFORMS.reduce(
  (acc, key, i) => {
    acc[key] = SLOTS[i];
    return acc;
  },
  {} as Record<string, string>
);

/** Anything the API adds later reads as "unclassified" rather than stealing a hue. */
export const UNKNOWN_PLATFORM_COLOR = "#6E6A66";

export function platformColor(key: string): string {
  return PLATFORM_COLORS[key] ?? UNKNOWN_PLATFORM_COLOR;
}

/**
 * Canonical display order. Series are ordered by identity, not by value, so a
 * platform keeps its position and colour as the data moves underneath it.
 */
export function orderPlatforms(keys: string[]): string[] {
  const rank = new Map<string, number>(PLATFORMS.map((p, i) => [p as string, i]));
  return [...keys].sort(
    (a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99) || a.localeCompare(b)
  );
}

/* ─── Recharts chrome ─────────────────────────────────────────── */

export const AXIS_TICK = { fill: INK.muted, fontSize: 10 } as const;

export const TOOLTIP_STYLE = {
  background: TOOLTIP_BG,
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  fontSize: 11,
  padding: "8px 10px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
} as const;

/* ─── Formatting ──────────────────────────────────────────────── */

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export function formatFull(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

/** Rates arrive as 0..1. */
export function formatRate(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

export function formatDelta(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || !Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "6 Aug" / "6 Aug 2025" when the year differs from today. */
export function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatGrantedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
