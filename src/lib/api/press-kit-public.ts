import { BASE_URL } from "./core";
import { normalisePublicCoSign, type PublicCoSign } from "./co-sign";


export type PressKitTheme =
  | "blaze"
  | "midnight"
  | "violet"
  | "emerald"
  | "gold"
  | "mono";

export type PressKitHeadlineFont = "heading" | "serif" | "body";

export type PressKitSectionKey =
  | "glance"
  | "bio"
  | "listen"
  | "press"
  | "photos"
  | "live"
  | "contact"
  | "kit"
  | "join";

export const PRESS_KIT_SECTION_KEYS: readonly PressKitSectionKey[] = [
  "glance",
  "bio",
  "listen",
  "press",
  "photos",
  "live",
  "contact",
  "kit",
  "join",
];

export const DEFAULT_SECTION_ORDER: readonly PressKitSectionKey[] = [
  "glance",
  "bio",
  "listen",
  "press",
  "photos",
  "live",
  "contact",
  "kit",
];

export interface PressKitSocials {
  instagram: string | null;
  twitter: string | null;
  facebook: string | null;
  spotify: string | null;
  apple_music: string | null;
  /** Added after the first five; every existing profile reads null here. */
  tiktok: string | null;
  youtube: string | null;
}

export interface PressKitArtist {
  name: string;
  slug: string;
  eyebrow: string | null;
  bio: string | null;
  cover_image_url: string | null;
  avatar_url: string | null;
  socials: PressKitSocials;
}

export interface PressKitFacts {
  genre: string | null;
  based_in: string | null;
  for_fans_of: string | null;
}

export interface PressKitContacts {
  bookings: string | null;
  management: string | null;
  press: string | null;
}

export interface PressKitQuote {
  quote: string;
  source: string | null;
  year: string | null;
}

export interface PressKitPlacement {
  label: string;
}

export interface PressKitConfig {
  theme: PressKitTheme;
  headline_font: PressKitHeadlineFont;
  facts: PressKitFacts;
  contacts: PressKitContacts;
  quotes: PressKitQuote[];
  placements: PressKitPlacement[];
  section_order: PressKitSectionKey[];
  hidden_sections: PressKitSectionKey[];
}

export interface PressKitPhoto {
  id: number;
  url: string;
}

export interface PressKitSpotlight {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
}

export interface PressKitFeaturedRelease {
  id: number;
  title: string;
  cover: string | null;
  released_on: string | null;
  type: string | null;
}

export interface PressKitOtherRelease {
  id: number;
  title: string;
  cover: string | null;
  year: string | null;
}

export interface PressKitReleases {
  featured: PressKitFeaturedRelease | null;
  others: PressKitOtherRelease[];
}

export interface PublicPressKit {
  artist: PressKitArtist;
  kit: PressKitConfig;
  photos: PressKitPhoto[];
  spotlights: PressKitSpotlight[];
  releases: PressKitReleases;
  cosign: PublicCoSign;
}

export interface PressKitTrack {
  title: string;
  duration: string | null;
}

export interface PressKitReleaseLinks {
  spotify: string | null;
  apple_music: string | null;
  youtube_music: string | null;
}

export interface PublicPressKitRelease {
  id: number;
  title: string;
  cover: string | null;
  credits: string | null;
  released_on: string | null;
  type: string | null;
  /**
   * The release's own smart link. Replaces the UPC/ISRC that used to sit here: those are
   * distribution plumbing that no promoter or journalist has a use for, while this is the
   * one URL a reader actually wants.
   */
  release_link: string | null;
  tracks: PressKitTrack[];
  links: PressKitReleaseLinks;
  preview_url: string | null;
}

type Json = Record<string, unknown>;

const isObj = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Trimmed non-empty string, else null. */
function str(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function obj(v: unknown): Json {
  return isObj(v) ? v : {};
}

/** Only absolute http(s) URLs are rendered — a stray relative path or `javascript:` is dropped. */
function url(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : null;
}

function theme(v: unknown): PressKitTheme {
  const s = str(v)?.toLowerCase();
  const allowed: PressKitTheme[] = [
    "blaze",
    "midnight",
    "violet",
    "emerald",
    "gold",
    "mono",
  ];
  return allowed.find((t) => t === s) ?? "blaze";
}

function headlineFont(v: unknown): PressKitHeadlineFont {
  const s = str(v)?.toLowerCase();
  return s === "serif" || s === "body" ? s : "heading";
}

function sectionKeys(v: unknown): PressKitSectionKey[] {
  const out: PressKitSectionKey[] = [];
  for (const raw of arr(v)) {
    const s = str(raw)?.toLowerCase() as PressKitSectionKey | undefined;
    if (s && PRESS_KIT_SECTION_KEYS.includes(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

function normaliseArtist(v: unknown): PressKitArtist | null {
  const a = obj(v);
  const name = str(a.name);
  const slug = str(a.slug);
  // A kit with no artist name is not renderable — treat it as not found.
  if (!name || !slug) return null;
  const s = obj(a.socials);
  return {
    name,
    slug,
    eyebrow: str(a.eyebrow),
    bio: str(a.bio),
    cover_image_url: url(a.cover_image_url),
    avatar_url: url(a.avatar_url),
    socials: {
      instagram: url(s.instagram),
      twitter: url(s.twitter),
      facebook: url(s.facebook),
      spotify: url(s.spotify),
      apple_music: url(s.apple_music),
      // Same `url()` gate as the rest: an unset column, an empty string and a
      // non-http value all land on null, so a caller can key an icon off truthiness.
      tiktok: url(s.tiktok),
      youtube: url(s.youtube),
    },
  };
}

function normaliseConfig(v: unknown): PressKitConfig {
  const k = obj(v);
  const facts = obj(k.facts);
  const contacts = obj(k.contacts);

  const quotes: PressKitQuote[] = arr(k.quotes).flatMap((raw) => {
    const q = obj(raw);
    const quote = str(q.quote);
    if (!quote) return [];
    return [{ quote, source: str(q.source), year: str(q.year) }];
  });

  const placements: PressKitPlacement[] = arr(k.placements).flatMap((raw) => {
    const label = str(isObj(raw) ? raw.label : raw);
    return label ? [{ label }] : [];
  });

  return {
    theme: theme(k.theme),
    headline_font: headlineFont(k.headline_font),
    facts: {
      genre: str(facts.genre),
      based_in: str(facts.based_in),
      for_fans_of: str(facts.for_fans_of),
    },
    contacts: {
      bookings: str(contacts.bookings),
      management: str(contacts.management),
      press: str(contacts.press),
    },
    quotes,
    placements,
    section_order: sectionKeys(k.section_order),
    hidden_sections: sectionKeys(k.hidden_sections),
  };
}

function normalisePressKit(raw: unknown): PublicPressKit | null {
  const root = obj(raw);
  const artist = normaliseArtist(root.artist);
  if (!artist) return null;

  const photos: PressKitPhoto[] = arr(root.photos).flatMap((p, i) => {
    const o = obj(p);
    const u = url(o.url);
    return u ? [{ id: num(o.id) ?? i, url: u }] : [];
  });

  const spotlights: PressKitSpotlight[] = arr(root.spotlights).flatMap((s, i) => {
    const o = obj(s);
    const u = url(o.url);
    return u
      ? [
          {
            id: num(o.id) ?? i,
            url: u,
            title: str(o.title),
            description: str(o.description),
          },
        ]
      : [];
  });

  const rel = obj(root.releases);
  const f = obj(rel.featured);
  const fId = num(f.id);
  const fTitle = str(f.title);
  const featured: PressKitFeaturedRelease | null =
    fId !== null && fTitle
      ? {
          id: fId,
          title: fTitle,
          cover: url(f.cover),
          released_on: str(f.released_on),
          type: str(f.type),
        }
      : null;

  const others: PressKitOtherRelease[] = arr(rel.others).flatMap((raw2) => {
    const o = obj(raw2);
    const id = num(o.id);
    const title = str(o.title);
    if (id === null || !title) return [];
    return [{ id, title, cover: url(o.cover), year: str(o.year) }];
  });

  return {
    artist,
    kit: normaliseConfig(root.kit),
    photos,
    spotlights,
    releases: { featured, others },
    cosign: normalisePublicCoSign(root),
  };
}

function normaliseRelease(raw: unknown): PublicPressKitRelease | null {
  const r = obj(raw);
  const id = num(r.id);
  const title = str(r.title);
  if (id === null || !title) return null;

  const links = obj(r.links);
  const tracks: PressKitTrack[] = arr(r.tracks).flatMap((t) => {
    const o = obj(t);
    const tt = str(o.title);
    if (!tt) return [];
    return [{ title: tt, duration: str(o.duration) }];
  });

  return {
    id,
    title,
    cover: url(r.cover),
    credits: str(r.credits),
    released_on: str(r.released_on),
    type: str(r.type),
    release_link: url(r.release_link),
    tracks,
    links: {
      spotify: url(links.spotify),
      apple_music: url(links.apple_music),
      youtube_music: url(links.youtube_music),
    },
    preview_url: url(r.preview_url),
  };
}

/* ─── Fetch ─────────────────────────────────────────────────────────────────── */

/** The API caches these 60s; match it so a viral link does not hammer Laravel. */
const REVALIDATE_SECONDS = 60;

async function getJson(path: string): Promise<unknown | null> {
  if (!BASE_URL) return null;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    // 404 = unknown slug OR unpublished kit. The API deliberately never 403s,
    // so there is nothing to distinguish here: both are "no such page".
    if (!res.ok) return null;
    const json: unknown = await res.json().catch(() => null);
    if (!isObj(json)) return null;
    // Laravel resources sometimes wrap in { data: … }; core.ts unwraps the same way.
    return "data" in json && isObj(json.data) ? json.data : json;
  } catch {
    // Backend unreachable / not deployed yet — the page shows not-found, not a crash.
    return null;
  }
}

/** Slug segment is user-controlled; keep it to the shape the backend generates. */
function safeSlug(slug: string): string | null {
  const s = slug.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/.test(s) ? s : null;
}

export async function getPublicPressKit(
  slug: string
): Promise<PublicPressKit | null> {
  const s = safeSlug(slug);
  if (!s) return null;
  return normalisePressKit(await getJson(`/public/press-kits/${s}`));
}

export async function getPublicPressKitRelease(
  slug: string,
  uploadId: string | number
): Promise<PublicPressKitRelease | null> {
  const s = safeSlug(slug);
  const id = num(uploadId);
  if (!s || id === null || id <= 0) return null;
  return normaliseRelease(await getJson(`/public/press-kits/${s}/releases/${id}`));
}
