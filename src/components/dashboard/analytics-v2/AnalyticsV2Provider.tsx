"use client";


import { AnalyticsV2Context, useAnalyticsV2State } from "@/lib/hooks/useAnalyticsV2";

export function AnalyticsV2Provider({ children }: { children: React.ReactNode }) {
  const value = useAnalyticsV2State();
  return <AnalyticsV2Context.Provider value={value}>{children}</AnalyticsV2Context.Provider>;
}
