"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsPageData } from "@/lib/hooks/useAnalytics";

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDateFull(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Platform configs ────────────────────────────────────────── */
const STREAM_PLATFORMS: { id: string; label: string; color: string }[] = [
  { id: "spotify",    label: "Spotify",      color: "#1db954" },
  { id: "appleMusic", label: "Apple Music",  color: "#fc3c44" },
  { id: "audiomack",  label: "Audiomack",    color: "#f2770b" },
  { id: "youtube",    label: "YouTube",      color: "#ff0000" },
  { id: "deezer",     label: "Deezer",       color: "#a238ff" },
  { id: "amazon",     label: "Amazon Music", color: "#00a8e1" },
  { id: "tidal",      label: "Tidal",        color: "#2d8df4" },
  { id: "boomplay",   label: "Boomplay",     color: "#e6294b" },
];

const SOCIAL_PLATFORMS: { id: string; label: string; color: string }[] = [
  { id: "tiktok",    label: "TikTok",    color: "#69c9d0" },
  { id: "instagram", label: "Instagram", color: "#e1306c" },
  { id: "facebook",  label: "Facebook",  color: "#1877f2" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2" },
  { id: "youtube",   label: "YouTube",   color: "#ff0000" },
];

/* ─── Dark chart tooltip ──────────────────────────────────────── */
function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A0808] rounded-xl border border-white/[0.08] shadow-xl p-3">
      <p className="font-body text-white/50 text-[10px] mb-0.5">{label ? fmtDate(label) : ""}</p>
      <p className="font-heading text-white text-sm font-bold">{fmt(payload[0].value)}</p>
      {payload[0].name && <p className="font-body text-white/40 text-[10px]">{payload[0].name}</p>}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────────── */
function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
        {icon}
      </div>
      <p className="font-body text-white/40 text-sm">{title}</p>
      {sub && <p className="font-body text-white/20 text-xs text-center max-w-xs">{sub}</p>}
    </div>
  );
}

