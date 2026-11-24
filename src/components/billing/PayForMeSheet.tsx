"use client";

import { useState } from "react";

/**
 * "Pay for me": the link the artist sends to someone else (a manager, family, a label).
 * It works for 24 hours; whatever it pays for turns on by itself as soon as it is paid.
 */
export default function PayForMeSheet({
  link,
  what,
  amount,
  onClose,
}: {
  link: string;
  /** e.g. "my SongDis Growth plan" or "my Quick Drop release" */
  what: string;
  amount?: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Hi, could you help me pay for ${what}${amount ? ` (${amount})` : ""} on SongDis? Here's the secure payment link: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Pay for me on SongDis", text: message, url: link });
    } catch {
      /* cancelled or not supported */
    }
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#140C0C] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        <p className="font-heading text-white uppercase text-sm tracking-wide">Ask someone to pay</p>
        <p className="mt-1.5 font-body text-sm leading-relaxed text-white/55">
          Send this link to whoever is paying for {what}. It works for 24 hours, and it turns on for you as soon as they pay.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate font-body text-xs text-white/70">{link}</span>
          <button onClick={copy} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 font-body text-[11px] font-semibold text-white hover:border-white/40">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[48px] items-center justify-center rounded-full bg-[#25D366] font-heading text-[11px] uppercase tracking-widest text-black hover:bg-[#1fb857]"
          >
            Send on WhatsApp
          </a>
          {canShare && (
            <button onClick={share} className="flex min-h-[46px] items-center justify-center rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white/80 hover:text-white">
              Share another way
            </button>
          )}
          <button onClick={onClose} className="min-h-[40px] font-body text-xs text-white/40 hover:text-white/70">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
