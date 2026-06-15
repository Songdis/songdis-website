"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRoyalties, TIME_PERIODS, PLATFORMS } from "@/lib/hooks/useRoyalties";
import type { RoyaltiesPageData } from "@/lib/hooks/useRoyalties";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const PAGE_SIZE = 10;

/* ─── Dropdown ────────────────────────────────────────────────── */
function Dropdown({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-body text-white text-sm border border-white/15 bg-[#1A0808] rounded-full px-4 py-2.5 hover:border-white/30 transition-colors min-w-[130px] justify-between"
      >
        <span className="truncate">{value}</span>
        <ChevronIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-20 bg-[#1A0808] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl min-w-[180px] py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={["w-full text-left px-5 py-3 font-body text-sm transition-colors hover:bg-white/[0.05]",
                  opt === value ? "text-white font-medium" : "text-white/70"].join(" ")}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, change, highlight }: {
  label: string; value: string; sub?: string; icon: string;
  change?: string; highlight?: boolean;
}) {
  return (
    <div className={["rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center">
          <Image src={icon} alt={label} width={66} height={66} unoptimized />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="font-heading text-white text-2xl font-bold">{value}</p>
        {change && (
          <span className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
            style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
            {change}
          </span>
        )}
      </div>
      {sub && <p className="font-body text-white/30 text-[11px]">{sub}</p>}
      {highlight && (
        <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
      )}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────── */
function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="font-body text-white/30 text-sm">{message}</p>
    </div>
  );
}

/* ─── Pagination controls ─────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
      <p className="font-body text-white/40 text-xs">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={["w-8 h-8 rounded-lg border font-body text-xs transition-colors",
              p === page
                ? "border-[#C30100] bg-[#C30100]/20 text-white"
                : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"].join(" ")}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Platform logo with fallback ─────────────────────────────── */
function PlatformLogo({ logo, name }: { logo: string; name: string }) {
  if (logo) {
    return (
      <div className="w-8 h-8 rounded-lg bg-[#0E0808] flex items-center justify-center shrink-0 overflow-hidden">
        <Image src={logo} alt={name} width={20} height={20} unoptimized />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center shrink-0">
      <span className="font-heading text-[#C30100] text-[10px] uppercase">{name.slice(0, 2)}</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function RoyaltyReportPage() {
  const [period, setPeriod] = useState("Last Year");
  const [platform, setPlatform] = useState("All Platforms");
  const [exportOpen, setExportOpen] = useState(false);
  const [platformPage, setPlatformPage] = useState(1);

  const { data, isLoading } = useRoyalties(period, platform);

  const {
    stats,
    revenueByPlatform,
    topEarningReleases,
    revenueByTerritory,
    socialVsStreaming,
  } = data ?? {
    stats: {
      totalEarnings:  { value: "...", change: "", sub: "", icon: "/images/earnings.svg" },
      totalStreams:   { value: "...", change: "", sub: "", icon: "/images/streams.svg" },
      uniqueReleases: { value: "...", change: "", sub: "", icon: "/images/releases.svg" },
      territories:   { value: "...", change: "", sub: "", icon: "/images/countries.svg" },
    },
    revenueByPlatform: [],
    topEarningReleases: [],
    revenueByTerritory: [],
    socialVsStreaming: {
      socialMediaStats: { avgRate: "", uses: "" },
      streamingStats: { avgRate: "", streams: "" },
      socialPlatforms: [],
      streamingPlatforms: [],
    },
  };

  // Paginated platform list
  const paginatedPlatforms = revenueByPlatform.slice(
    (platformPage - 1) * PAGE_SIZE,
    platformPage * PAGE_SIZE
  );

  // Social vs streaming chart data
  const combinedChartData = [
    ...socialVsStreaming.socialPlatforms.map((p) => ({
      name: p.platform, social: p.earnings, streaming: 0,
    })),
    ...socialVsStreaming.streamingPlatforms.map((p) => ({
      name: p.platform, social: 0, streaming: p.earnings,
    })),
  ];
  const hasChartData = combinedChartData.some((d) => d.social > 0 || d.streaming > 0);

  return (
    <DashboardLayout customCta={{ label: "Export Data", onClick: () => setExportOpen(true) }}>
      <div className="flex items-center gap-3 mb-5 -mt-2">
        <Dropdown value={period} options={TIME_PERIODS} onChange={(v) => { setPeriod(v); setPlatformPage(1); }} />
        <Dropdown value={platform} options={PLATFORMS} onChange={(v) => { setPlatform(v); setPlatformPage(1); }} />
      </div>

      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Earnings"  value={stats.totalEarnings.value}  sub={stats.totalEarnings.sub}  icon={stats.totalEarnings.icon}  change={stats.totalEarnings.change}  highlight />
          <StatCard label="Total Streams"   value={stats.totalStreams.value}   sub={stats.totalStreams.sub}   icon={stats.totalStreams.icon}   change={stats.totalStreams.change} />
          <StatCard label="Unique Releases" value={stats.uniqueReleases.value} sub={stats.uniqueReleases.sub} icon={stats.uniqueReleases.icon} change={stats.uniqueReleases.change} />
          <StatCard label="Territories"     value={stats.territories.value}    sub={stats.territories.sub}    icon={stats.territories.icon}    change={stats.territories.change} />
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div className="flex-1">
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">Ayo AI · Analytics Summary</p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Your streams peaked in November with 530K+ streams — this correlates with your consistent social activity and a playlist placement on AfroBeats Daily. Nigeria is 61% of your audience. I recommend doubling down with Pidgin/Yoruba content to retain and grow that base while expanding into UK and US diaspora markets.
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">Plan content with Ayo</button>
                <button className="font-body text-white/70 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-2 transition-colors">View platform breakdown</button>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Platform — paginated 10 per page */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-body text-white text-sm font-medium">Revenue by Platform</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Earnings Distribution</p>
            </div>
            <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">
              View All <span>→</span>
            </button>
          </div>

          <div className="flex flex-col mt-4">
            {revenueByPlatform.length === 0 ? (
              <EmptyState message="No platform revenue data yet." />
            ) : (
              <>
                {paginatedPlatforms.map((p, i) => (
                  <div
                    key={p.id}
                    className={["flex items-center justify-between py-4",
                      i < paginatedPlatforms.length - 1 ? "border-b border-white/[0.05]" : ""].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <PlatformLogo logo={p.logo} name={p.name} />
                      <p className="font-body text-white text-sm">{p.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-body text-white text-sm font-semibold">${p.earnings.toFixed(2)}</p>
                      <p className="font-body text-white/40 text-xs">{p.streams.toLocaleString()} streams</p>
                    </div>
                  </div>
                ))}
                <Pagination
                  page={platformPage}
                  total={revenueByPlatform.length}
                  pageSize={PAGE_SIZE}
                  onChange={setPlatformPage}
                />
              </>
            )}
          </div>
        </div>

        {/* Top Earning Releases */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-body text-white text-sm font-medium">Top Earning Releases</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Highest revenue generating tracks</p>
            </div>
            <span className="font-body text-xs rounded-full px-3 py-1"
              style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
              Revenue Focused
            </span>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-6 gap-3 mt-5 mb-2 px-1">
            <div className="col-span-2" />
            <p className="font-body text-white/30 text-xs text-right">Earnings</p>
            <p className="font-body text-white/30 text-xs text-right">Streams</p>
            <p className="font-body text-white/30 text-xs text-right">Territories</p>
            <p className="font-body text-white/30 text-xs text-right">Action</p>
          </div>

          <div className="flex flex-col">
            {topEarningReleases.length === 0 ? (
              <EmptyState message="No earning releases yet." />
            ) : topEarningReleases.map((release, i) => (
              <div
                key={release.id}
                className={["flex flex-wrap sm:grid sm:grid-cols-6 gap-2 sm:gap-3 items-center py-4",
                  i < topEarningReleases.length - 1 ? "border-b border-white/[0.05]" : ""].join(" ")}
              >
                {/* Rank + cover + title */}
                <div className="col-span-2 flex items-center gap-3">
                  <span className="font-heading text-[#C30100] text-sm font-bold w-5 shrink-0 text-center">{release.rank}</span>
                  {/* Cover art */}
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0E0808]">
                    {release.cover ? (
                      <Image src={release.cover} alt={release.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-white text-sm truncate">{release.title}</p>
                    <p className="font-body text-white/40 text-xs truncate">{release.artist}</p>
                  </div>
                </div>
                <p className="font-body text-white/80 text-sm text-right font-medium">{release.earnings}</p>
                <p className="font-body text-white/60 text-sm text-right">{release.streams}</p>
                <p className="font-body text-white/60 text-sm text-right">{release.territories}</p>
                <div className="flex justify-end">
                  <button className="font-body text-white text-xs border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 transition-colors">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Territory */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-body text-white text-sm font-medium">Revenue by Territory</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Top earning countries and regions</p>
            </div>
            <span className="font-body text-xs rounded-full px-3 py-1"
              style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
              Earnings Focused
            </span>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-5 gap-4 mt-5 mb-2 px-1">
            <div className="col-span-2" />
            <p className="font-body text-white/30 text-xs text-right">Earnings</p>
            <p className="font-body text-white/30 text-xs text-right">Streams</p>
            <p className="font-body text-white/30 text-xs text-right">Action</p>
          </div>

          <div className="flex flex-col">
            {revenueByTerritory.length === 0 ? (
              <EmptyState message="No territory data yet." />
            ) : revenueByTerritory.map((t, i) => (
              <div
                key={t.id}
                className={["flex flex-wrap sm:grid sm:grid-cols-5 gap-2 sm:gap-4 items-center py-4",
                  i < revenueByTerritory.length - 1 ? "border-b border-white/[0.05]" : ""].join(" ")}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0">
                    <span className="font-heading text-[#C30100] text-sm font-bold">{t.rank}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{t.flag}</span>
                    <p className="font-body text-white text-sm">{t.country}</p>
                  </div>
                </div>
                <p className="font-body text-white/80 text-sm text-right font-medium">{t.earnings}</p>
                <p className="font-body text-white/60 text-sm text-right">{t.streams}</p>
                <div className="flex justify-end">
                  <button className="font-body text-white text-xs border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 transition-colors">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social vs Streaming */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-body text-white text-sm font-medium">Social vs Streaming</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Revenue by platform type</p>
            </div>
            <div className="flex flex-wrap gap-6 shrink-0">
              <div>
                <p className="font-heading text-white text-xs uppercase tracking-widest mb-1">Social Media</p>
                <p className="font-body text-white/50 text-xs">Avg Rate: {socialVsStreaming.socialMediaStats.avgRate}</p>
                <p className="font-body text-white/50 text-xs">Uses: {socialVsStreaming.socialMediaStats.uses}</p>
              </div>
              <div>
                <p className="font-heading text-white text-xs uppercase tracking-widest mb-1">Streaming</p>
                <p className="font-body text-white/50 text-xs">Avg Rate: {socialVsStreaming.streamingStats.avgRate}</p>
                <p className="font-body text-white/50 text-xs">Streams: {socialVsStreaming.streamingStats.streams}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#C30100]" />
              <span className="font-body text-white/50 text-xs">Social</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8B6A4B]" />
              <span className="font-body text-white/50 text-xs">Streaming</span>
            </div>
          </div>

          {!hasChartData ? (
            <EmptyState message="No social vs streaming data available yet." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={combinedChartData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                  axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                  formatter={(value, name) => {
                    const n = typeof value === "number" ? value : Number(value ?? 0);
                    return [`$${n.toFixed(2)}`, name === "social" ? "Social" : "Streaming"] as [string, string];
                  }}
                />
                <Bar dataKey="social"    fill="#C30100" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="streaming" fill="#8B6A4B" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {exportOpen && (
        <ExportModal onClose={() => setExportOpen(false)} data={data} period={period} platform={platform} />
      )}
    </DashboardLayout>
  );
}

/* ─── Export ──────────────────────────────────────────────────── */
function exportCSV(data: RoyaltiesPageData | null, period: string, platform: string) {
  if (!data) return;
  const rows: string[][] = [];
  rows.push([`Royalty Report — ${period} — ${platform}`]);
  rows.push([]);
  rows.push(["Metric", "Value"]);
  rows.push(["Total Earnings", data.stats.totalEarnings.value]);
  rows.push(["Total Streams",  data.stats.totalStreams.value]);
  rows.push(["Unique Releases",data.stats.uniqueReleases.value]);
  rows.push(["Territories",    data.stats.territories.value]);
  rows.push([]);
  rows.push(["Platform", "Earnings (USD)", "Streams"]);
  data.revenueByPlatform.forEach((p) => rows.push([p.name, String(p.earnings), String(p.streams)]));
  rows.push([]);
  rows.push(["Rank", "Title", "Artist", "Earnings", "Streams", "Territories"]);
  data.topEarningReleases.forEach((r) => rows.push([String(r.rank), r.title, r.artist, r.earnings, r.streams, String(r.territories)]));
  rows.push([]);
  rows.push(["Rank", "Country", "Earnings", "Streams"]);
  data.revenueByTerritory.forEach((t) => rows.push([String(t.rank), t.country, t.earnings, t.streams]));
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `royalty-report-${period.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(data: RoyaltiesPageData | null, period: string, platform: string) {
  if (!data) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Royalty Report</title>
  <style>body{font-family:Arial;color:#1a0808;padding:32px;}h1{font-size:22px;}h2{font-size:14px;font-weight:600;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px;}p{font-size:12px;color:#666;margin:0 0 16px;}table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;}th{text-align:left;padding:6px 10px;background:#f5f5f5;font-weight:600;}td{padding:6px 10px;border-bottom:1px solid #f0f0f0;}.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}.sc{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:12px;}.sl{font-size:11px;color:#888;}.sv{font-size:20px;font-weight:700;margin-top:4px;}</style>
  </head><body><h1>Royalty Report</h1><p>${period} · ${platform}</p>
  <div class="sg">
    <div class="sc"><div class="sl">Total Earnings</div><div class="sv">${data.stats.totalEarnings.value}</div></div>
    <div class="sc"><div class="sl">Total Streams</div><div class="sv">${data.stats.totalStreams.value}</div></div>
    <div class="sc"><div class="sl">Unique Releases</div><div class="sv">${data.stats.uniqueReleases.value}</div></div>
    <div class="sc"><div class="sl">Territories</div><div class="sv">${data.stats.territories.value}</div></div>
  </div>
  <h2>Top Earning Releases</h2>
  <table><thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Earnings</th><th>Streams</th><th>Territories</th></tr></thead>
  <tbody>${data.topEarningReleases.map((r) => `<tr><td>${r.rank}</td><td>${r.title}</td><td>${r.artist}</td><td>${r.earnings}</td><td>${r.streams}</td><td>${r.territories}</td></tr>`).join("")}</tbody></table>
  <h2>Revenue by Territory</h2>
  <table><thead><tr><th>#</th><th>Country</th><th>Earnings</th><th>Streams</th></tr></thead>
  <tbody>${data.revenueByTerritory.map((t) => `<tr><td>${t.rank}</td><td>${t.country}</td><td>${t.earnings}</td><td>${t.streams}</td></tr>`).join("")}</tbody></table>
  </body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

function ExportModal({ onClose, data, period, platform }: {
  onClose: () => void; data: RoyaltiesPageData | null; period: string; platform: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <h2 className="font-heading text-white uppercase text-lg tracking-wide mb-2">Export Data</h2>
        <p className="font-body text-white/50 text-sm mb-6">Download your royalty report for <span className="text-white">{period}</span> across <span className="text-white">{platform}</span>.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => { exportCSV(data, period, platform); onClose(); }}
            className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0E0808] hover:border-white/20 px-5 py-4 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="text-left">
              <p className="font-body text-white text-sm font-medium">Download as CSV</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Spreadsheet format</p>
            </div>
          </button>
          <button onClick={() => { exportPDF(data, period, platform); onClose(); }}
            className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0E0808] hover:border-white/20 px-5 py-4 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="text-left">
              <p className="font-body text-white text-sm font-medium">Download as PDF</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Print-ready report</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
}