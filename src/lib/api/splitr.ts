/**
 * lib/api/splitr.ts
 *
 * Endpoint mapping (from Postman collection):
 *   POST /splits/create
 *   GET  /splits
 *   GET  /splits/{id}
 *   PUT  /splits/{id}
 *   DELETE /splits/{id}
 *   POST /splits/{id}/lock
 *   POST /splits/{id}/recipients
 *   PUT  /splits/{id}/recipients/{recipientId}
 *   DELETE /splits/{id}/recipients/{recipientId}
 *   POST /splits/{id}/recipients/{recipientId}/resend
 *   GET  /splits/my-earnings
 *   GET  /splits/my-earnings/{splitId}
 */

import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */

export interface SplitRecipient {
  id: number;
  email: string;
  full_name: string;
  percentage: number;
  notes?: string;
  status?: string;
  accepted_at?: string | null;
  [key: string]: unknown;
}

export interface Split {
  id: number;
  music_upload_id: number;
  split_name: string;
  notes?: string;
  status?: string;
  is_locked?: boolean;
  created_at: string;
  recipients: SplitRecipient[];
  music_upload?: {
    id: number;
    release_title?: string;
    track_title?: string;
    album_art_url?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CreateSplitPayload {
  music_upload_id: number;
  split_name: string;
  notes?: string;
  recipients: Array<{
    email: string;
    full_name: string;
    percentage: number;
    notes?: string;
  }>;
}

export interface UpdateSplitPayload {
  split_name?: string;
  notes?: string;
}

export interface AddRecipientPayload {
  email: string;
  full_name: string;
  percentage: number;
  notes?: string;
}

export interface SplitEarnings {
  split_id: number;
  split_name?: string;
  total_earnings?: number;
  your_earnings?: number;
  your_percentage?: number;
  [key: string]: unknown;
}

export interface SplitListParams {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}

/* ─── API functions ───────────────────────────────────────────── */

export async function createSplit(payload: CreateSplitPayload) {
  return request<Split>(
    "/splits/create",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getSplits(params: SplitListParams = {}) {
  const q = new URLSearchParams();
  if (params.page)     q.set("page",     String(params.page));
  if (params.per_page) q.set("per_page", String(params.per_page));
  if (params.status)   q.set("status",   params.status);
  if (params.search)   q.set("search",   params.search);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return request<Split[]>(`/splits${qs}`, { method: "GET" }, true);
}

export async function getSplit(id: number | string) {
  return request<Split>(`/splits/${id}`, { method: "GET" }, true);
}

export async function updateSplit(id: number | string, payload: UpdateSplitPayload) {
  return request<Split>(
    `/splits/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    true
  );
}

export async function deleteSplit(id: number | string) {
  return request<{ message: string }>(
    `/splits/${id}`,
    { method: "DELETE" },
    true
  );
}

export async function lockSplit(id: number | string) {
  return request<{ message: string }>(
    `/splits/${id}/lock`,
    { method: "POST" },
    true
  );
}

export async function addRecipient(splitId: number | string, payload: AddRecipientPayload) {
  return request<SplitRecipient>(
    `/splits/${splitId}/recipients`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function updateRecipient(
  splitId: number | string,
  recipientId: number | string,
  payload: Partial<AddRecipientPayload>
) {
  return request<SplitRecipient>(
    `/splits/${splitId}/recipients/${recipientId}`,
    { method: "PUT", body: JSON.stringify(payload) },
    true
  );
}

export async function removeRecipient(splitId: number | string, recipientId: number | string) {
  return request<{ message: string }>(
    `/splits/${splitId}/recipients/${recipientId}`,
    { method: "DELETE" },
    true
  );
}

export async function resendInvitation(splitId: number | string, recipientId: number | string) {
  return request<{ message: string }>(
    `/splits/${splitId}/recipients/${recipientId}/resend`,
    { method: "POST" },
    true
  );
}

export async function getMyEarnings() {
  return request<SplitEarnings[]>("/splits/my-earnings", { method: "GET" }, true);
}

export async function getSplitEarnings(splitId: number | string) {
  return request<SplitEarnings>(`/splits/my-earnings/${splitId}`, { method: "GET" }, true);
}