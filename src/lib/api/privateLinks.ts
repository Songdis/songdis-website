import { request, BASE_URL } from "./core";

/*
 * Private links: a pre-release listening page an artist can hand to a playlist editor,
 * a blog or a manager.
 *
 * Not to be confused with the two link features that already exist:
 *   - releaseLinks.ts  — smart links to the DSPs, for music that is already out;
 *   - press-kit-public — an artist's public profile page at /k/<slug>.
 */

export type LinkVisibility = "private" | "public";

export interface PrivateLink {
  id: number;
  music_upload_id: number;
  token: string;
  url: string;
  visibility: LinkVisibility;
  has_passcode: boolean;
  label: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string | null;
  release: {
    title: string;
    artwork_url: string | null;
    upload_type: string | null;
  } | null;
}

export interface ListenTrack {
  id: number;
  number: number;
  title: string | null;
  mix_version: string | null;
  /** null means not assigned YET — the page says so rather than showing a blank. */
  isrc: string | null;
  explicit: boolean;
  duration: number | null;
  /** Signed and short-lived. Never the raw storage URL. */
  stream_url: string | null;
}

export interface ListenArtist {
  name: string | null;
  bio: string | null;
  image_url: string | null;
  location: string | null;
}

export interface ListenPage {
  locked: boolean;
  token?: string;
  visibility?: LinkVisibility;
  label?: string | null;
  /** Null for releases with no artist profile behind them — the page just omits the block. */
  artist?: ListenArtist | null;
  release: {
    title: string | null;
    artist: string | null;
    artwork_url: string | null;
    type?: string | null;
    release_date?: string | null;
    label_name?: string | null;
    genre?: string | null;
    upc?: string | null;
    track_count?: number;
  };
  tracks?: ListenTrack[];
}

/* ─── The artist's own links (authenticated) ──────────────────────────────── */

export async function getPrivateLinks() {
  return request<PrivateLink[]>("/private-links", { method: "GET" }, true);
}

export async function createPrivateLink(payload: {
  music_upload_id: number;
  visibility: LinkVisibility;
  passcode?: string;
  label?: string;
}) {
  return request<PrivateLink>(
    "/private-links",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function updatePrivateLink(
  id: number,
  payload: { visibility?: LinkVisibility; passcode?: string; label?: string | null }
) {
  return request<PrivateLink>(
    `/private-links/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    true
  );
}

/*
 * There is no delete here.
 *
 * The API has no artist-facing delete either: a link may already be in a playlist editor's
 * inbox, and it must not stop working because the artist tidied their dashboard. Revoking
 * one is an admin action.
 */

/* ─── The listening page (public, no account) ─────────────────────────────── */

/** Token shape as the API mints it; anything else is not worth a round trip. */
export function isValidToken(token: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(token.trim());
}

/**
 * Server-side fetch for the page shell.
 *
 * Never cached: the audio URLs it carries are signed and short-lived, so a cached copy
 * would hand a later visitor links that have already expired. A deleted link must also stop
 * working the moment it is deleted, not when a cache decides.
 */
export async function getListenPage(token: string): Promise<ListenPage | null> {
  if (!BASE_URL || !isValidToken(token)) return null;

  try {
    const res = await fetch(`${BASE_URL}/public/listen/${token}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as { data?: ListenPage } | null;

    return json?.data ?? null;
  } catch {
    return null;
  }
}

/** Exchange a passcode for the full page. */
export async function unlockListenPage(
  token: string,
  passcode: string
): Promise<{ page: ListenPage | null; error: string | null }> {
  if (!BASE_URL || !isValidToken(token)) {
    return { page: null, error: "This link is not available." };
  }

  try {
    const res = await fetch(`${BASE_URL}/public/listen/${token}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ passcode }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { data?: ListenPage; message?: string }
      | null;

    if (!res.ok) {
      return {
        page: null,
        error:
          res.status === 429
            ? "Too many tries. Wait a minute and try again."
            : json?.message ?? "That passcode is not right.",
      };
    }

    return { page: json?.data ?? null, error: null };
  } catch {
    return { page: null, error: "Network error. Please check your connection." };
  }
}
