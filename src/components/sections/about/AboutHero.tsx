"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   ABOUT HERO SECTION
───────────────────────────────────────────────────────── */
const AboutHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* ── TOP ROW — heading left, mission right ── */}
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 mb-10 sm:mb-12 lg:mb-14">

          {/* Left — hero heading */}
          <div className="flex-1 lg:w-[58%]">
            <h1
              className="font-heading text-white uppercase text-[30px] lg:text-[65.47px] leading-[70px]"
              style={{
                letterSpacing: "-0.01em",
              }}
            >
              Artist-First Music Infrastructure
            </h1>
          </div>

          {/* Right — mission label + body */}
          <div className="lg:w-[38%] shrink-0 flex flex-col">
            <h2
              className="font-heading text-white uppercase mb-4"
              style={{
                fontSize: "clamp(0.75rem, 1vw, 14px)",
                letterSpacing: "0.18em",
              }}
            >
              Our Mission Is Your Success
            </h2>
            <p
              className="font-body text-white text-sm sm:text-base leading-relaxed"
              style={{ textAlign: "justify" }}
            >
              Songdis is building the most artist-friendly platform for global
              music distribution, empowering African musicians to share their
              art with the world.
            </p>
          </div>

        </div>

        {/* ── FULL-WIDTH IMAGE ── */}
        <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: "clamp(320px, 42vw, 580px)" }}>
          <Image
            src="/images/about-bg.svg"
            alt="Artist performing on stage"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

      </div>
    </section>
  );
};

export default AboutHero;