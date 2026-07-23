import { useState, useEffect, useCallback, useRef } from "react";
import { checkSubscription, checkExpiredSubscription, type SubscriptionStatus, type ExpiredSubscription } from "@/lib/api/subscription";

interface SubscriptionState {
  isLoading: boolean;
  subscription: SubscriptionStatus | null;
  expired: ExpiredSubscription | null;
  planName: string | null;
  isContractPlan: boolean;
  isActive: boolean;
  isExpired: boolean;
}

export function useSubscription(pollInterval = 40000) {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscription: null,
    expired: null,
    planName: null,
    isContractPlan: false,
    isActive: false,
    isExpired: false,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const [subRes, expRes] = await Promise.all([
        checkSubscription(),
        checkExpiredSubscription(),
      ]);

      let planName: string | null = null;
      let isActive = false;
      let isContractPlan = false;
      let subData: SubscriptionStatus | null = null;

      if (subRes.data && !subRes.error) {
        subData = subRes.data as unknown as SubscriptionStatus;
        isActive = subData.is_active;
        planName = subData.plan?.name ?? null;
        isContractPlan = subData.plan?.is_contract_plan ?? false;
      }

      let expiredData: ExpiredSubscription | null = null;
      if (expRes.data && !expRes.error) {
        expiredData = expRes.data as unknown as ExpiredSubscription;
      }

      setState({
        isLoading: false,
        subscription: subData,
        expired: expiredData,
        planName,
        isContractPlan,
        isActive,
        isExpired: expiredData?.has_expired_subscription ?? false,
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

  return { ...state, refresh: load };
}
