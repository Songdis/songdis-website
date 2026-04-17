"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
   CHECK ICON
───────────────────────────────────────────────────────── */
const CheckIcon: React.FC = () => (
  <div className="w-6 h-6 rounded-full bg-[#C30100] flex items-center justify-center shrink-0 mt-0.5">
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
      <path
        d="M1 5L4.5 8.5L11 1.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
interface Plan {
  name: string;
  bestFor: string;
  priceYearly: string;
  priceMonthly: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
  addOns?: { label: string }[];
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    bestFor: "New & independent artists starting out",
    priceYearly: "44,000.00",
    priceMonthly: "3,667.00",
    features: [
      "1 Artist Account",
      "Unlimited Releases",
      "Analytics",
      "Lyrics Distribution",
      "Keep 95% of Your Royalties",
      "Fast Payments & Easy Withdrawals",
      "Stream Links for Each Release",
    ],
    cta: "Get Help & Support",
    ctaHref: "/support",
  },
  {
    name: "Growth Plan",
    bestFor: "Serious independent artists & growing teams",
    priceYearly: "140,000.00",
    priceMonthly: "11,667.00",
    features: [
      "All Basic Plan Features",
      "3 Artist Accounts",
      "100% of Your Royalties",
      "Customize Label Name",
      "Editorial Playlist Pitch Portal",
      "24/7 Support",
    ],
    cta: "Upgrade to Growth",
    ctaHref: "/signup?plan=growth",
    popular: true,
  },
  {
    name: "Label Plan",
    bestFor: "Small labels, managers & collectives",
    priceYearly: "150,000.00",
    priceMonthly: "12,500.00",
    features: [
      "All Growth Plan Features",
      "Up to 5 Artist Accounts",
      "Central label dashboard",
      "Multi-artist analytics & earnings view",
      "Bulk release management",
      "Faster release review & processing",
      "Priority support",
      "Customize Label Name",
      "Invite team members",
    ],
    cta: "Start a Label",
    ctaHref: "/signup?plan=label",
    addOns: [
      { label: "Add extra artist: ₦30,000 Per artist / year" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
   PRICING CARD
───────────────────────────────────────────────────────── */
const PricingCard: React.FC<{
  plan: Plan;
  billing: "monthly" | "yearly";
  delay?: number;
}> = ({ plan, billing, delay = 0 }) => {
  const { ref, inView } = useInView(0.05);
  const price = billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const period = billing === "yearly" ? "/yearly" : "/monthly";

  return (
    <div
      ref={ref}
      className={[
        "relative flex flex-col transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Most Popular bubble */}
      {plan.popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
          <div className="px-5 py-2 rounded-full bg-[#2A1010] border border-white/20">
            <span className="font-body text-white text-sm whitespace-nowrap">
              Most Popular
            </span>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="flex flex-col flex-1 rounded-2xl p-7 sm:p-8 h-full"
        style={{
          backgroundColor: "#180F0F",
          border: plan.popular
            ? "1.5px dashed #C30100"
            : "1px solid rgba(255,255,255,0.1)",
          minHeight: "680px",
        }}
      >
        {/* Plan name */}
        <h3 className="font-heading text-white uppercase text-2xl sm:text-3xl tracking-wide mb-2">
          {plan.name}
        </h3>

        {/* Best for */}
        <p className="font-body text-white/55 text-sm leading-relaxed mb-6">
          Best for: {plan.bestFor}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-8">
          <span className="font-heading text-white text-lg">₦</span>
          <span
            className="font-heading text-white leading-none text-[30px]"
           
          >
            {price}
          </span>
          <span className="font-body text-white/50 text-sm ml-1">
            {period}
          </span>
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-3 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <CheckIcon />
              <span className="font-body text-white/75 text-sm leading-relaxed">
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* Add-ons */}
        {plan.addOns && (
          <div className="mt-6 pt-6 border-t border-white/[0.07]">
            <h4 className="font-heading text-white uppercase text-sm tracking-widest mb-4">
              Add-Ons
            </h4>
            <ul className="flex flex-col gap-3">
              {plan.addOns.map((a) => (
                <li key={a.label} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="font-body text-white/75 text-sm leading-relaxed">
                    {a.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA button */}
        <div className="mt-8">
          <div
            className="rounded-full p-[1.34px]"
            style={{
              background: plan.popular
                ? "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)"
                : "linear-gradient(86.92deg, rgba(255,255,255,0.3) 11.12%, rgba(255,255,255,0.08) 81.99%)",
            }}
          >
            <Link
              href={plan.ctaHref}
              className="flex items-center justify-center w-full font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] py-4 px-6 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              {plan.cta}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   PRICING SECTION
───────────────────────────────────────────────────────── */
const PricingSection: React.FC = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const { ref: headRef, inView: headInView } = useInView(0.2);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* ── Red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── TOGGLE ── */}
        <div
          ref={headRef}
          className={[
            "flex justify-center mb-14 sm:mb-16 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <div className="flex items-center rounded-full bg-[#1A0808] border border-white/10 p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={[
                "font-heading uppercase tracking-widest text-xs rounded-full px-6 py-3 transition-all duration-300",
                billing === "monthly"
                  ? "bg-[#C30100] text-white"
                  : "text-white/50 hover:text-white",
              ].join(" ")}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={[
                "font-heading uppercase tracking-widest text-xs rounded-full px-6 py-3 transition-all duration-300",
                billing === "yearly"
                  ? "bg-[#C30100] text-white"
                  : "text-white/50 hover:text-white",
              ].join(" ")}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              billing={billing}
              delay={i * 100}
            />
          ))}
        </div>

        {/* ── ENTERPRISE BANNER ── */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-[#1A0808] border border-white/10 px-6 py-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C30100] shrink-0" />
            <p className="font-body text-white/70 text-sm">
              Need a custom solution? Contact our sales team for enterprise options.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PricingSection;