"use client";

import Link from "next/link";

interface SubscriptionBannerProps {
  isExpired: boolean;
  endDate: string | null;
  daysUntilExpiry: number | null;
}

export default function SubscriptionBanner({ isExpired, endDate, daysUntilExpiry }: SubscriptionBannerProps) {
  if (isExpired) {
    const dateStr = endDate
      ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";
    return (
      <div className="bg-[#C30100]/15 border-b border-[#C30100]/30 px-4 sm:px-6 lg:px-8 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#C30100]/20 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-body text-white text-sm font-medium">
                Your subscription has expired{dateStr ? ` on ${dateStr}` : ""}
              </p>
              <p className="font-body text-white/50 text-xs mt-0.5">
                Renew to continue distributing music, viewing analytics, and using all features.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80000] px-4 py-2 transition-colors"
          >
            Renew Now
          </Link>
        </div>
      </div>
    );
  }

  if (daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
    const dateStr = endDate
      ? new Date(endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "";
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 sm:px-6 lg:px-8 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-body text-white text-sm font-medium">
                Your subscription expires in {daysUntilExpiry === 0 ? "less than a day" : daysUntilExpiry === 1 ? "1 day" : `${daysUntilExpiry} days`}
                {dateStr ? ` (${dateStr})` : ""}
              </p>
              <p className="font-body text-white/50 text-xs mt-0.5">
                Renew now to avoid disruption to your releases and analytics.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-amber-500/50 hover:bg-amber-500/20 px-4 py-2 transition-colors"
          >
            Renew
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
