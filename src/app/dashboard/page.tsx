"use client";

import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/lib/hooks/useDashboard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  // While loading, use empty fallbacks so layout never blanks
  const { stats, wallet, recentReleases, ayoInsight, analyticsChart, features } =
    data ?? {
      stats: { activeReleases: 0, totalEarnings: 0 },
      wallet: { totalEarnings: 0, period: "", streams: 0, avgPerStream: 0 },
      recentReleases: [],
      ayoInsight: { message: "" },
      analyticsChart: { months: [], streams: [], revenue: [] },
      features: [],
    };

  const userName = data?.user?.name ?? "VJazzy";

  return (
    <DashboardLayout userName={isLoading ? "..." : userName}>
      <div className="flex flex-col gap-5">

        {/* Ask Ayo bar */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-3">
            {/*
             * Drop your Figma export here:
             * /public/icons/ayo-icon.svg
             */}
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 relative">
              <Image
                src="/images/ayo.svg"
                alt="Ayo AI"
                width={20}
                height={20}
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-white text-sm uppercase tracking-wide">Ask AYO</span>
              <span className="font-body text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2 py-0.5 uppercase tracking-wider">AI Insight</span>
            </div>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">{ayoInsight.message}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Draft a pitch", icon: <PitchIcon /> },
              { label: "Analyze performance", icon: <AnalyzeIcon /> },
              { label: "Generate artwork", icon: <ArtworkIcon /> },
              { label: "Ask Ayo anything", icon: <AskIcon /> },
            ].map((action) => (
              <Link href='/dashboard/ayo'
                key={action.label}
                className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] rounded-full px-4 py-2 transition-colors"
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats row + Artist Spotlight */}
        <div className="grid grid-cols-5 gap-4">
          {/* Left stats column — 60% (3 of 5) */}
          <div className="col-span-3 grid grid-rows-2 gap-4">
            {/* Active Releases */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-white/60 text-sm">Active Releases</p>
                <button className="text-white/30 hover:text-white transition-colors"><ShareIcon /></button>
              </div>
              <p className="font-heading text-white text-4xl font-bold">{stats.activeReleases}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="font-body text-white/40 text-xs">On all platforms</p>
              </div>
              {/* Red glow */}
              <div aria-hidden className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(195,1,0,0.8) 0%, transparent 70%)", filter: "blur(20px)" }} />
            </div>

            {/* Total Earnings */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-white/60 text-sm">Total Earnings</p>
                <button className="text-white/30 hover:text-white transition-colors"><DollarIcon /></button>
              </div>
              <p className="font-heading text-white text-3xl font-bold">
                ${stats.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Artist Spotlight — image left, text right */}
          <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-[#180F0F] overflow-hidden flex flex-row">
            {/* Left: image, takes ~55% width */}
             <div className="relative w-[55%] shrink-0 min-h-[220px]">              <Image
                src="/images/into-the-night.svg"
                alt="Artist spotlight"
                fill
                className="object-cover object-center"
              />
            </div>
            {/* Right: text + button */}
            <div className="flex flex-col justify-center items-start px-5 py-6 flex-1">
              <p className="font-heading text-white uppercase text-sm tracking-wide leading-tight mb-5">
                Artist Spotlight of the Week
              </p>
              <button className="font-heading text-white uppercase text-xs tracking-widest border border-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#C30100] transition-all">
                Read Article
              </button>
            </div>
          </div>
        </div>

        {/* Recent Releases + Wallet */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent Releases */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-white text-sm font-medium">Recent Releases</p>
              <Link href="/dashboard/music" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                View All <span>→</span>
              </Link>
            </div>
            <div className="flex gap-3">
              {recentReleases.map((release) => (
                <div key={release.id} className="relative flex-1 aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer">
                  {/* Cover art */}
                  <Image
                    src={release.cover}
                    alt={release.title}
                    fill
                    className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(14,8,8,0.95) 0%, transparent 55%)" }} />
                  {/* Live pill — top center */}
                  {release.status === "live" && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                      <span className="font-body text-white text-[10px]">Live</span>
                    </div>
                  )}
                  {/* Title + artist */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="font-heading text-white uppercase text-xs tracking-wide truncate">{release.title}</p>
                    <p className="font-body text-white/50 text-[11px] truncate mt-0.5">{release.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="font-body text-white text-sm font-medium">My Wallet</p>
              <Link href="/dashboard/earnings" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                Manage <span>→</span>
              </Link>
            </div>

            {/* Inner wallet card — flex-1 so it fills remaining height */}
            <div className="flex-1 rounded-xl bg-[#0E0808] border border-white/[0.06] p-5 relative overflow-hidden flex flex-col justify-between">
              {/* Red glow — bottom right */}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 opacity-60"
                style={{
                  background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.55) 0%, transparent 65%)",
                  filter: "blur(20px)",
                }}
              />
              {/* Top: label + amount + meta */}
              <div className="relative z-10">
                <p className="font-body text-white/60 text-sm mb-2">Total Earnings</p>
                <p className="font-heading text-white text-4xl font-bold mb-3">
                  ${wallet.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="font-body text-white/40 text-sm">
                  {wallet.period} &nbsp;·&nbsp; {wallet.streams} streams &nbsp;·&nbsp; Avg ${wallet.avgPerStream.toFixed(2)}/stream
                </p>
              </div>
              {/* Bottom: Withdraw button */}
              <button className="relative z-10 w-full mt-5 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-3.5 transition-all duration-300">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-body text-white text-sm font-medium">Performance Analytics</p>
            <Link href="/dashboard/analytics" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
              Detailed Analytics <span>→</span>
            </Link>
          </div>

          {/* Platform tabs */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-3">
              {[
                { label: "Spotify", active: false },
                { label: "Youtube Music", active: true },
                { label: "Apple Music", active: false },
              ].map((p) => (
                <button
                  key={p.label}
                  className={[
                    "font-body text-xs rounded-full px-3 py-1.5 border transition-colors",
                    p.active
                      ? "border-[#C30100] bg-[#C30100]/20 text-white"
                      : "border-white/10 text-white/50 hover:border-white/25",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#C30100]" />
                <span className="font-body text-white/50 text-xs">Streams</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#8B6A4B]" />
                <span className="font-body text-white/50 text-xs">Revenue</span>
              </div>
              <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 font-body text-white/50 text-xs outline-none">
                <option>March</option>
                <option>April</option>
              </select>
            </div>
          </div>

          {/* Chart — SVG sparkline */}
          <SimpleChart data={analyticsChart} />
        </div>

        {/* Features grid */}
        <div>
          <p className="font-body text-white text-sm font-medium mb-4">Features</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map((f) => (
              <div key={f.id} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 hover:border-white/[0.12] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center mb-3">
                  <FeatureIcon id={f.icon} />
                </div>
                <p className="font-body text-white text-xs font-semibold mb-1">{f.title}</p>
                <p className="font-body text-white/40 text-[11px] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

/* ─── Simple SVG chart ────────────────────────────────────────── */
function SimpleChart({ data }: { data: { months: string[]; streams: number[]; revenue: number[] } }) {
  const W = 800; const H = 160; const pad = 20;
  const maxVal = Math.max(...data.streams, ...data.revenue);

  const toPath = (vals: number[]) => {
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = H - pad - (v / maxVal) * (H - pad * 2);
      return `${x},${y}`;
    });
    return `M${pts.join(" L")}`;
  };

  const streamsPath = toPath(data.streams);
  const revPath = toPath(data.revenue);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = H - pad - (v / 100) * (H - pad * 2);
          return (
            <g key={v}>
              <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={pad - 4} y={y + 4} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="end">{v}</text>
            </g>
          );
        })}
        {/* Revenue area */}
        <path d={`${revPath} L${W - pad},${H - pad} L${pad},${H - pad} Z`} fill="rgba(139,106,75,0.15)" />
        <path d={revPath} fill="none" stroke="#8B6A4B" strokeWidth="2" />
        {/* Streams area */}
        <path d={`${streamsPath} L${W - pad},${H - pad} L${pad},${H - pad} Z`} fill="rgba(195,1,0,0.15)" />
        <path d={streamsPath} fill="none" stroke="#C30100" strokeWidth="2.5" />
        {/* Month labels */}
        {data.months.map((m, i) => {
          const x = pad + (i / (data.months.length - 1)) * (W - pad * 2);
          return <text key={m} x={x} y={H + 20} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="middle">{m}</text>;
        })}
      </svg>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function PitchIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>; }
function AnalyzeIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function ArtworkIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10"/></svg>; }
function AskIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function ShareIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function DollarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function FeatureIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    report: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    pitch: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>,
    ayo: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#C30100]"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    splitr: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="5" width="4" height="16"/></svg>,
    amplify: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>,
  };
  return <span className="text-white/50">{icons[id] ?? null}</span>;
}