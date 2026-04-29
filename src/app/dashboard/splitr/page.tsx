"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────────────────── */
interface Collaborator {
  name: string;
  isYou?: boolean;
  role: string;
  split: number;
  color: string;
  email?: string;
}

interface SplitAgreement {
  id: string;
  trackTitle: string;
  trackCover: string;
  pendingCount: number;
  collaborators: Collaborator[];
  totalEarnings: number;
}

/* ─── Mock data ───────────────────────────────────────────────── */
const MOCK_COLLABORATORS: Collaborator[] = [
  { name: "Vjazzy", isYou: true, role: "Artist",     split: 70, color: "#C30100" },
  { name: "Producer X",          role: "Producer",   split: 20, color: "#f59e0b" },
  { name: "Co-Writer",           role: "Songwriter", split: 10, color: "#3b82f6" },
];

const MOCK_SPLITS: SplitAgreement[] = [
  { id: "1", trackTitle: "Scatter the Place", trackCover: "/images/small-blue-cover.svg", pendingCount: 1, collaborators: MOCK_COLLABORATORS, totalEarnings: 2860 },
  { id: "2", trackTitle: "Scatter the Place", trackCover: "/images/small-blue-cover.svg", pendingCount: 1, collaborators: MOCK_COLLABORATORS, totalEarnings: 2860 },
  { id: "3", trackTitle: "Scatter the Place", trackCover: "/images/small-blue-cover.svg", pendingCount: 1, collaborators: MOCK_COLLABORATORS, totalEarnings: 2860 },
];

const TRACKS = ["Scatter the place", "Wisdom No Dey Old", "Gratitude"];

/* ─── Split Agreement Form (shared by New + Edit) ─────────────── */
interface SplitFormProps {
  mode: "new" | "edit";
  onClose: () => void;
  onSubmit: () => void;
}

