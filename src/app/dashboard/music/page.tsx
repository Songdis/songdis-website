"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReleaseCard, { DraftCard } from "@/components/dashboard/music/ReleaseCard";
import {
  ReleaseDetailModal,
  RequestEditModal,
  TakedownModal,
  SuccessModal,
} from "@/components/dashboard/music/MusicModals";
import {
  MOCK_RELEASES,
  MOCK_DRAFTS,
  MOCK_EDIT_HISTORY,
  MOCK_MUSIC_STATS,
  STATUS_CONFIG,
  type Release,
  type ReleaseStatus,
  type ReleaseType,
} from "../../mock/music";

/* ─── Types ───────────────────────────────────────────────────── */
type Tab = "releases" | "draft" | "edit-history";
type ModalState =
  | { type: "detail"; release: Release }
  | { type: "edit"; release: Release }
  | { type: "takedown"; release: Release }
  | { type: "edit-success" }
  | { type: "takedown-success" }
  | null;

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
        highlight
          ? "border-[#C30100]/40 bg-[#C30100]/10"
          : "border-white/[0.06] bg-[#180F0F]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40">
          {icon}
        </div>
      </div>
      <p className="font-heading text-white text-3xl font-bold">{value}</p>
      {highlight && (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }}
        />
      )}
    </div>
  );
}

