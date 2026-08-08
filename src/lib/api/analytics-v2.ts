/**
 * lib/api/analytics-v2.ts
 *
 * Typed client for the Analytics v2 read API, built against
 * `docs/analytics-openapi.yaml` — not against guesses.
 *
 * Endpoint map (BASE_URL already ends in /api, so paths start /v2/...):
 *   GET /v2/analytics/artists                          — switchable profiles
 *   GET /v2/analytics/artists/{artist}/summary         — headline totals
 *   GET /v2/analytics/artists/{artist}/timeseries      — bucketed series
 *   GET /v2/analytics/artists/{artist}/breakdown       — one dimension
 *   GET /v2/analytics/artists/{artist}/tracks          — paged track list
 *   GET /v2/analytics/artists/{artist}/tracks/{track}  — track detail
 *   GET /v2/analytics/artists/{artist}/hourly          — 24 hour-of-day buckets
 *   GET /v2/analytics/artists/{artist}/engagement      — rates, skips, saves
 *   GET /v2/analytics/artists/{artist}/coverage        — dimension x platform matrix
 *
 * Every request is scoped to an artist_profile_id. Pooled ("all profiles") mode
 * sends the canonical-sorted id list in `artist_profile_ids` — canonical order
 * matters because the server's response-cache key is built from it (REDESIGN
 * §11.1), so `a,b,c` and `a,c,b` must hit the same key.
 */

import { request, type ApiResponse } from "./core";

/* ─── Feeds & dimensions ──────────────────────────────────────── */

/** Feed keys, exactly as the API names them. */
export const PLATFORMS = [
  "spotify_event",
  "spotify_aggregated",
  "apple",
  "amazon",
  "deezer",
  "pandora",
  "youtube_art_tracks",
] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<string, string> = {
  spotify_event: "Spotify",
  spotify_aggregated: "Spotify (aggregated)",
  apple: "Apple Music",
  amazon: "Amazon Music",
  deezer: "Deezer",
  pandora: "Pandora",
  youtube_art_tracks: "YouTube Art Tracks",
};

export function platformLabel(key: string): string {
  return PLATFORM_LABELS[key] ?? key.replace(/_/g, " ");
}

/**
 * In-grain dimensions live in the fact grain, so they are exact and
 * AND-combinable as filters (REDESIGN §8.2).
 */
export const IN_GRAIN_DIMENSIONS = [
  "country",
  "source",
  "tier",
  "category",
  "container",
] as const;

export type InGrainDimension = (typeof IN_GRAIN_DIMENSIONS)[number];

/**
 * Outside-grain dimensions are folded per-dimension at ingest, so they are
 * groupable ONLY — never an AND-filter, and never combined with an in-grain
 * filter or a track scope (IMPLEMENTATION §D.2).
 */
export const OUTSIDE_GRAIN_DIMENSIONS = [
  "device_family",
  "device_model",
  "operating_system",
  "membership_access",
  "membership_mode",
  "membership_type",
  "product",
  "gender",
  "age_bucket",
  "track_quality",
  "asset_type",
  "end_reason",
  "play_type",
] as const;

export type OutsideGrainDimension = (typeof OUTSIDE_GRAIN_DIMENSIONS)[number];

/** Every dimension the breakdown endpoint accepts. */
export type Dimension = "platform" | InGrainDimension | OutsideGrainDimension;

export const DIMENSION_LABELS: Record<string, string> = {
  platform: "Platform",
  country: "Country",
  source: "Source",
  tier: "Tier",
  category: "Category",
  container: "Container",
  device_family: "Device",
  device_model: "Device model",
  operating_system: "Operating system",
  membership_access: "Membership access",
  membership_mode: "Membership mode",
  membership_type: "Membership type",
  product: "Product",
  gender: "Gender",
  age_bucket: "Age",
  track_quality: "Track quality",
  asset_type: "Asset type",
  end_reason: "End reason",
  play_type: "Play type",
};

export function dimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key.replace(/_/g, " ");
}

export function isOutsideGrain(dimension: string): dimension is OutsideGrainDimension {
  return (OUTSIDE_GRAIN_DIMENSIONS as readonly string[]).includes(dimension);
}

export function isInGrain(dimension: string): dimension is InGrainDimension {
  return (IN_GRAIN_DIMENSIONS as readonly string[]).includes(dimension);
}

export type Granularity = "day" | "week" | "month" | "year";

export const METRICS = [
  "streams",
  "tracks_streamed",
  "countries",
  "completed_rate",
  "avg_duration",
  "offline",
  "shuffle_rate",
  "repeat_rate",
  "discovery_rate",
  "cached_rate",
  "skips",
  "saves",
] as const;

export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
  streams: "Streams",
  tracks_streamed: "Tracks streamed",
  countries: "Countries",
  completed_rate: "Completion rate",
  avg_duration: "Avg duration",
  offline: "Offline streams",
  shuffle_rate: "Shuffle rate",
  repeat_rate: "Repeat rate",
  discovery_rate: "Discovery rate",
  cached_rate: "Cached rate",
  skips: "Skips",
  saves: "Saves",
};

/** Metrics expressed as a 0..1 rate — formatted as a percentage, not a count. */
export const RATE_METRICS: ReadonlySet<string> = new Set([
  "completed_rate",
  "shuffle_rate",
  "repeat_rate",
  "discovery_rate",
  "cached_rate",
]);

export type TrackSort = "streams" | "title" | "completed_rate" | "tracks_streamed";
export type SortOrder = "asc" | "desc";

/* ─── Response types (from the OpenAPI schemas) ───────────────── */

export interface ProfileSummary {
  id: number;
  display_name: string | null;
  image_url: string | null;
  role: "owner" | "manager" | "viewer";
  granted_at: string;
}

/** One (dimension x platform) cell of the coverage matrix. */
export interface CoverageCell {
  available: boolean;
  counts_toward_totals: boolean;
  complete: boolean;
}

export interface CoverageDimension {
  key: string;
  label: string;
  platforms: Record<string, CoverageCell>;
}

export interface Coverage {
  dimensions: CoverageDimension[];
}

/** One artist's row on the label roster (L5). */
export interface RosterArtist {
  artist_profile_id: number;
  name: string | null;
  image_url: string | null;
  streams: number;
  /** Of the account total. Shares may sum to slightly under 1 — see `Roster`. */
  share: number;
  trend: Array<{ date: string; streams: number | null }>;
  top_platform: { key: string; label: string; streams: number } | null;
  coverage?: Coverage | null;
}

export interface Roster {
  /**
   * From the fact table across every granted profile — never the sum of `artists`.
   * A shortfall against that sum is honest, not an error.
   */
  totals: { streams: number };
  artists: RosterArtist[];
  coverage?: Coverage | null;
}

export interface EngagementMetrics {
  completed_rate: number | null;
  shuffle_rate: number | null;
  repeat_rate: number | null;
  discovery_rate: number | null;
  cached_rate: number | null;
  avg_duration_sec: number | null;
  offline_streams: number;
}

export interface Summary {
  range: { from: string; to: string; provisional: boolean };
  streams: { total: number; previous: number | null; delta_pct: number | null };
  by_platform: Array<{ platform: string; streams: number }>;
  tracks_streamed: number;
  countries: number;
  avg_streams_per_day: number;
  engagement: EngagementMetrics;
  last_rebuilt_at: string | null;
  coverage: Coverage;
  provisional: boolean;
  suppressed: string[];
}

export interface TimeseriesPoint {
  date: string;
  /** null where the cell was suppressed — never render this as zero. */
  value: number | null;
  /** Present only for metric=streams. */
  by_platform?: Record<string, number>;
  provisional: boolean;
}

export interface Timeseries {
  granularity: string;
  metric: string;
  points: TimeseriesPoint[];
  coverage: Coverage;
  provisional: boolean;
  suppressed: string[];
}

export interface BreakdownItem {
  key: string;
  label: string;
  /** null when suppressed by k-anonymity — render as suppressed, never as 0. */
  value: number | null;
  share: number | null;
  tracks: number;
  previous: number | null;
  delta_pct: number | null;
  suppressed: boolean;
}

export interface Breakdown {
  dimension: string;
  metric: string;
  /** Read from the headline rollup. Items may sum to LESS than this. */
  total: number;
  items: BreakdownItem[];
  last_rebuilt_at: string | null;
  coverage: Coverage;
  provisional: boolean;
  /** Keys of the cells nulled by k-anonymity. */
  suppressed: string[];
}

export interface TrackListItem {
  track_id: number;
  title: string | null;
  isrc: string | null;
  artists: string | null;
  streams: number;
  tracks_streamed: number;
  completed_rate: number | null;
  platforms: string[];
}

export interface TrackList {
  items: TrackListItem[];
  total: number;
  meta: { page: number; per_page: number; total: number };
  coverage: Coverage;
  provisional: boolean;
  suppressed: string[];
}

