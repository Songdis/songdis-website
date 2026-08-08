/**
 * lib/api/billing-upgrade.ts — what an upgrade costs, before paying for it (DL6).
 *
 * Split from the main billing module because it exists for one reason: showing the
 * customer the arithmetic. An upgrade charges an amount that appears on no price list —
 * list price minus a credit for the unused part of the current term — and a confirmation
 * that fails to explain that number is a support ticket.
 */

import { request } from "./core";

export interface UpgradeCreditDetail {
  eligible: boolean;
  credit: number;
  days_remaining: number;
  term_days: number;
  daily_rate: number;
  currency: string | null;
  from_subscription_id: number | null;
  /** Why there is (or isn't) a credit: prorated_unused_term, nothing_paid, below_minimum_days… */
  reason: string;
}

export interface UpgradeQuote {
  plan: { key: string | null; name: string | null };
  interval: string;
  track: string;
  currency: string;
  list_amount: number;
  credit_applied: number;
  amount_due: number;
  is_upgrade: boolean;
  credit_detail: UpgradeCreditDetail | null;
  /** DL7 — Label is one-way. Shown before payment, never after. */
  one_way: boolean;
  one_way_notice: string;
}

export async function getUpgradeQuote(priceId: number) {
  return request<UpgradeQuote>(
    "/v2/billing/upgrade/quote",
    { method: "POST", body: JSON.stringify({ price_id: priceId }) },
    true
  );
}