/* ─── Custom dropdown ─────────────────────────────────────────── */
function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/10 bg-[#0E0808] rounded-lg px-3 py-2 hover:border-white/20 transition-colors"
      >
        {current?.label}
        <ChevronIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1A0808] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={[
                  "w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-white/[0.05]",
                  opt.value === value ? "text-white" : "text-white/60",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function YourMusicPage() {
  const [tab, setTab] = useState<Tab>("releases");
  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSort, setFilterSort] = useState("latest");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Filter releases ── */
  const filteredReleases = useMemo(() => {
    let list = [...MOCK_RELEASES];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q));
    }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterSort === "oldest") list.reverse();
    return list;
  }, [search, filterType, filterSort, filterStatus]);

  const closeModal = () => setModal(null);

  return (
    <DashboardLayout userName="VJazzy">
      <div className="flex flex-col gap-5">

        {/* Ayo insight bar */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 relative">
              <Image src="/images/ayo.svg" alt="Ayo AI" width={20} height={20} className="object-contain" unoptimized />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-white text-sm uppercase tracking-wide">Ayo AI · Catalog Insight</span>
              <span className="font-body text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-2 py-0.5 uppercase tracking-wider">AI Insight</span>
            </div>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
            You have 4 releases over 6 months — that's a solid pace! Your EP format outperforms your singles at 7 streams vs. avg 3. Consider releasing another EP in the next 60 days. Want me to help plan the track listing?
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Plan EP with Ayo" },
              { label: "Analyze performance" },
              { label: "Generate artwork" },
              { label: "Ask Ayo anything" },
            ].map((a) => (
              <button key={a.label} className="font-body text-white/70 text-xs border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] rounded-full px-4 py-2 transition-colors">
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row — changes per tab */}
        {tab === "edit-history" ? (
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total Requests" value={MOCK_MUSIC_STATS.totalRequests} icon={<MusicNoteIcon />} highlight />
            <StatCard label="Pending"        value={MOCK_MUSIC_STATS.pending}        icon={<PendingIcon />} />
            <StatCard label="Approved"       value={MOCK_MUSIC_STATS.approved}       icon={<CheckCircleIcon />} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Releases"  value={MOCK_MUSIC_STATS.totalReleases} icon={<MusicNoteIcon />} highlight />
            <StatCard label="Live releases"   value={MOCK_MUSIC_STATS.liveReleases}  icon={<LiveIcon />} />
            <StatCard label="Pending Review"  value={MOCK_MUSIC_STATS.pendingReview} icon={<PendingIcon />} />
            <StatCard label="Total Tracks"    value={MOCK_MUSIC_STATS.totalTracks}   icon={<TrackIcon />} />
          </div>
        )}

        {/* Tab nav */}
        <div className="flex items-center gap-6 border-b border-white/[0.06]">
          {(["releases", "draft", "edit-history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "font-heading uppercase text-sm tracking-wide pb-3 border-b-2 transition-all",
                tab === t
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70",
              ].join(" ")}
            >
              {t === "edit-history" ? "Edit History" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── RELEASES TAB ── */}
        {tab === "releases" && (
          <>
            {/* Search + filters */}
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
              <SearchIcon />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search releases, tracks or artists..."
                className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
              />
              <FilterDropdown
                value={filterType}
                onChange={setFilterType}
                options={[
                  { label: "All Types", value: "all" },
                  { label: "Singles",   value: "single" },
                  { label: "Album/EPS", value: "album" },
                  { label: "Mixtape",   value: "mixtape" },
                ]}
              />
              <FilterDropdown
                value={filterSort}
                onChange={setFilterSort}
                options={[
                  { label: "Latest First", value: "latest" },
                  { label: "Oldest First", value: "oldest" },
                ]}
              />
              <FilterDropdown
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { label: "All Status",        value: "all" },
                  { label: "Live",              value: "live" },
                  { label: "Pending",           value: "pending" },
                  { label: "Delivered",         value: "delivered" },
                  { label: "Need Documentation",value: "need_documentation" },
                  { label: "Distributed",       value: "distributed" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onView={(r) => setModal({ type: "detail", release: r })}
                  onEdit={(r) => setModal({ type: "edit", release: r })}
                  onTakedown={(r) => setModal({ type: "takedown", release: r })}
                />
              ))}
            </div>
          </>
        )}

        {/* ── DRAFT TAB ── */}
        {tab === "draft" && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
              <SearchIcon />
              <input
                placeholder="Search drafts..."
                className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
              />
              <FilterDropdown
                value="latest"
                onChange={() => {}}
                options={[
                  { label: "Latest First", value: "latest" },
                  { label: "Oldest First", value: "oldest" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {MOCK_DRAFTS.map((release) => (
                <DraftCard
                  key={release.id}
                  release={release}
                  onContinue={() => {}}
                />
              ))}
            </div>
          </>
        )}

        {/* ── EDIT HISTORY TAB ── */}
        {tab === "edit-history" && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-4 py-3">
              <SearchIcon />
              <input
                placeholder="Search drafts..."
                className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
              />
              <FilterDropdown
                value="latest"
                onChange={() => {}}
                options={[
                  { label: "Latest First", value: "latest" },
                  { label: "Oldest First", value: "oldest" },
                ]}
              />
            </div>

            <div className="flex flex-col gap-3">
              {MOCK_EDIT_HISTORY.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={item.releaseCover} alt={item.releaseTitle} fill className="object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm font-medium truncate">{item.description}</p>
                    <p className="font-body text-white/40 text-xs mt-0.5 truncate">{item.detail}</p>
                  </div>
                  <p className="font-body text-white/30 text-xs shrink-0">{item.timestamp}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === "detail" && (
        <ReleaseDetailModal release={modal.release} onClose={closeModal} />
      )}
      {modal?.type === "edit" && (
        <RequestEditModal
          release={modal.release}
          onClose={closeModal}
          onSubmit={() => setModal({ type: "edit-success" })}
        />
      )}
      {modal?.type === "takedown" && (
        <TakedownModal
          release={modal.release}
          onClose={closeModal}
          onSubmit={() => setModal({ type: "takedown-success" })}
        />
      )}
      {modal?.type === "edit-success" && (
        <SuccessModal
          isOpen
          onClose={closeModal}
          title="Request Submitted!"
          description="Your edit request has been successfully submitted"
          ctaLabel="Back to Dashboard"
          onCta={() => { closeModal(); }}
        />
      )}
      {modal?.type === "takedown-success" && (
        <SuccessModal
          isOpen
          onClose={closeModal}
          title="Takedown Request Submitted!"
          description="Your takedown request has been submitted successfully and will be reviewed. We'll get back to you once it's processed."
          ctaLabel="Back to Dashboard"
          onCta={() => { closeModal(); }}
        />
      )}
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function MusicNoteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function LiveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function PendingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function TrackIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>; }
function CheckCircleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function ChevronIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }