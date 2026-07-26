import { useState, useEffect, useCallback } from "react";
import {
  getStreams,
  getGeographic,
  getSoundchartsStatus,
  getSoundchartsDashboard,
  type GeographicData,
  type DateRangeParams,
} from "@/lib/api/analytics";

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
    trend: number[];
    followerCount: string;
    followerChange: string;
  };
  streamsOverTime: { months: string[]; streams: number[]; revenue: number[] };
  topReleases: Array<{ id: string; rank: number; title: string; artist: string; cover: string; streams: string }>;
  platformBreakdown: Array<{ name: string; streams: number; color: string }>;
  geographic: Array<{ country: string; streams: string; percentage: number; change: string; flag: string }>;
  chartEntries: Array<{ rank: number; rankDiff?: number; chartName?: string; chart?: { name: string }; platformName?: string; platform?: string; date?: string }>;
  playlistEntries: Array<{ position?: number; platform?: string; playlist?: { name: string; imageUrl?: string; followersCount?: number } }>;
  radioSpins: Array<{ stationName?: string; station?: { name: string }; country?: string; date?: string; spinsCount?: number }>;
  streamHistoryByPlatform: Record<string, Array<{ date: string; value: number }>>;
  socialHistoryByPlatform: Record<string, Array<{ date: string; followerCount?: number; likeCount?: number; postCount?: number; viewCount?: number }>>;
  soundchartsAvailable: boolean;
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
  summary: Record<string, unknown> | null,
  geographic: GeographicData[],
  soundcharts: Record<string, unknown> | null
): AnalyticsPageData {
  const raw = unwrapObj(summary);

  const overview = (raw.overview as Record<string, unknown>) ?? {};
  const totalStreams     = (overview.total_streams         as number) ?? 0;
  const avgPerDay       = (overview.avg_streams_per_day   as number) ?? (overview.avg_per_day as number) ?? 0;
  const uniqueReleases  = (overview.total_active_releases as number) ?? (overview.unique_releases as number) ?? 0;
  const countries       = (overview.total_countries       as number) ?? (overview.territories_reached as number) ?? 0;
  const activePlatforms = (overview.total_platforms       as number) ?? (overview.active_platforms as number) ?? 0;
  const playlists       = (overview.playlists             as number) ?? 0;

  const dailyStreams = (raw.daily_streams as Array<Record<string, unknown>>) ?? [];
  let months: string[], streams: number[], revenue: number[];
  if (dailyStreams.length > 0) {
    months  = dailyStreams.map((d) => { const dt = String(d.stream_date ?? ""); return dt.slice(5,7) + "/" + dt.slice(8,10); });
    streams = dailyStreams.map((d) => (d.total_streams as number) ?? 0);
    revenue = dailyStreams.map((d) => (d.total_royalties as number) ?? 0);
  } else {
    months = []; streams = []; revenue = [];
  }


  const topTracksFromStreams = (raw.top_tracks as Array<Record<string, unknown>>) ?? [];
  const seen = new Map<string, { streams: number; entry: Record<string, unknown> }>();
  for (const t of topTracksFromStreams) {
    const title  = String(t.track_title ?? t.release_name ?? t.title ?? "").trim().toLowerCase();
    const artist = String(t.primary_artist ?? t.artists ?? t.artist ?? "").trim().toLowerCase();
    const key = `${title}|||${artist}`;
    const streams = Number(t.total_streams ?? t.streams ?? t.plays) || 0;
    if (!seen.has(key) || streams > seen.get(key)!.streams) {
      seen.set(key, { streams, entry: t });
    }
  }
  const dedupedTracks = Array.from(seen.values()).sort((a, b) => b.streams - a.streams);

  const finalTopReleases = dedupedTracks.slice(0, 10).map((item, i) => {
    const t = item.entry;
    return {
      id: String(t.upload_id ?? i),
      rank: i + 1,
      title:  (t.track_title ?? t.release_name ?? t.title ?? "") as string,
      artist: (t.primary_artist ?? t.artists ?? t.artist ?? "") as string,
      cover:  (t.album_art_url ?? t.cover ?? "") as string,
      streams: fmtNum(item.streams),
    };
  });

  const platformBreakdown = ((raw.platform_breakdown as Array<Record<string, unknown>>) ?? []).map((p) => {
    const key = ((p.platform_name ?? p.platform ?? "") as string).toLowerCase();
    return {
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      streams: (p.total_streams as number) ?? 0,
      color: PLATFORM_COLORS[key] ?? "#888888",
    };
  });

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

  const sc = unwrapObj(soundcharts);
  const scData = (sc.data as Record<string, unknown>) ?? sc;

  const streamingSnapshots = (scData.streaming as Record<string, unknown>) ?? {};
  let recentStreamValue: number | null = null;
  let recentStreamChange = "";
  let streamTrend: number[] = [];
  let activeStreamPlatform = "";

  for (const [platformKey, platformData] of Object.entries(streamingSnapshots)) {
    const platformObj = platformData as Record<string, unknown> | null;
    const items = platformObj?.items as Array<Record<string, unknown>> | undefined;
    if (items && items.length > 0) {
      const values = items.map((it) => (it.value as number) ?? 0).filter((v) => v > 0);
      if (values.length > 0) {
        recentStreamValue = values[0];
        activeStreamPlatform = platformKey;
        streamTrend = values.slice(0, 8).reverse();
        if (values.length > 1 && values[1] > 0) {
          const pct = ((values[0] - values[1]) / values[1]) * 100;
          recentStreamChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
        }
        break;
      }
    }
  }

  if (recentStreamValue === null) {
    const streamHistory = (scData.stream_history as Record<string, unknown>) ?? {};
    for (const [platformKey, platformData] of Object.entries(streamHistory)) {
      const items = (platformData as Record<string, unknown>)?.items as Array<Record<string, unknown>> | undefined;
      if (items && items.length > 0) {
        const values = items.map((it) => (it.value as number) ?? 0).filter((v) => v > 0);
        if (values.length > 0) {
          recentStreamValue = values[0];
          activeStreamPlatform = platformKey;
          streamTrend = values.slice(0, 8).reverse();
          if (values.length > 1 && values[1] > 0) {
            const pct = ((values[0] - values[1]) / values[1]) * 100;
            recentStreamChange = `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
          }
          break;
        }
      }
    }
  }

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

  const chartEntries = ((scData.chart_entries as Record<string, unknown>)?.items as Array<Record<string, unknown>> ?? [])
    .map((e) => ({
      rank: (e.rank as number) ?? 0,
      rankDiff: e.rankDiff as number | undefined,
      chartName: (e.chartName ?? (e.chart as Record<string, unknown>)?.name ?? "") as string,
      chart: e.chart as { name: string } | undefined,
      platformName: (e.platformName ?? e.platform ?? e._platform ?? "") as string,
      platform: e.platform as string | undefined,
      date: e.date as string | undefined,
    }));

  const playlistEntries = ((scData.playlists as Record<string, unknown>)?.items as Array<Record<string, unknown>> ?? [])
    .map((p) => ({
      position: p.position as number | undefined,
      platform: (p.platform ?? p._platform ?? "") as string,
      playlist: p.playlist as { name: string; imageUrl?: string; followersCount?: number } | undefined,
    }));

  const radioSpins = ((scData.radio as Record<string, unknown>)?.items as Array<Record<string, unknown>> ?? [])
    .map((r) => ({
      stationName: (r.stationName ?? (r.station as Record<string, unknown>)?.name ?? "") as string,
      station: r.station as { name: string } | undefined,
      country: r.country as string | undefined,
      date: r.date as string | undefined,
      spinsCount: r.spinsCount as number | undefined,
    }));

  const rawStreamHistory = (scData.stream_history as Record<string, unknown>) ?? {};
  const streamHistoryByPlatform: Record<string, Array<{ date: string; value: number }>> = {};
  for (const [platformKey, platformData] of Object.entries(rawStreamHistory)) {
    const items = (platformData as Record<string, unknown>)?.items as Array<Record<string, unknown>> | undefined;
    if (items && items.length > 0) {
      streamHistoryByPlatform[platformKey] = items
        .map((it) => ({ date: String(it.date ?? ""), value: (it.value as number) ?? 0 }))
        .filter((it) => it.date)
        .reverse(); 
    }
  }

  const rawSocialHistory = (scData.social as Record<string, unknown>) ?? {};
  const socialHistoryByPlatform: Record<string, Array<{ date: string; followerCount?: number; likeCount?: number; postCount?: number; viewCount?: number }>> = {};
  for (const [platformKey, platformData] of Object.entries(rawSocialHistory)) {
    const items = (platformData as Record<string, unknown>)?.items as Array<Record<string, unknown>> | undefined;
    if (items && items.length > 0) {
      socialHistoryByPlatform[platformKey] = items
        .map((it) => ({
          date: String(it.date ?? ""),
          followerCount: it.followerCount as number | undefined,
          likeCount: it.likeCount as number | undefined,
          postCount: it.postCount as number | undefined,
          viewCount: it.viewCount as number | undefined,
        }))
        .filter((it) => it.date)
        .reverse();
    }
  }

  const soundchartsAvailable = Object.keys(streamHistoryByPlatform).length > 0
    || chartEntries.length > 0
    || playlistEntries.length > 0
    || radioSpins.length > 0
    || Object.keys(socialHistoryByPlatform).length > 0;

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
    chartEntries,
    playlistEntries,
    radioSpins,
    streamHistoryByPlatform,
    socialHistoryByPlatform,
    soundchartsAvailable,
  };
}

export function useAnalytics(period: string, customStart?: string, customEnd?: string) {
  const [data, setData] = useState<AnalyticsPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (period === "Custom Range" && (!customStart || !customEnd)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const dateParams: DateRangeParams = period === "Custom Range" && customStart && customEnd
      ? { start_date: customStart, end_date: customEnd }
      : periodToParams(period);

    let scLinkId: number | string | undefined;
    try {
      const statusRes = await getSoundchartsStatus();
      if (!statusRes.error) {
        const statusData = (statusRes.data as Record<string, unknown>) ?? {};
        const links = (statusRes.data as Record<string, unknown>)?.links as Array<Record<string, unknown>> | undefined;
        if (links && links.length > 0) {
          scLinkId = links[0].id as number | string;
        }
      }
    } catch { /* no link_id, fallback to backend default */ }

    const [
      streamsRes,
      geoRes,
      soundchartsRes,
    ] = await Promise.allSettled([
      getStreams(dateParams),     
      getGeographic(dateParams),
      getSoundchartsDashboard(scLinkId),
    ]);

    const streamsData    = streamsRes.status    === "fulfilled" && !streamsRes.value.error    ? streamsRes.value.data    as Record<string, unknown> : null;
    const geo            = geoRes.status        === "fulfilled" && !geoRes.value.error        ? unwrap<GeographicData>(geoRes.value.data)   : [];
    const soundcharts    = soundchartsRes.status === "fulfilled" && !soundchartsRes.value.error ? soundchartsRes.value.data as Record<string, unknown> : null;

    setData(normalise(streamsData, geo, soundcharts));
    setIsLoading(false);
  }, [period, customStart, customEnd]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}