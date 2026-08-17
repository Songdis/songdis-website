import { request, type ApiResponse } from "./core";

export const PRESS_KIT_THEMES = [
  "blaze",
  "midnight",
  "violet",
  "emerald",
  "gold",
  "mono",
] as const;

export type PressKitTheme = (typeof PRESS_KIT_THEMES)[number];

export const DEFAULT_THEME: PressKitTheme = "blaze";

export const HEADLINE_FONTS = ["heading", "serif", "body"] as const;

export type HeadlineFont = (typeof HEADLINE_FONTS)[number];

export const DEFAULT_HEADLINE_FONT: HeadlineFont = "heading";


export const SECTION_KEYS = [
  "glance",
  "bio",
  "listen",
  "press",
  "photos",
  "live",
  "contact",
  "kit",
  "join",
  "cosign",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && (SECTION_KEYS as readonly string[]).includes(value);
}

/** `press_kit_media.type`. */
export type MediaType = "photo" | "spotlight";

/* ─── Slug rules (PK2, PK3) ───────────────────────────────────── */

export const SLUG_MIN_LENGTH = 2;
export const SLUG_MAX_LENGTH = 40;

/**
 * Refused at generation time, not at routing time (PK3). Kept client-side as well
 * so the editor can say "reserved" the moment it is typed rather than after a round
 * trip — the server stays the authority, and its `errors.slug` is still rendered.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www", "api", "admin", "app", "backstage", "dashboard", "songdis", "ayo", "splitr",
  "amplify", "quickdrop", "quick-drop", "migrations", "analytics", "mail", "email",
  "smtp", "ftp", "cdn", "assets", "static", "media", "img", "images", "files",
  "download", "downloads", "s3", "storage", "ns", "ns1", "ns2", "dns", "mx", "vpn",
  "proxy", "gateway", "dev", "development", "staging", "stage", "test", "testing",
  "qa", "sandbox", "preview", "demo", "local", "localhost", "beta", "alpha", "help",
  "support", "status", "blog", "news", "press", "about", "legal", "terms", "privacy",
  "security", "billing", "pay", "payment", "payments", "account", "accounts", "auth",
  "login", "signin", "signup", "register", "link", "links", "go", "k", "kit",
  "presskit", "epk", "apk", "cosign", "co-sign",
]);

/**
 * What is wrong with a slug, as a distinct kind rather than one blob of prose.
 *
 * "Taken" and "reserved" are the two the artist will actually hit and they need
 * different next steps — one means "pick another name", the other means "that word
 * belongs to the platform". Collapsing them into a single "invalid slug" is the
 * failure this type exists to prevent.
 */
export type SlugProblem =
  | "empty"
  | "too_short"
  | "too_long"
  | "charset"
  | "numeric"
  | "reserved"
  | "taken"
  | "unknown";

export interface SlugVerdict {
  problem: SlugProblem | null;
  /** One sentence, addressed to the artist. */
  message: string | null;
}

/**
 * Combining diacritical marks (U+0300–U+036F), built from a string so the source file
 * stays ASCII — a literal character class of invisible marks is the kind of thing an
 * editor silently mangles.
 */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Lowercase, hyphenated, trimmed — the client-side twin of `Str::slug()`. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // Strip the combining marks NFKD just split off, so "Zlátan" becomes "zlatan"
    // rather than "zl-tan".
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Everything the client can know without asking the server. Uniqueness is NOT
 * checked here — only the server can answer that — so a clean verdict means
 * "worth sending", never "accepted".
 */
export function inspectSlug(raw: string): SlugVerdict {
  const value = raw.trim().toLowerCase();

  if (!value) {
    return { problem: "empty", message: "Type the address you want." };
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return {
      problem: "charset",
      message: "Use lowercase letters, numbers and hyphens only — no spaces or symbols.",
    };
  }
  if (value.startsWith("-") || value.endsWith("-")) {
    return { problem: "charset", message: "It cannot start or end with a hyphen." };
  }
  if (value.length < SLUG_MIN_LENGTH) {
    return { problem: "too_short", message: `At least ${SLUG_MIN_LENGTH} characters.` };
  }
  if (value.length > SLUG_MAX_LENGTH) {
    return { problem: "too_long", message: `At most ${SLUG_MAX_LENGTH} characters.` };
  }
  if (/^[0-9]+$/.test(value)) {
    return {
      problem: "numeric",
      message: "An all-number address reads as an account number. Add some letters.",
    };
  }
  if (RESERVED_SLUGS.has(value)) {
    return {
      problem: "reserved",
      message: `“${value}” is reserved by Songdis and cannot be used. Try adding a word — “${value}-music”, for example.`,
    };
  }

  return { problem: null, message: null };
}

/**
 * Read the server's rejection back into a kind.
 *
 * The contract promises "a clear error naming what is wrong" but not a machine
 * code, so this matches on the wording. It is deliberately a fallback: the
 * server's own sentence is what gets rendered, and this only decides which
 * *shape* of help to render next to it.
 */
export function classifySlugError(
  error: string | null,
  errors?: Record<string, string[]> | null
): SlugProblem {
  const text = [error ?? "", ...Object.values(errors ?? {}).flat()].join(" ").toLowerCase();

  if (!text) return "unknown";
  if (text.includes("reserved")) return "reserved";
  if (
    text.includes("taken") ||
    text.includes("already") ||
    text.includes("unique") ||
    text.includes("in use")
  ) {
    return "taken";
  }
  if (text.includes("numeric") || text.includes("number")) return "numeric";
  if (text.includes("character") || text.includes("format") || text.includes("letters")) {
    return "charset";
  }
  return "unknown";
}

/* ─── Record shapes ───────────────────────────────────────────── */

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
  source: string;
  year: string;
}

export interface PressKitPlacement {
  label: string;
}

export interface PressKitMediaItem {
  id: number;
  type: MediaType;
  url: string;
  title: string | null;
  description: string | null;
  position: number;
}

/** The `press_kits` row, as the editor holds it. */
export interface PressKitRecord {
  id: number | null;
  published_at: string | null;
  theme: PressKitTheme;
  headline_font: HeadlineFont;
  eyebrow: string | null;
  cover_image_url: string | null;
  facts: PressKitFacts;
  contacts: PressKitContacts;
  quotes: PressKitQuote[];
  placements: PressKitPlacement[];
  section_order: SectionKey[];
  hidden_sections: SectionKey[];
}