/* ─── Stat row (Latest/Peak/Avg) ─────────────────────────────── */
function StatRow({ items, dataKey }: { items: Record<string, unknown>[]; dataKey: string }) {
  if (!items.length) return null;
  const vals = items.map((d) => d[dataKey]).filter((v) => v != null) as number[];
  if (!vals.length) return null;
  const latest = vals[vals.length - 1];
  const peak = Math.max(...vals);
  const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2">
      {([ { label: "Latest", v: latest }, { label: "Peak", v: peak }, { label: "Avg", v: avg }] as const).map(({ label, v }) => (
        <div key={label} className="text-center">
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
          <p className="font-heading text-white text-sm font-bold">{fmt(v)}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  TRENDS VIEW — per-platform stream history area chart           */
/* ═══════════════════════════════════════════════════════════════ */
export function TrendsView({ data }: { data: AnalyticsPageData | null }) {
  const platforms = data?.streamHistoryByPlatform ?? {};
  const availableIds = STREAM_PLATFORMS.filter((p) => platforms[p.id]?.length);
  const [active, setActive] = useState(availableIds[0]?.id ?? "spotify");

  const pConfig = STREAM_PLATFORMS.find((p) => p.id === active);
  const chartData = platforms[active] ?? [];
  const color = pConfig?.color ?? "#C30100";

  if (availableIds.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/></svg>}
          title="No streaming trends yet"
          sub="Stream history will appear once Soundcharts has crawled this artist across platforms."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex flex-col gap-2 mb-4">
        <p className="font-body text-green-400 text-xs uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Streaming Trends
        </p>
        <p className="font-body text-white/40 text-xs">Platform listener history</p>
      </div>

      {/* Platform switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: "none" }}>
        {STREAM_PLATFORMS.filter((p) => platforms[p.id]?.length).map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all border whitespace-nowrap flex-shrink-0",
              active === p.id
                ? "text-white border-transparent"
                : "text-white/40 border-white/[0.06] bg-white/[0.02] hover:text-white/60 hover:border-white/10",
            ].join(" ")}
            style={active === p.id ? { background: p.color, borderColor: p.color } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-56">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={fmtDate}
                axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => fmt(v)} width={36} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="value" name="Listeners"
                stroke={color} fill="url(#trendGrad)" strokeWidth={2}
                dot={false} activeDot={{ r: 3, fill: color, stroke: "#180F0F", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title={`No data for ${pConfig?.label ?? ""}`}
            sub="Try a different platform"
          />
        )}
      </div>

      <StatRow items={chartData} dataKey="value" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  CHARTS VIEW — chart entry positions                           */
/* ═══════════════════════════════════════════════════════════════ */
export function ChartsView({ data }: { data: AnalyticsPageData | null }) {
  const entries = data?.chartEntries ?? [];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          title="No chart positions"
          sub="Chart entries will appear once your music is tracked on platform charts."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-body text-white text-sm font-medium">Chart Positions</p>
          <p className="font-body text-white/40 text-xs mt-0.5">{entries.length} active entries</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {entries.map((c, i) => {
          const up = c.rankDiff != null && c.rankDiff < 0;
          const down = c.rankDiff != null && c.rankDiff > 0;
          return (
            <div key={i}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all">
              {/* Rank badge */}
              <div className={[
                "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-heading font-bold flex-shrink-0",
                c.rank <= 10 ? "bg-[#C30100] text-white"
                  : c.rank <= 50 ? "bg-[#C30100]/30 text-[#C30100]"
                    : "bg-white/[0.06] text-white/40",
              ].join(" ")}>
                #{c.rank}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-body text-white text-sm font-medium truncate">
                  {c.chartName ?? c.chart?.name ?? "Chart"}
                </p>
                <p className="font-body text-white/40 text-xs mt-0.5 truncate">
                  {c.platformName ?? c.platform ?? ""}{c.date ? ` · ${fmtDateFull(c.date)}` : ""}
                </p>
              </div>

              {c.rankDiff != null && (
                <span className={[
                  "flex items-center gap-1 text-xs font-body font-medium px-2 py-1 rounded-full flex-shrink-0",
                  up ? "text-green-400 bg-green-400/10"
                    : down ? "text-[#C30100] bg-[#C30100]/10"
                      : "text-white/30 bg-white/[0.04]",
                ].join(" ")}>
                  {up ? "▲" : down ? "▼" : "–"}
                  {c.rankDiff !== 0 ? Math.abs(c.rankDiff) : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PLAYLISTS VIEW — playlist placements                          */
/* ═══════════════════════════════════════════════════════════════ */
export function PlaylistsView({ data }: { data: AnalyticsPageData | null }) {
  const playlists = data?.playlistEntries ?? [];

  if (playlists.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>}
          title="No active playlists"
          sub="Playlist placements update daily once your music is pitched."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-body text-white text-sm font-medium">Playlist Placements</p>
          <p className="font-body text-white/40 text-xs mt-0.5">{playlists.length} active</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {playlists.map((p, i) => (
          <div key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all">
            {/* Playlist art */}
            {p.playlist?.imageUrl ? (
              <img src={p.playlist.imageUrl} alt={p.playlist.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                  <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-sm font-medium truncate">
                {p.playlist?.name ?? "Playlist"}
              </p>
              <p className="font-body text-white/40 text-xs mt-0.5">
                <span className="capitalize">{p.platform}</span>
                {p.playlist?.followersCount != null && (
                  <span className="ml-1 text-white/25">· {fmt(p.playlist.followersCount)} followers</span>
                )}
              </p>
            </div>

            {p.position != null && (
              <span className="text-xs font-body font-medium px-2.5 py-1 bg-[#C30100]/10 text-[#C30100] rounded-full border border-[#C30100]/20 flex-shrink-0">
                #{p.position}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  RADIO VIEW — radio spins                                      */
/* ═══════════════════════════════════════════════════════════════ */
const FLAG_BASE = "https://flagicons.lipis.dev/flags/4x3";

export function RadioView({ data }: { data: AnalyticsPageData | null }) {
  const spins = data?.radioSpins ?? [];

  if (spins.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>}
          title="No radio spins recorded"
          sub="Radio broadcast data populates over time as stations add your music."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-body text-white text-sm font-medium">Radio Airplay</p>
          <p className="font-body text-white/40 text-xs mt-0.5">{spins.length} recent spins</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {spins.map((r, i) => (
          <div key={i}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all">
            {/* Radio icon */}
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
                <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-sm font-medium truncate">
                {r.stationName ?? r.station?.name ?? "Radio Station"}
              </p>
              <p className="font-body text-white/40 text-xs mt-0.5">
                {r.country && (
                  <>
                    <img
                      src={`${FLAG_BASE}/${r.country.toLowerCase()}.svg`}
                      alt={r.country}
                      className="w-3 h-2 rounded inline-block mr-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    {r.country}
                  </>
                )}
                {r.date ? ` · ${fmtDateFull(r.date)}` : ""}
              </p>
            </div>

            {r.spinsCount != null && (
              <span className="text-xs font-heading font-bold text-white/50 flex-shrink-0 bg-white/[0.06] px-2.5 py-1 rounded-lg">
                {r.spinsCount}x
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  SOCIALS VIEW — per-platform social growth chart               */
/* ═══════════════════════════════════════════════════════════════ */
export function SocialsView({ data }: { data: AnalyticsPageData | null }) {
  const platforms = data?.socialHistoryByPlatform ?? {};
  const availableIds = SOCIAL_PLATFORMS.filter((p) => platforms[p.id]?.length);
  const [active, setActive] = useState(availableIds[0]?.id ?? "instagram");

  const pConfig = SOCIAL_PLATFORMS.find((p) => p.id === active);
  const rawData = platforms[active] ?? [];
  const color = pConfig?.color ?? "#C30100";

  // Metric selector
  const METRICS = [
    { key: "followerCount", label: "Followers" },
    { key: "likeCount", label: "Likes" },
    { key: "postCount", label: "Posts" },
    { key: "viewCount", label: "Views" },
  ] as const;

  const availableMetrics = METRICS.filter((m) => rawData.some((d) => d[m.key] != null));
  const [activeMetric, setActiveMetric] = useState(availableMetrics[0]?.key ?? "followerCount");

  const chartData = rawData
    .filter((d) => d[activeMetric] != null)
    .map((d) => ({ date: d.date, value: d[activeMetric] as number }));

  if (availableIds.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <EmptyState
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M17 2h4v4m0 0v4m0-4h-4M3 15v4a2 2 0 002 2h4m-6-6h16"/></svg>}
          title="No social data yet"
          sub="Social media tracking will appear once Soundcharts monitors your profiles."
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
      <div className="flex flex-col gap-2 mb-4">
        <p className="font-body text-white text-sm font-medium">Social Growth</p>
        <p className="font-body text-white/40 text-xs">Follower &amp; engagement trends</p>
      </div>

      {/* Platform switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: "none" }}>
        {SOCIAL_PLATFORMS.filter((p) => platforms[p.id]?.length).map((p) => (
          <button
            key={p.id}
            onClick={() => setActive(p.id)}
            className={[
              "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all border whitespace-nowrap flex-shrink-0",
              active === p.id
                ? "text-white border-transparent"
                : "text-white/40 border-white/[0.06] bg-white/[0.02] hover:text-white/60 hover:border-white/10",
            ].join(" ")}
            style={active === p.id ? { background: p.color, borderColor: p.color } : {}}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Metric selector */}
      {availableMetrics.length > 1 && rawData.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {availableMetrics.map((m) => (
            <button key={m.key} onClick={() => setActiveMetric(m.key)}
              className={[
                "px-2.5 py-1 rounded-md text-[10px] font-body font-medium transition-all whitespace-nowrap flex-shrink-0",
                activeMetric === m.key ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50",
              ].join(" ")}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="h-56">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="socialGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={fmtDate}
                axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => fmt(v)} width={36} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="value" name={METRICS.find((m) => m.key === activeMetric)?.label ?? activeMetric}
                stroke={color} fill="url(#socialGrad)" strokeWidth={2}
                dot={false} activeDot={{ r: 3, fill: color, stroke: "#180F0F", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            title={`No data for ${pConfig?.label ?? ""}`}
            sub="Try a different platform"
          />
        )}
      </div>

      <StatRow items={chartData} dataKey="value" />
    </div>
  );
}
