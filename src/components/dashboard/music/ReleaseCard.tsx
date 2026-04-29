"use client";

import Image from "next/image";
import type { Release } from "../../../app/mock/music";
import { STATUS_CONFIG } from "../../../app/mock/music";

interface ReleaseCardProps {
  release: Release;
  onView: (r: Release) => void;
  onEdit: (r: Release) => void;
  onTakedown: (r: Release) => void;
}

export default function ReleaseCard({
  release,
  onView,
  onEdit,
  onTakedown,
}: ReleaseCardProps) {
  const status = STATUS_CONFIG[release.status];

  return (
    <div
      className="rounded-xl overflow-hidden bg-[#180F0F] border border-white/[0.06] flex flex-col cursor-pointer hover:border-white/[0.12] transition-all duration-200 group"
      onClick={() => onView(release)}
    >
      {/* Cover image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={release.cover}
          alt={release.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {/* Status badge — top right */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-body font-medium"
          style={{ color: status.color, backgroundColor: status.bg, backdropFilter: "blur(8px)" }}
        >
          {release.status === "live" && (
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
          )}
          {status.label}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Title + UPC */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading text-white uppercase text-xs tracking-wide truncate">
              {release.title}
            </p>
            <p className="font-body text-white/50 text-[11px] mt-0.5 truncate">
              {release.artist}
            </p>
          </div>
          <p className="font-body text-white/30 text-[10px] shrink-0 mt-0.5">
            UPC: {release.upc}
          </p>
        </div>

        {/* Type badge + track count */}
        <div className="flex items-center justify-between">
          <span
            className="font-body text-[10px] rounded-full px-2 py-0.5"
            style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.15)" }}
          >
            {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
          </span>
          <span className="font-body text-white/40 text-[10px] flex items-center gap-1">
            <MusicNoteIcon />
            {release.tracks.length} Track{release.tracks.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Date + actions */}
        <div
          className="flex items-center justify-between pt-2 border-t border-white/[0.05]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-body text-white/40 text-[10px] flex items-center gap-1">
            <CalendarIcon />
            {release.releaseDate}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(release); }}
              className="flex items-center gap-1 font-body text-white/60 text-[10px] hover:text-white border border-white/10 hover:border-white/30 rounded-full px-2.5 py-1 transition-colors"
            >
              <EditIcon /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTakedown(release); }}
              className="flex items-center gap-1 font-body text-[10px] rounded-full px-2.5 py-1 transition-colors"
              style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.10)", border: "1px solid rgba(195,1,0,0.25)" }}
            >
              <TakedownIcon /> Takedown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Draft card variant ──────────────────────────────────────── */
export function DraftCard({
  release,
  onContinue,
}: {
  release: Release;
  onContinue: (r: Release) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-[#180F0F] border border-white/[0.06] flex flex-col">
      {/* Cover */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={release.cover}
          alt={release.title}
          fill
          className="object-cover object-center"
          unoptimized
        />
        <div
          className="absolute top-2.5 right-2.5 font-body text-[10px] rounded-full px-2.5 py-1"
          style={{ color: "#fff", backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
        >
          Draft
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-heading text-white uppercase text-xs tracking-wide truncate">{release.title}</p>
            <p className="font-body text-white/50 text-[11px] mt-0.5 truncate">{release.artist}</p>
          </div>
          <p className="font-body text-white/30 text-[10px] shrink-0 mt-0.5">UPC: {release.upc}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body text-[10px] rounded-full px-2 py-0.5" style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.15)" }}>
            {release.type.charAt(0).toUpperCase() + release.type.slice(1)}
          </span>
          <span className="font-body text-white/40 text-[10px] flex items-center gap-1">
            <MusicNoteIcon /> {release.tracks.length} Track
          </span>
        </div>

        <button
          onClick={() => onContinue(release)}
          className="w-full mt-1 font-body text-white/60 text-[10px] border border-white/10 hover:border-white/25 rounded-lg py-2 flex items-center justify-center gap-1.5 transition-colors hover:text-white"
        >
          <EditIcon /> Continue editing
        </button>
      </div>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function MusicNoteIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function CalendarIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function EditIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TakedownIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>; }