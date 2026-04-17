"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const USEFUL_LINKS = [
  { label: "About", href: "/about" },
  { label: "Community", href: "/community" },
  { label: "Marketing", href: "/marketing" },
  { label: "Pricing", href: "/pricing" },
  { label: "Publishing", href: "/publishing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: "/images/instagram.svg",
  },
  {
    label: "Linkedin",
    href: "https://linkedin.com",
    icon: "/images/linkedin.svg",
  },
  {
    label: "X (Formerly twitter)",
    href: "https://x.com",
    icon: "/images/twitter.svg",
  },
];

/* ─────────────────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────────────────── */
const Footer: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up newsletter submission
    setEmail("");
  };

  return (
    <footer className="relative w-full bg-[#140C0C] overflow-hidden">
      {/* ════════════════════════════════════
          CTA CARD
      ════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-20 sm:pt-24 lg:pt-32">
        {/* Gradient border wrapper */}
        <div
          className="rounded-2xl p-[1.34px]"
          style={{
            background:
              "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.08) 81.99%)",
          }}
        >
          <div className="relative rounded-2xl bg-[#1A0808] overflow-hidden min-h-[340px] flex flex-col lg:flex-row items-stretch">
            {/* Left — heading + body + button */}
            <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14 flex-1 relative z-10">
              <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-[52px] leading-tight lg:leading-[60px] mb-5 max-w-[480px]">
                Ready to Get Your Music Everywhere?
              </h2>
              <p className="font-body text-white text-sm sm:text-base leading-relaxed mb-8">
                Join thousands of artists who use Songdis to distribute,
                promote, and grow. Take control of your music journey today.
              </p>

              {/* GET STARTED — gradient border button */}
              <div
                className="inline-block rounded-full p-[1.34px] self-start"
                style={{
                  background:
                    "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
                }}
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs lg:text-[18px] rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
                  style={{
                    backdropFilter: "blur(4.45px)",
                    WebkitBackdropFilter: "blur(4.45px)",
                  }}
                >
                  Get Started
                </Link>
              </div>
            </div>

            {/* Right — cta-icons image, bleeds flush to card edges */}
            <div className="relative w-full lg:w-[48%] min-h-[240px] lg:min-h-0 shrink-0">
              <Image
                src="/images/cta-icons.svg"
                alt=""
                fill
                className="object-contain object-right"
                priority
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          NEWSLETTER + LINKS + SOCIALS
      ════════════════════════════════════ */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-12">
          {/* Col 1 — Newsletter (wider) */}
          <div className="sm:col-span-1 lg:col-span-2">
            <h3 className="font-heading text-white uppercase text-xl sm:text-2xl leading-tight tracking-wide mb-4">
              Subscribe to Our Newsletter
            </h3>
            <p className="font-body text-white text-sm leading-relaxed mb-6">
              Stay updated with the latest news and trends in Nigeria and
              Africa's entertainment industry!
            </p>

            {/* Email pill */}
            <form
              onSubmit={handleSignUp}
              className="flex items-center rounded-full border border-white/15 bg-[#1A0808] p-1.5 gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="flex-1 min-w-0 bg-transparent font-body text-white text-sm placeholder:text-white/30 outline-none px-4 py-2"
              />
              <button
                type="submit"
                className="shrink-0 font-heading text-white uppercase tracking-widest text-xs rounded-full bg-white/10 hover:bg-[#C30100] transition-colors duration-300 px-6 py-3 whitespace-nowrap"
              >
                Sign Up
              </button>
            </form>
          </div>

          {/* Col 2 — Useful Links */}
          <div className="lg:col-span-2">
            <h4 className="font-heading text-white uppercase text-sm tracking-[0.3em] mb-6">
              Useful Links
            </h4>
            <ul className="flex flex-col gap-3">
              {USEFUL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body text-white text-sm hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Socials */}
          <div className="lg:col-span-1">
            <h4 className="font-heading text-white uppercase text-sm tracking-[0.3em] mb-6">
              Socials
            </h4>
            <ul className="flex flex-col gap-4">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    <div className="relative w-6 h-6 shrink-0">
                      <Image
                        src={s.icon}
                        alt={s.label}
                        fill
                        className="object-contain"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-body text-white text-sm group-hover:text-white transition-colors duration-200">
                      {s.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          SONGDIS WORDMARK — red outline, full bleed
      ════════════════════════════════════ */}
      <div
        aria-hidden="true"
        className="w-full overflow-hidden select-none pointer-events-none"
        style={{ marginBottom: "-0.12em" }}
      >
        <p
          className="font-heading uppercase text-center whitespace-nowrap"
          style={{
            fontSize: "clamp(50px, 16vw, 260px)",
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: "2px #C30100",
            letterSpacing: "-0.02em",
          }}
        >
          SONGDIS
        </p>
      </div>
    </footer>
  );
};

export default Footer;
