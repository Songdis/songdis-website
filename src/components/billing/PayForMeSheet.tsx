"use client";

import { useEffect, useRef, useState } from "react";
import { createPayRequest, type PayRequestInput, type PayView } from "@/lib/api/payRequests";

/**
 * "Ask someone to pay": the link (songdis.com/pay/CODE) is created as soon as this opens,
 * and the artist sends it. The person paying sees a SongDis page about the
 * artist and pays there; the plan or Quick Drop turns on for the artist as soon as they do.
 */
export default function PayForMeSheet({
  input,
  what,
  onClose,
}: {
  input: PayRequestInput;
  /** e.g. "my SongDis Growth plan" */
  what: string;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<{ url: string; view: PayView } | null>(null);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  // Created straight away: the button that opened this is the "make my link" tap.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createPayRequest(input).then((res) => {
      if (res.error || !res.data) setError(res.error ?? "Couldn't create the link. Please try again.");
      else setMade({ url: res.data.url, view: res.data.view });
    });
  }, [input]);

  const message = made
    ? `Hi! Could you help me pay for ${what} (${made.view.amount_display})? It's quick and secure: ${made.url}`
    : "";

  const copy = async () => {
    if (!made) return;
    try {
      await navigator.clipboard.writeText(made.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    if (!made) return;
    try {
      await navigator.share({ title: "Help me pay on SongDis", text: message, url: made.url });
    } catch {
      /* cancelled */
    }
  };

  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#140C0C] p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
        {!made ? (
          error ? (
            <>
              <p className="font-heading text-white uppercase text-sm tracking-wide">Ask someone to pay</p>
              <p className="mt-3 rounded-lg bg-[#C30100]/10 px-3 py-2 font-body text-sm text-[#ff8a8a]">{error}</p>
              <button onClick={onClose} className="mt-4 min-h-[44px] w-full rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white/80">Close</button>
            </>
          ) : (
            <div className="py-8 text-center">
              <svg className="mx-auto animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              <p className="mt-3 font-body text-sm text-white/60">Creating your payment link…</p>
            </div>
          )
        ) : (
          <>
            <p className="font-heading text-white uppercase text-sm tracking-wide">Your link is ready 🎉</p>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-white/55">
              They&apos;ll see your name and photo, what it&apos;s for and {made.view.amount_display}. It works for 3 days, and we&apos;ll tell you as soon as they pay.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate font-body text-sm text-white">{made.url.replace(/^https?:\/\//, "")}</span>
              <button onClick={copy} className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 font-body text-[11px] font-semibold text-white hover:border-white/40">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[50px] items-center justify-center rounded-full bg-[#25D366] font-heading text-[11px] uppercase tracking-widest text-black hover:bg-[#1fb857]"
              >
                Send on WhatsApp
              </a>
              {canShare && (
                <button onClick={share} className="flex min-h-[46px] items-center justify-center rounded-full border border-white/15 font-heading text-[11px] uppercase tracking-widest text-white/80 hover:text-white">
                  Share another way
                </button>
              )}
              <a href={made.url} target="_blank" rel="noreferrer" className="min-h-[36px] pt-2 text-center font-body text-xs text-white/45 underline underline-offset-2 hover:text-white/70">
                Preview what they&apos;ll see
              </a>
              <button onClick={onClose} className="min-h-[36px] font-body text-xs text-white/40 hover:text-white/70">Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
