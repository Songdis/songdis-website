// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { MOCK_ANALYTICS, VIEW_OPTIONS, type AnalyticsView } from "@/app/mock/analytics";
// import { useAnalytics, type AnalyticsPageData } from "@/lib/hooks/useAnalytics";
// import {
//   AreaChart, Area, BarChart, Bar,
//   XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell,
// } from "recharts";

// type Period = "30D" | "60D" | "90D" | "1YR" | "Custom Range";
// const PERIODS: Period[] = ["30D", "60D", "90D", "1YR", "Custom Range"];

// /* ─── Shared stat card ────────────────────────────────────────── */
// function StatCard({ label, value, sub, icon, highlight, badge }: {
//   label: string; value: string; sub?: string;
//   icon: string; highlight?: boolean; badge?: string;
// }) {
//   return (
//     <div className={["rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
//       highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
//       <div className="flex items-center justify-between">
//         <p className="font-body text-white/60 text-xs">{label}</p>
//         <div className="w-12 h-12 rounded-lg flex items-center justify-center">
//           <Image src={icon} alt={label} width={66} height={66} unoptimized />
//         </div>
//       </div>
//       <div className="flex items-end gap-2">
//         <p className="font-heading text-white text-2xl font-bold">{value}</p>
//         {badge && (
//           <span className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
//             style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>{badge}</span>
//         )}
//       </div>
//       {sub && <p className="font-body text-white/30 text-[11px]">{sub}</p>}
//       {highlight && (
//         <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
//           style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
//       )}
//     </div>
//   );
// }

// /* ─── Sparkline ───────────────────────────────────────────────── */
// function Sparkline({ data, color }: { data: number[]; color: string }) {
//   const chartData = data.map((v, i) => ({ i, v }));
//   return (
//     <ResponsiveContainer width="100%" height={40}>
//       <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
//         <defs>
//           <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor={color} stopOpacity={0.3} />
//             <stop offset="95%" stopColor={color} stopOpacity={0} />
//           </linearGradient>
//         </defs>
//         <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
//           fill={`url(#sg-${color.replace("#","")})`} dot={false} />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// }

// /* ─── Streams chart ───────────────────────────────────────────── */
// function StreamsChart({ months, streams, revenue, height = 160 }: {
//   months: string[]; streams: number[]; revenue?: number[]; height?: number;
// }) {
//   const data = months.map((m, i) => ({ month: m, streams: streams[i], revenue: revenue?.[i] ?? 0 }));
//   return (
//     <ResponsiveContainer width="100%" height={height}>
//       <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
//         <defs>
//           <linearGradient id="streamsGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#C30100" stopOpacity={0.25} />
//             <stop offset="95%" stopColor="#C30100" stopOpacity={0} />
//           </linearGradient>
//           <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#8B6A4B" stopOpacity={0.25} />
//             <stop offset="95%" stopColor="#8B6A4B" stopOpacity={0} />
//           </linearGradient>
//         </defs>
//         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
//         <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
//         {revenue && <Area type="monotone" dataKey="revenue" stroke="#8B6A4B" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />}
//         <Area type="monotone" dataKey="streams" stroke="#C30100" strokeWidth={2.5} fill="url(#streamsGrad)" dot={false} />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// }

// /* ─── Empty / coming soon ─────────────────────────────────────── */
// function ComingSoonView({ title }: { title: string }) {
//   return (
//     <div className="rounded-2xl border border-dashed border-white/[0.06] bg-[#180F0F] p-5">
//       <p className="font-body text-white text-sm font-medium mb-6">{title}</p>
//       <div className="flex flex-col items-center justify-center py-12 gap-3">
//         <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15">
//           <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
//         </svg>
//         <p className="font-body text-white/30 text-sm">No data available</p>
//         <p className="font-body text-white/20 text-xs text-center max-w-xs">This section will populate once the backend analytics endpoint is available.</p>
//       </div>
//     </div>
//   );
// }

