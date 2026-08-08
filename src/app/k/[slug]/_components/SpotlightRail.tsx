"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PressKitSpotlight } from "@/lib/api/press-kit-public";

export default function SpotlightRail({
  items,
}: {
  items: PressKitSpotlight[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex === null ? null : (items[openIndex] ?? null);

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  return (
    <>

      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="w-[76px] shrink-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pk-bg)] sm:w-[86px]"
          >
            <span className="block rounded-full bg-[linear-gradient(135deg,var(--pk-accent),var(--pk-gold))] p-[2.5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.title ?? "Spotlight"}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="aspect-square w-full rounded-full border-[2.5px] border-[var(--pk-bg)] bg-[var(--pk-tint)] object-cover"
              />
            </span>
            <span className="mt-2 block truncate text-[11.5px] text-[var(--pk-text-soft)]">
              {item.title ?? "Spotlight"}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? "Spotlight"}
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/50 text-white sm:right-6 sm:top-6"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </button>

          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-[560px] overflow-y-auto"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.title ?? "Spotlight"}
              referrerPolicy="no-referrer"
              className="max-h-[70vh] w-full rounded-2xl object-contain"
            />
            {(active.title || active.description) && (
              <figcaption className="mt-4 text-center">
                {active.title && (
                  <div
                    className="text-lg font-extrabold uppercase tracking-wide text-white"
                    style={{ fontFamily: "var(--pk-headline)" }}
                  >
                    {active.title}
                  </div>
                )}
                {active.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                    {active.description}
                  </p>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
