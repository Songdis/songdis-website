// import { useState, useEffect, useCallback } from "react";
// import {
//   getRoyalties,
//   getSocialVsStreaming,
//   type RoyaltiesParams,
// } from "@/lib/api/royalties";

// /* ─── Date helpers ────────────────────────────────────────────── */
// function periodToDates(period: string): { start_date: string; end_date: string } {
//   const now = new Date();
//   const end_date = now.toISOString().split("T")[0];
//   const start = new Date();
//   switch (period) {
//     case "Last 7 days":   start.setDate(now.getDate() - 7);    break;
//     case "Last 3 months": start.setMonth(now.getMonth() - 3);  break;
//     case "Last 2 years":  start.setFullYear(now.getFullYear() - 2); break;
//     default:              start.setFullYear(now.getFullYear() - 1);
//   }
//   return { start_date: start.toISOString().split("T")[0], end_date };
// }

// /* ─── Formatting ──────────────────────────────────────────────── */
// function fmtNum(n: number | string | undefined): string {
//   if (!n && n !== 0) return "0";
//   const num = typeof n === "string" ? parseFloat(n) : n;
//   if (isNaN(num)) return "0";
//   if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//   if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
//   return num.toLocaleString();
// }

// /* ─── Platform logo — CDN logos for real platforms ────────────── */
// // We use simple-icons CDN (unpkg) for reliable brand logos.
// // For platforms the API returns but aren't major brands, fall back to initials.
// const PLATFORM_LOGO_URLS: Record<string, string> = {
//   spotify:              "https://cdn.simpleicons.org/spotify/1DB954",
//   apple_music:          "https://cdn.simpleicons.org/applemusic/FC3C44",
//   youtube_music:        "https://cdn.simpleicons.org/youtubemusic/FF0000",
//   youtube:              "https://cdn.simpleicons.org/youtube/FF0000",
//   youtube_streaming:    "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube streaming":  "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube (red)":      "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube (ads)":      "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube (audio)":    "https://cdn.simpleicons.org/youtube/FF0000",
//   youtube_content_id:   "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube content id": "https://cdn.simpleicons.org/youtube/FF0000",
//   "youtube audio tier": "https://cdn.simpleicons.org/youtube/FF0000",
//   audiomack:            "https://cdn.simpleicons.org/audiomack/FFA500",
//   boomplay:             "https://cdn.simpleicons.org/boomplay/00C4CC",
//   amazon_music:         "https://cdn.simpleicons.org/amazonmusic/00A8E1",
//   "amazon_prime":       "https://cdn.simpleicons.org/amazon/FF9900",
//   "amazon prime":       "https://cdn.simpleicons.org/amazon/FF9900",
//   "amazon unlimited (streaming)": "https://cdn.simpleicons.org/amazonmusic/00A8E1",
//   "amazon prime (streaming)":     "https://cdn.simpleicons.org/amazonmusic/00A8E1",
//   tidal:                "https://cdn.simpleicons.org/tidal/000000",
//   deezer:               "https://cdn.simpleicons.org/deezer/A238FF",
//   tiktok:               "https://cdn.simpleicons.org/tiktok/ffffff",
//   "tiktok music (audio)": "https://cdn.simpleicons.org/tiktok/ffffff",
//   facebook:             "https://cdn.simpleicons.org/facebook/1877F2",
//   "facebook / instagram":       "https://cdn.simpleicons.org/facebook/1877F2",
//   "facebook / instagram - revenue share": "https://cdn.simpleicons.org/facebook/1877F2",
//   facebook_instagram:   "https://cdn.simpleicons.org/instagram/E4405F",
//   "facebook: whatsapp": "https://cdn.simpleicons.org/whatsapp/25D366",
//   facebook_whatsapp:    "https://cdn.simpleicons.org/whatsapp/25D366",
//   facebook_instagram_rs:"https://cdn.simpleicons.org/instagram/E4405F",
//   snapchat:             "https://cdn.simpleicons.org/snapchat/FFFC00",
//   snap:                 "https://cdn.simpleicons.org/snapchat/FFFC00",
//   itunes:               "https://cdn.simpleicons.org/itunes/FB5BC5",
//   "itunes songs":       "https://cdn.simpleicons.org/itunes/FB5BC5",
//   "itunes match":       "https://cdn.simpleicons.org/itunes/FB5BC5",
//   soundcloud:           "https://cdn.simpleicons.org/soundcloud/FF5500",
//   "soundcloud ad monetization": "https://cdn.simpleicons.org/soundcloud/FF5500",
//   soundcloud_ads:       "https://cdn.simpleicons.org/soundcloud/FF5500",
//   triller:              "",
//   anghami:              "",
//   deezer_fr:            "https://cdn.simpleicons.org/deezer/A238FF",
//   netease:              "",
//   "netease cloud music": "",
//   resso:                "",
//   luna:                 "",
//   lyricfind:            "",
//   boomplaycms:          "https://cdn.simpleicons.org/boomplay/00C4CC",
//   jiosaavn:             "",
// };

