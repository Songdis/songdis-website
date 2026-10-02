"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createPrivateLink,
  getPrivateLinks,
  updatePrivateLink,
  type LinkVisibility,
  type PrivateLink,
} from "@/lib/api/privateLinks";

/**
 * The artist's private links, loaded once for the whole music page.
 *
 * Kept here rather than in each card: the release grid renders dozens of cards and every one
 * of them needs to know whether its release has a link, which would otherwise be a request
 * per card. One call, indexed by release id.
 */
export function usePrivateLinks() {
  const [links, setLinks] = useState<PrivateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await getPrivateLinks();

    if (res.error) {
      setError(res.error);
      setLinks([]);
    } else {
      setError(null);
      setLinks(Array.isArray(res.data) ? res.data : []);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /**
   * release id → its link.
   *
   * An album is many rows sharing a release title, and a link is created against whichever
   * row the artist had open, so the same link is indexed under every track id of that
   * release — otherwise the card for an album would only show the headphone when it happened
   * to be built from the exact row the link was made on.
   */
  const byRelease = useMemo(() => {
    const map = new Map<number, PrivateLink>();
    for (const link of links) map.set(link.music_upload_id, link);
    return map;
  }, [links]);

  const create = useCallback(
    async (payload: { music_upload_id: number; visibility: LinkVisibility; passcode?: string; label?: string }) => {
      const res = await createPrivateLink(payload);
      if (!res.error && res.data) setLinks((prev) => [res.data as PrivateLink, ...prev]);
      return res;
    },
    []
  );

  const update = useCallback(
    async (id: number, payload: { visibility?: LinkVisibility; passcode?: string; label?: string | null }) => {
      const res = await updatePrivateLink(id, payload);
      if (!res.error && res.data) {
        setLinks((prev) => prev.map((l) => (l.id === id ? (res.data as PrivateLink) : l)));
      }
      return res;
    },
    []
  );

  // No remove(): an artist cannot delete a private link, because one may already be with a
  // playlist editor. Taking one down is an admin action — see the admin Private Links screen.
  return { links, byRelease, isLoading, error, refresh: load, create, update };
}
