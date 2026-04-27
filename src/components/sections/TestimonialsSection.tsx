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
   TYPES
───────────────────────────────────────────────────────── */
interface Testimonial {
  quote: string;
  name: string;
  flag: string;
  country: string;
}

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const LEFT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The way Songdis pushed my single across regions was crazy. They didn't just put my music on platforms: they helped market it to the right audience. With their help I saw more engagement from fans in the UK, Nigeria and South Africa. Their promo plan gave me real visibility.",
    name: "Reechdee",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "Songdis helped me build a career, not just drop sounds. They worked with me on my image, sound and strategy. Things I never thought about as an indie artist. I don't have to juggle everything anymore. They managed the backend so I can stay focused on writing, recording and growing.",
    name: "Kdiv Coco",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "They treat you like family, and not just a client. What really stood out to me was how Songdis supported me through every step. From helping me with cover art, to giving me tips, to how to promote my song, they were there. For someone like me still figuring things out, that kind of guidance is everything.",
    name: "Switorla",
    flag: "🇬🇭",
    country: "Ghana",
  },
];

const CENTER_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Songdis has given me the necessary help needed to take my career to the next level. Now I have a working support system that makes reaching my goals much easier and effective.",
    name: "Emmybrown",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "They treat you like family, and not just a client. What really stood out to me was how Songdis supported me through every step. From helping me with cover art, to giving me tips, to how to promote my song, they were there. For someone like me still figuring things out, that kind of guidance is everything.",
    name: "Switorla",
    flag: "🇬🇭",
    country: "Ghana",
  },
  {
    quote:
      "Songdis made it super easy to drop my debut single on every platform there is. I was genuinely excited to see my music everywhere because I had no prior knowledge about how to navigate it. I fixed in the necessary information, including my song's metadata, and all I did was sit back till my release date. 10/10 would recommend Songdis to anyone who is looking to distribute their music without stress.",
    name: "Bri Tse",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "Songdis has given me the necessary help needed to take my career to the next level. Now I have a working support system that makes reaching my goals much easier and effective.",
    name: "Emmybrown",
    flag: "🇳🇬",
    country: "Nigeria",
  },
];

const RIGHT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Before Songdis, I had a few tracks out, but nothing took off. They stepped in, gave me advice, pushed my music to the right places, and now my streams are climbing every month. It's not just distribution, they care about the music and the artist behind it.",
    name: "R33nzo",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "Before Songdis, I had a few tracks out, but nothing took off. They stepped in, gave me advice, pushed my music to the right places, and now my streams are climbing every month. It's not just distribution, they care about the music and the artist behind it.",
    name: "Reechdee",
    flag: "🇳🇬",
    country: "Nigeria",
  },
  {
    quote:
      "Before Songdis, I had a few tracks out, but nothing took off. They stepped in, gave me advice, pushed my music to the right places, and now my streams are climbing every month. It's not just distribution, they care about the music and the artist behind it.",
    name: "Reechdee",
    flag: "🇳🇬",
    country: "Nigeria",
  },
];

/* ─────────────────────────────────────────────────────────
   QUOTE ICON
───────────────────────────────────────────────────────── */
const QuoteIcon: React.FC<{ size?: "sm" | "md" }> = ({ size = "md" }) => (
  <div
    className={[
      "rounded-full bg-[#C30100] flex items-center justify-center shrink-0",
      size === "md" ? "w-11 h-11" : "w-9 h-9",
    ].join(" ")}
  >
    <svg
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 14V8.96C0 7.68 0.253333 6.46667 0.76 5.32C1.28 4.17333 1.97333 3.16 2.84 2.28C3.72 1.38667 4.74667 0.693333 5.92 0.2L7.28 1.88C6.37333 2.29333 5.57333 2.86667 4.88 3.6C4.2 4.33333 3.72 5.2 3.44 6.2H7.28V14H0ZM10.72 14V8.96C10.72 7.68 10.9733 6.46667 11.48 5.32C12 4.17333 12.6933 3.16 13.56 2.28C14.44 1.38667 15.4667 0.693333 16.64 0.2L18 1.88C17.0933 2.29333 16.2933 2.86667 15.6 3.6C14.92 4.33333 14.44 5.2 14.16 6.2H18V14H10.72Z"
        fill="white"
      />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────────────────
   TESTIMONIAL CARD
───────────────────────────────────────────────────────── */
const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({
  testimonial,
}) => (
  <div className="rounded-2xl bg-[#180F0F] border border-white/[0.07] p-5 sm:p-6 flex flex-col gap-4 w-full">
    <QuoteIcon />
    <p className="font-body text-white/70 text-sm leading-relaxed flex-1">
      "{testimonial.quote}"
    </p>
    <div className="flex items-center justify-between gap-3 mt-2">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
          <Image
            src="/images/avatar-artiste.svg"
            alt={testimonial.name}
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
        <span className="font-heading text-white uppercase text-sm tracking-wide">
          {testimonial.name}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-lg leading-none">{testimonial.flag}</span>
        <span className="font-body text-white/50 text-xs">
          {testimonial.country}
        </span>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   SCROLLING COLUMN
   direction: "up" = scrolls upward (default), "down" = scrolls downward
   Speed is intentionally different per column so they feel independent.
───────────────────────────────────────────────────────── */
const ScrollingColumn: React.FC<{
  testimonials: Testimonial[];
  direction?: "up" | "down";
  duration?: number;
}> = ({ testimonials, direction = "up", duration = 26 }) => {
  const doubled = [...testimonials, ...testimonials];
  const animName = direction === "up" ? "scroll-up" : "scroll-down";

  return (
    <div className="relative overflow-hidden" style={{ height: "880px" }}>
      {/* Top fade */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, #140C0C 0%, transparent 100%)",
        }}
      />
      {/* Bottom fade */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-20 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #140C0C 0%, transparent 100%)",
        }}
      />

      <style>{`
        @keyframes scroll-up {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scroll-down {
          0%   { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        .col-scroll {
          will-change: transform;
        }
        .col-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="col-scroll flex flex-col gap-4"
        style={{
          animation: `${animName} ${duration}s linear infinite`,
        }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   TESTIMONIALS SECTION
───────────────────────────────────────────────────────── */
const TestimonialsSection: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: colsRef, inView: colsInView } = useInView(0.05);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">
      {/* Top red glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">
        {/* HEADER */}
        <div
          ref={headRef}
          className={[
            "text-center mb-14 sm:mb-16 lg:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Join 10K+ Songdis Artists
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[680px] mx-auto">
            We provide the tools and services you need to succeed in all stages
            of your career.
          </p>
        </div>

        {/* THREE COLUMNS */}
        <div
          ref={colsRef}
          className={[
            "grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-700",
            colsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
        >
          {/* Left — scrolls UP, slowest */}
          <div className="hidden lg:block">
            <ScrollingColumn
              testimonials={LEFT_TESTIMONIALS}
              direction="up"
              duration={30}
            />
          </div>

          {/* Center — scrolls DOWN, medium speed */}
          <ScrollingColumn
            testimonials={CENTER_TESTIMONIALS}
            direction="down"
            duration={24}
          />

          {/* Right — scrolls UP, slightly faster */}
          <div className="hidden lg:block">
            <ScrollingColumn
              testimonials={RIGHT_TESTIMONIALS}
              direction="up"
              duration={28}
            />
          </div>
        </div>

        {/* CTA BUTTON */}
        <div
          className={[
            "flex justify-center mt-14 sm:mt-16 transition-all duration-700 delay-300",
            colsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background:
                "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
            }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] px-10 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Be The Next Success Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;