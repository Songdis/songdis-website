"use client";

/**
 * The dashboard's dialog: a bottom sheet on a phone, a centred modal from `sm` up.
 *
 * Lives here rather than under `press-kit/` because it is no longer press-kit's — the
 * payout and identity flows use it too. `press-kit/primitives` re-exports it, so the
 * editor's imports are unchanged.
 *
 * Deliberately `position: fixed` with no transform on any ancestor. A transformed parent
 * becomes the containing block for fixed children and would strand this sheet somewhere
 * down the scrolling page instead of over the viewport — see the note on `.av2-settled`
 * in globals.css.
 */

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[
          "relative w-full sm:max-w-lg max-h-[88dvh] overflow-y-auto outline-none",
          "bg-[#0E0808] border-t sm:border border-white/[0.09]",
          "rounded-t-3xl sm:rounded-2xl px-5 sm:px-6 pt-3 pb-6 sm:pb-6",
        ].join(" ")}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4 sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="font-heading text-white uppercase text-base tracking-wide">{title}</h2>
            {subtitle && (
              <p className="font-body text-white/45 text-xs mt-1 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-8 h-8 rounded-full grid place-items-center text-white/50 hover:text-white border border-white/10 hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4">{children}</div>

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
}