export interface TrackDetail {
  track: {
    track_id: number;
    title: string | null;
    isrc: string | null;
    release_name: string | null;
    artists: string | null;
  };
  summary: Summary;
  timeseries: Timeseries;
  platforms: Array<{ platform: string; streams: number }>;
}

export interface Hourly {
  platform: string;
  hours: Array<{ hour: number; streams: number }>;
  coverage: Coverage;
  provisional: boolean;
  suppressed: string[];
}

export interface Engagement {
  overall: EngagementMetrics;
  by_platform: Array<{ platform: string; engagement: EngagementMetrics }>;
  aggregated_feed: { platform: string; skip_count: number; saves_count: number };
  coverage: Coverage;
  provisional: boolean;
  suppressed: string[];
}

/* ─── Scope & filters ─────────────────────────────────────────── */

/**
 * Which profile(s) a request is scoped to.
 *
 * `pooledIds` non-empty = "All profiles" mode. The path still carries a single
 * artist id (the API requires it); the pool travels in `artist_profile_ids`.
 */
export interface AnalyticsScope {
  artistId: number;
  pooledIds?: number[];
}

/** Pooled scope over the given profiles, in canonical (ascending) order. */
export function pooledScope(ids: number[]): AnalyticsScope | null {
  const sorted = canonicalIds(ids);
  if (sorted.length === 0) return null;
  return { artistId: sorted[0], pooledIds: sorted };
}

/** Single-profile scope. */
export function singleScope(id: number): AnalyticsScope {
  return { artistId: id };
}

/** Deduped, ascending — the canonical order the server's cache key uses. */
export function canonicalIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

/** The filter contract shared by every endpoint (REDESIGN §8.2). */
export interface AnalyticsFilters {
  from?: string;
  to?: string;
  platform?: string[];
  country?: string[];
  source?: string[];
  tier?: string[];
  category?: string[];
  container?: string[];
  track_ids?: number[];
}

export interface SummaryParams extends AnalyticsFilters {
  compare?: boolean;
}

export interface TimeseriesParams extends AnalyticsFilters {
  granularity?: Granularity;
  metric?: Metric;
}

export interface BreakdownParams extends AnalyticsFilters {
  dimension: Dimension;
}

export interface TrackListParams extends AnalyticsFilters {
  search?: string;
  sort?: TrackSort;
  order?: SortOrder;
  page?: number;
  per_page?: number;
}

export interface TrackDetailParams extends AnalyticsFilters {
  dimension?: Dimension;
  metric?: Metric;
  granularity?: Granularity;
}

/* ─── Query builder ───────────────────────────────────────────── */

export type QueryValue = string | number | boolean | undefined | null | string[] | number[];

/**
 * The param bag scopedParams assembles.
 *
 * Public entry points are generic over `T extends object` rather than taking
 * this type directly: an interface (AnalyticsFilters, BreakdownParams, …) does
 * not satisfy `Record<string, unknown>` in TypeScript — only type aliases and
 * object literals get an implicit index signature — so a generic is what lets
 * the filter interfaces be passed straight through.
 */
export type QueryParams = Record<string, unknown>;

/**
 * Build a normalised query string.
 *
 * Keys are emitted in sorted order and array values sorted within a key, so the
 * same logical request always produces byte-identical output. That is what lets
 * the client cache key line up with the server's `sha1(normalised query)`
 * (REDESIGN §11.1) instead of drifting on argument order.
 *
 * Arrays use Laravel's repeated `key[]=` form, per §8.2.
 */
export function buildQuery<T extends object>(params: T): string {
  const qs = new URLSearchParams();
  const bag = params as QueryParams;

  for (const key of Object.keys(bag).sort()) {
    const value = bag[key];
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      const items = (value as unknown[])
        .filter((v) => v !== undefined && v !== null && v !== "")
        .map(String)
        .sort();
      for (const item of items) qs.append(`${key}[]`, item);
      continue;
    }

    if (typeof value === "boolean") {
      qs.set(key, value ? "1" : "0");
      continue;
    }

    qs.set(key, String(value));
  }

  const out = qs.toString();
  return out ? `?${out}` : "";
}

/** Filters + the pooled-scope param, as a flat param bag. */
function scopedParams(
  scope: AnalyticsScope,
  filters: AnalyticsFilters = {},
  extra: QueryParams = {}
): QueryParams {
  const params: QueryParams = {
    from: filters.from,
    to: filters.to,
    platform: filters.platform,
    country: filters.country,
    source: filters.source,
    tier: filters.tier,
    category: filters.category,
    container: filters.container,
    track_ids: filters.track_ids,
    ...extra,
  };

  // Pooling is a comma-separated list in canonical order — NOT a repeated key.
  if (scope.pooledIds && scope.pooledIds.length > 1) {
    params.artist_profile_ids = canonicalIds(scope.pooledIds).join(",");
  }

  return params;
}

