// import { useState, useEffect, useCallback } from "react";
// import {
//   getStreams,
//   getStreamsData,
//   getMonthlyStreams,
//   getTopReleases,
//   getTopPlatforms,
//   getGeographic,
//   getSoundchartsDashboard,
//   getSoundchartsStreamingHistory,
//   type AnalyticsSummary,
//   type TopRelease,
//   type TopPlatform,
//   type GeographicData,
//   type DateRangeParams,
// } from "@/lib/api/analytics";

// /* ─── Period → date range ─────────────────────────────────────── */
// export function periodToParams(period: string): DateRangeParams {
//   const now = new Date();
//   const end_date = now.toISOString().split("T")[0];
//   const start = new Date();

//   switch (period) {
//     case "30D": start.setDate(now.getDate() - 30);       break;
//     case "60D": start.setDate(now.getDate() - 60);       break;
//     case "90D": start.setDate(now.getDate() - 90);       break;
//     default:    start.setFullYear(now.getFullYear() - 1); // 1YR
//   }

//   return { start_date: start.toISOString().split("T")[0], end_date };
// }

// /* ─── Number formatting ───────────────────────────────────────── */
// function fmtNum(n: number | string | undefined): string {
//   if (!n && n !== 0) return "0";
//   const num = typeof n === "string" ? parseFloat(n) : n;
//   if (isNaN(num)) return "0";
//   if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//   if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
//   return num.toLocaleString();
// }

// /* ─── Unwrap helper ───────────────────────────────────────────── */
// function unwrap<T>(raw: unknown): T[] {
//   if (Array.isArray(raw)) return raw as T[];
//   if (raw && typeof raw === "object") {
//     const obj = raw as Record<string, unknown>;
//     if (Array.isArray(obj.data)) return obj.data as T[];
//     if (obj.data && typeof obj.data === "object") {
//       const inner = obj.data as Record<string, unknown>;
//       if (Array.isArray(inner.data)) return inner.data as T[];
//     }
//   }
//   return [];
// }

// function unwrapObj(raw: unknown): Record<string, unknown> {
//   if (!raw || typeof raw !== "object") return {};
//   const obj = raw as Record<string, unknown>;
//   return (obj.data as Record<string, unknown>) ?? obj;
// }

// /* ─── Normalised page shape ───────────────────────────────────── */
// export interface AnalyticsPageData {
//   stats: {
//     totalStreams: { value: string; sub: string; icon: string; change?: string };
//     avgPerDay:    { value: string; sub: string; icon: string };
//     releases:     { value: string; sub: string; icon: string };
//     countries:    { value: string; sub: string; icon: string };
//     platforms:    { value: string; sub: string; icon: string };
//     playlists:    { value: string; sub: string; icon: string };
//   };
//   monthlyListeners: {
//     value: string;
//     platform: string;
//     period: string;
//     change: string;
//     available: boolean;
//   };
//   streamsOverTime: { months: string[]; streams: number[]; revenue: number[] };
//   topReleases: Array<{
//     id: string; rank: number; title: string; artist: string;
//     cover: string; streams: string;
//   }>;
//   platformBreakdown: Array<{
//     name: string; streams: number; color: string;
//   }>;
//   geographic: Array<{
//     country: string; streams: string; percentage: number; change: string; flag: string;
//   }>;
// }

// const PLATFORM_COLORS: Record<string, string> = {
//   spotify:       "#1DB954",
//   apple_music:   "#FC3C44",
//   apple:         "#FC3C44",
//   boomplay:      "#60a5fa",
//   audiomack:     "#f97316",
//   youtube_music: "#C30100",
//   youtube:       "#C30100",
//   tidal:         "#888888",
//   deezer:        "#A238FF",
//   amazon_music:  "#00A8E1",
//   amazon:        "#00A8E1",
//   tiktok:        "#ffffff",
// };

// const COUNTRY_FLAGS: Record<string, string> = {
//   Nigeria: "🇳🇬", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
//   Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
//   France: "🇫🇷", Germany: "🇩🇪", Canada: "🇨🇦", NG: "🇳🇬",
//   US: "🇺🇸", GB: "🇬🇧", GH: "🇬🇭", KE: "🇰🇪",
// };

// const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// function normalise(
//   summary: Record<string, unknown> | null,
//   streamsData: Record<string, unknown> | null,
//   releases: TopRelease[],
//   platforms: TopPlatform[],
//   geographic: GeographicData[],
//   soundcharts: Record<string, unknown> | null
// ): AnalyticsPageData {
//   const s = unwrapObj(summary);

//   // GET /streams confirmed fields
//   const totalStreams    = (s.total_streams    as number) ?? (s.totalStreams    as number) ?? 0;
//   const avgPerDay      = (s.avg_per_day      as number) ?? (s.averagePerDay  as number) ?? 0;
//   const uniqueReleases = (s.unique_releases  as number) ?? (s.releases       as number) ?? 0;
//   const countries      = (s.territories_reached as number) ?? (s.countries   as number) ?? 0;
//   const activePlatforms= (s.active_platforms as number) ?? (s.platforms      as number) ?? 0;
//   const playlists      = (s.playlists        as number) ?? 0;

//   // Streams over time
//   const sd = unwrapObj(streamsData);
//   const months  = (sd.months   as string[]) ?? MONTHS;
//   const streams = (sd.streams  as number[]) ?? Array(12).fill(0);
//   const revenue = (sd.revenue  as number[]) ?? Array(12).fill(0);

//   // Top releases
//   const topReleases = releases.slice(0, 10).map((r, i) => ({
//     id: String(r.id ?? i),
//     rank: i + 1,
//     title:  (r.release_title ?? r.title   ?? "") as string,
//     artist: (r.primary_artist ?? r.artist ?? "") as string,
//     cover:  (r.album_art_url  ?? r.cover  ?? "/images/releases/cover-blue.svg") as string,
//     streams: fmtNum(r.streams ?? r.plays),
//   }));

//   // Platform breakdown
//   const platformBreakdown = platforms.map((p) => {
//     const key = (p.platform ?? p.name ?? "").toLowerCase().replace(/\s+/g, "_");
//     return {
//       name:    (p.name ?? p.platform ?? "") as string,
//       streams: (p.streams ?? 0) as number,
//       color:   PLATFORM_COLORS[key] ?? "#888888",
//     };
//   });

//   // Geographic
//   const geo = geographic.map((g) => {
//     const country = (g.country_name ?? g.country ?? "") as string;
//     return {
//       country,
//       streams: fmtNum(g.streams),
//       percentage: (g.percentage ?? 0) as number,
//       change: (g.change ?? "") as string,
//       flag: COUNTRY_FLAGS[country] ?? "🌍",
//     };
//   });

//   // Soundcharts — monthly listeners
//   const sc = unwrapObj(soundcharts);
//   const scListeners = sc.monthly_listeners ?? sc.monthlyListeners ?? sc.listeners;
//   const scAvailable = scListeners != null;
//   const scChange = (sc.change ?? sc.growth ?? "") as string;

//   return {
//     stats: {
//       totalStreams: { value: fmtNum(totalStreams), sub: "All DSPs",      icon: "/images/streams.svg",            change: "" },
//       avgPerDay:   { value: fmtNum(avgPerDay),    sub: "Per day",       icon: "/images/avg-day.svg" },
//       releases:    { value: String(uniqueReleases), sub: "With data",   icon: "/images/releases.svg" },
//       countries:   { value: String(countries),    sub: "Territories",   icon: "/images/countries.svg" },
//       platforms:   { value: String(activePlatforms), sub: "DSPs",      icon: "/images/platforms.svg" },
//       playlists:   { value: String(playlists),    sub: "Active",        icon: "/images/playlist-analytics.svg" },
//     },
//     monthlyListeners: {
//       value: scAvailable ? fmtNum(scListeners as number) : "0",
//       platform: (sc.platform ?? "Soundcharts") as string,
//       period: "Last 28 days",
//       change: scChange,
//       available: scAvailable,
//     },
//     streamsOverTime: { months, streams, revenue },
//     topReleases:      topReleases.length > 0 ? topReleases : [],
//     platformBreakdown: platformBreakdown.length > 0 ? platformBreakdown : [],
//     geographic:       geo.length > 0 ? geo : [],
//   };
// }

// /* ─── Hook ────────────────────────────────────────────────────── */
// export function useAnalytics(period: string) {
//   const [data, setData] = useState<AnalyticsPageData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     const params = period === "Custom Range" ? {} : periodToParams(period);

//     // Fire all in parallel — individual failures don't block the page
//     const [summaryRes, streamsRes, releasesRes, platformsRes, geoRes, soundchartsRes] =
//       await Promise.allSettled([
//         getStreams(params),
//         getStreamsData(params),
//         getTopReleases(),
//         getTopPlatforms(),
//         getGeographic(params),
//         getSoundchartsDashboard(),
//       ]);

//     const summary    = summaryRes.status    === "fulfilled" && !summaryRes.value.error    ? summaryRes.value.data    as Record<string, unknown> : null;
//     const streams    = streamsRes.status    === "fulfilled" && !streamsRes.value.error    ? streamsRes.value.data    as Record<string, unknown> : null;
//     const releases   = releasesRes.status   === "fulfilled" && !releasesRes.value.error   ? unwrap<TopRelease>(releasesRes.value.data)   : [];
//     const platforms  = platformsRes.status  === "fulfilled" && !platformsRes.value.error  ? unwrap<TopPlatform>(platformsRes.value.data)  : [];
//     const geo        = geoRes.status        === "fulfilled" && !geoRes.value.error        ? unwrap<GeographicData>(geoRes.value.data)    : [];
//     const soundcharts= soundchartsRes.status === "fulfilled" && !soundchartsRes.value.error ? soundchartsRes.value.data as Record<string, unknown> : null;

//     setData(normalise(summary, streams, releases, platforms, geo, soundcharts));
//     setIsLoading(false);
//   }, [period]);

//   useEffect(() => { load(); }, [load]);

//   return { data, isLoading, error, refresh: load };
// }


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
  getSoundchartsDashboard,
  getSoundchartsStreamingHistory,
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
  monthlyListeners: {
    value: string;
    platform: string;
    period: string;
    change: string;
    available: boolean;
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
  spotify:             "#1DB954",
  apple_music:         "#FC3C44",
  apple:               "#FC3C44",
  boomplay:            "#60a5fa",
  audiomack:           "#f97316",
  youtube_music:       "#C30100",
  youtube:             "#C30100",
  youtube_streaming:   "#C30100",
  youtube_content_id:  "#ff6b6b",
  tidal:               "#888888",
  deezer:              "#A238FF",
  amazon_music:        "#00A8E1",
  amazon:              "#00A8E1",
  tiktok:              "#ffffff",
  pandora:             "#3668FF",
};

const COUNTRY_FLAGS: Record<string, string> = {
  Nigeria: "🇳🇬", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
  France: "🇫🇷", Germany: "🇩🇪", Canada: "🇨🇦",
  NG: "🇳🇬", NGA: "🇳🇬",
  US: "🇺🇸", USA: "🇺🇸",
  GB: "🇬🇧", GBR: "🇬🇧",
  GH: "🇬🇭", GHA: "🇬🇭",
  KE: "🇰🇪", KEN: "🇰🇪",
  ZA: "🇿🇦", ZAF: "🇿🇦",
  FR: "🇫🇷", FRA: "🇫🇷",
  DE: "🇩🇪", DEU: "🇩🇪",
  CA: "🇨🇦", CAN: "🇨🇦",
  BR: "🇧🇷", BRA: "🇧🇷",
  CO: "🇨🇴", COL: "🇨🇴",
  MX: "🇲🇽", MEX: "🇲🇽",
  IT: "🇮🇹", ITA: "🇮🇹",
  ES: "🇪🇸", ESP: "🇪🇸",
  SE: "🇸🇪", SWE: "🇸🇪",
  AR: "🇦🇷", ARG: "🇦🇷",
  PE: "🇵🇪", PER: "🇵🇪",
  CL: "🇨🇱", CHL: "🇨🇱",
  IN: "🇮🇳", IND: "🇮🇳",
  MY: "🇲🇾", MYS: "🇲🇾",
};

// ISO 3166-1 alpha-3 → full country name
const COUNTRY_CODES: Record<string, string> = {
  NGA: "Nigeria", USA: "United States", GBR: "United Kingdom",
  GHA: "Ghana",   KEN: "Kenya",        ZAF: "South Africa",
  FRA: "France",  DEU: "Germany",      CAN: "Canada",
  BRA: "Brazil",  COL: "Colombia",     MEX: "Mexico",
  ITA: "Italy",   ESP: "Spain",        SWE: "Sweden",
  ARG: "Argentina", PER: "Peru",       CHL: "Chile",
  IND: "India",   MYS: "Malaysia",     DOM: "Dominican Republic",
  GTM: "Guatemala", PAN: "Panama",     BOL: "Bolivia",
  HND: "Honduras", CRI: "Costa Rica",  NIC: "Nicaragua",
  SLV: "El Salvador", ECU: "Ecuador",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function normalise(
  summary: Record<string, unknown> | null,
  streamsData: Record<string, unknown> | null,
  releases: TopRelease[],
  platforms: TopPlatform[],
  geographic: GeographicData[],
  soundcharts: Record<string, unknown> | null
): AnalyticsPageData {
  /**
   * Confirmed API shapes:
   *
   * GET /streams → { success, data: { overview: { total_streams, avg_streams_per_day,
   *   total_active_releases, total_countries, total_platforms },
   *   platform_breakdown: [{ platform_name, total_streams, total_royalties, territories }],
   *   top_tracks: [{ track_title, primary_artist, upload_id, total_streams, total_royalties,
   *     countries_reached, platform_count }],
   *   geographic_summary: { top_countries: [{ country, total_streams }] },
   *   daily_streams: [{ stream_date, total_streams }] }}
   *
   * GET /top-releases → { success, data: [{ release_name, artists, total_streams, platforms }] }
   *
   * GET /top-platforms → { success, data: [{ platform, total_streams, countries }] }
   */

  // Unwrap the nested .data wrapper
  const raw = unwrapObj(summary);
  // GET /streams wraps everything under data.overview
  const overview = (raw.overview as Record<string, unknown>) ?? raw;

  // Stats — from overview
  const totalStreams    = (overview.total_streams        as number) ?? 0;
  const avgPerDay      = (overview.avg_streams_per_day  as number) ??
                         (overview.avg_per_day          as number) ?? 0;
  const uniqueReleases = (overview.total_active_releases as number) ??
                         (overview.unique_releases      as number) ?? 0;
  const countries      = (overview.total_countries      as number) ??
                         (overview.territories_reached  as number) ?? 0;
  const activePlatforms= (overview.total_platforms      as number) ??
                         (overview.active_platforms     as number) ?? 0;
  const playlists      = (overview.playlists            as number) ?? 0;

  // Streams over time — from daily_streams array
  const dailyStreams = (raw.daily_streams as Array<Record<string, unknown>>) ?? [];
  let months: string[];
  let streams: number[];
  let revenue: number[];

  if (dailyStreams.length > 0) {
    months  = dailyStreams.map((d) => {
      const date = String(d.stream_date ?? d.date ?? "");
      return date.slice(5, 7) + "/" + date.slice(8, 10); // MM/DD
    });
    streams = dailyStreams.map((d) => (d.total_streams as number) ?? 0);
    revenue = dailyStreams.map((d) => (d.total_royalties as number) ?? 0);
  } else if (streamsData) {
    const sd = unwrapObj(streamsData);
    months  = (sd.months  as string[]) ?? MONTHS;
    streams = (sd.streams as number[]) ?? Array(12).fill(0);
    revenue = (sd.revenue as number[]) ?? Array(12).fill(0);
  } else {
    months = []; streams = []; revenue = [];
  }

  // Top releases — from GET /top-releases
  // Field: release_name, artists, total_streams
  // Also check top_tracks from /streams for fallback
  const topReleases = releases.slice(0, 10).map((r, i) => ({
    id: String((r as Record<string, unknown>).upload_id ?? r.id ?? i),
    rank: i + 1,
    title:  ((r as Record<string, unknown>).release_name
             ?? r.release_title ?? r.title ?? "") as string,
    artist: ((r as Record<string, unknown>).artists
             ?? r.primary_artist ?? r.artist ?? "") as string,
    cover:  (r.album_art_url ?? r.cover ?? "/images/releases/cover-blue.svg") as string,
    streams: fmtNum(r.total_streams ?? r.streams ?? r.plays),
  }));

  // If top-releases returned nothing, fall back to top_tracks from /streams
  const topTracksFromStreams = (raw.top_tracks as Array<Record<string, unknown>>) ?? [];
  const finalTopReleases = topReleases.length > 0
    ? topReleases
    : topTracksFromStreams.slice(0, 10).map((t, i) => ({
        id: String(t.upload_id ?? i),
        rank: i + 1,
        title:  (t.track_title  ?? "") as string,
        artist: (t.primary_artist ?? "") as string,
        cover:  "/images/releases/cover-blue.svg",
        streams: fmtNum(t.total_streams as number),
      }));

  // Platform breakdown — from GET /top-platforms
  // Field: platform, total_streams
  // Also check platform_breakdown from /streams for fallback
  const platformBreakdown = platforms.length > 0
    ? platforms.map((p) => {
        const key = ((p as Record<string, unknown>).platform as string
                     ?? p.name ?? "").toLowerCase();
        return {
          name:    (key.charAt(0).toUpperCase() + key.slice(1)).replace(/_/g, " "),
          streams: ((p as Record<string, unknown>).total_streams as number)
                   ?? (p.streams as number) ?? 0,
          color:   PLATFORM_COLORS[key] ?? "#888888",
        };
      })
    : ((raw.platform_breakdown as Array<Record<string, unknown>>) ?? []).map((p, i) => {
        const key = ((p.platform_name ?? p.platform ?? "") as string).toLowerCase();
        return {
          name:    key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          streams: (p.total_streams as number) ?? 0,
          color:   PLATFORM_COLORS[key] ?? PLATFORM_COLORS[key.split("_")[0]] ?? "#888888",
        };
      });

  // Geographic — from geographic_summary.top_countries in /streams
  const topCountries = ((raw.geographic_summary as Record<string, unknown>)
                        ?.top_countries as Array<Record<string, unknown>>)
                       ?? (geographic as unknown as Array<Record<string, unknown>>) ?? [];

  const geo = topCountries.slice(0, 10).map((g) => {
    const code    = (g.country ?? "") as string;
    const country = COUNTRY_CODES[code] ?? code;
    const total   = (g.total_streams as number) ?? 0;
    const totalAll = topCountries.reduce((sum, x) => sum + ((x.total_streams as number) ?? 0), 0);
    return {
      country,
      streams: fmtNum(total),
      percentage: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
      change: "",
      flag: COUNTRY_FLAGS[country] ?? COUNTRY_FLAGS[code] ?? "🌍",
    };
  });

  // Soundcharts — monthly listeners
  const sc = unwrapObj(soundcharts);
  const scListeners = sc.monthly_listeners ?? sc.monthlyListeners ?? sc.listeners;
  const scAvailable = scListeners != null;
  const scChange = (sc.change ?? sc.growth ?? "") as string;

  return {
    stats: {
      totalStreams: { value: fmtNum(totalStreams), sub: "All DSPs",    icon: "/images/streams.svg",            change: "" },
      avgPerDay:   { value: fmtNum(avgPerDay),    sub: "Per day",     icon: "/images/avg-day.svg" },
      releases:    { value: String(uniqueReleases), sub: "With data", icon: "/images/releases.svg" },
      countries:   { value: String(countries),    sub: "Territories", icon: "/images/countries.svg" },
      platforms:   { value: String(activePlatforms), sub: "DSPs",    icon: "/images/platforms.svg" },
      playlists:   { value: String(playlists),    sub: "Active",      icon: "/images/playlist-analytics.svg" },
    },
    monthlyListeners: {
      value: scAvailable ? fmtNum(scListeners as number) : "0",
      platform: (sc.platform ?? "Soundcharts") as string,
      period: "Last 28 days",
      change: scChange,
      available: scAvailable,
    },
    streamsOverTime: { months, streams, revenue },
    topReleases:      finalTopReleases,
    platformBreakdown: platformBreakdown.filter(p => p.name.toLowerCase() !== "unknown"),
    geographic:       geo,
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
    const [summaryRes, streamsRes, releasesRes, platformsRes, geoRes, soundchartsRes] =
      await Promise.allSettled([
        getStreams(params),
        getStreamsData(params),
        getTopReleases(),
        getTopPlatforms(),
        getGeographic(params),
        getSoundchartsDashboard(),
      ]);

    const summary    = summaryRes.status    === "fulfilled" && !summaryRes.value.error    ? summaryRes.value.data    as Record<string, unknown> : null;
    const streams    = streamsRes.status    === "fulfilled" && !streamsRes.value.error    ? streamsRes.value.data    as Record<string, unknown> : null;
    const releases   = releasesRes.status   === "fulfilled" && !releasesRes.value.error   ? unwrap<TopRelease>(releasesRes.value.data)   : [];
    const platforms  = platformsRes.status  === "fulfilled" && !platformsRes.value.error  ? unwrap<TopPlatform>(platformsRes.value.data)  : [];
    const geo        = geoRes.status        === "fulfilled" && !geoRes.value.error        ? unwrap<GeographicData>(geoRes.value.data)    : [];
    const soundcharts= soundchartsRes.status === "fulfilled" && !soundchartsRes.value.error ? soundchartsRes.value.data as Record<string, unknown> : null;

    setData(normalise(summary, streams, releases, platforms, geo, soundcharts));
    setIsLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}