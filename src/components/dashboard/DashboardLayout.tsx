"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import UploadModal from "@/components/dashboard/upload/UploadModal";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  /** Override the default "Upload New Release" CTA in the topbar */
  customCta?: { label: string; onClick: () => void };
}

export default function DashboardLayout({ children, userName = "VJazzy", customCta }: DashboardLayoutProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0E0808] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
          <div>
            <h1 className="font-heading text-white uppercase text-2xl sm:text-3xl tracking-wide">
              Welcome Back, {userName}!
            </h1>
            <p className="font-body text-white/50 text-sm mt-1">Here's what's happening today.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Bell */}
            <button className="relative text-white/60 hover:text-white transition-colors focus-visible:outline-none">
              <BellIcon />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#C30100]" />
            </button>

            {/* Upload / custom CTA */}
            <button
              onClick={customCta ? customCta.onClick : () => setUploadOpen(true)}
              className="flex items-center gap-2 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#140C0C] hover:bg-[#C30100] px-5 py-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100]"
            >
              {!customCta && <span className="text-base leading-none">+</span>}
              {customCta ? customCta.label : "Upload New Release"}
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-8 pb-8">
          {children}
        </main>
      </div>

      {/* Upload flow modal */}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}