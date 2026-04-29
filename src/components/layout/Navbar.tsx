"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";

/* ─────────────────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────────────────── */
interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Community", href: "/community" },
  { label: "Pricing", href: "/pricing" },
  { label: "Marketing", href: "/marketing" },
  { label: "Publishing", href: "/publishing" },
  { label: "Contact", href: "/contact" },
];

/* ─────────────────────────────────────────────────────────
   GRADIENT BORDER BUTTON
   Reusable — same technique as hero CTA.
   Outer div = gradient bg at 1.34px padding (the "border").
   Inner element = page-bg fill so gradient rim shows.
───────────────────────────────────────────────────────── */
const GradientBorderButton: React.FC<{
  href: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ href, onClick, children, className = "" }) => (
  <div
    className="inline-block rounded-full p-[1.34px]"
    style={{
      background:
        "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
    }}
  >
    <Link
      href={href}
      onClick={onClick}
      className={[
        "inline-block font-heading text-white uppercase tracking-widest",
        "rounded-full bg-[#140C0C] transition-all duration-300",
        "hover:bg-white hover:text-[#140C0C]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className,
      ].join(" ")}
      style={{
        backdropFilter: "blur(4.45px)",
        WebkitBackdropFilter: "blur(4.45px)",
      }}
    >
      {children}
    </Link>
  </div>
);

/* ─────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────── */
const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  /* ── Scroll blur/border ── */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ════════════════════════════════════
          HEADER
      ════════════════════════════════════ */}
      <header
        role="banner"
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-[#140C0C]/90 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/40"
            : "bg-transparent",
        ].join(" ")}
      >
        <nav
          aria-label="Main navigation"
          className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-[72px]"
        >
          {/* ── LOGO ── */}
          <Link
            href="/"
            aria-label="Songdis home"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] rounded"
          >
            
            <Link
              href="/"
              aria-label="Songdis home"
              className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] rounded"
            >
              <Image
                src="/images/logo.svg"
                alt="Songdis"
                width={120}
                height={32}
                className="h-12 w-auto object-contain"
                priority
              />
            </Link>
          </Link>

          {/* ── DESKTOP NAV LINKS — only at xl and above ── */}
          <ul
            className="hidden xl:flex items-center gap-1 2xl:gap-2"
            role="list"
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="
                    relative px-3 py-2 font-body text-sm text-white/75
                    transition-colors duration-200 hover:text-white rounded
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100]
                    after:absolute after:bottom-0 after:left-3 after:right-3
                    after:h-px after:bg-[#C30100] after:scale-x-0 after:origin-left
                    after:transition-transform after:duration-200
                    hover:after:scale-x-100
                  "
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ── DESKTOP CTA — only at xl and above ── */}
          <div className="hidden xl:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="
                font-heading text-xs text-white/80 tracking-widest uppercase
                transition-colors duration-200 hover:text-white
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] rounded
              "
            >
              LOG IN
            </Link>

            <GradientBorderButton
              href="/sign-up"
              className="text-xs tracking-widest px-5 py-2.5"
            >
              GET STARTED
            </GradientBorderButton>
          </div>

          {/* ── HAMBURGER — visible on mobile AND tablet (below xl) ── */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
            className="
              xl:hidden p-2 text-white rounded transition-colors duration-200
              hover:text-[#C30100] focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-[#C30100]
            "
          >
            {mobileOpen ? <RiCloseLine size={26} /> : <RiMenu3Line size={26} />}
          </button>
        </nav>
      </header>

      {/* ════════════════════════════════════
          MOBILE MENU OVERLAY
      ════════════════════════════════════ */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        aria-hidden={!mobileOpen}
        className={[
          "fixed inset-0 z-40 xl:hidden transition-opacity duration-300",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Backdrop */}
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Slide-in drawer */}
        <div
          className={[
            "absolute top-0 right-0 h-full w-72 bg-[#170F0F]",
            "border-l border-white/10 flex flex-col pt-24 pb-10 px-6 gap-1",
            "transform transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {/* Nav links */}
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="
                font-body text-sm text-white/75 py-3
                border-b border-white/[0.06] last:border-0
                hover:text-white hover:pl-2 transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#C30100] rounded
              "
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile CTAs */}
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="
                font-heading text-xs text-center text-white/80 tracking-widest uppercase
                py-3 rounded-full border border-white/20
                hover:border-white hover:text-white transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100]
              "
            >
              LOG IN
            </Link>

            {/* Gradient border button in mobile drawer */}
            <GradientBorderButton
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="text-xs tracking-widest py-3 w-full text-center"
            >
              GET STARTED
            </GradientBorderButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
