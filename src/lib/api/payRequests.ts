import { request } from "./core";

/** "Pay for me": what the artist asks for, and what the person paying sees. */
export interface PayView {
  code: string;
  status: "open" | "paid" | "expired" | "cancelled";
  artist: { name: string; image: string | null };
  item: string;
  perks: string[];
  amount: number;
  currency: string;
  amount_display: string;
  note: string | null;
  payer_name: string | null;
  expires_at: string;
  paid_at: string | null;
}

export type PayRequestInput =
  | { kind: "plan"; price_id: number; promo_code?: string; note?: string }
  | { kind: "quick_drop"; release_date: string; draft_id?: number; note?: string };

export async function createPayRequest(input: PayRequestInput) {
  return request<{ code: string; url: string; expires_at: string; view: PayView }>(
    "/v2/pay-requests",
    { method: "POST", body: JSON.stringify(input) },
    true
  );
}

export async function getPublicPay(code: string) {
  return request<PayView>(`/public/pay/${encodeURIComponent(code)}`, { method: "GET" }, false);
}

export async function startPublicPay(code: string, payer: { payer_name?: string; payer_message?: string }) {
  return request<{ checkout_url: string }>(
    `/public/pay/${encodeURIComponent(code)}/checkout`,
    { method: "POST", body: JSON.stringify(payer) },
    false
  );
}
