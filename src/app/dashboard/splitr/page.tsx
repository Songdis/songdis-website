"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  useSplits,
  useCreateSplit,
  useUpdateSplit,
  useSplitEarnings,
  type NormalisedSplit,
} from "@/lib/hooks/useSplit";
import { updateRecipient, addRecipient } from "@/lib/api/splitr";
import { useMusic } from "@/lib/hooks/useMusic";
import { useUser } from "@/lib/hooks/useUser";

interface SplitFormProps {
  mode: "new" | "edit";
  split?: NormalisedSplit;
  musicUploadOptions: Array<{ id: number; title: string }>;
  onClose: () => void;
  onSubmit: (data: {
    musicUploadId: number;
    splitName: string;
    collaborators: Array<{ email: string; fullName: string; percentage: number }>;
  }) => void;
  isLoading?: boolean;
}

function SplitAgreementForm({ mode, split, musicUploadOptions, onClose, onSubmit, isLoading }: SplitFormProps) {
  const [selectedUploadId, setSelectedUploadId] = useState(
    split?.musicUploadId ?? musicUploadOptions[0]?.id ?? 0
  );
  const [splitName, setSplitName] = useState(split?.splitName ?? "");

  const [collaborators, setCollaborators] = useState(
    split?.collaborators.filter((c) => !c.isYou).map((c) => ({
      email: c.email,
      fullName: c.name,
      percentage: String(c.split),
    })) ?? [{ email: "", fullName: "", percentage: "" }]
  );

  const addCollaborator = () =>
    setCollaborators((prev) => [...prev, { email: "", fullName: "", percentage: "" }]);

  const updateCollab = (i: number, field: string, value: string | number) =>
    setCollaborators((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const handleSubmit = () => {
    onSubmit({
      musicUploadId: selectedUploadId,
      splitName: (splitName || musicUploadOptions.find(m => m.id === selectedUploadId)?.title) ?? "Split Agreement",
      collaborators: collaborators.map((c) => ({
        ...c,
        percentage: parseFloat(c.percentage) || 0,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[700px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>
        <div className="p-8">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-7">
            {mode === "new" ? "New Split Agreement" : "Edit Split Agreement"}
          </h2>

          <div className="flex flex-col gap-5">
            {/* Track select */}
            <Field label="Track">
              <div className="relative">
                <select
                  value={selectedUploadId}
                  onChange={(e) => setSelectedUploadId(Number(e.target.value))}
                  className={selectCls}
                >
                  {musicUploadOptions.length === 0
                    ? <option>No releases found</option>
                    : musicUploadOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))
                  }
                </select>
                <ChevronIcon />
              </div>
            </Field>

            {/* Split name */}
            <Field label="Split Name (Optional)">
              <input
                value={splitName}
                onChange={(e) => setSplitName(e.target.value)}
                placeholder="e.g. Producer Split for Gratitude"
                className={inputCls}
              />
            </Field>

            <Field label="Your Share">
              <input
                value="You (Owner)"
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </Field>

            {/* Collaborators */}
            {collaborators.map((collab, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-white/70 text-xs">Full Name *</label>
                    <input
                      type="text"
                      value={collab.fullName}
                      onChange={(e) => updateCollab(i, "fullName", e.target.value)}
                      placeholder="e.g John Doe"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-body text-white/70 text-xs">Collaborator Email *</label>
                    <input
                      type="email"
                      value={collab.email}
                      onChange={(e) => updateCollab(i, "email", e.target.value)}
                      placeholder="e.g johndoe@gmail.com"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-body text-white/70 text-xs">Split Percentage (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g 50"
                    value={collab.percentage}
                    onChange={(e) => {

                      const next = e.target.value.replace(/[^0-9.]/g, "");
                      if ((next.match(/\./g)?.length ?? 0) > 1) return;
                      updateCollab(i, "percentage", next);
                    }}
                    className={inputCls}
                  />
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

            <div className="flex flex-col sm:flex-row gap-3 mt-2 pb-[env(safe-area-inset-bottom)] sm:pb-0">
              <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || collaborators.every(c => !c.email || !c.fullName)}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
              >
                {isLoading ? "Saving..." : mode === "new" ? "Create Split Agreement" : "Update Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ onClose, onDelete, isLoading }: {
  onClose: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-6 sm:p-8 text-center mx-4 sm:mx-0">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>
        <div className="flex justify-center mb-5">
          <TrashLargeIcon />
        </div>
        <h2 className="font-body text-white text-xl font-bold mb-3">Delete Split Agreement</h2>
        <p className="font-body text-white/60 text-sm leading-relaxed mb-8">
          Are you sure you want to delete this agreement? This action cannot be undone
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SplitCard({ split, onEdit, onDelete }: {
  split: NormalisedSplit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image src={split.trackCover} alt={split.trackTitle} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="font-body text-white text-sm font-medium">{split.trackTitle}</p>
            {split.pendingCount > 0 && (
              <p className="font-body text-[#C30100] text-[11px]">
                {split.pendingCount} party Pending Acceptance
              </p>
            )}
            {split.isLocked && (
              <p className="font-body text-yellow-400 text-[11px]">Locked</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            disabled={split.isLocked}
            className="flex items-center gap-1 font-body text-white/60 text-xs border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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

      <div className="border-t border-white/[0.05] pt-3">
        <div className="hidden sm:grid grid-cols-3 gap-2 mb-2">
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider">Collaborators</p>
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Role</p>
          <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Split %</p>
        </div>
        {split.collaborators.map((c) => (
          <div key={c.email} className="flex flex-wrap sm:grid sm:grid-cols-3 gap-1 sm:gap-2 py-1.5">
            <span className="font-body text-white text-xs truncate">
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

type ModalState = "new" | "edit" | "delete" | "success" | null;

export default function SplitrPage() {
  const [modal, setModal] = useState<ModalState>(null);
  const [activeSplit, setActiveSplit] = useState<NormalisedSplit | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { splits, isLoading, stats, refresh, remove } = useSplits();
  const { earnings, totalEarnings } = useSplitEarnings();
  const { create, isLoading: createLoading } = useCreateSplit();
  const { update, isLoading: updateLoading } = useUpdateSplit();
  const { releases } = useMusic();
  const { user } = useUser();
  const musicUploadOptions = releases.map((r) => ({ id: Number(r.id), title: r.title }));
  const vizSplit = splits[0] ?? null;
  const vizCollabs = vizSplit?.collaborators ?? [];
  const myShare = vizCollabs.find((c) => c.isYou)?.split ?? 0;

  const handleCreate = async (data: {
    musicUploadId: number;
    splitName: string;
    collaborators: Array<{ email: string; fullName: string; percentage: number }>;
  }) => {
    await create(
      {
        music_upload_id: data.musicUploadId,
        split_name: data.splitName,
        recipients: data.collaborators
          .filter((c) => c.email)
          .map((c) => ({
            email: c.email,
            full_name: c.fullName || c.email.split("@")[0],
            percentage: c.percentage,
          })),
      },
      () => {
        setModal("success");
        refresh();
      }
    );
  };

  const handleUpdate = async (data: {
    musicUploadId: number;
    splitName: string;
    collaborators: Array<{ email: string; fullName: string; percentage: number }>;
  }) => {
    if (!activeSplit) return;

    if (data.splitName !== activeSplit.splitName) {
      await update(activeSplit.id, { split_name: data.splitName });
    }

    const existingRecipients = activeSplit.collaborators.filter((c) => !c.isYou);
    for (const collab of data.collaborators) {
      const existing = existingRecipients.find((r) => r.email === collab.email);
      if (existing && existing.split !== collab.percentage) {
        await updateRecipient(activeSplit.id, existing.recipientId, {
          percentage: collab.percentage,
        });
      } else if (!existing && collab.email) {
        await addRecipient(activeSplit.id, {
          email: collab.email,
          full_name: collab.fullName || collab.email.split("@")[0],
          percentage: collab.percentage,
        });
      }
    }

    refresh();
    setModal("success");
  };

  const handleDelete = async () => {
    if (!activeSplit) return;
    setDeleteLoading(true);
    await remove(activeSplit.id);
    setDeleteLoading(false);
    setModal(null);
    setActiveSplit(null);
  };

  return (
    <DashboardLayout customCta={{ label: "+ New Split", onClick: () => { setActiveSplit(null); setModal("new"); } }}>
      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Active Agreements", value: isLoading ? "..." : stats.activeAgreements, icon: "/images/money.svg", highlight: true },
            { label: "Collaborators",      value: isLoading ? "..." : stats.collaborators,     icon: "/images/streams.svg" },
            { label: "Pending Acceptance", value: isLoading ? "..." : stats.pendingAcceptance, icon: "/images/streams.svg" },
          ].map((s) => (
            <div key={s.label} className={["rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
              s.highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
              <div className="flex items-center justify-between">
                <p className="font-body text-white/60 text-xs">{s.label}</p>
                <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
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
                {splits.length === 0
                  ? "You have no split agreements yet. Create one to automatically share royalties with collaborators on each payout cycle."
                  : `You have ${splits.length} active split agreement${splits.length > 1 ? "s" : ""}. Splits are distributed automatically on each payout cycle.`
                }
              </p>
              <button
                onClick={() => { setActiveSplit(null); setModal("new"); }}
                className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors"
              >
                Create split agreement
              </button>
            </div>
          </div>
        </div>

        {/* Active Splits */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-4">Active Splits</p>
          {isLoading ? (
            <p className="font-body text-white/30 text-sm text-center py-8">Loading splits...</p>
          ) : splits.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-8">No split agreements yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {splits.map((split) => (
                <SplitCard
                  key={split.id}
                  split={split}
                  onEdit={() => { setActiveSplit(split); setModal("edit"); }}
                  onDelete={() => { setActiveSplit(split); setModal("delete"); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Split Visualization */}
        {vizSplit && (
          <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
            <p className="font-body text-white text-sm font-medium mb-5">Split Visualization</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-6">
                <div className="w-36 h-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={vizCollabs} dataKey="split" cx="50%" cy="50%" innerRadius={40} outerRadius={64} strokeWidth={0}>
                        {vizCollabs.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="font-heading text-[#C30100] text-3xl font-bold">
                    ${totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="font-body text-white/50 text-sm mt-1">Your {myShare}%</p>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider">Collaborators</p>
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Role</p>
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Split</p>
                </div>
                {vizCollabs.map((c) => (
                  <div key={c.email} className="grid grid-cols-3 gap-2 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="font-body text-white text-xs truncate">
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
                {splits.slice(0, 3).map((split) => (
                  <div key={split.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                      <Image src={split.trackCover} alt={split.trackTitle} fill className="object-cover" unoptimized />
                    </div>
                    <div>
                      <p className="font-body text-white text-sm">{split.trackTitle}</p>
                      <p className="font-body text-white/40 text-xs">{split.collaborators.length} collaborators</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "new" && (
        <SplitAgreementForm
          mode="new"
          musicUploadOptions={musicUploadOptions}
          onClose={() => setModal(null)}
          onSubmit={handleCreate}
          isLoading={createLoading}
        />
      )}
      {modal === "edit" && activeSplit && (
        <SplitAgreementForm
          mode="edit"
          split={activeSplit}
          musicUploadOptions={musicUploadOptions}
          onClose={() => setModal(null)}
          onSubmit={handleUpdate}
          isLoading={updateLoading}
        />
      )}
      {modal === "delete" && (
        <DeleteModal
          onClose={() => setModal(null)}
          onDelete={handleDelete}
          isLoading={deleteLoading}
        />
      )}
      <SuccessModal
        isOpen={modal === "success"}
        onClose={() => setModal(null)}
        title="Split Agreement Created"
        description="Your split agreement has been successfully created and collaborators have been notified via email."
        ctaLabel="Done"
        onCta={() => setModal(null)}
      />
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="font-body text-white/70 text-xs">{label}</label>{children}</div>;
}
const inputCls  = "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors";
const selectCls = "w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8";

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function EditIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>; }
function TrashLargeIcon() { return <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }