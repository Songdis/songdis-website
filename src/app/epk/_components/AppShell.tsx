"use client";

import Link from "next/link";
import { EpkWordmark } from "@/app/k/[slug]/_components/PressKitChrome";
import { removeToken } from "@/lib/api/core";

/** The signed-in area: dark, because the editor and the kits it previews are. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const signOut = () => {
    removeToken();
    try {
      sessionStorage.removeItem("songdis_user");
    } catch {}
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#101010] text-white">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/app" aria-label="Your artists">
            <EpkWordmark className="text-[24px]" />
          </Link>
          <div className="flex items-center gap-4 text-[13.5px] text-white/55">
            <a href="https://songdis.com" className="hidden hover:text-white sm:inline">
              Release with SongDis
            </a>
            <button type="button" onClick={signOut} className="hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
