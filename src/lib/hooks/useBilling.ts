import { useState, useEffect, useCallback, useRef } from "react";
import {
  getBillingStatus,
  type BillingStatus,
  type Entitlements,
} from "@/lib/api/billing";


const NO_ENTITLEMENTS: Entitlements = {
  artist_limit: 0,
  unlimited_releases: false,
  stream_links: false,
  lyrics_distribution: false,
  community_group: false,
  can_edit_label: false,
  videos: false,
  playlist_pitching: false,
  cover_licensing: false,
  lyrics_syncing: false,
  profile_verification: false,
  songwriter_royalties: false,
  visual_consultation: false,
  full_distribution: false,
};

interface BillingState {
  isLoading: boolean;
  status: BillingStatus | null;
  planName: string | null;
  isActive: boolean;
  isExpired: boolean;
  hasSubscription: boolean;
  isTrialing: boolean;
  endDate: string | null;
  daysUntilExpiry: number | null;
  autoRenew: boolean;
  renewsManually: boolean;
  entitlements: Entitlements;
}

const INITIAL: BillingState = {
  isLoading: true,
  status: null,
  planName: null,
  isActive: false,
  isExpired: false,
  hasSubscription: false,
  isTrialing: false,
  endDate: null,
  daysUntilExpiry: null,
  autoRenew: false,
  renewsManually: false,
  entitlements: NO_ENTITLEMENTS,
};


export function useBilling(pollInterval = 0) {
  const [state, setState] = useState<BillingState>(INITIAL);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getBillingStatus();

      if (res.error || !res.data) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const s = res.data;

      setState({
        isLoading: false,
        status: s,
        planName: s.plan?.name ?? null,
        isActive: s.is_active,
        isExpired: s.is_expired,
        hasSubscription: s.has_subscription,
        isTrialing: s.is_trialing,
        endDate: s.end_date,
        daysUntilExpiry: s.days_remaining,
        autoRenew: s.auto_renew,
        renewsManually: s.renews_manually ?? !s.auto_renew,
        entitlements: { ...NO_ENTITLEMENTS, ...(s.entitlements ?? {}) },
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    load();

    if (pollInterval > 0) {
      timerRef.current = setInterval(load, pollInterval);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, pollInterval]);

  const can = useCallback(
    (feature: keyof Entitlements) => Boolean(state.entitlements[feature]),
    [state.entitlements]
  );

 
  const isLocked = !state.isLoading && !state.isActive;

  return { ...state, isLocked, can, refresh: load };
}
