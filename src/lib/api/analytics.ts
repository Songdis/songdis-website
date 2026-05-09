/**
 * lib/api/analytics.ts
 *
 * Endpoint mapping (from Postman collection):
 *   GET /streams                — streams with date range
 *   GET /streams-data           — chart data
 *   GET /daily-streams          — daily breakdown
 *   GET /weekly-streams         — weekly breakdown
 *   GET /monthly-streams        — monthly breakdown
 *   GET /top-releases           — top performing releases
 *   GET /top-platforms          — platform breakdown
 *   GET /geographic             — geographic breakdown
 *   GET /country/{code}         — single country data
 *   GET /platforms              — per platform detail
 *   GET /release/{id}           — single release analytics
 *   GET /compare                — compare releases
 *   POST /compare               — compare with custom range
 *   GET /monthly-report         — monthly report by platform
 *   GET /yearly-report          — yearly report
 */

import { request } from "./core";

/* ─── Shared params ───────────────────────────────────────────── */
export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  platform?: string;
}

function buildQs(params: DateRangeParams & Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ─── Response types ──────────────────────────────────────────── */
export interface StreamsData {
  months?: string[];
  streams?: number[];
  revenue?: number[];
  [key: string]: unknown;
}

export interface TopRelease {
  id: number | string;
  title?: string;
  release_title?: string;
  artist?: string;
  primary_artist?: string;
  streams?: number | string;
  plays?: number | string;
  cover?: string;
  album_art_url?: string;
  [key: string]: unknown;
}

export interface TopPlatform {
  name?: string;
  platform?: string;
  streams?: number;
  percentage?: number;
  color?: string;
  [key: string]: unknown;
}

export interface GeographicData {
  country?: string;
  country_name?: string;
  streams?: number | string;
  percentage?: number;
  change?: string;
  flag?: string;
  [key: string]: unknown;
}

export interface AnalyticsSummary {
  total_streams?: number;
  avg_per_day?: number;
  unique_releases?: number;
  countries?: number;
  territories_reached?: number;
  platforms?: number;
  active_platforms?: number;
  playlists?: number;
  [key: string]: unknown;
}

/* ─── API functions ───────────────────────────────────────────── */

export async function getStreams(params: DateRangeParams = {}) {
  return request<AnalyticsSummary>(
    `/streams${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getStreamsData(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/streams-data${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getDailyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/daily-streams${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getWeeklyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/weekly-streams${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getMonthlyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/monthly-streams${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getTopReleases() {
  return request<TopRelease[]>("/top-releases", { method: "GET" }, true);
}

export async function getTopPlatforms() {
  return request<TopPlatform[]>("/top-platforms", { method: "GET" }, true);
}

export async function getGeographic(params: DateRangeParams & { platform?: string } = {}) {
  return request<GeographicData[]>(
    `/geographic${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getCountry(code: string) {
  return request<GeographicData>(
    `/country/${code}`,
    { method: "GET" },
    true
  );
}

export async function getPlatforms(params: DateRangeParams = {}) {
  return request<TopPlatform[]>(
    `/platforms${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getReleaseAnalytics(id: number | string) {
  return request<Record<string, unknown>>(
    `/release/${id}`,
    { method: "GET" },
    true
  );
}

export async function compareReleases(payload: {
  release_ids: number[];
  start_date: string;
  end_date: string;
}) {
  return request<Record<string, unknown>>(
    "/compare",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getMonthlyReport(params: DateRangeParams & { platform?: string } = {}) {
  return request<Record<string, unknown>>(
    `/monthly-report${buildQs(params as DateRangeParams & Record<string, unknown>)}`,
    { method: "GET" },
    true
  );
}

export async function getYearlyReport() {
  return request<Record<string, unknown>>(
    "/yearly-report",
    { method: "GET" },
    true
  );
}