/** The owning profile, as much of it as the editor needs to show. */
export interface PressKitArtist {
  id: number | null;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export interface PressKitReleaseRef {
  id: number;
  title: string;
  cover: string | null;
  year: string | null;
}

/** Everything `GET /press-kit/{profileId}` gives the editor, normalised. */
export interface PressKitEditorState {
  artist: PressKitArtist;
  kit: PressKitRecord;
  photos: PressKitMediaItem[];
  spotlights: PressKitMediaItem[];
  /** Read-only here — the Listen section is driven by live releases, not edited. */
  releases: PressKitReleaseRef[];
}

/** The PUT body. Every field optional: a partial save must not blank the rest. */
export interface PressKitUpdate {
  theme?: PressKitTheme;
  headline_font?: HeadlineFont;
  eyebrow?: string | null;
  facts?: PressKitFacts;
  contacts?: PressKitContacts;
  quotes?: PressKitQuote[];
  placements?: PressKitPlacement[];
  section_order?: SectionKey[];
  hidden_sections?: SectionKey[];
  /**
   * GAP — not in the contract's PUT list.
   *
   * `bio` lives on the profile, and `cover_image_url` is a `press_kits` column with no
   * documented write path at all. Both are editable in the mock's `.editing` mode, so
   * they are sent here. If the backend ignores unknown keys they will silently not
   * save, which is why the editor reports the saved values back from the response
   * rather than trusting the local draft.
   */
  bio?: string | null;
  cover_image_url?: string | null;
}

/* ─── Defaults & normalisation ────────────────────────────────── */

export function emptyFacts(): PressKitFacts {
  return { genre: null, based_in: null, for_fans_of: null };
}

export function emptyContacts(): PressKitContacts {
  return { bookings: null, management: null, press: null };
}

export function defaultSectionOrder(): SectionKey[] {
  return [...SECTION_KEYS];
}

/**
 * A section order is only allowed when co-sign never sits above the bio — the tip jar
 * must never lead a press kit. Shared by the editor's move clamp and the move-button
 * disabled states, so "blocked" is announced (a greyed-out arrow) and enforced in the
 * same place.
 */
export function sectionOrderAllows(order: readonly SectionKey[]): boolean {
  const bio = order.indexOf("bio");
  const cosign = order.indexOf("cosign");
  // Either key absent: nothing to violate. Present keys must keep the bio first.
  return bio < 0 || cosign < 0 || bio < cosign;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Trimmed string, or null. Empty strings become null so the API sees "unset". */
function str(value: unknown): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * jsonb columns come back as objects from Laravel, but several endpoints on this
 * account return JSON as a *string* (see `safeParse` in useMusic.ts). Handle both
 * rather than betting on one.
 */
function json<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed === null ? fallback : (parsed as T);
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/**
 * Facts for the "At a glance" block, SEEDED from the artist's profile.
 *
 * An artist who already told us where they are based should not meet a blank field and be
 * asked again — they should find their own detail sitting there and change it only if the
 * press-kit framing calls for something different.
 *
 * The kit's own value always wins once it exists, including when the artist deliberately
 * clears it: `str()` returns null for an empty string, so a cleared field falls back to the
 * profile, which is the behaviour we want for a field they have never touched. Once they
 * save something, that is what they see.
 */
function normaliseFacts(raw: unknown, profile?: ProfileSeed): PressKitFacts {
  const obj = asRecord(json(raw, {}));

  // Spotify hands back lowercase genre tags ("afropop", "street hop"). Title-case the
  // first one so a suggestion reads like something an artist would have typed themselves.
  const seedGenre = (() => {
    const first = profile?.genres?.find((g) => g.trim() !== "");
    if (!first) return null;
    return first
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  })();

  return {
    genre: str(obj.genre) ?? seedGenre,
    based_in: str(obj.based_in) ?? str(profile?.location),
    for_fans_of: str(obj.for_fans_of),
  };
}

/** The profile fields the editor borrows to prefill an empty kit. */
export type ProfileSeed = { location?: string | null; genres?: string[] };

function normaliseContacts(raw: unknown): PressKitContacts {
  const obj = asRecord(json(raw, {}));
  return {
    bookings: str(obj.bookings),
    management: str(obj.management),
    press: str(obj.press),
  };
}

function normaliseQuotes(raw: unknown): PressKitQuote[] {
  const list = json<unknown[]>(raw, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      const obj = asRecord(entry);
      return {
        quote: str(obj.quote) ?? "",
        source: str(obj.source) ?? "",
        year: str(obj.year) ?? "",
      };
    })
    .filter((q) => q.quote || q.source || q.year);
}

function normalisePlacements(raw: unknown): PressKitPlacement[] {
  const list = json<unknown[]>(raw, []);
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      // Tolerate a bare string as well as {label} — a hand-seeded row is likely to
      // be the former, and dropping it silently would look like data loss.
      if (typeof entry === "string") return { label: entry.trim() };
      return { label: str(asRecord(entry).label) ?? "" };
    })
    .filter((p) => p.label !== "");
}

