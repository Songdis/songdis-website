import { request } from "./core";

/**
 * Must cover every type the API's Notification::createForUser() is called with.
 *
 * "edit_request" and "private_link_comment" were missing, and because the union was the only
 * thing telling TypeScript what could arrive, the icon switch in NotificationPanel looked
 * exhaustive and compiled clean while rendering nothing for either — an empty circle in the
 * panel. edit_request is the most frequently sent type in the backend, so that was most of
 * the blank ones. The string is widened so a type the UI does not know about is a value it
 * must still handle, rather than one the compiler pretends cannot exist.
 */
export type KnownNotificationType =
  | "release_status"
  | "split"
  | "withdrawal"
  | "request"
  | "subscription"
  | "edit_request"
  | "private_link_comment";

export type NotificationType = KnownNotificationType | (string & {});

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
