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
  { title: "Films",           image: "/images/film.svg",   alt: "Cinema theatre"           },
  { title: "TV Shows",        image: "/images/tv.svg",     alt: "TV film production"       },
  { title: "Adverts",         image: "/images/advert.svg", alt: "Billboard advert"         },
  { title: "Brand Campaigns", image: "/images/brand.svg",  alt: "Brand campaign billboard" },
  { title: "Games",           image: "/images/game.svg",   alt: "Gaming neon sign"         },
];

/* ─────────────────────────────────────────────────────────
   SYNC CARD
───────────────────────────────────────────────────────── */
const SyncCard: React.FC<{
  title: string;
  image: string;
  alt: string;
  delay?: number;
}> = ({ title, image, alt, delay = 0 }) => {
  const { ref, inView } = useInView(0.08);

  return (
    <div
      ref={ref}
      className={[
        "rounded-2xl overflow-hidden flex flex-col transition-all duration-700",
        "w-full lg:h-[319px]",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{
        backgroundColor: "#180F0F",
        border: "1px solid rgba(255,255,255,0.1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Title */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <h3 className="font-heading text-white uppercase text-base sm:text-lg tracking-wide">
          {title}
        </h3>
      </div>

      {/* Image — fills remaining height */}
      <div className="relative w-full flex-1 min-h-[200px] lg:min-h-0">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover object-center"
          loading="lazy"
        />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   SYNC LICENSING SECTION
───────────────────────────────────────────────────────── */
const SyncLicensing: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Sync Licensing
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[640px] mx-auto">
            Your song can earn more than streams. We pitch selected songs for:
          </p>
        </div>

        {/* ── MOBILE — single column ── */}
        <div className="flex flex-col gap-4 lg:hidden">
          {CARDS.map((card, i) => (
            <SyncCard key={card.title} {...card} delay={i * 80} />
          ))}
        </div>

        {/* ── DESKTOP — staggered 3-column grid ── */}
        <div className="hidden lg:block space-y-4">

          {/* Row 1 — empty left, Films center, TV Shows right */}
          <div className="grid grid-cols-3 gap-4">
            <div /> {/* empty cell */}
            <SyncCard {...CARDS[0]} delay={0} />
            <SyncCard {...CARDS[1]} delay={100} />
          </div>

          {/* Row 2 — Adverts, Brand Campaigns, Games */}
          <div className="grid grid-cols-3 gap-4">
            <SyncCard {...CARDS[2]} delay={50} />
            <SyncCard {...CARDS[3]} delay={150} />
            <SyncCard {...CARDS[4]} delay={250} />
          </div>

        </div>

      </div>
    </section>
  );
};

export default SyncLicensing;