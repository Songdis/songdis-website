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
    default:              start.setFullYear(now.getFullYear() - 1); // Last year
  }

  return { start_date: start.toISOString().split("T")[0], end_date };
}

/* ─── Normalise helpers ───────────────────────────────────────── */
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
    months: string[];
    social: number[];
    streaming: number[];
  };
}

const PLATFORM_LOGOS: Record<string, string> = {
  spotify:       "/images/spotify.svg",
  apple_music:   "/images/apple-music.svg",
  youtube_music: "/images/youtube-music.svg",
  boomplay:      "/images/boomplay.svg",
  audiomack:     "/images/audiomack.svg",
  amazon_music:  "/images/amazon-music.svg",
  tidal:         "/images/tidal.svg",
  deezer:        "/images/deezer.svg",
  tiktok:        "/images/tiktok.svg",
};

const COUNTRY_FLAGS: Record<string, string> = {
  Nigeria: "🇳🇬", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
  Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦",
  France: "🇫🇷", Germany: "🇩🇪", Canada: "🇨🇦",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function normalise(
  overviewRaw: Record<string, unknown> | null,
  socialRaw: Record<string, unknown> | null,
  _platformsRaw: Record<string, unknown> | null
): RoyaltiesPageData {
  /**
   * API response shape (confirmed from network):
   *   GET /royalties → { message, data: { overview, platform_breakdown,
   *     monthly_trends, top_earning_releases, territory_breakdown } }
   *   GET /social/vs-streaming → { social_platforms, streaming_platforms, insights }
   *   GET /royalties/platform-metrics → { streaming_platforms, social_platforms }
   */

  // Unwrap the nested .data wrapper if present
  const d = (overviewRaw?.data as Record<string, unknown>) ?? overviewRaw ?? {};
  const overview = (d.overview as Record<string, unknown>) ?? d;

  // Stats — from overview
  const totalEarnings  = (overview.total_earnings       as number) ?? 0;
  const totalStreams    = (overview.total_streams        as number) ?? 0;
  const uniqueReleases = (overview.unique_releases      as number) ?? 0;
  const territories    = (overview.territories_reached  as number) ??
                         (overview.territories          as number) ?? 0;

  // Revenue by platform — from platform_breakdown
  const rawPlatforms = (d.platform_breakdown as RoyaltyPlatform[]) ?? [];
  const revenueByPlatform = rawPlatforms.map((p, i) => {
    const key = (p.platform ?? p.name ?? "").toLowerCase().replace(/\s+/g, "_");
    return {
      id: String(i),
      name: p.name ?? p.platform ?? "",
      logo: PLATFORM_LOGOS[key] ?? "/images/platforms/default.svg",
      earnings: (p.earnings as number) ?? 0,
      streams:  (p.streams  as number) ?? 0,
    };
  });

  // Top earning releases — from top_earning_releases
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

  // Revenue by territory — from territory_breakdown
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

  // Social vs Streaming chart — from monthly_trends
  const monthlyTrends = (d.monthly_trends as Array<Record<string, unknown>>) ?? [];
  const socialMonths    = monthlyTrends.length > 0
    ? monthlyTrends.map((m) => String(m.month ?? "").slice(0, 3))
    : MONTHS;
  const socialValues    = monthlyTrends.length > 0
    ? monthlyTrends.map((m) => (m.social_earnings ?? m.social ?? 0) as number)
    : Array(12).fill(0);
  const streamingValues = monthlyTrends.length > 0
    ? monthlyTrends.map((m) => (m.streaming_earnings ?? m.streaming ?? 0) as number)
    : Array(12).fill(0);

  // Social vs streaming summary stats
  const sm = (socialRaw?.social_platforms   as Record<string, unknown>) ?? {};
  const st = (socialRaw?.streaming_platforms as Record<string, unknown>) ?? {};

  const smAvgRate = sm.avg_rate as number | null | undefined;
  const stAvgRate = st.avg_rate as number | null | undefined;

  return {
    stats: {
      totalEarnings:  { value: fmtMoney(totalEarnings), change: "", sub: "vs last period", icon: "/images/earnings.svg" },
      totalStreams:   { value: fmtNum(totalStreams),     change: "", sub: "vs last period", icon: "/images/streams.svg" },
      uniqueReleases: { value: String(uniqueReleases),  change: "", sub: "Avg/release",    icon: "/images/releases.svg" },
      territories:   { value: String(territories),      change: "", sub: "Platforms",      icon: "/images/countries.svg" },
    },
    // Show empty state instead of mock when API returns empty arrays
    revenueByPlatform,
    topEarningReleases,
    revenueByTerritory,
    socialVsStreaming: {
      socialMediaStats: {
        avgRate: smAvgRate != null ? `$${smAvgRate.toFixed(6)}` : "$0.000000",
        uses:    fmtNum((sm.total_uses as number) ?? 0),
      },
      streamingStats: {
        avgRate: stAvgRate != null ? `$${stAvgRate.toFixed(6)}` : "$0.000000",
        streams: fmtNum((st.total_streams as number) ?? 0),
      },
      months:    socialMonths,
      social:    socialValues,
      streaming: streamingValues,
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

    const params: RoyaltiesParams = {
      ...periodToDates(period),
      platform,
    };

    const [overviewRes, socialRes, platformRes] = await Promise.all([
      getRoyalties(params),
      getSocialVsStreaming(params),
      getRoyaltyPlatformMetrics(params),
    ]);

    const firstError = overviewRes.error ?? socialRes.error;
    if (firstError) {
      setError(firstError);
      // Fall back to mock so the page doesn't blank
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