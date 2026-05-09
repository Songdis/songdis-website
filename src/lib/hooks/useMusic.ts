/**
 * lib/hooks/useMusic.ts
 * Data hooks for the Your Music page.
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMusic,
  getDrafts,
  getMusicRequests,
  requestEdit,
  requestTakedown,
  deleteDraft,
  type Release,
  type Draft,
  type EditRequest,
  type EditRequestPayload,
  type TakedownPayload,
  type MusicListParams,
} from "@/lib/api/music";

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
    platforms: r.platforms ?? [],
    createdAt: r.created_at ?? "",
  };
}

/* ─── useMusic — main releases list ──────────────────────────── */
export function useMusic(params: MusicListParams = {}) {
  const [releases, setReleases] = useState<NormalisedRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await getMusic(params);
    if (res.error) {
      setError(res.error);
    } else {
      setReleases(unwrapList<Release>(res.data).map(normaliseRelease));
    }
    setIsLoading(false);
  }, [params.filter, params.page]);

  useEffect(() => { load(); }, [load]);

  return { releases, isLoading, error, refresh: load };
}

/* ─── useDrafts ───────────────────────────────────────────────── */
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

  const remove = useCallback(async (id: number) => {
    await deleteDraft(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { drafts, isLoading, error, refresh: load, remove };
}

/* ─── useMusicRequests — edit history tab ─────────────────────── */
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

/* ─── useRequestEdit ──────────────────────────────────────────── */
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

/* ─── useRequestTakedown ──────────────────────────────────────── */
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

/* ─── useMusicStats — derived from releases list ─────────────── */
export function useMusicStats(releases: NormalisedRelease[]) {
  return {
    totalReleases: releases.length,
    singles: releases.filter((r) => r.type === "single").length,
    albumsEps: releases.filter((r) => r.type === "album_ep").length,
    live: releases.filter((r) => r.status === "live" || r.status === "distributed").length,
  };
}