/**
 * The scope segment of a cache key: a single id, or the canonical-sorted id
 * list. Mirrors the server's `{scope}` (REDESIGN §11.1).
 */
export function scopeKey(scope: AnalyticsScope): string {
  if (scope.pooledIds && scope.pooledIds.length > 1) {
    return canonicalIds(scope.pooledIds).join(",");
  }
  return String(scope.artistId);
}

/**
 * A client cache key aligned with the server's key structure:
 * `analytics:v2:{scope}:{endpoint}{normalised query}`.
 *
 * We keep the query readable rather than hashing it — the alignment that
 * matters is that identical logical requests normalise to one key.
 */
export function cacheKey<T extends object>(
  scope: AnalyticsScope,
  endpoint: string,
  params: T
): string {
  return `analytics:v2:${scopeKey(scope)}:${endpoint}${buildQuery(params)}`;
}

/* ─── Unsupported cross-tabs (pre-empt the 422) ───────────────── */

/**
 * The three combinations the API 422s (IMPLEMENTATION §D.2). Checking them
 * client-side lets the UI disable the control and explain why *before* a round
 * trip; the server remains the authority and its `errors` map is still shown.
 *
 * Returns a Laravel-shaped field-error map, or null when the combination is
 * legal. `platform[]` and the date range stay legal alongside an outside-grain
 * breakdown — the fold table carries feed_id and stream_date. `track_ids[]`
 * does not.
 */
export function validateBreakdown(
  dimension: Dimension,
  filters: AnalyticsFilters
): Record<string, string[]> | null {
  const activeInGrain = IN_GRAIN_DIMENSIONS.filter(
    (key) => (filters[key]?.length ?? 0) > 0
  );
  const hasTrackScope = (filters.track_ids?.length ?? 0) > 0;

  if (isOutsideGrain(dimension)) {
    // Case 2: outside-grain breakdown + any in-grain filter.
    if (activeInGrain.length > 0) {
      const offender = activeInGrain[0];
      return {
        dimension: [
          `Breakdown by '${dimensionLabel(dimension)}' cannot be combined with a '${dimensionLabel(
            offender
          )}' filter. ${dimensionLabel(dimension)} is folded per-dimension and has no ${dimensionLabel(
            offender
          ).toLowerCase()} detail in v1.`,
        ],
        [offender]: [
          "Remove this filter, or pick an in-grain breakdown: country, source, tier, category, container.",
        ],
      };
    }
    // Case 2 (track variant): the fold table has no track_id.
    if (hasTrackScope) {
      return {
        dimension: [
          `Breakdown by '${dimensionLabel(dimension)}' cannot be combined with a track selection.`,
        ],
        track_ids: [
          "Clear the track selection, or pick an in-grain breakdown: country, source, tier, category, container.",
        ],
      };
    }
  }

  // Case 3: a platform breakdown scoped to specific tracks.
  if (dimension === "platform" && hasTrackScope) {
    return {
      dimension: ["A platform breakdown cannot be combined with a track selection."],
      track_ids: ["Clear the track selection to break down by platform."],
    };
  }

  return null;
}

/** A 422 the client raised itself, shaped like the server's envelope. */
function unprocessable<T>(errors: Record<string, string[]>): ApiResponse<T> {
  return {
    data: null,
    message: "Unsupported filter combination.",
    error: Object.values(errors)[0]?.[0] ?? "Unsupported filter combination.",
    errors,
    status: 422,
  };
}

/* ─── API functions ───────────────────────────────────────────── */

const ROOT = "/v2/analytics";

function artistPath(scope: AnalyticsScope, suffix = ""): string {
  return `${ROOT}/artists/${scope.artistId}${suffix}`;
}

/** The profiles this account can switch to (live grants only). */
export async function getProfiles() {
  return request<ProfileSummary[]>(`${ROOT}/artists`, { method: "GET" }, true);
}

/**
 * One row per artist on the roster (Label design §8, L5).
 *
 * Distinct from a pooled request, which flattens every artist into ONE aggregate.
 * This keeps them separate — a label needs to see who is doing what, not a single
 * merged number.
 *
 * `totals.streams` is computed server-side from the fact table, NOT by summing the
 * rows below it. The two can legitimately differ: a feed that cannot contribute to
 * a per-artist attribution still counts toward the account total. Do not "fix" a
 * shortfall in the UI by summing the rows — that is the under-reporting bug the
 * whole design exists to avoid.
 */
