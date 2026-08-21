import { request } from "./core";


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


export interface SplitInvitation {
  recipient_name: string;
  email: string;
  percentage: number;
  status: "pending" | "accepted" | "declined";
  has_account: boolean;
  release: {
    track_title: string;
    primary_artist: string;
    album_art_url: string | null;
  };
  invited_by: { name: string };
  invited_at: string;
}

export interface AcceptInvitationResult {
  recipient: unknown;
  token: string | null;
  user: { id: number; email: string; first_name: string } | null;
}

export async function viewInvitation(token: string) {
  return request<SplitInvitation>(`/splits/invitations/${token}`, { method: "GET" }, true);
}

export async function acceptInvitation(
  token: string,
  password?: { password: string; password_confirmation: string }
) {
  return request<AcceptInvitationResult>(
    `/splits/invitations/${token}/accept`,
    { method: "POST", ...(password ? { body: JSON.stringify(password) } : {}) },
    true
  );
}

export async function declineInvitation(token: string) {
  return request<unknown>(`/splits/invitations/${token}/decline`, { method: "POST" }, true);
}
