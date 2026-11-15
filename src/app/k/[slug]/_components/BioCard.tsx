"use client";


import { useState } from "react";

const CLAMP_THRESHOLD = 320;

export default function BioCard({ bio }: { bio: string }) {
  const clampable = bio.length > CLAMP_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
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

    </div>
  );
}
