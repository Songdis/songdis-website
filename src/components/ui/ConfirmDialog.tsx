"use client";

import { useCallback, useEffect, useRef, useState } from "react";


const EXIT_MS = 150;

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Never mind",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);


  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMounted(true);

      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setIsVisible(true));
      });

      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setIsVisible(false);
    const timer = setTimeout(() => setIsMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => cancelRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  const dismiss = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  useEffect(() => {
    if (!isMounted) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }

      if (e.key !== "Tab") return;

      const root = document.getElementById("confirm-dialog-panel");
      const focusable = root?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMounted, dismiss]);

  useEffect(() => {
    if (!isMounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        aria-hidden
        onClick={dismiss}
        className={[
          "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity",
          isVisible ? "opacity-100 duration-200 ease-out" : "opacity-0 duration-150 ease-in",
        ].join(" ")}
      />

      <div
        id="confirm-dialog-panel"
        className={[
          "relative w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#1A0808] p-6 shadow-2xl shadow-black/60",
          "transition-[opacity,transform] will-change-[opacity,transform]",
          isVisible
            ? "opacity-100 translate-y-0 scale-100 duration-200 ease-out"
            : "opacity-0 translate-y-2 scale-95 duration-150 ease-in",
          "motion-reduce:transform-none motion-reduce:transition-opacity",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className={[
              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
              destructive ? "bg-[#C30100]/15" : "bg-white/[0.06]",
            ].join(" ")}
          >
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={destructive ? "#C30100" : "rgba(255,255,255,0.6)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <div className="min-w-0 pt-0.5">
            <h2
              id="confirm-dialog-title"
              className="font-heading text-white uppercase text-sm tracking-wide leading-snug"
            >
              {title}
            </h2>
          </div>
        </div>

        <div className="font-body text-white/60 text-sm leading-relaxed mb-6">
          {message}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            ref={cancelRef}
            onClick={dismiss}
            disabled={busy}
            className="flex-1 font-heading uppercase text-[10px] tracking-widest rounded-full border border-white/20 py-3 text-white/70 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={busy}
            className={[
              "flex-1 font-heading uppercase text-[10px] tracking-widest rounded-full py-3 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]",
              "flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2",
              destructive
                ? "border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] focus-visible:ring-[#C30100]"
                : "bg-[#C30100] hover:bg-[#a80000] focus-visible:ring-[#C30100]",
            ].join(" ")}
          >
            {busy && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            )}
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