function SplitAgreementForm({ mode, onClose, onSubmit }: SplitFormProps) {
  const [track, setTrack] = useState("Scatter the place");
  const [collaborators, setCollaborators] = useState([
    { email: "Vjazzy (You)", split: "70%", isOwner: true },
    { email: "",             split: "70%", isOwner: false },
    { email: "",             split: "70%", isOwner: false },
  ]);

  const addCollaborator = () => {
    setCollaborators((prev) => [...prev, { email: "", split: "70%", isOwner: false }]);
  };

  const updateCollab = (i: number, field: "email" | "split", value: string) => {
    setCollaborators((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[700px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <div className="p-8">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-7">
            {mode === "new" ? "New Split Agreement" : "Edit Split Agreement"}
          </h2>

          <div className="flex flex-col gap-5">
            {/* Track select */}
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Track</label>
              <div className="relative">
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
                >
                  {TRACKS.map((t) => <option key={t}>{t}</option>)}
                </select>
                <ChevronIcon />
              </div>
            </div>

            {/* Collaborators */}
            {collaborators.map((collab, i) => (
              <div key={i} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-white/70 text-xs block mb-1.5">
                    {i === 0 ? "Collaborator" : "Collaborator Email"}
                  </label>
                  <input
                    type={i === 0 ? "text" : "email"}
                    value={collab.email}
                    onChange={(e) => updateCollab(i, "email", e.target.value)}
                    placeholder={i === 0 ? "Vjazzy (You)" : "e.g johndoe@gmail.com"}
                    disabled={i === 0}
                    className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-body text-white/70 text-xs block mb-1.5">Split Percentage</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={collab.split}
                      onChange={(e) => updateCollab(i, "split", e.target.value)}
                      className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 pr-8 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      <button className="text-white/30 hover:text-white leading-none">▲</button>
                      <button className="text-white/30 hover:text-white leading-none">▼</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add collaborator */}
            <button
              onClick={addCollaborator}
              className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/15 hover:border-white/30 py-3.5 flex items-center justify-center gap-2 transition-colors"
            >
              <span className="text-lg leading-none">+</span> Add Collaborator
            </button>

            {/* Note */}
            <div className="border border-dashed border-[#C30100]/30 rounded-xl px-4 py-3">
              <p className="font-body text-white/60 text-xs font-semibold mb-1">NOTE:</p>
              <p className="font-body text-white/40 text-xs leading-relaxed">
                All parties get an email to accept split. Payment is distributed automatically during each payout cycle.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
              >
                {mode === "new" ? "Create Split Agreement" : "Update Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete confirmation modal ───────────────────────────────── */
function DeleteModal({ onClose, onDelete }: { onClose: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        {/* Trash icon */}
        <div className="flex justify-center mb-5">
          <svg width="60" height="70" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </div>

        <h2 className="font-body text-white text-xl font-bold mb-3">Delete Split Agreement</h2>
        <p className="font-body text-white/60 text-sm leading-relaxed mb-8">
          Are you sure you want to delete this agreement? This action cannot be undone
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Active Split card ───────────────────────────────────────── */
function SplitCard({
  split,
  onEdit,
  onDelete,
}: {
  split: SplitAgreement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image src={split.trackCover} alt={split.trackTitle} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="font-body text-white text-sm font-medium">{split.trackTitle}</p>
            <p className="font-body text-[#C30100] text-[11px]">
              {split.pendingCount} party Pending Acceptance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 font-body text-white/60 text-xs border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white"
          >
            <EditIcon /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 font-body text-xs rounded-full px-3 py-1.5 transition-colors"
            style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.10)", border: "1px solid rgba(195,1,0,0.25)" }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-white/[0.05] pt-3">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider">Collaborators</p>
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Role</p>
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Earned Split</p>
        </div>
        {split.collaborators.map((c) => (
          <div key={c.name} className="grid grid-cols-3 gap-2 py-1.5">
            <span className="font-body text-white text-xs">
              {c.name} {c.isYou && <span className="text-white/40">(You)</span>}
            </span>
            <span className="font-body text-white/60 text-xs text-right">{c.role}</span>
            <span className="font-body text-white/60 text-xs text-right">{c.split}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
type ModalState = "new" | "edit" | "delete" | "success" | null;

export default function SplitrPage() {
  const [modal, setModal] = useState<ModalState>(null);
  const [splits] = useState<SplitAgreement[]>(MOCK_SPLITS);

  const myCollab = MOCK_COLLABORATORS.find((c) => c.isYou)!;

  return (
    <DashboardLayout
      userName="VJazzy"
      customCta={{ label: "+ New Split", onClick: () => setModal("new") }}
    >
      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Agreements", value: 2,  icon: "/images/money.svg", highlight: true },
            { label: "Collaborators",      value: 3,  icon: "/images/streams.svg" },
            { label: "Pending Acceptance", value: 1,  icon: "/images/streams.svg" },
          ].map((s) => (
            <div
              key={s.label}
              className={[
                "rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
                s.highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <p className="font-body text-white/60 text-xs">{s.label}</p>
                
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <Image src={s.icon} alt={s.label} width={66} height={66} unoptimized />
                </div>
              </div>
              <p className="font-heading text-white text-3xl font-bold">{s.value}</p>
              {s.highlight && (
                <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
                  style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div>
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">Ayo AI · Split Advice</p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Your split agreements look good! One note: "Scatter the Place" has no producer split registered — if a producer contributed to the track, they should be added before your first payout to avoid disputes.
              </p>
              <Link href="/dashboard/ayo" className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                Add producer split
              </Link>
            </div>
          </div>
        </div>

        {/* Active Splits */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-4">Active Splits</p>
          <div className="flex flex-col gap-4">
            {splits.map((split) => (
              <SplitCard
                key={split.id}
                split={split}
                onEdit={() => setModal("edit")}
                onDelete={() => setModal("delete")}
              />
            ))}
          </div>
        </div>

        {/* Split Visualization */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-5">Split Visualization</p>

          <div className="grid grid-cols-2 gap-8 mb-6">
            {/* Donut + earnings */}
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_COLLABORATORS}
                      dataKey="split"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={64}
                      strokeWidth={0}
                    >
                      {MOCK_COLLABORATORS.map((c, i) => (
                        <Cell key={i} fill={c.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="font-heading text-[#C30100] text-3xl font-bold">
                  ${splits[0]?.totalEarnings.toLocaleString()}.00
                </p>
                <p className="font-body text-white/50 text-sm mt-1">Your {myCollab.split}%</p>
              </div>
            </div>

            {/* Collaborator table */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <p className="font-body text-white/30 text-[10px] uppercase tracking-wider">Collaborators</p>
                <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Role</p>
                <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Earned Split</p>
              </div>
              {MOCK_COLLABORATORS.map((c) => (
                <div key={c.name} className="grid grid-cols-3 gap-2 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="font-body text-white text-xs">
                      {c.name} {c.isYou && <span className="text-white/40">(You)</span>}
                    </span>
                  </div>
                  <span className="font-body text-white/60 text-xs text-right">{c.role}</span>
                  <span className="font-body text-white/60 text-xs text-right">{c.split}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks list */}
          <div className="border-t border-white/[0.05] pt-4">
            <p className="font-body text-white/40 text-xs uppercase tracking-wider mb-3">Tracks</p>
            <div className="flex flex-col gap-2">
              {splits.slice(0, 2).map((split) => (
                <div key={split.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <Image src={split.trackCover} alt={split.trackTitle} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="font-body text-white text-sm">{split.trackTitle}</p>
                    <p className="font-body text-white/40 text-xs">2026</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {(modal === "new" || modal === "edit") && (
        <SplitAgreementForm
          mode={modal}
          onClose={() => setModal(null)}
          onSubmit={() => setModal("success")}
        />
      )}

      {modal === "delete" && (
        <DeleteModal
          onClose={() => setModal(null)}
          onDelete={() => setModal(null)}
        />
      )}

      <SuccessModal
        isOpen={modal === "success"}
        onClose={() => setModal(null)}
        title="Split Agreement Created"
        description="Your split agreement has been successfully created and other collaborators have been notified via email."
        ctaLabel="Done"
        onCta={() => setModal(null)}
      />
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function EditIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }