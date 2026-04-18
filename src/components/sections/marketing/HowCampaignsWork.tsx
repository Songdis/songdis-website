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
   HOW CAMPAIGNS WORK SECTION
───────────────────────────────────────────────────────── */
const HowCampaignsWork: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: imgRef, inView: imgInView } = useInView(0.05);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 overflow-hidden">

      {/* ── Top red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-20"
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
            How Our Marketing Campaigns Work
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mx-auto">
            A systematic approach to ensure your music reaches the right
            audience and achieves your goals.
          </p>
        </div>

      </div>

      {/* ── CHART IMAGE — full bleed, no side padding ── */}
      <div
        ref={imgRef}
        className={[
          "relative w-full transition-all duration-1000",
          imgInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        ].join(" ")}
      >
        <Image
          src="/images/marketing-chart.svg"
          alt="How our marketing campaigns work — Strategy Development, Content Creation, Campaign Launch, Performance Tracking"
          width={1440}
          height={700}
          className="w-full h-auto object-contain"
          loading="lazy"
        />
      </div>

    </section>
  );
};

export default HowCampaignsWork;