// /* ─── Overview view ───────────────────────────────────────────── */
// function OverviewView({ data }: { data: AnalyticsPageData | null }) {
//   const streamsOverTime = data?.streamsOverTime ?? { months: [], streams: [], revenue: [] };
//   const topSongs = data?.topReleases ?? [];
//   const platformBreakdown = data?.platformBreakdown ?? [];
//   const barData = platformBreakdown.map(p => ({ name: p.name, streams: p.streams }));

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Monthly listeners */}
//       <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//         <div className="flex items-center justify-between mb-3">
//           <p className="font-body text-green-400 text-xs uppercase tracking-widest flex items-center gap-1.5">
//             <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Monthly Listeners
//           </p>
//           {data?.monthlyListeners.available && data.monthlyListeners.change && (
//             <span className="font-body text-xs rounded-full px-3 py-1" style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
//               {data.monthlyListeners.change}
//             </span>
//           )}
//         </div>
//         {data?.monthlyListeners.available ? (
//           <div>
//             <p className="font-heading text-white text-4xl font-bold">{data.monthlyListeners.value}</p>
//             <p className="font-body text-white/40 text-xs mt-1">{data.monthlyListeners.platform} · {data.monthlyListeners.period}</p>
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center py-4 gap-1">
//             <p className="font-body text-white/30 text-sm">No data available</p>
//             <p className="font-body text-white/20 text-xs">Monthly listener data will appear once Soundcharts integration is active.</p>
//           </div>
//         )}
//       </div>

//       {/* Streams over time */}
//       <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//         <div className="flex items-center justify-between mb-4">
//           <p className="font-body text-white text-sm font-medium">Streams Over Time</p>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#C30100]" /><span className="font-body text-white/50 text-xs">Streams</span></div>
//               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8B6A4B]" /><span className="font-body text-white/50 text-xs">Revenue</span></div>
//             </div>
//           </div>
//         </div>
//         <StreamsChart months={streamsOverTime.months} streams={streamsOverTime.streams} revenue={streamsOverTime.revenue} height={180} />
//       </div>

//       {/* Top Songs + Platform Breakdown */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//           <div className="flex items-center justify-between mb-1">
//             <p className="font-body text-white text-sm font-medium">Top Songs</p>
//             <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">View All <span>→</span></button>
//           </div>
//           <div className="flex flex-col gap-2">
//             {topSongs.length === 0 ? (
//               <p className="font-body text-white/30 text-sm text-center py-6">No data available</p>
//             ) : topSongs.map((song) => (
//               <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
//                 <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
//                 {/* Top Songs cover — API doesn't return images, always show music note fallback */}
//                 <div className="w-8 h-8 rounded-lg bg-[#0E0808] border border-white/[0.06] shrink-0 flex items-center justify-center">
//                   {song.cover ? (
//                     <div className="relative w-full h-full overflow-hidden rounded-lg">
//                       <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
//                     </div>
//                   ) : (
//                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
//                       <path d="M9 18V5l12-2v13"/>
//                       <circle cx="6" cy="18" r="3"/>
//                       <circle cx="18" cy="16" r="3"/>
//                     </svg>
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-body text-white text-xs truncate">{song.title}</p>
//                   <p className="font-body text-white/40 text-[10px] truncate">{song.artist}</p>
//                 </div>
//                 <p className="font-body text-white/60 text-xs shrink-0">{song.streams}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//           <div className="flex items-center justify-between mb-4">
//             <p className="font-body text-white text-sm font-medium">Platform Breakdown</p>
//             <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">All Platforms <span>→</span></button>
//           </div>
//           {barData.length === 0 ? (
//             <p className="font-body text-white/30 text-sm text-center py-10">No data available</p>
//           ) : (
//             <ResponsiveContainer width="100%" height={220}>
//               <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
//                 <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
//                 <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
//                 <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
//                 <Bar dataKey="streams" radius={[4, 4, 0, 0]}>
//                   {barData.map((_, i) => <Cell key={i} fill={platformBreakdown[i]?.color ?? "#C30100"} />)}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function TracksView({ data }: { data: AnalyticsPageData | null }) {
//   const topSongs = data?.topReleases ?? [];
//   if (topSongs.length === 0) return <ComingSoonView title="Top Tracks" />;
//   return (
//     <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//       <p className="font-body text-white text-sm font-medium mb-4">Top Tracks</p>
//       <div className="flex flex-col gap-2">
//         {topSongs.map((song) => (
//           <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
//             <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
//             <div className="w-8 h-8 rounded-lg bg-[#0E0808] border border-white/[0.06] shrink-0 flex items-center justify-center overflow-hidden">
//               {song.cover ? (
//                 <div className="relative w-full h-full">
//                   <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
//                 </div>
//               ) : (
//                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
//                   <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
//                 </svg>
//               )}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-body text-white text-xs truncate">{song.title}</p>
//               <p className="font-body text-white/40 text-[10px] truncate">{song.artist}</p>
//             </div>
//             <p className="font-body text-white/60 text-xs shrink-0">{song.streams}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function PlatformsView({ data }: { data: AnalyticsPageData | null }) {
//   const platforms = data?.platformBreakdown ?? [];
//   if (platforms.length === 0) return <ComingSoonView title="Streams by Platform" />;
//   const total = platforms.reduce((s, p) => s + p.streams, 0);
//   return (
//     <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//       <p className="font-body text-white text-sm font-medium mb-4">Streams by Platform</p>
//       <div className="flex flex-col gap-3">
//         {platforms.map((p, i) => (
//           <div key={i} className="flex items-center gap-3">
//             <p className="font-body text-white/60 text-xs w-28 truncate shrink-0">{p.name}</p>
//             <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
//               <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (p.streams / total) * 100 : 0}%`, backgroundColor: p.color }} />
//             </div>
//             <p className="font-body text-white/50 text-xs w-16 text-right shrink-0">
//               {p.streams >= 1000 ? `${(p.streams / 1000).toFixed(1)}K` : p.streams}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function GeographyView({ data }: { data: AnalyticsPageData | null }) {
//   const geo = data?.geographic ?? [];
//   if (geo.length === 0) return <ComingSoonView title="Streams by Geography" />;
//   return (
//     <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//       <p className="font-body text-white text-sm font-medium mb-4">Streams by Geography</p>
//       <div className="flex flex-col gap-3">
//         {geo.map((g, i) => (
//           <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
//             <span className="text-base shrink-0">{g.flag}</span>
//             <p className="font-body text-white text-xs flex-1 truncate">{g.country}</p>
//             <div className="flex items-center gap-2 shrink-0">
//               <p className="font-body text-white/60 text-xs">{g.streams}</p>
//               {g.percentage > 0 && (
//                 <span className="font-body text-[10px] text-white/30">{g.percentage}%</span>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// function TrendsView()    { return <ComingSoonView title="Streaming Trends" />; }
// function ChartsView()    { return <ComingSoonView title="Chart Positions" />; }
// function PlaylistsView() { return <ComingSoonView title="Playlist Placements" />; }
// function RadioView()     { return <ComingSoonView title="Radio Appearances" />; }
// function SocialsView()   { return <ComingSoonView title="Social Media" />; }

