"use client";

import Link from "next/link";

interface SubscriptionBannerProps {
  isLocked: boolean;
  isExpired: boolean;
  hasSubscription: boolean;
  isTrialing: boolean;
  endDate: string | null;
  daysUntilExpiry: number | null;
  isContract?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SubscriptionBanner({
  isLocked,
  isExpired,
  hasSubscription,
  isTrialing,
  endDate,
  daysUntilExpiry,
  isContract = false,
}: SubscriptionBannerProps) {
  if (isContract) {
    if (!isLocked) {
      return null;
    }


    return (
      <div className="px-4 sm:px-6 lg:px-8 py-3 shrink-0 border-b bg-[#C30100]/15 border-[#C30100]/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#C30100]/20">
            <WarningIcon />
          </div>
          <div className="min-w-0">
            <p className="font-body text-white text-sm font-medium">
              Your contract with Songdis has ended
              {formatDate(endDate) ? ` on ${formatDate(endDate)}` : ""}
            </p>
            <p className="font-body text-white/50 text-xs mt-0.5">
              Your music stays live on the streaming platforms. Get in touch to
              renew your contract and restore your tools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    const dateStr = formatDate(endDate);

    const lapsed = isExpired || hasSubscription;

    return (
      <Banner
        tone="danger"
        icon={<WarningIcon />}
        title={
          lapsed
            ? `Your subscription has expired${dateStr ? ` on ${dateStr}` : ""}`
            : "Choose a plan to get started"
        }
        body={
          lapsed
            ? "Renew to continue distributing music, viewing analytics, and using all features."
            : "Distribution, analytics, and your artist tools unlock as soon as you subscribe."
        }
        cta={lapsed ? "Renew Now" : "View Plans"}
        ctaStyle="solid"
      />
    );
  }

  if (isTrialing && daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
    return (
      <Banner
        tone="warning"
        icon={<ClockIcon />}
        title={`Your free trial ends ${relativeDays(daysUntilExpiry)}`}
        body="Pick a plan to keep your releases live and your tools unlocked."
        cta="Choose Plan"
        ctaStyle="outline"
      />
    );
  }

  if (daysUntilExpiry !== null && daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
    const dateStr = formatDate(endDate);

    return (
      <Banner
        tone="warning"
        icon={<ClockIcon />}
        title={`Your subscription expires ${relativeDays(daysUntilExpiry)}${dateStr ? ` (${dateStr})` : ""}`}
        body="Renew now to avoid disruption to your releases and analytics."
        cta="Renew"
        ctaStyle="outline"
      />
    );
  }

  return null;
}

function relativeDays(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function Banner({
  tone,
  icon,
  title,
  body,
  cta,
  ctaStyle,
}: {
  tone: "danger" | "warning";
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  ctaStyle: "solid" | "outline";
}) {
  const danger = tone === "danger";

  return (
    <div
      className={[
        "px-4 sm:px-6 lg:px-8 py-3 shrink-0 border-b",
        danger
          ? "bg-[#C30100]/15 border-[#C30100]/30"
          : "bg-amber-500/10 border-amber-500/25",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              danger ? "bg-[#C30100]/20" : "bg-amber-500/15",
            ].join(" ")}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-body text-white text-sm font-medium">{title}</p>
            <p className="font-body text-white/50 text-xs mt-0.5">{body}</p>
          </div>
        </div>

        <Link
          href="/dashboard/settings?tab=subscription"
          className={[
            "shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-full px-4 py-2 transition-colors",
            ctaStyle === "solid"
              ? "bg-[#C30100] hover:bg-[#a80000]"
              : "border border-amber-500/50 hover:bg-amber-500/20",
          ].join(" ")}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
