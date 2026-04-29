"use client";

import React from "react";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   ABOUT VISION SECTION
───────────────────────────────────────────────────────── */
const AboutVision: React.FC = () => {
  return (
    <section className="relative w-full bg-[#140C0C] py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto">

        {/* ── CARD — subtle border, dark bg ── */}
        <div className="relative rounded-2xl bg-[#180F0F] border border-white/10 px-8 sm:px-16 lg:px-28 xl:px-40 py-14 sm:py-16 lg:py-20 overflow-hidden">

          {/* ── Founder — top right, absolutely positioned ── */}
          <div className="absolute top-8 right-8 sm:top-10 sm:right-10 flex flex-col items-end z-10">
            <div className="relative">
              {/* Circle avatar */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/10">
                <Image
                  src="/images/melody.jpg"
                  alt="Founder"
                  fill
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>
              {/* "Founder" pill label — overlaps bottom right of avatar */}
              <div
                className="absolute -bottom-3 -right-2 rounded-full px-3 py-1 border border-[#C30100]"
                style={{ background: "#1A0808" }}
              >
                <span className="font-body text-white text-xs whitespace-nowrap">
                  Founder
                </span>
              </div>
            </div>
          </div>

          {/* ── Co-Founder — bottom left, absolutely positioned ── */}
          <div className="absolute bottom-8 left-8 sm:bottom-10 sm:left-10 z-10">
            <div className="relative">
              {/* Circle avatar */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white/10">
                <Image
                  src="/images/obed.jpg"
                  alt="Co-Founder"
                  fill
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>
              {/* "Co-Founder" pill label — overlaps bottom right of avatar */}
              <div
                className="absolute -bottom-3 -right-4 rounded-full px-3 py-1 border border-[#C30100]"
                style={{ background: "#1A0808" }}
              >
                <span className="font-body text-white text-xs whitespace-nowrap">
                  Co-Founder
                </span>
              </div>
            </div>
          </div>

          {/* ── HEADING ── */}
          <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] tracking-wide text-center mb-8 sm:mb-10">
            From Vision to Reality
          </h2>

          {/* ── PARAGRAPHS — centered, constrained width ── */}
          <div className="max-w-[680px] mx-auto flex flex-col gap-6 text-center">
            <p className="font-body text-white text-sm sm:text-base leading-relaxed">
              Founded in 2024, Songdis was built to fix a broken system and make
              global music distribution work for African artists. Our founder,
              Melody Nehemiah, saw how independent artists across the continent
              were underserved by existing platforms. Delayed royalty payments,
              limited access to local currencies, and a lack of real support were
              holding back incredible talent.
            </p>
            <p className="font-body text-white/75 text-sm sm:text-base leading-relaxed">
              What started as a small team of passionate music industry
              professionals has grown into a comprehensive platform serving
              thousands of artists across Africa, connecting them to over 200
              streaming platforms worldwide. Today, Songdis is more than a
              distribution platform. We offer fast, transparent royalty payments
              in any currency, personalized artist support, and access to over
              200+ streaming platforms worldwide. With tools for marketing,
              analytics, and funding, Songdis empowers African artists to grow
              on their own terms and reach global audiences.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutVision;