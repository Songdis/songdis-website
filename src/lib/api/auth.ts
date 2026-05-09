/**
 * lib/api/auth.ts
 * All authentication endpoints.
 *
 * Endpoint mapping (from Postman collection):
 *   POST /register
 *   POST /login
 *   POST /forgot-password
 *   POST /reset-password
 *   GET  /user
 *   PUT  /change-password
 *   POST /logout
 */

import { request, setToken, removeToken, getToken } from "./core";

/* ─── Request / Response types ────────────────────────────────── */

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AuthUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  account_type?: string;
  created_at?: string;
}

export interface AuthSuccessResponse {
  token: string;
  message?: string;
  user: AuthUser;
}

/* ─── Auth functions ──────────────────────────────────────────── */

/**
 * Register a new user.
 * The API uses first_name + last_name — split fullName here.
 */
export async function signUp(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}) {
  const [first_name, ...rest] = payload.fullName.trim().split(" ");
  const last_name = rest.join(" ") || first_name;

  return request<AuthSuccessResponse>("/register", {
    method: "POST",
    body: JSON.stringify({
      first_name,
      last_name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.confirmPassword,
      ...(payload.referralCode ? { referral_code: payload.referralCode } : {}),
    }),
  });
}

/**
 * Log in. Stores the token on success.
 */
export async function signIn(payload: LoginPayload) {
  const res = await request<AuthSuccessResponse>("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (res.data?.token) {
    setToken(res.data.token);
  }

  // Cache the user immediately from the login response
  // so useUser doesn't need a second GET /user request
  if (res.data?.user) {
    try {
      sessionStorage.setItem("songdis_user", JSON.stringify(res.data.user));
    } catch {}
  }

  return res;
}

/**
 * Send forgot-password email.
 */
export async function forgotPassword(payload: ForgotPasswordPayload) {
  return request<{ message: string }>("/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Reset password using the token from the email link.
 *
 * NOTE: The Songdis API uses a reset `token` sent via email link,
 * not a numeric OTP. The OTP UI we built maps to this token field.
 * Confirm the exact flow with the backend team — they may send
 * a 6-digit code or a long token string.
 */
export async function resetPassword(payload: {
  email: string;
  otp: string;        // maps to `token` in the API body
  newPassword: string;
  confirmPassword: string;
}) {
  return request<{ message: string }>("/reset-password", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      token: payload.otp,
      password: payload.newPassword,
      password_confirmation: payload.confirmPassword,
    }),
  });
}

/**
 * Get the current authenticated user's details.
 */
export async function getUser() {
  return request<AuthUser>("/user", { method: "GET" }, true);
}

/**
 * Change password (authenticated).
 */
export async function changePassword(payload: ChangePasswordPayload) {
  return request<{ message: string }>(
    "/change-password",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    true
  );
}

/**
 * Log out. Clears the local token regardless of server response.
 */
export async function logout() {
  const res = await request<{ message: string }>(
    "/logout",
    { method: "POST" },
    true
  );
  removeToken();
  return res;
}

/**
 * Check if the user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/* ─── Re-export token helpers ─────────────────────────────────── */
export { getToken, setToken, removeToken };