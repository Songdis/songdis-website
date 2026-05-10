// "use client";

// import { useState } from "react";
// import Image from "next/image";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import { MOCK_ANALYTICS, VIEW_OPTIONS, type AnalyticsView } from "../../mock/analytics";
// import {
//   AreaChart, Area, BarChart, Bar,
//   XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell,
// } from "recharts";
// import Link from "next/link";

// type Period = "30D" | "60D" | "90D" | "1YR" | "Custom Range";
// const PERIODS: Period[] = ["30D", "60D", "90D", "1YR", "Custom Range"];

// /* ─── Shared stat card ────────────────────────────────────────── */
// function StatCard({ label, value, sub, icon, highlight, badge }: {
//   label: string; value: string; sub?: string;
//   icon: string; highlight?: boolean; badge?: string;
// }) {
//   return (
//     <div className={[
//       "rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
//       highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]",
//     ].join(" ")}>
//       <div className="flex items-center justify-between">
//         <p className="font-body text-white/60 text-xs">{label}</p>
//         <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
//           <Image src={icon} alt={label} width={66} height={66} unoptimized />
//         </div>
//       </div>
//       <div className="flex items-end gap-2">
//         <p className="font-heading text-white text-2xl font-bold">{value}</p>
//         {badge && (
//           <span className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
//             style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
//             {badge}
//           </span>
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

// /* ─── Mini sparkline for platform cards ──────────────────────── */
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

// /* ─── Smooth area chart shared ────────────────────────────────── */
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
//           <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
//             <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
//           </linearGradient>
//         </defs>
//         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
//         <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontFamily: "var(--font-montserrat)", fontSize: 11 }} />
//         {revenue && <Area type="monotone" dataKey="revenue" stroke="#8B6A4B" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />}
//         <Area type="monotone" dataKey="streams" stroke="#C30100" strokeWidth={2.5} fill="url(#streamsGrad)" dot={false} />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// }

// function GreenChart({ months, data, height = 180 }: { months: string[]; data: number[]; height?: number }) {
//   const chartData = months.map((m, i) => ({ month: m, v: data[i] }));
//   return (
//     <ResponsiveContainer width="100%" height={height}>
//       <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
//         <defs>
//           <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
//             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
//             <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
//           </linearGradient>
//         </defs>
//         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
//         <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
//         <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
//         <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} fill="url(#greenGrad2)" dot={false} />
//       </AreaChart>
//     </ResponsiveContainer>
//   );
// }

// /* ─── Overview view ───────────────────────────────────────────── */
// function OverviewView() {
//   const { streamsOverTime, topSongs, platformBreakdown, listenerTrends } = MOCK_ANALYTICS;
//   const barData = platformBreakdown.map(p => ({ name: p.name, streams: p.streams }));

//   return (
//     <div className="flex flex-col gap-5">
//       {/* Monthly listeners highlight */}
//       <div className="rounded-2xl border border-white/[0.06] bg-[#0F2010] p-5">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="font-body text-green-400 text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2">
//               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Monthly Listeners
//             </p>
//             <p className="font-heading text-white text-4xl font-bold">{MOCK_ANALYTICS.monthlyListeners.value}</p>
//             <p className="font-body text-white/40 text-xs mt-1">
//               {MOCK_ANALYTICS.monthlyListeners.platform} · {MOCK_ANALYTICS.monthlyListeners.period}
//             </p>
//           </div>
//           <span className="font-body text-xs rounded-full px-3 py-1.5" style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
//             {MOCK_ANALYTICS.monthlyListeners.change}
//           </span>
//         </div>
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
//             <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 font-body text-white/50 text-xs outline-none">
//               <option>March</option><option>April</option>
//             </select>
//           </div>
//         </div>
//         <StreamsChart months={streamsOverTime.months} streams={streamsOverTime.streams} revenue={streamsOverTime.revenue} height={180} />
//       </div>

//       {/* Top Songs + Platform Breakdown */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//           <div className="flex items-center justify-between mb-1">
//             <p className="font-body text-white text-sm font-medium">Top Songs</p>
//             <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">View All <span>→</span></button>
//           </div>
//           <p className="font-body text-white/30 text-xs mb-4">20 Tracks</p>
//           <div className="flex flex-col gap-2">
//             {topSongs.map((song) => (
//               <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
//                 <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
//                 <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
//                   <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-body text-white text-xs truncate">{song.title}</p>
//                   <p className="font-body text-white/30 text-[10px]">{song.year}</p>
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
//           <ResponsiveContainer width="100%" height={220}>
//             <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
//               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
//               <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
//               <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
//               <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
//               <Bar dataKey="streams" radius={[4, 4, 0, 0]}>
//                 {barData.map((_, i) => <Cell key={i} fill={platformBreakdown[i].color} />)}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Listener trends */}
//       <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//         <div className="flex items-center justify-between mb-4">
//           <p className="font-body text-white text-sm font-medium">Listener Trends</p>
//           <div className="flex items-center gap-6">
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
//           </div>
//         </div>
//         <GreenChart months={listenerTrends.months} data={listenerTrends.data} height={160} />
//       </div>
//     </div>
//   );
// }

// /* ─── Tracks view ─────────────────────────────────────────────── */
// function TracksView() {
//   return (
//     <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//       <div className="flex items-center justify-between mb-4">
//         <p className="font-body text-white text-sm font-medium">Top Tracks</p>
//         <p className="font-body text-white/40 text-xs">20 Tracks</p>
//       </div>
//       <div className="flex flex-col gap-3">
//         {MOCK_ANALYTICS.topTracks.map((track) => (
//           <div key={track.id} className="flex items-center gap-3">
//             <span className="font-body text-white/30 text-xs w-5 shrink-0">{track.rank}</span>
//             <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
//               <Image src={track.cover} alt={track.title} fill className="object-cover" unoptimized />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-body text-white text-xs">{track.title}</p>
//               <p className="font-body text-white/30 text-[10px]">{track.year}</p>
//               <div className="mt-1 h-1 bg-white/[0.06] rounded-full overflow-hidden w-full">
//                 <div className="h-full bg-[#C30100] rounded-full" style={{ width: `${track.progress}%` }} />
//               </div>
//             </div>
//             <p className="font-body text-white/60 text-xs shrink-0">{track.streams}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── Platforms view ──────────────────────────────────────────── */
// function PlatformsView() {
//   return (
//     <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//       <div className="flex items-center justify-between mb-4">
//         <p className="font-body text-white text-sm font-medium">Streams by Territory</p>
//         <p className="font-body text-white/40 text-xs">$1.5K</p>
//       </div>
//       <div className="flex flex-col gap-3">
//         {MOCK_ANALYTICS.streamsByTerritory.map((p) => (
//           <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
//             <span className="font-body text-white/30 text-xs w-5 shrink-0">{p.rank}</span>
//             <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#0E0808] flex items-center justify-center">
//               <Image src={p.logo} alt={p.name} width={20} height={20} unoptimized />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-body text-white text-sm font-medium">{p.name}</p>
//               <p className="font-body text-white/40 text-[11px]">{p.territories} territories · avg {p.avgPerStream}/stream</p>
//             </div>
//             <div className="text-right shrink-0">
//               <p className="font-body text-white text-xs">{p.streams} · <span className="text-white/40">{p.change}</span></p>
//               <p className="font-body text-[#C30100] text-xs">{p.revenue}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── Geography view ──────────────────────────────────────────── */
// function GeographyView() {
//   const maxStreams = Math.max(...MOCK_ANALYTICS.territoryBar.map(t => t.streams));
//   return (
//     <div className="grid grid-cols-2 gap-4">
//       <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Streams by Territory</p>
//         <div className="flex flex-col gap-3">
//           {MOCK_ANALYTICS.territoryBar.map((t) => (
//             <div key={t.country} className="flex items-center gap-3">
//               <span className="text-base w-6 shrink-0">{t.flag}</span>
//               <p className="font-body text-white/60 text-xs w-24 shrink-0 truncate">{t.country}</p>
//               <div className="flex-1 h-5 bg-white/[0.04] rounded-sm overflow-hidden">
//                 <div className="h-full bg-[#C30100] rounded-sm" style={{ width: `${(t.streams / maxStreams) * 100}%` }} />
//               </div>
//             </div>
//           ))}
//           {/* X axis labels */}
//           <div className="flex justify-between mt-1 pl-[120px]">
//             {["0","700k","1.4M","2.1M","2.8M"].map(l => (
//               <span key={l} className="font-body text-white/20 text-[9px]">{l}</span>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Platform Streams</p>
//         <div className="flex flex-col gap-2">
//           {MOCK_ANALYTICS.platformStreams.map((p) => (
//             <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
//               <span className="font-body text-white/30 text-xs w-4 shrink-0">{p.rank}</span>
//               <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#0E0808] flex items-center justify-center">
//                 <Image src={p.logo} alt={p.name} width={16} height={16} unoptimized />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-body text-white text-xs">{p.name}</p>
//                 <p className="font-body text-white/30 text-[10px]">avg {p.avgPerStream}/stream</p>
//               </div>
//               <p className="font-body text-white/60 text-xs shrink-0">{p.streams}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── Trends view ─────────────────────────────────────────────── */
// function TrendsView() {
//   const { streamingTrends, platformMiniCards } = MOCK_ANALYTICS;
//   const platforms = ["All", "Amazon", "Apple Music", "Spotify", "Audiomack", "Boomplay", "Deezer"];
//   const [activePlatform, setActivePlatform] = useState("Amazon");

//   return (
//     <div className="flex flex-col gap-5">
//       <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Streaming Trends</p>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex gap-2 flex-wrap">
//             {platforms.map((p) => (
//               <button key={p} onClick={() => setActivePlatform(p)}
//                 className={["font-body text-xs rounded-full px-3 py-1 border transition-colors",
//                   activePlatform === p ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40 hover:border-white/20"].join(" ")}>
//                 {p}
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center gap-4 shrink-0">
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
//           </div>
//         </div>
//         <GreenChart months={streamingTrends.months} data={streamingTrends.data} height={200} />
//       </div>

//       <div className="grid grid-cols-3 gap-3">
//         {platformMiniCards.map((card, i) => (
//           <div key={i} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
//             <p className="font-body text-white/60 text-xs mb-1">{card.name}</p>
//             <div className="flex items-center gap-2 mb-2">
//               <p className="font-heading text-white text-lg font-bold">{card.streams}</p>
//               <span className="font-body text-[10px]" style={{ color: card.positive ? "#22c55e" : "#C30100" }}>{card.change}</span>
//             </div>
//             <Sparkline data={MOCK_ANALYTICS.streamingTrends.data} color={card.color} />
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── Live stats cards (shared by Charts/Playlists/Radio) ─────── */
// function LiveStats() {
//   const { liveStats } = MOCK_ANALYTICS;
//   return (
//     <div className="grid grid-cols-3 gap-4">
//       {[
//         { label: "Chart Entries", value: liveStats.chartEntries.toString(), sub: "Active positions" },
//         { label: "Peak Position", value: liveStats.peakPosition, sub: liveStats.peakSub },
//         { label: "New This Week", value: liveStats.newThisWeek.toString(), sub: "NEW debuts" },
//       ].map((s) => (
//         <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
//           <p className="font-body text-white/60 text-xs mb-2">{s.label}</p>
//           <p className="font-heading text-white text-3xl font-bold mb-1">{s.value}</p>
//           <p className="font-body text-white/30 text-[11px]">{s.sub}</p>
//         </div>
//       ))}
//     </div>
//   );
// }

// /* ─── Charts view ─────────────────────────────────────────────── */
// function ChartsView() {
//   return (
//     <div className="flex flex-col gap-4">
//       <LiveStats />
//       <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Chart Positions</p>
//         <div className="flex flex-col gap-0">
//           {MOCK_ANALYTICS.chartPositions.map((cp) => (
//             <div key={cp.id} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
//               <div className="w-10 h-10 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0">
//                 <span className="font-heading text-[#C30100] text-sm font-bold">{cp.position}</span>
//               </div>
//               <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
//                 <Image src={cp.cover} alt={cp.title} fill className="object-cover" unoptimized />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-body text-white text-sm">{cp.title}</p>
//                 <p className="font-body text-white/40 text-xs">{cp.chart}</p>
//               </div>
//               <div className="flex items-center gap-1.5 shrink-0">
//                 <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
//                 <span className="font-body text-white/50 text-xs">{cp.country}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ─── Playlists view ──────────────────────────────────────────── */
// function PlaylistsView() {
//   const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
//   const filtered = MOCK_ANALYTICS.playlistPlacements.filter(p =>
//     filter === "all" || p.status === filter
//   );

//   return (
//     <div className="flex flex-col gap-4">
//       <LiveStats />
//       <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//         <div className="flex items-center justify-between mb-4">
//           <p className="font-body text-white text-sm font-medium">Playlist Placements</p>
//           <div className="flex gap-1.5">
//             {(["all", "active", "pending"] as const).map((f) => (
//               <button key={f} onClick={() => setFilter(f)}
//                 className={["font-body text-[10px] rounded-full px-2.5 py-1 capitalize border transition-colors",
//                   filter === f ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40"].join(" ")}>
//                 {f}
//               </button>
//             ))}
//           </div>
//         </div>
//         <div className="grid grid-cols-4 gap-2 mb-2 px-2">
//           <span className="font-body text-white/30 text-[10px] col-span-2">Playlist</span>
//           <span className="font-body text-white/30 text-[10px] text-right">Followers</span>
//           <span className="font-body text-white/30 text-[10px] text-right">Streams</span>
//         </div>
//         {filtered.map((p) => (
//           <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
//             <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
//               <Image src={p.cover} alt={p.name} fill className="object-cover" unoptimized />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="font-body text-white text-sm">{p.name}</p>
//               <p className="font-body text-white/40 text-xs">{p.platform} · "{p.track}"</p>
//             </div>
//             <p className="font-body text-white/60 text-xs w-16 text-right shrink-0">{p.followers}</p>
//             <p className="font-body text-white/60 text-xs w-14 text-right shrink-0">{p.streams.toLocaleString()}</p>
//             <span className="font-body text-[10px] rounded-full px-2.5 py-1 shrink-0 w-16 text-center"
//               style={p.status === "active"
//                 ? { color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)" }
//                 : { color: "#f97316", backgroundColor: "rgba(249,115,22,0.12)" }}>
//               {p.status === "active" ? "Active" : "Pending"}
//             </span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── Radio view ──────────────────────────────────────────────── */
// function RadioView() {
//   return (
//     <div className="flex flex-col gap-4">
//       <LiveStats />
//       <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Radio Appearances</p>
//         <div className="grid grid-cols-4 gap-2 mb-3 px-1">
//           <span className="font-body text-white/30 text-[10px] col-span-2">Station</span>
//           <span className="font-body text-white/30 text-[10px]">Track</span>
//           <div className="grid grid-cols-3 gap-1">
//             <span className="font-body text-white/30 text-[10px] text-right">Plays</span>
//             <span className="font-body text-white/30 text-[10px] text-right">Reach</span>
//             <span className="font-body text-white/30 text-[10px] text-right">Region</span>
//           </div>
//         </div>
//         {MOCK_ANALYTICS.radioAppearances.map((r) => (
//           <div key={r.id} className="grid grid-cols-4 gap-2 items-center py-3 border-b border-white/[0.04] last:border-0">
//             <div className="col-span-2">
//               <p className="font-body text-white text-sm">{r.station}</p>
//               <p className="font-body text-white/40 text-xs">{r.genre}</p>
//             </div>
//             <p className="font-body text-white/70 text-sm">{r.track}</p>
//             <div className="grid grid-cols-3 gap-1">
//               <p className="font-body text-white/60 text-xs text-right">{r.plays}</p>
//               <p className="font-body text-white/60 text-xs text-right">{r.reach}</p>
//               <p className="font-body text-white/60 text-xs text-right">{r.region}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ─── Socials view ────────────────────────────────────────────── */
// function SocialsView() {
//   const { socials, socialGrowth } = MOCK_ANALYTICS;
//   const platforms = ["TikTok", "Instagram", "Facebook", "Twitter", "Deezer", "Boomplay"];
//   const [activePlatform, setActivePlatform] = useState("Instagram");
//   const [metric, setMetric] = useState("Followers");