/**
 * A section list that is always a valid permutation: known keys only, no
 * duplicates, and every missing key appended in canonical order. A short or
 * unfamiliar list from the server therefore widens rather than truncating — an
 * order that silently dropped `photos` would make the section vanish from the
 * editor and from the page.
 */
function normaliseSectionOrder(raw: unknown): SectionKey[] {
  const list = json<unknown[]>(raw, []);
  const seen = new Set<SectionKey>();
  const out: SectionKey[] = [];

  if (Array.isArray(list)) {
    for (const entry of list) {
      if (isSectionKey(entry) && !seen.has(entry)) {
        seen.add(entry);
        out.push(entry);
      }
    }
  }
  for (const key of SECTION_KEYS) {
    if (!seen.has(key)) out.push(key);
  }
  return out;
}

function normaliseHidden(raw: unknown): SectionKey[] {
  const list = json<unknown[]>(raw, []);
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(list.filter(isSectionKey)));
}

function normaliseTheme(raw: unknown): PressKitTheme {
  return typeof raw === "string" && (PRESS_KIT_THEMES as readonly string[]).includes(raw)
    ? (raw as PressKitTheme)
    : DEFAULT_THEME;
}

function normaliseFont(raw: unknown): HeadlineFont {
  return typeof raw === "string" && (HEADLINE_FONTS as readonly string[]).includes(raw)
    ? (raw as HeadlineFont)
    : DEFAULT_HEADLINE_FONT;
}

function normaliseMedia(raw: unknown, fallbackType: MediaType): PressKitMediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, i) => {
      const obj = asRecord(entry);
      const type = obj.type === "spotlight" || obj.type === "photo" ? obj.type : fallbackType;
      return {
        id: Number(obj.id ?? -1 - i),
        type: type as MediaType,
        url: str(obj.url) ?? str(obj.image_url) ?? "",
        title: str(obj.title),
        description: str(obj.description),
        position: Number.isFinite(Number(obj.position)) ? Number(obj.position) : i,
      };
    })
    .filter((m) => m.url !== "")
    .sort((a, b) => a.position - b.position || a.id - b.id);
}

function normaliseReleases(raw: unknown): PressKitReleaseRef[] {
  const box = asRecord(raw);
  const rows: unknown[] = [];
  if (box.featured) rows.push(box.featured);
  if (Array.isArray(box.others)) rows.push(...box.others);
  if (Array.isArray(raw)) rows.push(...(raw as unknown[]));

  return rows
    .map((entry) => {
      const obj = asRecord(entry);
      const released = str(obj.released_on);
      return {
        id: Number(obj.id ?? 0),
        title: str(obj.title) ?? str(obj.release_title) ?? "Untitled",
        cover: str(obj.cover) ?? str(obj.album_art_url),
        year: str(obj.year) ?? (released ? released.slice(0, 4) : null),
      };
    })
    .filter((r) => r.id > 0);
}

/**
 * Fold whatever the endpoint returned into `PressKitEditorState`.
 *
 * Accepts the nested public-ish shape and a flat one, because the dashboard GET
 * shape is not in the contract. Anything missing gets a real default, so the editor
 * renders an empty-but-usable kit rather than throwing — which is also exactly what
 * a profile with no kit row yet should look like.
 */
