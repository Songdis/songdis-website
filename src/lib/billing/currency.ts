/**
 * Which currency to quote a plan in.
 *
 * The server already derives every price into every currency it can settle
 * (`PriceDerivationService::deriveCurrencyOptions`) and ships them as `currency_options`,
 * filtered to what the provider actually accepts. Nothing here converts anything — it
 * only decides which of those figures to show, so the number on screen is always one the
 * backend produced and can charge.
 */

import type { BillingPrice } from "@/lib/api/billing";

/**
 * IANA zone → currency, for the currencies the transfer track supports.
 *
 * Timezone rather than IP: it needs no request, no third party and no header that may or
 * may not survive the CDN. It is a guess — a VPN or a traveller reads wrong — which is
 * exactly why the UI keeps a visible picker rather than treating this as the answer.
 */
const ZONE_CURRENCY: Record<string, string> = {
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Kampala": "UGX",
  "Africa/Dar_es_Salaam": "TZS",
  "Africa/Nairobi": "KES",
  "Africa/Kigali": "RWF",
  "Africa/Lusaka": "ZMW",
  // XAF (Central African CFA)
  "Africa/Douala": "XAF",
  "Africa/Libreville": "XAF",
  "Africa/Bangui": "XAF",
  "Africa/Ndjamena": "XAF",
  "Africa/Malabo": "XAF",
  "Africa/Brazzaville": "XAF",
  // XOF (West African CFA)
  "Africa/Abidjan": "XOF",
  "Africa/Dakar": "XOF",
  "Africa/Bamako": "XOF",
  "Africa/Ouagadougou": "XOF",
  "Africa/Lome": "XOF",
  "Africa/Porto-Novo": "XOF",
  "Africa/Niamey": "XOF",
  "Africa/Bissau": "XOF",
};

/** Best guess at the viewer's currency, or null when we have no opinion. */
export function detectCurrency(): string | null {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return ZONE_CURRENCY[zone] ?? null;
  } catch {
    // Ancient or locked-down runtime. No guess is better than a wrong one.
    return null;
  }
}

/**
 * Every currency this price can be quoted in — its own first, then the derived options.
 *
 * The server has already dropped anything unchargeable, so whatever appears here is
 * something checkout can actually take.
 */
export function currenciesFor(price: BillingPrice): string[] {
  const seen = new Set<string>([price.currency]);
  for (const o of price.currency_options ?? []) {
    if (o?.currency) seen.add(o.currency.toUpperCase());
  }
  return [...seen];
}

/**
 * The figure to display, in `wanted` when that is offered and the price's own otherwise.
 *
 * Falls back rather than converting: an amount we invented client-side would not match
 * what the artist is charged, and a mismatch on a payment screen is worse than showing
 * the primary currency.
 */
export function priceIn(
  price: BillingPrice,
  wanted: string | null
): { amount: number; currency: string; converted: boolean } {
  if (!wanted || wanted.toUpperCase() === price.currency.toUpperCase()) {
    return { amount: price.amount, currency: price.currency, converted: false };
  }

  const match = (price.currency_options ?? []).find(
    (o) => o?.currency?.toUpperCase() === wanted.toUpperCase()
  );

  if (!match) {
    return { amount: price.amount, currency: price.currency, converted: false };
  }

  const amount = Number(match.amount);

  return Number.isFinite(amount)
    ? { amount, currency: match.currency.toUpperCase(), converted: true }
    : { amount: price.amount, currency: price.currency, converted: false };
}
