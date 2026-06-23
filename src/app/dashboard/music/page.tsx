// "use client";

// import { useState, useMemo } from "react";
// import Image from "next/image";
// import DashboardLayout from "@/components/dashboard/DashboardLayout";
// import ReleaseCard, { DraftCard } from "@/components/dashboard/music/ReleaseCard";
// import UploadModal from "@/components/dashboard/upload/UploadModal";
// import {
//   ReleaseDetailModal,
//   RequestEditModal,
//   TakedownModal,
//   SuccessModal,
// } from "@/components/dashboard/music/MusicModals";
// import {
//   useMusic,
//   useDrafts,
//   useMusicRequests,
//   useRequestEdit,
//   useRequestTakedown,
//   useMusicStats,
//   type NormalisedRelease,
// } from "@/lib/hooks/useMusic";

// type Tab = "releases" | "draft" | "edit-history";
// type ModalState =
//   | { type: "detail"; release: NormalisedRelease }
//   | { type: "edit"; release: NormalisedRelease }
//   | { type: "takedown"; release: NormalisedRelease }
//   | { type: "edit-success" }
//   | { type: "takedown-success" }
//   | null;

// function StatCard({ label, value, icon, highlight }: {
//   label: string; value: number; icon: React.ReactNode; highlight?: boolean;
// }) {
//   return (
//     <div className={["rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
//       highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
//       <div className="flex items-center justify-between">
//         <p className="font-body text-white/60 text-xs">{label}</p>
//         <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white/40">{icon}</div>
//       </div>
//       <p className="font-heading text-white text-3xl font-bold">{value}</p>
//       {highlight && (
//         <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
//           style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
//       )}
//     </div>
//   );
// }

// function FilterDropdown({ value, options, onChange }: {
//   value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
// }) {
//   const [open, setOpen] = useState(false);
//   const current = options.find((o) => o.value === value);
//   return (
//     <div className="relative">
//       <button onClick={() => setOpen(!open)}
//         className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/10 bg-[#0E0808] rounded-lg px-3 py-2 hover:border-white/20 transition-colors">
//         {current?.label}
//         <ChevronIcon />
//       </button>
//       {open && (
//         <>
//           <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
//           <div className="absolute right-0 top-full mt-1 z-20 bg-[#1A0808] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
//             {options.map((opt) => (
//               <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
//                 className={["w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-white/[0.05]",
//                   opt.value === value ? "text-white" : "text-white/60"].join(" ")}>
//                 {opt.label}
//               </button>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

// export default function YourMusicPage() {
//   const [tab, setTab] = useState<Tab>("releases");
//   const [modal, setModal] = useState<ModalState>(null);
//   const [continueDraftId, setContinueDraftId] = useState<number | undefined>(undefined);
//   const [search, setSearch] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [filterSort, setFilterSort] = useState("latest");
//   const [filterStatus, setFilterStatus] = useState("all");

//   const { releases, isLoading: releasesLoading, refresh: refreshReleases } = useMusic();
//   const { drafts, isLoading: draftsLoading, remove: removeDraft } = useDrafts();
//   const { requests, isLoading: requestsLoading } = useMusicRequests();
//   const { submit: submitEdit, isLoading: editLoading } = useRequestEdit();
//   const { submit: submitTakedown, isLoading: takedownLoading } = useRequestTakedown();
//   const stats = useMusicStats(releases);

//   const filteredReleases = useMemo(() => {
//     let list = [...releases];
//     if (search) {
//       const q = search.toLowerCase();
//       list = list.filter((r) => r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q));
//     }
//     if (filterType !== "all") list = list.filter((r) => r.type === filterType);
//     if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
//     if (filterSort === "oldest") list.reverse();
//     return list;
//   }, [releases, search, filterType, filterSort, filterStatus]);

//   const closeModal = () => setModal(null);

//   const requestStats = {
//     totalRequests: requests.length,
//     pending: requests.filter((r) => r.status === "pending").length,
//     approved: requests.filter((r) => r.status === "approved").length,
//   };

//   return (
//     <DashboardLayout pageTitle="Your Music">
//       <div className="flex flex-col gap-5">

//         {/* Stats row */}
//         {tab === "edit-history" ? (
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <StatCard label="Total Requests" value={requestsLoading ? 0 : requestStats.totalRequests} icon={<MusicNoteIcon />} highlight />
//             <StatCard label="Pending"        value={requestsLoading ? 0 : requestStats.pending}       icon={<PendingIcon />} />
//             <StatCard label="Approved"       value={requestsLoading ? 0 : requestStats.approved}      icon={<CheckCircleIcon />} />
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//             <StatCard label="Total Releases" value={releasesLoading ? 0 : stats.totalReleases} icon={<MusicNoteIcon />} highlight />
//             <StatCard label="Live"           value={releasesLoading ? 0 : stats.live}           icon={<LiveIcon />} />
//             <StatCard label="Singles"        value={releasesLoading ? 0 : stats.singles}        icon={<TrackIcon />} />
//             <StatCard label="Albums / EPs"   value={releasesLoading ? 0 : stats.albumsEps}      icon={<CheckCircleIcon />} />
//           </div>
//         )}

//         {/* Tab nav */}
//         <div className="flex items-center gap-4 sm:gap-6 border-b border-white/[0.06] overflow-x-auto">
//           {(["releases", "draft", "edit-history"] as Tab[]).map((t) => (
//             <button key={t} onClick={() => setTab(t)}
//               className={["font-heading uppercase text-sm tracking-wide pb-3 border-b-2 transition-all whitespace-nowrap",
//                 tab === t ? "text-white border-white" : "text-white/40 border-transparent hover:text-white/70"].join(" ")}>
//               {t === "edit-history" ? "Edit History" : t.charAt(0).toUpperCase() + t.slice(1)}
//             </button>
//           ))}
//         </div>

//         {/* RELEASES TAB */}
//         {tab === "releases" && (
//           <>
//             <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
//               <SearchIcon />
//               <input value={search} onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search releases, tracks or artists..."
//                 className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none min-w-[120px]" />
//               <FilterDropdown value={filterType} onChange={setFilterType}
//                 options={[{ label: "All Types", value: "all" }, { label: "Singles", value: "single" }, { label: "Album / EPs", value: "album_ep" }]} />
//               <FilterDropdown value={filterSort} onChange={setFilterSort}
//                 options={[{ label: "Latest First", value: "latest" }, { label: "Oldest First", value: "oldest" }]} />
//               <FilterDropdown value={filterStatus} onChange={setFilterStatus}
//                 options={[
//                   { label: "All Status", value: "all" },
//                   { label: "Live", value: "live" },
//                   { label: "Pending", value: "pending" },
//                   { label: "Delivered", value: "delivered" },
//                   { label: "Need Documentation", value: "need_documentation" },
//                   { label: "Distributed", value: "distributed" },
//                 ]} />
//             </div>
//             {releasesLoading ? (
//               <div className="flex items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">Loading releases...</p>
//               </div>
//             ) : filteredReleases.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">No releases found.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {filteredReleases.map((release) => (
//                   <ReleaseCard
//                     key={release.id}
//                     release={release as never}
//                     onView={(r) => setModal({ type: "detail", release: r as unknown as NormalisedRelease })}
//                     onEdit={(r) => setModal({ type: "edit", release: r as unknown as NormalisedRelease })}
//                     onTakedown={(r) => setModal({ type: "takedown", release: r as unknown as NormalisedRelease })}
//                   />
//                 ))}
//               </div>
//             )}
//           </>
//         )}

//         {/* DRAFT TAB */}
//         {tab === "draft" && (
//           <>
//             <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
//               <SearchIcon />
//               <input placeholder="Search drafts..." className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none" />
//               <FilterDropdown value="latest" onChange={() => {}}
//                 options={[{ label: "Latest First", value: "latest" }, { label: "Oldest First", value: "oldest" }]} />
//             </div>

