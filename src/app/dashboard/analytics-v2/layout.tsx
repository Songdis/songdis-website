import { notFound } from "next/navigation";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";

/**
 * The feature gate for the whole v2 tree.
 *
 * With NEXT_PUBLIC_ANALYTICS_V2 unset or false this segment 404s, exactly as if
 * the route did not exist. `dashboard/analytics/*` and `lib/api/analytics.ts`
 * remain the live analytics either way — nothing here touches them.
 */
export default function AnalyticsV2Layout({ children }: { children: React.ReactNode }) {
  if (!ANALYTICS_V2_ENABLED) notFound();
  return <>{children}</>;
}
