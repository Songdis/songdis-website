/**
 * lib/api/shout-out.ts — Shout Out: artists email the fans who pre-saved their music,
 * paid per email from a naira balance. All money is in kobo.
 */

import { request } from "./core";

export interface ShoutOutBroadcast {
  id: number;
  type: "broadcast" | "release_live";
  channel?: "email" | "whatsapp";
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
  free_monthly: number;
  free_remaining: number;
  whatsapp_price_kobo: number;
  whatsapp: {
    /** The release-day message goes out automatically. */
    release_day: boolean;
    /** Templates the artist can send now. */
    templates: ShoutOutWhatsAppTemplate[];
  };
  button_labels: string[];
  min_topup_kobo: number;
  fans: {
    total: number;
    unsubscribed: number;
    by_release: { id: number; title: string; artist: string; fans: number; whatsapp_fans: number }[];
  };
  artists: { id: number; stage_name: string }[];
  broadcasts: ShoutOutBroadcast[];
  ledger: ShoutOutLedgerEntry[];
}

export interface ShoutOutWhatsAppTemplate {
  key: "countdown" | "update";
  label: string;
  needs: "date" | "link";
  /** The approved wording, with {{1}} name, {{2}} title, {{3}} artist, {{4}} date or link. */
  text: string;
}

export interface ShoutOutQuote {
  recipients: number;
  price_kobo: number;
  free_applied: number;
  free_remaining: number;
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

export const quoteShoutOut = (releaseId: number | null, channel: "email" | "whatsapp" = "email") => {
  const q = new URLSearchParams({ channel });
  if (releaseId) q.set("music_upload_id", String(releaseId));
  return request<ShoutOutQuote>(`${ROOT}/quote?${q}`, { method: "GET" }, true);
};

export const sendWhatsAppShoutOut = (payload: {
  artist_profile_id: number;
  kind: ShoutOutWhatsAppTemplate["key"];
  music_upload_id: number;
  date?: string;
  link_url?: string;
}) => request<ShoutOutBroadcast>(`${ROOT}/whatsapp`, { method: "POST", body: JSON.stringify(payload) }, true);

/** A template's wording filled in, as the fan reads it. */
export function renderWhatsApp(text: string, vars: [string, string, string, string]) {
  return text.replace(/\{\{(\d)\}\}/g, (_, n) => vars[Number(n) - 1] ?? "");
}

/** "2026-11-14" → "Saturday, 14 November", the way the server words it. */
export function wordDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("en-GB", { weekday: "long" })}, ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "long" })}`;
}

export const sendShoutOut = (payload: {
  artist_profile_id: number;
  subject: string;
  body: string;
  link_url?: string;
  button_label?: string;
  music_upload_id?: number | null;
}) => request<ShoutOutBroadcast>(`${ROOT}/broadcasts`, { method: "POST", body: JSON.stringify(payload) }, true);

export const previewShoutOut = (payload: {
  artist_profile_id: number;
  subject: string;
  body: string;
  link_url?: string;
  button_label?: string;
}) =>
  request<{ from: string; reply_to: string; subject: string; html: string }>(
    `${ROOT}/preview`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );

export const createTopup = (amountNaira: number) =>
  request<ShoutOutTopup>(`${ROOT}/topups`, { method: "POST", body: JSON.stringify({ amount: amountNaira }) }, true);

export const getTopup = (reference: string) =>
  request<ShoutOutTopup>(`${ROOT}/topups/${encodeURIComponent(reference)}`, { method: "GET" }, true);

export function importFans(file: File, releaseId: number | null) {
  const form = new FormData();
  form.append("file", file);
  form.append("consent", "1");
  if (releaseId) form.append("music_upload_id", String(releaseId));
  return request<{
    added: number;
    already_added: number;
    missing_email: number;
    missing_whatsapp: number;
    skipped: number;
    total: number;
  }>(`${ROOT}/fans/import`, { method: "POST", body: form }, true);
}

export const naira = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: kobo % 100 ? 2 : 0, maximumFractionDigits: 2 });

/** The fan list template: the columns the importer expects, with one example row. */
export function downloadFansTemplate() {
  const csv = "email,name,whatsapp\nada@example.com,Ada Obi,+2348012345678\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "shout-out-fans-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
