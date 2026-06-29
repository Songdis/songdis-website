// import { useState, useEffect, useCallback } from "react";
// import {
//   getStreams,
//   getTopReleases,
//   getTopPlatforms,
//   getGeographic,
//   getSoundchartsDashboard,
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
//     default:    start.setFullYear(now.getFullYear() - 1);
//   }
//   return { start_date: start.toISOString().split("T")[0], end_date };
// }

// function fmtNum(n: number | string | undefined): string {
//   if (!n && n !== 0) return "0";
//   const num = typeof n === "string" ? parseFloat(n) : n;
//   if (isNaN(num)) return "0";
//   if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//   if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
//   return num.toLocaleString();
// }

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
//     value: string; platform: string; period: string; change: string; available: boolean;
//   };
//   streamsOverTime: { months: string[]; streams: number[]; revenue: number[] };
//   topReleases: Array<{ id: string; rank: number; title: string; artist: string; cover: string; streams: string }>;
//   platformBreakdown: Array<{ name: string; streams: number; color: string }>;
//   geographic: Array<{ country: string; streams: string; percentage: number; change: string; flag: string }>;
// }

// const PLATFORM_COLORS: Record<string, string> = {
//   spotify: "#1DB954", apple_music: "#FC3C44", apple: "#FC3C44",
//   boomplay: "#60a5fa", audiomack: "#f97316",
//   youtube_music: "#C30100", youtube: "#C30100",
//   youtube_streaming: "#C30100", youtube_content_id: "#ff6b6b",
//   tidal: "#888888", deezer: "#A238FF",
//   amazon_music: "#00A8E1", amazon: "#00A8E1",
//   tiktok: "#ffffff", pandora: "#3668FF",
//   facebook: "#1877F2", tiktok_music: "#ffffff",
// };

// const COUNTRY_FLAGS: Record<string, string> = {
//   NG: "🇳🇬", NGA: "🇳🇬", Nigeria: "🇳🇬",
//   US: "🇺🇸", USA: "🇺🇸", "United States": "🇺🇸",
//   GB: "🇬🇧", GBR: "🇬🇧", "United Kingdom": "🇬🇧",
//   GH: "🇬🇭", GHA: "🇬🇭", Ghana: "🇬🇭",
//   KE: "🇰🇪", KEN: "🇰🇪", Kenya: "🇰🇪",
//   ZA: "🇿🇦", ZAF: "🇿🇦",
//   FR: "🇫🇷", FRA: "🇫🇷",
//   DE: "🇩🇪", DEU: "🇩🇪",
//   CA: "🇨🇦", CAN: "🇨🇦",
//   BR: "🇧🇷", CO: "🇨🇴", MX: "🇲🇽",
//   IT: "🇮🇹", ES: "🇪🇸", AR: "🇦🇷",
//   NL: "🇳🇱", AU: "🇦🇺",
// };

// const COUNTRY_CODES: Record<string, string> = {
//   NGA: "Nigeria", USA: "United States", GBR: "United Kingdom",
//   GHA: "Ghana", KEN: "Kenya", ZAF: "South Africa",
//   FRA: "France", DEU: "Germany", CAN: "Canada",
//   BRA: "Brazil", COL: "Colombia", MEX: "Mexico",
//   ITA: "Italy", ESP: "Spain", ARG: "Argentina",
// };

// const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// function normalise(
//   // summaryNoParams: totals without date filter (for stat cards)
//   summaryNoParams: Record<string, unknown> | null,
//   // summaryWithParams: filtered by date range (for chart + top songs + platforms)
//   summaryWithParams: Record<string, unknown> | null,
//   releases: TopRelease[],
//   platforms: TopPlatform[],
//   geographic: GeographicData[],
//   soundcharts: Record<string, unknown> | null
// ): AnalyticsPageData {
//   // Stat cards come from the unfiltered /streams call (no date params)
//   const rawNoParams = unwrapObj(summaryNoParams);
//   const overviewNoParams = (rawNoParams.overview as Record<string, unknown>) ?? rawNoParams;

//   const totalStreams     = (overviewNoParams.total_streams         as number) ?? 0;
//   const avgPerDay       = (overviewNoParams.avg_streams_per_day   as number) ?? (overviewNoParams.avg_per_day as number) ?? 0;
//   const uniqueReleases  = (overviewNoParams.total_active_releases as number) ?? (overviewNoParams.unique_releases as number) ?? 0;
//   const countries       = (overviewNoParams.total_countries       as number) ?? (overviewNoParams.territories_reached as number) ?? 0;
//   const activePlatforms = (overviewNoParams.total_platforms       as number) ?? (overviewNoParams.active_platforms as number) ?? 0;
//   const playlists       = (overviewNoParams.playlists             as number) ?? 0;

