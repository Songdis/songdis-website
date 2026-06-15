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
import { MOCK_ROYALTIES, PLATFORMS } from "../../app/mock/royalties";

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
  topEarningReleases: Array<{ id: string; rank: number; title: string; artist: string; cover: string; plays: string; streams: string; territories: number }>;
  revenueByTerritory: Array<{ id: string; rank: number; country: string; flag: string; plays: string; streams: string }>;
  socialVsStreaming: {
    socialMediaStats: { avgRate: string; uses: string };
    streamingStats:   { avgRate: string; streams: string };
    // DES-012: platform bars instead of time-series (API doesn't have monthly breakdown)
    socialPlatforms: Array<{ platform: string; earnings: number; uses: number }>;
    streamingPlatforms: Array<{ platform: string; earnings: number; streams: number }>;
  };
}

// DES-009: Map to actual image files you have in /images/
const PLATFORM_LOGOS: Record<string, string> = {
  spotify:           "/images/spotify-frame.svg",
  apple_music:       "/images/apple-frame.svg",
  youtube_music:     "/images/color-youtube.svg",
  youtube_streaming: "/images/color-youtube.svg",
  youtube_content_id:"/images/color-youtube.svg",
  audiomack:         "/images/audiomack.svg",
  boomplay:          "/images/boomplay.svg",
  amazon_music:      "/images/amazon-music.svg",
};

// Platforms with no image file get a generated SVG fallback — no broken img
function getPlatformLogo(key: string): string {
  return PLATFORM_LOGOS[key] ?? "";
}

const COUNTRY_FLAGS: Record<string, string> = {
  Nigeria: "🇳🇬", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
  France: "🇫🇷", Germany: "🇩🇪", Canada: "🇨🇦",
};

function normalisePlatformName(key: string): string {
  const names: Record<string, string> = {
    spotify: "Spotify",
    apple_music: "Apple Music",
    youtube_music: "YouTube Music",
    youtube_streaming: "YouTube",
    youtube_content_id: "YouTube CID",
    audiomack: "Audiomack",
    boomplay: "Boomplay",
    amazon_music: "Amazon Music",
    tidal: "Tidal",
    deezer: "Deezer",
    facebook: "Facebook",
    tiktok: "TikTok",
    snapchat: "Snapchat",
    snap: "Snapchat",
  };
  return names[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

function normalise(
  overviewRaw: Record<string, unknown> | null,
  socialRaw: Record<string, unknown> | null,
  _platformsRaw: Record<string, unknown> | null
): RoyaltiesPageData {
  const d = (overviewRaw?.data as Record<string, unknown>) ?? overviewRaw ?? {};
  const overview = (d.overview as Record<string, unknown>) ?? d;

  const totalEarnings  = (overview.total_earnings      as number) ?? 0;
  const totalStreams    = (overview.total_streams       as number) ?? 0;
  const uniqueReleases = (overview.unique_releases     as number) ?? 0;
  const territories    = (overview.territories_reached as number) ?? (overview.territories as number) ?? 0;

  // Revenue by platform
  const rawPlatforms = (d.platform_breakdown as RoyaltyPlatform[]) ?? [];
  const revenueByPlatform = rawPlatforms.map((p, i) => {
    const key = (p.platform ?? p.name ?? "").toLowerCase().replace(/\s+/g, "_");
    return {
      id: String(i),
      name: normalisePlatformName(key),
      logo: getPlatformLogo(key),
      earnings: (p.earnings as number) ?? 0,
      streams:  (p.streams  as number) ?? 0,
    };
  });

  // Top earning releases
  const rawReleases = (d.top_earning_releases as RoyaltyRelease[]) ?? [];
  const topEarningReleases = rawReleases.slice(0, 5).map((r, i) => ({
    id: String(r.id ?? i),
    rank: i + 1,
    title:  (r.release_title ?? r.title   ?? "") as string,
    artist: (r.primary_artist ?? r.artist ?? "") as string,
    cover: "/images/cover-blue.svg",
    plays:       fmtNum(r.plays),
    streams:     fmtNum(r.streams),
    territories: (r.territories as number) ?? 0,
  }));

  // Revenue by territory
  const rawTerritories = (d.territory_breakdown as RoyaltyTerritory[]) ?? [];
  const revenueByTerritory = rawTerritories.slice(0, 5).map((t, i) => {
    const country = (t.country_name ?? t.country ?? "") as string;
    return {
      id: String(i),
      rank: i + 1,
      country,
      flag: COUNTRY_FLAGS[country] ?? "🌍",
      plays:   fmtNum(t.plays),
      streams: fmtNum(t.streams),
    };
  });

  // DES-012: social vs streaming — use platform-level data (no monthly breakdown exists)
  const sm = (socialRaw?.social_platforms   as Record<string, unknown>) ?? {};
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