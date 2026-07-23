import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */
export interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  artist_limit: number;
  royalty_share: number;
  is_popular: boolean;
}

export interface SubscriptionStatus {
  has_subscription: boolean;
  is_active: boolean;
  subscription_type: string | null;
  subscription: {
    id: number;
    status: string;
    end_date: string;
    amount_paid: number;
    currency: string;
    payment_provider: string;
  } | null;
  plan: {
    id: number;
    name: string;
    duration: string;
    is_contract_plan: boolean;
  } | null;
}

export interface ExpiredSubscription {
  has_expired_subscription: boolean;
  has_subscription: boolean;
  subscription?: {
    id: number;
    status: string;
    plan_name: string;
    end_date: string;
    is_expired: boolean;
  };
}

/* ─── API Functions ───────────────────────────────────────────── */

/** GET /api/plans?currency={currency} — fetch available plans */
export async function getPlans(currency = "NGN") {
  return request<{ plans: Plan[]; supported_currencies: string[] }>(
    `/plans?currency=${encodeURIComponent(currency)}`,
    { method: "GET" },
    true
  );
}

/** POST /api/subscribe — initiate payment, returns payment_url */
export async function subscribe(payload: {
  plan_id: number;
  billing_cycle: "monthly" | "annual";
  currency: string;
  payment_provider: string;
}) {
  return request<{ payment_url: string; subscription_link: string }>(
    "/subscribe",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** GET /api/subscription/check — check current subscription status */
export async function checkSubscription() {
  return request<SubscriptionStatus>(
    "/subscription/check",
    { method: "GET" },
    true
  );
}

/** GET /api/subscription/check-expired — check if subscription expired */
export async function checkExpiredSubscription() {
  return request<ExpiredSubscription>(
    "/subscription/check-expired",
    { method: "GET" },
    true
  );
}

/** GET /api/status — get user status (includes subscription data) */
export async function getUserStatus() {
  return request<Record<string, unknown>>(
    "/status",
    { method: "GET" },
    true
  );
}

/** POST /api/redeem-promo — redeem a promo code */
export async function redeemPromo(code: string) {
  return request<{ message: string }>(
    "/redeem-promo",
    { method: "POST", body: JSON.stringify({ code }) },
    true
  );
}
