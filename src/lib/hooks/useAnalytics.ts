/**
 * lib/hooks/useAnalytics.ts
 */

import { useState, useEffect, useCallback } from "react";
import {
  getStreams,
  getStreamsData,
  getMonthlyStreams,
  getTopReleases,
  getTopPlatforms,
  getGeographic,
  type AnalyticsSummary,
  type TopRelease,
  type TopPlatform,
  type GeographicData,
  type DateRangeParams,
} from "@/lib/api/analytics";

/* ─── Period → date range ─────────────────────────────────────── */
export function periodToParams(period: string): DateRangeParams {
  const now = new Date();
  const end_date = now.toISOString().split("T")[0];
  const start = new Date();

  switch (period) {
    case "30D": start.setDate(now.getDate() - 30);       break;
    case "60D": start.setDate(now.getDate() - 60);       break;
    case "90D": start.setDate(now.getDate() - 90);       break;
    default:    start.setFullYear(now.getFullYear() - 1); // 1YR
  }

  return { start_date: start.toISOString().split("T")[0], end_date };
}

/* ─── Number formatting ───────────────────────────────────────── */
function fmtNum(n: number | string | undefined): string {
  if (!n && n !== 0) return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/* ─── Unwrap helper ───────────────────────────────────────────── */
function unwrap<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

function unwrapObj(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return (obj.data as Record<string, unknown>) ?? obj;
}

/* ─── Normalised page shape ───────────────────────────────────── */
export interface AnalyticsPageData {
  stats: {
    totalStreams: { value: string; sub: string; icon: string; change?: string };
    avgPerDay:    { value: string; sub: string; icon: string };
    releases:     { value: string; sub: string; icon: string };
    countries:    { value: string; sub: string; icon: string };
    platforms:    { value: string; sub: string; icon: string };
    playlists:    { value: string; sub: string; icon: string };
  };
  streamsOverTime: { months: string[]; streams: number[]; revenue: number[] };
  topReleases: Array<{
    id: string; rank: number; title: string; artist: string;
    cover: string; streams: string;
  }>;
  platformBreakdown: Array<{
    name: string; streams: number; color: string;
  }>;
  geographic: Array<{
    country: string; streams: string; percentage: number; change: string; flag: string;
  }>;
}

const PLATFORM_COLORS: Record<string, string> = {
  spotify:       "#1DB954",
  apple_music:   "#FC3C44",
  apple:         "#FC3C44",
  boomplay:      "#60a5fa",
  audiomack:     "#f97316",
  youtube_music: "#C30100",
  youtube:       "#C30100",
  tidal:         "#888888",
  deezer:        "#A238FF",
  amazon_music:  "#00A8E1",
  amazon:        "#00A8E1",
  tiktok:        "#ffffff",
};

const COUNTRY_FLAGS: Record<string, string> = {
  Nigeria: "🇳🇬", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
  France: "🇫🇷", Germany: "🇩🇪", Canada: "🇨🇦", NG: "🇳🇬",
  US: "🇺🇸", GB: "🇬🇧", GH: "🇬🇭", KE: "🇰🇪",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function normalise(
  summary: Record<string, unknown> | null,
  streamsData: Record<string, unknown> | null,
  releases: TopRelease[],
  platforms: TopPlatform[],
  geographic: GeographicData[]
): AnalyticsPageData {
  const s = unwrapObj(summary);

  const totalStreams    = (s.total_streams        as number) ?? 0;
  const avgPerDay      = (s.avg_per_day           as number) ?? 0;
  const uniqueReleases = (s.unique_releases       as number) ?? 0;
  const countries      = (s.territories_reached   as number) ??
                         (s.countries             as number) ?? 0;
  const activePlatforms= (s.active_platforms      as number) ??
                         (s.platforms             as number) ?? 0;
  const playlists      = (s.playlists             as number) ?? 0;

  // Streams over time
  const sd = unwrapObj(streamsData);
  const months  = (sd.months   as string[]) ?? MONTHS;
  const streams = (sd.streams  as number[]) ?? Array(12).fill(0);
  const revenue = (sd.revenue  as number[]) ?? Array(12).fill(0);

  // Top releases
  const topReleases = releases.slice(0, 10).map((r, i) => ({
    id: String(r.id ?? i),
    rank: i + 1,
    title:  (r.release_title ?? r.title   ?? "") as string,
    artist: (r.primary_artist ?? r.artist ?? "") as string,
    cover:  (r.album_art_url  ?? r.cover  ?? "/images/releases/cover-blue.svg") as string,
    streams: fmtNum(r.streams ?? r.plays),
  }));

  // Platform breakdown
  const platformBreakdown = platforms.map((p) => {
    const key = (p.platform ?? p.name ?? "").toLowerCase().replace(/\s+/g, "_");
    return {
      name:    (p.name ?? p.platform ?? "") as string,
      streams: (p.streams ?? 0) as number,
      color:   PLATFORM_COLORS[key] ?? "#888888",
    };
  });

  // Geographic
  const geo = geographic.map((g) => {
    const country = (g.country_name ?? g.country ?? "") as string;
    return {
      country,
      streams: fmtNum(g.streams),
      percentage: (g.percentage ?? 0) as number,
      change: (g.change ?? "") as string,
      flag: COUNTRY_FLAGS[country] ?? "🌍",
    };
  });

  return {
    stats: {
      totalStreams: { value: fmtNum(totalStreams), sub: "All DSPs",    icon: "/icons/analytics/streams.svg",  change: "" },
      avgPerDay:   { value: fmtNum(avgPerDay),    sub: "Per day",     icon: "/icons/analytics/avg-day.svg" },
      releases:    { value: String(uniqueReleases), sub: "With data", icon: "/icons/analytics/releases.svg" },
      countries:   { value: String(countries),    sub: "Territories", icon: "/icons/analytics/countries.svg" },
      platforms:   { value: String(activePlatforms), sub: "DSPs",     icon: "/icons/analytics/platforms.svg" },
      playlists:   { value: String(playlists),    sub: "Active",      icon: "/icons/analytics/playlists.svg" },
    },
    streamsOverTime: { months, streams, revenue },
    topReleases:      topReleases.length > 0 ? topReleases : [],
    platformBreakdown: platformBreakdown.length > 0 ? platformBreakdown : [],
    geographic:       geo.length > 0 ? geo : [],
  };
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useAnalytics(period: string) {
  const [data, setData] = useState<AnalyticsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = period === "Custom Range" ? {} : periodToParams(period);

    // Fire all in parallel — individual failures don't block the page
    const [summaryRes, streamsRes, releasesRes, platformsRes, geoRes] =
      await Promise.allSettled([
        getStreams(params),
        getStreamsData(params),
        getTopReleases(),
        getTopPlatforms(),
        getGeographic(params),
      ]);

    const summary   = summaryRes.status   === "fulfilled" && !summaryRes.value.error   ? summaryRes.value.data   as Record<string, unknown> : null;
    const streams   = streamsRes.status   === "fulfilled" && !streamsRes.value.error   ? streamsRes.value.data   as Record<string, unknown> : null;
    const releases  = releasesRes.status  === "fulfilled" && !releasesRes.value.error  ? unwrap<TopRelease>(releasesRes.value.data)  : [];
    const platforms = platformsRes.status === "fulfilled" && !platformsRes.value.error ? unwrap<TopPlatform>(platformsRes.value.data) : [];
    const geo       = geoRes.status       === "fulfilled" && !geoRes.value.error       ? unwrap<GeographicData>(geoRes.value.data)   : [];

    setData(normalise(summary, streams, releases, platforms, geo));
    setIsLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}