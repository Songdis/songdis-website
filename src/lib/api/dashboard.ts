import { request } from "./core";


export interface DashboardRelease {
  id: number | string;
  title: string;
  artist: string;
  cover: string;          
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

export async function getDashboard() {
  return request<DashboardStatsRaw>("/dashboard", { method: "GET" }, true);
}

export async function getDashboardStats() {
  return request<DashboardStatsRaw>("/dashboard-stats", { method: "GET" }, true);
}


export async function getTopReleases() {
  return request<TopRelease[]>("/top-releases", { method: "GET" }, true);
}


export async function getTopPlatforms() {
  return request<TopPlatform[]>("/top-platforms", { method: "GET" }, true);
}


export async function getStreamsData() {
  return request<StreamsData>("/streams-data", { method: "GET" }, true);
}


export async function getMonthlyStreams() {
  return request<StreamsData>("/monthly-streams", { method: "GET" }, true);
}