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
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────────────────
   PUBLISHING DASHBOARD SECTION
───────────────────────────────────────────────────────── */
const PublishingDashboard: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: imgRef, inView: imgInView } = useInView(0.05);
  const { ref: ownerRef, inView: ownerInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">
      <div className="relative z-10 max-w-[1280px] mx-auto">
        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-12 sm:mb-14 transition-all duration-700",
            headInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            All Your Publishing Tools, One Dashboard
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mx-auto">
            Use your dashboard to register songs, set splits, track earnings,
            view reports, and manage your catalog — all in one place.
          </p>
        </div>

        {/* ── DASHBOARD IMAGE ── */}
        <div
          ref={imgRef}
          className={[
            "relative w-full rounded-2xl overflow-hidden transition-all duration-700",
            imgInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
          style={{ height: "clamp(280px, 46vw, 620px)" }}
        >
          <Image
            src="/images/dashboard-blank.svg"
            alt="Publishing dashboard"
            fill
            className="object-cover object-top"
            loading="lazy"
          />
        </div>

        {/* ── YOU KEEP OWNERSHIP — two columns ── */}
        <div
          ref={ownerRef}
          className={[
            "flex flex-col lg:flex-row gap-8 lg:gap-16 pt-16 sm:pt-20 lg:pt-24",
            "transition-all duration-700 justify-between w-full",
            ownerInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          {/* Left — heading */}
          <div className="lg:w-1/2 shrink-0">
            <h2
              className="font-heading text-white uppercase leading-tight"
              style={{ fontSize: "clamp(1.8rem, 3.5vw, 48px)" }}
            >
              You Keep Ownership
            </h2>
          </div>

          {/* Right — body lines */}
          <div className="lg:w-1/2 flex items-center justify-end">
            <div className="flex flex-col gap-1">
              {[
                "No hidden fees.",
                "No loss of rights.",
                "We only earn when you earn.",
                "If you write music, activate Publishing.",
                "Don't leave your songwriting money uncollected.",
              ].map((line) => (
                <p
                  key={line}
                  className="font-body text-white text-sm sm:text-base leading-relaxed"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PublishingDashboard;
