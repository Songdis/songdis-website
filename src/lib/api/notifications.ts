import { request } from "./core";

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


export async function getNotifications(page = 1, perPage = 20) {
  return request<PaginatedNotifications>(
    `/notifications?page=${page}&per_page=${perPage}`,
    { method: "GET" },
    true
  );
}

export async function getUnreadCount() {
  return request<{ count: number }>(
    "/notifications/unread-count",
    { method: "GET" },
    true
  );
}

export async function markAsRead(id: number) {
  return request<Notification>(
    `/notifications/${id}/read`,
    { method: "PUT" },
    true
  );
}

export async function markAllAsRead() {
  return request<unknown>(
    "/notifications/read-all",
    { method: "PUT" },
    true
  );
}
