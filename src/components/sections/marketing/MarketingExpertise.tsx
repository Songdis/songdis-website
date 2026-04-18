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
   RED PIN ICON
───────────────────────────────────────────────────────── */
const RedPin: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 mt-1"
    aria-hidden="true"
  >
    <path
      d="M12 2C8.68629 2 6 4.68629 6 8C6 11.3137 9 14 12 17C15 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2Z"
      fill="#C30100"
    />
    <path
      d="M12 17V22"
      stroke="#C30100"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="8" r="2.5" fill="white" />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const BULLETS = [
  "Industry relationships with playlist curators",
  "Connections with major music publications",
  "Partnerships with radio stations across Africa",
  "Digital marketing specialists for music promotion",
];

/* ─────────────────────────────────────────────────────────
   MARKETING EXPERTISE SECTION
───────────────────────────────────────────────────────── */
const MarketingExpertise: React.FC = () => {
  const { ref: cardRef, inView: cardInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] pb-20 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-10">

      <style>{`
        @media (min-width: 1024px) {
          .marketing-expertise-card { height: 794px; }
        }
      `}</style>

      <div className="max-w-[1280px] mx-auto">

        {/* ── CARD ── */}
        <div
          ref={cardRef}
          className={[
            "marketing-expertise-card rounded-2xl flex flex-col lg:flex-row",
            "transition-all duration-700",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
          style={{
            backgroundColor: "#180F0F",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >

          {/* Left — text, vertically centered */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14 lg:w-[52%] shrink-0">
            <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide mb-6">
              Marketing Expertise
            </h2>
            <p className="font-body text-white text-sm sm:text-base leading-relaxed mb-8 max-w-[460px]">
              Our team consists of music industry professionals with extensive
              experience in digital marketing, PR, and artist promotion. We
              understand the unique challenges of the African music market and
              have the global connections to help you break borders.
            </p>
            <ul className="flex flex-col gap-6">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-4">
                  <RedPin />
                  <span className="font-body text-white text-sm sm:text-base leading-relaxed">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right — padded image with border radius */}
          <div
            className="flex-1 min-h-[360px] lg:min-h-0"
            style={{ padding: "20px 20px 20px 0" }}
          >
            <div
              className="relative w-full h-full"
              style={{ borderRadius: "24px", overflow: "hidden", minHeight: "320px" }}
            >
              <Image
                src="/images/artist-guitar.svg"
                alt="Artist playing guitar"
                fill
                className="object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MarketingExpertise;