export function normalisePressKit(raw: unknown, profileId: number): PressKitEditorState {
  const root = asRecord(raw);
  // core.ts already unwrapped one `data`; some endpoints on this account nest twice.
  const body = asRecord(root.data) && Object.keys(asRecord(root.data)).length > 0
    ? { ...root, ...asRecord(root.data) }
    : root;

  const kitBox = Object.keys(asRecord(body.kit)).length > 0 ? asRecord(body.kit) : body;
  const artistBox = Object.keys(asRecord(body.artist)).length > 0
    ? asRecord(body.artist)
    : Object.keys(asRecord(body.profile)).length > 0
      ? asRecord(body.profile)
      : body;

  // Media may arrive split (photos/spotlights) or as one `media` array carrying `type`.
  const mediaAll = Array.isArray(body.media) ? (body.media as unknown[]) : null;
  const photos = mediaAll
    ? normaliseMedia(mediaAll.filter((m) => asRecord(m).type !== "spotlight"), "photo")
    : normaliseMedia(body.photos, "photo");
  const spotlights = mediaAll
    ? normaliseMedia(mediaAll.filter((m) => asRecord(m).type === "spotlight"), "spotlight")
    : normaliseMedia(body.spotlights, "spotlight");

  return {
    artist: {
      id: Number(artistBox.id ?? profileId) || profileId,
      name: str(artistBox.name) ?? str(artistBox.stage_name) ?? str(artistBox.display_name) ?? "",
      slug: str(artistBox.slug),
      bio: str(artistBox.bio) ?? str(kitBox.bio),
      avatar_url: str(artistBox.avatar_url) ?? str(artistBox.image_url),
    },
    kit: {
      id: Number.isFinite(Number(kitBox.id)) && Number(kitBox.id) > 0 ? Number(kitBox.id) : null,
      published_at: str(kitBox.published_at) ?? str(body.published_at),
      theme: normaliseTheme(kitBox.theme),
      headline_font: normaliseFont(kitBox.headline_font),
      eyebrow: str(kitBox.eyebrow) ?? str(artistBox.eyebrow),
      cover_image_url: str(kitBox.cover_image_url) ?? str(artistBox.cover_image_url),
      facts: normaliseFacts(kitBox.facts, {
        location: str(artistBox.location),
        genres: Array.isArray(artistBox.genres) ? artistBox.genres.map(String) : [],
      }),
      contacts: normaliseContacts(kitBox.contacts),
      quotes: normaliseQuotes(kitBox.quotes),
      placements: normalisePlacements(kitBox.placements),
      section_order: normaliseSectionOrder(kitBox.section_order),
      hidden_sections: normaliseHidden(kitBox.hidden_sections),
    },
    photos,
    spotlights,
    releases: normaliseReleases(body.releases),
  };
}

/** An empty, usable kit — what the editor shows before the API answers. */
export function blankPressKit(profileId: number, name = ""): PressKitEditorState {
  return {
    artist: { id: profileId, name, slug: null, bio: null, avatar_url: null },
    kit: {
      id: null,
      published_at: null,
      theme: DEFAULT_THEME,
      headline_font: DEFAULT_HEADLINE_FONT,
      eyebrow: null,
      cover_image_url: null,
      facts: emptyFacts(),
      contacts: emptyContacts(),
      quotes: [],
      placements: [],
      section_order: defaultSectionOrder(),
      hidden_sections: [],
    },
    photos: [],
    spotlights: [],
    releases: [],
  };
}

/* ─── Public address ──────────────────────────────────────────── */

/**
 * `songdis.com/k/<slug>` is canonical and ships now (PK4). `<slug>.songdis.com`
 * rewrites to it later — a DNS/cert switch, not a page change — so nothing here
 * should hard-code the subdomain form.
 */
export function publicKitOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://songdis.com";
}

export function publicKitUrl(slug: string | null): string | null {
  if (!slug) return null;
  return `${publicKitOrigin()}/k/${slug}`;
}

/** The same address without the scheme — what the mock prints in the footer. */
export function publicKitLabel(slug: string | null): string | null {
  const url = publicKitUrl(slug);
  return url ? url.replace(/^https?:\/\//, "") : null;
}

/* ─── API functions ───────────────────────────────────────────── */

const ROOT = "/press-kit";

/** The kit for editing. The server creates an empty one if the profile has none. */
export async function getPressKit(profileId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/${profileId}`, { method: "GET" }, true);
}

export async function updatePressKit(
  profileId: number,
  payload: PressKitUpdate
): Promise<ApiResponse<unknown>> {
  return request<unknown>(
    `${ROOT}/${profileId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    true
  );
}

export async function publishPressKit(profileId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/${profileId}/publish`, { method: "POST" }, true);
}

export async function unpublishPressKit(profileId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/${profileId}/unpublish`, { method: "POST" }, true);
}

export interface MediaUpload {
  type: MediaType;
  file: File;
  /** Spotlight only. */
  title?: string | null;
  /** Spotlight only. */
  description?: string | null;
  position?: number;
}

/**
 * Upload one photo or spotlight.
 *
 * FormData, so `request()` deliberately omits the JSON content-type and lets the
 * browser set the multipart boundary — see core.ts.
 */
export async function uploadPressKitMedia(
  profileId: number,
  upload: MediaUpload
): Promise<ApiResponse<unknown>> {
  const form = new FormData();
  form.append("type", upload.type);
  // MUST be `image`, not `file`. PressKitController::storeMedia branches on
  // $request->hasFile('image'): under any other name the file is invisible to it, the
  // rules fall through to the `url` branch, and an upload with an attached image is
  // rejected with "The url field is required." The cover endpoint below already used the
  // right name, which is why covers worked and photos did not.
  form.append("image", upload.file);
  if (upload.title) form.append("title", upload.title);
  if (upload.description) form.append("description", upload.description);
  if (upload.position !== undefined) form.append("position", String(upload.position));

  return request<unknown>(`${ROOT}/${profileId}/media`, { method: "POST", body: form }, true);
}

export async function deletePressKitMedia(mediaId: number): Promise<ApiResponse<unknown>> {
  return request<unknown>(`${ROOT}/media/${mediaId}`, { method: "DELETE" }, true);
}

/**
 * GAP — invented path. The contract has no cover upload: `cover_image_url` is a
 * column with no write route, and the media endpoint's `type` is enumerated
 * `photo | spotlight`, so a cover cannot legitimately go through it.
 *
 * `POST /press-kit/{profileId}/cover` (FormData `image`) is the shape assumed here.
 * It is called from exactly one place and its failure is reported as "cover replace
 * isn't available yet" rather than as a broken editor — so if the backend lands on a
 * different route, only this function changes.
 */
export async function uploadPressKitCover(
  profileId: number,
  file: File
): Promise<ApiResponse<unknown>> {
  const form = new FormData();
  form.append("image", file);
  return request<unknown>(`${ROOT}/${profileId}/cover`, { method: "POST", body: form }, true);
}

/**
 * Change the shareable address.
 *
 * Field name `slug`, matching the column. The server validates reserved + unique and
 * returns "a clear error naming what is wrong"; the caller renders `errors.slug`
 * verbatim and uses `classifySlugError()` only to choose what help to show beside it.
 */
export async function updatePressKitSlug(
  profileId: number,
  slug: string
): Promise<ApiResponse<unknown>> {
  return request<unknown>(
    `${ROOT}/${profileId}/slug`,
    { method: "PUT", body: JSON.stringify({ slug }) },
    true
  );
}

/** Read a slug back out of whatever the slug endpoint returned. */
export function readSlugFromResponse(raw: unknown): string | null {
  const root = asRecord(raw);
  const nested = asRecord(root.data);
  const artist = asRecord(root.artist);
  const profile = asRecord(root.profile);
  return (
    str(root.slug) ?? str(nested.slug) ?? str(artist.slug) ?? str(profile.slug) ?? null
  );
}

/** Read a media URL back out of whatever the upload endpoint returned. */
export function readMediaUrlFromResponse(raw: unknown): string | null {
  const root = asRecord(raw);
  const nested = asRecord(root.data);
  const media = asRecord(root.media);
  return (
    str(root.url) ??
    str(root.cover_image_url) ??
    str(nested.url) ??
    str(nested.cover_image_url) ??
    str(media.url) ??
    str(root.file_url) ??
    str(nested.file_url) ??
    null
  );
}
