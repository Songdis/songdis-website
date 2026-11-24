"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPublicSupportWidget } from "@/lib/api/support";
import { loadEusate } from "@/lib/support/eusate";

/**
 * The Eusate chat on the public site, for visitors and artists who are not signed in.
 * Not on the dashboard (it has its own, opened from the sidebar), artists' press kits,
 * getepk, or the pages collaborators and fans land on.
 */
const SKIP = ["/dashboard", "/k/", "/epk", "/listen", "/splitr", "/support", "/partner", "/pay"];

export default function PublicSupportChat() {
  const pathname = usePathname() ?? "/";
  const skip = SKIP.some((p) => pathname === p || pathname.startsWith(p));

  useEffect(() => {
    if (skip) return;
    let cancelled = false;
    getPublicSupportWidget().then((res) => {
      const d = res.data;
      if (cancelled || !d?.configured || d.provider !== "eusate" || !d.api_key || !d.sdk_url) return;
      void loadEusate({ provider: "eusate", configured: true, api_key: d.api_key, sdk_url: d.sdk_url, environment: d.environment });
    });
    return () => { cancelled = true; };
  }, [skip]);

  return null;
}
