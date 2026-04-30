"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { MOCK_ROYALTIES, TIME_PERIODS, PLATFORMS } from "../../mock/royalties";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

/* ─── Shared dropdown ─────────────────────────────────────────── */
function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
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
                className={[
                  "w-full text-left px-5 py-3 font-body text-sm transition-colors hover:bg-white/[0.05]",
                  opt === value ? "text-white font-medium" : "text-white/70",
                ].join(" ")}
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
function StatCard({
  label,
  value,
  sub,
  icon,
  change,
  highlight,
  changePositive,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  change?: string;
  highlight?: boolean;
  changePositive?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
        highlight
          ? "border-[#C30100]/40 bg-[#C30100]/10"
          : "border-white/[0.06] bg-[#180F0F]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
          <Image src={icon} alt={label} width={66} height={66} unoptimized />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <p className="font-heading text-white text-2xl font-bold">{value}</p>
        {change && (
          <span
            className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
            style={
              changePositive !== false
                ? { color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }
                : { color: "#C30100", backgroundColor: "rgba(195,1,0,0.15)" }
            }
          >
            {change}
          </span>
        )}
      </div>

      {sub && <p className="font-body text-white/30 text-[11px]">{sub}</p>}

      {highlight && (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{
            background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function RoyaltyReportPage() {
  const [period, setPeriod] = useState("Last Year");
  const [platform, setPlatform] = useState("All Platforms");
  const [chartMonth, setChartMonth] = useState("March");

  const { stats, revenueByPlatform, topEarningReleases, revenueByTerritory, socialVsStreaming } = MOCK_ROYALTIES;

  /* Social vs streaming chart data */
  const chartData = socialVsStreaming.months.map((m, i) => ({
    month: m,
    social: socialVsStreaming.social[i],
    streaming: socialVsStreaming.streaming[i],
  }));

  return (
    <DashboardLayout
      userName="VJazzy"
      customCta={{ label: "Export Data", onClick: () => {} }}
    >
      {/* Extra topbar controls — period + platform dropdowns */}
      <div className="flex items-center gap-3 mb-5 -mt-2">
        <Dropdown value={period} options={TIME_PERIODS} onChange={setPeriod} />
        <Dropdown value={platform} options={PLATFORMS} onChange={setPlatform} />
      </div>

      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Earnings"
            value={stats.totalEarnings.value}
            sub={stats.totalEarnings.sub}
            icon={stats.totalEarnings.icon}
            change={stats.totalEarnings.change}
            highlight
          />
          <StatCard
            label="Total Streams"
            value={stats.totalStreams.value}
            sub={stats.totalStreams.sub}
            icon={stats.totalStreams.icon}
            change={stats.totalStreams.change}
          />
          <StatCard
            label="Unique Releases"
            value={stats.uniqueReleases.value}
            sub={stats.uniqueReleases.sub}
            icon={stats.uniqueReleases.icon}
            change={stats.uniqueReleases.change}
          />
          <StatCard
            label="Territories"
            value={stats.territories.value}
            sub={stats.territories.sub}
            icon={stats.territories.icon}
            change={stats.territories.change}
          />
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div className="flex-1">
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">
                Ayo AI · Analytics Summary
              </p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Your streams peaked in November with 530K+ streams — this correlates with your consistent social activity and a playlist placement on AfroBeats Daily. Nigeria is 61% of your audience. I recommend doubling down with Pidgin/Yoruba content to retain and grow that base while expanding into UK and US diaspora markets.
              </p>
              <div className="flex gap-2">
                <button className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                  Plan content with Ayo
                </button>
                <button className="font-body text-white/70 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-2 transition-colors">
                  View platform breakdown
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue by Platform */}
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
            {revenueByPlatform.map((p, i) => (
              <div
                key={p.id}
                className={[
                  "flex items-center justify-between py-4",
                  i < revenueByPlatform.length - 1 ? "border-b border-white/[0.05]" : "",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  {/*
                   * Platform logos — drop Figma SVG exports at:
                   * /public/icons/platforms/apple-music.svg
                   * /public/icons/platforms/boomplay.svg
                   * /public/icons/platforms/audiomack.svg
                   * /public/icons/platforms/amazon-music.svg
                   */}
                  <div className="w-8 h-8 rounded-lg bg-[#0E0808] flex items-center justify-center shrink-0 overflow-hidden">
                    <Image src={p.logo} alt={p.name} width={20} height={20} unoptimized />
                  </div>
                  <p className="font-body text-white text-sm">{p.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-body text-white text-sm font-semibold">
                    ${p.earnings.toFixed(2)}
                  </p>
                  <p className="font-body text-white/40 text-xs">
                    {p.streams.toLocaleString()} streams
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Earning Releases */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="font-body text-white text-sm font-medium">Top Earning Releases</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Highest revenue generating tracks</p>
            </div>
            <span
              className="font-body text-xs rounded-full px-3 py-1"
              style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              Revenue Focused
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 mt-5 mb-2 px-1">
            <div className="col-span-2" />
            <p className="font-body text-white/30 text-xs text-right">Plays</p>
            <p className="font-body text-white/30 text-xs text-right">Streams</p>
            <p className="font-body text-white/30 text-xs text-right">Territories</p>
          </div>

          <div className="flex flex-col">
            {topEarningReleases.map((release, i) => (
              <div
                key={release.id}
                className={[
                  "grid grid-cols-5 gap-4 items-center py-4",
                  i < topEarningReleases.length - 1 ? "border-b border-white/[0.05]" : "",
                ].join(" ")}
              >
                {/* Rank + title */}
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0">
                    <span className="font-heading text-[#C30100] text-sm font-bold">{release.rank}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-white text-sm truncate">{release.title}</p>
                    <p className="font-body text-white/40 text-xs">{release.artist}</p>
                  </div>
                </div>
                <p className="font-body text-white/60 text-sm text-right">{release.plays}</p>
                <p className="font-body text-white/60 text-sm text-right">{release.streams}</p>
                <div className="flex items-center justify-end gap-3">
                  <p className="font-body text-white/60 text-sm">{release.territories}</p>
                  <button className="font-body text-white text-xs border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 transition-colors shrink-0">
                    View
                  </button>
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
            <span
              className="font-body text-xs rounded-full px-3 py-1"
              style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              Earnings Focused
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 mt-5 mb-2 px-1">
            <div className="col-span-2" />
            <p className="font-body text-white/30 text-xs text-right">Plays</p>
            <p className="font-body text-white/30 text-xs text-right">Streams</p>
            <p className="font-body text-white/30 text-xs text-right">Action</p>
          </div>

          <div className="flex flex-col">
            {revenueByTerritory.map((t, i) => (
              <div
                key={t.id}
                className={[
                  "grid grid-cols-5 gap-4 items-center py-4",
                  i < revenueByTerritory.length - 1 ? "border-b border-white/[0.05]" : "",
                ].join(" ")}
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
                <p className="font-body text-white/60 text-sm text-right">{t.plays}</p>
                <p className="font-body text-white/60 text-sm text-right">{t.streams}</p>
                <div className="flex justify-end">
                  <button className="font-body text-white text-xs border border-white/15 hover:border-white/30 rounded-full px-3 py-1.5 transition-colors">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social vs Streaming */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-body text-white text-sm font-medium">Social vs Streaming</p>
              <p className="font-body text-white/40 text-xs mt-0.5">Revenue comparison between platform types</p>
            </div>
            <div className="flex items-start gap-6 shrink-0">
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

          {/* Legend + month filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C30100]" />
                <span className="font-body text-white/50 text-xs">Social</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8B6A4B]" />
                <span className="font-body text-white/50 text-xs">Streaming</span>
              </div>
            </div>
            <select
              value={chartMonth}
              onChange={(e) => setChartMonth(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 font-body text-white/50 text-xs outline-none"
            >
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#1A0808",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontFamily: "var(--font-montserrat)",
                  fontSize: 11,
                }}
                formatter={(value) => {
                  const n = typeof value === "number" ? value : 0;
                  return [`$${(n / 1000).toFixed(0)}k`];
                }}
              />
              <Bar dataKey="social"    fill="#C30100" radius={[3, 3, 0, 0]} barSize={14} />
              <Bar dataKey="streaming" fill="#8B6A4B" radius={[3, 3, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </DashboardLayout>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}