export async function getRoster(scope: AnalyticsScope, filters: AnalyticsFilters = {}) {
  // scopedParams() omits `artist_profile_ids` for a single id, because every other
  // endpoint carries the id in its PATH. This one does not — the roster has no single
  // artist — so the ids must always be explicit or EnsureArtistAccess sees an empty
  // request and 403s. That would have broken exactly the label with one artist.
  const query = {
    ...scopedParams(scope, filters),
    artist_profile_ids: canonicalIds(scope.pooledIds ?? [scope.artistId]).join(","),
  };
  return request<Roster>(`${ROOT}/artists/roster${buildQuery(query)}`, { method: "GET" }, true);
}

export async function getSummary(scope: AnalyticsScope, params: SummaryParams = {}) {
  const query = scopedParams(scope, params, { compare: params.compare });
  return request<Summary>(
    `${artistPath(scope, "/summary")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getTimeseries(scope: AnalyticsScope, params: TimeseriesParams = {}) {
  const query = scopedParams(scope, params, {
    granularity: params.granularity,
    metric: params.metric,
  });
  return request<Timeseries>(
    `${artistPath(scope, "/timeseries")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getBreakdown(scope: AnalyticsScope, params: BreakdownParams) {
  const invalid = validateBreakdown(params.dimension, params);
  if (invalid) return unprocessable<Breakdown>(invalid);

  const query = scopedParams(scope, params, { dimension: params.dimension });
  return request<Breakdown>(
    `${artistPath(scope, "/breakdown")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getTracks(scope: AnalyticsScope, params: TrackListParams = {}) {
  const query = scopedParams(scope, params, {
    search: params.search,
    sort: params.sort,
    order: params.order,
    page: params.page,
    per_page: params.per_page,
  });
  return request<TrackList>(
    `${artistPath(scope, "/tracks")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getTrackDetail(
  scope: AnalyticsScope,
  trackId: number,
  params: TrackDetailParams = {}
) {
  const query = scopedParams(scope, params, {
    dimension: params.dimension,
    metric: params.metric,
    granularity: params.granularity,
  });
  return request<TrackDetail>(
    `${artistPath(scope, `/tracks/${trackId}`)}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getHourly(scope: AnalyticsScope, params: AnalyticsFilters = {}) {
  const query = scopedParams(scope, params);
  return request<Hourly>(
    `${artistPath(scope, "/hourly")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getEngagement(scope: AnalyticsScope, params: AnalyticsFilters = {}) {
  const query = scopedParams(scope, params);
  return request<Engagement>(
    `${artistPath(scope, "/engagement")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

export async function getCoverage(
  scope: AnalyticsScope,
  params: Pick<AnalyticsFilters, "from" | "to"> = {}
) {
  const query = scopedParams(scope, params);
  return request<Coverage>(
    `${artistPath(scope, "/coverage")}${buildQuery(query)}`,
    { method: "GET" },
    true
  );
}

/* ─── Coverage helpers ────────────────────────────────────────── */

/**
 * The platforms that cannot contribute to a dimension, and those that could but
 * delivered nothing for the range. This is what renders NEXT TO the chart — the
 * artist sees the gap where they are looking, never in a footnote (§8.7).
 */
export interface CoverageGap {
  /** Feeds whose data model has no such column. */
  unavailable: string[];
  /** Feeds that carry the dimension but returned nothing for this range. */
  incomplete: string[];
  /** Feeds that contribute but do not count toward totals. */
  excludedFromTotals: string[];
}

export function coverageGap(
  coverage: Coverage | null | undefined,
  dimension: string
): CoverageGap {
  const empty: CoverageGap = { unavailable: [], incomplete: [], excludedFromTotals: [] };
  const entry = coverage?.dimensions?.find((d) => d.key === dimension);
  if (!entry) return empty;

  const gap: CoverageGap = { unavailable: [], incomplete: [], excludedFromTotals: [] };
  for (const [platform, cell] of Object.entries(entry.platforms ?? {})) {
    if (!cell.available) {
      gap.unavailable.push(platform);
      continue;
    }
    if (!cell.complete) gap.incomplete.push(platform);
    if (!cell.counts_toward_totals) gap.excludedFromTotals.push(platform);
  }
  return gap;
}

export function hasCoverageGap(gap: CoverageGap): boolean {
  return (
    gap.unavailable.length > 0 ||
    gap.incomplete.length > 0 ||
    gap.excludedFromTotals.length > 0
  );
}
