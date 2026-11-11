"use client";

import Link from "next/link";
import { useState } from "react";
import { EpkWordmark } from "@/app/k/[slug]/_components/PressKitChrome";
import { request } from "@/lib/api/core";

/** The paper card every getepk account page sits in. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F4F1EA] text-[#121110]">
      <header className="mx-auto flex max-w-[1180px] items-center px-5 py-5 sm:px-8">
        <Link href="/" aria-label="getepk home">
          <EpkWordmark className="text-[26px]" />
        </Link>
      </header>
      <div className="mx-auto w-full max-w-[420px] px-5 pb-20 pt-8 sm:pt-14">
        <h1 className="text-[44px] leading-[1] tracking-[-0.01em]" style={{ fontFamily: "var(--font-epk-serif)" }}>
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-[15.5px] leading-relaxed text-black/60">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-[14px] text-black/55">{footer}</div>}
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
      <span className="mb-1.5 block text-[13px] font-medium text-black/70">{label}</span>
      <input
        {...props}
        className={[
          "w-full rounded-xl bg-white px-4 py-3 text-[15px] outline-none ring-1 transition placeholder:text-black/30",
          error ? "ring-[#C30100]" : "ring-black/10 focus:ring-2 focus:ring-[#121110]",
        ].join(" ")}
      />
      {error && <span className="mt-1.5 block text-[13px] text-[#C30100]">{error}</span>}
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-full bg-[#121110] px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
    >
      {busy ? "One moment…" : children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-[#C30100]/[0.07] px-4 py-3 text-[14px] text-[#9A0000]">
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
      <div className="my-5 flex items-center gap-3 text-[12px] uppercase tracking-[0.14em] text-black/35">
        <span className="h-px flex-1 bg-black/10" /> or <span className="h-px flex-1 bg-black/10" />
      </div>
      <button
        type="button"
        onClick={() => void go()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-5 py-3.5 text-[15px] font-medium ring-1 ring-black/10 transition hover:ring-black/25 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && <p className="mt-2 text-[13px] text-[#C30100]">{error}</p>}
    </div>
  );
}

/** The artist name typed on the landing page, carried through sign-up to the first kit. */
export const PENDING_NAME_KEY = "epk_pending_artist";
