import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */
export type NotificationType = "release_status" | "split" | "withdrawal" | "request" | "subscription";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedNotifications {
  current_page: number;
  data: Notification[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/* ─── API functions ───────────────────────────────────────────── */

/** Get paginated notifications for the authenticated user */
export async function getNotifications(page = 1, perPage = 20) {
  return request<PaginatedNotifications>(
    `/notifications?page=${page}&per_page=${perPage}`,
    { method: "GET" },
    true
  );
}

/** Get unread notification count */
export async function getUnreadCount() {
  return request<{ count: number }>(
    "/notifications/unread-count",
    { method: "GET" },
    true
  );
}

/** Mark a single notification as read */
export async function markAsRead(id: number) {
  return request<Notification>(
    `/notifications/${id}/read`,
    { method: "PUT" },
    true
  );
}

/** Mark all notifications as read */
export async function markAllAsRead() {
  return request<unknown>(
    "/notifications/read-all",
    { method: "PUT" },
    true
  );
}
