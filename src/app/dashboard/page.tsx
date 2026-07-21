"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { ReleaseDetailModal } from "@/components/dashboard/music/ReleaseDetailModal";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);
  const [activeReleaseMeta, setActiveReleaseMeta] = useState<{ cover?: string; title?: string; artist?: string }>({});
  const [ayoInput, setAyoInput] = useState("");
  const router = useRouter();

  const { stats, wallet, recentReleases, features } =
    data ?? {
      stats: { activeReleases: 0, totalEarnings: 0 },
      wallet: { totalEarnings: 0, period: "", streams: 0, avgPerStream: 0 },
      recentReleases: [],
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
              <Link href="/dashboard/earnings" className="relative z-10 block w-full mt-5 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-3.5 transition-all duration-300 text-center">
                Withdraw
              </Link>
            </div>
          </div>
        </div>

        {/* Ayo AI */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#C30100]/20 border border-[#C30100]/30 flex items-center justify-center overflow-hidden">
              <Image src="/images/ayo.svg" alt="Ayo AI" width={20} height={20} unoptimized className="object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-body text-white text-sm font-medium">Ayo AI</p>
              <p className="font-body text-white/40 text-xs">Ask anything about your music career</p>
            </div>
            <Link href="/dashboard/ayo" className="font-body text-white/40 text-xs hover:text-white transition-colors">
              Open full chat →
            </Link>
          </div>

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2 mb-3">
            {["How are my streams doing?", "Plan my next release", "Generate bio"].map((s) => (
              <button
                key={s}
                onClick={() => router.push(`/dashboard/ayo?msg=${encodeURIComponent(s)}`)}
                className="font-body text-[11px] text-white/50 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1.5 hover:border-[#C30100]/30 hover:text-[#C30100] hover:bg-[#C30100]/5 transition-all"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!ayoInput.trim()) return;
              router.push(`/dashboard/ayo?msg=${encodeURIComponent(ayoInput.trim())}`);
            }}
            className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0E0808] px-4 py-2.5"
          >
            <input
              value={ayoInput}
              onChange={(e) => setAyoInput(e.target.value)}
              placeholder="Ask Ayo anything..."
              className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/25 outline-none"
            />
            <button
              type="submit"
              disabled={!ayoInput.trim()}
              className="shrink-0 w-8 h-8 rounded-full bg-[#C30100] flex items-center justify-center hover:bg-[#a80000] transition-colors disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
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