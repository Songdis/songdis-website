"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useBilling } from "@/lib/hooks/useBilling";
import { getSpotlights, type Spotlight } from "@/lib/api/spotlight";
import { ReleaseDetailModal } from "@/components/dashboard/music/ReleaseDetailModal";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);
  const [activeReleaseMeta, setActiveReleaseMeta] = useState<{ cover?: string; title?: string; artist?: string }>({});
  const [ayoInput, setAyoInput] = useState("");
  const router = useRouter();
  const { isLocked, isExpired, hasSubscription, needsFirstArtist } = useBilling(0);

  const lapsed = isExpired || hasSubscription;
  const lockLabel = lapsed ? "Renew your subscription" : "Subscribe to unlock";
  const lockVerb  = lapsed ? "Renew your subscription" : "Subscribe";

  const { stats, wallet, recentReleases, features } =
    data ?? {
      stats: { activeReleases: 0, totalEarnings: 0 },
      wallet: { totalEarnings: 0, period: "", streams: 0, avgPerStream: 0 },
      recentReleases: [],
      features: [],
    };

  return (
    <>
    <DashboardLayout showWelcome>
      <div className="flex flex-col gap-5">

        {needsFirstArtist && <FirstArtistCard locked={isLocked} />}

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

            <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 relative overflow-hidden">
              {isLocked && (
                <div className="absolute inset-0 z-10 bg-[#180F0F]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <p className="font-body text-white/50 text-xs text-center">{lockLabel}</p>
                </div>
              )}
              <div className={isLocked ? "opacity-30 pointer-events-none" : ""}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-body text-white/60 text-sm">Total Earnings</p>
                  <button className="text-white/30 hover:text-white transition-colors"><DollarIcon /></button>
                </div>
                <p className="font-heading text-white text-3xl font-bold">
                  ${stats.totalEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <SpotlightCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-white text-sm font-medium">Recent Releases</p>
              <Link href="/dashboard/music" className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                View All <span>→</span>
              </Link>
            </div>

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

          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 flex flex-col relative overflow-hidden">
            {isLocked && (
              <div className="absolute inset-0 z-10 bg-[#180F0F]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <p className="font-body text-white/50 text-sm text-center">{lockVerb} to view earnings</p>
                <Link href="/dashboard/settings?tab=subscription" className="font-heading text-white uppercase text-[10px] tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80000] px-4 py-2 transition-colors">
                  Renew Now
                </Link>
              </div>
            )}
            <div className={isLocked ? "flex-1 flex flex-col opacity-30 pointer-events-none" : "flex-1 flex flex-col"}>
              <div className="flex items-center justify-between mb-4 shrink-0">
                <p className="font-body text-white text-sm font-medium">Earnings</p>
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
        </div>

        {/* Ayo AI */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5 relative overflow-hidden">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-[#180F0F]/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <p className="font-body text-white/50 text-sm text-center">{lockVerb} to use Ayo AI</p>
              <Link href="/dashboard/settings?tab=subscription" className="font-heading text-white uppercase text-[10px] tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80000] px-4 py-2 transition-colors">
                Renew Now
              </Link>
            </div>
          )}
          <div className={isLocked ? "opacity-30 pointer-events-none" : ""}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#C30100]/20 border border-[#C30100]/30 flex items-center justify-center overflow-hidden">
              <Image src="/images/ayo.svg" alt="Ayo AI" width={20} height={20} unoptimized className="object-contain" />
            </div>
            <div className="flex-1">
              <p className="font-body text-white text-sm font-medium">Ayo AI</p>
              <p className="font-body text-white/40 text-xs">Ask Ayo anything · English, Pidgin, Igbo, Hausa & Yoruba</p>
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
              className="flex-1 bg-transparent font-body text-white text-base placeholder:text-white/25 outline-none"
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

/** How long each spotlight is shown before the next one. */
const SPOTLIGHT_INTERVAL_MS = 7000;

function SpotlightCard() {
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [index, setIndex] = useState(0);
  // Rotation stops while the pointer is over the card, so a fan reading the
  // headline does not have it change mid-sentence.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getSpotlights().then((res) => {
      if (cancelled || res.error || !Array.isArray(res.data)) return;
      setSpotlights(res.data);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (paused || spotlights.length < 2) return;

    const timer = setInterval(
      () => setIndex((i) => (i + 1) % spotlights.length),
      SPOTLIGHT_INTERVAL_MS
    );

    return () => clearInterval(timer);
  }, [paused, spotlights.length]);

  if (spotlights.length === 0) return null;

  // Guards against the index outliving a shorter list after a refetch.
  const spotlight = spotlights[index % spotlights.length];

  return (
    <div
      className="col-span-1 md:col-span-2 rounded-2xl border border-white/[0.06] bg-[#180F0F] overflow-hidden flex relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Touch has no hover, so pausing on tap is the equivalent affordance.
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative w-[45%] sm:w-[55%] shrink-0 min-h-[180px] sm:min-h-[220px]">
        <Image
          key={spotlight.id}
          src={spotlight.image_url}
          alt={spotlight.headline}
          fill
          unoptimized
          className="object-cover object-center animate-[spotlightFade_500ms_ease-out]"
        />
      </div>

      <div className="flex flex-col justify-center items-start px-4 sm:px-5 py-5 sm:py-6 flex-1 min-w-0">
        <p className="font-heading text-white uppercase text-xs sm:text-sm tracking-wide leading-tight mb-1">
          {spotlight.headline}
        </p>

        {spotlight.subtitle && (
          <p className="font-body text-white/45 text-[11px] sm:text-xs leading-snug mb-3 line-clamp-2">
            {spotlight.subtitle}
          </p>
        )}

        <a
          href={spotlight.article_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 sm:mt-2 font-heading text-white uppercase text-[10px] sm:text-xs tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80000] px-4 sm:px-5 py-2.5 sm:py-3 transition-all whitespace-nowrap"
        >
          {/* Just "Read" on a phone — the column is narrow and the full label
              wrapped or overflowed the pill. */}
          <span className="sm:hidden">Read</span>
          <span className="hidden sm:inline">Read Article</span>
        </a>
      </div>

      {/* Dots — also let someone jump straight to one. Hidden for a single
          spotlight, where they would just be noise. */}
      {spotlights.length > 1 && (
        <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
          {spotlights.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Show spotlight ${i + 1} of ${spotlights.length}`}
              aria-current={i === index % spotlights.length}
              className={[
                "rounded-full transition-all duration-300",
                i === index % spotlights.length
                  ? "w-5 h-1.5 bg-[#C30100]"
                  : "w-1.5 h-1.5 bg-white/25 hover:bg-white/50",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes spotlightFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function FirstArtistCard({ locked }: { locked: boolean }) {
  return (
    <div className="rounded-2xl border border-[#C30100]/30 bg-gradient-to-br from-[#1A0808] to-[#180F0F] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#C30100]/15 border border-[#C30100]/25 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-heading text-white uppercase text-sm tracking-wide">
            Create your artist profile
          </p>
          <p className="font-body text-white/50 text-xs sm:text-sm mt-1 leading-relaxed">
            This is the name your music is released under. Set it up first
          </p>
        </div>

        <Link
          href="/dashboard/settings?tab=artist-profile"
          className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-6 py-3 transition-all text-center min-h-[44px] flex items-center justify-center"
        >
          Get Started
        </Link>
      </div>

      {locked && (
        <p className="font-body text-white/30 text-[11px] mt-3 sm:pl-16">
          A plan is needed to drop your first release, and you&apos;ll be asked to pick one when you create a profile.
        </p>
      )}
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