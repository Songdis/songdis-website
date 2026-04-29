"use client";

import { useState } from "react";

interface QuickDropProps {
  onClose: () => void;
  onPay: (date: string) => void;
}

export default function QuickDropModal({ onClose, onPay }: QuickDropProps) {
  const [date, setDate] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[560px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <div className="text-center mb-6">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide">Quick Drop</h2>
          <p className="font-body text-white/50 text-sm mt-1">Fast-track your release</p>
        </div>

        {/* Info box */}
        <div className="border border-dashed border-[#C30100]/30 rounded-xl p-5 mb-5">
          <p className="font-body text-white text-sm font-semibold mb-3">Release within 7 days!</p>
          <p className="font-body text-white/50 text-xs mb-4">
            Skip the standard 7-14 day waiting period and get your music out faster
          </p>
          {[
            { label: "Priority Processing", desc: "Your release jumps the queue and gets reviewed first by our distribution team." },
            { label: "Expedited Distribution", desc: "Your music is pushed to 200+ platforms worldwide — Spotify, Apple Music, Tidal, Boomplay and more." },
            { label: "Time-Sensitive Releases", desc: "Ideal for album launches tied to events, tours, campaigns, or viral moments that can't wait." },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 mb-2">
              <svg className="text-[#C30100] shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="font-body text-white/60 text-xs">
                <span className="text-white font-medium">{item.label}</span> - {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Date picker */}
        <div className="mb-4">
          <label className="font-body text-white/70 text-xs block mb-1.5">
            Select Quick Drop Release Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
          />
          <p className="font-body text-white/30 text-xs mt-1">
            Choose a date within the next 1-6 days (this will be your new release date)
          </p>
        </div>

        {/* Fee */}
        <div className="bg-[#0E0808] rounded-xl p-4 mb-4">
          <p className="font-body text-white/40 text-xs mb-1">Quick Drop Fee</p>
          <p className="font-heading text-white text-3xl font-bold">₦9,999</p>
          <p className="font-body text-white/30 text-xs mt-1">
            One-time payment · Non-refundable once processed
          </p>
        </div>

        <p className="font-body text-white/30 text-xs text-center mb-6">
          After payment, you'll return to your upload to complete the release. Your chosen release date is locked in immediately. Standard release slots are not affected.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-4 hover:border-white/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onPay(date)}
            disabled={!date}
            className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Pay
          </button>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}