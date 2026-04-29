/**
 * lib/api/auth.mock.ts
 * ─────────────────────────────────────────────────────────────────
 * When NEXT_PUBLIC_USE_MOCK_AUTH=true  → returns fake data
 * When NEXT_PUBLIC_USE_MOCK_AUTH=false → calls real auth.ts functions
 *
 * Mock credentials:
 *   Email:    demo@songdis.com
 *   Password: password123
 *   OTP:      123456
 * ─────────────────────────────────────────────────────────────────
 */

import * as realAuth from "./auth";
import type {
  ApiResponse,
  AuthSuccessResponse,
  SignUpPayload,
  SignInPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
} from "./auth";

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

const delay = (ms = 900) => new Promise<void>((r) => setTimeout(r, ms));

const MOCK_USER = {
  id: "mock-user-001",
  fullName: "Demo Artist",
  email: "demo@songdis.com",
  isVerified: true,
  createdAt: new Date().toISOString(),
};

const MOCK_TOKENS = {
  accessToken: "mock-access-token-xyz",
  refreshToken: "mock-refresh-token-xyz",
};

/* ─── Token helpers ───────────────────────────────────────────── */
const TOKEN_KEY = "songdis_access_token";
export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
export const setToken = (t: string) =>
  typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, t);
export const removeToken = () =>
  typeof window !== "undefined" && localStorage.removeItem(TOKEN_KEY);

/* ─── Exports ─────────────────────────────────────────────────── */

export async function signUp(
  payload: SignUpPayload
): Promise<ApiResponse<AuthSuccessResponse>> {
  if (!IS_MOCK) return realAuth.signUp(payload);
  await delay();
  if (payload.email === "taken@songdis.com")
    return { data: null, error: "An account with this email already exists.", status: 409 };
  return {
    data: { user: { ...MOCK_USER, email: payload.email, fullName: payload.fullName }, tokens: MOCK_TOKENS },
    error: null,
    status: 201,
  };
}

export async function signIn(
  payload: SignInPayload
): Promise<ApiResponse<AuthSuccessResponse>> {
  if (!IS_MOCK) return realAuth.signIn(payload);
  await delay();
  if (payload.email !== "demo@songdis.com" || payload.password !== "password123")
    return { data: null, error: "Invalid email or password.", status: 401 };
  setToken(MOCK_TOKENS.accessToken);
  return { data: { user: MOCK_USER, tokens: MOCK_TOKENS }, error: null, status: 200 };
}

export async function signInWithGoogle(): Promise<void> {
  if (!IS_MOCK) return realAuth.signInWithGoogle();
  setToken(MOCK_TOKENS.accessToken);
  window.location.href = "/dashboard";
}

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ApiResponse<{ message: string }>> {
  if (!IS_MOCK) return realAuth.forgotPassword(payload);
  await delay();
  return { data: { message: "Reset code sent." }, error: null, status: 200 };
}

export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<ApiResponse<{ message: string }>> {
  if (!IS_MOCK) return realAuth.verifyOtp(payload);
  await delay();
  if (payload.otp !== "123456")
    return { data: null, error: "Invalid or expired code. Try 123456.", status: 400 };
  return { data: { message: "OTP verified." }, error: null, status: 200 };
}

export async function resendOtp(
  email: string
): Promise<ApiResponse<{ message: string }>> {
  if (!IS_MOCK) return realAuth.resendOtp(email);
  await delay(600);
  return { data: { message: "Code resent." }, error: null, status: 200 };
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ApiResponse<{ message: string }>> {
  if (!IS_MOCK) return realAuth.resetPassword(payload);
  await delay();
  return { data: { message: "Password reset successful." }, error: null, status: 200 };
}

export async function signOut(): Promise<void> {
  if (!IS_MOCK) return realAuth.signOut();
  removeToken();
}

export type {
  ApiResponse,
  AuthSuccessResponse,
  SignUpPayload,
  SignInPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
};