// export function getPlatformLogoUrl(key: string): string {
//   const normalized = key.toLowerCase().trim();
//   return PLATFORM_LOGO_URLS[normalized] ?? PLATFORM_LOGO_URLS[normalized.replace(/[\s_-]+/g, "_")] ?? "";
// }

// /* ─── Platform display name ───────────────────────────────────── */
// function normalisePlatformName(key: string): string {
//   const names: Record<string, string> = {
//     spotify: "Spotify",
//     apple_music: "Apple Music",
//     youtube_music: "YouTube Music",
//     youtube_streaming: "YouTube",
//     "youtube streaming": "YouTube",
//     "youtube (red)": "YouTube Premium",
//     "youtube (ads)": "YouTube Ads",
//     "youtube (audio)": "YouTube Audio",
//     youtube_content_id: "YouTube CID",
//     "youtube content id": "YouTube CID",
//     "youtube audio tier": "YouTube Audio",
//     audiomack: "Audiomack",
//     boomplay: "Boomplay",
//     boomplaycms: "Boomplay CMS",
//     amazon_music: "Amazon Music",
//     "amazon_prime": "Amazon Prime",
//     "amazon prime": "Amazon Prime",
//     "amazon unlimited (streaming)": "Amazon Unlimited",
//     "amazon prime (streaming)": "Amazon Prime",
//     tidal: "Tidal",
//     deezer: "Deezer",
//     tiktok: "TikTok",
//     "tiktok music (audio)": "TikTok Music",
//     facebook: "Facebook",
//     "facebook / instagram": "Facebook/IG",
//     "facebook / instagram - revenue share": "Facebook/IG RS",
//     facebook_instagram: "Facebook/IG",
//     "facebook: whatsapp": "WhatsApp",
//     facebook_whatsapp: "WhatsApp",
//     facebook_instagram_rs: "Facebook/IG RS",
//     snapchat: "Snapchat",
//     snap: "Snapchat",
//     itunes: "iTunes",
//     "itunes songs": "iTunes",
//     "itunes match": "iTunes Match",
//     triller: "Triller",
//     lyricfind: "LyricFind",
//     "lyricfind adjustments": "LyricFind",
//     netease: "NetEase",
//     "netease cloud music": "NetEase",
//     resso: "Resso",
//     anghami: "Anghami",
//     luna: "Luna",
//     jiosaavn: "JioSaavn",
//     soundcloud: "SoundCloud",
//     "soundcloud ad monetization": "SoundCloud Ads",
//     soundcloud_ads: "SoundCloud Ads",
//     "tencent direct deal": "Tencent",
//     "tencent: qqmusic": "QQ Music",
//     "fluxus: yandex music": "Yandex Music",
//     yandex_music: "Yandex Music",
//     "fluxus: mts music": "MTS Music",
//     mts_music: "MTS Music",
//   };
//   return names[key.toLowerCase().trim()]
//     ?? key.split(/[\s_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
// }

// /* ─── Territory helpers ───────────────────────────────────────── */
// const TERRITORY_NAMES: Record<string, string> = {
//   NG: "Nigeria",   US: "United States", GB: "United Kingdom",
//   GH: "Ghana",     KE: "Kenya",         ZA: "South Africa",
//   FR: "France",    DE: "Germany",       CA: "Canada",
//   BR: "Brazil",    CO: "Colombia",      MX: "Mexico",
//   IT: "Italy",     ES: "Spain",         SE: "Sweden",
//   AR: "Argentina", PE: "Peru",          CL: "Chile",
//   AU: "Australia", NL: "Netherlands",
//   NGA: "Nigeria",  USA: "United States", GBR: "United Kingdom",
//   GHA: "Ghana",    KEN: "Kenya",         ZAF: "South Africa",
//   FRA: "France",   DEU: "Germany",       CAN: "Canada",
// };

