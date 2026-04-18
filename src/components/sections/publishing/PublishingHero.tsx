"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   PUBLISHING HERO SECTION
───────────────────────────────────────────────────────── */
const PublishingHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="max-w-[1280px] mx-auto">

        {/* ── TOP ROW — heading + button left, body right ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12 sm:mb-16">

          {/* Left — heading + button */}
          <div className="flex flex-col gap-8 lg:w-[45%] shrink-0 justify-center">
            <h1
              className="font-heading text-white uppercase leading-[0.95]"
              style={{
                fontSize: "clamp(3rem, 8vw, 70px)",
                letterSpacing: "-0.01em",
              }}
            >
              Publishing
            </h1>

            {/* CLAIM EVERY ROYALTY YOU DESERVE */}
            <div
              className="inline-block rounded-full p-[1.34px] self-start"
              style={{
                background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
              }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
                style={{
                  backdropFilter: "blur(4.45px)",
                  WebkitBackdropFilter: "blur(4.45px)",
                }}
              >
                Claim Every Royalty You Deserve
              </Link>
            </div>
          </div>

          {/* Right — body text */}
          <div className="flex-1 flex items-center">
            <p className="font-body text-white text-sm sm:text-base leading-relaxed">
              Get Paid For Writing The Song{"\n"}
              Most artists collect streaming money. Few collect songwriting
              money. If you wrote the song, you are owed publishing royalties.
              SongDis helps you collect them worldwide.
            </p>
          </div>

        </div>

        {/* ── FULL-WIDTH IMAGE ── */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ height: "clamp(240px, 38vw, 500px)" }}
        >
          <Image
            src="/images/publishing-hero.svg"
            alt="Publishing — musical notes and treble clef"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* ── WHAT IS PUBLISHING — two columns ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-16 sm:py-20 lg:py-24">

          {/* Left — heading */}
          <div className="lg:w-[40%] shrink-0">
            <h2
              className="font-heading text-white uppercase leading-tight"
              style={{ fontSize: "clamp(1.6rem, 3vw, 42px)" }}
            >
              What Is Publishing?
            </h2>
          </div>

          {/* Right — body text */}
          <div className="flex-1">
            <p
              className="font-body text-white text-sm sm:text-base leading-relaxed"
              style={{ textAlign: "justify" }}
            >
              There are two sides to music:{"\n"}
              Master – the recording{"\n"}
              Publishing – the songwriting{"\n"}
              Distribution pays you for the master. Publishing pays you for the
              words, melody, and composition.{"\n"}
              If you created the song, this income belongs to you.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default PublishingHero;