// /* ─── View dropdown ───────────────────────────────────────────── */
// function ViewDropdown({ value, onChange }: { value: AnalyticsView; onChange: (v: AnalyticsView) => void }) {
//   const [open, setOpen] = useState(false);
//   const current = VIEW_OPTIONS.find((o: { label: string; value: AnalyticsView; live?: boolean }) => o.value === value);
//   return (
//     <div className="relative">
//       <button onClick={() => setOpen(!open)}
//         className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/10 bg-[#0E0808] rounded-lg px-3 py-2 hover:border-white/20 transition-colors min-w-[120px] justify-between">
//         <span>{current?.label}{current?.live ? " (Live)" : ""}</span>
//         <ChevronIcon />
//       </button>
//       {open && (
//         <>
//           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
//           <div className="absolute right-0 top-full mt-1 z-20 bg-[#1A0808] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
//             {VIEW_OPTIONS.map((opt: { label: string; value: AnalyticsView; live?: boolean }) => (
//               <button key={opt.value}
//                 onClick={() => { onChange(opt.value); setOpen(false); }}
//                 className={["w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-white/[0.05] flex items-center justify-between gap-2",
//                   opt.value === value ? "text-white" : "text-white/60"].join(" ")}>
//                 {opt.label}
//                 {opt.live && <span className="font-body text-[9px] text-orange-400 bg-orange-400/10 rounded-full px-1.5 py-0.5">Live</span>}
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// /* ─── Page ────────────────────────────────────────────────────── */
// export default function AnalyticsPage() {
//   const [period, setPeriod] = useState<Period>("90D");
//   const [view, setView] = useState<AnalyticsView>("overview");
//   // DES-006: custom date range state
//   const [customStart, setCustomStart] = useState("");
//   const [customEnd, setCustomEnd] = useState("");

