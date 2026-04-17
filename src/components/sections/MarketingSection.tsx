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
   MARKETING SECTION
───────────────────────────────────────────────────────── */
const MarketingSection: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: cardRef, inView: cardInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 overflow-hidden">

      {/* ── Line background — full bleed, behind everything ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <Image
          src="/images/line-bg.svg"
          alt=""
          fill
          className="object-cover object-center opacity-40"
          priority
        />
      </div>

      {/* ── Top red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Marketing Solutions
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[560px] mx-auto">
            Boost your music career with our targeted promotion services
          </p>
        </div>

        {/* ── CARD STACK IMAGE ── */}
        <div
          ref={cardRef}
          className={[
            "relative w-full transition-all duration-1000",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10",
          ].join(" ")}
        >
          {/* Desktop image — hidden on mobile */}
          <div className="hidden sm:block relative w-full">
            <Image
              src="/images/card-stack.svg"
              alt="Marketing solutions — Digital Marketing, Influencer Marketing, Radio Promotion, Fanbase Activation"
              width={1200}
              height={900}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>

          {/* Mobile image — hidden on sm and above */}
          <div className="block sm:hidden relative w-full">
            <Image
              src="/images/card-stack-mobile.svg"
              alt="Marketing solutions — Digital Marketing, Influencer Marketing, Radio Promotion, Fanbase Activation"
              width={600}
              height={800}
              className="w-full h-auto object-contain"
              loading="lazy"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default MarketingSection;