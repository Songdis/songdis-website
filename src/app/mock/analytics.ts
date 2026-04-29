/**
 * lib/mock/analytics.ts
 * Replace with real API calls when backend is ready.
 */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const MOCK_ANALYTICS = {
  /* ─── Top stat cards ──────────────────────────────────────── */
  totalStreams:  { value: "530.4K", sub: "All DSPs",    change: "+86.2%", icon: "/images/streams.svg" },
  avgPerDay:     { value: "1.5K",   sub: "Per day",                       icon: "/images/avg-day.svg" },
  releases:      { value: "29",     sub: "With data",                     icon: "/images/releases.svg" },
  countries:     { value: "166",    sub: "Territories",                   icon: "/images/countries.svg" },
  platforms:     { value: "44",     sub: "DSPs",                          icon: "/images/platforms.svg" },
  playlists:     { value: "7",      sub: "Active",                        icon: "/images/playlist-analytics.svg" },

  /* ─── Monthly listeners highlight ───────────────────────── */
  monthlyListeners: { value: "3.3K", platform: "Spotify", period: "Last 28 days", change: "+86.2%" },

  /* ─── Streams over time ──────────────────────────────────── */
  streamsOverTime: {
    months: MONTHS,
    streams: [10, 20, 30, 52, 70, 60, 65, 75, 68, 80, 85, 88],
    revenue: [5,  10, 18, 30, 50, 45, 50, 60, 55, 70, 78, 82],
  },

  /* ─── Top songs (Overview) ───────────────────────────────── */
  topSongs: Array.from({ length: 6 }, (_, i) => ({
    id: `song-${i}`,
    rank: i + 1,
    title: "Scatter the Place",
    year: "2026",
    cover: "/images/smallest-blue-cover.svg",
    streams: "630.4k",
  })),

  /* ─── Platform breakdown bar chart ──────────────────────── */
  platformBreakdown: [
    { name: "Spotify",     streams: 800000, color: "#1DB954" },
    { name: "Apple Music", streams: 120000, color: "#FC3C44" },
    { name: "Boomplay",    streams: 300000, color: "#60a5fa" },
    { name: "Audiomack",   streams: 120000, color: "#f97316" },
    { name: "Youtube",     streams: 490000, color: "#C30100" },
    { name: "Tidal",       streams: 20000,  color: "#888" },
  ],

  /* ─── Listener trends ────────────────────────────────────── */
  listenerTrends: {
    months: MONTHS,
    data: [25, 35, 45, 55, 100, 75, 80, 75, 70, 78, 90, 88],
    latest: "4.6K",
    peak:   "4.6K",
    average:"3.6K",
  },

  /* ─── Top tracks (Tracks view) ───────────────────────────── */
  topTracks: Array.from({ length: 11 }, (_, i) => ({
    id: `track-${i}`,
    rank: i + 1,
    title: "Scatter the Place",
    year: "2026",
    cover: "/images/smallest-blue-cover.svg",
    streams: "$1.5K",
    progress: Math.max(30, 100 - i * 8),
  })),

  /* ─── Streams by territory (Platforms view) ──────────────── */
  streamsByTerritory: Array.from({ length: 10 }, (_, i) => ({
    id: `plat-${i}`,
    rank: i < 1 ? 1 : 2,
    name: "Facebook",
    logo: "/images/facebook.svg",
    territories: 44,
    avgPerStream: "$0.0003",
    streams: "2.7M",
    change: "60.9%",
    revenue: "$356.4K",
  })),

  /* ─── Geography ──────────────────────────────────────────── */
  territoryBar: [
    { country: "UK",           flag: "🇬🇧", streams: 2800000 },
    { country: "Nigeria",      flag: "🇳🇬", streams: 200000  },
    { country: "United States",flag: "🇺🇸", streams: 1300000 },
    { country: "Portugal",     flag: "🇵🇹", streams: 600000  },
    { country: "Ghana",        flag: "🇬🇭", streams: 1100000 },
    { country: "Australia",    flag: "🇦🇺", streams: 150000  },
    { country: "South Africa", flag: "🇿🇦", streams: 180000  },
    { country: "India",        flag: "🇮🇳", streams: 80000   },
  ],
  platformStreams: Array.from({ length: 7 }, (_, i) => ({
    id: `ps-${i}`,
    rank: i + 1,
    name: i % 2 === 0 ? "TikTok" : i % 3 === 0 ? "Apple Music" : "Youtube Music",
    logo: "/images/tiktok.svg",
    streams: "2.7M",
    avgPerStream: "$0.00003",
  })),

  /* ─── Trends ─────────────────────────────────────────────── */
  streamingTrends: {
    months: MONTHS,
    data: [20, 30, 40, 50, 100, 80, 85, 80, 75, 82, 92, 90],
    latest: "4.6K",
    peak:   "4.6K",
    average:"3.6K",
  },
  platformMiniCards: [
    { name: "Spotify",       streams: "530.4K", change: "+58%", positive: true,  color: "#1DB954" },
    { name: "Apple",         streams: "262.8K", change: "+70%", positive: true,  color: "#FC3C44" },
    { name: "YouTube Music", streams: "530.4K", change: "-58%", positive: false, color: "#C30100" },
    { name: "Spotify",       streams: "530.4K", change: "+58%", positive: true,  color: "#1DB954" },
    { name: "Apple",         streams: "262.8K", change: "+70%", positive: true,  color: "#FC3C44" },
    { name: "YouTube Music", streams: "530.4K", change: "-58%", positive: false, color: "#C30100" },
    { name: "Spotify",       streams: "530.4K", change: "+58%", positive: true,  color: "#1DB954" },
    { name: "Apple",         streams: "262.8K", change: "+70%", positive: true,  color: "#FC3C44" },
    { name: "YouTube Music", streams: "530.4K", change: "-58%", positive: false, color: "#C30100" },
  ],

  /* ─── Charts / Playlists / Radio shared stats ─────────────── */
  liveStats: { chartEntries: 10, peakPosition: "#4", peakSub: "Spotify Viral 50 Nigeria", newThisWeek: 3 },

  chartPositions: Array.from({ length: 9 }, (_, i) => ({
    id: `cp-${i}`,
    position: "#4",
    title: "Scatter the Place",
    chart: "Spotify Viral 50 Nigeria",
    cover: "/images/smallest-blue-cover.svg",
    country: "Nigeria",
  })),

  playlistPlacements: Array.from({ length: 9 }, (_, i) => ({
    id: `pp-${i}`,
    name: "Afrobeats Daily",
    platform: "Spotify",
    track: "Scatter the Place",
    cover: "/images/smallest-blue-cover.svg",
    followers: "142K",
    streams: 4821,
    status: i % 2 === 0 ? "active" : "pending",
  })),

  radioAppearances: Array.from({ length: 9 }, (_, i) => ({
    id: `ra-${i}`,
    station: "Cool FM Nigeria",
    genre: "Afrobeats/Hits",
    track: "Scatter the Place",
    plays: 42,
    reach: "2.1M",
    region: "NG",
  })),

  /* ─── Socials ────────────────────────────────────────────── */
  socials: [
    { platform: "TikTok",    followers: "2.1K", change: "+6%",  positive: true },
    { platform: "Instagram", followers: "2.1K", change: "+6%",  positive: true },
    { platform: "Facebook",  followers: "2.1K", change: "+6%",  positive: true },
    { platform: "Twitter",   followers: "2.1K", change: "-5%",  positive: false },
  ],
  socialGrowth: {
    months: MONTHS,
    data: [200, 250, 350, 400, 950, 700, 720, 700, 680, 740, 880, 860],
    latest: "2.1K",
    peak:   "2.1K",
    average:"2.0K",
  },
};

export type AnalyticsView =
  | "overview"
  | "platforms"
  | "tracks"
  | "geography"
  | "trends"
  | "charts"
  | "playlists"
  | "radio"
  | "socials";

export const VIEW_OPTIONS: { label: string; value: AnalyticsView; live?: boolean }[] = [
  { label: "Overview",  value: "overview" },
  { label: "Platforms", value: "platforms" },
  { label: "Tracks",    value: "tracks" },
  { label: "Geography", value: "geography" },
  { label: "Trends",    value: "trends" },
  { label: "Charts",    value: "charts",    live: true },
  { label: "Playlist",  value: "playlists", live: true },
  { label: "Radio",     value: "radio",     live: true },
  { label: "Socials",   value: "socials",   live: true },
];