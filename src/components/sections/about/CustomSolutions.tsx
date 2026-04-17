"use client";

import React, { useEffect, useRef, useState } from "react";
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
const CARDS = [
  {
    image: "/images/notes.svg",
    alt: "White Label illustration",
    title: "White Label",
    body: "Launch your own branded digital music distribution platform powered our technology",
    delay: 0,
  },
  {
    image: "/images/thoughts.svg",
    alt: "API Access illustration",
    title: "API Access",
    body: "Integrate our distribution capabilities into your app or platform wit powerful API access.",
    delay: 150,
  },
];

/* ─────────────────────────────────────────────────────────
   COMING SOON BUBBLE
───────────────────────────────────────────────────────── */
const ComingSoonBubble: React.FC = () => (
  <div
    className="absolute -top-5 right-8 z-20"
    style={{ transform: "rotate(3deg)" }}
  >
    <div className="relative px-4 py-2 rounded-2xl border border-[#C30100] bg-[#1A0808]">
      <span className="font-body text-white text-sm whitespace-nowrap">
        Coming Soon
      </span>
      <div
        aria-hidden="true"
        className="absolute -bottom-[7px] left-5 w-3 h-3 bg-[#1A0808] border-r border-b border-[#C30100]"
        style={{ transform: "rotate(45deg)" }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   SOLUTION CARD
───────────────────────────────────────────────────────── */
const SolutionCard: React.FC<{
  image: string;
  alt: string;
  title: string;
  body: string;
  delay?: number;
}> = ({ image, alt, title, body, delay = 0 }) => {
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={[
        "relative flex flex-col overflow-visible transition-all duration-700",
        "w-full sm:w-[393.89px]",               /* full width mobile, fixed desktop */
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <ComingSoonBubble />

      {/* Card */}
      <div
        className={[
          "rounded-2xl flex flex-col overflow-hidden w-full",
          "h-auto sm:h-[550.53px]",             /* auto height mobile, fixed desktop */
        ].join(" ")}
        style={{
          backgroundColor: "#180F0F",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* Image area — shorter on mobile, fixed on desktop */}
        <div
          className="relative w-full shrink-0 h-[220px] sm:h-[300px]"
          style={{ padding: "24px" }}
        >
          <Image
            src={image}
            alt={alt}
            fill
            className="object-contain"
            style={{ padding: "24px" }}
            loading="lazy"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col justify-center px-7 py-6 flex-1">
          <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
            {title}
          </h3>
          <p className="font-body text-white text-sm leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   CUSTOM SOLUTIONS SECTION
───────────────────────────────────────────────────────── */
const CustomSolutions: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* ── Bottom-left red glow ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(195,1,0,0.3) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-16 sm:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Custom Solutions
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[680px] mx-auto">
            Build your own branded platform or integrate our API to offer
            seamless music distribution. Tailored for serious businesses ready
            to elevate their services.
          </p>
        </div>

        {/* ── CARDS ──
            Mobile:  stacked full width
            Desktop: side by side at Figma dimensions
        ── */}
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start sm:justify-center sm:gap-6 lg:gap-8">
          {CARDS.map((card) => (
            <SolutionCard key={card.title} {...card} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default CustomSolutions;