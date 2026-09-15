"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";

/**
 * Route guard for the partner portal.
 *
 * This is convenience, not security. The real boundary is server-side — every
 * `/api/partner/*` endpoint is behind `ensure.partner`, and BlockPartnerOutsidePortal
 * keeps a partner token away from everything else. This only saves an artist who lands
 * here from staring at a screen of 403s, and sends a partner who lands on the artist
 * dashboard somewhere that will actually load.
 */
export default function PartnerSegmentLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    if (!user.partner_id) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !user.partner_id) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0E0808]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#C30100]" />
      </div>
    );
  }

  return <>{children}</>;
}
