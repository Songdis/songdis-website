/**
 * lib/api/partner.ts
 *
 * The partner portal — a read-only view of the releases an admin has assigned to an
 * external collaborator. There are no write endpoints here by design.
 *
 *   GET /partner/overview                — headline counts
 *   GET /partner/releases                — assigned catalogue, grouped into releases
 *   GET /partner/releases/{id}           — one release and its visible tracks
 *   GET /partner/analytics/summary       — stream totals over a window
 *   GET /partner/analytics/timeseries    — daily streams, zero-filled
 *   GET /partner/analytics/by-release    — streams per assigned release
 *   GET /partner/royalties/summary       — payouts, grouped by currency
 *   GET /partner/royalties/by-platform
 *   GET /partner/royalties/by-period
 */

import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */

export interface PartnerTrack {
  id: number;
  track_title?: string | null;
  isrc_code?: string | null;
  explicit_content?: boolean | null;
  status?: string | null;
}

export interface PartnerRelease {
  id: number;
  release_title: string;
  upload_type: string;
  primary_artist: string;
  album_art_url: string | null;
  status: string;
  release_date?: string | null;
  primary_genre?: string | null;
  label?: string | null;
  /** Null until the release has a UPC — it cannot be reported on before then. */
  upc_code?: string | null;
  created_at: string;
  artist_profile_id: number | null;
  artist_name: string;
  /**
   * Assignment is stored per track, so a release can be partially assigned. Show both
   * numbers rather than presenting a truncated album as the whole record.
   */
  assigned_track_count: number;
  total_track_count: number;
  tracks: PartnerTrack[];
}

export interface PartnerOverview {
  partner: { id: number; name: string };
  release_count: number;
  track_count: number;
  artist_count: number;
  live_release_count: number;
  awaiting_identifiers_count: number;
}

/**
 * How much of the assigned catalogue the analytics layer can actually speak to. Render
 * this next to the numbers, never in a footnote — a low total that is really a coverage
 * gap reads as poor performance otherwise.
 */
export interface AnalyticsCoverage {
  assigned_tracks: number;
  tracks_with_analytics: number;
  tracks_without_analytics: number;
}

export interface PartnerAnalyticsSummary {
  from: string;
  to: string;
  streams: number;
  completed_streams: number;
  discovery_streams: number;
  repeat_streams: number;
  coverage: AnalyticsCoverage;
}

export interface PartnerTimeseriesPoint {
  date: string;
  streams: number;
}

export interface PartnerTimeseries {
  from: string;
  to: string;
  series: PartnerTimeseriesPoint[];
  coverage: AnalyticsCoverage;
}

export interface PartnerReleaseStreams {
  release_id: number;
  streams: number;
}

export interface PartnerStreamsByRelease {
  from: string;
  to: string;
  releases: PartnerReleaseStreams[];
  coverage: AnalyticsCoverage;
}

/**
 * Amounts are per-currency and must not be added together. `royalty_data` stores a
 * currency per row, so one combined total would be adding naira to dollars.
 */
export interface PartnerRoyaltyTotal {
  currency: string;
  amount: number;
}

export interface PartnerRoyaltySummary {
  /** False when no assigned release has a UPC or ISRC yet — pending, not zero. */
  reportable: boolean;
  totals: PartnerRoyaltyTotal[];
  total_streams: number;
}

export interface PartnerRoyaltyPlatform {
  platform: string | null;
  currency: string;
  amount: number;
  streams: number;
}

export interface PartnerRoyaltyByPlatform {
  reportable: boolean;
  platforms: PartnerRoyaltyPlatform[];
}

export interface PartnerRoyaltyPeriod {
  period: string | null;
  currency: string;
  amount: number;
  streams: number;
}

export interface PartnerRoyaltyByPeriod {
  reportable: boolean;
  periods: PartnerRoyaltyPeriod[];
}

export interface DateWindow {
  from?: string;
  to?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function windowQuery(range?: DateWindow): string {
  if (!range) return "";

  const params = new URLSearchParams();
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);

  const query = params.toString();
  return query ? `?${query}` : "";
}

/* ─── Catalogue ───────────────────────────────────────────────── */

export async function fetchPartnerOverview() {
  return request<PartnerOverview>("/partner/overview", {}, true);
}

export async function fetchPartnerReleases() {
  return request<PartnerRelease[]>("/partner/releases", {}, true);
}

export async function fetchPartnerRelease(id: number) {
  return request<PartnerRelease>(`/partner/releases/${id}`, {}, true);
}

/* ─── Analytics ───────────────────────────────────────────────── */

export async function fetchPartnerAnalyticsSummary(range?: DateWindow) {
  return request<PartnerAnalyticsSummary>(
    `/partner/analytics/summary${windowQuery(range)}`,
    {},
    true
  );
}

export async function fetchPartnerTimeseries(range?: DateWindow) {
  return request<PartnerTimeseries>(
    `/partner/analytics/timeseries${windowQuery(range)}`,
    {},
    true
  );
}

export async function fetchPartnerStreamsByRelease(range?: DateWindow) {
  return request<PartnerStreamsByRelease>(
    `/partner/analytics/by-release${windowQuery(range)}`,
    {},
    true
  );
}

/* ─── Royalties ───────────────────────────────────────────────── */

export async function fetchPartnerRoyaltySummary(range?: DateWindow) {
  return request<PartnerRoyaltySummary>(
    `/partner/royalties/summary${windowQuery(range)}`,
    {},
    true
  );
}

export async function fetchPartnerRoyaltiesByPlatform(range?: DateWindow) {
  return request<PartnerRoyaltyByPlatform>(
    `/partner/royalties/by-platform${windowQuery(range)}`,
    {},
    true
  );
}

export async function fetchPartnerRoyaltiesByPeriod(range?: DateWindow) {
  return request<PartnerRoyaltyByPeriod>(
    `/partner/royalties/by-period${windowQuery(range)}`,
    {},
    true
  );
}
