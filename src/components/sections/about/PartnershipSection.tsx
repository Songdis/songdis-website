"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
   DATA
───────────────────────────────────────────────────────── */
const PARTNERS = [
  { src: "/images/pocket-lawyers.svg", alt: "Pocket Lawyers" },
  { src: "/images/symphonic.svg",      alt: "Symphonic"      },
  { src: "/images/sterling-logo.svg",  alt: "Sterling Bank"  },
];

const BULLETS = [
  "Co-branding opportunities",
  "Service integration",
  "Artist sponsorships",
];

/* ─────────────────────────────────────────────────────────
   RED ARROW ICON
───────────────────────────────────────────────────────── */
const RedArrow: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 mt-0.5"
    aria-hidden="true"
  >
    <path
      d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
      stroke="#C30100"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   STRATEGIC ALLIANCES SECTION
───────────────────────────────────────────────────────── */
export const StrategicAlliances: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: logosRef, inView: logosInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 overflow-hidden">

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
            Strategic Alliances
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[620px] mx-auto">
            We've partnered with industry leaders to help artists thrive at
            every stage.
          </p>
        </div>

      </div>

      {/* ── LOGOS — infinite marquee, all screen sizes ── */}
      <div
        ref={logosRef}
        className={[
          "relative overflow-hidden transition-all duration-700",
          logosInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        ].join(" ")}
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <style>{`
          @keyframes alliance-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .alliance-track {
            animation: alliance-scroll 18s linear infinite;
            will-change: transform;
          }
          .alliance-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="alliance-track flex items-center gap-16 w-max py-4">
          {/* Original + clone for seamless loop */}
          {[...PARTNERS, ...PARTNERS].map((p, i) => (
            <div
              key={`${p.alt}-${i}`}
              className="relative h-14 w-[200px] shrink-0"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                className="object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   BECOME A PARTNER SECTION
───────────────────────────────────────────────────────── */
export const BecomeAPartner: React.FC = () => {
  const { ref: cardRef, inView: cardInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] pb-20 sm:pb-24 lg:pb-32 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto">

        {/* Card — subtle border */}
        <div
          ref={cardRef}
          className={[
            "rounded-2xl bg-[#180F0F] border border-white/[0.07] overflow-hidden",
            "flex flex-col lg:flex-row min-h-[420px]",
            "transition-all duration-700",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
        >

          {/* Left — text content */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14 lg:w-[55%] shrink-0">
            <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl xl:text-[44px] leading-tight mb-5">
              Become a Partner
            </h2>
            <p className="font-body text-white text-sm sm:text-base leading-relaxed mb-6">
              Are you interested in partnering with Songdis to support African
              artists? We're always looking for strategic alliances that can
              help our community thrive.
            </p>

            {/* Bullet points */}
            <ul className="flex flex-col gap-3 mb-8">
              {BULLETS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <RedArrow />
                  <span className="font-body text-white text-sm leading-relaxed">
                    {b}
                  </span>
                </li>
              ))}
            </ul>

            {/* CONTACT US — gradient border button */}
            <div
              className="inline-block rounded-full p-[1.34px] self-start"
              style={{
                background:
                  "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
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
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right — handshake image, fills flush to card edges */}
          <div className="relative flex-1 min-h-[280px] lg:min-h-0 overflow-hidden">
            <Image
              src="/images/hand-shake.svg"
              alt="Partnership handshake"
              fill
              className="object-cover object-center"
              loading="lazy"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────────────────────────────────
   DEFAULT EXPORT — both sections together
───────────────────────────────────────────────────────── */
const PartnershipsSection: React.FC = () => (
  <>
    <StrategicAlliances />
    <BecomeAPartner />
  </>
);

export default PartnershipsSection;