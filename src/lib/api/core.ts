export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL;

export const AYO_BASE_URL =
  process.env.NEXT_PUBLIC_AYO_URL;

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

/** Force logout: clear token + user cache, redirect to sign-in.
 *  Guarded to prevent multiple simultaneous redirects. */
let _redirecting = false;
export function forceLogout(): void {
  if (_redirecting) return;
  _redirecting = true;
  removeToken();
  try { sessionStorage.removeItem("songdis_user"); } catch {}
  // Short delay so any in-flight state updates don't fight the redirect
  setTimeout(() => { window.location.href = "/sign-in"; }, 50);
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  message: string | null;
  error: string | null;
  errors?: Record<string, string[]> | null;
  status: number;
}

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
      redirect: "manual", 
    });

    if (res.status === 204) {
      return { data: null, message: "Success", error: null, errors: null, status: 204 };
    }

    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
      return { data: null, message: "Success", error: null, errors: null, status: res.status };
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Token expired or invalid -- force logout on the client
      if (res.status === 401 && requiresAuth) {
        forceLogout();
        return { data: null, message: null, error: "Session expired", errors: null, status: 401 };
      }

      const errorMessage =
        json?.message ??
        json?.error ??
        Object.values(json?.errors ?? {})?.[0] ??
        "Something went wrong.";

      return {
        data: null,
        message: null,
        error: String(errorMessage),
        errors: json?.errors ?? null,
        status: res.status,
      };
    }

    return {
      data: json?.data ?? json,
      message: json?.message ?? null,
      error: null,
      errors: null,
      status: res.status,
    };
  } catch {
    return {
      data: null,
      message: null,
      error: "Network error. Please check your connection.",
      errors: null,
      status: 0,
    };
  }
}