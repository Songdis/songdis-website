import { request } from "./core";

export interface DateRangeParams {
  start_date?: string;
  end_date?: string;
  platform?: string;
  [key: string]: unknown;
}

function buildQs(params: DateRangeParams & Record<string, unknown>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export interface StreamsData {
  months?: string[];
  streams?: number[];
  revenue?: number[];
  [key: string]: unknown;
}

export interface TopRelease {
  id?: number | string;
  upload_id?: number | string;
  title?: string;
  release_title?: string;
  release_name?: string;        
  track_title?: string;         
  artist?: string;
  artists?: string;            
  primary_artist?: string;
  streams?: number | string;
  total_streams?: number | string;
  plays?: number | string;
  cover?: string;
  album_art_url?: string;
  [key: string]: unknown;
}

export interface TopPlatform {
  platform?: string;            
  platform_name?: string;       
  name?: string;
  streams?: number;
  total_streams?: number;       
  percentage?: number;
  color?: string;
  countries?: number;
  unique_releases?: number;
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


export async function getStreams(params: DateRangeParams = {}) {
  return request<AnalyticsSummary>(
    `/streams${buildQs(params)}`,
    { method: "GET" },
    true
  );
}

export async function getStreamsData(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/streams-data${buildQs(params)}`,
    { method: "GET" },
    true
  );
}

export async function getDailyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/daily-streams${buildQs(params)}`,
    { method: "GET" },
    true
  );
}

export async function getWeeklyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/weekly-streams${buildQs(params)}`,
    { method: "GET" },
    true
  );
}

export async function getMonthlyStreams(params: DateRangeParams = {}) {
  return request<StreamsData>(
    `/monthly-streams${buildQs(params)}`,
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
    `/geographic${buildQs(params)}`,
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
    `/platforms${buildQs(params)}`,
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
    `/monthly-report${buildQs(params)}`,
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

export async function getSoundchartsStatus() {
  return request<Record<string, unknown>>(
    "/soundcharts/status",
    { method: "GET" },
    true
  );
}

export async function getSoundchartsDashboard(linkId?: number | string) {
  const qs = linkId ? `?link_id=${linkId}` : "";
  return request<Record<string, unknown>>(
    `/soundcharts/dashboard${qs}`,
    { method: "GET" },
    true
  );
}

export async function getSoundchartsStreamingHistory(linkId?: number | string) {
  const qs = linkId ? `?link_id=${linkId}` : "";
  return request<Record<string, unknown>>(
    `/soundcharts/streaming/history${qs}`,
    { method: "GET" },
    true
  );
}