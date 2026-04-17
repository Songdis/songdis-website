"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   SCROLL-REVEAL HOOK
───────────────────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); observer.disconnect(); }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────────────────
   PITCH PORTAL SECTION
───────────────────────────────────────────────────────── */
const PitchPortalSection: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: cardRef, inView: cardInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* ── Red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-10 sm:mb-14 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Pitch Portal
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg">
            Connect with curators and partners
          </p>
        </div>

        {/* ── MAIN CARD ── */}
        {/* Gradient border via wrapper technique */}
        <div
          ref={cardRef}
          className={[
            "rounded-2xl p-[1.34px] transition-all duration-1000",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          ].join(" ")}
          style={{
            background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.08) 81.99%)",
          }}
        >
          <div className="relative w-full rounded-2xl bg-[#1A0808] overflow-hidden">

            {/* ── "GET YOUR MUSIC FEATURED" — top of card ── */}
            <div className="px-8 sm:px-10 lg:px-14 pt-8 sm:pt-10 lg:pt-12 pb-6">
              <h3 className="font-heading text-white uppercase text-2xl sm:text-4xl lg:text-5xl xl:text-[52px] leading-tight">
                Get Your Music Featured
              </h3>
            </div>

            {/* ── CARD BODY — photo left, text right ── */}
            <div className="flex flex-col lg:flex-row items-stretch min-h-[480px] lg:min-h-[540px]">

              {/* Left — photo, bleeds to card edges */}
              <div className="relative w-full lg:w-[62%] min-h-[320px] lg:min-h-0 overflow-hidden">
                <Image
                  src="/images/pitch-portal.svg"
                  alt="Artists — Pitch Portal"
                  fill
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>

              {/* Right — text + CTA, vertically centered */}
              <div className="flex flex-col justify-center px-8 sm:px-10 lg:px-12 py-10 lg:py-0 lg:w-[38%] shrink-0">
                <p className="font-body text-white text-sm sm:text-base leading-relaxed mb-10">
                  Submit your tracks to top editorial playlists, sync
                  opportunities, brand partnerships, and media placements
                  — all in one place.
                </p>

                {/* Gradient border button */}
                <div
                  className="inline-block rounded-full p-[1.34px]"
                  style={{
                    background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
                  }}
                >
                  <Link
                    href="/pitch"
                    className="inline-flex items-center justify-center w-full font-heading text-white uppercase tracking-widest rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap text-[20px]"
                    style={{
                      backdropFilter: "blur(4.45px)",
                      WebkitBackdropFilter: "blur(4.45px)",
                    }}
                  >
                    Start Pitching
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PitchPortalSection;