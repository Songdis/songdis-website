"use client";

import Link from "next/link";
import { useState } from "react";
import { EpkWordmark } from "@/app/k/[slug]/_components/PressKitChrome";
import { request } from "@/lib/api/core";

/** The paper page every getepk account screen sits on. */
export function AuthShell({
  title,
  accent,
  subtitle,
  children,
  footer,
}: {
  title: string;
  /** The last words of the title, set in signal blue. */
  accent?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F4F4F4] text-[#101010]">
      <header className="mx-auto flex max-w-[1180px] items-center px-5 py-5 sm:px-8">
        <Link href="/" aria-label="getepk home">
          <EpkWordmark className="text-[26px]" />
        </Link>
      </header>
      <div className="mx-auto w-full max-w-[440px] px-5 pb-20 pt-6 sm:pt-12">
        <h1 className="ed text-[56px] sm:text-[68px]">
          {title}
          {accent && <span className="text-[#0038FF]"> {accent}</span>}
        </h1>
        {subtitle && <p className="mt-4 text-[16px] leading-relaxed text-[#3A3A3A]">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-7 text-[14.5px] text-[#3A3A3A]">{footer}</div>}
      </div>
    </main>
  );
}

export function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  return (
    <label className="block">
      <span className="el mb-1.5 block text-[11px] text-[#3A3A3A]">{label}</span>
      <input
        {...props}
        className={[
          "min-h-[52px] w-full border-2 bg-white px-4 text-[16px] outline-none transition placeholder:text-[#8A8A8A]",
          error ? "border-[#FF4A2B]" : "border-[#101010] focus:border-[#0038FF]",
        ].join(" ")}
      />
      {error && <span className="mt-1.5 block text-[13.5px] font-semibold text-[#C2361C]">{error}</span>}
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="group flex min-h-[52px] w-full items-stretch disabled:opacity-60">
      <span className="grid w-[52px] place-items-center bg-[#101010]">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
      <span className="el flex flex-1 items-center justify-center bg-[#0038FF] text-[13px] text-white group-hover:underline">
        {busy ? "One moment…" : children}
      </span>
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-2 border-[#FF4A2B] bg-white px-4 py-3 text-[14.5px] font-semibold text-[#C2361C]">
      {message}
    </p>
  );
}

/** Google sign-in that comes back to getepk.si, not songdis.com. */
export function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    const res = await request<{ url: string }>("/auth/google/redirect?app=getepk", { method: "GET" });
    const url = res.data?.url;
    if (url) {
      window.location.href = url;
      return;
    }
    setError(res.error ?? "Google sign-in is not available right now.");
    setBusy(false);
  };

  return (
    <div>
      <div className="el my-5 flex items-center gap-3 text-[11px] text-[#6B6B6B]">
        <span className="h-0.5 flex-1 bg-[#101010]/15" /> or <span className="h-0.5 flex-1 bg-[#101010]/15" />
      </div>
      <button
        type="button"
        onClick={() => void go()}
        disabled={busy}
        className="el flex min-h-[52px] w-full items-center justify-center gap-2.5 border-2 border-[#101010] bg-white text-[13px] transition hover:bg-[#101010] hover:text-white disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-[13.5px] font-semibold text-[#C2361C]">{error}</p>}
    </div>
  );
}

/** The artist name typed on the landing page, carried through sign-up to the first kit. */
export const PENDING_NAME_KEY = "epk_pending_artist";
