import { useState, useEffect, useCallback } from "react";
import {
  getMusic,
  getSingleRelease,
  getDrafts,
  getMusicRequests,
  requestEdit,
  requestTakedown,
  deleteDraft,
  type Release,
  type ReleaseTrack,
  type ReleaseContributor,
  type Draft,
  type EditRequest,
  type EditRequestPayload,
  type TakedownPayload,
  type MusicListParams,
} from "@/lib/api/music";
import { useAnalyticsV2Optional } from "@/lib/hooks/useAnalyticsV2";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";

/* ─── Helper — unwraps Laravel paginator or plain array ───────── */
function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    // Laravel paginator: { current_page, data: [...], total, ... }
    if (Array.isArray(obj.data)) return obj.data as T[];
    // Nested one more level (core.ts already unwrapped .data once)
    if (obj.data && typeof obj.data === "object") {
      const inner = obj.data as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data as T[];
    }
  }
  return [];
}

/**
 * How many pages the paginator says there are. 1 when the endpoint returned a plain
 * array, or when the shape is unrecognised — never guess higher, or the caller loops
 * fetching pages that do not exist.
 */
function readLastPage(raw: unknown): number {
  if (!raw || typeof raw !== "object") return 1;

  const obj = raw as Record<string, unknown>;
  const candidate =
    typeof obj.last_page === "number"
      ? obj.last_page
      : obj.data && typeof obj.data === "object"
        ? (obj.data as Record<string, unknown>).last_page
        : undefined;

  return typeof candidate === "number" && candidate > 0 ? candidate : 1;
}

/** Groups album/EP tracks into one entry per release; singles pass through. */
function groupReleases(rows: Release[]): NormalisedRelease[] {
  return rows.map(normaliseRelease).reduce<NormalisedRelease[]>((acc, r) => {
    if (r.type === "album_ep") {
      // Keyed on title AND artist: on a label account two artists can each have an
      // album called the same thing, and title alone would merge them into one card.
      const existing = acc.find(
        (a) => a.title === r.title && a.artist === r.artist && a.type === "album_ep"
      );
      if (existing) {
        existing.trackCount += 1;
        return acc;
      }
    }
    acc.push(r);
    return acc;
  }, []);
}

export interface NormalisedRelease {
  id: number;
  title: string;
  artist: string;
  cover: string;
  status: string;
  type: "single" | "album_ep";
  releaseDate: string;
  genre: string;
  platforms: string[];
  createdAt: string;
  trackCount: number;
}

function formatDate(raw: string | undefined): string {
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

/* ─── Safe JSON parse — API returns several fields as JSON strings ─ */
function safeParse<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw !== "string") return raw as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normaliseRelease(r: Release): NormalisedRelease {
  return {
    id: r.id,
    title: r.release_title ?? r.track_title ?? "",
    artist: r.primary_artist ?? "",
    cover: r.album_art_url ?? "",
    status: r.status ?? "pending",
    type: r.upload_type?.toLowerCase().includes("single") ? "single" : "album_ep",
    releaseDate: formatDate(r.release_date),
    genre: r.primary_genre ?? "",
    platforms: safeParse<string[]>(r.platforms, []),
    createdAt: r.created_at ?? "",
    trackCount: 1,
  };
}

/* ─── Detail shape — for the Release Detail Modal ──────────────── */
export interface NormalisedTrack {
  id: string;
  title: string;
  isrc: string;
  duration: string;
  producers: string;
  writers: string;
  performers: string;
  audioUrl: string;
}

export interface NormalisedReleaseDetail extends NormalisedRelease {
  upc: string;
  label: string;
  language: string;
  cLine: string;
  pLine: string;
  releaseLink: string;
  tracks: NormalisedTrack[];
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds || isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function normaliseTrack(t: ReleaseTrack, i: number): NormalisedTrack {
  // contributors is a JSON string: [{ name, role, type }]
  const contributors = safeParse<ReleaseContributor[]>(t.contributors, []);
  const producers  = contributors.filter((c) => c.type === "producer").map((c) => c.name).join(", ");
  const writers    = contributors.filter((c) => c.type === "writer").map((c) => c.name).join(", ");
  const performers = contributors.filter((c) => c.type === "performer").map((c) => c.name).join(", ");

  // metadata is a JSON string: { duration (seconds), bitrate, sample_rate, ... }
  const meta = safeParse<{ duration?: number }>(t.metadata, {});  const audioUrl = t.audio_url || (Array.isArray(t.audio_file_path) ? t.audio_file_path[0] : "") || "";

  return {
    id: String(t.id ?? i),
    title: t.track_title ?? "",
    isrc: t.isrc_code ?? "",
    duration: formatDuration(meta.duration),
    producers,
    writers,
    performers,
    audioUrl,
  };
}

function normaliseReleaseDetail(r: Release): NormalisedReleaseDetail {

  const rawTracks = r.tracks;
  const tracks = (rawTracks && rawTracks.length > 0)
    ? rawTracks.map(normaliseTrack)
    : [normaliseTrack(r as unknown as ReleaseTrack, 0)];

  return {
    ...normaliseRelease(r),
    upc: r.upc_code ?? "",
    label: r.label ?? "",
    language: r.metadata_language ?? "",
    cLine: r.c_line ?? "",
    pLine: r.p_line ?? "",
    releaseLink: (r as unknown as Record<string, unknown>).release_link as string ?? "",
    tracks,
  };
}

/* ─── useReleaseDetail — single release for the detail modal ──── */
export function useReleaseDetail(uploadId: number | null) {
  const [release, setRelease] = useState<NormalisedReleaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    const res = await getSingleRelease(id);
    if (res.error) {
      setError(res.error);
      setRelease(null);
    } else {
      const raw = res.data as unknown as Record<string, unknown>;
      const inner = (raw?.data as Release) ?? (res.data as Release);
      setRelease(normaliseReleaseDetail(inner));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (uploadId != null) load(uploadId);
    else setRelease(null);
  }, [uploadId, load]);

