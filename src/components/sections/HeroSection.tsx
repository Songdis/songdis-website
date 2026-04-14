"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import InfiniteMarquee from "../ui/InfinteMarquee";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface CoverArt {
  id: string;
  src: string;
  alt: string;
}

interface Platform {
  id: string;
  name: string;
  logoSrc: string;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
}

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const COVER_ARTS: CoverArt[] = [
  { id: "c1", src: "/images/cover-one.png", alt: "Artist album cover 1" },
  { id: "c2", src: "/images/cover-two.png", alt: "Artist album cover 2" },
  { id: "c3", src: "/images/cover-three.png", alt: "Artist album cover 3" },
  { id: "c4", src: "/images/cover-four.png", alt: "Artist album cover 4" },
  { id: "c5", src: "/images/cover-five.png", alt: "Artist album cover 5" },
  { id: "c6", src: "/images/cover-six.png", alt: "Artist album cover 6" },
];

const PLATFORMS: Platform[] = [
  { id: "p1", name: "Apple Music", logoSrc: "/images/apple-music.svg" },
  { id: "p2", name: "Meta", logoSrc: "/images/meta.svg" },
  { id: "p3", name: "Musixmatch", logoSrc: "/images/musicmatch.svg" },
  { id: "p4", name: "Spotify", logoSrc: "/images/spotify.svg" },
  { id: "p5", name: "YouTube Music", logoSrc: "/images/youtube.svg" },
];

const FEATURES: FeatureItem[] = [
  {
    id: "f1",
    title: "GLOBAL DISTRIBUTION",
    description: "Distribute music worldwide",
  },
  {
    id: "f2",
    title: "PRO TOOLS",
    description: "A.I tools, private links and playlist pitch portal access",
  },
  {
    id: "f3",
    title: "PUBLISHING",
    description: "Protect your songwriting rights",
  },
  {
    id: "f4",
    title: "MONETIZATION",
    description: "Transparent royalty refunding.",
  },
];

/* ─────────────────────────────────────────────────────────
   ROTATIONS — alternating tilt to fan the cards
───────────────────────────────────────────────────────── */
const ROTATIONS = [-4, -2, -5, 0, 3, -1, 4, -3, 2, -4];

/* ─────────────────────────────────────────────────────────
   COVER CARD
───────────────────────────────────────────────────────── */
const CoverCard: React.FC<CoverArt & { index: number }> = ({
  src,
  alt,
  index,
}) => {
  const rotate = ROTATIONS[index % ROTATIONS.length];

  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        /* Width: visible count ~6 across viewport */
        width: "clamp(140px, 15vw, 230px)",
        /* Tall portrait — matches Figma cover art ratio ~3:4 */
        height: "clamp(200px, 22vw, 340px)",
        borderRadius: "14px",
        overflow: "hidden",
        /* Fan effect — pivot from bottom */
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "bottom center",
        boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 4px 14px rgba(0,0,0,0.5)",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 140px, (max-width: 1280px) 180px, 230px"
        style={{ objectFit: "cover" }}
        loading="lazy"
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   PLATFORM LOGO
───────────────────────────────────────────────────────── */
const PlatformLogo: React.FC<Platform> = ({ name, logoSrc }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      opacity: 0.65,
      transition: "opacity 0.3s",
      padding: "0 8px",
    }}
  >
    <Image
      src={logoSrc}
      alt={name}
      width={150}
      height={44}
      style={{
        objectFit: "contain",
        height: "clamp(26px, 2.4vw, 38px)",
        width: "auto",
        filter: "brightness(0) invert(1)",
      }}
      loading="lazy"
    />
  </div>
);