//   // Chart data, Top Songs, Platform breakdown — from filtered /streams call
//   const raw = unwrapObj(summaryWithParams ?? summaryNoParams);

//   // Streams over time — from daily_streams
//   const dailyStreams = (raw.daily_streams as Array<Record<string, unknown>>) ?? [];
//   let months: string[], streams: number[], revenue: number[];
//   if (dailyStreams.length > 0) {
//     months  = dailyStreams.map((d) => { const dt = String(d.stream_date ?? ""); return dt.slice(5,7) + "/" + dt.slice(8,10); });
//     streams = dailyStreams.map((d) => (d.total_streams as number) ?? 0);
//     revenue = dailyStreams.map((d) => (d.total_royalties as number) ?? 0);
//   } else {
//     months = []; streams = []; revenue = [];
//   }

//   // Top releases — from /top-releases, fallback to top_tracks in /streams
//   const topReleases = releases.slice(0, 10).map((r, i) => ({
//     id: String((r as Record<string, unknown>).upload_id ?? r.id ?? i),
//     rank: i + 1,
//     title:  ((r as Record<string, unknown>).release_name ?? r.release_title ?? r.title ?? "") as string,
//     artist: ((r as Record<string, unknown>).artists ?? r.primary_artist ?? r.artist ?? "") as string,
//     cover:  (r.album_art_url ?? r.cover ?? "") as string,
//     streams: fmtNum(r.total_streams ?? r.streams ?? r.plays),
//   }));

//   const topTracksFromStreams = (raw.top_tracks as Array<Record<string, unknown>>) ?? [];
//   const finalTopReleases = topReleases.length > 0
//     ? topReleases
//     : topTracksFromStreams.slice(0, 10).map((t, i) => ({
//         id: String(t.upload_id ?? i),
//         rank: i + 1,
//         title:  (t.track_title ?? "") as string,
//         artist: (t.primary_artist ?? "") as string,
//         cover:  (t.album_art_url ?? "") as string,
//         streams: fmtNum(t.total_streams as number),
//       }));

//   // Platform breakdown — from /top-platforms, fallback to platform_breakdown in /streams
//   const platformBreakdown = platforms.length > 0
//     ? platforms.map((p) => {
//         const key = ((p as Record<string, unknown>).platform as string ?? p.name ?? "").toLowerCase();
//         return {
//           name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
//           streams: ((p as Record<string, unknown>).total_streams as number) ?? (p.streams as number) ?? 0,
//           color: PLATFORM_COLORS[key] ?? "#888888",
//         };
//       })
//     : ((raw.platform_breakdown as Array<Record<string, unknown>>) ?? []).map((p) => {
//         const key = ((p.platform_name ?? p.platform ?? "") as string).toLowerCase();
//         return {
//           name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
//           streams: (p.total_streams as number) ?? 0,
//           color: PLATFORM_COLORS[key] ?? "#888888",
//         };
//       });

//   // Geographic — from geographic_summary.top_countries in /streams
//   const topCountries = ((raw.geographic_summary as Record<string, unknown>)?.top_countries as Array<Record<string, unknown>>)
//     ?? (geographic as unknown as Array<Record<string, unknown>>) ?? [];
//   const totalAll = topCountries.reduce((s, x) => s + ((x.total_streams as number) ?? 0), 0);
//   const geo = topCountries.slice(0, 10).map((g) => {
//     const code = (g.country ?? "") as string;
//     const country = COUNTRY_CODES[code] ?? code;
//     const total = (g.total_streams as number) ?? 0;
//     return {
//       country,
//       streams: fmtNum(total),
//       percentage: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
//       change: "",
//       flag: COUNTRY_FLAGS[country] ?? COUNTRY_FLAGS[code] ?? "🌍",
//     };
//   });

//   // Soundcharts — monthly listeners (will be null until backend confirms endpoint)
//   const sc = unwrapObj(soundcharts);
//   const scListeners = sc.monthly_listeners ?? sc.monthlyListeners ?? sc.listeners;

//   return {
//     stats: {
//       totalStreams: { value: fmtNum(totalStreams), sub: "All DSPs",    icon: "/images/streams.svg", change: "" },
//       avgPerDay:   { value: fmtNum(avgPerDay),    sub: "Per day",     icon: "/images/avg-day.svg" },
//       releases:    { value: String(uniqueReleases), sub: "With data", icon: "/images/releases.svg" },
//       countries:   { value: String(countries),    sub: "Territories", icon: "/images/countries.svg" },
//       platforms:   { value: String(activePlatforms), sub: "DSPs",    icon: "/images/platforms.svg" },
//       playlists:   { value: String(playlists),    sub: "Active",      icon: "/images/playlist-analytics.svg" },
//     },
//     monthlyListeners: {
//       value: scListeners != null ? fmtNum(scListeners as number) : "0",
//       platform: (sc.platform ?? "Soundcharts") as string,
//       period: "Last 28 days",
//       change: (sc.change ?? "") as string,
//       // DES-005: Soundcharts endpoint not showing in network tab = endpoint not active on backend
//       // Keep available: false until backend confirms it's live
//       available: scListeners != null,
//     },
//     streamsOverTime: { months, streams, revenue },
//     topReleases: finalTopReleases,
//     platformBreakdown: platformBreakdown.filter(p => p.name.toLowerCase() !== "unknown"),
//     geographic: geo,
//   };
// }

// /* ─── Hook ────────────────────────────────────────────────────── */
// export function useAnalytics(period: string, customStart?: string, customEnd?: string) {
//   const [data, setData] = useState<AnalyticsPageData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     // DES-006: if Custom Range but dates not set yet, don't fire
//     if (period === "Custom Range" && (!customStart || !customEnd)) {
//       setIsLoading(false);
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     const dateParams: DateRangeParams = period === "Custom Range" && customStart && customEnd
//       ? { start_date: customStart, end_date: customEnd }
//       : periodToParams(period);

//     // Fire two /streams calls in parallel:
//     // 1. No params → for stat cards (total streams, avg/day, releases, countries, platforms)
//     // 2. With date params → for charts, top songs, platform breakdown
//     const [
//       summaryNoParamsRes,
//       summaryWithParamsRes,
//       releasesRes,
//       platformsRes,
//       geoRes,
//       soundchartsRes,
//     ] = await Promise.allSettled([
//       getStreams({}),            // No params — gives totals
//       getStreams(dateParams),    // With date range — for chart data
//       getTopReleases(),
//       getTopPlatforms(),
//       getGeographic(dateParams),
//       getSoundchartsDashboard(),
//     ]);

//     const summaryNoParams    = summaryNoParamsRes.status    === "fulfilled" && !summaryNoParamsRes.value.error    ? summaryNoParamsRes.value.data    as Record<string, unknown> : null;
//     const summaryWithParams  = summaryWithParamsRes.status  === "fulfilled" && !summaryWithParamsRes.value.error  ? summaryWithParamsRes.value.data  as Record<string, unknown> : null;
//     const releases    = releasesRes.status   === "fulfilled" && !releasesRes.value.error   ? unwrap<TopRelease>(releasesRes.value.data)  : [];
//     const platforms   = platformsRes.status  === "fulfilled" && !platformsRes.value.error  ? unwrap<TopPlatform>(platformsRes.value.data) : [];
//     const geo         = geoRes.status        === "fulfilled" && !geoRes.value.error        ? unwrap<GeographicData>(geoRes.value.data)   : [];
//     const soundcharts = soundchartsRes.status === "fulfilled" && !soundchartsRes.value.error ? soundchartsRes.value.data as Record<string, unknown> : null;

//     setData(normalise(summaryNoParams, summaryWithParams, releases, platforms, geo, soundcharts));
//     setIsLoading(false);
//   }, [period, customStart, customEnd]);

//   useEffect(() => { load(); }, [load]);

//   return { data, isLoading, error, refresh: load };
// }


import { useState, useEffect, useCallback } from "react";
import {
  getStreams,
  getTopReleases,
  getTopPlatforms,
  getGeographic,
  getSoundchartsDashboard,
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
    default:    start.setFullYear(now.getFullYear() - 1);
  }
  return { start_date: start.toISOString().split("T")[0], end_date };
}

function fmtNum(n: number | string | undefined): string {
  if (!n && n !== 0) return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

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
    value: string; platform: string; period: string; change: string; available: boolean;
    trend: number[];        // sparkline of recent stream_history values
    followerCount: string;  // from audience.items, latest follower count
    followerChange: string; // delta vs previous audience snapshot
  };
  streamsOverTime: { months: string[]; streams: number[]; revenue: number[] };
  topReleases: Array<{ id: string; rank: number; title: string; artist: string; cover: string; streams: string }>;
  platformBreakdown: Array<{ name: string; streams: number; color: string }>;
  geographic: Array<{ country: string; streams: string; percentage: number; change: string; flag: string }>;
}

