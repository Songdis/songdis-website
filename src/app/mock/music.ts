/**
 * lib/mock/music.ts
 * Mock data for the Your Music page.
 * Replace with real API calls when backend is ready.
 */

export type ReleaseStatus =
  | "live"
  | "pending"
  | "delivered"
  | "distributed"
  | "need_documentation";

export type ReleaseType = "single" | "album" | "mixtape";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string; // "m:ss"
  isrc: string;
  producers: string;
  writers: string;
  performers: string;
}

export interface Release {
  id: string;
  title: string;
  artist: string;
  type: ReleaseType;
  status: ReleaseStatus;
  cover: string; // path to Figma-exported SVG in /public/images/releases/
  upc: string;
  releaseDate: string;
  tracks: Track[];
}

export interface EditHistoryItem {
  id: string;
  releaseId: string;
  releaseCover: string;
  releaseTitle: string;
  description: string;
  detail: string;
  timestamp: string;
}

/* ─── Status config ───────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  ReleaseStatus,
  { label: string; color: string; bg: string }
> = {
  live:               { label: "Live",               color: "#22c55e", bg: "rgba(34,197,94,0.15)"   },
  pending:            { label: "Pending",            color: "#f97316", bg: "rgba(249,115,22,0.15)"  },
  delivered:          { label: "Delivered",          color: "#60a5fa", bg: "rgba(96,165,250,0.15)"  },
  distributed:        { label: "Distributed",        color: "#2dd4bf", bg: "rgba(45,212,191,0.15)"  },
  need_documentation: { label: "Need Documentation", color: "#facc15", bg: "rgba(250,204,21,0.15)"  },
};

/* ─── Mock releases ───────────────────────────────────────────── */
// cover paths point to Figma exports — drop SVGs in /public/images/releases/
const COVERS = {
  blue: "/images/cover-blue.jpg",
  dark: "/images/cover-black.jpg",
};

const MOCK_TRACK = (id: string): Track => ({
  id,
  title: "Scatter the Place",
  artist: "Vjazzy",
  duration: "1:47",
  isrc: "QZ5FN26044242",
  producers: "Prod. by Melodysongz",
  writers: "Written by Obed Ugwu",
  performers: "Performed by Vjazzy",
});

const makeRelease = (
  id: string,
  status: ReleaseStatus,
  cover: string
): Release => ({
  id,
  title: "Scatter the Place",
  artist: "Vjazzy",
  type: "single",
  status,
  cover,
  upc: "199891320509",
  releaseDate: "Mar 21, 2026",
  tracks: [MOCK_TRACK(`track-${id}`)],
});

export const MOCK_RELEASES: Release[] = [
  makeRelease("1",  "live",               COVERS.blue),
  makeRelease("2",  "pending",            COVERS.dark),
  makeRelease("3",  "delivered",          COVERS.blue),
  makeRelease("4",  "need_documentation", COVERS.dark),
  makeRelease("5",  "live",               COVERS.blue),
  makeRelease("6",  "pending",            COVERS.dark),
  makeRelease("7",  "distributed",        COVERS.blue),
  makeRelease("8",  "need_documentation", COVERS.dark),
  makeRelease("9",  "live",               COVERS.blue),
  makeRelease("10", "pending",            COVERS.dark),
  makeRelease("11", "delivered",          COVERS.blue),
  makeRelease("12", "need_documentation", COVERS.dark),
];

export const MOCK_DRAFTS: Release[] = MOCK_RELEASES.slice(0, 8).map((r) => ({
  ...r,
  status: "pending" as ReleaseStatus,
}));

export const MOCK_EDIT_HISTORY: EditHistoryItem[] = Array.from(
  { length: 7 },
  (_, i) => ({
    id: `edit-${i}`,
    releaseId: "1",
    releaseCover: COVERS.blue,
    releaseTitle: "Scatter the Place",
    description: 'Metadata updated — "Scatter the Place"',
    detail: "Genre changed from Afropop to Afrobeats · Affects playlist recommendations",
    timestamp: "2 hours ago",
  })
);

export const MOCK_MUSIC_STATS = {
  totalReleases: 3,
  liveReleases: 2,
  pendingReview: 2,
  totalTracks: 3,
  // Edit history tab
  totalRequests: 3,
  pending: 2,
  approved: 2,
};