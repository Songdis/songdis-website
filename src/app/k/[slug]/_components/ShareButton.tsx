"use client";


import { useCallback, useState } from "react";
import { Check, Share2 } from "lucide-react";

interface Props {
  title: string;
  label?: string;
  variant?: "pill" | "icon";
  className?: string;
}

export default function ShareButton({
  title,
  label,
  variant = "pill",
  className = "",
}: Props) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    if (!url) return;


    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }, [title]);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onShare}
        aria-label={copied ? "Link copied" : "Share"}
        className={`grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-[var(--pk-text)] backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)] ${className}`}
      >
        {copied ? (
          <Check className="h-[18px] w-[18px]" strokeWidth={2.4} />
        ) : (
          <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={`flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--pk-line)] bg-[var(--pk-surface)] px-6 py-4 text-[12.5px] font-bold uppercase tracking-[0.12em] text-[var(--pk-text)] transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)] ${className}`}
      style={{ fontFamily: "var(--pk-headline)" }}
    >
      {copied ? (
        <Check className="h-[18px] w-[18px]" strokeWidth={2.4} />
      ) : (
        <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
      )}
      {copied ? "Link copied" : (label ?? "Share")}
    </button>
  );
}