//   // DES-006: pass custom dates to hook so it fires with the right range
//   const { data, isLoading, refresh } = useAnalytics(period, customStart, customEnd);

//   const s = data?.stats;
//   const mock = MOCK_ANALYTICS;

//   const renderView = () => {
//     switch (view) {
//       case "overview":  return <OverviewView data={data} />;
//       case "tracks":    return <TracksView data={data} />;
//       case "platforms": return <PlatformsView data={data} />;
//       case "geography": return <GeographyView data={data} />;
//       case "trends":    return <TrendsView />;
//       case "charts":    return <ChartsView />;
//       case "playlists": return <PlaylistsView />;
//       case "radio":     return <RadioView />;
//       case "socials":   return <SocialsView />;
//     }
//   };

//   return (
//     <DashboardLayout pageTitle="Analytics" customCta={{ label: "Refresh", onClick: refresh }}>
//       <div className="flex flex-col gap-5">

//         {/* Stat rows */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           <StatCard label="Total Streams" value={isLoading ? "..." : (s?.totalStreams.value ?? "0")} sub={s?.totalStreams.sub ?? "All DSPs"} icon={mock.totalStreams.icon} highlight badge={s?.totalStreams.change || undefined} />
//           <StatCard label="Avg / Day"     value={isLoading ? "..." : (s?.avgPerDay.value ?? "0")}    sub={s?.avgPerDay.sub ?? "Per day"}   icon={mock.avgPerDay.icon} />
//           <StatCard label="Releases"      value={isLoading ? "..." : (s?.releases.value ?? "0")}     sub={s?.releases.sub ?? "With data"}  icon={mock.releases.icon} />
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           <StatCard label="Countries"  value={isLoading ? "..." : (s?.countries.value ?? "0")}  sub={s?.countries.sub ?? "Territories"} icon={mock.countries.icon} />
//           <StatCard label="Platforms"  value={isLoading ? "..." : (s?.platforms.value ?? "0")}  sub={s?.platforms.sub ?? "DSPs"}        icon={mock.platforms.icon} />
//           <StatCard label="Playlist"   value={isLoading ? "..." : (s?.playlists.value ?? "0")}  sub={s?.playlists.sub ?? "Active"}      icon={mock.playlists.icon} />
//         </div>

//         {/* Period + view controls */}
//         <div className="flex flex-col gap-3">
//           <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
//             {/* Period buttons scroll horizontally — isolated from ViewDropdown so dropdown isn't clipped */}
//             <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
//               {PERIODS.map((p) => (
//                 <button key={p} onClick={() => setPeriod(p)}
//                   className={["font-body text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap",
//                     period === p ? "text-white border-b-2 border-[#C30100]" : "text-white/40 hover:text-white/70"].join(" ")}>
//                   {p}
//                 </button>
//               ))}
//             </div>
//             {/* ViewDropdown outside the overflow wrapper so the menu isn't clipped */}
//             <div className="shrink-0 ml-2">
//               <ViewDropdown value={view} onChange={setView} />
//             </div>
//           </div>

//           {/* DES-006: Custom date range picker */}
//           {period === "Custom Range" && (
//             <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3 flex-wrap">
//               <div className="flex items-center gap-2">
//                 <label className="font-body text-white/50 text-xs whitespace-nowrap">From</label>
//                 <input
//                   type="date"
//                   value={customStart}
//                   onChange={(e) => setCustomStart(e.target.value)}
//                   className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
//                 />
//               </div>
//               <div className="flex items-center gap-2">
//                 <label className="font-body text-white/50 text-xs whitespace-nowrap">To</label>
//                 <input
//                   type="date"
//                   value={customEnd}
//                   onChange={(e) => setCustomEnd(e.target.value)}
//                   className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
//                 />
//               </div>
//               <button
//                 onClick={refresh}
//                 disabled={!customStart || !customEnd}
//                 className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-1.5 transition-colors disabled:opacity-40"
//               >
//                 Apply
//               </button>
//               {(!customStart || !customEnd) && (
//                 <p className="font-body text-white/30 text-xs">Select both dates then apply</p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* View content */}
//         {renderView()}

//       </div>
//     </DashboardLayout>
//   );
// }

// function ChevronIcon() {
//   return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
// }


