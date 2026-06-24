"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReleaseCard, { DraftCard } from "@/components/dashboard/music/ReleaseCard";
import UploadModal from "@/components/dashboard/upload/UploadModal";
import {
  RequestEditModal,
  TakedownModal,
  SuccessModal,
} from "@/components/dashboard/music/MusicModals";
import {
  useMusic,
  useDrafts,
  useMusicRequests,
  useRequestEdit,
  useRequestTakedown,
  useMusicStats,
  type NormalisedRelease,
} from "@/lib/hooks/useMusic";
import { ReleaseDetailModal } from "@/components/dashboard/music/ReleaseDetailModal";

type Tab = "releases" | "draft" | "edit-history";
type ModalState =
  | { type: "detail"; release: NormalisedRelease }
  | { type: "edit"; release: NormalisedRelease }
  | { type: "takedown"; release: NormalisedRelease }
  | { type: "edit-success" }
  | { type: "takedown-success" }
  | null;

function StatCard({ label, value, icon, highlight }: {
  label: string; value: number; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={["rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white/40">{icon}</div>
      </div>
      <p className="font-heading text-white text-3xl font-bold">{value}</p>
      {highlight && (
        <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
      )}
    </div>
  );
}

function FilterDropdown({ value, options, onChange }: {
  value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-body text-white/70 text-xs border border-white/10 bg-[#0E0808] rounded-lg px-3 py-2 hover:border-white/20 transition-colors">
        {current?.label}
        <ChevronIcon />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-[#1A0808] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
            {options.map((opt) => (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={["w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-white/[0.05]",
                  opt.value === value ? "text-white" : "text-white/60"].join(" ")}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function YourMusicPage() {
  const [tab, setTab] = useState<Tab>("releases");
  const [modal, setModal] = useState<ModalState>(null);
  const [continueDraftId, setContinueDraftId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSort, setFilterSort] = useState("latest");
  const [filterStatus, setFilterStatus] = useState("all");

  const { releases, isLoading: releasesLoading, refresh: refreshReleases } = useMusic();
  const { drafts, isLoading: draftsLoading, remove: removeDraft } = useDrafts();
  const { requests, isLoading: requestsLoading } = useMusicRequests();
  const { submit: submitEdit, isLoading: editLoading } = useRequestEdit();
  const { submit: submitTakedown, isLoading: takedownLoading } = useRequestTakedown();
  const stats = useMusicStats(releases);

  const filteredReleases = useMemo(() => {
    let list = [...releases];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q));
    }
    if (filterType !== "all") list = list.filter((r) => r.type === filterType);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (filterSort === "oldest") list.reverse();
    return list;
  }, [releases, search, filterType, filterSort, filterStatus]);

  const closeModal = () => setModal(null);

  const requestStats = {
    totalRequests: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">

        {/* Stats row */}
        {tab === "edit-history" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Requests" value={requestsLoading ? 0 : requestStats.totalRequests} icon={<MusicNoteIcon />} highlight />
            <StatCard label="Pending"        value={requestsLoading ? 0 : requestStats.pending}       icon={<PendingIcon />} />
            <StatCard label="Approved"       value={requestsLoading ? 0 : requestStats.approved}      icon={<CheckCircleIcon />} />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Releases" value={releasesLoading ? 0 : stats.totalReleases} icon={<MusicNoteIcon />} highlight />
            <StatCard label="Live"           value={releasesLoading ? 0 : stats.live}           icon={<LiveIcon />} />
            <StatCard label="Singles"        value={releasesLoading ? 0 : stats.singles}        icon={<TrackIcon />} />
            <StatCard label="Albums / EPs"   value={releasesLoading ? 0 : stats.albumsEps}      icon={<CheckCircleIcon />} />
          </div>
        )}

        {/* Tab nav */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-white/[0.06] overflow-x-auto">
          {(["releases", "draft", "edit-history"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={["font-heading uppercase text-sm tracking-wide pb-3 border-b-2 transition-all whitespace-nowrap",
                tab === t ? "text-white border-white" : "text-white/40 border-transparent hover:text-white/70"].join(" ")}>
              {t === "edit-history" ? "Edit History" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* RELEASES TAB */}
        {tab === "releases" && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
              <SearchIcon />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search releases, tracks or artists..."
                className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none min-w-[120px]" />
              <FilterDropdown value={filterType} onChange={setFilterType}
                options={[{ label: "All Types", value: "all" }, { label: "Singles", value: "single" }, { label: "Album / EPs", value: "album_ep" }]} />
              <FilterDropdown value={filterSort} onChange={setFilterSort}
                options={[{ label: "Latest First", value: "latest" }, { label: "Oldest First", value: "oldest" }]} />
              <FilterDropdown value={filterStatus} onChange={setFilterStatus}
                options={[
                  { label: "All Status", value: "all" },
                  { label: "Live", value: "live" },
                  { label: "Pending", value: "pending" },
                  { label: "Delivered", value: "delivered" },
                  { label: "Need Documentation", value: "need_documentation" },
                  { label: "Distributed", value: "distributed" },
                ]} />
            </div>
            {releasesLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">Loading releases...</p>
              </div>
            ) : filteredReleases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">No releases found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredReleases.map((release) => (
                  <ReleaseCard
                    key={release.id}
                    release={release as never}
                    onView={(r) => setModal({ type: "detail", release: r as unknown as NormalisedRelease })}
                    onEdit={(r) => setModal({ type: "edit", release: r as unknown as NormalisedRelease })}
                    onTakedown={(r) => setModal({ type: "takedown", release: r as unknown as NormalisedRelease })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* DRAFT TAB */}
        {tab === "draft" && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
              <SearchIcon />
              <input placeholder="Search drafts..." className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none" />
              <FilterDropdown value="latest" onChange={() => {}}
                options={[{ label: "Latest First", value: "latest" }, { label: "Oldest First", value: "oldest" }]} />
            </div>

            {draftsLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">Loading drafts...</p>
              </div>
            ) : drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">No drafts yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {drafts.map((draft) => {
                  // DES-004: /drafts API returns artwork_url directly on the draft object
                  // Fields: draft_id, upload_type, current_step, release_title,
                  //         primary_artist, artwork_url, updated_at
                  const raw = draft as unknown as Record<string, unknown>;
                  const cover = (raw.artwork_url as string)
                    ?? (draft.form_data?.albumArtPreview as string)
                    ?? "";

                  return (
                    <DraftCard
                      key={raw.draft_id as string ?? draft.id}
                      release={{
                        id: String(raw.draft_id ?? draft.id),
                        title: (raw.release_title as string)
                          ?? (draft.form_data?.releaseTitle as string)
                          ?? "Untitled Draft",
                        artist: (raw.primary_artist as string)
                          ?? (draft.form_data?.primaryArtist as string)
                          ?? "",
                        cover,
                        status: "draft",
                        type: (raw.upload_type as string ?? draft.upload_type ?? "")
                          .toLowerCase().includes("single") ? "single" : "album_ep",
                        releaseDate: "",
                        streams: 0,
                        earnings: 0,
                        platforms: [],
                      }}
                      onContinue={() => setContinueDraftId(Number(raw.draft_id ?? draft.id))}
                      onDelete={() => removeDraft(draft.id)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* EDIT HISTORY TAB */}
        {tab === "edit-history" && (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-dashed border-[#C30100]/30 bg-[#0E0808] px-3 sm:px-4 py-3">
              <SearchIcon />
              <input placeholder="Search requests..." className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none" />
            </div>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="font-body text-white/30 text-sm">No edit or takedown requests yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-[#180F0F] p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-body text-white text-sm font-medium truncate">
                          {item.status === "pending" ? "Edit Request" : "Takedown Request"} — Release #{item.music_upload_id}
                        </p>
                        <span className={["font-body text-[10px] rounded-full px-2 py-0.5 border shrink-0",
                          item.status === "approved" ? "text-green-400 bg-green-400/10 border-green-400/20"
                          : item.status === "rejected" ? "text-red-400 bg-red-400/10 border-red-400/20"
                          : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"].join(" ")}>
                          {item.status}
                        </span>
                      </div>
                      <p className="font-body text-white/40 text-xs">{item.reason}</p>
                      <p className="font-body text-white/25 text-xs mt-1">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {modal?.type === "detail" && (
        <ReleaseDetailModal
          uploadId={Number(modal.release.id)}
          cover={modal.release.cover}
          fallbackTitle={modal.release.title}
          fallbackArtist={modal.release.artist}
          onClose={closeModal}
          onRequestEdit={() => setModal({ type: "edit", release: modal.release })}
          onRequestTakedown={() => setModal({ type: "takedown", release: modal.release })}
        />
      )}
      {modal?.type === "edit" && (
        <RequestEditModal release={modal.release as never} onClose={closeModal}
          onSubmit={(reason, changes) => submitEdit(Number(modal.release.id), { reason, requested_changes: changes }, () => setModal({ type: "edit-success" }))}
          isLoading={editLoading} />
      )}
      {modal?.type === "takedown" && (
        <TakedownModal release={modal.release as never} onClose={closeModal}
          onSubmit={(reason) => submitTakedown(Number(modal.release.id), { reason }, () => setModal({ type: "takedown-success" }))}
          isLoading={takedownLoading} />
      )}
      {modal?.type === "edit-success" && (
        <SuccessModal isOpen onClose={closeModal} title="Request Submitted!" description="Your edit request has been successfully submitted" ctaLabel="Done" onCta={closeModal} />
      )}
      {modal?.type === "takedown-success" && (
        <SuccessModal isOpen onClose={closeModal} title="Takedown Request Submitted!" description="Your takedown request has been submitted and will be reviewed shortly." ctaLabel="Done" onCta={() => { closeModal(); refreshReleases(); }} />
      )}

      {/* Continue Draft — opens UploadModal pre-filled with saved draft data */}
      <UploadModal
        isOpen={continueDraftId !== undefined}
        draftId={continueDraftId}
        onClose={() => { setContinueDraftId(undefined); refreshReleases(); }}
      />
    </DashboardLayout>
  );
}

function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function MusicNoteIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function LiveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function PendingIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function TrackIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>; }
function CheckCircleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function ChevronIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }