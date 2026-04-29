import React from "react";
import Image from "next/image";
import Link from "next/link";

const TESTIMONIAL = {
  quote:
    "Songdis helped me build a career, not just drop sounds. They worked with me on my image, sound and strategy. Things I never thought about as an indie artist. I don't have to juggle everything anymore. They managed the backend so I can stay focused on writing, recording and growing.",
  name: "Kdiv Coco",
  country: "Nigeria",
  flag: "🇳🇬",
  avatar: "/images/avatar-artiste.svg",
};

interface AuthLayoutProps {
  children: React.ReactNode;
  heroImage?: "singer" | "guitar";
}

export default function AuthLayout({
  children,
  heroImage = "singer",
}: AuthLayoutProps) {
  const imageSrc =
    heroImage === "singer"
      ? "/images/new-singer.svg"
      : "/images/new-guitar.svg";

  return (
    <div className="min-h-screen w-full flex bg-[#0E0808]">

      {/* ── LEFT PANEL — 40% ───────────────────────────────────── */}
      <div className="relative w-full lg:w-[40%] shrink-0 flex flex-col min-h-screen overflow-y-auto bg-[#140C0C]">
        {/* Noise texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Subtle red glow top-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(195,1,0,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 flex flex-col flex-1 px-10 sm:px-12 py-8">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 self-start group">
            <div className="relative">
              <Image
                src="/images/logo.svg"
                alt="Songdis logo"
                width={120}
                height={32}
                className="object-contain h-12 w-auto"
                priority
              />
            </div>
           
          </Link>

          {/* Form content */}
          <div className="flex-1 flex flex-col justify-center">
            {children}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — 60% ──────────────────────────────────── */}
      <div className="hidden lg:flex w-[60%] p-4">
        {/* Card — image fills full card, testimonial overlays bottom */}
        <div className="flex-1 relative rounded-2xl overflow-hidden">

          {/* Hero image — full card */}
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover object-center"
            priority
            aria-hidden="true"
          />

          {/* Gradient overlay — strong at bottom for text legibility */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(14,8,8,0.05) 40%, rgba(14,8,8,0.92) 100%)",
            }}
          />

          {/* Testimonial — absolutely positioned over the image at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 z-10 px-8 py-8">
            <svg
              className="mb-3 opacity-60"
              width="20"
              height="16"
              viewBox="0 0 20 16"
              fill="none"
            >
              <path
                d="M0 16V10.24C0 8.777 0.29 7.394 0.87 6.09 1.467 4.77 2.267 3.613 3.27 2.62 4.29 1.61 5.453 0.793 6.76 0.17L8.32 2.15C7.28 2.62 6.37 3.277 5.6 4.12 4.847 4.963 4.363 5.943 4.15 7.06H8.32V16H0ZM11.68 16V10.24C11.68 8.777 11.97 7.394 12.55 6.09 13.147 4.77 13.947 3.613 14.95 2.62 15.97 1.61 17.133 0.793 18.44 0.17L20 2.15C18.96 2.62 18.05 3.277 17.28 4.12 16.527 4.963 16.043 5.943 15.83 7.06H20V16H11.68Z"
                fill="white"
              />
            </svg>

            <p className="font-body text-white/90 text-sm leading-relaxed mb-5">
              {TESTIMONIAL.quote}
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
                  <Image
                    src={TESTIMONIAL.avatar}
                    alt={TESTIMONIAL.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-heading text-white uppercase text-sm tracking-wide">
                  {TESTIMONIAL.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl">{TESTIMONIAL.flag}</span>
                <span className="font-body text-white/60 text-xs">
                  {TESTIMONIAL.country}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}