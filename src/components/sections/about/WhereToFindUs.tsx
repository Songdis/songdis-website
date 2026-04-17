"use client";

import React, { useEffect, useRef, useState } from "react";
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
   WHERE TO FIND US SECTION
───────────────────────────────────────────────────────── */
const WhereToFindUs: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: imgRef, inView: imgInView } = useInView(0.05);

  return (
    <section className="relative w-full bg-[#140C0C] pt-20 sm:pt-24 lg:pt-32 lg:pb-0 overflow-hidden">

      {/* ── Top red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-12 sm:mb-16 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Where To Find Us
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[640px] mx-auto">
            With offices in the UK and Nigeria, we're positioned to serve
            artists globally.
          </p>
        </div>

      </div>

      {/* ── LOCATION IMAGE — full bleed, no side padding ── */}
      <div
        ref={imgRef}
        className={[
          "relative w-full transition-all duration-1000",
          imgInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        ].join(" ")}
      >
        {/* Desktop */}
        <div className="hidden sm:block w-full">
          <Image
            src="/images/location.svg"
            alt="Songdis office locations — Lagos, Nigeria and UK"
            width={1440}
            height={700}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>

        {/* Mobile */}
        <div className="block sm:hidden w-full">
          <Image
            src="/images/location-mobile.svg"
            alt="Songdis office locations — Lagos, Nigeria and UK"
            width={390}
            height={600}
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>
      </div>

    </section>
  );
};

export default WhereToFindUs;