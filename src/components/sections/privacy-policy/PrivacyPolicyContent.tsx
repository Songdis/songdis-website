"use client";

import React, { useEffect, useRef, useState } from "react";

function useInView(threshold = 0.05) {
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
   BULLET LIST
───────────────────────────────────────────────────────── */
const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="flex flex-col gap-1 mt-1">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2 font-body text-white text-sm leading-relaxed" style={{ textAlign: "justify" }}>
        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/* ─────────────────────────────────────────────────────────
   SECTION BLOCK
───────────────────────────────────────────────────────── */
const PolicySection: React.FC<{
  number: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <div className="flex flex-col gap-4 pt-8 border-t border-white/[0.06]">
    <div>
      <p className="font-heading text-sm mb-1" style={{ color: "#C30100" }}>{number}</p>
      <h3 className="font-heading uppercase text-xl sm:text-2xl tracking-wide" style={{ color: "#C30100" }}>
        {title}
      </h3>
    </div>
    <div className="flex flex-col gap-3">
      {children}
    </div>
  </div>
);

const BodyText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-body text-white text-sm leading-relaxed" style={{ textAlign: "justify" }}>
    {children}
  </p>
);

/* ─────────────────────────────────────────────────────────
   PRIVACY POLICY CONTENT
───────────────────────────────────────────────────────── */
const PrivacyPolicyContent: React.FC = () => {
  const { ref, inView } = useInView();

  return (
    <section className="relative w-full bg-[#140C0C] py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto">
        <div
          ref={ref}
          className={[
            "rounded-2xl p-8 sm:p-10 lg:p-14 flex flex-col gap-8 transition-all duration-700",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
          style={{
            backgroundColor: "#180F0F",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >

          {/* ── DATE ── */}
          <h2 className="font-heading uppercase text-lg sm:text-xl tracking-widest" style={{ color: "#C30100" }}>
            Last Updated: 26th - Feb - 2025
          </h2>

          {/* ── INTRO ── */}
          <BodyText>
            Welcome to Songdis. Your privacy is important to us, and we are committed to protecting your personal
            information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
          </BodyText>

          {/* ── 01 ── */}
          <PolicySection number="01" title="Information We Collect">
            <BodyText>When you use Songdis, we may collect the following information:</BodyText>
            <div>
              <BodyText>a) Personal Information</BodyText>
              <BulletList items={[
                "Name",
                "Email address",
                "Phone number",
                "Payment details",
                "Social media handles",
                "Banking information for royalty payments",
                "BVN (Bank Verification Number) where required by financial regulations",
                "Other information provided during registration",
              ]} />
            </div>
            <div>
              <BodyText>b) Music & Distribution Data</BodyText>
              <BulletList items={[
                "Music releases and metadata",
                "Genre classifications (including Afrobeats, Highlife, Amapiano, etc.)",
                "Streaming and download performance",
                "Performance metrics across African streaming platforms (Boomplay, Audiomack, etc.)",
                "Radio airplay data within Nigeria and broader African markets",
                "Royalty earnings and payment details",
                "Publishing rights information and splits",
              ]} />
            </div>
            <div>
              <BodyText>c) Technical & Usage Data</BodyText>
              <BulletList items={[
                "IP address",
                "Device and browser type",
                "Network provider information",
                "Pages visited and time spent on the platform",
                "Geographic data to optimize regional content delivery",
              ]} />
            </div>
          </PolicySection>

          {/* ── 02 ── */}
          <PolicySection number="02" title="How We Use Your Information">
            <BodyText>We use your data to:</BodyText>
            <BulletList items={[
              "Provide and improve our music distribution services",
              "Process payments and royalty payouts in local currency and international options",
              "Register your music with local collection societies (COSON, MCSN) and international PROs",
              "Communicate with you about your releases and updates",
              "Provide insights on regional streaming trends across African markets",
              "Connect you with local promotional opportunities",
              "Ensure security and prevent fraud",
              "Analyze and improve our platform's performance",
              "Comply with Nigerian and international music licensing regulations",
            ]} />
          </PolicySection>

          {/* ── 03 ── */}
          <PolicySection number="03" title="How We Share Your Information">
            <BodyText>We do not sell or rent your data. However, we may share information with:</BodyText>
            <BulletList items={[
              "Global Music Platforms (Spotify, Apple Music, YouTube Music, etc.) to distribute your music worldwide",
              "African-focused Platforms (Boomplay, Audiomack, Mdundo, UduX) for regional distribution",
              "Payment Providers including local Nigerian payment gateways and mobile money services to process transactions and royalty payments",
              "Performance Rights Organizations in Nigeria and other relevant territories",
              "Service Providers for website hosting, analytics, and customer support",
              "Legal Authorities if required by Nigerian or international law",
              "Industry Partners for promotional opportunities (with your consent)",
            ]} />
          </PolicySection>

          {/* ── 04 ── */}
          <PolicySection number="04" title="Data Security">
            <BodyText>
              We take reasonable steps to protect your personal information using industry-standard encryption and security
              practices. However, no system is completely secure, so we recommend using strong passwords and keeping your login details safe.
            </BodyText>
            <BodyText>
              Songdis complies with Nigerian Data Protection Regulation (NDPR) requirements and international data protection
              standards to ensure your information is handled responsibly.
            </BodyText>
          </PolicySection>

          {/* ── 05 ── */}
          <PolicySection number="05" title="Your Rights & Choices">
            <BodyText>You may have rights to:</BodyText>
            <BulletList items={[
              "Access, update, or delete your data",
              "Opt out of marketing communications",
              "Manage cookie preferences",
              "Request a copy of your royalty statements and distribution data",
              "Update your music metadata and rights information",
              "Control which platforms your music is distributed to",
            ]} />
          </PolicySection>

          {/* ── 06 ── */}
          <PolicySection number="06" title="Cookies & Tracking">
            <BodyText>
              We use cookies and similar technologies to enhance your experience and optimize our service for various network
              conditions common in Nigeria and across Africa. You can manage your cookie settings in your browser.
            </BodyText>
          </PolicySection>

          {/* ── 07 ── */}
          <PolicySection number="07" title="Regional Considerations">
            <BodyText>Songdis operates primarily in Nigeria but serves artists across Africa. Our data practices comply with:</BodyText>
            <BulletList items={[
              "Nigerian Data Protection Regulation (NDPR)",
              "Relevant music licensing and copyright laws in Nigeria and other African markets",
              "International copyright standards and agreements",
            ]} />
            <BodyText>
              We process payments in multiple currencies and through various channels appropriate for the African market, including mobile money services.
            </BodyText>
          </PolicySection>

          {/* ── 08 ── */}
          <PolicySection number="08" title="Changes To This Policy">
            <BodyText>
              We may update this Privacy Policy from time to time to reflect changes in our practices or regulatory requirements. Any
              changes will be posted here, and we will notify you if necessary.
            </BodyText>
          </PolicySection>

          {/* ── 09 ── */}
          <PolicySection number="09" title="Contact Us">
            <div className="flex flex-col gap-1">
              {[
                "Email: info@songdis.com",
                "Address: 11 Grace Betty Udokwe Street Lekki, Lagos Nigeria",
                "Phone: +234 (0) 915 533 5515",
                "WhatsApp Support: +234 (0) 915 533 5515",
              ].map((line) => (
                <p key={line} className="font-body text-white text-sm leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </PolicySection>

          {/* ── FOOTER LINE ── */}
          <p className="font-body text-white/40 text-xs text-center pt-4 border-t border-white/[0.06]">
            By using Songdis, you agree to this Privacy Policy. This document was last revised on February 26, 2025.
          </p>

        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicyContent;