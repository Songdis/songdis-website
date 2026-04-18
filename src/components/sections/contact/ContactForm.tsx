"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

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
   CONTACT FORM SECTION
───────────────────────────────────────────────────────── */
const ContactForm: React.FC = () => {
  const { ref: cardRef, inView: cardInView } = useInView(0.1);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // TODO: wire up form submission
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setForm({ name: "", email: "", message: "" });
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    backgroundColor: "#2A0E0E",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "16px 20px",
    color: "#ffffff",
    fontSize: "14px",
    fontFamily: "var(--font-montserrat), sans-serif",
    outline: "none",
  };

  return (
    <section className="relative w-full bg-[#140C0C] py-10 sm:py-12 lg:py-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1280px] mx-auto">

        {/* ── CARD ── */}
        <div
          ref={cardRef}
          className={[
            "rounded-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]",
            "transition-all duration-700",
            cardInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
          ].join(" ")}
          style={{
            backgroundColor: "#1A0808",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >

          {/* Left — form */}
          <div className="flex flex-col p-8 sm:p-10 lg:p-14 lg:w-[48%] shrink-0">

            <h2 className="font-heading text-white uppercase text-2xl sm:text-3xl lg:text-4xl tracking-wide mb-10">
              Leave A Message
            </h2>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 flex-1"
            >
              {/* Name */}
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                required
                style={inputBase}
                className="placeholder:text-white/30 focus:border-[#C30100] transition-colors duration-200"
              />

              {/* Email */}
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                required
                style={inputBase}
                className="placeholder:text-white/30 focus:border-[#C30100] transition-colors duration-200"
              />

              {/* Message */}
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your Message"
                required
                rows={6}
                style={{ ...inputBase, borderRadius: "16px", resize: "none" }}
                className="placeholder:text-white/30 focus:border-[#C30100] transition-colors duration-200 flex-1"
              />

              {/* SEND A MESSAGE button */}
              <div
                className="rounded-full p-[1.34px] mt-2"
                style={{
                  background:
                    "linear-gradient(86.92deg, #C30100 11.12%, rgba(255,255,255,0.2) 81.99%)",
                }}
              >
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full font-heading text-white uppercase tracking-widest text-xs rounded-full bg-[#140C0C] py-4 transition-all duration-300 hover:bg-white hover:text-[#140C0C] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{
                    backdropFilter: "blur(4.45px)",
                    WebkitBackdropFilter: "blur(4.45px)",
                  }}
                >
                  {sending ? "Sending..." : "Send A Message"}
                </button>
              </div>
            </form>

          </div>

          {/* Right — image flush to card edges */}
          <div className="relative flex-1 min-h-[320px] lg:min-h-0 overflow-hidden">
            <Image
              src="/images/contact-form.svg"
              alt="Songdis artists"
              fill
              className="object-cover object-center"
              loading="lazy"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactForm;