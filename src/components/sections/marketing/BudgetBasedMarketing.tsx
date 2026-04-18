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
   RED PIN ICON
───────────────────────────────────────────────────────── */
const RedPin: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden="true"
  >
    <path
      d="M12 2C8.68629 2 6 4.68629 6 8C6 11.3137 9 14 12 17C15 14 18 11.3137 18 8C18 4.68629 15.3137 2 12 2Z"
      fill="#C30100"
    />
    <path
      d="M12 17V22"
      stroke="#C30100"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="8" r="2.5" fill="white" />
  </svg>
);

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const INCLUDED = [
  "Strategic campaign planning",
  "Budget allocation & optimization",
  "Campaign execution & management",
  "Performance analytics & reporting",
  "Strategy optimization",
];

const HOW_IT_WORKS = [
  "Set your marketing budget",
  "A commission on allocated budget",
  "Detailed budget utilization reports",
  "Regular performance & ROI reviews",
];

/* ─────────────────────────────────────────────────────────
   PILL TAB BUTTON
───────────────────────────────────────────────────────── */
const PillTab: React.FC<{
  label: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, active = true, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-full px-6 py-2.5 inline-flex items-center justify-center transition-all duration-300 focus-visible:outline-none"
    style={{
      backgroundColor: active ? "#6B1010" : "transparent",
      border: `1px solid ${active ? "#C30100" : "rgba(195,1,0,0.3)"}`,
      cursor: onClick ? "pointer" : "default",
    }}
  >
    <span className="font-heading text-white uppercase text-xs sm:text-sm tracking-widest whitespace-nowrap">
      {label}
    </span>
  </button>
);

/* ─────────────────────────────────────────────────────────
   BUDGET BASED MARKETING SECTION
───────────────────────────────────────────────────────── */
const BudgetBasedMarketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"included" | "how">("included");
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: cardRef, inView: cardInView } = useInView(0.1);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-16 sm:mb-20 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Budget-Based Marketing
          </h2>
          <p className="font-body text-white text-sm sm:text-base lg:text-lg leading-relaxed max-w-[720px] mx-auto">
            Our marketing services operate on a commission of your marketing
            budget, ensuring efficient and effective campaign management.
          </p>
        </div>

        {/* ── CARD WRAPPER ── */}
        <div
          ref={cardRef}
          className={[
            "relative transition-all duration-700",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
          style={{ paddingTop: "28px" }}
        >

          {/* ── PILL TABS ──
              Mobile: clickable tabs (state-driven)
              Desktop: static labels centered above each column
          ── */}

          {/* Mobile tabs — full width switcher */}
          <div className="lg:hidden flex gap-3 mb-0 absolute top-0 left-0 right-0 z-10 justify-center">
            <PillTab
              label="What's Included"
              active={activeTab === "included"}
              onClick={() => setActiveTab("included")}
            />
            <PillTab
              label="How It Works"
              active={activeTab === "how"}
              onClick={() => setActiveTab("how")}
            />
          </div>

          {/* Desktop tabs — two columns, each centered above its column */}
          <div className="hidden lg:grid grid-cols-2 absolute top-0 left-0 right-0 z-10">
            <div className="flex items-center justify-center">
              <PillTab label="What's Included" />
            </div>
            <div className="flex items-center justify-center">
              <PillTab label="How It Works" />
            </div>
          </div>

          {/* ── CARD ── */}
          <div
            className="rounded-2xl p-8 sm:p-10 lg:p-14"
            style={{
              backgroundColor: "#1A0808",
              border: "1px solid rgba(195,1,0,0.3)",
            }}
          >

            {/* ── DESKTOP — two columns side by side ── */}
            <div className="hidden lg:grid grid-cols-2 gap-10 lg:gap-16 pt-4">
              <ul className="flex flex-col gap-6">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-center gap-4">
                    <RedPin />
                    <span className="font-body text-white text-sm sm:text-base leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-6">
                {HOW_IT_WORKS.map((item) => (
                  <li key={item} className="flex items-center gap-4">
                    <RedPin />
                    <span className="font-body text-white text-sm sm:text-base leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── MOBILE — active tab content only ── */}
            <div className="lg:hidden pt-4">
              {activeTab === "included" ? (
                <ul className="flex flex-col gap-6">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <RedPin />
                      <span className="font-body text-white text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-6">
                  {HOW_IT_WORKS.map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <RedPin />
                      <span className="font-body text-white text-sm leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default BudgetBasedMarketing;