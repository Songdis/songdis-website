"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   MARKETING HERO SECTION
───────────────────────────────────────────────────────── */
const MarketingHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="max-w-[1280px] mx-auto">

        {/* ── TOP ROW — heading left, body right ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-10 sm:mb-12">

          {/* Left — large heading */}
          <div className="flex-1 lg:w-[55%]">
            <h1
              className="font-heading text-white uppercase leading-[0.95]"
              style={{
                fontSize: "clamp(2.6rem, 7vw, 70px)",
                letterSpacing: "-0.01em",
              }}
            >
              Amplify Your Music Reach
            </h1>
          </div>

          {/* Right — body text */}
          <div className="lg:w-[38%] shrink-0 flex items-start pt-2">
            <p className="font-body text-white text-sm sm:text-base leading-relaxed">
              Strategic marketing solutions designed to boost your music
              career, increase streams, and build a dedicated fanbase
              worldwide.
            </p>
          </div>

        </div>

        {/* ── BUTTONS ROW ── */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-10 sm:mb-12">

          {/* EXPLORE MARKETING SERVICES */}
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
            }}
          >
            <Link
              href="#services"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Explore Marketing Services
            </Link>
          </div>

          {/* REACH OUT TO US */}
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background: "linear-gradient(86.92deg, rgba(255,255,255,0.3) 11.12%, rgba(255,255,255,0.08) 81.99%)",
            }}
          >
            <Link
              href="/contact"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Reach Out To Us
            </Link>
          </div>

        </div>

        {/* ── FULL-WIDTH IMAGE ── */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ height: "clamp(280px, 44vw, 580px)" }}
        >
          <Image
            src="/images/marketing-hero.svg"
            alt="Guitar with glowing red strings — Amplify Your Music Reach"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

      </div>
    </section>
  );
};

export default MarketingHero;