"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { MOCK_ANALYTICS, VIEW_OPTIONS, type AnalyticsView } from "@/app/mock/analytics";
import { useAnalytics, type AnalyticsPageData } from "@/lib/hooks/useAnalytics";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendsView as TrendsSC,
  ChartsView as ChartsSC,
  RadioView as RadioSC,
  SocialsView as SocialsSC,
} from "./soundcharts-views";

type Period = "30D" | "60D" | "90D" | "1YR" | "Custom Range";
const PERIODS: Period[] = ["30D", "60D", "90D", "1YR", "Custom Range"];

/* ─── Shared stat card ────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, highlight, badge }: {
  label: string; value: string; sub?: string;
  icon: string; highlight?: boolean; badge?: string;
}) {
  return (
    <div className={["rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-12 h-12 rounded-lg bg-white/[0.05] flex items-center justify-center">
          <Image src={icon} alt={label} width={66} height={66} unoptimized />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="font-heading text-white text-2xl font-bold">{value}</p>
        {badge && (
          <span className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
            style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>{badge}</span>
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

/* ─── Sparkline ───────────────────────────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace("#","")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Streams chart ───────────────────────────────────────────── */
function StreamsChart({ months, streams, revenue, height = 160 }: {
  months: string[]; streams: number[]; revenue?: number[]; height?: number;
}) {
  const data = months.map((m, i) => ({ month: m, streams: streams[i], revenue: revenue?.[i] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="streamsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C30100" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#C30100" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B6A4B" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#8B6A4B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
        {revenue && <Area type="monotone" dataKey="revenue" stroke="#8B6A4B" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />}
        <Area type="monotone" dataKey="streams" stroke="#C30100" strokeWidth={2.5} fill="url(#streamsGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Empty / coming soon ─────────────────────────────────────── */
function ComingSoonView({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.06] bg-[#180F0F] p-5">
      <p className="font-body text-white text-sm font-medium mb-6">{title}</p>
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/15">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="font-body text-white/30 text-sm">No data available</p>
        <p className="font-body text-white/20 text-xs text-center max-w-xs">This section will populate once the backend analytics endpoint is available.</p>
      </div>
    </div>
  );
}

/* ─── Overview view ───────────────────────────────────────────── */
function OverviewView({ data }: { data: AnalyticsPageData | null }) {
  const streamsOverTime = data?.streamsOverTime ?? { months: [], streams: [], revenue: [] };
  const topSongs = data?.topReleases ?? [];
  const platformBreakdown = data?.platformBreakdown ?? [];
  const barData = platformBreakdown.map(p => ({ name: p.name, streams: p.streams }));

  return (
    <div className="flex flex-col gap-5">
      {/* Streaming Activity — built from Soundcharts stream_history + audience data */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-green-400 text-xs uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Streaming Activity
          </p>
          {data?.monthlyListeners.available && data.monthlyListeners.change && (
            <span className="font-body text-xs rounded-full px-3 py-1"
              style={{
                color: data.monthlyListeners.change.startsWith("-") ? "#C30100" : "#22c55e",
                backgroundColor: data.monthlyListeners.change.startsWith("-") ? "rgba(195,1,0,0.15)" : "rgba(34,197,94,0.15)",
              }}>
              {data.monthlyListeners.change}
            </span>
          )}
        </div>
        {data?.monthlyListeners.available ? (
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-heading text-white text-4xl font-bold">{data.monthlyListeners.value}</p>
              <p className="font-body text-white/40 text-xs mt-1">{data.monthlyListeners.platform} streams · {data.monthlyListeners.period}</p>
              {data.monthlyListeners.followerCount && (
                <p className="font-body text-white/30 text-[11px] mt-1">
                  {data.monthlyListeners.followerCount} followers
                  {data.monthlyListeners.followerChange && ` (${data.monthlyListeners.followerChange})`}
                </p>
              )}
            </div>
            {data.monthlyListeners.trend.length > 1 && (
              <div className="flex-1 min-w-[120px] max-w-[220px]">
                <Sparkline data={data.monthlyListeners.trend} color="#22c55e" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 gap-1">
            <p className="font-body text-white/30 text-sm">No data available</p>
            <p className="font-body text-white/20 text-xs">Streaming activity will appear once Soundcharts has crawled this artist&apos;s catalog.</p>
          </div>
        )}
      </div>

      {/* Streams over time */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-white text-sm font-medium">Streams Over Time</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#C30100]" /><span className="font-body text-white/50 text-xs">Streams</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#8B6A4B]" /><span className="font-body text-white/50 text-xs">Revenue</span></div>
            </div>
          </div>
        </div>
        <StreamsChart months={streamsOverTime.months} streams={streamsOverTime.streams} revenue={streamsOverTime.revenue} height={180} />
      </div>

      {/* Top Songs + Platform Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-white text-sm font-medium">Top Songs</p>
            <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">View All <span>→</span></button>
          </div>
          <div className="flex flex-col gap-2">
            {topSongs.length === 0 ? (
              <p className="font-body text-white/30 text-sm text-center py-6">No data available</p>
            ) : topSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
                {/* Top Songs cover — API doesn't return images, always show music note fallback */}
                <div className="w-8 h-8 rounded-lg bg-[#0E0808] border border-white/[0.06] shrink-0 flex items-center justify-center">
                  {song.cover ? (
                    <div className="relative w-full h-full overflow-hidden rounded-lg">
                      <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-white text-xs truncate">{song.title}</p>
                  <p className="font-body text-white/40 text-[10px] truncate">{song.artist}</p>
                </div>
                <p className="font-body text-white/60 text-xs shrink-0">{song.streams}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-white text-sm font-medium">Platform Breakdown</p>
            <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">All Platforms <span>→</span></button>
          </div>
          {barData.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-10">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="streams" radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill={platformBreakdown[i]?.color ?? "#C30100"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function TracksView({ data }: { data: AnalyticsPageData | null }) {
  const topSongs = data?.topReleases ?? [];
  if (topSongs.length === 0) return <ComingSoonView title="Top Tracks" />;
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
      <p className="font-body text-white text-sm font-medium mb-4">Top Tracks</p>
      <div className="flex flex-col gap-2">
        {topSongs.map((song) => (
          <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
            <div className="w-8 h-8 rounded-lg bg-[#0E0808] border border-white/[0.06] shrink-0 flex items-center justify-center overflow-hidden">
              {song.cover ? (
                <div className="relative w-full h-full">
                  <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-xs truncate">{song.title}</p>
              <p className="font-body text-white/40 text-[10px] truncate">{song.artist}</p>
            </div>
            <p className="font-body text-white/60 text-xs shrink-0">{song.streams}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformsView({ data }: { data: AnalyticsPageData | null }) {
  const platforms = data?.platformBreakdown ?? [];
  if (platforms.length === 0) return <ComingSoonView title="Streams by Platform" />;
  const total = platforms.reduce((s, p) => s + p.streams, 0);
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
      <p className="font-body text-white text-sm font-medium mb-4">Streams by Platform</p>
      <div className="flex flex-col gap-3">
        {platforms.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <p className="font-body text-white/60 text-xs w-28 truncate shrink-0">{p.name}</p>
            <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${total > 0 ? (p.streams / total) * 100 : 0}%`, backgroundColor: p.color }} />
            </div>
            <p className="font-body text-white/50 text-xs w-16 text-right shrink-0">
              {p.streams >= 1000 ? `${(p.streams / 1000).toFixed(1)}K` : p.streams}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeographyView({ data }: { data: AnalyticsPageData | null }) {
  const geo = data?.geographic ?? [];
  if (geo.length === 0) return <ComingSoonView title="Streams by Geography" />;
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
      <p className="font-body text-white text-sm font-medium mb-4">Streams by Geography</p>
      <div className="flex flex-col gap-3">
        {geo.map((g, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-base shrink-0">{g.flag}</span>
            <p className="font-body text-white text-xs flex-1 truncate">{g.country}</p>
            <div className="flex items-center gap-2 shrink-0">
              <p className="font-body text-white/60 text-xs">{g.streams}</p>
              {g.percentage > 0 && (
                <span className="font-body text-[10px] text-white/30">{g.percentage}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsView({ data }: { data: AnalyticsPageData | null }) {
  return <TrendsSC data={data} />;
}
function ChartsView({ data }: { data: AnalyticsPageData | null }) {
  return <ChartsSC data={data} />;
}
function RadioView({ data }: { data: AnalyticsPageData | null }) {
  return <RadioSC data={data} />;
}
function SocialsView({ data }: { data: AnalyticsPageData | null }) {
  return <SocialsSC data={data} />;
}

/* ─── View dropdown ───────────────────────────────────────────── */
function ViewDropdown({ value, onChange }: { value: AnalyticsView; onChange: (v: AnalyticsView) => void }) {
  const [open, setOpen] = useState(false);
  const current = VIEW_OPTIONS.find((o: { label: string; value: AnalyticsView; live?: boolean }) => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/10 bg-[#0E0808] rounded-lg px-3 py-2 hover:border-white/20 transition-colors min-w-[120px] justify-between">
        <span>{current?.label}{current?.live ? " (Live)" : ""}</span>
        <ChevronIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1A0808] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
            {VIEW_OPTIONS.map((opt: { label: string; value: AnalyticsView; live?: boolean }) => (
              <button key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={["w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-white/[0.05] flex items-center justify-between gap-2",
                  opt.value === value ? "text-white" : "text-white/60"].join(" ")}>
                {opt.label}
                {opt.live && <span className="font-body text-[9px] text-orange-400 bg-orange-400/10 rounded-full px-1.5 py-0.5">Live</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("1YR");
  const [view, setView] = useState<AnalyticsView>("overview");
  // DES-006: custom date range state
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // DES-006: pass custom dates to hook so it fires with the right range
  const { data, isLoading, refresh } = useAnalytics(period, customStart, customEnd);

  const s = data?.stats;
  const mock = MOCK_ANALYTICS;

  const renderView = () => {
    switch (view) {
      case "overview":  return <OverviewView data={data} />;
      case "tracks":    return <TracksView data={data} />;
      case "platforms": return <PlatformsView data={data} />;
      case "geography": return <GeographyView data={data} />;
      case "trends":    return <TrendsView data={data} />;
      case "charts":    return <ChartsView data={data} />;
      case "radio":     return <RadioView data={data} />;
      case "socials":   return <SocialsView data={data} />;
    }
  };

  return (
    <DashboardLayout pageTitle="Analytics" customCta={{ label: "Refresh", onClick: refresh }}>
      <div className="flex flex-col gap-5">

        {/* Stat rows */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Streams" value={isLoading ? "..." : (s?.totalStreams.value ?? "0")} sub={s?.totalStreams.sub ?? "All DSPs"} icon={mock.totalStreams.icon} highlight badge={s?.totalStreams.change || undefined} />
          <StatCard label="Releases"      value={isLoading ? "..." : (s?.releases.value ?? "0")}     sub={s?.releases.sub ?? "With data"}  icon={mock.releases.icon} />
          <StatCard label="Countries"  value={isLoading ? "..." : (s?.countries.value ?? "0")}  sub={s?.countries.sub ?? "Territories"} icon={mock.countries.icon} />
          <StatCard label="Platforms"  value={isLoading ? "..." : (s?.platforms.value ?? "0")}  sub={s?.platforms.sub ?? "DSPs"}        icon={mock.platforms.icon} />
        </div>

        {/* Period + view controls */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
            {/* Period buttons scroll horizontally — isolated from ViewDropdown so dropdown isn't clipped */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
              {PERIODS.map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={["font-body text-xs px-3 py-1.5 rounded-full transition-colors whitespace-nowrap",
                    period === p ? "text-white border-b-2 border-[#C30100]" : "text-white/40 hover:text-white/70"].join(" ")}>
                  {p}
                </button>
              ))}
            </div>
            {/* ViewDropdown outside the overflow wrapper so the menu isn't clipped */}
            <div className="shrink-0 ml-2">
              <ViewDropdown value={view} onChange={setView} />
            </div>
          </div>

          {/* DES-006: Custom date range picker */}
          {period === "Custom Range" && (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-body text-white/50 text-xs whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-body text-white/50 text-xs whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
                />
              </div>
              <button
                onClick={refresh}
                disabled={!customStart || !customEnd}
                className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-1.5 transition-colors disabled:opacity-40"
              >
                Apply
              </button>
              {(!customStart || !customEnd) && (
                <p className="font-body text-white/30 text-xs">Select both dates then apply</p>
              )}
            </div>
          )}
        </div>

        {/* View content */}
        {renderView()}

      </div>
    </DashboardLayout>
  );
}

function ChevronIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
}