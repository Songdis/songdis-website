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
   DATA
───────────────────────────────────────────────────────── */
const FAQS = [
  {
    number: "1",
    question: "How do royalty payments work?",
    answer:
      "Royalties are collected from all streaming platforms and paid directly to your Songdis wallet. Depending on your plan, you keep between 95% and 100% of your earnings. Payments are processed monthly and can be withdrawn to your local bank account in your preferred currency — including Nigerian Naira and other supported African currencies.",
  },
  {
    number: "2",
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time from your dashboard. When you upgrade, the new plan takes effect immediately and you'll be charged the prorated difference. If you downgrade, the change takes effect at the start of your next billing cycle.",
  },
  {
    number: "3",
    question: "What happens if I cancel my subscription?",
    answer:
      "If you cancel your subscription, your music will remain live on all streaming platforms. You will retain access to your account and your existing releases until the end of your current billing period. After that, you'll move to a limited free tier but your music stays up — we never take your music down.",
  },
  {
    number: "4",
    question: "How long does it take for my music to appear on streaming platforms?",
    answer:
      "Most releases go live within 3–7 business days after submission, depending on the platform. Spotify and Apple Music typically process releases within 3–5 business days. We recommend submitting at least 2 weeks before your planned release date to allow time for playlist pitching and editorial consideration.",
  },
  {
    number: "5",
    question: "Do you offer any discounts?",
    answer:
      "Yes! We offer discounts for annual subscriptions — you save significantly compared to paying monthly. We also run seasonal promotions and offer special pricing for student artists and music collectives. Follow our social channels or subscribe to our newsletter to stay updated on the latest offers.",
  },
  {
    number: "6",
    question: "What payment methods do you accept?",
    answer:
      "We accept bank transfers, debit and credit cards (Visa, Mastercard), and popular Nigerian payment methods including Paystack and Flutterwave. All transactions are processed securely and you'll receive a receipt for every payment made on your account.",
  },
];

/* ─────────────────────────────────────────────────────────
   FAQ ITEM
───────────────────────────────────────────────────────── */
const FAQItem: React.FC<{
  number: string;
  question: string;
  answer: string;
  delay?: number;
}> = ({ number, question, answer, delay = 0 }) => {
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Question row */}
      <div className="flex items-center gap-3 sm:gap-4 ">

        {/* Number circle */}
        <div
          className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center border-2 border-[#C30100]"
          style={{ backgroundColor: "transparent" }}
        >
          <span className="font-heading text-white text-sm">
            {number}
          </span>
        </div>

        {/* Question pill */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center text-left rounded-xl px-5 py-4 transition-colors duration-200 hover:bg-white/[0.04]"
          style={{
            backgroundColor: "#1E1212",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          aria-expanded={open}
        >
          <span className="font-body text-white/80 text-sm sm:text-base leading-relaxed">
            {question}
          </span>
        </button>

        {/* Toggle button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: "#1E1212",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <span
            className="text-white text-xl font-light leading-none transition-transform duration-300"
            style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            +
          </span>
        </button>

      </div>

      {/* Answer — expands below */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: open ? "300px" : "0px",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="ml-[56px] sm:ml-[60px] pr-14 pt-4 pb-2">
          <p className="font-body text-white/60 text-sm sm:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      </div>

    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   FAQ SECTION
───────────────────────────────────────────────────────── */
const FAQSection: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className=" flex flex-col gap-4 max-w-[860px] mx-auto">

        {/* ── HEADER — left aligned ── */}
        <div
          ref={headRef}
          className={[
            "mb-10 sm:mb-12 lg:mb-14 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-4 text-center">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed text-center">
            Everything you need to know about our pricing and plans.
          </p>
        </div>

        {/* ── FAQ LIST ── */}
        <div className="flex flex-col gap-9 max-w-[860px]">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={faq.number}
              {...faq}
              delay={i * 60}
            />
          ))}
        </div>

        {/* ── CONTACT SUPPORT ── */}
        <div className="flex flex-col items-center gap-4 mt-14 sm:mt-16">
          <p className="font-body text-white/40 text-sm">
            Still need help?
          </p>
          <div
            className="inline-block rounded-full p-[1.34px]"
            style={{
              background: "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
            }}
          >
            <Link
              href="/support"
              className="inline-flex items-center justify-center font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] px-8 py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
              style={{
                backdropFilter: "blur(4.45px)",
                WebkitBackdropFilter: "blur(4.45px)",
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQSection;