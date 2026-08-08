"use client";

/**
 * The provider that carries the active artist profile and the shared filter
 * row. It wraps DashboardLayout so the switcher in the header and the
 * analytics-v2 pages in the body read the same scope.
 *
 * With the flag off `useAnalyticsV2State` never fetches, so mounting this
 * around every dashboard page costs one inert context and no network.
 */

import { AnalyticsV2Context, useAnalyticsV2State } from "@/lib/hooks/useAnalyticsV2";

export function AnalyticsV2Provider({ children }: { children: React.ReactNode }) {
  const value = useAnalyticsV2State();
  return <AnalyticsV2Context.Provider value={value}>{children}</AnalyticsV2Context.Provider>;
}
