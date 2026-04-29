"use client";

import { useEffect } from "react";
import { AuthButton } from "@/components/auth/AuthPrimitives";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  description,
  ctaLabel,
  onCta,
}: SuccessModalProps) {
  /* Lock body scroll while open */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          animation: "fadeIn 200ms ease forwards",
        }}
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-[#1A0808] border border-white/[0.08] p-8 flex flex-col items-center text-center"
        style={{ animation: "scaleIn 250ms ease forwards" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors focus-visible:outline-none"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Check circle */}
        <div className="mb-6 relative">
          <svg
            width="90"
            height="90"
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="45" cy="45" r="43" stroke="#C30100" strokeWidth="2" />
            <path
              d="M28 45L40 57L62 33"
              stroke="#C30100"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ animation: "drawCheck 400ms ease 200ms forwards", strokeDasharray: 60, strokeDashoffset: 60 }}
            />
          </svg>
        </div>

        <h2
          id="success-modal-title"
          className="font-body text-white text-xl font-semibold mb-3"
        >
          {title}
        </h2>

        <p className="font-body text-white/60 text-sm leading-relaxed mb-8">
          {description}
        </p>

        <AuthButton onClick={onCta}>
          {ctaLabel}
        </AuthButton>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}