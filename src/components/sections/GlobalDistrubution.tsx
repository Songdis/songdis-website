"use client";

import { useInView } from "@/hooks/useInView";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

/**
 * GlobalDistribution
 * ─────────────────────────────────────────────────────────────────
 * Features Section – Card 1: Global Distribution
 *
 * Layout  : Two-column (text left, platforms image right)
 * Fonts   : Nulshock (heading/button) | Montserrat (body)
 * Colors  : see tailwind.config tokens — songdis-* namespace
 * Animation: slide-up + fade on scroll-entry; float loop on image
 * ─────────────────────────────────────────────────────────────────
 */

/* ─────────────────────────────────────────────────────────
   GRADIENT BORDER BUTTON
───────────────────────────────────────────────────────── */
const GradientBorderButton: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = "" }) => (
  <div
    className="inline-block rounded-full p-[1.34px]"
    style={{ background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)" }}
  >
    <Link
      href={href}
      className={[
        "inline-block font-heading text-white uppercase tracking-widest rounded-full",
        "bg-[#140C0C] transition-all duration-300 hover:bg-white hover:text-[#140C0C]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  </div>
);

export default function GlobalDistribution() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { threshold: 0.15, once: true });

  return (
    <section
      ref={sectionRef}
      aria-label="Global Distribution feature"
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        background:
          "radial-gradient(ellipse 70% 80% at 65% 50%, rgba(195,1,0,0.20) 0%, transparent 70%), linear-gradient(135deg, #170F0F 0%, #180F0F 40%, #37332C 100%)",
      }}
    >
      {/* Subtle noise texture overlay for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Inner border glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(104,101,96,0.39)",
        }}
      />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 px-8 py-14 sm:px-12 sm:py-16 md:grid-cols-2 md:gap-0 lg:px-16 lg:py-20">
        {/* ── LEFT: Copy ─────────────────────────────────────────── */}
        <div
          className="flex flex-col items-start gap-6 md:pr-8 lg:pr-12"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.65s ease, transform 0.65s ease",
          }}
        >
          {/* Section label pill */}
       

          {/* Heading — Nulshock */}
        <h3 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide mb-5">
                Global Distribution
              </h3>

          <p className="font-body text-white/55 text-sm sm:text-base leading-relaxed mb-10 max-w-[380px]">
                Distribute your music worldwide with full ownership and control.
                Release on your schedule and expand beyond borders.
              </p>

          {/* CTA Button */}
          <GradientBorderButton href="/signup" className="text-[11px] tracking-widest px-7 py-3.5">
                Start Your Global Release
              </GradientBorderButton>
        </div>

        {/* ── RIGHT: Platform Image ───────────────────────────────── */}
        <div
          className="flex items-center justify-center md:justify-end"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.75s ease 0.2s, transform 0.75s ease 0.2s",
          }}
        >
          {/*
           * Replace src with your actual Figma export.
           * Recommended export: PNG @2x, 800×600px min, transparent bg.
           * File path: /public/images/features/global-distribution-platforms.png
           *
           * The float animation is applied via CSS class "animate-float"
           * defined in globals.css (keyframes below).
           */}
          <div className="animate-float relative">
            <Image
              src="/images/features/global-distribution-platforms.png"
              alt="Music distribution platforms including Spotify, Apple Music, Amazon Music, YouTube Music and more"
              width={620}
              height={480}
              quality={90}
              priority={false}
              loading="lazy"
              className="w-full max-w-[540px] object-contain drop-shadow-2xl"
              // Fallback placeholder shown until the real asset is dropped in
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            />
          </div>
        </div>
      </div>
    </section>
  );
}