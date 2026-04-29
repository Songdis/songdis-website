const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ─── Shared response wrapper ─────────────────────────────────── */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        data: null,
        error: json?.message ?? json?.error ?? "Something went wrong.",
        status: res.status,
      };
    }

    return { data: json as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Network error. Please try again.", status: 0 };
  }
}

/* ─── Request / Response types ────────────────────────────────── */
export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthSuccessResponse {
  user: User;
  tokens: AuthTokens;
}

/* ─── Auth endpoints ──────────────────────────────────────────── */

export async function signUp(
  payload: SignUpPayload
): Promise<ApiResponse<AuthSuccessResponse>> {
  return request<AuthSuccessResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signIn(
  payload: SignInPayload
): Promise<ApiResponse<AuthSuccessResponse>> {
  const res = await request<AuthSuccessResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.data?.tokens.accessToken) {
    setToken(res.data.tokens.accessToken);
  }

  return res;
}

export async function signInWithGoogle(): Promise<void> {
  // Redirect-based OAuth — adjust to match your backend's OAuth initiation URL
  window.location.href = `${BASE_URL}/auth/google`;
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signOut(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
  removeToken();
}

/* ─── Token helpers (swap these for cookie-based auth) ────────── */

const TOKEN_KEY = "songdis_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}