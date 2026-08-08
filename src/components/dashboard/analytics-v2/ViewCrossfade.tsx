"use client";

/**
 * Wraps the dashboard content so a profile switch reads as one continuous
 * gesture: the outgoing view fades and lifts, the scope swaps underneath, and
 * the incoming view settles back in while its data loads.
 *
 * This is a class toggle on a stable element, not a keyed remount — the tree
 * below keeps its state and its DOM, so charts don't tear down and rebuild.
 * With the flag off it renders children with no wrapper behaviour at all.
 */

import { useAnalyticsV2Optional } from "@/lib/hooks/useAnalyticsV2";

export function ViewCrossfade({ children }: { children: React.ReactNode }) {
  const ctx = useAnalyticsV2Optional();

  if (!ctx?.enabled) return <>{children}</>;

  return <div className={ctx.isSwitching ? "av2-switching" : "av2-settled"}>{children}</div>;
}