/* ─────────────────────────────────────────────────────────
   HERO SECTION
───────────────────────────────────────────────────────── */
const HeroSection: React.FC = () => {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#140C0C",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      className="pt-8 lg:pt-16"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── SMALL RED ELLIPSE
           Figma: w=887 h=258, top=247, #C30100 20%, blur=365px, plus-lighter ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "887px",
          height: "258px",
          top: "247px",
          left: "50%",
          transform: "translateX(-20%)",
          background: "rgba(195, 1, 0, 0.20)",
          borderRadius: "50%",
          filter: "blur(130px)",
          mixBlendMode: "plus-lighter",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── MAIN CONTENT ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          paddingTop: "clamp(90px, 8vw, 120px)",
          paddingLeft: "clamp(16px, 4vw, 40px)",
          paddingRight: "clamp(16px, 4vw, 40px)",
        }}
      >
        <h1
          className="font-heading"
          style={{
            color: "#FFFFFF",
            textTransform: "uppercase",
            fontSize: "clamp(1.7rem, 4.87vw, 70px)",
            lineHeight: 1.06,
            letterSpacing: "-0.01em",
            maxWidth: "1070px",
            width: "100%",
            margin: 0,
            /* Fade-up animation */
            animation: "fadeUp 0.8s ease both",
            animationDelay: "0.1s",
          }}
        >
          The Operating System for Artists &amp; Labels.
        </h1>

        {/* ── DESCRIPTION
             Figma: 23.4px, line-height 31.44px ── */}
        <p
          className="font-body"
          style={{
            color: "rgba(255,255,255,0.72)",
            fontSize: "clamp(0.875rem, 1.625vw, 18.4px)",
            lineHeight: "1.35",
            maxWidth: "700px",
            width: "100%",
            marginTop: "clamp(14px, 1.8vw, 24px)",
            animation: "fadeUp 0.8s ease both",
            animationDelay: "0.25s",
          }}
        >
          Upload your music on Spotify, Apple Music &amp; more, access pro
          tools, keep 100% ownership, and earn in any currency.
        </p>

        {/* ── CTA BUTTON ── */}
        <div
          style={{
            marginTop: "clamp(24px, 2.8vw, 40px)",
            animation: "fadeUp 0.8s ease both",
            animationDelay: "0.4s",
          }}
        >
          {/* ── Gradient border shell ── */}
          <div
            style={{
              display: "inline-block",
              padding: "1.34px",
              borderRadius: "9999px",
              background:
                "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
            }}
          >
            {/* ── Inner button — filled with page bg so gradient border shows ── */}
            <Link
              href="/signup"
              className="font-heading"
              style={{
                display: "inline-block",
                color: "#FFFFFF",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontSize: "clamp(10px, 0.85vw, 13px)",
                padding: "clamp(12px, 1vw, 16px) clamp(32px, 3.5vw, 52px)",
                borderRadius: "9999px",
                cursor: "pointer",
                /* Page background — makes the 1.34px shell visible as the border */
                background: "#140C0C",
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
                textDecoration: "none",
                transition: "background 0.3s, color 0.3s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#140C0C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#140C0C";
                e.currentTarget.style.color = "#FFFFFF";
              }}
            >
              GET STARTED
            </Link>
          </div>
        </div>
      </div>

      {/* ── COVER ART MARQUEE ── */}
      <div
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          marginTop: "clamp(36px, 4vw, 60px)",
        }}
      >
        <InfiniteMarquee
          duration={34}
          gap={18}
          itemAlignment="end"
          curved
          pauseOnHover
        >
          {COVER_ARTS.map((cover, i) => (
            <CoverCard key={cover.id} {...cover} index={i} />
          ))}
        </InfiniteMarquee>
      </div>

      {/* ── LARGE DARK ELLIPSE
           Figma: w=1400 h=324, top=447, fill=#140C0C, monotone noise.
           Acts as a "horizon" — covers the bottom of the cards creating
           the illusion they're emerging from below the surface. ── */}

      {/* ── FEATURE PILLS — above everything ── */}
      <div className="relative z-20 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 sm:gap-x-8 lg:gap-x-10">
          {FEATURES.map((f, i) => (
            <div
              key={f.id}
              style={{
                textAlign: "center",
                animation: "fadeUp 0.8s ease both",
                animationDelay: `${0.55 + i * 0.1}s`,
              }}
            >
              <h3
                className="font-heading text-[15px] lg:text-[17px]"
                style={{
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  // fontSize: "clamp(9px, 0.9vw, 18px)",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {f.title}
              </h3>
              <p
                className="font-body text-[15px] font-medium text-[#FFFFFF]"
                style={{
                  lineHeight: 1.55,
                  maxWidth: "200px",
                  margin: "0 auto",
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          height: "1px",
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* ── PLATFORM STRIP ── */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          paddingTop: "clamp(28px, 3.5vw, 52px)",
          paddingBottom: "clamp(28px, 3.5vw, 52px)",
        }}
      >
        <p
          className="font-heading text-[20px] lg:text-[25.25px]"
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.22)",
            textTransform: "uppercase",

            marginBottom: "clamp(24px, 2.8vw, 40px)",
            animation: "fadeUp 0.8s ease both",
            animationDelay: "0.7s",
          }}
        >
          Distributed to 200+ Platforms
        </p>

        <InfiniteMarquee duration={48} gap={96} pauseOnHover>
          {PLATFORMS.map((p) => (
            <PlatformLogo key={p.id} {...p} />
          ))}
        </InfiniteMarquee>
      </div>

      {/* ── KEYFRAMES — defined once in the section ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
