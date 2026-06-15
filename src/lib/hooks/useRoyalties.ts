import { useState, useEffect, useCallback } from "react";
import {
  getRoyalties,
  getSocialVsStreaming,
  getRoyaltyPlatformMetrics,
  type RoyaltiesParams,
  type RoyaltyRelease,
  type RoyaltyTerritory,
  type RoyaltyPlatform,
} from "@/lib/api/royalties";
import { PLATFORMS } from "../../app/mock/royalties";

/* ─── Date helpers ────────────────────────────────────────────── */
function periodToDates(period: string): { start_date: string; end_date: string } {
  const now = new Date();
  const end_date = now.toISOString().split("T")[0];
  const start = new Date();
  switch (period) {
    case "Last 7 days":   start.setDate(now.getDate() - 7);    break;
    case "Last 3 months": start.setMonth(now.getMonth() - 3);  break;
    case "Last 2 years":  start.setFullYear(now.getFullYear() - 2); break;
    default:              start.setFullYear(now.getFullYear() - 1);
  }
  return { start_date: start.toISOString().split("T")[0], end_date };
}

/* ─── Formatting ──────────────────────────────────────────────── */
function fmtNum(n: number | string | undefined): string {
  if (!n && n !== 0) return "0";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function fmtMoney(n: number | undefined): string {
  if (!n && n !== 0) return "$0.00";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/* ─── Normalised page shape ───────────────────────────────────── */
export interface RoyaltiesPageData {
  stats: {
    totalEarnings:  { value: string; change: string; sub: string; icon: string };
    totalStreams:   { value: string; change: string; sub: string; icon: string };
    uniqueReleases: { value: string; change: string; sub: string; icon: string };
    territories:   { value: string; change: string; sub: string; icon: string };
  };
  revenueByPlatform: Array<{ id: string; name: string; logo: string; earnings: number; streams: number }>;
  topEarningReleases: Array<{
    id: string; rank: number; title: string; artist: string;
    cover: string; streams: string; earnings: string; territories: number;
  }>;
  revenueByTerritory: Array<{
    id: string; rank: number; country: string; flag: string;
    streams: string; earnings: string; platforms: number;
  }>;
  socialVsStreaming: {
    socialMediaStats: { avgRate: string; uses: string };
    streamingStats:   { avgRate: string; streams: string };
    socialPlatforms: Array<{ platform: string; earnings: number; uses: number }>;
    streamingPlatforms: Array<{ platform: string; earnings: number; streams: number }>;
  };
}

/* ─── Platform logo map ───────────────────────────────────────── */
const PLATFORM_LOGOS: Record<string, string> = {
  spotify:            "/images/spotify-frame.svg",
  apple_music:        "/images/apple-frame.svg",
  youtube_music:      "/images/color-youtube.svg",
  youtube_streaming:  "/images/color-youtube.svg",
  youtube_content_id: "/images/color-youtube.svg",
  audiomack:          "/images/audiomack.svg",
  boomplay:           "/images/boomplay.svg",
  amazon_music:       "/images/amazon-music.svg",
};

function getPlatformLogo(key: string): string {
  return PLATFORM_LOGOS[key] ?? "";
}

/* ─── Territory ISO → display ─────────────────────────────────── */
// Confirmed field from API: "territory" is ISO alpha-2 (NG, US, GB...)
const TERRITORY_NAMES: Record<string, string> = {
  NG: "Nigeria",   US: "United States", GB: "United Kingdom",
  GH: "Ghana",     KE: "Kenya",         ZA: "South Africa",
  FR: "France",    DE: "Germany",       CA: "Canada",
  BR: "Brazil",    CO: "Colombia",      MX: "Mexico",
  IT: "Italy",     ES: "Spain",         SE: "Sweden",
  AR: "Argentina", PE: "Peru",          CL: "Chile",
  AU: "Australia", NL: "Netherlands",   BE: "Belgium",
  // alpha-3 fallbacks also seen in API
  NGA: "Nigeria",  USA: "United States", GBR: "United Kingdom",
  GHA: "Ghana",    KEN: "Kenya",         ZAF: "South Africa",
  FRA: "France",   DEU: "Germany",       CAN: "Canada",
};

const TERRITORY_FLAGS: Record<string, string> = {
  NG: "🇳🇬",  US: "🇺🇸",  GB: "🇬🇧",  GH: "🇬🇭",  KE: "🇰🇪",
  ZA: "🇿🇦",  FR: "🇫🇷",  DE: "🇩🇪",  CA: "🇨🇦",  BR: "🇧🇷",
  CO: "🇨🇴",  MX: "🇲🇽",  IT: "🇮🇹",  ES: "🇪🇸",  SE: "🇸🇪",
  AR: "🇦🇷",  PE: "🇵🇪",  CL: "🇨🇱",  AU: "🇦🇺",  NL: "🇳🇱",
  NGA: "🇳🇬", USA: "🇺🇸", GBR: "🇬🇧", GHA: "🇬🇭", KEN: "🇰🇪",
  ZAF: "🇿🇦", FRA: "🇫🇷", DEU: "🇩🇪", CAN: "🇨🇦",
};

function normalisePlatformName(key: string): string {
  const names: Record<string, string> = {
    spotify: "Spotify", apple_music: "Apple Music",
    youtube_music: "YouTube Music", youtube_streaming: "YouTube",
    youtube_content_id: "YouTube CID", audiomack: "Audiomack",
    boomplay: "Boomplay", amazon_music: "Amazon Music",
    tidal: "Tidal", deezer: "Deezer",
    facebook: "Facebook", tiktok: "TikTok",
    snapchat: "Snapchat", snap: "Snapchat",
  };
  return names[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

function normalise(
  overviewRaw: Record<string, unknown> | null,
  socialRaw: Record<string, unknown> | null,
  _platformsRaw: Record<string, unknown> | null
): RoyaltiesPageData {
  // API: GET /royalties → { message, data: { overview, platform_breakdown,
  //   top_earning_releases, territory_breakdown, monthly_trends } }
  const d = (overviewRaw?.data as Record<string, unknown>) ?? overviewRaw ?? {};
  const overview = (d.overview as Record<string, unknown>) ?? d;

  const totalEarnings  = (overview.total_earnings      as number) ?? 0;
  const totalStreams    = (overview.total_streams       as number) ?? 0;
  const uniqueReleases = (overview.unique_releases     as number) ?? 0;
  const territories    = (overview.territories_reached as number) ?? (overview.territories as number) ?? 0;

  // Revenue by platform
  const rawPlatforms = (d.platform_breakdown as Array<Record<string, unknown>>) ?? [];
  const revenueByPlatform = rawPlatforms.map((p, i) => {
    const key = ((p.platform ?? p.name ?? "") as string).toLowerCase().replace(/\s+/g, "_");
    return {
      id: String(i),
      name: normalisePlatformName(key),
      logo: getPlatformLogo(key),
      earnings: parseFloat(String(p.total_earnings ?? p.earnings ?? 0)) || 0,
      streams:  (p.total_streams ?? p.streams ?? 0) as number,
    };
  });

  // Top earning releases — confirmed field: top_earning_releases
  // Fields: track_title, primary_artist, album_art_url, total_earnings,
  //         total_streams, territories_active, platforms_active
  const rawReleases = (d.top_earning_releases as Array<Record<string, unknown>>) ?? [];
  const topEarningReleases = rawReleases.slice(0, 10).map((r, i) => ({
    id: String(r.isrc ?? r.upc ?? i),
    rank: i + 1,
    title:  (r.track_title   ?? r.release_name ?? "") as string,
    artist: (r.track_artists ?? r.primary_artist ?? "") as string,
    cover:  (r.album_art_url ?? "") as string,
    streams:  fmtNum(r.total_streams as number),
    earnings: `$${parseFloat(String(r.total_earnings ?? 0)).toFixed(2)}`,
    territories: (r.territories_active as number) ?? 0,
  }));

  // Revenue by territory — confirmed field: territory_breakdown
  // Fields: territory (ISO alpha-2), total_earnings, total_streams, platforms_active
  const rawTerritories = (d.territory_breakdown as Array<Record<string, unknown>>) ?? [];
  const revenueByTerritory = rawTerritories.slice(0, 10).map((t, i) => {
    const code = (t.territory ?? "") as string;
    const name = TERRITORY_NAMES[code] ?? code;
    return {
      id: String(i),
      rank: i + 1,
      country: name,
      flag: TERRITORY_FLAGS[code] ?? "🌍",
      streams:  fmtNum(t.total_streams as number),
      earnings: `$${parseFloat(String(t.total_earnings ?? 0)).toFixed(2)}`,
      platforms: (t.platforms_active as number) ?? 0,
    };
  });

  // Social vs streaming
  const sm = (socialRaw?.social_platforms    as Record<string, unknown>) ?? {};
  const st = (socialRaw?.streaming_platforms as Record<string, unknown>) ?? {};

  const smAvgRate = sm.avg_rate as number | null | undefined;
  const stAvgRate = st.avg_rate as number | null | undefined;

  const socialPlatforms = ((sm.platforms as Array<Record<string, unknown>>) ?? []).map((p) => ({
    platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
    earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
    uses: (p.total_uses as number) ?? 0,
  }));

  const streamingPlatforms = ((st.platforms as Array<Record<string, unknown>>) ?? []).map((p) => ({
    platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
    earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
    streams: (p.total_streams as number) ?? 0,
  }));

  return {
    stats: {
      totalEarnings:  { value: fmtMoney(totalEarnings), change: "", sub: "vs last period", icon: "/images/earnings.svg" },
      totalStreams:   { value: fmtNum(totalStreams),     change: "", sub: "vs last period", icon: "/images/streams.svg" },
      uniqueReleases: { value: String(uniqueReleases),  change: "", sub: "Avg/release",    icon: "/images/releases.svg" },
      territories:   { value: String(territories),      change: "", sub: "Platforms",      icon: "/images/countries.svg" },
    },
    revenueByPlatform,
    topEarningReleases,
    revenueByTerritory,
    socialVsStreaming: {
      socialMediaStats: {
        avgRate: smAvgRate != null ? `$${Number(smAvgRate).toFixed(6)}` : "$0.000000",
        uses:    fmtNum((sm.total_uses as number) ?? 0),
      },
      streamingStats: {
        avgRate: stAvgRate != null ? `$${Number(stAvgRate).toFixed(6)}` : "$0.000000",
        streams: fmtNum((st.total_streams as number) ?? 0),
      },
      socialPlatforms,
      streamingPlatforms,
    },
  };
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useRoyalties(period: string, platform: string) {
  const [data, setData] = useState<RoyaltiesPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: RoyaltiesParams = { ...periodToDates(period), platform };

    const [overviewRes, socialRes, platformRes] = await Promise.all([
      getRoyalties(params),
      getSocialVsStreaming(params),
      getRoyaltyPlatformMetrics(params),
    ]);

    const firstError = overviewRes.error ?? socialRes.error;
    if (firstError) {
      setError(firstError);
      setData(normalise(null, null, null));
    } else {
      setData(normalise(
        overviewRes.data as Record<string, unknown>,
        socialRes.data   as Record<string, unknown>,
        platformRes.data as Record<string, unknown>,
      ));
    }

    setIsLoading(false);
  }, [period, platform]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}

export { PLATFORMS, TIME_PERIODS } from "../../app/mock/royalties";