//   return (
//     <div className="flex flex-col gap-5">
//       <div className="grid grid-cols-4 gap-4">
//         {socials.map((s) => (
//           <div key={s.platform} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
//             <div className="flex items-center justify-between mb-2">
//               <p className="font-body text-white/60 text-xs">{s.platform}</p>
//               <span className="font-body text-[10px]" style={{ color: s.positive ? "#22c55e" : "#C30100" }}>{s.change}</span>
//             </div>
//             <p className="font-heading text-white text-2xl font-bold mb-0.5">{s.followers}</p>
//             <p className="font-body text-white/30 text-[10px]">Followers</p>
//           </div>
//         ))}
//       </div>

//       <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//         <p className="font-body text-white text-sm font-medium mb-4">Social Growth</p>
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex gap-2 flex-wrap items-center">
//             {platforms.map((p) => (
//               <button key={p} onClick={() => setActivePlatform(p)}
//                 className={["font-body text-xs rounded-full px-2.5 py-1 border transition-colors",
//                   activePlatform === p ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40"].join(" ")}>
//                 {p}
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center gap-4 shrink-0">
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
//             <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
//           </div>
//         </div>
//         <div className="flex gap-2 mb-4">
//           {["Followers", "Likes", "Posts"].map((m) => (
//             <button key={m} onClick={() => setMetric(m)}
//               className={["font-body text-xs rounded-full px-3 py-1.5 border transition-colors",
//                 metric === m ? "border-white/30 text-white" : "border-white/10 text-white/40"].join(" ")}>
//               {m}
//             </button>
//           ))}
//         </div>
//         <GreenChart months={socialGrowth.months} data={socialGrowth.data} height={200} />
//       </div>
//     </div>
//   );
// }

// /* ─── View switcher dropdown ──────────────────────────────────── */
// function ViewDropdown({ value, onChange }: { value: AnalyticsView; onChange: (v: AnalyticsView) => void }) {
//   const [open, setOpen] = useState(false);
//   const current = VIEW_OPTIONS.find(o => o.value === value);

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
//             {VIEW_OPTIONS.map((opt) => (
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
//   const { totalStreams, avgPerDay, releases, countries, platforms, playlists } = MOCK_ANALYTICS;

//   const renderView = () => {
//     switch (view) {
//       case "overview":  return <OverviewView />;
//       case "tracks":    return <TracksView />;
//       case "platforms": return <PlatformsView />;
//       case "geography": return <GeographyView />;
//       case "trends":    return <TrendsView />;
//       case "charts":    return <ChartsView />;
//       case "playlists": return <PlaylistsView />;
//       case "radio":     return <RadioView />;
//       case "socials":   return <SocialsView />;
//     }
//   };

//   return (
//     <DashboardLayout userName="VJazzy" customCta={{ label: "Refresh", onClick: () => {} }}>
//       <div className="flex flex-col gap-5">

//         {/* Top stat row — 3 cards */}
//         <div className="grid grid-cols-3 gap-4">
//           <StatCard label="Total Streams" value={totalStreams.value} sub={totalStreams.sub}
//             icon={totalStreams.icon} highlight badge={totalStreams.change} />
//           <StatCard label="Avg / Day" value={avgPerDay.value} sub={avgPerDay.sub} icon={avgPerDay.icon} />
//           <StatCard label="Releases"  value={releases.value}  sub={releases.sub}  icon={releases.icon} />
//         </div>

//         {/* Second stat row — 3 cards */}
//         <div className="grid grid-cols-3 gap-4">
//           <StatCard label="Countries" value={countries.value} sub={countries.sub} icon={countries.icon} />
//           <StatCard label="Platforms" value={platforms.value} sub={platforms.sub} icon={platforms.icon} />
//           <StatCard label="Playlist"  value={playlists.value} sub={playlists.sub} icon={playlists.icon} />
//         </div>

//         {/* Ayo insight */}
//         <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
//           <div className="flex items-start gap-3">
//             <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
//               <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
//             </div>
//             <div className="flex-1">
//               <p className="font-body text-[#C30100] text-xs font-semibold mb-2">Ayo AI · Analytics Summary</p>
//               <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
//                 Your streams peaked in November with 530K+ streams — this correlates with your consistent social activity and a playlist placement on AfroBeats Daily. Nigeria is 61% of your audience. I recommend doubling down with Pidgin/Yoruba content to retain and grow that base while expanding into UK and US diaspora markets.
//               </p>
//               <div className="flex gap-2">
//                 <Link href='/dashboard/ayo' className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
//                   Plan content with Ayo
//                 </Link>
//                 <Link href='/dashboard/ayo' className="font-body text-white/70 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-2 transition-colors">
//                   View platform breakdown
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Period + view controls */}
//         <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
//           {PERIODS.map((p) => (
//             <button key={p} onClick={() => setPeriod(p)}
//               className={["font-body text-xs px-3 py-1.5 rounded-full transition-colors",
//                 period === p ? "text-white border-b-2 border-[#C30100]" : "text-white/40 hover:text-white/70"].join(" ")}>
//               {p}
//             </button>
//           ))}
//           <div className="ml-auto">
//             <ViewDropdown value={view} onChange={setView} />
//           </div>
//         </div>

//         {/* Dynamic view content */}
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
import { MOCK_ANALYTICS, VIEW_OPTIONS, type AnalyticsView } from "../../mock/analytics";
import { useAnalytics, type AnalyticsPageData } from "@/lib/hooks/useAnalytics";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

type Period = "30D" | "60D" | "90D" | "1YR" | "Custom Range";
const PERIODS: Period[] = ["30D", "60D", "90D", "1YR", "Custom Range"];