const PLATFORM_COLORS: Record<string, string> = {
  spotify: "#1DB954", apple_music: "#FC3C44", apple: "#FC3C44",
  boomplay: "#60a5fa", audiomack: "#f97316",
  youtube_music: "#C30100", youtube: "#C30100",
  youtube_streaming: "#C30100", youtube_content_id: "#ff6b6b",
  tidal: "#888888", deezer: "#A238FF",
  amazon_music: "#00A8E1", amazon: "#00A8E1",
  tiktok: "#ffffff", pandora: "#3668FF",
  facebook: "#1877F2", tiktok_music: "#ffffff",
};

const COUNTRY_FLAGS: Record<string, string> = {
  NG: "🇳🇬", NGA: "🇳🇬", Nigeria: "🇳🇬",
  US: "🇺🇸", USA: "🇺🇸", "United States": "🇺🇸",
  GB: "🇬🇧", GBR: "🇬🇧", "United Kingdom": "🇬🇧",
  GH: "🇬🇭", GHA: "🇬🇭", Ghana: "🇬🇭",
  KE: "🇰🇪", KEN: "🇰🇪", Kenya: "🇰🇪",
  ZA: "🇿🇦", ZAF: "🇿🇦",
  FR: "🇫🇷", FRA: "🇫🇷",
  DE: "🇩🇪", DEU: "🇩🇪",
  CA: "🇨🇦", CAN: "🇨🇦",
  BR: "🇧🇷", CO: "🇨🇴", MX: "🇲🇽",
  IT: "🇮🇹", ES: "🇪🇸", AR: "🇦🇷",
  NL: "🇳🇱", AU: "🇦🇺",
};

const COUNTRY_CODES: Record<string, string> = {
  NGA: "Nigeria", USA: "United States", GBR: "United Kingdom",
  GHA: "Ghana", KEN: "Kenya", ZAF: "South Africa",
  FRA: "France", DEU: "Germany", CAN: "Canada",
  BRA: "Brazil", COL: "Colombia", MEX: "Mexico",
  ITA: "Italy", ESP: "Spain", ARG: "Argentina",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function normalise(
  // summaryNoParams: totals without date filter (for stat cards)
  summaryNoParams: Record<string, unknown> | null,
  // summaryWithParams: filtered by date range (for chart + top songs + platforms)
  summaryWithParams: Record<string, unknown> | null,
  releases: TopRelease[],
  platforms: TopPlatform[],
  geographic: GeographicData[],
  soundcharts: Record<string, unknown> | null
): AnalyticsPageData {
  // Stat cards come from the unfiltered /streams call (no date params)
  const rawNoParams = unwrapObj(summaryNoParams);
  const overviewNoParams = (rawNoParams.overview as Record<string, unknown>) ?? rawNoParams;

  const totalStreams     = (overviewNoParams.total_streams         as number) ?? 0;
  const avgPerDay       = (overviewNoParams.avg_streams_per_day   as number) ?? (overviewNoParams.avg_per_day as number) ?? 0;
  const uniqueReleases  = (overviewNoParams.total_active_releases as number) ?? (overviewNoParams.unique_releases as number) ?? 0;
  const countries       = (overviewNoParams.total_countries       as number) ?? (overviewNoParams.territories_reached as number) ?? 0;
  const activePlatforms = (overviewNoParams.total_platforms       as number) ?? (overviewNoParams.active_platforms as number) ?? 0;
  const playlists       = (overviewNoParams.playlists             as number) ?? 0;

  // Chart data, Top Songs, Platform breakdown — from filtered /streams call
  const raw = unwrapObj(summaryWithParams ?? summaryNoParams);

  // Streams over time — from daily_streams
  const dailyStreams = (raw.daily_streams as Array<Record<string, unknown>>) ?? [];
  let months: string[], streams: number[], revenue: number[];
  if (dailyStreams.length > 0) {
    months  = dailyStreams.map((d) => { const dt = String(d.stream_date ?? ""); return dt.slice(5,7) + "/" + dt.slice(8,10); });
    streams = dailyStreams.map((d) => (d.total_streams as number) ?? 0);
    revenue = dailyStreams.map((d) => (d.total_royalties as number) ?? 0);
  } else {
    months = []; streams = []; revenue = [];
  }

  // Top releases — from /top-releases, fallback to top_tracks in /streams
  const topReleases = releases.slice(0, 10).map((r, i) => ({
    id: String((r as Record<string, unknown>).upload_id ?? r.id ?? i),
    rank: i + 1,
    title:  ((r as Record<string, unknown>).release_name ?? r.release_title ?? r.title ?? "") as string,
    artist: ((r as Record<string, unknown>).artists ?? r.primary_artist ?? r.artist ?? "") as string,
    cover:  (r.album_art_url ?? r.cover ?? "") as string,
    streams: fmtNum(r.total_streams ?? r.streams ?? r.plays),
  }));

  const topTracksFromStreams = (raw.top_tracks as Array<Record<string, unknown>>) ?? [];
  const finalTopReleases = topReleases.length > 0
    ? topReleases
    : topTracksFromStreams.slice(0, 10).map((t, i) => ({
        id: String(t.upload_id ?? i),
        rank: i + 1,
        title:  (t.track_title ?? "") as string,
        artist: (t.primary_artist ?? "") as string,
        cover:  (t.album_art_url ?? "") as string,
        streams: fmtNum(t.total_streams as number),
      }));

  // Platform breakdown — from /top-platforms, fallback to platform_breakdown in /streams
  const platformBreakdown = platforms.length > 0
    ? platforms.map((p) => {
        const key = ((p as Record<string, unknown>).platform as string ?? p.name ?? "").toLowerCase();
        return {
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          streams: ((p as Record<string, unknown>).total_streams as number) ?? (p.streams as number) ?? 0,
          color: PLATFORM_COLORS[key] ?? "#888888",
        };
      })
    : ((raw.platform_breakdown as Array<Record<string, unknown>>) ?? []).map((p) => {
        const key = ((p.platform_name ?? p.platform ?? "") as string).toLowerCase();
        return {
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          streams: (p.total_streams as number) ?? 0,
          color: PLATFORM_COLORS[key] ?? "#888888",
        };
      });

  // Geographic — from geographic_summary.top_countries in /streams
  const topCountries = ((raw.geographic_summary as Record<string, unknown>)?.top_countries as Array<Record<string, unknown>>)
    ?? (geographic as unknown as Array<Record<string, unknown>>) ?? [];
  const totalAll = topCountries.reduce((s, x) => s + ((x.total_streams as number) ?? 0), 0);
  const geo = topCountries.slice(0, 10).map((g) => {
    const code = (g.country ?? "") as string;
    const country = COUNTRY_CODES[code] ?? code;
    const total = (g.total_streams as number) ?? 0;
    return {
      country,
      streams: fmtNum(total),
      percentage: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
      change: "",
      flag: COUNTRY_FLAGS[country] ?? COUNTRY_FLAGS[code] ?? "🌍",
    };
  });

  // Soundcharts /dashboard response shape confirmed:
  // { data: { audience: { items: [{ date, followerCount }] },
  //   stream_history: { spotify: { items: [{ date, value }] }, deezer: {...}, ... } } }
  // There is no single "monthly listeners" field — Soundcharts doesn't expose
  // that metric on this endpoint. We build an honest equivalent from the
  // real data available: recent stream activity (stream_history) plus a
  // follower trend (audience), across whichever platform actually has data.
  const sc = unwrapObj(soundcharts);
  const scData = (sc.data as Record<string, unknown>) ?? sc;

  // Find the first platform with non-empty stream_history items
  const streamHistory = (scData.stream_history as Record<string, unknown>) ?? {};
  let recentStreamValue: number | null = null;
  let recentStreamChange = "";
  let streamTrend: number[] = [];
  let activeStreamPlatform = "";

  for (const [platformKey, platformData] of Object.entries(streamHistory)) {
    const items = (platformData as Record<string, unknown>)?.items as Array<Record<string, unknown>> | undefined;
    if (items && items.length > 0) {
      // Items are ordered most-recent-first based on the confirmed payload
      const values = items.map((it) => (it.value as number) ?? 0).filter((v) => v > 0);
      if (values.length > 0) {
        recentStreamValue = values[0];
        activeStreamPlatform = platformKey;
        // Build a trend array oldest -> newest for the sparkline (last 8 points)
        streamTrend = values.slice(0, 8).reverse();
        if (values.length > 1 && values[1] > 0) {
          const pct = ((values[0] - values[1]) / values[1]) * 100;
          recentStreamChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
        }
        break;
      }
    }
  }

  // Follower trend from audience.items — confirmed fields: date, followerCount
  const audienceItems = ((scData.audience as Record<string, unknown>)?.items as Array<Record<string, unknown>>) ?? [];
  let followerCount = "";
  let followerChange = "";
  if (audienceItems.length > 0) {
    const sorted = [...audienceItems].filter((it) => it.followerCount != null);
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    if (latest) {
      followerCount = fmtNum(latest.followerCount as number);
      if (previous) {
        const diff = (latest.followerCount as number) - (previous.followerCount as number);
        followerChange = diff !== 0 ? `${diff > 0 ? "+" : ""}${diff}` : "";
      }
    }
  }

  const platformDisplayName: Record<string, string> = {
    spotify: "Spotify", deezer: "Deezer", appleMusic: "Apple Music",
    youtube: "YouTube", tidal: "Tidal", soundcloud: "SoundCloud", amazon: "Amazon",
  };

  return {
    stats: {
      totalStreams: { value: fmtNum(totalStreams), sub: "All DSPs",    icon: "/images/streams.svg", change: "" },
      avgPerDay:   { value: fmtNum(avgPerDay),    sub: "Per day",     icon: "/images/avg-day.svg" },
      releases:    { value: String(uniqueReleases), sub: "With data", icon: "/images/releases.svg" },
      countries:   { value: String(countries),    sub: "Territories", icon: "/images/countries.svg" },
      platforms:   { value: String(activePlatforms), sub: "DSPs",    icon: "/images/platforms.svg" },
      playlists:   { value: String(playlists),    sub: "Active",      icon: "/images/playlist-analytics.svg" },
    },
    monthlyListeners: {
      value: recentStreamValue != null ? fmtNum(recentStreamValue) : "0",
      platform: platformDisplayName[activeStreamPlatform] ?? activeStreamPlatform ?? "Soundcharts",
      period: "Most recent period",
      change: recentStreamChange,
      available: recentStreamValue != null,
      trend: streamTrend,
      followerCount,
      followerChange,
    },
    streamsOverTime: { months, streams, revenue },
    topReleases: finalTopReleases,
    platformBreakdown: platformBreakdown.filter(p => p.name.toLowerCase() !== "unknown"),
    geographic: geo,
  };
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useAnalytics(period: string, customStart?: string, customEnd?: string) {
  const [data, setData] = useState<AnalyticsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // DES-006: if Custom Range but dates not set yet, don't fire
    if (period === "Custom Range" && (!customStart || !customEnd)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dateParams: DateRangeParams = period === "Custom Range" && customStart && customEnd
      ? { start_date: customStart, end_date: customEnd }
      : periodToParams(period);

    // Fire two /streams calls in parallel:
    // 1. No params → for stat cards (total streams, avg/day, releases, countries, platforms)
    // 2. With date params → for charts, top songs, platform breakdown
    const [
      summaryNoParamsRes,
      summaryWithParamsRes,
      releasesRes,
      platformsRes,
      geoRes,
      soundchartsRes,
    ] = await Promise.allSettled([
      getStreams({}),            // No params — gives totals
      getStreams(dateParams),    // With date range — for chart data
      getTopReleases(),
      getTopPlatforms(),
      getGeographic(dateParams),
      getSoundchartsDashboard(),
    ]);

    const summaryNoParams    = summaryNoParamsRes.status    === "fulfilled" && !summaryNoParamsRes.value.error    ? summaryNoParamsRes.value.data    as Record<string, unknown> : null;
    const summaryWithParams  = summaryWithParamsRes.status  === "fulfilled" && !summaryWithParamsRes.value.error  ? summaryWithParamsRes.value.data  as Record<string, unknown> : null;
    const releases    = releasesRes.status   === "fulfilled" && !releasesRes.value.error   ? unwrap<TopRelease>(releasesRes.value.data)  : [];
    const platforms   = platformsRes.status  === "fulfilled" && !platformsRes.value.error  ? unwrap<TopPlatform>(platformsRes.value.data) : [];
    const geo         = geoRes.status        === "fulfilled" && !geoRes.value.error        ? unwrap<GeographicData>(geoRes.value.data)   : [];
    const soundcharts = soundchartsRes.status === "fulfilled" && !soundchartsRes.value.error ? soundchartsRes.value.data as Record<string, unknown> : null;

    setData(normalise(summaryNoParams, summaryWithParams, releases, platforms, geo, soundcharts));
    setIsLoading(false);
  }, [period, customStart, customEnd]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}