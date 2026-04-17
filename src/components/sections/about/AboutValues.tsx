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
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const VALUES = [
  {
    number: "01",
    title: "Artist First",
    body: "We prioritize artists' needs, ensuring they maintain creative control and receive fair compensation for their work.",
    bg: "#180F0F",
  },
  {
    number: "02",
    title: "Global Reach",
    body: "We connect African music to worldwide audiences, breaking down geographical barriers to music distribution.",
    bg: "#180F0F",
  },
  {
    number: "03",
    title: "Innovation",
    body: "We continuously develop new tools and services that empower artists in the rapidly evolving digital music landscape.",
    bg: "#180F0F",
  },
  {
    number: "04",
    title: "Community",
    body: "We foster a supportive network where artists can collaborate, learn, and grow together in their musical journey.",
    bg: "#2D0A0A",
  },
  {
    number: "05",
    title: "Transparency",
    body: "We believe in clear, honest communication about royalties, contracts, and all aspects of our business relationships.",
    bg: "#180F0F",
  },
  {
    number: "06",
    title: "Efficiency",
    body: "We streamline the distribution process, allowing artists to focus on creating music while we handle the rest.",
    bg: "#180F0F",
  },
];

const CARD_HEIGHT = 375;

/* ─────────────────────────────────────────────────────────
   VALUE CARD
───────────────────────────────────────────────────────── */
const ValueCard: React.FC<{
  number: string;
  title: string;
  body: string;
  bg: string;
  delay?: number;
}> = ({ number, title, body, bg, delay = 0 }) => {
  const { ref, inView } = useInView(0.05);
  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl border border-white/[0.07] p-7 sm:p-8 flex flex-col gap-4 w-full",
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{
        backgroundColor: bg,
        height: `${CARD_HEIGHT}px`,
        transitionDelay: `${delay}ms`,
      }}
    >
      <span
        className="font-heading text-sm"
        style={{ color: "#C30100", letterSpacing: "0.1em" }}
      >
        {number}
      </span>
      <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide">
        {title}
      </h3>
      <p className="font-body text-white/70 text-sm sm:text-base leading-relaxed">
        {body}
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   ABOUT VALUES SECTION
───────────────────────────────────────────────────────── */
const AboutValues: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);

  /*
    Desktop layout — 3 columns, each an independent flex column.
    Center column is offset upward so 01 peeks above the row-2 cards
    and 04 hangs below them, creating the wave stagger.

    Left col:   02 (top), 05 (bottom) — no offset
    Center col: 01 (top), 04 (bottom) — shifted up by ~100px
    Right col:  03 (top), 06 (bottom) — no offset
  */
  const CENTER_OFFSET = -100; // px — how far center column shifts up

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">
      {/* ── Red glow — top left ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(195,1,0,0.35) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 lg:mb-20 transition-all duration-700",
            headInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            What Drives Us
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[680px] mx-auto">
            Our core values shape everything we do, from product development to
            customer service.
          </p>
        </div>

        {/* ── MOBILE — single column ── */}
        <div className="flex flex-col gap-4 lg:hidden">
          {VALUES.map((v, i) => (
            <ValueCard key={v.number} {...v} delay={i * 80} />
          ))}
        </div>

        {/* ── DESKTOP — 3 column stagger ── */}
        {/* <div
          className="hidden lg:grid grid-cols-3 gap-4 items-start"
         
          style={{ paddingBottom: `${Math.abs(CENTER_OFFSET)}px` }}
        >
      
          <div className="flex flex-col gap-4">
            <ValueCard {...VALUES[1]} delay={100} />
            <ValueCard {...VALUES[4]} delay={200} />
          </div>

          
          <div
            className="flex flex-col gap-4"
            style={{ marginTop: `${CENTER_OFFSET}px` }}
          >
            <ValueCard {...VALUES[0]} delay={0} />
            <ValueCard {...VALUES[3]} delay={150} />
          </div>

         
          <div className="flex flex-col gap-4">
            <ValueCard {...VALUES[2]} delay={100} />
            <ValueCard {...VALUES[5]} delay={200} />
          </div>
        </div> */}

        {/* ── DESKTOP — 3 column stagger ── */}
        <div
          className="hidden lg:flex justify-center gap-4 items-start"
          style={{
            paddingBottom: `${Math.abs(CENTER_OFFSET)}px`,
            paddingTop: `${Math.abs(CENTER_OFFSET)}px`,
          }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-4" style={{ width: "347px" }}>
            <ValueCard {...VALUES[1]} delay={100} />
            <ValueCard {...VALUES[4]} delay={200} />
          </div>

          {/* Center column — shifted up */}
          <div
            className="flex flex-col gap-4"
            style={{ width: "347px", marginTop: `${CENTER_OFFSET}px` }}
          >
            <ValueCard {...VALUES[0]} delay={0} />
            <ValueCard {...VALUES[3]} delay={150} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4" style={{ width: "347px" }}>
            <ValueCard {...VALUES[2]} delay={100} />
            <ValueCard {...VALUES[5]} delay={200} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutValues;
