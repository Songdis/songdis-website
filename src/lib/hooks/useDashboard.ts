// import { useState, useEffect, useCallback } from "react";
// import {
//   getDashboard,
//   getDashboardStats,
//   getTopReleases,
//   getStreamsData,
//   type DashboardRelease,
//   type DashboardStats,
//   type WalletData,
//   type TopRelease,
// } from "@/lib/api/dashboard";

// export interface DashboardPageData {
//   stats: DashboardStats;
//   wallet: WalletData;
//   recentReleases: DashboardRelease[];
//   analyticsChart: {
//     months: string[];
//     streams: number[];
//     revenue: number[];
//   };
//   ayoInsight: { message: string };
//   features: Array<{ id: string; title: string; description: string; icon: string }>;
//   user: { name: string; plan: string; avatar: string };
// }

// const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// const FALLBACK_INSIGHT = {
//   message:
//     "Your track is gaining early traction. Based on similar Afrobeats releases, pitching to editorial playlists in the next 7 days could significantly boost discovery. Want me to draft a pitch?",
// };

// const FALLBACK_FEATURES = [
//   { id: "royalty", title: "Royalty Report",  description: "Maximize your royalties with access to 50+ collection societies", icon: "report" },
//   { id: "links",   title: "Release Links",   description: "Share your music everywhere with pre-save campaign links.", icon: "link" },
//   { id: "pitch",   title: "Priority Pitch",  description: "Submit your releases to access enhanced promotion and editorial playlists.", icon: "pitch" },
//   { id: "ayo",     title: "Ayo AI",          description: "Smart and seamless insights powered by Ayo AI", icon: "ayo" },
//   { id: "splitr",  title: "Splitr",          description: "Automatically split your music revenues among collaborators", icon: "splitr" },
//   { id: "amplify", title: "Amplify",         description: "Expand your sound to a wider audience worldwide.", icon: "amplify" },
// ];

// const FALLBACK_USER = {
//   name: "VJazzy",
//   plan: "Growth Plan",
//   avatar: "/images/avatar-artiste.svg",
// };

// const VALID_STATUSES = [
//   "live", "pending", "delivered", "distributed", "need_documentation",
// ] as const;
// type ValidStatus = typeof VALID_STATUSES[number];

// function toStatus(raw: string | undefined): ValidStatus {
//   if (raw && (VALID_STATUSES as readonly string[]).includes(raw)) return raw as ValidStatus;
//   return "live";
// }

// function normaliseDashboard(
//   dashboardRaw: Record<string, unknown> | null,
//   statsRaw: Record<string, unknown> | null,
//   releases: TopRelease[] | null,
//   streamsRaw: { months?: string[]; streams?: number[]; revenue?: number[] } | null
// ): DashboardPageData {
//   const activeReleases =
//     (dashboardRaw?.active_releases as number) ??
//     (statsRaw?.active_releases as number) ?? 0;

//   const totalEarnings =
//     (dashboardRaw?.total_earnings as number) ??
//     (statsRaw?.total_earnings as number) ?? 0;

//   const totalStreams =
//     (dashboardRaw?.total_streams as number) ??
//     (statsRaw?.total_streams as number) ?? 0;

//   const wallet: WalletData = {
//     totalEarnings,
//     period: (dashboardRaw?.period as string) ?? "",
//     streams: totalStreams,
//     avgPerStream: totalStreams > 0 ? totalEarnings / totalStreams : 0,
//   };

//   // DES-002: confirmed field name from API is album_art_url
//   const recentReleases: DashboardRelease[] = (releases ?? [])
//     .slice(0, 5)
//     .map((r) => {
//       const raw = r as unknown as Record<string, unknown>;
//       return {
//         id: r.id,
//         title: (raw.release_title ?? raw.release_name ?? raw.track_title ?? r.title ?? "") as string,
//         artist: (raw.primary_artist ?? raw.artists ?? r.artist ?? "") as string,
//         cover: (raw.album_art_url ?? raw.artwork_url ?? r.cover ?? "") as string,
//         status: toStatus(r.status ?? (raw.status as string)),
//       };
//     });

//   const analyticsChart = {
//     months: streamsRaw?.months ?? MONTHS,
//     streams: streamsRaw?.streams ?? Array(12).fill(0),
//     revenue: streamsRaw?.revenue ?? Array(12).fill(0),
//   };

//   return {
//     stats: { activeReleases, totalEarnings },
//     wallet,
//     recentReleases,
//     analyticsChart,
//     ayoInsight: FALLBACK_INSIGHT,
//     features: FALLBACK_FEATURES,
//     user: FALLBACK_USER,
//   };
// }

// export function useDashboard() {
//   const [data, setData] = useState<DashboardPageData | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const load = useCallback(async () => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       const [dashboardRes, statsRes, releasesRes, streamsRes] = await Promise.all([
//         getDashboard(),
//         getDashboardStats(),
//         getTopReleases(),
//         getStreamsData(),
//       ]);

//       const firstError =
//         dashboardRes.error ?? statsRes.error ?? releasesRes.error ?? streamsRes.error;

//       if (firstError) {
//         setError(firstError);
//         setData(normaliseDashboard(null, null, null, null));
//       } else {
//         setData(
//           normaliseDashboard(
//             dashboardRes.data as Record<string, unknown>,
//             statsRes.data as Record<string, unknown>,
//             releasesRes.data as TopRelease[],
//             streamsRes.data as { months?: string[]; streams?: number[]; revenue?: number[] },
//           )
//         );
//       }
//     } catch {
//       setError("Failed to load dashboard.");
//       setData(normaliseDashboard(null, null, null, null));
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   return { data, isLoading, error, refresh: load };
// }


import { useState, useEffect, useCallback } from "react";
import {
  getDashboard,
  getDashboardStats,
  getStreamsData,
  type DashboardRelease,
  type DashboardStats,
  type WalletData,
} from "@/lib/api/dashboard";

export interface DashboardPageData {
  stats: DashboardStats;
  wallet: WalletData;
  recentReleases: DashboardRelease[];
  analyticsChart: {
    months: string[];
    streams: number[];
    revenue: number[];
  };
  ayoInsight: { message: string };
  features: Array<{ id: string; title: string; description: string; icon: string }>;
  user: { name: string; plan: string; avatar: string };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FALLBACK_FEATURES = [
  { id: "royalty", title: "Royalty Report",  description: "Maximize your royalties with access to 50+ collection societies", icon: "report" },
  { id: "links",   title: "Release Links",   description: "Share your music everywhere with pre-save campaign links.", icon: "link" },
  { id: "pitch",   title: "Priority Pitch",  description: "Submit your releases to access enhanced promotion and editorial playlists.", icon: "pitch" },
  { id: "ayo",     title: "Ayo AI",          description: "Smart and seamless insights powered by Ayo AI", icon: "ayo" },
  { id: "splitr",  title: "Splitr",          description: "Automatically split your music revenues among collaborators", icon: "splitr" },
  { id: "amplify", title: "Amplify",         description: "Expand your sound to a wider audience worldwide.", icon: "amplify" },
];

const VALID_STATUSES = [
  "live", "pending", "delivered", "distributed", "need_documentation",
] as const;
type ValidStatus = typeof VALID_STATUSES[number];

function toStatus(raw: string | undefined): ValidStatus {
  if (!raw) return "live";
  const lower = raw.toLowerCase();
  if ((VALID_STATUSES as readonly string[]).includes(lower)) return lower as ValidStatus;
  // API returns "Live" with capital L — normalise
  return "live";
}

function normaliseDashboard(
  statsRaw: Record<string, unknown> | null,
  streamsRaw: { months?: string[]; streams?: number[]; revenue?: number[] } | null
): DashboardPageData {
  // GET /dashboard-stats response shape:
  // { data: { active_releases, total_streams, total_earnings, royalty_balance,
  //   recent_releases: [{ id, track_title, release_title, primary_artist,
  //     release_date, status, album_art_url }],
  //   platform_performance: [...] } }

  const d = (statsRaw?.data as Record<string, unknown>) ?? statsRaw ?? {};

  const activeReleases = (d.active_releases as number) ?? 0;
  const totalEarnings  = (d.total_earnings  as number) ?? (d.royalty_balance as number) ?? 0;
  const totalStreams    = (d.total_streams   as number) ?? 0;

  const wallet: WalletData = {
    totalEarnings,
    period: "",
    streams: totalStreams,
    avgPerStream: totalStreams > 0 ? totalEarnings / totalStreams : 0,
  };

  // DES-002: recent_releases is directly in dashboard-stats response
  // Fields confirmed: id, track_title, release_title, primary_artist, status, album_art_url
  const rawReleases = (d.recent_releases as Array<Record<string, unknown>>) ?? [];
  const recentReleases: DashboardRelease[] = rawReleases.slice(0, 5).map((r) => ({
    id: r.id as number,
    title: (r.release_title ?? r.track_title ?? "") as string,
    artist: (r.primary_artist ?? "") as string,
    cover: (r.album_art_url ?? "") as string,
    status: toStatus(r.status as string),
  }));

  const analyticsChart = {
    months: streamsRaw?.months ?? MONTHS,
    streams: streamsRaw?.streams ?? Array(12).fill(0),
    revenue: streamsRaw?.revenue ?? Array(12).fill(0),
  };

  return {
    stats: { activeReleases, totalEarnings },
    wallet,
    recentReleases,
    analyticsChart,
    ayoInsight: { message: "" }, // DES-005: no dummy content
    features: FALLBACK_FEATURES,
    user: { name: "", plan: "Growth Plan", avatar: "/images/avatar-artiste.svg" },
  };
}

export function useDashboard() {
  const [data, setData] = useState<DashboardPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsRes, streamsRes] = await Promise.all([
        getDashboardStats(),
        getStreamsData(),
      ]);

      if (statsRes.error) {
        setError(statsRes.error);
        setData(normaliseDashboard(null, null));
      } else {
        setData(
          normaliseDashboard(
            statsRes.data as Record<string, unknown>,
            streamsRes.data as { months?: string[]; streams?: number[]; revenue?: number[] } | null,
          )
        );
      }
    } catch {
      setError("Failed to load dashboard.");
      setData(normaliseDashboard(null, null));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, error, refresh: load };
}