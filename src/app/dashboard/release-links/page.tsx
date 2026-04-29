"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────────────────── */
interface ReleaseLink {
  id: string;
  trackTitle: string;
  cover: string;
  url: string;
  clicks: number;
  platforms: number;
  createdAt: string;
}

/* ─── Mock data ───────────────────────────────────────────────── */
const TRACKS = ["Scatter the place", "Wisdom No Dey Old", "Gratitude"];

const MOCK_LINKS: ReleaseLink[] = Array.from({ length: 4 }, (_, i) => ({
  id: `link-${i}`,
  trackTitle: "Scatter the Place",
  cover: "/images/small-blue-cover.svg",
  url: "sng.dls/scatter-vjazzy",
  clicks: 142,
  platforms: 5,
  createdAt: "Jan 5, 2026",
}));

/* ─── Create Smart Link Modal ─────────────────────────────────── */
function CreateLinkModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: () => void;
}) {
  const [track, setTrack] = useState("Scatter the place");
  const [slug, setSlug] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[580px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-7">
          Create Smart Link
        </h2>

        <div className="flex flex-col gap-5">
          {/* Track */}
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

          {/* Custom slug */}
          <div>
            <label className="font-body text-white/70 text-xs block mb-1.5">Custom Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))}
              placeholder=""
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
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
              onClick={onCreate}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
            >
              Create Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Link card ───────────────────────────────────────────────── */
function LinkCard({
  link,
  onCopy,
  onShare,
  onDelete,
}: {
  link: ReleaseLink;
  onCopy: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      {/* Top row — cover + title + stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image src={link.cover} alt={link.trackTitle} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="font-body text-white text-sm font-medium">{link.trackTitle}</p>
            <p className="font-body text-[#C30100] text-xs mt-0.5">{link.url}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">{link.clicks}</p>
            <p className="font-body text-white/30 text-[10px]">Clicks</p>
          </div>
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">{link.platforms}</p>
            <p className="font-body text-white/30 text-[10px]">Platforms</p>
          </div>
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">{link.createdAt}</p>
            <p className="font-body text-white/30 text-[10px]">Created</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onCopy}
          className="font-body text-white/60 text-xs border border-white/10 hover:border-white/25 rounded-full py-2.5 transition-colors hover:text-white"
        >
          Copy Link
        </button>
        <button
          onClick={onShare}
          className="font-body text-white/60 text-xs border border-white/10 hover:border-white/25 rounded-full py-2.5 transition-colors hover:text-white"
        >
          Share
        </button>
        <button
          onClick={onDelete}
          className="font-body text-xs rounded-full py-2.5 transition-colors border"
          style={{
            color: "#C30100",
            backgroundColor: "rgba(195,1,0,0.06)",
            borderColor: "rgba(195,1,0,0.20)",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function ReleaseLinksPage() {
  const [links, setLinks] = useState<ReleaseLink[]>(MOCK_LINKS);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = search
    ? links.filter((l) =>
        l.trackTitle.toLowerCase().includes(search.toLowerCase()) ||
        l.url.toLowerCase().includes(search.toLowerCase())
      )
    : links;

  const handleCopy = (link: ReleaseLink) => {
    navigator.clipboard.writeText(`https://${link.url}`).catch(() => {});
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const handleCreate = () => {
    setShowCreate(false);
    setShowSuccess(true);
    // Optimistically add a new link — swap for real API call later
    setLinks((prev) => [
      {
        id: `link-${Date.now()}`,
        trackTitle: "Scatter the Place",
        cover: "/images/releases/cover-blue.svg",
        url: "sng.dls/scatter-vjazzy",
        clicks: 0,
        platforms: 5,
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
      ...prev,
    ]);
  };

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const bestPerformer = links.reduce((best, l) => (l.clicks > (best?.clicks ?? 0) ? l : best), links[0]);

  return (
    <DashboardLayout
      userName="VJazzy"
      customCta={{ label: "+ Create Link", onClick: () => setShowCreate(true) }}
    >
      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#C30100]/40 bg-[#C30100]/10 p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Total Links</p>
             
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <Image src="/images/total-links.svg" alt="Links" width={66} height={66} unoptimized />
              </div>
            </div>
            <p className="font-heading text-white text-3xl font-bold">{links.length}</p>
            <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
              style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Total Clicks</p>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                <Image src="/images/total-clicks.svg" alt="Clicks" width={66} height={66} unoptimized />
              </div>
            </div>
            <p className="font-heading text-white text-3xl font-bold">{totalClicks}</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Best Performer</p>
              <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
                <Image src="/images/money.svg" alt="Performer" width={66} height={66} unoptimized />
              </div>
            </div>
            <p className="font-heading text-white text-xl font-bold uppercase tracking-wide">
              {bestPerformer?.trackTitle ?? "—"}
            </p>
          </div>
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div>
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">Ayo AI · Promotion Insight</p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Based on your streaming data, your Nigerian audience is your strongest segment. A targeted $50 TikTok campaign for "Scatter the Place" aimed at Lagos + UK Afrobeats listeners would likely yield 800–1,400 new listeners this week. This is your highest ROI opportunity right now.
              </p>
              <Link href='/dashboard/ayo' className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                Launch recommended campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0E0808] px-4 py-3">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search release links..."
            className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
          />
        </div>

        {/* Links list */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-8">No release links found.</p>
          ) : (
            filtered.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onCopy={() => handleCopy(link)}
                onShare={() => {}}
                onDelete={() => handleDelete(link.id)}
              />
            ))
          )}
        </div>

        {/* Copy toast */}
        {copied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A0808] border border-white/10 rounded-full px-5 py-2.5 shadow-xl">
            <p className="font-body text-white text-sm">Link copied to clipboard</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateLinkModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {/* Success modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Release link successfully"
        description="Release link created, copy and share with your audience."
        ctaLabel="Done"
        onCta={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function SearchIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30 shrink-0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }