"use client";


import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";

const CLAMP_THRESHOLD = 320;

export default function BioCard({ bio }: { bio: string }) {
  const clampable = bio.length > CLAMP_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bio);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
    }
  }, [bio]);

  return (
    <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-5 sm:p-6 lg:p-7">
      <p
        className={`whitespace-pre-line text-[15px] leading-[1.7] text-[var(--pk-text-soft)] sm:text-base ${
          clampable && !expanded ? "line-clamp-[7]" : ""
        }`}
      >
        {bio}
      </p>

      {clampable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-semibold text-[var(--pk-accent)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--pk-line)] bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-[var(--pk-text)] transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
        >
          {copied ? (
            <Check className="h-[15px] w-[15px] text-[var(--pk-accent)]" strokeWidth={2.4} />
          ) : (
            <Copy className="h-[15px] w-[15px]" strokeWidth={2} />
          )}
          {copied ? "Bio copied" : "Copy bio"}
        </button>
      </div>
    </div>
  );
}
