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
   DATA
───────────────────────────────────────────────────────── */
const COLUMNS = ["Feature", "Songdis", "Distrokid", "Tunecore", "CD Baby"];

const ROWS = [
  {
    feature: "Built for African Artists",
    songdis: "Yes",
    distrokid: "No",
    tunecore: "No",
    cdbaby: "No",
  },
  {
    feature: "Local Currency Payments",
    songdis: "Yes",
    distrokid: "USD Only",
    tunecore: "USD Only",
    cdbaby: "USD Only",
  },
  {
    feature: "Music Stays Live If You Stop Paying",
    songdis: "Yes",
    distrokid: "No (unless extra fee paid)",
    tunecore: "No (renewal required)",
    cdbaby: "Yes",
  },
  {
    feature: "Artist Community Access",
    songdis: "Yes",
    distrokid: "No",
    tunecore: "No",
    cdbaby: "No",
  },
  {
    feature: "Marketing & Rollout Guidance",
    songdis: "Included",
    distrokid: "Not Included",
    tunecore: "Not Included",
    cdbaby: "Limited",
  },
  {
    feature: "Human Support",
    songdis: "Dedicated Support",
    distrokid: "Limited",
    tunecore: "Standard",
    cdbaby: "Standard",
  },
];

/* ─────────────────────────────────────────────────────────
   CELL VALUE — color coding
───────────────────────────────────────────────────────── */
const CellValue: React.FC<{ value: string; isSongdis?: boolean }> = ({
  value,
  isSongdis,
}) => {
  const isPositive =
    value === "Yes" ||
    value === "Included" ||
    value === "Dedicated Support";
  const isNegative =
    value === "No" ||
    value === "Not Included" ||
    value.startsWith("No (");

  return (
    <span
      className="font-body text-sm leading-relaxed text-center"
      style={{
        color: isSongdis
          ? "#ffffff"
          : isNegative
          ? "rgba(255,255,255,0.4)"
          : "rgba(255,255,255,0.75)",
      }}
    >
      {value}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   COMPARE DISTRIBUTORS SECTION
───────────────────────────────────────────────────────── */
const CompareDistributors: React.FC = () => {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: tableRef, inView: tableInView } = useInView(0.05);

  return (
    <section className="relative w-full bg-[#140C0C] py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-10 overflow-hidden">

      {/* ── Top red glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, rgba(195,1,0,0.6) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 max-w-[1280px] mx-auto">

        {/* ── HEADER ── */}
        <div
          ref={headRef}
          className={[
            "text-center mb-12 sm:mb-14 lg:mb-16 transition-all duration-700",
            headInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <h2 className="font-heading text-white uppercase text-3xl sm:text-4xl lg:text-5xl xl:text-[56px] leading-tight mb-5">
            Compare Music Distributors
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[640px] mx-auto">
            Find the plan that has everything you need to succeed in your
            music career.
          </p>
        </div>

        {/* ── TABLE — horizontally scrollable on mobile ── */}
        <div
          ref={tableRef}
          className={[
            "transition-all duration-700",
            tableInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
        >
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0">
            <div style={{ minWidth: "640px" }}>

              {/* ── COLUMN HEADERS ── */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {COLUMNS.map((col, i) => (
                  <div
                    key={col}
                    className="flex items-center justify-center rounded-full px-3 py-2.5"
                    style={{
                      border: "1px solid #C30100",
                      backgroundColor: i === 2 ? "rgba(195,1,0,0.15)" : "#1A0808",
                    }}
                  >
                    <span className="font-heading text-white uppercase text-xs sm:text-sm tracking-widest text-center">
                      {col}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── TABLE BODY ── */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#1A0808",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {ROWS.map((row, rowIdx) => (
                  <div
                    key={row.feature}
                    className="grid grid-cols-5"
                    style={{
                      borderBottom:
                        rowIdx < ROWS.length - 1
                          ? "1px solid rgba(255,255,255,0.06)"
                          : "none",
                    }}
                  >
                    {/* Feature name */}
                    <div className="flex items-center px-4 sm:px-6 py-6 border-r border-white/[0.06]">
                      <span className="font-body text-white/70 text-sm leading-relaxed">
                        {row.feature}
                      </span>
                    </div>

                    {/* Songdis */}
                    <div className="flex items-center justify-center px-3 py-6 border-r border-white/[0.06]">
                      <CellValue value={row.songdis} isSongdis />
                    </div>

                    {/* Distrokid */}
                    <div className="flex items-center justify-center px-3 py-6 border-r border-white/[0.06]">
                      <CellValue value={row.distrokid} />
                    </div>

                    {/* Tunecore */}
                    <div className="flex items-center justify-center px-3 py-6 border-r border-white/[0.06]">
                      <CellValue value={row.tunecore} />
                    </div>

                    {/* CD Baby */}
                    <div className="flex items-center justify-center px-3 py-6">
                      <CellValue value={row.cdbaby} />
                    </div>

                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CompareDistributors;