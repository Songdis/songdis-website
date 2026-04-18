"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   CONTACT HERO SECTION
───────────────────────────────────────────────────────── */
const ContactHero: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] pt-32 sm:pt-36 lg:pt-40 pb-0 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="max-w-[1280px] mx-auto">

        {/* ── TOP ROW — heading left, body right ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12 sm:mb-16">

          {/* Left — heading */}
          <div className="lg:w-[55%] shrink-0">
            <h1
              className="font-heading text-white uppercase leading-[0.95]"
              style={{
                fontSize: "clamp(3rem, 8vw, 68px)",
                letterSpacing: "-0.01em",
              }}
            >
              Get In Touch
            </h1>
          </div>

          {/* Right — body text, justified */}
          <div className="flex-1 flex items-center">
            <p
              className="font-body text-white text-sm sm:text-base leading-relaxed"
              style={{ textAlign: "justify" }}
            >
              Have questions about Songdis music distribution? We're here to
              help with royalties, uploads, partnerships, and support.
            </p>
          </div>

        </div>

        {/* ── FULL-WIDTH IMAGE ── */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ height: "clamp(240px, 38vw, 480px)" }}
        >
          <Image
            src="/images/contact-hero.svg"
            alt="Get in touch with Songdis"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

      </div>
    </section>
  );
};

export default ContactHero;