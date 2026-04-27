"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   TERMS HERO SECTION
───────────────────────────────────────────────────────── */
const TermsHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="max-w-[1280px] mx-auto">

        {/* ── TOP ROW — heading left, body right ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-10 sm:mb-14">

          {/* Left — heading */}
          <div className="lg:w-[55%] shrink-0">
            <h1
              className="font-heading text-white uppercase leading-[0.95]"
              style={{
                fontSize: "clamp(3rem, 8vw, 68px)",
                letterSpacing: "-0.01em",
              }}
            >
              Terms and Conditions
            </h1>
          </div>

          {/* Right — body text */}
          <div className="flex-1 flex items-center">
            <p className="font-body text-white text-sm sm:text-base leading-relaxed">
              The rules and guidelines that govern your use of our platform
              and services.
            </p>
          </div>

        </div>

        {/* ── HERO IMAGE — object-contain preserves unique vinyl/record shape ── */}
        <div className="relative w-full">
          <Image
            src="/images/terms-hero.svg"
            alt="Terms and Conditions — vinyl record illustration"
            width={1280}
            height={560}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

      </div>
    </section>
  );
};

export default TermsHero;