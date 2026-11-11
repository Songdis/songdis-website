"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken, request } from "@/lib/api/core";

export interface EpkArtist {
  id: number;
  stage_name: string;
  slug: string | null;
  image: string | null;
  source: "songdis" | "getepk";
  is_published: boolean;
}

interface Listing {
  artists: EpkArtist[];
  can_create: boolean;
  limit: number;
}

/** The artists this account makes kits for. Sends a signed-out visitor to sign in. */
export function useEpkArtists() {
  const [data, setData] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await request<Listing>("/epk/artists", { method: "GET" }, true);
    if (res.data) setData(res.data);
    else setError(res.error ?? "Could not load your artists.");
  }, []);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = "/sign-in";
      return;
    }
    let live = true;
    request<Listing>("/epk/artists", { method: "GET" }, true).then((res) => {
      if (!live) return;
      if (res.data) setData(res.data);
      else setError(res.error ?? "Could not load your artists.");
    });
    return () => {
      live = false;
    };
  }, []);

  const create = useCallback(async (stageName: string, spotifyUrl: string | null = null): Promise<{ id?: number; error?: string }> => {
    const res = await request<{ id: number }>(
      "/epk/artists",
      { method: "POST", body: JSON.stringify({ stage_name: stageName, spotify_url: spotifyUrl }) },
      true
    );
    if (res.data?.id) return { id: res.data.id };
    return { error: res.error ?? "Could not create that artist." };
  }, []);

  return { data, error, create, reload: load };
}
