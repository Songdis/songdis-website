/**
 * lib/api/core.ts
 * Base request utility. All API files import from here.
 *
 * BASE_URL resolution order:
 *   NEXT_PUBLIC_API_URL  (set this in .env.local / Vercel)
 *   fallback → production URL from the collection
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://pssckrm3zr.eu-west-2.awsapprunner.com/api";

/* ─── Token helpers (localStorage) ───────────────────────────── */
const TOKEN_KEY = "songdis_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/* ─── Generic response shape ──────────────────────────────────── */
export interface ApiResponse<T = unknown> {
  data: T | null;
  message: string | null;
  error: string | null;
  status: number;
}

/* ─── Core fetch wrapper ──────────────────────────────────────── */
export async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      redirect: "manual", // never follow API redirects — we handle navigation ourselves
    });

    // Handle no-content responses (204 etc)
    if (res.status === 204) {
      return { data: null, message: "Success", error: null, status: 204 };
    }

    // Handle redirects — API tried to redirect us, treat as success
    // Our onSuccess callback handles navigation instead
    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
      return { data: null, message: "Success", error: null, status: res.status };
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        json?.message ??
        json?.error ??
        Object.values(json?.errors ?? {})?.[0] ??
        "Something went wrong.";

      return {
        data: null,
        message: null,
        error: String(errorMessage),
        status: res.status,
      };
    }

    return {
      data: json?.data ?? json,
      message: json?.message ?? null,
      error: null,
      status: res.status,
    };
  } catch {
    return {
      data: null,
      message: null,
      error: "Network error. Please check your connection.",
      status: 0,
    };
  }
}