"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { forceLogout, request } from "@/lib/api/core";

/**
 * The partner portal shell.
 *
 * It deliberately mirrors DashboardLayout's frame — same ground, same sidebar geometry,
 * same type — rather than reusing it. DashboardLayout carries the artist's subscription
 * banner, upload modal, notification panel, Ayo widget and artist switcher, and every one
 * of those calls an endpoint a partner token is now blocked from. Reusing it would mean a
 * shell that 403s its way through mount and offers an Upload button to an account that
 * cannot upload.
 */

interface NavItem {
  href: string;
  label: string;
}

const NAV: NavItem[] = [
  { href: "/partner", label: "Overview" },
  { href: "/partner/releases", label: "Releases" },
  { href: "/partner/analytics", label: "Analytics" },
  { href: "/partner/royalties", label: "Royalties" },
];

interface PartnerLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  partnerName?: string;
}

export default function PartnerLayout({ children, pageTitle, partnerName }: PartnerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/partner" ? pathname === "/partner" : pathname.startsWith(href);

  const signOut = async () => {
    // Fired but not awaited for correctness — the local clear below is what actually ends
    // the session, and a failed network call must not strand someone in a signed-in shell.
    void request("/logout", { method: "POST" }, true);
    forceLogout();
  };

  return (
    <div className="flex h-screen w-full bg-[#0E0808] overflow-hidden">
      {sidebarOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={[
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:flex transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <aside className="w-[240px] h-full bg-[#140C0C] border-r border-white/[0.06] flex flex-col">
          <div className="px-5 py-6 flex items-center justify-between">
            <Image
              src="/images/logo.svg"
              alt="Songdis"
              priority
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>

          {partnerName && (
            <div className="px-5 pb-4">
              <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] mb-1">
                Partner
              </p>
              <p className="font-body text-white text-sm truncate">{partnerName}</p>
            </div>
          )}

          <div className="h-px bg-white/[0.06] mx-3 mb-3" />

          <nav className="flex-1 px-3">
            <ul className="flex flex-col gap-px">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={[
                      "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200",
                      isActive(item.href)
                        ? "bg-[#C30100]/20 text-[#C30100]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span className="font-body text-[13px] truncate">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3">
            <button
              onClick={signOut}
              className="w-full text-left font-body text-[13px] text-white/50 hover:text-white px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-all duration-200"
            >
              Sign out
            </button>
          </div>
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white transition-colors shrink-0 focus-visible:outline-none"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>

            {pageTitle && (
              <div className="min-w-0">
                <h1 className="font-heading text-white uppercase text-lg sm:text-2xl tracking-wide truncate">
                  {pageTitle}
                </h1>
              </div>
            )}
          </div>

          {/*
            No CTA here, and that is the point: every action a partner could take on the
            artist side is one they are not permitted. An inert button would only invite
            the question.
          */}
          <span className="font-heading text-white/25 uppercase text-[10px] tracking-[0.25em] shrink-0 hidden sm:block">
            View only
          </span>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
