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
   PHOTO CARD
───────────────────────────────────────────────────────── */
const PhotoCard: React.FC<{
  image: string;
  alt: string;
  number: string;
  title: string;
  body?: string;
  width: string;
}> = ({ image, alt, number, title, body, width }) => (
  <div
    className="relative rounded-3xl overflow-hidden shrink-0 flex flex-col justify-end"
    style={{
      width,
      height: "380px",
      border: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <Image
      src={image}
      alt={alt}
      fill
      className="object-cover object-center"
      loading="lazy"
    />
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)",
      }}
      aria-hidden="true"
    />
    <div className="relative z-10 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-white uppercase text-lg sm:text-xl tracking-wide leading-tight">
            {title}
          </h3>
          {body && (
            <p className="font-body text-white text-xs sm:text-sm leading-relaxed max-w-[340px]">
              {body}
            </p>
          )}
        </div>
        <span className="font-heading text-2xl shrink-0" style={{ color: "#C30100" }}>
          {number}
        </span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   PILL CARD
───────────────────────────────────────────────────────── */
const PillCard: React.FC<{ number: string; title: string }> = ({ number, title }) => (
  <div
    className="relative rounded-full shrink-0 flex flex-col items-center justify-between py-6"
    style={{
      width: "80px",
      height: "380px",
      backgroundColor: "#180F0F",
      border: "1px solid #C30100",
    }}
  >
    <div className="flex-1 flex items-center justify-center">
      <span
        className="font-heading text-white uppercase text-sm tracking-widest leading-tight text-center"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          letterSpacing: "0.12em",
        }}
      >
        {title}
      </span>
    </div>
    <span className="font-heading text-xl" style={{ color: "#C30100" }}>
      {number}
    </span>
  </div>
);

/* ─────────────────────────────────────────────────────────
   WHAT WE COLLECT SECTION
───────────────────────────────────────────────────────── */
const WhatWeCollect: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: rowRef, inView: rowInView } = useInView(0.05);
  const { ref: splitRef, inView: splitInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 overflow-hidden">

      {/* ── Top red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(195,1,0,0.6) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight">
            What We Collect For You
          </h2>
        </div>

      </div>

      {/* ── ITEMS ROW — full bleed horizontal scroll ── */}
      <div
        ref={rowRef}
        className={[
          "relative z-10 transition-all duration-700",
          rowInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        ].join(" ")}
      >
        <div className="overflow-x-auto px-4 sm:px-6 lg:px-10 pb-4">
          <div
            className="flex items-stretch gap-3 lg:justify-center"
            style={{ minWidth: "max-content" }}
          >
            {/* 01 — Performance Royalties */}
            <PhotoCard
              image="/images/workshop-big.svg"
              alt="Performance Royalties"
              number="01"
              title="Performance Royalties"
              body="When your song is streamed, played on radio, or performed live."
              width="520px"
            />

            {/* 02 — Mechanical Royalties */}
            <PillCard number="02" title="Mechanical Royalties" />

            {/* 03 — YouTube Composition Revenue */}
            <PhotoCard
              image="/images/workshop.svg"
              alt="YouTube Composition Revenue"
              number="03"
              title="YouTube Composition Revenue"
              body="When your song is used in YouTube videos."
              width="360px"
            />

            {/* 04 — International Royalties */}
            <PillCard number="04" title="International Royalties" />

          </div>
        </div>
      </div>

      {/* ── SPLIT YOUR SONG PROPERLY — two columns ── */}
      <div
        ref={splitRef}
        className={[
          "relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10",
          "flex flex-col lg:flex-row gap-8 lg:gap-16 pt-16 sm:pt-20 lg:pt-24",
          "transition-all duration-700",
          splitInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
      >
        {/* Left — heading */}
        <div className="lg:w-[55%] shrink-0">
          <h2
            className="font-heading text-white uppercase leading-tight"
            style={{ fontSize: "clamp(1.8rem, 3.5vw, 30px)" }}
          >
            Split Your Song Properly
          </h2>
        </div>

        {/* Right — body */}
        <div className="flex-1 flex items-center">
          <p className="font-body text-white text-sm sm:text-base leading-relaxed">
            Worked with a producer or co-writer?{"\n"}
            Set songwriting splits inside your dashboard.{"\n"}
            Everyone's percentage is recorded clearly.{"\n"}
            No disputes later.
          </p>
        </div>
      </div>

    </section>
  );
};

export default WhatWeCollect;