import { request, type ApiResponse } from "./core";


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
  legacy_period_total: "Earlier period",
};

export function platformLabel(key: string): string {
  return PLATFORM_LABELS[key] ?? key.replace(/_/g, " ");
}


export const IN_GRAIN_DIMENSIONS = [
  "country",
  "source",
  "tier",
  "category",
  "container",
] as const;

export type InGrainDimension = (typeof IN_GRAIN_DIMENSIONS)[number];


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

export const RATE_METRICS: ReadonlySet<string> = new Set([
  "completed_rate",
  "shuffle_rate",
  "repeat_rate",
  "discovery_rate",
  "cached_rate",
]);

export type TrackSort = "streams" | "title" | "completed_rate" | "tracks_streamed";
export type SortOrder = "asc" | "desc";


export interface ProfileSummary {
  id: number;
  display_name: string | null;
  image_url: string | null;
  role: "owner" | "manager" | "viewer";
  granted_at: string;
}

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

export interface RosterArtist {
  artist_profile_id: number;
  name: string | null;
  image_url: string | null;
  streams: number;
  share: number;
  trend: Array<{ date: string; streams: number | null }>;
  top_platform: { key: string; label: string; streams: number } | null;
  coverage?: Coverage | null;
}

export interface Roster {

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
  value: number | null;
  by_platform?: Record<string, number>;
  provisional: boolean;
}


export interface PeriodTotal {
  feed: string;
  label: string;
  streams: number;
  pinned_to: string;
}

export interface Timeseries {
  granularity: string;
  metric: string;
  points: TimeseriesPoint[];
  coverage: Coverage;
  period_totals?: PeriodTotal[];
  provisional: boolean;
  suppressed: string[];
}

export interface BreakdownItem {
  key: string;
  label: string;
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
  total: number;
  items: BreakdownItem[];
  last_rebuilt_at: string | null;
  coverage: Coverage;
  provisional: boolean;
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

export interface AnalyticsScope {
  artistId: number;
  pooledIds?: number[];
}

export function pooledScope(ids: number[]): AnalyticsScope | null {
  const sorted = canonicalIds(ids);
  if (sorted.length === 0) return null;
  return { artistId: sorted[0], pooledIds: sorted };
}

export function singleScope(id: number): AnalyticsScope {
  return { artistId: id };
}

export function canonicalIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

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


export type QueryValue = string | number | boolean | undefined | null | string[] | number[];


export type QueryParams = Record<string, unknown>;


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

  if (scope.pooledIds && scope.pooledIds.length > 1) {
    params.artist_profile_ids = canonicalIds(scope.pooledIds).join(",");
  }

  return params;
}


export function scopeKey(scope: AnalyticsScope): string {
  if (scope.pooledIds && scope.pooledIds.length > 1) {
    return canonicalIds(scope.pooledIds).join(",");
  }
  return String(scope.artistId);
}


export function cacheKey<T extends object>(
  scope: AnalyticsScope,
  endpoint: string,
  params: T
): string {
  return `analytics:v2:${scopeKey(scope)}:${endpoint}${buildQuery(params)}`;
}


export function validateBreakdown(
  dimension: Dimension,
  filters: AnalyticsFilters
): Record<string, string[]> | null {
  const activeInGrain = IN_GRAIN_DIMENSIONS.filter(
    (key) => (filters[key]?.length ?? 0) > 0
  );
  const hasTrackScope = (filters.track_ids?.length ?? 0) > 0;

  if (isOutsideGrain(dimension)) {
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

  if (dimension === "platform" && hasTrackScope) {
    return {
      dimension: ["A platform breakdown cannot be combined with a track selection."],
      track_ids: ["Clear the track selection to break down by platform."],
    };
  }

  return null;
}

function unprocessable<T>(errors: Record<string, string[]>): ApiResponse<T> {
  return {
    data: null,
    message: "Unsupported filter combination.",
    error: Object.values(errors)[0]?.[0] ?? "Unsupported filter combination.",
    errors,
    status: 422,
  };
}


const ROOT = "/v2/analytics";

function artistPath(scope: AnalyticsScope, suffix = ""): string {
  return `${ROOT}/artists/${scope.artistId}${suffix}`;
}

export async function getProfiles() {
  return request<ProfileSummary[]>(`${ROOT}/artists`, { method: "GET" }, true);
}


export async function getRoster(scope: AnalyticsScope, filters: AnalyticsFilters = {}) {
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


export interface CoverageGap {
  unavailable: string[];
  incomplete: string[];
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
