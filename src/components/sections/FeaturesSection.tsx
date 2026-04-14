"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   SCROLL-REVEAL HOOK
───────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
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
   GRADIENT BORDER BUTTON
───────────────────────────────────────────────────────── */
const GradientBorderButton: React.FC<{
  href: string;
  children: React.ReactNode;
  className?: string;
}> = ({ href, children, className = "" }) => (
  <div
    className="inline-block rounded-full p-[1.34px]"
    style={{ background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)" }}
  >
    <Link
      href={href}
      className={[
        "inline-block font-heading text-white uppercase tracking-widest rounded-full",
        "bg-[#140C0C] transition-all duration-300 hover:bg-white hover:text-[#140C0C]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  </div>
);

/* ─────────────────────────────────────────────────────────
   PLATFORM ICONS — floating bob animation
───────────────────────────────────────────────────────── */
const FLOAT_ICONS = [
  { src: "/images/apple-music.svg",  alt: "Apple Music",   pos: "top-[4%] right-[18%]",      delay: "0s",   size: "w-16 h-16 sm:w-20 sm:h-20" },
  { src: "/images/meta.svg",         alt: "Meta",          pos: "top-[22%] right-[48%]",     delay: "0.6s", size: "w-14 h-14 sm:w-16 sm:h-16" },
  { src: "/images/musicmatch.svg",   alt: "Musixmatch",    pos: "top-[52%] right-[46%]",     delay: "1.1s", size: "w-14 h-14 sm:w-16 sm:h-16" },
  { src: "/images/apple-music.svg",  alt: "Apple Music 2", pos: "bottom-[8%] right-[30%]",   delay: "0.3s", size: "w-16 h-16 sm:w-20 sm:h-20" },
  { src: "/images/youtube.svg",      alt: "YouTube",       pos: "top-[30%] right-[4%]",      delay: "0.9s", size: "w-14 h-14 sm:w-16 sm:h-16" },
];

const PlatformIconsDisplay: React.FC = () => (
  <div className="relative w-full max-w-[460px] h-[340px] sm:h-[380px] mx-auto lg:mx-0">
    <style>{`
      @keyframes float-bob {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-14px); }
      }
      @keyframes spotify-pulse {
        0%, 100% { transform: scale(1);    }
        50%       { transform: scale(1.06); }
      }
      .icon-float    { animation: float-bob 3.6s ease-in-out infinite; }
      .spotify-pulse { animation: spotify-pulse 3s ease-in-out infinite; }
    `}</style>

    {/* Red glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "radial-gradient(ellipse 75% 75% at 65% 50%, rgba(195,1,0,0.4) 0%, rgba(195,1,0,0.12) 50%, transparent 75%)",
        filter: "blur(20px)",
      }}
      aria-hidden="true"
    />

    {/* Spotify center */}
    <div className="spotify-pulse absolute top-1/2 right-[26%] -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1DB954] flex items-center justify-center z-10 shadow-2xl shadow-[#1DB954]/40">
      <Image src="/images/spotify.svg" alt="Spotify" width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 object-contain brightness-0 invert" />
    </div>

    {/* Floating icons */}
    {FLOAT_ICONS.map(({ src, alt, pos, delay, size }) => (
      <div
        key={`${alt}-${delay}`}
        className={`icon-float absolute ${pos} ${size} rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl`}
        style={{ animationDelay: delay }}
      >
        <Image src={src} alt={alt} width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" loading="lazy" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────
   SMART LINK CARD MOCK
───────────────────────────────────────────────────────── */
const SmartLinkCard: React.FC = () => (
  <div className="w-full max-w-[500px] mx-auto rounded-2xl bg-[#1A0A0A] border border-white/10 p-6 sm:p-8 shadow-2xl">
    <div className="flex items-center gap-4 mb-6">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
        <Image src="/images/cover-one.png" alt="Into The Night" fill className="object-cover" />
      </div>
      <div>
        <p className="font-heading text-white text-sm uppercase tracking-wider">Into The Night</p>
        <p className="font-body text-white/50 text-xs mt-1">Alexia Starr</p>
      </div>
    </div>
    <p className="font-body text-white/40 text-xs mb-3">Available On 25+ Platforms</p>
    <div className="flex items-center gap-3 mb-8 flex-wrap">
      {[
        { src: "/images/spotify.svg",     bg: "bg-[#1DB954]", alt: "Spotify"    },
        { src: "/images/musicmatch.svg",  bg: "bg-[#FF6B35]", alt: "Musixmatch" },
        { src: "/images/meta.svg",        bg: "bg-[#1877F2]", alt: "Meta"       },
        { src: "/images/apple-music.svg", bg: "bg-[#FC3C44]", alt: "Apple Music"},
        { src: "/images/youtube.svg",     bg: "bg-[#1A1010]", alt: "YouTube"    },
      ].map((p) => (
        <div key={p.alt} className={`w-11 h-11 rounded-full ${p.bg} flex items-center justify-center shrink-0 border border-white/10`}>
          <Image src={p.src} alt={p.alt} width={22} height={22} className="w-5 h-5 object-contain brightness-0 invert" />
        </div>
      ))}
    </div>
    <div className="rounded-full p-[1.34px]" style={{ background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)" }}>
      <button className="w-full font-heading text-white text-xs uppercase tracking-[0.2em] py-4 rounded-full bg-[#140C0C] hover:bg-white hover:text-[#140C0C] transition-all duration-300">
        COPY LINK
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   CARD WRAPPER — scroll reveal
───────────────────────────────────────────────────────── */
const FeatureCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  bg?: string;
}> = ({ children, className = "", delay = 0, bg = "bg-[#180F0F]" }) => {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={[
        `rounded-2xl ${bg} border border-white/[0.07] overflow-hidden`,
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   FEATURES SECTION
───────────────────────────────────────────────────────── */
const FeaturesSection: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.3);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* Top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-25"
        style={{ background: "radial-gradient(ellipse at top, rgba(195,1,0,0.5) 0%, transparent 65%)", filter: "blur(90px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1280px] mx-auto space-y-4">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center pb-8 sm:pb-12 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <p className="font-body text-white/40 text-xs sm:text-sm tracking-[0.4em] uppercase mb-4">
            — Features —
          </p>
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight max-w-3xl mx-auto">
            Everything You Need to Succeed
          </h2>
        </div>

        {/* ══════════════════════════════════
            ROW 1 — GLOBAL DISTRIBUTION
            Full width. Text left, icons right.
        ══════════════════════════════════ */}
        <FeatureCard delay={0}>
          <div className="flex flex-col lg:flex-row items-center gap-0 min-h-[360px]">

            {/* Left — text block */}
            <div className="flex-1 p-8 sm:p-10 lg:p-14 flex flex-col justify-center">
              <h3 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide mb-5">
                Global Distribution
              </h3>
              <p className="font-body text-white/55 text-sm sm:text-base leading-relaxed mb-10 max-w-[380px]">
                Distribute your music worldwide with full ownership and control.
                Release on your schedule and expand beyond borders.
              </p>
              <GradientBorderButton href="/signup" className="text-[11px] tracking-widest px-7 py-3.5">
                Start Your Global Release
              </GradientBorderButton>
            </div>

            {/* Right — floating icons */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-0 w-full min-h-[300px] lg:min-h-full">
              <PlatformIconsDisplay />
            </div>

          </div>
        </FeatureCard>

        {/* ══════════════════════════════════
            ROW 2 — ANALYTICS + PRO TOOLS
            Analytics: ~1/3 width
            Pro Tools:  ~2/3 width
            bg: #201515, no inner frame on images
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Analytics — 1 col */}
          {/* <FeatureCard delay={100} bg="bg-[#201515]">
            <div className="relative w-full h-[220px] sm:h-[260px] overflow-hidden">
              <Image
                src="/images/analytics.svg"
                alt="Analytics dashboard"
                fill
                className="object-contain p-6"
                loading="lazy"
              />
            </div>
            <div className="px-6 pb-8 text-center">
              <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-4">
                Analytics
              </h3>
              <p className="font-body text-white/55 text-sm leading-relaxed">
                Track performance in real time. Understand your audience and make
                smarter growth decisions backed by data.
              </p>
            </div>
          </FeatureCard> */}

          <FeatureCard delay={100} bg="bg-[#201515]">
  <div className="flex flex-col h-full">

    {/* Image */}
    <div className="relative w-full h-[240px] sm:h-[260px] flex items-center justify-center">
      <Image
        src="/images/analytics.svg"
        alt="Analytics dashboard"
        fill
        className="object-contain p-8"
        loading="lazy"
      />
    </div>

    {/* Content */}
    <div className="px-6 pb-8 text-center mt-auto">
      <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
        Analytics
      </h3>
      <p className="font-body text-white/55 text-sm leading-relaxed">
        Track performance in real time. Understand your audience and make
        smarter growth decisions backed by data.
      </p>
    </div>

  </div>
</FeatureCard>

          {/* Pro Tools — 2 cols */}
          <FeatureCard delay={200} bg="bg-[#201515]" className="sm:col-span-2">
            <div className="relative w-full h-[320px] sm:h-[380px] overflow-hidden">
              <Image
                src="/images/linemap.svg"
                alt="Pro tools diagram"
                fill
                className="object-contain p-6"
                loading="lazy"
              />
            </div>
            <div className="px-6 pb-8 text-center">
              <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-4">
                Pro Tools
              </h3>
              <p className="font-body text-white/55 text-sm leading-relaxed max-w-[480px] mx-auto">
                A.I. tools, Private Links, Playlist Pitch Portal access, and
                professional release management — everything you need to operate
                like a label.
              </p>
            </div>
          </FeatureCard>

        </div>

        {/* ══════════════════════════════════
            ROW 3 — PUBLISHING + REVENUE
            Publishing:  text top-left  | photo fills right half (side by side)
            Revenue:     text top-right | photo fills left half  (side by side)
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Publishing — text left column, image right column */}
          <FeatureCard delay={0}>
            <div className="flex flex-col sm:flex-row h-full min-h-[360px]">
              {/* Text */}
              <div className="flex flex-col justify-start p-6 sm:p-8 sm:w-1/2 shrink-0">
                <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
                  Publishing
                </h3>
                <p className="font-body text-white/55 text-sm leading-relaxed">
                  Protect your songwriting rights and collect publishing royalties
                  globally. Get paid for every use of your music.
                </p>
              </div>
              {/* Image — fills remaining height/width */}
              <div className="relative flex-1 min-h-[240px] sm:min-h-0 overflow-hidden">
                <Image
                  src="/images/publishing.svg"
                  alt="Artist playing guitar"
                  fill
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>
            </div>
          </FeatureCard>

          {/* Revenue — text right column, image left column */}
          <FeatureCard delay={150}>
            <div className="flex flex-col-reverse sm:flex-row h-full min-h-[360px]">
              {/* Image — fills left */}
              <div className="relative flex-1 min-h-[240px] sm:min-h-0 overflow-hidden">
                <Image
                  src="/images/revenue.svg"
                  alt="Headphones and phone"
                  fill
                  className="object-cover object-center"
                  loading="lazy"
                />
              </div>
              {/* Text — right column */}
              <div className="flex flex-col justify-start p-6 sm:p-8 sm:w-1/2 shrink-0">
                <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
                  Revenue & Monetization
                </h3>
                <p className="font-body text-white/55 text-sm leading-relaxed">
                  Transparent royalty reporting, funding opportunities, and flexible
                  withdrawals — including payouts in supported African currencies
                  directly to your local bank account.
                </p>
              </div>
            </div>
          </FeatureCard>

        </div>

        {/* ══════════════════════════════════
            ROW 4 — SPLIT ROYALTIES + COMMUNITY
            Both: large photo top, text + subtext below.
        ══════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Split Royalties */}
          <FeatureCard delay={0}>
            {/* Large photo */}
            <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
              <Image
                src="/images/splitroyalties.svg"
                alt="Money fan"
                fill
                className="object-cover object-center"
                loading="lazy"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
                Split Royalties
              </h3>
              <p className="font-body text-white/55 text-sm leading-relaxed mb-4">
                Built-in Split Royalties for collaborations. Automatically divide
                earnings between collaborators without manual transfers or disputes.
              </p>
              <p className="font-body text-white/35 text-xs tracking-wide">
                · Monetize globally. Get paid locally. Collaborate seamlessly.
              </p>
            </div>
          </FeatureCard>

          {/* Community & Support */}
          <FeatureCard delay={150}>
            {/* Large photo */}
            <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
              <Image
                src="/images/communitysupport.svg"
                alt="Community hands together"
                fill
                className="object-cover object-center"
                loading="lazy"
              />
            </div>
            <div className="p-6 sm:p-8">
              <h3 className="font-heading text-white uppercase text-xl sm:text-2xl tracking-wide mb-3">
                Community & Support
              </h3>
              <p className="font-body text-white/55 text-sm leading-relaxed">
                Access education, Artist spotlight, workshops, and real human
                support. Build your career alongside a growing independent network.
              </p>
            </div>
          </FeatureCard>

        </div>

        {/* ══════════════════════════════════
            ROW 5 — SMART RELEASE LINKS
            Full width. Text left, mock card right.
        ══════════════════════════════════ */}
        <FeatureCard delay={0}>
          <div className="flex flex-col lg:flex-row items-center gap-10 p-8 sm:p-10 lg:p-14 min-h-[360px]">

            {/* Left — text */}
            <div className="flex-1 max-w-[440px]">
              <h3 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide mb-5">
                Smart Release Links
              </h3>
              <p className="font-body text-white/55 text-sm sm:text-base leading-relaxed">
                Create powerful release links that drive pre-saves, track engagement,
                and centralize your audience in one place. Turn every release into a
                marketing asset.
              </p>
            </div>

            {/* Right — mock card */}
            <div className="flex-1 flex items-center justify-center w-full">
              <SmartLinkCard />
            </div>

          </div>
        </FeatureCard>

      </div>
    </section>
  );
};

export default FeaturesSection;