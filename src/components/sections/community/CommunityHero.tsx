"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";


const CommunityHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="max-w-[1280px] mx-auto">

        {/* ── TOP ROW — heading left, body right ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-10 sm:mb-12">

          {/* Left — hero heading */}
          <div className="flex-1 lg:w-[62%]">
            <h1
              className="font-heading text-white uppercase leading-[0.95] lg:leading-[70px]"
              style={{
                fontSize: "clamp(2.6rem, 7.5vw, 60px)",
                letterSpacing: "-0.01em",
              }}
            >
              Join the Songdis Artist Community
            </h1>
          </div>

          {/* Right — body text, justified, vertically centered */}
          <div className="lg:w-[35%] shrink-0 flex items-center lg:items-start lg:justify-end">
            <p
              className="font-body text-white text-sm sm:text-base leading-relaxed"
              style={{ textAlign: "justify" }}
            >
              Whether you're just starting out or already established,
              we're here to guide you through getting heard, growing
              your fanbase, and building a career with impact.
            </p>
          </div>

        </div>

        {/* ── BUTTONS ROW ── */}
        <div className="flex flex-col sm:flex-row items-start gap-4 mb-10 sm:mb-12">

          {/* JOIN ARTIST COMMUNITY */}
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
            }}
          >
            <Link
              href="/community/join"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs lg:text-[18px] rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Join Artist Community
            </Link>
          </div>

          {/* GET HELP & SUPPORT */}
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background: "linear-gradient(86.92deg, rgba(255,255,255,0.2) 11.12%, rgba(255,255,255,0.08) 81.99%)",
            }}
          >
            <Link
              href="/support"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs lg:text-[18px] rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Get Help &amp; Support
            </Link>
          </div>

        </div>

        <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: "clamp(320px, 48vw, 620px)" }}>

          <Image
            src="/images/singer.svg"
            alt="Songdis artist community"
            fill
            className="object-cover object-center"
            priority
          />

        </div>

      </div>
    </section>
  );
};

export default CommunityHero;