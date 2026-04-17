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
    {/* Background photo */}
    <Image
      src={image}
      alt={alt}
      fill
      className="object-cover object-center"
      loading="lazy"
    />

    {/* Dark gradient overlay */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)",
      }}
      aria-hidden="true"
    />

    {/* Text overlay — bottom */}
    <div className="relative z-10 p-6 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-white uppercase text-lg sm:text-xl tracking-wide leading-tight">
            {title}
          </h3>
          {body && (
            <p className="font-body text-white/70 text-xs sm:text-sm leading-relaxed max-w-[340px]">
              {body}
            </p>
          )}
        </div>
        <span
          className="font-heading text-2xl shrink-0"
          style={{ color: "#C30100" }}
        >
          {number}
        </span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   PILL CARD
───────────────────────────────────────────────────────── */
const PillCard: React.FC<{
  number: string;
  title: string;
}> = ({ number, title }) => (
  <div
    className="relative rounded-full shrink-0 flex flex-col items-center justify-between py-6"
    style={{
      width: "80px",
      height: "380px",
      backgroundColor: "#180F0F",
      border: "1px solid #C30100",
    }}
  >
    {/* Vertical text */}
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

    {/* Number — bottom */}
    <span
      className="font-heading text-xl"
      style={{ color: "#C30100" }}
    >
      {number}
    </span>
  </div>
);

/* ─────────────────────────────────────────────────────────
   WHAT YOU CAN EXPECT SECTION
───────────────────────────────────────────────────────── */
const WhatYouCanExpect: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: rowRef, inView: rowInView } = useInView(0.05);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 overflow-hidden">

      {/* ── Bottom-right red glow ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(195,1,0,0.25) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 lg:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            What You Can Expect
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mx-auto">
            We provide resources, knowledge, and strategies to grow your
            music career and distribute your tracks globally.
          </p>
        </div>

      </div>

      {/* ── ITEMS ROW ── */}
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

            {/* 01 — Workshops & Webinars */}
            <PhotoCard
              image="/images/workshop-big.svg"
              alt="Workshops and Webinars"
              number="01"
              title="Workshops & Webinars"
              body="Learn from industry experts and sharpen your skills through regular online sessions designed to enhance your music career."
              width="520px"
            />

            {/* 02 — Music Distribution Guidance */}
            <PillCard number="02" title="Music Distribution Guidance" />

            {/* 03 — Music Industry Insights */}
            <PillCard number="03" title="Music Industry Insights" />

            {/* 04 — Interactive Q&A Sessions */}
            <PhotoCard
              image="/images/workshop.svg"
              alt="Interactive Q&A Sessions"
              number="04"
              title="Interactive Q&A Sessions"
              body="Get your questions answered by industry professionals. Direct access to experts who can help solve your specific challenges."
              width="360px"
            />

            {/* 05 — Community Support */}
            <PillCard number="05" title="Community Support" />

            {/* 06 — New Music Friday */}
            <PillCard number="06" title="New Music Friday" />

          </div>
        </div>
      </div>

    </section>
  );
};

export default WhatYouCanExpect;