//             {draftsLoading ? (
//               <div className="flex items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">Loading drafts...</p>
//               </div>
//             ) : drafts.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">No drafts yet.</p>
//               </div>
//             ) : (
//               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {drafts.map((draft) => {
//                   // DES-004: /drafts API returns artwork_url directly on the draft object
//                   // Fields: draft_id, upload_type, current_step, release_title,
//                   //         primary_artist, artwork_url, updated_at
//                   const raw = draft as unknown as Record<string, unknown>;
//                   const cover = (raw.artwork_url as string)
//                     ?? (draft.form_data?.albumArtPreview as string)
//                     ?? "";

//                   return (
//                     <DraftCard
//                       key={raw.draft_id as string ?? draft.id}
//                       release={{
//                         id: String(raw.draft_id ?? draft.id),
//                         title: (raw.release_title as string)
//                           ?? (draft.form_data?.releaseTitle as string)
//                           ?? "Untitled Draft",
//                         artist: (raw.primary_artist as string)
//                           ?? (draft.form_data?.primaryArtist as string)
//                           ?? "",
//                         cover,
//                         status: "draft",
//                         type: (raw.upload_type as string ?? draft.upload_type ?? "")
//                           .toLowerCase().includes("single") ? "single" : "album_ep",
//                         releaseDate: "",
//                         streams: 0,
//                         earnings: 0,
//                         platforms: [],
//                       }}
//                       onContinue={() => setContinueDraftId(Number(raw.draft_id ?? draft.id))}
//                       onDelete={() => removeDraft(draft.id)}
//                     />
//                   );
//                 })}
//               </div>
//             )}
//           </>
//         )}

//         {/* EDIT HISTORY TAB */}
//         {tab === "edit-history" && (
//           <>
//             <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
//               <SearchIcon />
//               <input placeholder="Search requests..." className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none" />
//             </div>
//             {requestsLoading ? (
//               <div className="flex items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">Loading requests...</p>
//               </div>
//             ) : requests.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-16">
//                 <p className="font-body text-white/30 text-sm">No edit or takedown requests yet.</p>
//               </div>
//             ) : (
//               <div className="flex flex-col gap-3">
//                 {requests.map((item) => (
//                   <div key={item.id} className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-1">
//                         <p className="font-body text-white text-sm font-medium truncate">
//                           {item.status === "pending" ? "Edit Request" : "Takedown Request"} — Release #{item.music_upload_id}
//                         </p>
//                         <span className={["font-body text-[10px] rounded-full px-2 py-0.5 border shrink-0",
//                           item.status === "approved" ? "text-green-400 bg-green-400/10 border-green-400/20"
//                           : item.status === "rejected" ? "text-red-400 bg-red-400/10 border-red-400/20"
//                           : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"].join(" ")}>
//                           {item.status}
//                         </span>
//                       </div>
//                       <p className="font-body text-white/40 text-xs">{item.reason}</p>
//                       <p className="font-body text-white/25 text-xs mt-1">
//                         {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {modal?.type === "detail" && <ReleaseDetailModal release={modal.release as never} onClose={closeModal} />}
//       {modal?.type === "edit" && (
//         <RequestEditModal release={modal.release as never} onClose={closeModal}
//           onSubmit={(reason, changes) => submitEdit(Number(modal.release.id), { reason, requested_changes: changes }, () => setModal({ type: "edit-success" }))}
//           isLoading={editLoading} />
//       )}
//       {modal?.type === "takedown" && (
//         <TakedownModal release={modal.release as never} onClose={closeModal}
//           onSubmit={(reason) => submitTakedown(Number(modal.release.id), { reason }, () => setModal({ type: "takedown-success" }))}
//           isLoading={takedownLoading} />
//       )}
//       {modal?.type === "edit-success" && (
//         <SuccessModal isOpen onClose={closeModal} title="Request Submitted!" description="Your edit request has been successfully submitted" ctaLabel="Done" onCta={closeModal} />
//       )}
//       {modal?.type === "takedown-success" && (
//         <SuccessModal isOpen onClose={closeModal} title="Takedown Request Submitted!" description="Your takedown request has been submitted and will be reviewed shortly." ctaLabel="Done" onCta={() => { closeModal(); refreshReleases(); }} />
//       )}

//       {/* Continue Draft — opens UploadModal pre-filled with saved draft data */}
//       <UploadModal
//         isOpen={continueDraftId !== undefined}
//         draftId={continueDraftId}
//         onClose={() => { setContinueDraftId(undefined); refreshReleases(); }}
//       />
//     </DashboardLayout>
//   );
// }

// function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
// function MusicNoteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
// function LiveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
// function PendingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
// function TrackIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>; }
// function CheckCircleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
// function ChevronIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }


"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { ReleaseDetailModal } from "@/components/dashboard/music/ReleaseDetailModal";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);
  const [activeReleaseMeta, setActiveReleaseMeta] = useState<{ cover?: string; title?: string; artist?: string }>({});

  const { stats, wallet, recentReleases, analyticsChart, features } =
    data ?? {
      stats: { activeReleases: 0, totalEarnings: 0 },
      wallet: { totalEarnings: 0, period: "", streams: 0, avgPerStream: 0 },
      recentReleases: [],
      analyticsChart: { months: [], streams: [], revenue: [] },
      features: [],
    };

  return (
    <>
    {/* DES-001: showWelcome only on the home dashboard page */}
    <DashboardLayout showWelcome>
      <div className="flex flex-col gap-5">

        {/* Stats row + Artist Spotlight */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="col-span-1 md:col-span-3 grid grid-rows-2 gap-4">
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
              <div aria-hidden className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(195,1,0,0.8) 0%, transparent 70%)", filter: "blur(20px)" }} />
            </div>

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

          <div className="col-span-1 md:col-span-2 rounded-2xl border border-white/[0.06] bg-[#180F0F] overflow-hidden flex flex-row">
            <div className="relative w-[55%] shrink-0 min-h-[220px]">
              <Image src="/images/into-the-night.svg" alt="Artist spotlight" fill className="object-cover object-center" />
            </div>
            <div className="flex flex-col justify-center items-start px-5 py-6 flex-1">
              <p className="font-heading text-white uppercase text-sm tracking-wide leading-tight mb-5">Artist Spotlight of the Week</p>
              <button className="font-heading text-white uppercase text-xs tracking-widest border border-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#C30100] transition-all">
                Read Article
              </button>
            </div>
          </div>
        </div>

        {/* Recent Releases + Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-white text-sm font-medium">Recent Releases</p>
              <Link href="/dashboard/music" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                View All <span>→</span>
              </Link>
            </div>

            {/* DES-002: carousel — 2 visible on mobile, scrollable for more */}
            <div className="overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {recentReleases.length === 0 ? (
                  <p className="font-body text-white/30 text-sm py-6">No releases yet.</p>
                ) : recentReleases.map((release) => (
                  <button
                    key={String(release.id)}
                    onClick={() => {
                      setActiveReleaseMeta({ cover: release.cover, title: release.title, artist: release.artist });
                      setActiveReleaseId(Number(release.id));
                    }}
                    className="relative rounded-xl overflow-hidden group cursor-pointer shrink-0 text-left"
                    style={{ width: "calc(50% - 6px)", minWidth: 120, maxWidth: 160, aspectRatio: "3/4" }}
                  >
                    {release.cover ? (
                      <Image
                        src={release.cover}
                        alt={release.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#1A0808] flex items-center justify-center">
                        <MusicNoteIcon />
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(14,8,8,0.95) 0%, transparent 55%)" }} />
                    {release.status === "live" && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                        <span className="font-body text-white text-[10px]">Live</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-heading text-white uppercase text-xs tracking-wide truncate">{release.title}</p>
                      <p className="font-body text-white/50 text-[11px] truncate mt-0.5">{release.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="font-body text-white text-sm font-medium">My Wallet</p>
              <Link href="/dashboard/earnings" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                Manage <span>→</span>
              </Link>
            </div>
            <div className="flex-1 rounded-xl bg-[#0E0808] border border-white/[0.06] p-5 relative overflow-hidden flex flex-col justify-between">
              <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 opacity-60"
                style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.55) 0%, transparent 65%)", filter: "blur(20px)" }} />
              <div className="relative z-10">
                <p className="font-body text-white/60 text-sm mb-2">Total Earnings</p>
                <p className="font-heading text-white text-4xl font-bold mb-3">
                  ${wallet.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p className="font-body text-white/40 text-sm">
                  {wallet.streams.toLocaleString()} streams &nbsp;·&nbsp; Avg ${wallet.avgPerStream.toFixed(4)}/stream
                </p>
              </div>
              <button className="relative z-10 w-full mt-5 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-3.5 transition-all duration-300">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Performance Analytics */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <p className="font-body text-white text-sm font-medium">Performance Analytics</p>
            <Link href="/dashboard/analytics" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
              Detailed Analytics <span>→</span>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
            <div className="flex gap-3">
              {[{ label: "Spotify", active: false }, { label: "Youtube Music", active: true }, { label: "Apple Music", active: false }].map((p) => (
                <button key={p.label} className={["font-body text-xs rounded-full px-3 py-1.5 border transition-colors", p.active ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/50 hover:border-white/25"].join(" ")}>
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
            </div>
          </div>
          <SimpleChart data={analyticsChart} />
        </div>

        {/* Features grid */}
        <div>
          <p className="font-body text-white text-sm font-medium mb-4">Features</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

    {activeReleaseId != null && (
      <ReleaseDetailModal
        uploadId={activeReleaseId}
        cover={activeReleaseMeta.cover}
        fallbackTitle={activeReleaseMeta.title}
        fallbackArtist={activeReleaseMeta.artist}
        onClose={() => setActiveReleaseId(null)}
      />
    )}
    </>
  );
}

function SimpleChart({ data }: { data: { months: string[]; streams: number[]; revenue: number[] } }) {
  const W = 800; const H = 160; const pad = 20;
  if (!data.streams.length) return null;
  const maxVal = Math.max(...data.streams, ...data.revenue, 1);
  const toPath = (vals: number[]) => {
    if (vals.length < 2) return "";
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
      const y = H - pad - (v / maxVal) * (H - pad * 2);
      return `${x},${y}`;
    });
    return `M${pts.join(" L")}`;
  };
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((v) => {
          const y = H - pad - (v / 100) * (H - pad * 2);
          return (
            <g key={v}>
              <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={pad - 4} y={y + 4} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="end">{v}</text>
            </g>
          );
        })}
        <path d={`${toPath(data.revenue)} L${W - pad},${H - pad} L${pad},${H - pad} Z`} fill="rgba(139,106,75,0.15)" />
        <path d={toPath(data.revenue)} fill="none" stroke="#8B6A4B" strokeWidth="2" />
        <path d={`${toPath(data.streams)} L${W - pad},${H - pad} L${pad},${H - pad} Z`} fill="rgba(195,1,0,0.15)" />
        <path d={toPath(data.streams)} fill="none" stroke="#C30100" strokeWidth="2.5" />
        {data.months.map((m, i) => {
          const x = pad + (i / (data.months.length - 1)) * (W - pad * 2);
          return <text key={`${m}-${i}`} x={x} y={H + 20} fill="rgba(255,255,255,0.2)" fontSize="10" textAnchor="middle">{m}</text>;
        })}
      </svg>
    </div>
  );
}

function MusicNoteIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function ShareIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>; }
function DollarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function FeatureIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    report: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    link:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    pitch:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>,
    ayo:    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#C30100]"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    splitr: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="17" y="5" width="4" height="16"/></svg>,
    amplify:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>,
  };
  return <span className="text-white/50">{icons[id] ?? null}</span>;
}