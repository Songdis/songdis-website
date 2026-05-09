/**
 * lib/api/dashboard.ts
 *
 * Endpoint mapping (from Postman collection):
 *   GET /dashboard          — main dashboard summary
 *   GET /dashboard-stats    — stat cards (active releases, earnings)
 *   GET /top-releases       — recent/top releases
 *   GET /top-platforms      — platform breakdown
 *   GET /streams-data       — chart data for performance analytics
 *   GET /monthly-streams    — monthly stream breakdown
 */

import { request } from "./core";

/* ─── Response types ──────────────────────────────────────────── */

export interface DashboardRelease {
  id: number | string;
  title: string;
  artist: string;
  cover: string;          // album_art_url from API
  status: "live" | "pending" | "delivered" | "distributed" | "need_documentation";
  type?: string;
}

export interface DashboardStats {
  activeReleases: number;
  totalEarnings: number;
}

export interface WalletData {
  totalEarnings: number;
  period: string;
  streams: number;
  avgPerStream: number;
}

export interface ChartPoint {
  month: string;
  streams: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  wallet: WalletData;
  recentReleases: DashboardRelease[];
  analyticsChart: {
    months: string[];
    streams: number[];
    revenue: number[];
  };
}

export interface DashboardStatsRaw {
  active_releases?: number;
  total_earnings?: number;
  total_streams?: number;
  total_releases?: number;
  [key: string]: unknown;
}

export interface TopRelease {
  id: number | string;
  title: string;
  artist: string;
  cover: string;
  status: string;
  streams?: number;
  release_date?: string;
}

export interface TopPlatform {
  name: string;
  streams: number;
  percentage: number;
  color?: string;
}

export interface StreamsData {
  months: string[];
  streams: number[];
  revenue: number[];
}

/* ─── API functions ───────────────────────────────────────────── */

/**
 * GET /dashboard
 * Main dashboard summary — returns combined stats, releases, wallet.
 */
export async function getDashboard() {
  return request<DashboardStatsRaw>("/dashboard", { method: "GET" }, true);
}

/**
 * GET /dashboard-stats
 * Stat cards — active releases, total earnings etc.
 */
export async function getDashboardStats() {
  return request<DashboardStatsRaw>("/dashboard-stats", { method: "GET" }, true);
}

/**
 * GET /top-releases
 * Recent / top performing releases for the dashboard grid.
 */
export async function getTopReleases() {
  return request<TopRelease[]>("/top-releases", { method: "GET" }, true);
}

/**
 * GET /top-platforms
 * Platform breakdown for the performance chart legend.
 */
export async function getTopPlatforms() {
  return request<TopPlatform[]>("/top-platforms", { method: "GET" }, true);
}

/**
 * GET /streams-data
 * Monthly streams + revenue arrays for the area chart.
 */
export async function getStreamsData() {
  return request<StreamsData>("/streams-data", { method: "GET" }, true);
}

/**
 * GET /monthly-streams
 * Breakdown by month — used as fallback if /streams-data is unavailable.
 */
export async function getMonthlyStreams() {
  return request<StreamsData>("/monthly-streams", { method: "GET" }, true);
}