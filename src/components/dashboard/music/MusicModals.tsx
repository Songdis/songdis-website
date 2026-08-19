"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Release } from "../../../app/mock/music";
import { SuccessModal } from "@/components/auth/SuccessModal";

function ModalShell({
  children,
  onClose,
  maxWidth = "max-w-[700px]",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:px-4 sm:py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        {children}
      </div>
    </div>
  );
}

export function TakedownModal({
  release,
  onClose,
  onSubmit,
  isLoading,
}: {
  release: Release;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-[680px]">
      <div className="p-4 sm:p-7">
        <div className="text-center mb-6">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide">Request Takedown</h2>
          <p className="font-body text-white/50 text-sm mt-1">This action will remove your track from all platforms</p>
        </div>

        {/* Release row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <Image src={release.cover} alt={release.title} fill className="object-cover" unoptimized />
          </div>
          <div>
            <p className="font-heading text-white uppercase text-sm tracking-wide">{release.title}</p>
            <p className="font-body text-white/50 text-xs mt-0.5">{release.artist}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Reason */}
          <div>
            <label className="font-body text-white/70 text-xs block mb-1.5">Reason for takedown</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 1000))}
              placeholder="Please explain why you want to take down this track..."
              rows={4}
              className="w-full bg-[#0E0808] border border-white/10 rounded-xl px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
            />
            <p className="font-body text-white/30 text-xs mt-1">{reason.length}/1000 Characters</p>
          </div>

          {/* Warning box */}
          <div className="border border-dashed border-[#C30100]/30 rounded-xl p-4">
            <p className="font-body text-white/70 text-xs font-semibold mb-2">Important Information:</p>
            <ul className="space-y-1.5">
              {[
                "This will remove your track from all streaming platforms",
                "The process may take 24-48 hours to complete",
                "You'll stop receiving royalties for this track",
                "This action cannot be undone easily",
                "You'll be notified once the takedown is complete",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-body text-white/40 text-xs">
                  <span className="text-[#C30100] shrink-0 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setConfirmed(!confirmed)}
              className={[
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                confirmed ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
              ].join(" ")}
            >
              {confirmed && <CheckIcon />}
            </div>
            <p className="font-body text-white/60 text-xs leading-relaxed">
              I understand that this will remove my track from all platforms and that this action is difficult to reverse. I confirm that I want to proceed with this takedown request.
            </p>
          </label>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onSubmit(reason)}
              disabled={!reason.trim() || !confirmed || isLoading}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Submitting..." : "Submit Takedown Request"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export { SuccessModal };

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlayIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function PauseIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function VolumeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>; }
function CalendarIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function MusicIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function CheckIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }