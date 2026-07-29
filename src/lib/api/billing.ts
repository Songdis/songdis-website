import { request } from "./core";

export type BillingTrack = "usd_card" | "local_transfer";
export type BillingInterval = "month" | "year";

export interface Entitlements {
  artist_limit: number;
  unlimited_releases: boolean;
  stream_links: boolean;
  lyrics_distribution: boolean;
  community_group: boolean;
  can_edit_label: boolean;
  videos: boolean;
  playlist_pitching: boolean;
  cover_licensing: boolean;
  lyrics_syncing: boolean;
  profile_verification: boolean;
  songwriter_royalties: boolean;
  visual_consultation: boolean;
  full_distribution: boolean;
  [key: string]: number | boolean;
}

export interface BillingPrice {
  id: number;
  interval: BillingInterval;
  track: BillingTrack;
  currency: string;
  amount: number;
  amount_display: string;
  amount_ngn: number;
  currency_options: Array<{ currency: string; amount: string }>;
  trial_days: number | null;
  features: string[];
  auto_renews: boolean;
  is_current: boolean;
  available: boolean;
  unavailable_reason: string | null;
  ready: boolean;
}

export interface BillingPlan {
  id: number;
  key: string;
  name: string;
  description: string | null;
  tier: number;
  is_popular: boolean;
  features: string[];
  entitlements: Entitlements;
  prices: BillingPrice[];
}

export interface BillingStatus {
  has_subscription: boolean;
  is_active: boolean;
  is_expired: boolean;
  is_trialing: boolean;
  status: "trialing" | "active" | "past_due" | "expired" | "cancelled" | "none";
  source: "bachs" | "promo" | "trial" | "manual" | "legacy" | null;
  track: BillingTrack | null;
  plan: {
    id: number;
    key: string;
    name: string;
    tier: number;
    description: string | null;
    entitlements: Entitlements;
  } | null;
  current_price_id: number | null;
  interval: BillingInterval | null;
  end_date: string | null;
  days_remaining: number | null;
  auto_renew: boolean;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  currency: string | null;
  amount: number | null;
  entitlements: Entitlements;
  renews_manually?: boolean;
  artists?: { used: number; limit: number; can_create: boolean };
}

export interface TrackOption {
  key: BillingTrack;
  label: string;
  description: string;
  auto_renews: boolean;
}

export interface PromoPreview {
  valid: boolean;
  message?: string;
  code?: string;
  discount_type?: "percent" | "fixed" | "free";
  discount_value?: number;
  discount_label?: string;
  applies_to?: "first_cycle" | "lifetime";
  grants_access?: boolean;
  plan_name?: string;
  duration_days?: number;
  currency?: string;
  original_amount?: number;
  discounted_amount?: number;
  saving?: number;
}

export interface CheckoutSession {
  checkout_id: string | null;
  checkout_url: string | null;
  reference: string;
  amount: number;
  original_amount: number;
  currency: string;
}


const BASE = "/v2/billing";


export async function getBillingPlans(track?: BillingTrack) {
  const qs = track ? `?track=${encodeURIComponent(track)}` : "";
  return request<{
    plans: BillingPlan[];
    tracks: TrackOption[];
    subscription: BillingStatus | null;
  }>(`${BASE}/plans${qs}`, { method: "GET" }, true);
}

export async function getBillingStatus() {
  return request<BillingStatus>(`${BASE}/me`, { method: "GET" }, true);
}

export async function createCheckout(payload: {
  price_id: number;
  promo_code?: string;
  billing_currency?: string;
}) {
  return request<CheckoutSession>(
    `${BASE}/checkout`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}


export async function previewPromo(code: string, priceId?: number) {
  return request<PromoPreview>(
    `${BASE}/promo/preview`,
    { method: "POST", body: JSON.stringify({ code, price_id: priceId }) },
    true
  );
}

export async function redeemPromo(code: string) {
  return request<BillingStatus>(
    `${BASE}/promo/redeem`,
    { method: "POST", body: JSON.stringify({ code }) },
    true
  );
}

export async function cancelBilling(reason?: string) {
  return request<BillingStatus>(
    `${BASE}/cancel`,
    { method: "POST", body: JSON.stringify({ reason }) },
    true
  );
}

export async function createPortalSession() {
  return request<{ portal_url: string | null }>(
    `${BASE}/portal`,
    { method: "POST" },
    true
  );
}


export async function resumeBilling() {
  return request<
    { requires_portal: boolean; portal_url?: string | null } & Partial<BillingStatus>
  >(`${BASE}/resume`, { method: "POST" }, true);
}


const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
  UGX: "USh",
  TZS: "TSh",
  XAF: "FCFA",
  XOF: "CFA",
  ZMW: "ZK",
  RWF: "FRw",
};


export function formatMoney(amount: number, currency: string): string {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  const whole = Number.isInteger(amount);
  const showDecimals = currency === "USD" || (!whole && amount < 1000);

  return (
    symbol +
    amount.toLocaleString(undefined, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    })
  );
}

export function intervalLabel(interval: BillingInterval): string {
  return interval === "year" ? "year" : "month";
}
