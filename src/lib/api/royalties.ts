/**
 * lib/api/royalties.ts
 *
 * Endpoint mapping (from Postman collection):
 *   GET /royalties                    — overview with date range + platform
 *   GET /social/vs-streaming          — social vs streaming comparison chart
 *   GET /royalties/platform-metrics   — per-platform metrics
 */

import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */

export interface RoyaltiesOverview {
  total_earnings?: number;
  total_streams?: number;
  unique_releases?: number;
  territories?: number;
  top_releases?: RoyaltyRelease[];
  top_territories?: RoyaltyTerritory[];
  platforms?: RoyaltyPlatform[];
  [key: string]: unknown;
}

export interface RoyaltyRelease {
  id: number | string;
  title?: string;
  release_title?: string;
  artist?: string;
  primary_artist?: string;
  plays?: number | string;
  streams?: number | string;
  territories?: number;
  earnings?: number;
  [key: string]: unknown;
}

export interface RoyaltyTerritory {
  country?: string;
  country_name?: string;
  flag?: string;
  plays?: number | string;
  streams?: number | string;
  earnings?: number;
  [key: string]: unknown;
}

export interface RoyaltyPlatform {
  platform?: string;
  name?: string;
  earnings?: number;
  streams?: number;
  logo?: string;
  [key: string]: unknown;
}

export interface SocialVsStreamingData {
  social_media?: {
    avg_rate?: number;
    total_uses?: number | string;
    [key: string]: unknown;
  };
  streaming?: {
    avg_rate?: number;
    total_streams?: number | string;
    [key: string]: unknown;
  };
  monthly_data?: Array<{
    month: string;
    social: number;
    streaming: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface PlatformMetrics {
  platforms?: RoyaltyPlatform[];
  [key: string]: unknown;
}

export interface RoyaltiesParams {
  start_date?: string;
  end_date?: string;
  platform?: string;
}

/* ─── API functions ───────────────────────────────────────────── */

export async function getRoyalties(params: RoyaltiesParams = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date)   query.set("end_date",   params.end_date);
  if (params.platform && params.platform !== "All Platforms") {
    query.set("platform", params.platform.toLowerCase().replace(/\s+/g, "_"));
  }
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<RoyaltiesOverview>(`/royalties${qs}`, { method: "GET" }, true);
}

export async function getSocialVsStreaming(params: RoyaltiesParams = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date)   query.set("end_date",   params.end_date);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<SocialVsStreamingData>(`/social/vs-streaming${qs}`, { method: "GET" }, true);
}

export async function getRoyaltyPlatformMetrics(params: RoyaltiesParams = {}) {
  const query = new URLSearchParams();
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date)   query.set("end_date",   params.end_date);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<PlatformMetrics>(`/royalties/platform-metrics${qs}`, { method: "GET" }, true);
}