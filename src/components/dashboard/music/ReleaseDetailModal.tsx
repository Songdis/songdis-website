"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useReleaseDetail, type NormalisedReleaseDetail, isTakedownEligible } from "@/lib/hooks/useMusic";
import { getPlatformLogoUrl } from "@/lib/hooks/useRoyalties";
import {
  getReleaseLink,
  deleteReleaseLink,
  createReleaseLink,
  type ReleaseLink,
} from "@/lib/api/releaseLinks";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  live:               { label: "Live",       color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  pending:            { label: "Pending",    color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  delivered:          { label: "Delivered",  color: "#3668FF", bg: "rgba(54,104,255,0.15)" },
  distributed:        { label: "Distributed",color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  need_documentation: { label: "Needs Docs", color: "#C30100", bg: "rgba(195,1,0,0.15)" },
  draft:              { label: "Draft",      color: "#ffffff", bg: "rgba(255,255,255,0.10)" },
  takedown:           { label: "Takedown",   color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  rejected:           { label: "Rejected",   color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

function formatPlatformName(key: string): string {
  const known: Record<string, string> = {
    spotify: "Spotify", apple_music: "Apple Music", youtube_music: "YouTube Music",
    amazon_music: "Amazon Music", tidal: "Tidal", deezer: "Deezer",
    audiomack: "Audiomack", boomplay: "Boomplay", soundcloud: "SoundCloud",
    tiktok: "TikTok", "7digital": "7digital", acrcloud: "ACRCloud",
    alibaba: "Alibaba Music", pandora: "Pandora", napster: "Napster",
    iheartradio: "iHeartRadio", shazam: "Shazam", qobuz: "Qobuz",
    bandcamp: "Bandcamp", vevo: "Vevo", anghami: "Anghami", triller: "Triller",
  };
  return known[key] ?? key.split(/[\s_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function PlatformTile({ platformKey }: { platformKey: string }) {
  const [failed, setFailed] = useState(false);
  const name = formatPlatformName(platformKey);
  const logoUrl = getPlatformLogoUrl(platformKey);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#C30100]/20 bg-[#0E0808] p-3">
      <div className="w-9 h-9 rounded-lg bg-[#140C0C] flex items-center justify-center shrink-0 overflow-hidden p-1.5">
        {logoUrl && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} onError={() => setFailed(true)} className="w-full h-full object-contain" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-body text-white text-sm font-medium truncate">{name}</p>
      </div>
    </div>
  );
}

/* ─── Track row — now with real audio playback ────────────────── */
function TrackRow({ track }: { track: NormalisedReleaseDetail["tracks"][number] }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const credits = [
    track.producers && `Prod. by ${track.producers}`,
    track.writers && `Written by ${track.writers}`,
    track.performers && `Performed by ${track.performers}`,
  ].filter(Boolean).join(" · ");

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !track.audioUrl) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => setPlaying(false));
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#C30100]/15 bg-[#0E0808] p-3.5">
      <button
        onClick={togglePlay}
        disabled={!track.audioUrl}
        className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      {track.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          preload="none"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-body text-white text-sm">{track.title}</p>
        {credits && <p className="font-body text-white/35 text-[11px] mt-0.5 truncate">{credits}</p>}


        {track.isrc && (
          <p className="font-mono text-white/40 text-[11px] mt-1 select-all break-all">
            <span className="font-body text-white/25 mr-1">ISRC</span>
            {track.isrc}
          </p>
        )}
      </div>
      {track.duration && <p className="font-body text-white/40 text-xs shrink-0">{track.duration}</p>}
    </div>
  );
}

/**
 * The release's shareable smart link — one URL that sends a fan to whichever
 * store they use.
 *
 * Created by Songdis when the release is assigned its UPC, so it is not
 * something the artist can act on if it is missing. This renders nothing at
 * all in that case rather than showing an empty box or a "coming soon" the
 * artist can do nothing about.
 */
function ShareLinkSection({ releaseId }: { releaseId: number }) {
  const [link, setLink] = useState<ReleaseLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks whether this release could have a link at all, so a deleted one can
  // offer to come back instead of the section vanishing with no way to undo.
  const [couldHaveLink, setCouldHaveLink] = useState(false);

  const load = useCallback(async () => {
    const res = await getReleaseLink(releaseId);

    if (!res.error) {
      setLink(res.data ?? null);
      if (res.data) setCouldHaveLink(true);
    }
  }, [releaseId]);

  useEffect(() => {
    let cancelled = false;

    getReleaseLink(releaseId).then((res) => {
      if (cancelled || res.error) return;
      setLink(res.data ?? null);
      if (res.data) setCouldHaveLink(true);
    });

    return () => { cancelled = true; };
  }, [releaseId]);

  const remove = async () => {
    setBusy(true);
    setError(null);

    const res = await deleteReleaseLink(releaseId);

    setBusy(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setLink(null);
    setConfirmingDelete(false);
  };

  const rebuild = async () => {
    setBusy(true);
    setError(null);

    const res = await createReleaseLink(releaseId);

    if (res.error) {
      setBusy(false);
      setError(res.error);
      return;
    }

    // Creation runs on a queue, so the link is not there the instant this
    // returns. Give it a moment, then re-read.
    setTimeout(async () => {
      await load();
      setBusy(false);
    }, 2500);
  };

  // Deleted, but this release qualifies for one — offer it back rather than
  // leaving the artist with no route to a link they used to have.
  if (!link?.smart_link) {
    if (!couldHaveLink) return null;

    return (
      <div className="mb-6">
        <p className="font-body text-white text-sm font-medium mb-3">Share Link</p>

        <div className="rounded-xl border border-white/[0.08] bg-[#0E0808] p-4">
          <p className="font-body text-white/40 text-xs mb-3">
            This release has no share link right now.
          </p>

          {error && (
            <p className="font-body text-[#ff6b6b] text-xs mb-3">{error}</p>
          )}

          <button
            onClick={rebuild}
            disabled={busy}
            className="font-body text-xs text-white border border-white/15 rounded-full px-4 py-2 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
          >
            {busy ? "Creating..." : "Create link"}
          </button>
        </div>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link.smart_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins and in some in-app browsers.
      // The link is visible and selectable either way, so this is not worth
      // interrupting the artist over.
    }
  };

  const pending = link.resolution_status === "PENDING";

  return (
    <div className="mb-6">
      <p className="font-body text-white text-sm font-medium mb-3">Share Link</p>

      <div className="rounded-xl border border-white/[0.08] bg-[#0E0808] p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={link.smart_link}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body text-[#C30100] text-sm hover:underline truncate flex-1 min-w-0"
          >
            {link.smart_link.replace(/^https?:\/\//, "")}
          </a>

          <button
            onClick={copy}
            className="font-body text-xs text-white border border-white/15 rounded-full px-3 py-1.5 hover:bg-white/[0.06] transition-colors shrink-0"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* The link works immediately; the store buttons behind it are filled
            in a moment later. Say so, rather than letting an artist think a
            half-ready page is the finished thing. */}
        {pending ? (
          <p className="font-body text-white/35 text-xs mt-2.5">
            Still finding this release on streaming platforms — the link works now,
            and stores will appear on it shortly.
          </p>
        ) : link.resolved_platforms.length > 0 ? (
          <p className="font-body text-white/35 text-xs mt-2.5">
            Live on {link.resolved_platforms.length} platform
            {link.resolved_platforms.length !== 1 ? "s" : ""}
          </p>
        ) : null}

        {error && (
          <p className="font-body text-[#ff6b6b] text-xs mt-2.5">{error}</p>
        )}

        {/* Deliberately quiet, and behind a confirm: anyone who has already
            shared this URL will find it dead once it is deleted. */}
        {confirmingDelete ? (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <p className="font-body text-white/50 text-xs mb-3 leading-relaxed">
              Delete this link? Anywhere you have already shared it will stop
              working. You can create a new one afterwards, but it may be a
              different address.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="font-body text-xs text-white border border-white/15 rounded-full px-4 py-2 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
              >
                Keep it
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="font-body text-xs text-white bg-[#C30100] rounded-full px-4 py-2 hover:bg-[#a80000] transition-colors disabled:opacity-40"
              >
                {busy ? "Deleting..." : "Delete link"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => { setError(null); setConfirmingDelete(true); }}
            className="font-body text-white/30 text-[11px] hover:text-[#C30100] transition-colors mt-3"
          >
            Delete link
          </button>
        )}
      </div>
    </div>
  );
}

export function ReleaseDetailModal({
  uploadId,
  cover,
  fallbackTitle,
  fallbackArtist,
  onClose,
  onRequestEdit,
  onRequestTakedown,
}: {
  uploadId: number;
  cover?: string;
  fallbackTitle?: string;
  fallbackArtist?: string;
  onClose: () => void;
  onRequestEdit?: () => void;
  onRequestTakedown?: () => void;
}) {
  const { release, isLoading, error } = useReleaseDetail(uploadId);
  const status = STATUS_CONFIG[release?.status ?? "live"] ?? STATUS_CONFIG.live;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[780px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 z-10 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            <p className="font-body text-white/40 text-sm">Loading release...</p>
          </div>
        ) : error || !release ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
            <p className="font-body text-white/50 text-sm">Couldn&apos;t load this release.</p>
            <p className="font-body text-white/30 text-xs">{error}</p>
          </div>
        ) : (
          <div className="p-7">
            {/* Header */}
            <div className="flex gap-5 mb-6">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-[#0E0808]">
                {release.cover || cover ? (
                  <Image src={(release.cover || cover) as string} alt={release.title || "Release artwork"} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-1.5 min-w-0">
                <p className="font-body text-white/50 text-xs flex items-center gap-1.5"><SparkleIcon /> Release</p>
                <h2 className="font-heading text-white uppercase text-lg sm:text-xl tracking-wide truncate">{release.title || fallbackTitle}</h2>
                <p className="font-body text-white/60 text-sm">{release.artist || fallbackArtist}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="font-body text-xs rounded-full px-2.5 py-1" style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.15)" }}>
                    {release.type === "single" ? "Single" : "Album/EP"}
                  </span>
                  <span className="font-body text-xs rounded-full px-2.5 py-1 flex items-center gap-1.5" style={{ color: status.color, backgroundColor: status.bg }}>
                    {release.status === "live" && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 font-body text-white/40 text-xs flex-wrap">
                  {release.releaseDate && <span className="flex items-center gap-1"><CalendarIcon /> {release.releaseDate}</span>}
                  <span className="flex items-center gap-1"><MusicIcon /> {release.tracks.length} Track{release.tracks.length !== 1 ? "s" : ""}</span>
                </div>
                {release.upc && <p className="font-body text-white/30 text-xs">UPC: {release.upc}</p>}
              </div>
            </div>

            <ShareLinkSection releaseId={uploadId} />

            {/* Track list */}
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-white text-sm font-medium">Track List</p>
              <button className="flex items-center gap-1.5 font-body text-xs border border-[#C30100]/50 text-white rounded-full px-3 py-1.5 hover:bg-[#C30100]/10 transition-colors">
                <PlayIcon /> Play All
              </button>
            </div>
            <div className="flex flex-col gap-2 mb-6">
              {release.tracks.length === 0 ? (
                <p className="font-body text-white/30 text-sm text-center py-6">No track details available.</p>
              ) : release.tracks.map((track) => <TrackRow key={track.id} track={track} />)}
            </div>

            {/* Release information */}
            <p className="font-body text-white text-sm font-medium mb-3">Release Information</p>
            <div className="rounded-xl border border-white/[0.08] bg-[#0E0808] divide-y divide-white/[0.05] mb-6">
              {[
                ["Primary Artist", release.artist],
                ["Release type", release.type === "single" ? "Single" : "Album/EP"],
                ["UPC", release.upc],
                ...(release.tracks.length === 1
                  ? [["ISRC", release.tracks[0]?.isrc ?? ""]]
                  : []),
                ["Label", release.label || "Independent"],
                ["Release date", release.releaseDate],
                ["Genre", release.genre],
                ["Language", release.language],
                ["© / ℗", [release.cLine, release.pLine].filter(Boolean).join(" ")],
              ].filter(([, v]) => v).map(([label, value]) => {
                const isIdentifier = label === "UPC" || label === "ISRC";

                return (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <p className="font-body text-white/50 text-xs shrink-0">{label}</p>
                    <p
                      className={[
                        "text-xs text-right break-all",
                        isIdentifier ? "font-mono text-white select-all" : "font-body text-white",
                      ].join(" ")}
                    >
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Distribution */}
            {release.platforms.length > 0 && (
              <>
                <p className="font-body text-white text-sm font-medium mb-3">Distribution</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {release.platforms.map((p) => <PlatformTile key={p} platformKey={p.toLowerCase()} />)}
                </div>
              </>
            )}

            {/* Ayo insight */}
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/[0.04] p-4 mb-6 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
                <BoltIcon />
              </div>
              <div>
                <p className="font-body text-yellow-400 text-xs font-semibold mb-1">Ayo AI · Earnings Insight</p>
                <p className="font-body text-white/55 text-xs leading-relaxed">
                  &quot;{release.title}&quot; is performing well in your catalog. Want me to draft a Splitr promo or build a Release Link to push it further?
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                Cancel
              </button>
              {onRequestTakedown && isTakedownEligible(release.releaseDateIso) && (
                <button onClick={onRequestTakedown} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                  Request Takedown
                </button>
              )}
              {onRequestTakedown && !isTakedownEligible(release.releaseDateIso) && (
                <button
                  aria-disabled
                  title="Available 1 year after the release date"
                  className="flex-1 font-heading text-white/35 uppercase text-xs tracking-widest rounded-full border border-white/10 py-3.5 cursor-not-allowed"
                >
                  Request Takedown
                </button>
              )}
              {onRequestEdit && (
                <button onClick={onRequestEdit} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all">
                  Edit Release
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlayIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function PauseIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function CalendarIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function MusicIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function SparkleIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>; }
function BoltIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }