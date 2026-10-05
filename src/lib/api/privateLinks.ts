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
  comments?: LinkComment[];
  ratings?: TrackRating[];
}

/** How a track was rated. Seen by the artist and support only — never on the public page. */
export interface TrackRating {
  music_upload_id: number;
  track_title: string | null;
  votes: number;
  average: number;
}

/** A comment as the artist and the admin see it — the track is named, since an album's
 *  link covers several and the feedback is useless without knowing which song. */
export interface LinkComment {
  id: number;
  author_name: string;
  body: string;
  at_seconds: number | null;
  track_title: string | null;
  created_at: string | null;
  reply_body?: string | null;
  replied_at?: string | null;
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
  /** Featured artists, already filtered to real features server-side. */
  features?: string[];
  likes?: number;
  /** Whether THIS browser already liked it. */
  liked?: boolean;
  /**
   * What THIS browser rated it, out of five. Never anybody else's, and never an average:
   * a rating is private to the artist, and arithmetic on a shared page would leak it.
   */
  my_rating?: number | null;
  /** Signed and short-lived. Never the raw storage URL. */
  stream_url: string | null;
}

export interface ListenSocial {
  platform: string;
  label: string;
  url: string;
}

export interface ListenArtist {
  name: string | null;
  bio: string | null;
  image_url: string | null;
  location: string | null;
  /** Only links that resolve — bare handles are dropped server-side. */
  socials?: ListenSocial[];
  /** Only when the artist has actually published their press kit. */
  press_kit_url?: string | null;
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
  comments?: ListenComment[];
}

/** Feedback left on a track by whoever was sent the link. */
export interface ListenComment {
  id: number;
  music_upload_id: number;
  author_name: string;
  body: string;
  /** How far into the track they were, when they said so. */
  at_seconds: number | null;
  created_at: string | null;
  /** The artist's answer, shown under the comment. Null until they reply. */
  reply_body?: string | null;
  replied_at?: string | null;
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

/**
 * Answer a comment left on one of the artist's links.
 *
 * An empty body removes the reply — the same call, so an artist can take back something
 * written in haste without a second endpoint.
 */
export async function replyToComment(commentId: number, body: string) {
  return request<{ id: number; reply_body: string | null; replied_at: string | null }>(
    `/private-links/comments/${commentId}/reply`,
    { method: "PATCH", body: JSON.stringify({ body }) },
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
 * Who this browser is, as far as a like is concerned.
 *
 * A random token kept in localStorage — not an IP, because an A&R office, a label and a
 * shared studio all sit behind one address and would count as a single listener. It
 * identifies nobody: it exists so a heart stays filled when they come back, and so one
 * person cannot like the same track twenty times.
 */
export function listenerId(): string {
  const KEY = "songdis_listener_id";

  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;

    const minted =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(KEY, minted);
    return minted;
  } catch {
    // Private mode throws. A per-session id still prevents double-liking within the visit,
    // which is all a heart needs.
    return `ephemeral-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Rate a track out of five.
 *
 * Only the artist sees the result. The response says nothing but what this listener gave —
 * no average, no count — so nothing on this page can reveal what anyone else thought.
 */
export async function rateTrack(
  token: string,
  musicUploadId: number,
  rating: number,
  passcode?: string | null
): Promise<number | null> {
  if (!BASE_URL || !isValidToken(token)) return null;

  try {
    const res = await fetch(`${BASE_URL}/public/listen/${token}/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Listener-Id": listenerId(),
        ...(passcode ? { "X-Link-Passcode": passcode } : {}),
      },
      body: JSON.stringify({ music_upload_id: musicUploadId, rating }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as { data?: { my_rating: number } } | null;

    return json?.data?.my_rating ?? null;
  } catch {
    return null;
  }
}

/** Like a track, or take the like back — one call for both, since a heart is a toggle. */
export async function toggleTrackLike(
  token: string,
  musicUploadId: number,
  passcode?: string | null
): Promise<{ liked: boolean; likes: number } | null> {
  if (!BASE_URL || !isValidToken(token)) return null;

  try {
    const res = await fetch(`${BASE_URL}/public/listen/${token}/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Listener-Id": listenerId(),
        ...(passcode ? { "X-Link-Passcode": passcode } : {}),
      },
      body: JSON.stringify({ music_upload_id: musicUploadId }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json().catch(() => null)) as
      | { data?: { liked: boolean; likes: number } }
      | null;

    return json?.data ?? null;
  } catch {
    return null;
  }
}

/** Server-side fetch for the page shell.
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

/**
 * Leave feedback on a track.
 *
 * Carries the passcode when the page is a locked one: the API refuses a comment on a link
 * the commenter could not have opened.
 */
export async function postListenComment(
  token: string,
  payload: { music_upload_id: number; author_name: string; body: string; at_seconds?: number },
  passcode?: string | null
): Promise<{ comment: ListenComment | null; error: string | null }> {
  if (!BASE_URL || !isValidToken(token)) {
    return { comment: null, error: "This link is not available." };
  }

  try {
    const res = await fetch(`${BASE_URL}/public/listen/${token}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(passcode ? { "X-Link-Passcode": passcode } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { data?: ListenComment; message?: string; errors?: Record<string, string[]> }
      | null;

    if (!res.ok) {
      // Laravel puts the useful sentence in `errors`; `message` is the generic one.
      const firstFieldError = Object.values(json?.errors ?? {})[0]?.[0];

      return {
        comment: null,
        error:
          res.status === 429
            ? "That is a lot of comments at once. Give it a minute."
            : firstFieldError ?? json?.message ?? "Could not post that.",
      };
    }

    return { comment: json?.data ?? null, error: null };
  } catch {
    return { comment: null, error: "Network error. Please check your connection." };
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