// const TERRITORY_FLAGS: Record<string, string> = {
//   NG: "🇳🇬",  US: "🇺🇸",  GB: "🇬🇧",  GH: "🇬🇭",  KE: "🇰🇪",
//   ZA: "🇿🇦",  FR: "🇫🇷",  DE: "🇩🇪",  CA: "🇨🇦",  BR: "🇧🇷",
//   CO: "🇨🇴",  MX: "🇲🇽",  IT: "🇮🇹",  ES: "🇪🇸",  SE: "🇸🇪",
//   AR: "🇦🇷",  PE: "🇵🇪",  CL: "🇨🇱",  AU: "🇦🇺",  NL: "🇳🇱",
//   NGA: "🇳🇬", USA: "🇺🇸", GBR: "🇬🇧", GHA: "🇬🇭", KEN: "🇰🇪",
//   ZAF: "🇿🇦", FRA: "🇫🇷", DEU: "🇩🇪", CAN: "🇨🇦",
// };

// /* ─── Normalised page shape ───────────────────────────────────── */
// export interface RoyaltiesPageData {
//   stats: {
//     totalEarnings:  { value: string; change: string; sub: string; icon: string };
//     totalStreams:   { value: string; change: string; sub: string; icon: string };
//     uniqueReleases: { value: string; change: string; sub: string; icon: string };
//     territories:   { value: string; change: string; sub: string; icon: string };
//   };
//   revenueByPlatform: Array<{
//     id: string; name: string; logoUrl: string; earnings: number; streams: number;
//   }>;
//   topEarningReleases: Array<{
//     id: string; rank: number; title: string; artist: string;
//     cover: string; streams: string; earnings: string; territories: number;
//   }>;
//   revenueByTerritory: Array<{
//     id: string; rank: number; country: string; flag: string;
//     streams: string; earnings: string; platforms: number;
//   }>;
//   socialVsStreaming: {
//     socialMediaStats: { avgRate: string; uses: string; totalEarnings: string };
//     streamingStats:   { avgRate: string; streams: string; totalEarnings: string };
//     socialPlatforms: Array<{ platform: string; earnings: number; uses: number }>;
//     streamingPlatforms: Array<{ platform: string; earnings: number; streams: number }>;
//   };
// }

// /* ─── Normaliser ──────────────────────────────────────────────── */
// function normalise(
//   royaltiesRaw: Record<string, unknown> | null,
//   socialRaw: Record<string, unknown> | null,
// ): RoyaltiesPageData {
//   // GET /royalties response:
//   // { data: { overview: { total_earnings, total_streams, unique_releases, territories_reached },
//   //   platform_breakdown: [{ platform, total_royalties (string), total_streams }],
//   //   top_earning_releases: [...], territory_breakdown: [...] } }
//   const d = (royaltiesRaw?.data as Record<string, unknown>) ?? royaltiesRaw ?? {};
//   const overview = (d.overview as Record<string, unknown>) ?? d;

//   const totalEarnings  = (overview.total_earnings      as number) ?? 0;
//   const totalStreams    = parseInt(String(overview.total_streams ?? 0)) || 0;
//   const uniqueReleases = (overview.unique_releases     as number) ?? 0;
//   const territories    = (overview.territories_reached as number) ?? 0;

//   // Platform breakdown — field is total_royalties (not total_earnings)
//   // Also merge in social platform earnings from /social/vs-streaming
//   const rawPlatforms = (d.platform_breakdown as Array<Record<string, unknown>>) ?? [];

//   // Build a map of platform -> earnings from social/vs-streaming for supplementing
//   const socialPlatformEarnings: Record<string, number> = {};
//   const socialPlatformsRaw = ((socialRaw?.social_platforms as Record<string, unknown>)?.platforms as Array<Record<string, unknown>>) ?? [];
//   const streamingPlatformsRaw = ((socialRaw?.streaming_platforms as Record<string, unknown>)?.platforms as Array<Record<string, unknown>>) ?? [];
//   [...socialPlatformsRaw, ...streamingPlatformsRaw].forEach((p) => {
//     const key = (p.platform as string ?? "").toLowerCase();
//     socialPlatformEarnings[key] = parseFloat(String(p.total_earnings ?? p.total_royalties ?? 0)) || 0;
//   });

//   const revenueByPlatform = rawPlatforms
//     .filter((p) => {
//       const key = (p.platform as string ?? "").toLowerCase();
//       return key !== "test_platform" && !key.includes("test_");
//     })
//     .map((p, i) => {
//       const key = (p.platform as string ?? "").toLowerCase().trim();
//       // total_royalties is the correct field from /royalties API
//       const royaltyEarnings = parseFloat(String(p.total_royalties ?? p.total_earnings ?? 0)) || 0;
//       // supplement with social/vs-streaming if royalties is 0
//       const earnings = royaltyEarnings > 0 ? royaltyEarnings : (socialPlatformEarnings[key] ?? 0);
//       return {
//         id: String(i),
//         name: normalisePlatformName(key),
//         logoUrl: getPlatformLogoUrl(key),
//         earnings,
//         streams: (p.total_streams as number) ?? 0,
//       };
//     })
//     .sort((a, b) => b.earnings - a.earnings);

//   // Top earning releases
//   const rawReleases = (d.top_earning_releases as Array<Record<string, unknown>>) ?? [];
//   const topEarningReleases = rawReleases.slice(0, 10).map((r, i) => ({
//     id: String(r.isrc ?? r.upc ?? i),
//     rank: i + 1,
//     title:  (r.track_title   ?? r.release_name ?? "") as string,
//     artist: (r.track_artists ?? r.primary_artist ?? "") as string,
//     cover:  (r.album_art_url ?? "") as string,
//     streams:  fmtNum(r.total_streams as number),
//     earnings: `$${parseFloat(String(r.total_earnings ?? 0)).toFixed(2)}`,
//     territories: (r.territories_active as number) ?? 0,
//   }));

//   // Territory breakdown
//   const rawTerritories = (d.territory_breakdown as Array<Record<string, unknown>>) ?? [];
//   const revenueByTerritory = rawTerritories.slice(0, 10).map((t, i) => {
//     const code = (t.territory ?? "") as string;
//     return {
//       id: String(i),
//       rank: i + 1,
//       country: TERRITORY_NAMES[code] ?? code,
//       flag: TERRITORY_FLAGS[code] ?? "🌍",
//       streams:  fmtNum(t.total_streams as number),
//       earnings: `$${parseFloat(String(t.total_earnings ?? 0)).toFixed(2)}`,
//       platforms: (t.platforms_active as number) ?? 0,
//     };
//   });

//   // Social vs streaming from /social/vs-streaming
//   const sm = (socialRaw?.social_platforms as Record<string, unknown>) ?? {};
//   const st = (socialRaw?.streaming_platforms as Record<string, unknown>) ?? {};

//   const smTotalEarnings = (sm.total_earnings as number) ?? 0;
//   const stTotalEarnings = (st.total_earnings as number) ?? 0;
//   const smAvgRate = (sm.avg_rate as number) ?? 0;
//   const stAvgRate = (st.avg_rate as number) ?? 0;

//   const socialPlatforms = (socialPlatformsRaw).map((p) => ({
//     platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
//     earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
//     uses: parseInt(String(p.total_uses ?? 0)) || 0,
//   }));

//   const streamingPlatforms = (streamingPlatformsRaw).map((p) => ({
//     platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
//     earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
//     streams: (p.total_streams as number) ?? 0,
//   }));

//   return {
//     stats: {
//       totalEarnings:  { value: `$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, change: "", sub: "vs last period", icon: "/images/earnings.svg" },
//       totalStreams:   { value: fmtNum(totalStreams),     change: "", sub: "vs last period", icon: "/images/streams.svg" },
//       uniqueReleases: { value: String(uniqueReleases),  change: "", sub: "Avg/release",    icon: "/images/releases.svg" },
//       territories:   { value: String(territories),      change: "", sub: "Platforms",      icon: "/images/countries.svg" },
//     },
//     revenueByPlatform,
//     topEarningReleases,
//     revenueByTerritory,
//     socialVsStreaming: {
//       socialMediaStats: {
//         avgRate: `$${smAvgRate.toFixed(6)}`,
//         uses: fmtNum(sm.total_uses as number),
//         totalEarnings: `$${smTotalEarnings.toFixed(2)}`,
//       },
//       streamingStats: {
//         avgRate: `$${stAvgRate.toFixed(6)}`,
//         streams: fmtNum(st.total_streams as number),
//         totalEarnings: `$${stTotalEarnings.toFixed(2)}`,
//       },
//       socialPlatforms,
//       streamingPlatforms,
//     },
//   };
// }

// /* ─── Hook ────────────────────────────────────────────────────── */
// export function useRoyalties(period: string, platform: string) {
//   const [data, setData] = useState<RoyaltiesPageData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     const params: RoyaltiesParams = { ...periodToDates(period), platform };

//     const [royaltiesRes, socialRes] = await Promise.all([
//       getRoyalties(params),
//       getSocialVsStreaming(params),
//     ]);

//     if (royaltiesRes.error) {
//       setError(royaltiesRes.error);
//       setData(normalise(null, null));
//     } else {
//       setData(normalise(
//         royaltiesRes.data as Record<string, unknown>,
//         socialRes.error ? null : socialRes.data as Record<string, unknown>,
//       ));
//     }
//     setIsLoading(false);
//   }, [period, platform]);

//   useEffect(() => { load(); }, [load]);

//   return { data, isLoading, error, refresh: load };
// }

// export const TIME_PERIODS = ["Last 7 days", "Last 3 months", "Last Year", "Last 2 years"];
// export const PLATFORMS    = ["All Platforms", "Spotify", "Apple Music", "YouTube Music", "Audiomack", "Boomplay"];


import { useState, useEffect, useCallback } from "react";
import {
  getRoyalties,
  getSocialVsStreaming,
  type RoyaltiesParams,
} from "@/lib/api/royalties";

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
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/* ─── Platform logo — CDN logos for real platforms ────────────── */
// We use simple-icons CDN (unpkg) for reliable brand logos.
// For platforms the API returns but aren't major brands, fall back to initials.
const PLATFORM_LOGO_URLS: Record<string, string> = {
  spotify:              "https://cdn.simpleicons.org/spotify/1DB954",
  apple_music:          "https://cdn.simpleicons.org/applemusic/FC3C44",
  youtube_music:        "https://cdn.simpleicons.org/youtubemusic/FF0000",
  youtube:              "https://cdn.simpleicons.org/youtube/FF0000",
  youtube_streaming:    "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube streaming":  "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube (red)":      "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube (ads)":      "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube (audio)":    "https://cdn.simpleicons.org/youtube/FF0000",
  youtube_content_id:   "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube content id": "https://cdn.simpleicons.org/youtube/FF0000",
  "youtube audio tier": "https://cdn.simpleicons.org/youtube/FF0000",
  audiomack:            "https://cdn.simpleicons.org/audiomack/FFA500",
  boomplay:             "https://cdn.simpleicons.org/boomplay/00C4CC",
  amazon_music:         "https://cdn.simpleicons.org/amazonmusic/00A8E1",
  "amazon_prime":       "https://cdn.simpleicons.org/amazon/FF9900",
  "amazon prime":       "https://cdn.simpleicons.org/amazon/FF9900",
  "amazon unlimited (streaming)": "https://cdn.simpleicons.org/amazonmusic/00A8E1",
  "amazon prime (streaming)":     "https://cdn.simpleicons.org/amazonmusic/00A8E1",
  tidal:                "https://cdn.simpleicons.org/tidal/000000",
  deezer:               "https://cdn.simpleicons.org/deezer/A238FF",
  tiktok:               "https://cdn.simpleicons.org/tiktok/ffffff",
  "tiktok music (audio)": "https://cdn.simpleicons.org/tiktok/ffffff",
  facebook:             "https://cdn.simpleicons.org/facebook/1877F2",
  "facebook / instagram":       "https://cdn.simpleicons.org/facebook/1877F2",
  "facebook / instagram - revenue share": "https://cdn.simpleicons.org/facebook/1877F2",
  facebook_instagram:   "https://cdn.simpleicons.org/instagram/E4405F",
  "facebook: whatsapp": "https://cdn.simpleicons.org/whatsapp/25D366",
  facebook_whatsapp:    "https://cdn.simpleicons.org/whatsapp/25D366",
  facebook_instagram_rs:"https://cdn.simpleicons.org/instagram/E4405F",
  snapchat:             "https://cdn.simpleicons.org/snapchat/FFFC00",
  snap:                 "https://cdn.simpleicons.org/snapchat/FFFC00",
  itunes:               "https://cdn.simpleicons.org/itunes/FB5BC5",
  "itunes songs":       "https://cdn.simpleicons.org/itunes/FB5BC5",
  "itunes match":       "https://cdn.simpleicons.org/itunes/FB5BC5",
  soundcloud:           "https://cdn.simpleicons.org/soundcloud/FF5500",
  "soundcloud ad monetization": "https://cdn.simpleicons.org/soundcloud/FF5500",
  soundcloud_ads:       "https://cdn.simpleicons.org/soundcloud/FF5500",
  triller:              "https://cdn.simpleicons.org/triller/FF0050",
  anghami:              "https://cdn.simpleicons.org/anghami/8A2BE2",
  deezer_fr:            "https://cdn.simpleicons.org/deezer/A238FF",
  netease:              "https://cdn.simpleicons.org/neteasecloudmusic/D6322A",
  "netease cloud music": "https://cdn.simpleicons.org/neteasecloudmusic/D6322A",
  resso:                "",
  luna:                 "",
  lyricfind:            "",
  boomplaycms:          "https://cdn.simpleicons.org/boomplay/00C4CC",
  jiosaavn:             "https://cdn.simpleicons.org/jiosaavn/2BC5B4",
  // Upload-flow distributor platforms (from /upload-music platforms array)
  "7digital":           "",
  acrcloud:             "",
  alibaba:              "https://cdn.simpleicons.org/alibabadotcom/FF6A00",
  pandora:              "https://cdn.simpleicons.org/pandora/224099",
  napster:              "",
  iheartradio:          "https://cdn.simpleicons.org/iheartradio/C6002B",
  shazam:               "https://cdn.simpleicons.org/shazam/0088FF",
  qobuz:                "",
  bandcamp:             "https://cdn.simpleicons.org/bandcamp/408294",
  vevo:                 "https://cdn.simpleicons.org/vevo/E62E27",
};

export function getPlatformLogoUrl(key: string): string {
  const normalized = key.toLowerCase().trim();
  return PLATFORM_LOGO_URLS[normalized] ?? PLATFORM_LOGO_URLS[normalized.replace(/[\s_-]+/g, "_")] ?? "";
}

/* ─── Platform display name ───────────────────────────────────── */
function normalisePlatformName(key: string): string {
  const names: Record<string, string> = {
    spotify: "Spotify",
    apple_music: "Apple Music",
    youtube_music: "YouTube Music",
    youtube_streaming: "YouTube",
    "youtube streaming": "YouTube",
    "youtube (red)": "YouTube Premium",
    "youtube (ads)": "YouTube Ads",
    "youtube (audio)": "YouTube Audio",
    youtube_content_id: "YouTube CID",
    "youtube content id": "YouTube CID",
    "youtube audio tier": "YouTube Audio",
    audiomack: "Audiomack",
    boomplay: "Boomplay",
    boomplaycms: "Boomplay CMS",
    amazon_music: "Amazon Music",
    "amazon_prime": "Amazon Prime",
    "amazon prime": "Amazon Prime",
    "amazon unlimited (streaming)": "Amazon Unlimited",
    "amazon prime (streaming)": "Amazon Prime",
    tidal: "Tidal",
    deezer: "Deezer",
    tiktok: "TikTok",
    "tiktok music (audio)": "TikTok Music",
    facebook: "Facebook",
    "facebook / instagram": "Facebook/IG",
    "facebook / instagram - revenue share": "Facebook/IG RS",
    facebook_instagram: "Facebook/IG",
    "facebook: whatsapp": "WhatsApp",
    facebook_whatsapp: "WhatsApp",
    facebook_instagram_rs: "Facebook/IG RS",
    snapchat: "Snapchat",
    snap: "Snapchat",
    itunes: "iTunes",
    "itunes songs": "iTunes",
    "itunes match": "iTunes Match",
    triller: "Triller",
    lyricfind: "LyricFind",
    "lyricfind adjustments": "LyricFind",
    netease: "NetEase",
    "netease cloud music": "NetEase",
    resso: "Resso",
    anghami: "Anghami",
    luna: "Luna",
    jiosaavn: "JioSaavn",
    soundcloud: "SoundCloud",
    "soundcloud ad monetization": "SoundCloud Ads",
    soundcloud_ads: "SoundCloud Ads",
    "tencent direct deal": "Tencent",
    "tencent: qqmusic": "QQ Music",
    "fluxus: yandex music": "Yandex Music",
    yandex_music: "Yandex Music",
    "fluxus: mts music": "MTS Music",
    mts_music: "MTS Music",
  };
  return names[key.toLowerCase().trim()]
    ?? key.split(/[\s_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/* ─── Territory helpers ───────────────────────────────────────── */
const TERRITORY_NAMES: Record<string, string> = {
  NG: "Nigeria",   US: "United States", GB: "United Kingdom",
  GH: "Ghana",     KE: "Kenya",         ZA: "South Africa",
  FR: "France",    DE: "Germany",       CA: "Canada",
  BR: "Brazil",    CO: "Colombia",      MX: "Mexico",
  IT: "Italy",     ES: "Spain",         SE: "Sweden",
  AR: "Argentina", PE: "Peru",          CL: "Chile",
  AU: "Australia", NL: "Netherlands",
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

/* ─── Normalised page shape ───────────────────────────────────── */
export interface RoyaltiesPageData {
  stats: {
    totalEarnings:  { value: string; change: string; sub: string; icon: string };
    totalStreams:   { value: string; change: string; sub: string; icon: string };
    uniqueReleases: { value: string; change: string; sub: string; icon: string };
    territories:   { value: string; change: string; sub: string; icon: string };
  };
  revenueByPlatform: Array<{
    id: string; name: string; logoUrl: string; earnings: number; streams: number;
  }>;
  topEarningReleases: Array<{
    id: string; rank: number; title: string; artist: string;
    cover: string; streams: string; earnings: string; territories: number;
  }>;
  revenueByTerritory: Array<{
    id: string; rank: number; country: string; flag: string;
    streams: string; earnings: string; platforms: number;
  }>;
  socialVsStreaming: {
    socialMediaStats: { avgRate: string; uses: string; totalEarnings: string };
    streamingStats:   { avgRate: string; streams: string; totalEarnings: string };
    socialPlatforms: Array<{ platform: string; earnings: number; uses: number }>;
    streamingPlatforms: Array<{ platform: string; earnings: number; streams: number }>;
  };
  monthlyTrends: Array<{
    month: string;
    earnings: number;
    streams: number;
    avgRate: number;
  }>;
}

/* ─── Normaliser ──────────────────────────────────────────────── */
function normalise(
  royaltiesRaw: Record<string, unknown> | null,
  socialRaw: Record<string, unknown> | null,
): RoyaltiesPageData {
  // GET /royalties response:
  // { data: { overview: { total_earnings, total_streams, unique_releases, territories_reached },
  //   platform_breakdown: [{ platform, total_royalties (string), total_streams }],
  //   top_earning_releases: [...], territory_breakdown: [...] } }
  const d = (royaltiesRaw?.data as Record<string, unknown>) ?? royaltiesRaw ?? {};
  const overview = (d.overview as Record<string, unknown>) ?? d;

  const totalEarnings  = (overview.total_earnings      as number) ?? 0;
  const totalStreams    = parseInt(String(overview.total_streams ?? 0)) || 0;
  const uniqueReleases = (overview.unique_releases     as number) ?? 0;
  const territories    = (overview.territories_reached as number) ?? 0;

  // Platform breakdown — field is total_royalties (not total_earnings)
  // Also merge in social platform earnings from /social/vs-streaming
  const rawPlatforms = (d.platform_breakdown as Array<Record<string, unknown>>) ?? [];

  // Build a map of platform -> earnings from social/vs-streaming for supplementing
  const socialPlatformEarnings: Record<string, number> = {};
  const socialPlatformsRaw = ((socialRaw?.social_platforms as Record<string, unknown>)?.platforms as Array<Record<string, unknown>>) ?? [];
  const streamingPlatformsRaw = ((socialRaw?.streaming_platforms as Record<string, unknown>)?.platforms as Array<Record<string, unknown>>) ?? [];
  [...socialPlatformsRaw, ...streamingPlatformsRaw].forEach((p) => {
    const key = (p.platform as string ?? "").toLowerCase();
    socialPlatformEarnings[key] = parseFloat(String(p.total_earnings ?? p.total_royalties ?? 0)) || 0;
  });

  const revenueByPlatform = rawPlatforms
    .filter((p) => {
      const key = (p.platform as string ?? "").toLowerCase();
      return key !== "test_platform" && !key.includes("test_");
    })
    .map((p, i) => {
      const key = (p.platform as string ?? "").toLowerCase().trim();
      // total_royalties is the correct field from /royalties API
      const royaltyEarnings = parseFloat(String(p.total_royalties ?? p.total_earnings ?? 0)) || 0;
      // supplement with social/vs-streaming if royalties is 0
      const earnings = royaltyEarnings > 0 ? royaltyEarnings : (socialPlatformEarnings[key] ?? 0);
      return {
        id: String(i),
        name: normalisePlatformName(key),
        logoUrl: getPlatformLogoUrl(key),
        earnings,
        streams: (p.total_streams as number) ?? 0,
      };
    })
    .sort((a, b) => b.earnings - a.earnings);

  // Top earning releases
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

  // Territory breakdown
  const rawTerritories = (d.territory_breakdown as Array<Record<string, unknown>>) ?? [];
  const revenueByTerritory = rawTerritories.slice(0, 10).map((t, i) => {
    const code = (t.territory ?? "") as string;
    return {
      id: String(i),
      rank: i + 1,
      country: TERRITORY_NAMES[code] ?? code,
      flag: TERRITORY_FLAGS[code] ?? "🌍",
      streams:  fmtNum(t.total_streams as number),
      earnings: `$${parseFloat(String(t.total_earnings ?? 0)).toFixed(2)}`,
      platforms: (t.platforms_active as number) ?? 0,
    };
  });

  // Social vs streaming from /social/vs-streaming
  const sm = (socialRaw?.social_platforms as Record<string, unknown>) ?? {};
  const st = (socialRaw?.streaming_platforms as Record<string, unknown>) ?? {};

  const smTotalEarnings = (sm.total_earnings as number) ?? 0;
  const stTotalEarnings = (st.total_earnings as number) ?? 0;
  const smAvgRate = (sm.avg_rate as number) ?? 0;
  const stAvgRate = (st.avg_rate as number) ?? 0;

  const socialPlatforms = (socialPlatformsRaw).map((p) => ({
    platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
    earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
    uses: parseInt(String(p.total_uses ?? 0)) || 0,
  }));

  const streamingPlatforms = (streamingPlatformsRaw).map((p) => ({
    platform: normalisePlatformName((p.platform as string ?? "").toLowerCase()),
    earnings: parseFloat(String(p.total_earnings ?? 0)) || 0,
    streams: (p.total_streams as number) ?? 0,
  }));

  return {
    stats: {
      totalEarnings:  { value: `$${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, change: "", sub: "vs last period", icon: "/images/earnings.svg" },
      totalStreams:   { value: fmtNum(totalStreams),     change: "", sub: "vs last period", icon: "/images/streams.svg" },
      uniqueReleases: { value: String(uniqueReleases),  change: "", sub: "Avg/release",    icon: "/images/releases.svg" },
      territories:   { value: String(territories),      change: "", sub: "Platforms",      icon: "/images/countries.svg" },
    },
    revenueByPlatform,
    topEarningReleases,
    revenueByTerritory,
    socialVsStreaming: {
      socialMediaStats: {
        avgRate: `$${smAvgRate.toFixed(6)}`,
        uses: fmtNum(sm.total_uses as number),
        totalEarnings: `$${smTotalEarnings.toFixed(2)}`,
      },
      streamingStats: {
        avgRate: `$${stAvgRate.toFixed(6)}`,
        streams: fmtNum(st.total_streams as number),
        totalEarnings: `$${stTotalEarnings.toFixed(2)}`,
      },
      socialPlatforms,
      streamingPlatforms,
    },
    monthlyTrends: ((d.monthly_trends as Array<Record<string, unknown>>) ?? []).map((m) => ({
      month: (m.month as string) ?? "",
      earnings: parseFloat(String(m.total_earnings ?? 0)) || 0,
      streams: (m.total_streams as number) ?? 0,
      avgRate: parseFloat(String(m.avg_rate ?? 0)) || 0,
    })),
  };
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useRoyalties(platform: string = "all") {
  const [data, setData] = useState<RoyaltiesPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params: RoyaltiesParams = { platform };

    const [royaltiesRes, socialRes] = await Promise.all([
      getRoyalties(params),
      getSocialVsStreaming(params),
    ]);

    if (royaltiesRes.error) {
      setError(royaltiesRes.error);
      setData(normalise(null, null));
    } else {
      setData(normalise(
        royaltiesRes.data as Record<string, unknown>,
        socialRes.error ? null : socialRes.data as Record<string, unknown>,
      ));
    }
    setIsLoading(false);
  }, [platform]);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}