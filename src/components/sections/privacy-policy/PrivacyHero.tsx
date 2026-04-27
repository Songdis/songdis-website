"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   PRIVACY POLICY HERO SECTION
───────────────────────────────────────────────────────── */
const PrivacyHero: React.FC = () => {
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
              Privacy Policy
            </h1>
          </div>

          {/* Right — body text */}
          <div className="flex-1 flex items-center">
            <p className="font-body text-white text-sm sm:text-base leading-relaxed">
              Learn how we collect, use, and protect your personal information.
            </p>
          </div>

        </div>

        {/* ── HERO IMAGE — object-contain to preserve the notched shape ── */}
        <div className="relative w-full">
          <Image
            src="/images/privacy-hero.svg"
            alt="Privacy Policy — artist holding vinyl record"
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

export default PrivacyHero;