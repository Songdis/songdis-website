"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useBilling } from "@/lib/hooks/useBilling";
import type { Entitlements } from "@/lib/api/billing";

interface GateProps {
  feature: keyof Entitlements;
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
}


export default function Gate({
  feature,
  children,
  fallback,
  title,
  description,
}: GateProps) {
  const { isLoading, can, planName, isActive } = useBilling();

  if (isLoading) {
    return (
      <>
        {fallback ?? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C30100"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        )}
      </>
    );
  }

  if (can(feature)) {
    return <>{children}</>;
  }

  return (
    <UpgradePrompt
      title={title ?? "Upgrade to unlock this"}
      description={
        description ??
        (isActive && planName
          ? `This feature isn't included in your ${planName} plan.`
          : "An active subscription is required to use this feature.")
      }
    />
  );
}

export function UpgradePrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-10 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-[#C30100]/15 flex items-center justify-center mb-4">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C30100"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>

      <p className="font-nulshock text-white uppercase text-sm tracking-wide">
        {title}
      </p>
      <p className="font-montserrat text-white/40 text-xs mt-2 max-w-sm leading-relaxed">
        {description}
      </p>

      <Link
        href="/dashboard/settings?tab=subscription"
        className="mt-6 font-nulshock text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-6 py-3 transition-all"
      >
        View Plans
      </Link>
    </div>
  );
}