  return { release, isLoading, error, refresh: () => uploadId != null && load(uploadId) };
}

export function useMusic(params: MusicListParams = {}) {
  const [releases, setReleases] = useState<NormalisedRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const analytics = useAnalyticsV2Optional();

  if (process.env.NODE_ENV !== "production" && ANALYTICS_V2_ENABLED && !analytics) {
    console.warn(
      "[useMusic] No AnalyticsV2Provider above this component — the artist switcher will " +
        "be ignored and the full account catalogue shown. The provider belongs in " +
        "app/dashboard/layout.tsx, above the page module."
    );
  }

  const artistProfileId = params.artist_profile_id ?? analytics?.activeId ?? null;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const first = await getMusic({ ...params, artist_profile_id: artistProfileId });

    if (first.error) {
      setError(first.error);
      setIsLoading(false);
      return;
    }

    let rows = unwrapList<Release>(first.data);
    const lastPage = readLastPage(first.data);

    if (!params.page && lastPage > 1) {
      const BATCH = 6;
      let incomplete = false;

      for (let start = 2; start <= lastPage; start += BATCH) {
        const batch = Array.from(
          { length: Math.min(BATCH, lastPage - start + 1) },
          (_, i) => getMusic({ ...params, artist_profile_id: artistProfileId, page: start + i })
        );

        for (const res of await Promise.all(batch)) {
          if (res.error) {
            incomplete = true;
            continue;
          }
          rows = rows.concat(unwrapList<Release>(res.data));
        }
      }

      if (incomplete) {
        setError("Some releases could not be loaded. This list may be incomplete.");
      }
    }

    setReleases(groupReleases(rows));
    setIsLoading(false);
  }, [params.filter, params.page, artistProfileId]);

  useEffect(() => { load(); }, [load]);

  return { releases, isLoading, error, refresh: load };
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getDrafts();
    if (res.error) {
      setError(res.error);
    } else {
      setDrafts(unwrapList<Draft>(res.data));
    }
    setIsLoading(false);
  }, []);


  const remove = useCallback(async (id: number): Promise<string | null> => {
    const res = await deleteDraft(id);

    if (res.error) return res.error;

    setDrafts((prev) => prev.filter((d) => d.id !== id));
    return null;
  }, []);

  useEffect(() => { load(); }, [load]);

  return { drafts, isLoading, error, refresh: load, remove };
}

export function useMusicRequests() {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getMusicRequests();
    if (res.error) {
      setError(res.error);
    } else {
      setRequests(unwrapList<EditRequest>(res.data));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { requests, isLoading, error, refresh: load };
}

export function useRequestEdit() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      musicUploadId: number,
      payload: EditRequestPayload,
      onSuccess?: () => void
    ) => {
      setIsLoading(true);
      setError(null);
      const res = await requestEdit(musicUploadId, payload);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
      setIsLoading(false);
    },
    []
  );

  return { submit, isLoading, error };
}

export function useRequestTakedown() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      musicUploadId: number,
      payload: TakedownPayload,
      onSuccess?: () => void
    ) => {
      setIsLoading(true);
      setError(null);
      const res = await requestTakedown(musicUploadId, payload);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
      setIsLoading(false);
    },
    []
  );

  return { submit, isLoading, error };
}

export function useMusicStats(releases: NormalisedRelease[]) {
  return {
    totalReleases: releases.length,
    singles: releases.filter((r) => r.type === "single").length,
    albumsEps: releases.filter((r) => r.type === "album_ep").length,
    live: releases.filter((r) => {
      const s = r.status?.toLowerCase().replace(/\s+/g, "_") ?? "";
      return s === "live" || s === "distributed";
    }).length,
  };
}