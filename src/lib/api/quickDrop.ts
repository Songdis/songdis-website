import { request } from "./core";

const BASE = "/v2/quick-drop";

export interface QuickDropCredit {
  id: number;
  status: "pending" | "available" | "applied" | "refunded" | "expired";
  amount: number;
  currency: string;
  release_date: string;
  date_passed: boolean;
  draft_id: number | null;
  paid_at: string | null;
}


export interface QuickDropOptions {
  available: boolean;
  price_id: number | null;
  amount: number | null;
  currency: string | null;
  amount_ngn: number | null;
  min_date: string;
  max_date: string;
  timezone: string;
  today: string;
  credits: QuickDropCredit[];
}

export interface QuickDropCheckout {
  credit_id: number;
  checkout_id: string | null;
  checkout_url: string | null;
  reference: string;
  amount: number;
  currency: string;
  release_date: string;
}

export async function getQuickDropOptions() {
  return request<QuickDropOptions>(`${BASE}/options`, { method: "GET" }, true);
}


export async function createQuickDropCheckout(payload: {
  release_date: string;
  draft_id?: number;
}) {
  return request<QuickDropCheckout>(
    `${BASE}/checkout`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getQuickDropCredits() {
  return request<{ credits: QuickDropCredit[] }>(
    `${BASE}/credits`,
    { method: "GET" },
    true
  );
}

export async function applyQuickDropCredit(creditId: number, musicUploadId?: number) {
  return request<QuickDropCredit>(
    `${BASE}/credits/${creditId}/apply`,
    { method: "POST", body: JSON.stringify({ music_upload_id: musicUploadId }) },
    true
  );
}

export async function rescheduleQuickDropCredit(creditId: number, releaseDate: string) {
  return request<QuickDropCredit>(
    `${BASE}/credits/${creditId}/reschedule`,
    { method: "POST", body: JSON.stringify({ release_date: releaseDate }) },
    true
  );
}

export function formatQuickDropDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
