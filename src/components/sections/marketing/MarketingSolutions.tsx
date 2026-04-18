"use client";

import React, { useEffect, useRef, useState } from "react";

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
   RED ARROW ICON
───────────────────────────────────────────────────────── */
const RedArrow: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 mt-0.5"
    aria-hidden="true"
  >
    <path
      d="M3.75 9H14.25M14.25 9L10.5 5.25M14.25 9L10.5 12.75"
      stroke="#C30100"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
interface Service {
  title: string;
  body: string;
  bullets: string[];
}

// Layout order: [left-top, left-bottom, center-top, center-bottom, right-top, right-bottom]
const SERVICES: Service[] = [
  {
    title: "Social Media Campaigns",
    body: "Grow your following, engage fans, and promote your music with expert social media management.",
    bullets: [
      "Content creation & scheduling",
      "Community engagement",
      "Platform-specific strategies",
    ],
  },
  {
    title: "Africa Radio Plug",
    body: "Get your music played on radio stations across Africa with specialized radio promo services.",
    bullets: [
      "Continental radio coverage",
      "Station partnerships",
      "Radio interview opportunities",
    ],
  },
  {
    title: "Playlist Pitching",
    body: "Get your music featured on influential playlists across major streaming platforms to increase visibility and streams.",
    bullets: [
      "Targeted playlist submissions",
      "Editorial playlist pitching",
      "Algorithmic playlist optimization",
    ],
  },
  {
    title: "PR & Press Coverage",
    body: "Get featured in blogs, magazines, and media outlets worldwide with professional PR services.",
    bullets: [
      "Press release creation",
      "Media outreach",
      "Interview opportunities",
    ],
  },
  {
    title: "Promotional Packages",
    body: "All-in-one marketing bundles designed to hit specific release milestones and long-term growth.",
    bullets: [
      "Single release campaigns",
      "Album launch strategies",
      "Artist branding packages",
    ],
  },
  {
    title: "Digital Ads",
    body: "Reach new fans and increase music engagement with smart, targeted advertising strategies.",
    bullets: [
      "Display & banner ads",
      "Google & social media ads",
      "Retargeting campaigns",
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   SERVICE CARD
───────────────────────────────────────────────────────── */
const ServiceCard: React.FC<{ service: Service; delay?: number }> = ({
  service,
  delay = 0,
}) => {
  const { ref, inView } = useInView(0.05);

  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl bg-[#180F0F] border border-white/[0.07] p-7 sm:p-8 flex flex-col gap-4 w-full",
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide leading-tight">
        {service.title}
      </h3>
      <p className="font-body text-white text-sm leading-relaxed">
        {service.body}
      </p>
      <ul className="flex flex-col gap-2.5 mt-1">
        {service.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <RedArrow />
            <span className="font-body text-white text-sm leading-relaxed">
              {b}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MARKETING SOLUTIONS SECTION
───────────────────────────────────────────────────────── */
const MarketingSolutions: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);

  const CENTER_OFFSET = -100;

  return (
    <section
      id="services"
      className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden"
    >
      {/* ── Red glow — top center ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(195,1,0,0.5) 0%, transparent 65%)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 lg:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Comprehensive Marketing Solutions
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[700px] mx-auto">
            Tailored strategies to help artists at any stage of their career
            reach new audiences and maximize their potential.
          </p>
        </div>

        {/* ── MOBILE — single column ── */}
        <div className="flex flex-col gap-4 lg:hidden">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.title} service={s} delay={i * 80} />
          ))}
        </div>

        {/* ── DESKTOP — 3 column stagger ── */}
        <div
          className="hidden lg:flex justify-center gap-4 items-start"
          style={{
            paddingTop: `${Math.abs(CENTER_OFFSET)}px`,
            paddingBottom: `${Math.abs(CENTER_OFFSET)}px`,
          }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-4 w-[347px]">
            <ServiceCard service={SERVICES[0]} delay={100} />
            <ServiceCard service={SERVICES[1]} delay={200} />
          </div>

          {/* Center column — shifted up */}
          <div
            className="flex flex-col gap-4 w-[347px]"
            style={{ marginTop: `${CENTER_OFFSET}px` }}
          >
            <ServiceCard service={SERVICES[2]} delay={0} />
            <ServiceCard service={SERVICES[3]} delay={150} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4 w-[347px]">
            <ServiceCard service={SERVICES[4]} delay={100} />
            <ServiceCard service={SERVICES[5]} delay={200} />
          </div>
        </div>

      </div>
    </section>
  );
};

export default MarketingSolutions;