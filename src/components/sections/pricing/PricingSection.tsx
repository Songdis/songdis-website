"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getBillingPlans, formatMoney, type BillingPlan, type BillingPrice } from "@/lib/api/billing";
import { priceIn, currenciesFor, detectCurrency } from "@/lib/billing/currency";

/**
 * Live prices in the visitor's currency.
 *
 * The plans and their prices come from the same catalogue checkout uses, and the server says
 * where the visitor is (Cloudflare) and what to show first: their own currency by bank
 * transfer where we can take it, otherwise USD by card. The figures below the PLANS list are
 * only a fallback if that request fails.
 */
type Live = {
  plans: BillingPlan[];
  currency: string;
  track: "local_transfer" | "usd_card";
};

function livePrice(live: Live | null, key: string, interval: "month" | "year"): { text: string; currency: string } | null {
  if (!live) return null;
  const plan = live.plans.find((p) => p.key === key || p.key.startsWith(key + "-") || p.key.startsWith(key));
  // USD is the card track; any other currency is a bank-transfer price shown in that currency.
  const track = live.currency === "USD" ? "usd_card" : "local_transfer";
  const price: BillingPrice | undefined = plan?.prices.find((p) => p.interval === interval && p.track === track);
  if (!price) return null;
  const shown = priceIn(price, live.currency);
  return { text: formatMoney(shown.amount, shown.currency), currency: shown.currency };
}


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

interface Plan {
  /** billing_plans.key this card shows. */
  key: string;
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
    key: "basic",
    name: "Basic",
    bestFor: "Perfect for independent artists getting started.",
    priceYearly: "59,988",
    priceMonthly: "4,999",
    features: [
      "1 Artist Account",
      "Unlimited Music Releases",
      "Ayo AI (Your Music Intelligence Assistant)",
      "Keep 100% Independence",
      "Instant Royalty Withdrawals in Your Preferred Currency",
      "Lyrics Distribution",
      "Smart Release Links",
      "Artist Community",
      "24-48hrs customer support",
    ],
    cta: "Get Basic",
    ctaHref: "/sign-up?plan=basic",
  },
  {
    key: "growth",
    name: "Growth",
    bestFor: "For artists and teams ready to scale.",
    priceYearly: "143,988",
    priceMonthly: "11,999",
    features: [
      "All Basic Plan Features",
      "Up to 3 Artist & More",
      "Release Music Under Your Own Label Name",
      "Global Music Video Distribution (Spotify, Apple Music, VEVO & More)",
      "Editorial Playlist Pitching (Pitch Portal)",
      "Priority Artist Support (24-48 Hours)",
      "Early Access to New Features",
    ],
    cta: "Get Growth",
    ctaHref: "/sign-up?plan=growth",
    popular: true,
  },
  {
    key: "label",
    name: "Label Plan",
    bestFor: "Small labels, managers & collectives",
    priceYearly: "215,880",
    priceMonthly: "17,990",
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
    ctaHref: "/sign-up?plan=label",
    addOns: [
      { label: "Add extra artist: ₦30,000 Per artist / year" },
    ],
  },
];


const PricingCard: React.FC<{
  plan: Plan;
  billing: "monthly" | "yearly";
  delay?: number;
  live: Live | null;
}> = ({ plan, billing, delay = 0, live }) => {
  const { ref, inView } = useInView(0.05);
  const period = billing === "yearly" ? "/year" : "/month";
  const fromLive = livePrice(live, plan.key, billing === "yearly" ? "year" : "month");
  // Fallback: the naira figures typed below, as before.
  const price = fromLive?.text ?? "₦" + (billing === "yearly" ? plan.priceYearly : plan.priceMonthly);
  const addOns = plan.addOns && (!fromLive || fromLive.currency === "NGN")
    ? plan.addOns
    : plan.addOns ? [{ label: "Add extra artists to your label (contact us for pricing in your currency)" }] : undefined;

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
          <span className="font-heading text-white leading-none text-[30px]">
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
        {addOns && (
          <div className="mt-6 pt-6 border-t border-white/[0.07]">
            <h4 className="font-heading text-white uppercase text-sm tracking-widest mb-4">
              Add-Ons
            </h4>
            <ul className="flex flex-col gap-3">
              {addOns.map((a) => (
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


const PricingSection: React.FC = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    let alive = true;
    getBillingPlans().then((res) => {
      if (!alive || !res.data?.plans?.length) return;
      const loc = res.data.location;
      const fallback = detectCurrency();
      setLive({
        plans: res.data.plans,
        currency: loc?.currency ?? fallback ?? "USD",
        track: loc?.track ?? (fallback ? "local_transfer" : "usd_card"),
      });
    });
    return () => { alive = false; };
  }, []);

  /** USD (card) plus every local currency the bank-transfer prices can be shown in. */
  const currencies = useMemo(() => {
    if (!live) return [];
    const set = new Set<string>(["USD"]);
    for (const p of live.plans) {
      for (const price of p.prices) {
        if (price.track === "local_transfer") currenciesFor(price).forEach((c) => set.add(c));
      }
    }
    return [...set];
  }, [live]);

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

        {live && currencies.length > 1 && (
          <div className="-mt-8 mb-10 flex items-center justify-center gap-2">
            <span className="font-body text-white/40 text-xs">Prices in</span>
            <select
              value={live.currency}
              onChange={(e) => setLive({ ...live, currency: e.target.value })}
              className="rounded-full border border-white/15 bg-[#1A0808] px-3 py-1.5 font-body text-xs text-white outline-none focus:border-[#C30100]"
              aria-label="Currency"
            >
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              billing={billing}
              delay={i * 100}
              live={live}
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