/* ─── Shared stat card ────────────────────────────────────────── */
function StatCard({ label, value, sub, icon, highlight, badge }: {
  label: string; value: string; sub?: string;
  icon: string; highlight?: boolean; badge?: string;
}) {
  return (
    <div className={[
      "rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]",
    ].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
          <Image src={icon} alt={label} width={16} height={16} unoptimized />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <p className="font-heading text-white text-2xl font-bold">{value}</p>
        {badge && (
          <span className="font-body text-[10px] rounded-full px-2 py-0.5 mb-0.5"
            style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
            {badge}
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

/* ─── Mini sparkline for platform cards ──────────────────────── */
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

/* ─── Smooth area chart shared ────────────────────────────────── */
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
          <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontFamily: "var(--font-montserrat)", fontSize: 11 }} />
        {revenue && <Area type="monotone" dataKey="revenue" stroke="#8B6A4B" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />}
        <Area type="monotone" dataKey="streams" stroke="#C30100" strokeWidth={2.5} fill="url(#streamsGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function GreenChart({ months, data, height = 180 }: { months: string[]; data: number[]; height?: number }) {
  const chartData = months.map((m, i) => ({ month: m, v: data[i] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="greenGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
        <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} fill="url(#greenGrad2)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Overview view ───────────────────────────────────────────── */
function OverviewView({ data }: { data: AnalyticsPageData | null }) {
  const streamsOverTime = data?.streamsOverTime ?? MOCK_ANALYTICS.streamsOverTime;
  const topSongs = data?.topReleases.length
    ? data.topReleases.map(r => ({ id: r.id, rank: r.rank, title: r.title, year: "", cover: r.cover, streams: r.streams }))
    : MOCK_ANALYTICS.topSongs;
  const platformBreakdown = data?.platformBreakdown.length
    ? data.platformBreakdown
    : MOCK_ANALYTICS.platformBreakdown;
  const listenerTrends = MOCK_ANALYTICS.listenerTrends;
  const barData = platformBreakdown.map(p => ({ name: p.name, streams: p.streams }));

  return (
    <div className="flex flex-col gap-5">
      {/* Monthly listeners highlight */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0F2010] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-green-400 text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Monthly Listeners
            </p>
            <p className="font-heading text-white text-4xl font-bold">{MOCK_ANALYTICS.monthlyListeners.value}</p>
            <p className="font-body text-white/40 text-xs mt-1">
              {MOCK_ANALYTICS.monthlyListeners.platform} · {MOCK_ANALYTICS.monthlyListeners.period}
            </p>
          </div>
          <span className="font-body text-xs rounded-full px-3 py-1.5" style={{ color: "#22c55e", backgroundColor: "rgba(34,197,94,0.15)" }}>
            {MOCK_ANALYTICS.monthlyListeners.change}
          </span>
        </div>
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
            <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 font-body text-white/50 text-xs outline-none">
              <option>March</option><option>April</option>
            </select>
          </div>
        </div>
        <StreamsChart months={streamsOverTime.months} streams={streamsOverTime.streams} revenue={streamsOverTime.revenue} height={180} />
      </div>

      {/* Top Songs + Platform Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-white text-sm font-medium">Top Songs</p>
            <button className="font-body text-white/50 text-xs flex items-center gap-1 hover:text-white transition-colors">View All <span>→</span></button>
          </div>
          <p className="font-body text-white/30 text-xs mb-4">20 Tracks</p>
          <div className="flex flex-col gap-2">
            {topSongs.map((song) => (
              <div key={song.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <span className="font-body text-white/30 text-xs w-4 shrink-0">{song.rank}</span>
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <Image src={song.cover} alt={song.title} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-white text-xs truncate">{song.title}</p>
                  <p className="font-body text-white/30 text-[10px]">{song.year}</p>
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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "#1A0808", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="streams" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => <Cell key={i} fill={platformBreakdown[i].color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Listener trends */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-white text-sm font-medium">Listener Trends</p>
          <div className="flex items-center gap-6">
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{listenerTrends.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
          </div>
        </div>
        <GreenChart months={listenerTrends.months} data={listenerTrends.data} height={160} />
      </div>
    </div>
  );
}

/* ─── Tracks view ─────────────────────────────────────────────── */
function TracksView() {
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-white text-sm font-medium">Top Tracks</p>
        <p className="font-body text-white/40 text-xs">20 Tracks</p>
      </div>
      <div className="flex flex-col gap-3">
        {MOCK_ANALYTICS.topTracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3">
            <span className="font-body text-white/30 text-xs w-5 shrink-0">{track.rank}</span>
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
              <Image src={track.cover} alt={track.title} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-xs">{track.title}</p>
              <p className="font-body text-white/30 text-[10px]">{track.year}</p>
              <div className="mt-1 h-1 bg-white/[0.06] rounded-full overflow-hidden w-full">
                <div className="h-full bg-[#C30100] rounded-full" style={{ width: `${track.progress}%` }} />
              </div>
            </div>
            <p className="font-body text-white/60 text-xs shrink-0">{track.streams}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Platforms view ──────────────────────────────────────────── */
function PlatformsView() {
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-body text-white text-sm font-medium">Streams by Territory</p>
        <p className="font-body text-white/40 text-xs">$1.5K</p>
      </div>
      <div className="flex flex-col gap-3">
        {MOCK_ANALYTICS.streamsByTerritory.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
            <span className="font-body text-white/30 text-xs w-5 shrink-0">{p.rank}</span>
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#0E0808] flex items-center justify-center">
              <Image src={p.logo} alt={p.name} width={20} height={20} unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-sm font-medium">{p.name}</p>
              <p className="font-body text-white/40 text-[11px]">{p.territories} territories · avg {p.avgPerStream}/stream</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-body text-white text-xs">{p.streams} · <span className="text-white/40">{p.change}</span></p>
              <p className="font-body text-[#C30100] text-xs">{p.revenue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Geography view ──────────────────────────────────────────── */
function GeographyView() {
  const maxStreams = Math.max(...MOCK_ANALYTICS.territoryBar.map(t => t.streams));
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Streams by Territory</p>
        <div className="flex flex-col gap-3">
          {MOCK_ANALYTICS.territoryBar.map((t) => (
            <div key={t.country} className="flex items-center gap-3">
              <span className="text-base w-6 shrink-0">{t.flag}</span>
              <p className="font-body text-white/60 text-xs w-24 shrink-0 truncate">{t.country}</p>
              <div className="flex-1 h-5 bg-white/[0.04] rounded-sm overflow-hidden">
                <div className="h-full bg-[#C30100] rounded-sm" style={{ width: `${(t.streams / maxStreams) * 100}%` }} />
              </div>
            </div>
          ))}
          {/* X axis labels */}
          <div className="flex justify-between mt-1 pl-[120px]">
            {["0","700k","1.4M","2.1M","2.8M"].map(l => (
              <span key={l} className="font-body text-white/20 text-[9px]">{l}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Platform Streams</p>
        <div className="flex flex-col gap-2">
          {MOCK_ANALYTICS.platformStreams.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span className="font-body text-white/30 text-xs w-4 shrink-0">{p.rank}</span>
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-[#0E0808] flex items-center justify-center">
                <Image src={p.logo} alt={p.name} width={16} height={16} unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-white text-xs">{p.name}</p>
                <p className="font-body text-white/30 text-[10px]">avg {p.avgPerStream}/stream</p>
              </div>
              <p className="font-body text-white/60 text-xs shrink-0">{p.streams}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Trends view ─────────────────────────────────────────────── */
function TrendsView() {
  const { streamingTrends, platformMiniCards } = MOCK_ANALYTICS;
  const platforms = ["All", "Amazon", "Apple Music", "Spotify", "Audiomack", "Boomplay", "Deezer"];
  const [activePlatform, setActivePlatform] = useState("Amazon");

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Streaming Trends</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {platforms.map((p) => (
              <button key={p} onClick={() => setActivePlatform(p)}
                className={["font-body text-xs rounded-full px-3 py-1 border transition-colors",
                  activePlatform === p ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40 hover:border-white/20"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{streamingTrends.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
          </div>
        </div>
        <GreenChart months={streamingTrends.months} data={streamingTrends.data} height={200} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {platformMiniCards.map((card, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
            <p className="font-body text-white/60 text-xs mb-1">{card.name}</p>
            <div className="flex items-center gap-2 mb-2">
              <p className="font-heading text-white text-lg font-bold">{card.streams}</p>
              <span className="font-body text-[10px]" style={{ color: card.positive ? "#22c55e" : "#C30100" }}>{card.change}</span>
            </div>
            <Sparkline data={MOCK_ANALYTICS.streamingTrends.data} color={card.color} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Live stats cards (shared by Charts/Playlists/Radio) ─────── */
function LiveStats() {
  const { liveStats } = MOCK_ANALYTICS;
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Chart Entries", value: liveStats.chartEntries.toString(), sub: "Active positions" },
        { label: "Peak Position", value: liveStats.peakPosition, sub: liveStats.peakSub },
        { label: "New This Week", value: liveStats.newThisWeek.toString(), sub: "NEW debuts" },
      ].map((s) => (
        <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
          <p className="font-body text-white/60 text-xs mb-2">{s.label}</p>
          <p className="font-heading text-white text-3xl font-bold mb-1">{s.value}</p>
          <p className="font-body text-white/30 text-[11px]">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Charts view ─────────────────────────────────────────────── */
function ChartsView() {
  return (
    <div className="flex flex-col gap-4">
      <LiveStats />
      <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Chart Positions</p>
        <div className="flex flex-col gap-0">
          {MOCK_ANALYTICS.chartPositions.map((cp) => (
            <div key={cp.id} className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
              <div className="w-10 h-10 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0">
                <span className="font-heading text-[#C30100] text-sm font-bold">{cp.position}</span>
              </div>
              <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                <Image src={cp.cover} alt={cp.title} fill className="object-cover" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-white text-sm">{cp.title}</p>
                <p className="font-body text-white/40 text-xs">{cp.chart}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="font-body text-white/50 text-xs">{cp.country}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Playlists view ──────────────────────────────────────────── */
function PlaylistsView() {
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");
  const filtered = MOCK_ANALYTICS.playlistPlacements.filter(p =>
    filter === "all" || p.status === filter
  );

  return (
    <div className="flex flex-col gap-4">
      <LiveStats />
      <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-white text-sm font-medium">Playlist Placements</p>
          <div className="flex gap-1.5">
            {(["all", "active", "pending"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={["font-body text-[10px] rounded-full px-2.5 py-1 capitalize border transition-colors",
                  filter === f ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40"].join(" ")}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2 px-2">
          <span className="font-body text-white/30 text-[10px] col-span-2">Playlist</span>
          <span className="font-body text-white/30 text-[10px] text-right">Followers</span>
          <span className="font-body text-white/30 text-[10px] text-right">Streams</span>
        </div>
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
              <Image src={p.cover} alt={p.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-sm">{p.name}</p>
              <p className="font-body text-white/40 text-xs">{p.platform} · "{p.track}"</p>
            </div>
            <p className="font-body text-white/60 text-xs w-16 text-right shrink-0">{p.followers}</p>
            <p className="font-body text-white/60 text-xs w-14 text-right shrink-0">{p.streams.toLocaleString()}</p>
            <span className="font-body text-[10px] rounded-full px-2.5 py-1 shrink-0 w-16 text-center"
              style={p.status === "active"
                ? { color: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)" }
                : { color: "#f97316", backgroundColor: "rgba(249,115,22,0.12)" }}>
              {p.status === "active" ? "Active" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Radio view ──────────────────────────────────────────────── */
function RadioView() {
  return (
    <div className="flex flex-col gap-4">
      <LiveStats />
      <div className="rounded-2xl border border-dashed border-[#C30100]/25 bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Radio Appearances</p>
        <div className="grid grid-cols-4 gap-2 mb-3 px-1">
          <span className="font-body text-white/30 text-[10px] col-span-2">Station</span>
          <span className="font-body text-white/30 text-[10px]">Track</span>
          <div className="grid grid-cols-3 gap-1">
            <span className="font-body text-white/30 text-[10px] text-right">Plays</span>
            <span className="font-body text-white/30 text-[10px] text-right">Reach</span>
            <span className="font-body text-white/30 text-[10px] text-right">Region</span>
          </div>
        </div>
        {MOCK_ANALYTICS.radioAppearances.map((r) => (
          <div key={r.id} className="grid grid-cols-4 gap-2 items-center py-3 border-b border-white/[0.04] last:border-0">
            <div className="col-span-2">
              <p className="font-body text-white text-sm">{r.station}</p>
              <p className="font-body text-white/40 text-xs">{r.genre}</p>
            </div>
            <p className="font-body text-white/70 text-sm">{r.track}</p>
            <div className="grid grid-cols-3 gap-1">
              <p className="font-body text-white/60 text-xs text-right">{r.plays}</p>
              <p className="font-body text-white/60 text-xs text-right">{r.reach}</p>
              <p className="font-body text-white/60 text-xs text-right">{r.region}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Socials view ────────────────────────────────────────────── */
function SocialsView() {
  const { socials, socialGrowth } = MOCK_ANALYTICS;
  const platforms = ["TikTok", "Instagram", "Facebook", "Twitter", "Deezer", "Boomplay"];
  const [activePlatform, setActivePlatform] = useState("Instagram");
  const [metric, setMetric] = useState("Followers");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-4">
        {socials.map((s) => (
          <div key={s.platform} className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-white/60 text-xs">{s.platform}</p>
              <span className="font-body text-[10px]" style={{ color: s.positive ? "#22c55e" : "#C30100" }}>{s.change}</span>
            </div>
            <p className="font-heading text-white text-2xl font-bold mb-0.5">{s.followers}</p>
            <p className="font-body text-white/30 text-[10px]">Followers</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
        <p className="font-body text-white text-sm font-medium mb-4">Social Growth</p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap items-center">
            {platforms.map((p) => (
              <button key={p} onClick={() => setActivePlatform(p)}
                className={["font-body text-xs rounded-full px-2.5 py-1 border transition-colors",
                  activePlatform === p ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/40"].join(" ")}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.latest}</p><p className="font-body text-white/30 text-[10px]">Latest</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.peak}</p><p className="font-body text-white/30 text-[10px]">Peak</p></div>
            <div className="text-right"><p className="font-heading text-white text-sm font-bold">{socialGrowth.average}</p><p className="font-body text-white/30 text-[10px]">Average</p></div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {["Followers", "Likes", "Posts"].map((m) => (
            <button key={m} onClick={() => setMetric(m)}
              className={["font-body text-xs rounded-full px-3 py-1.5 border transition-colors",
                metric === m ? "border-white/30 text-white" : "border-white/10 text-white/40"].join(" ")}>
              {m}
            </button>
          ))}
        </div>
        <GreenChart months={socialGrowth.months} data={socialGrowth.data} height={200} />
      </div>
    </div>
  );
}

/* ─── View switcher dropdown ──────────────────────────────────── */
function ViewDropdown({ value, onChange }: { value: AnalyticsView; onChange: (v: AnalyticsView) => void }) {
  const [open, setOpen] = useState(false);
  const current = VIEW_OPTIONS.find(o => o.value === value);

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
            {VIEW_OPTIONS.map((opt) => (
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
  const [period, setPeriod] = useState<Period>("90D");
  const [view, setView] = useState<AnalyticsView>("overview");

  const { data, isLoading, refresh } = useAnalytics(period);

  // Stat values — real if available, mock while loading
  const s = data?.stats;
  const mock = MOCK_ANALYTICS;

  const renderView = () => {
    switch (view) {
      case "overview":  return <OverviewView data={data} />;
      case "tracks":    return <TracksView />;
      case "platforms": return <PlatformsView />;
      case "geography": return <GeographyView />;
      case "trends":    return <TrendsView />;
      case "charts":    return <ChartsView />;
      case "playlists": return <PlaylistsView />;
      case "radio":     return <RadioView />;
      case "socials":   return <SocialsView />;
    }
  };

  return (
    <DashboardLayout customCta={{ label: "Refresh", onClick: refresh }}>
      <div className="flex flex-col gap-5">

        {/* Top stat row — 3 cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Streams"
            value={isLoading ? "..." : (s?.totalStreams.value ?? mock.totalStreams.value)}
            sub={s?.totalStreams.sub ?? mock.totalStreams.sub}
            icon={mock.totalStreams.icon} highlight
            badge={s?.totalStreams.change || mock.totalStreams.change} />
          <StatCard label="Avg / Day"
            value={isLoading ? "..." : (s?.avgPerDay.value ?? mock.avgPerDay.value)}
            sub={s?.avgPerDay.sub ?? mock.avgPerDay.sub}
            icon={mock.avgPerDay.icon} />
          <StatCard label="Releases"
            value={isLoading ? "..." : (s?.releases.value ?? mock.releases.value)}
            sub={s?.releases.sub ?? mock.releases.sub}
            icon={mock.releases.icon} />
        </div>

        {/* Second stat row — 3 cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Countries"
            value={isLoading ? "..." : (s?.countries.value ?? mock.countries.value)}
            sub={s?.countries.sub ?? mock.countries.sub}
            icon={mock.countries.icon} />
          <StatCard label="Platforms"
            value={isLoading ? "..." : (s?.platforms.value ?? mock.platforms.value)}
            sub={s?.platforms.sub ?? mock.platforms.sub}
            icon={mock.platforms.icon} />
          <StatCard label="Playlist"
            value={isLoading ? "..." : (s?.playlists.value ?? mock.playlists.value)}
            sub={s?.playlists.sub ?? mock.playlists.sub}
            icon={mock.playlists.icon} />
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

        {/* Period + view controls */}
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={["font-body text-xs px-3 py-1.5 rounded-full transition-colors",
                period === p ? "text-white border-b-2 border-[#C30100]" : "text-white/40 hover:text-white/70"].join(" ")}>
              {p}
            </button>
          ))}
          <div className="ml-auto">
            <ViewDropdown value={view} onChange={setView} />
          </div>
        </div>

        {/* Dynamic view content */}
        {renderView()}
      </div>
    </DashboardLayout>
  );
}

function ChevronIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>;
}