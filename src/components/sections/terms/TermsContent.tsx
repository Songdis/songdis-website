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
   SHARED COMPONENTS
───────────────────────────────────────────────────────── */
const BodyText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-body text-white text-sm leading-relaxed" style={{ textAlign: "justify" }}>
    {children}
  </p>
);

const SubPoint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-body text-white text-sm leading-relaxed" style={{ textAlign: "justify" }}>
    {children}
  </p>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="flex flex-col gap-1 pl-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2 font-body text-white text-sm leading-relaxed">
        <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
        <span style={{ textAlign: "justify" }}>{item}</span>
      </li>
    ))}
  </ul>
);

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
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   TERMS CONTENT SECTION
───────────────────────────────────────────────────────── */
const TermsContent: React.FC = () => {
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
            As Of December 24, 2024
          </h2>

          {/* ── INTRO ── */}
          <div className="flex flex-col gap-3">
            <BodyText>
              This Distribution Agreement and Terms of Service (this "Agreement") is a binding legal agreement between you and
              Songdis, a music distribution service operated by The Heavenly Wave Music ("Songdis," "we," "our," or "us"), regarding
              your use of our Songdis service to distribute your musical recordings to selected digital platforms and stores (our
              "Service"). If you are entering this Agreement on behalf of others, such as a group, label, or organization, you confirm
              that you are authorized to do so and bind all parties to this Agreement.
            </BodyText>
            <BodyText>
              By clicking to accept this Agreement, you confirm that you have read and agree to all terms outlined below. This
              Agreement becomes effective on the date of your acceptance ("Effective Date").
            </BodyText>
          </div>

          {/* ── CALLOUT BOX ── */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{ border: "1px solid #C30100", backgroundColor: "#1A0808" }}
          >
            <p className="font-heading text-white uppercase text-sm sm:text-base leading-relaxed tracking-wide">
              Songdis does not take any copyright or ownership of your music. We operate under a limited license to distribute your content.
            </p>
          </div>

          {/* ── REPEATED INTRO (as in design) ── */}
          <div className="flex flex-col gap-3">
            <BodyText>
              This Distribution Agreement and Terms of Service (this "Agreement") is a binding legal agreement between you and
              Songdis, a music distribution service operated by The Heavenly Wave Music ("Songdis," "we," "our," or "us"), regarding
              your use of our Songdis service to distribute your musical recordings to selected digital platforms and stores (our
              "Service"). If you are entering this Agreement on behalf of others, such as a group, label, or organization, you confirm
              that you are authorized to do so and bind all parties to this Agreement.
            </BodyText>
            <BodyText>
              By clicking to accept this Agreement, you confirm that you have read and agree to all terms outlined below. This
              Agreement becomes effective on the date of your acceptance ("Effective Date").
            </BodyText>
          </div>

          {/* ── 01 ── */}
          <PolicySection number="01" title="Songdis Service and Your Recordings">
            <SubPoint>a. The Songdis Service allows you to upload audio recordings and related content (collectively, "Recordings") for distribution to digital platforms and services such as Spotify, Apple Music, Boomplay, and other affiliated platforms ("Digital Stores"), enabling their customers ("Customers") to access and purchase your music.</SubPoint>
            <SubPoint>b. Recordings must be in single track, EP, or album configurations. Individual tracks within an album can only be removed by re-uploading the entire album minus the specific track.</SubPoint>
            <SubPoint>c. Accepted file formats include WAV, MP3, AIFF, and other common formats, subject to size and quality requirements. Songdis may convert files as needed to meet the specifications of Digital Stores.</SubPoint>
            <SubPoint>d. Upon uploading, you must provide accurate metadata, including artist name, album title, track titles, and other required details. You are responsible for indicating explicit content where applicable.</SubPoint>
            <SubPoint>e. Songdis will generate unique codes such as ISRCs and UPCs for your recordings unless otherwise provided by you.</SubPoint>
          </PolicySection>

          {/* ── 02 ── */}
          <PolicySection number="02" title="Digital Stores">
            <SubPoint>a. Songdis licenses your content to Digital Stores on a non-exclusive basis, meaning you may distribute your content through other services. However, duplicate submissions to the same store via multiple services may cause conflicts, for which Songdis is not responsible.</SubPoint>
            <SubPoint>b. Digital Stores set their pricing and other terms independently, and Songdis has no control over these policies. By opting into a Digital Store, you agree to their terms and conditions.</SubPoint>
            <SubPoint>c. Songdis distributes your content globally unless otherwise specified. Certain Digital Stores may choose to exclude your Recordings or specific territories based on their policies.</SubPoint>
            <SubPoint>d. If Songdis's agreements with a Digital Store expire or terminate, your content will no longer be available through that platform.</SubPoint>
          </PolicySection>

          {/* ── 03 ── */}
          <PolicySection number="03" title="Your Account">
            <SubPoint>a. When registering, you will create a user account with a username and password, which you must keep secure. You are fully responsible for any actions taken under your account, including financial transactions and content uploads.</SubPoint>
            <SubPoint>b. Your account type determines the level of service and benefits available, as outlined in the Songdis Plans document. Payment for your chosen plan will recur automatically unless canceled.</SubPoint>
            <SubPoint>c. Account upgrades or changes may be made at any time, subject to applicable fees or prorated adjustments.</SubPoint>
          </PolicySection>

          {/* ── 04 ── */}
          <PolicySection number="04" title="Terms and Terminations">
            <SubPoint>a. This Agreement begins on the Effective Date and continues for one (1) year unless terminated earlier. It will automatically renew for subsequent terms unless canceled before the renewal date.</SubPoint>
            <SubPoint>b. Songdis may terminate this Agreement if you breach its terms, fail to maintain valid payment information, or if your Recordings violate applicable laws or third-party rights.</SubPoint>
            <SubPoint>c. Upon termination, Songdis will notify Digital Stores to remove your Recordings. However, content already downloaded or purchased by Customers may remain accessible.</SubPoint>
          </PolicySection>

          {/* ── 05 ── */}
          <PolicySection number="05" title="Grant of Rights">
            <BodyText>By using the Service, you grant Songdis the following limited, non-exclusive rights:</BodyText>
            <SubPoint>a. To distribute, reproduce, and promote your Recordings across all selected Digital Stores.</SubPoint>
            <SubPoint>b. To use your name, likeness, and associated metadata for marketing, promotion, and operational purposes.</SubPoint>
            <SubPoint>c. To collect and process revenues generated from your Recordings and remit them to you according to this Agreement.</SubPoint>
            <SubPoint>d. To take necessary steps to format or adapt your Recordings for compliance with Digital Store requirements.</SubPoint>
          </PolicySection>

          {/* ── 06 ── */}
          <PolicySection number="06" title="Payment and Fees">
            <div className="flex flex-col gap-2">
              <BodyText>a. Royalty Distribution:</BodyText>
              <BulletList items={[
                "For artists on the Starter Plan and Growth Plan, Songdis will remit 100% of the revenue received from Digital Stores for your Recordings.",
                "For artists on the Professional Plan, Songdis will remit 90% of the revenue received from Digital Stores for your Recordings, with Songdis retaining 10% as a co-management and administrative fee.",
              ]} />
            </div>
            <SubPoint>b. Currency and Exchange Rates: Songdis collects revenue in U.S. Dollars (USD). Artists requesting payment in their local currency are responsible for all exchange rate conversions and associated fees. Conversion rates are determined by your chosen payment provider or bank, and Songdis holds no responsibility for discrepancies in exchange values.</SubPoint>
            <SubPoint>c. Taxes and Obligations: All payments are made gross of any applicable taxes. You are responsible for reporting and paying any applicable taxes in your jurisdiction, including but not limited to income taxes, VAT, and other regulatory fees. Songdis will not withhold or remit taxes on your behalf.</SubPoint>
            <SubPoint>d. Payment Processing Fees: Payment methods may involve additional processing fees, including bank fees, mobile money charges, or e-wallet deductions, which will be borne by you.</SubPoint>
          </PolicySection>

          {/* ── 07 ── */}
          <PolicySection number="07" title="Representation and Warranties">
            <BodyText>You represent and warrant that:</BodyText>
            <SubPoint>a. You own or have secured all necessary rights to distribute and license the content submitted to Songdis.</SubPoint>
            <SubPoint>b. Your content does not infringe on any copyright, trademark, or other rights of third parties.</SubPoint>
            <SubPoint>c. You will comply with all laws and third-party terms applicable to your use of the Service.</SubPoint>
          </PolicySection>

          {/* ── 08 ── */}
          <PolicySection number="08" title="Limitations of Liability">
            <SubPoint>a. Songdis provides its Service "as-is" and makes no guarantees regarding earnings, platform performance, or uninterrupted service.</SubPoint>
            <SubPoint>b. Songdis is not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of income or data.</SubPoint>
          </PolicySection>

          {/* ── 09 ── */}
          <PolicySection number="09" title="Miscellaneous">
            <SubPoint>a. This Agreement is governed by the laws of Nigeria. Any disputes will be resolved through arbitration in Lagos.</SubPoint>
            <SubPoint>b. Songdis reserves the right to modify or discontinue the Service at any time with prior notice.</SubPoint>
            <SubPoint>c. If any part of this Agreement is deemed invalid or unenforceable, the remaining provisions will remain in effect.</SubPoint>
          </PolicySection>

          {/* ── FOOTER LINE ── */}
          <p className="font-body text-white/40 text-xs text-center pt-4 border-t border-white/[0.06]">
            By using Songdis, you agree to these terms in full.
          </p>

        </div>
      </div>
    </section>
  );
};

export default TermsContent;