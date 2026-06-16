"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { request } from "@/lib/api/core";

/* ─── Types ───────────────────────────────────────────────────── */
interface ReleaseLink {
  id: string;
  trackTitle: string;
  cover: string;
  url: string;
  clicks: number;
  platforms: number;
  createdAt: string;
  type?: string;
}

/* ─── Mock data ───────────────────────────────────────────────── */
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

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">
              {link.clicks}
            </p>
            <p className="font-body text-white/30 text-[10px]">Clicks</p>
          </div>
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">
              {link.platforms}
            </p>
            <p className="font-body text-white/30 text-[10px]">Platforms</p>
          </div>
          <div className="text-right">
            <p className="font-body text-white text-sm font-medium">
              {link.createdAt}
            </p>
            <p className="font-body text-white/30 text-[10px]">Created</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
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

/* ─── Normalise API link → ReleaseLink shape ──────────────────── */
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
  };
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function ReleaseLinksPage() {
  const [links, setLinks] = useState<ReleaseLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [copied, setCopied] = useState<string | null>(null);

  /* Fetch release links from API */
  useEffect(() => {
    setIsLoading(true);
    request<unknown>("/release-links", { method: "GET" }, true).then((res) => {
      if (!res.error && res.data) {
        const raw = res.data as Record<string, unknown>;
        // Handle paginator or plain array
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

  const handleCopy = (link: ReleaseLink) => {
    const fullUrl = link.url.startsWith("http")
      ? link.url
      : `https://${link.url}`;
    navigator.clipboard.writeText(fullUrl).catch(() => {});
    setCopied(link.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);
  const bestPerformer = links.reduce(
    (best, l) => (l.clicks > (best?.clicks ?? 0) ? l : best),
    links[0],
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
              {totalClicks}
            </p>
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
          </div>
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image
                src="/images/ayo.svg"
                alt="Ayo"
                width={20}
                height={20}
                unoptimized
              />
            </div>
            <div>
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">
                Ayo AI · Promotion Insight
              </p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Based on your streaming data, your Nigerian audience is your
                strongest segment. A targeted $50 TikTok campaign for "Scatter
                the Place" aimed at Lagos + UK Afrobeats listeners would likely
                yield 800–1,400 new listeners this week. This is your highest
                ROI opportunity right now.
              </p>
              <button className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                Launch recommended campaign
              </button>
            </div>
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
                  onCopy={() => handleCopy(link)}
                  onShare={() => {}}
                  onDelete={() => handleDelete(link.id)}
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

        {/* Copy toast */}
        {copied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A0808] border border-white/10 rounded-full px-5 py-2.5 shadow-xl">
            <p className="font-body text-white text-sm">
              Link copied to clipboard
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
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
