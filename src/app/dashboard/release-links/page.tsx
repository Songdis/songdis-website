"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { request } from "@/lib/api/core";
import { deleteReleaseLink } from "@/lib/api/releaseLinks";
import ShareReleaseSheet from "@/components/dashboard/release-links/ShareReleaseSheet";


interface ReleaseLink {
  id: string;
  trackTitle: string;
  cover: string;
  url: string;
  clicks: number;
  platforms: number;
  createdAt: string;
  type?: string;

  isSmartLink: boolean;
  views: number;
  conversionRate: number;
  fansCaptured: number;
  topPlatforms: Record<string, number>;
  uniqueViews: number | null;
  countries: Breakdown[];
  devices: Breakdown[];
  sources: Breakdown[];
  artist: string;
  isPresave: boolean;
  shares: Record<string, number>;
}

interface Breakdown {
  label: string;
  count: number;
}


function LinkCard({
  link,
  onShare,
  onDelete,
}: {
  link: ReleaseLink;
  onShare: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      {/* Top row — cover + title + stats */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
            {link.cover ? (
              <Image
                src={link.cover}
                alt={link.trackTitle}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-[#180F0F] flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white/20"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="font-body text-white text-sm font-medium">
              {link.trackTitle}
            </p>
            <p className="font-body text-[#C30100] text-xs mt-0.5">
              {link.url}
            </p>
          </div>
        </div>

      
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
          {link.isSmartLink && (
            <>
              <div className="text-right">
                <p className="font-body text-white text-sm font-medium">
                  {formatCount(link.views)}
                </p>
                <p className="font-body text-white/30 text-[10px]">Views</p>
              </div>
              <div className="text-right">
                <p className="font-body text-white text-sm font-medium">
                  {formatCount(link.clicks)}
                </p>
                <p className="font-body text-white/30 text-[10px]">Clicks</p>
              </div>
              <div className="text-right">
                <p className="font-body text-white text-sm font-medium">
                  {link.conversionRate > 0
                    ? `${link.conversionRate.toFixed(1)}%`
                    : "—"}
                </p>
                <p className="font-body text-white/30 text-[10px]">Tap-through</p>
              </div>
              <div className="text-right">
                <p className="font-body text-white text-sm font-medium">
                  {link.platforms}
                </p>
                <p className="font-body text-white/30 text-[10px]">Platforms</p>
              </div>
            </>
          )}
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">
              {link.createdAt}
            </p>
            <p className="font-body text-white/30 text-[10px]">Created</p>
          </div>
        </div>
      </div>


      {link.isSmartLink && Object.keys(link.topPlatforms).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(link.topPlatforms)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([platform, count]) => (
              <span
                key={platform}
                className="font-body text-white/50 text-[10px] rounded-full border border-white/10 bg-[#140C0C] px-2.5 py-1"
              >
                {platform.replace(/_/g, " ")} · {formatCount(count)}
              </span>
            ))}
        </div>
      )}

      {link.isSmartLink && <Audience link={link} />}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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

function normaliseLink(raw: Record<string, unknown>, i: number): ReleaseLink {
  return {
    id: String(raw.id ?? `link-${i}`),
    trackTitle: (raw.release_title ??
      raw.track_title ??
      raw.title ??
      "Untitled") as string,
    cover: (raw.avatar_url ?? raw.album_art_url ?? raw.cover ?? "") as string,
    url: (raw.release_link ?? raw.url ?? raw.link ?? "") as string,
    clicks: (raw.clicks ?? raw.click_count ?? 0) as number,
    platforms: Array.isArray(raw.platforms)
      ? raw.platforms.length
      : ((raw.platforms ?? 0) as number),
    createdAt: raw.created_at
      ? new Date(raw.created_at as string).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
    type: (raw.upload_type ?? "") as string,

    isSmartLink: Boolean(raw.is_smart_link),
    views: (raw.views ?? 0) as number,
    conversionRate: Number(raw.conversion_rate ?? 0),
    fansCaptured: (raw.fans_captured ?? 0) as number,
    topPlatforms: (raw.top_platforms ?? {}) as Record<string, number>,
    uniqueViews: (raw.unique_views ?? null) as number | null,
    countries: (raw.countries ?? []) as Breakdown[],
    devices: (raw.devices ?? []) as Breakdown[],
    sources: (raw.sources ?? []) as Breakdown[],
    artist: (raw.artist_display ?? raw.primary_artist ?? "") as string,
    isPresave: Boolean(raw.is_presave),
    shares: (raw.shares && !Array.isArray(raw.shares) ? raw.shares : {}) as Record<string, number>,
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

export default function ReleaseLinksPage() {
  const [links, setLinks] = useState<ReleaseLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [confirmingDelete, setConfirmingDelete] = useState<ReleaseLink | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<ReleaseLink | null>(null);
  const closeShare = useCallback(() => setSharing(null), []);

  /* Fetch release links from API */
  useEffect(() => {
    setIsLoading(true);
    request<unknown>("/release-links", { method: "GET" }, true).then((res) => {
      if (!res.error && res.data) {
        const raw = res.data as Record<string, unknown>;
        const list: Record<string, unknown>[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(raw.data)
            ? (raw.data as Record<string, unknown>[])
            : [];
        setLinks(list.map(normaliseLink));
      }
      setIsLoading(false);
    });
  }, []);

  const allFiltered = search
    ? links.filter(
        (l) =>
          l.trackTitle.toLowerCase().includes(search.toLowerCase()) ||
          l.url.toLowerCase().includes(search.toLowerCase()),
      )
    : links;
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / PAGE_SIZE));
  const filtered = allFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setDeletingId(id);

    const res = await deleteReleaseLink(Number(id));

    setDeletingId(null);

    if (res.error) {
      setDeleteError(res.error);
      return;
    }

    setLinks((prev) => prev.filter((l) => l.id !== id));
    setConfirmingDelete(null);
  };

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const totalViews = links.reduce((sum, l) => sum + l.views, 0);


  const bestPerformer = links
    .filter((l) => l.clicks > 0)
    .reduce<ReleaseLink | undefined>(
      (best, l) => (l.clicks > (best?.clicks ?? 0) ? l : best),
      undefined,
    );

  return (
    <DashboardLayout
      pageTitle="Release Links"
      customCta={{ label: "+ Create Link (Coming Soon)", onClick: () => {} }}
    >
      <div className="flex flex-col gap-5">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#C30100]/40 bg-[#C30100]/10 p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Total Links</p>

              <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
                <Image
                  src="/images/total-links.svg"
                  alt="Links"
                  width={66}
                  height={66}
                  unoptimized
                />
              </div>
            </div>
            <p className="font-heading text-white text-3xl font-bold">
              {links.length}
            </p>
            <div
              aria-hidden
              className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)",
                filter: "blur(12px)",
              }}
            />
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Total Clicks</p>
              <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
                <Image
                  src="/images/total-clicks.svg"
                  alt="Clicks"
                  width={66}
                  height={66}
                  unoptimized
                />
              </div>
            </div>
            <p className="font-heading text-white text-3xl font-bold">
              {formatCount(totalClicks)}
            </p>
            {/* Views give the clicks a denominator — 40 clicks means something
                different out of 60 visits than out of 6,000. */}
            {totalViews > 0 && (
              <p className="font-body text-white/35 text-[11px]">
                from {formatCount(totalViews)} visit
                {totalViews === 1 ? "" : "s"}
                {totalClicks > 0 &&
                  ` · ${((totalClicks / totalViews) * 100).toFixed(0)}% tapped through`}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-body text-white/60 text-xs">Best Performer</p>
              <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
                <Image
                  src="/images/money.svg"
                  alt="Performer"
                  width={66}
                  height={66}
                  unoptimized
                />
              </div>
            </div>
            <p className="font-heading text-white text-xl font-bold uppercase tracking-wide">
              {bestPerformer?.trackTitle ?? "—"}
            </p>
            <p className="font-body text-white/35 text-[11px]">
              {bestPerformer
                ? `${formatCount(bestPerformer.clicks)} click${bestPerformer.clicks === 1 ? "" : "s"}`
                : "No clicks recorded yet"}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0E0808] px-4 py-3">
          <SearchIcon />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search release links..."
            className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none"
          />
        </div>

        {/* Links list */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <p className="font-body text-white/30 text-sm text-center py-8">
              Loading release links...
            </p>
          ) : allFiltered.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-8">
              No release links found.
            </p>
          ) : (
            <>
              {filtered.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onShare={() => setSharing(link)}
                  onDelete={() => {
                    setDeleteError(null);
                    setConfirmingDelete(link);
                  }}
                />
              ))}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="font-body text-white/30 text-xs">
                    {allFiltered.length} total links
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="font-body text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-1.5 transition-colors disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="font-body text-white/30 text-xs">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="font-body text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-1.5 transition-colors disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        {sharing && (
          <ShareReleaseSheet
            release={{
              id: sharing.id,
              title: sharing.trackTitle,
              artist: sharing.artist,
              cover: sharing.cover,
              url: sharing.url,
              isPresave: sharing.isPresave,
            }}
            onClose={closeShare}
          />
        )}

        {confirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              aria-hidden
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setConfirmingDelete(null);
                setDeleteError(null);
              }}
            />

            <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-6">
              <p className="font-body text-white text-sm font-medium mb-2">
                Delete this link?
              </p>

              <p className="font-body text-white/45 text-xs leading-relaxed mb-1">
                {confirmingDelete.trackTitle}
              </p>
              <p className="font-body text-[#C30100] text-xs break-all mb-4">
                {confirmingDelete.url}
              </p>

              <p className="font-body text-white/45 text-xs leading-relaxed mb-4">
                Anywhere you have already shared this will stop working. Your
                release itself is not affected and stays on the streaming
                platforms.
              </p>

              {deleteError && (
                <p className="font-body text-[#ff6b6b] text-xs mb-4">
                  {deleteError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmingDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={deletingId !== null}
                  className="flex-1 font-body text-white text-xs border border-white/20 rounded-full py-2.5 hover:border-white/40 transition-colors min-h-[44px] disabled:opacity-40"
                >
                  Keep it
                </button>
                <button
                  onClick={() => handleDelete(confirmingDelete.id)}
                  disabled={deletingId !== null}
                  className="flex-1 font-body text-white text-xs bg-[#C30100] rounded-full py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px] disabled:opacity-40"
                >
                  {deletingId ? "Deleting..." : "Delete link"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-white/30 shrink-0"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ── Who is visiting ── */

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

function countryName(code: string) {
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function flag(code: string) {
  if (!/^[a-z]{2}$/i.test(code)) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function sourceName(domain: string) {
  const d = domain.replace(/^www\./, "").toLowerCase();
  if (d === "go.songdis.com" || d === "songdis.com") return "Direct / shared link";
  const known: Record<string, string> = {
    "t.co": "X (Twitter)", "x.com": "X (Twitter)", "twitter.com": "X (Twitter)",
    "l.instagram.com": "Instagram", "instagram.com": "Instagram",
    "l.facebook.com": "Facebook", "lm.facebook.com": "Facebook", "m.facebook.com": "Facebook", "facebook.com": "Facebook",
    "tiktok.com": "TikTok", "youtube.com": "YouTube", "wa.me": "WhatsApp", "web.whatsapp.com": "WhatsApp",
    "linktr.ee": "Linktree", "google.com": "Google", "snapchat.com": "Snapchat", "t.me": "Telegram",
  };
  return known[d] ?? d;
}

const SHARE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp", whatsapp_status: "WhatsApp Status", instagram_story: "Instagram Story",
  tiktok: "TikTok", x: "X", facebook: "Facebook", telegram: "Telegram",
};

function Audience({ link }: { link: ReleaseLink }) {
  const [open, setOpen] = useState(false);
  const has = link.countries.length + link.devices.length + link.sources.length + Object.keys(link.shares).length > 0;
  if (!has) return null;

  const groups: { title: string; rows: { label: string; count: number }[] }[] = [
    {
      title: "Top countries",
      rows: link.countries.map((c) => ({ label: `${flag(c.label)} ${countryName(c.label)}`.trim(), count: c.count })),
    },
    {
      title: "Devices",
      rows: link.devices.map((d) => ({ label: d.label.charAt(0).toUpperCase() + d.label.slice(1), count: d.count })),
    },
    {
      // Several domains can be one source (l.facebook.com, m.facebook.com…), so fold them.
      title: "Where they came from",
      rows: Object.entries(
        link.sources.reduce<Record<string, number>>((acc, r) => {
          const k = sourceName(r.label);
          acc[k] = (acc[k] ?? 0) + r.count;
          return acc;
        }, {}),
      )
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
    {
      title: "Where you shared it",
      rows: Object.entries(link.shares)
        .filter(([k]) => k !== "copy" && k !== "native")
        .map(([k, count]) => ({ label: SHARE_LABELS[k] ?? k, count }))
        .sort((a, b) => b.count - a.count),
    },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-body text-white/50 hover:text-white text-xs transition-colors"
        aria-expanded={open}
      >
        Who&apos;s listening
        {link.uniqueViews ? <span className="text-white/30">· {formatCount(link.uniqueViews)} people</span> : null}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-3 rounded-xl border border-white/[0.06] bg-[#140C0C] p-4">
          {groups.map((g) => {
            const total = g.rows.reduce((t, r) => t + r.count, 0) || 1;
            return (
              <div key={g.title} className="min-w-0">
                <p className="font-body text-white/40 text-[10px] uppercase tracking-[0.12em] mb-2.5">{g.title}</p>
                <ul className="space-y-2">
                  {g.rows.slice(0, 5).map((r) => {
                    const pct = Math.round((r.count / total) * 100);
                    return (
                      <li key={r.label}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-body text-white/80 text-xs truncate">{r.label}</span>
                          <span className="font-body text-white/40 text-[11px] shrink-0">{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-[#C30100]" style={{ width: `${Math.max(pct, 3)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
