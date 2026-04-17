"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   PRICING HERO SECTION
───────────────────────────────────────────────────────── */
const PricingHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 overflow-hidden items-center justify-center flex flex-col">
      {/* ── TOP ROW — heading left, body right ── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12 sm:mb-16">
          {/* Left — massive heading */}
          <div className="lg:w-[55%]">
            <h1
              className="font-heading text-white uppercase leading-[0.95]"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 65.3px)",
                letterSpacing: "-0.01em",
              }}
            >
              Transparent Pricing for Artists at Every Stage
            </h1>
          </div>

          {/* Right — body text, NOT justified */}
          <div className="lg:w-[38%] shrink-0 flex items-start pt-2">
            <p className="font-body text-white/75 text-sm sm:text-base leading-relaxed">
              Choose a plan that fits your release goals. Distribute your music,
              promote your sound, and grow your fanbase — all from one platform.
            </p>
          </div>
        </div>
      </div>

      <div
        className="relative w-full px-4 sm:px-6 lg:px-10"
        style={{ maxWidth: "1280px" }}
      >
        <Image
          src="/images/pricing-hero.svg"
          alt="Pricing visual"
          width={840}
          height={680}
          className="w-full h-auto object-contain object-center"
          priority
        />
      </div>
    </section>
  );
};

export default PricingHero;
