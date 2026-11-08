/**
 * lib/api/shout-out.ts — Shout Out: artists email the fans who pre-saved their music,
 * paid per email from a naira balance. All money is in kobo.
 */

import { request } from "./core";

export interface ShoutOutBroadcast {
  id: number;
  type: "broadcast" | "release_live";
  from_name: string;
  subject: string;
  music_upload_id: number | null;
  status: "awaiting_funds" | "queued" | "sending" | "sent" | "failed";
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  charged_kobo: number;
  refunded_kobo: number;
  sent_at: string | null;
  created_at: string;
}

export interface ShoutOutLedgerEntry {
  id: number;
  type: "topup" | "charge" | "refund" | "adjustment";
  amount_kobo: number;
  balance_after_kobo: number;
  description: string | null;
  created_at: string;
}

export interface ShoutOutOverview {
  balance_kobo: number;
  price_kobo: number;
  min_topup_kobo: number;
  fans: {
    total: number;
    unsubscribed: number;
    by_release: { id: number; title: string; artist: string; fans: number }[];
  };
  artists: { id: number; stage_name: string }[];
  broadcasts: ShoutOutBroadcast[];
  ledger: ShoutOutLedgerEntry[];
}

export interface ShoutOutQuote {
  recipients: number;
  price_kobo: number;
  cost_kobo: number;
  balance_kobo: number;
  shortfall_kobo: number;
}

export interface ShoutOutTopup {
  reference: string;
  status: "pending" | "paid" | "expired" | "failed";
  amount_requested_kobo: number;
  amount_received_kobo: number;
  account_number: string | null;
  bank_name: string | null;
  account_name: string | null;
  expires_at: string | null;
  paid_at: string | null;
  balance_kobo?: number;
}

const ROOT = "/shout-out";

export const getShoutOut = () => request<ShoutOutOverview>(ROOT, { method: "GET" }, true);

export const quoteShoutOut = (releaseId: number | null) =>
  request<ShoutOutQuote>(`${ROOT}/quote${releaseId ? `?music_upload_id=${releaseId}` : ""}`, { method: "GET" }, true);

export const sendShoutOut = (payload: {
  artist_profile_id: number;
  subject: string;
  body: string;
  link_url?: string;
  music_upload_id?: number | null;
}) => request<ShoutOutBroadcast>(`${ROOT}/broadcasts`, { method: "POST", body: JSON.stringify(payload) }, true);

export const createTopup = (amountNaira: number) =>
  request<ShoutOutTopup>(`${ROOT}/topups`, { method: "POST", body: JSON.stringify({ amount: amountNaira }) }, true);

export const getTopup = (reference: string) =>
  request<ShoutOutTopup>(`${ROOT}/topups/${encodeURIComponent(reference)}`, { method: "GET" }, true);

export function importFans(file: File, releaseId: number | null) {
  const form = new FormData();
  form.append("file", file);
  form.append("consent", "1");
  if (releaseId) form.append("music_upload_id", String(releaseId));
  return request<{ added: number; skipped: number; total: number }>(`${ROOT}/fans/import`, { method: "POST", body: form }, true);
}

export const naira = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: kobo % 100 ? 2 : 0, maximumFractionDigits: 2 });
