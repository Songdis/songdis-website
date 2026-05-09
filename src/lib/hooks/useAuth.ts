/**
 * lib/hooks/useAuth.ts
 * React hooks that wrap the real auth API.
 */

import { useState, useCallback } from "react";
import * as authApi from "@/lib/api/auth";
import type { ApiResponse } from "@/lib/api/core";

/* ─── Generic mutation hook factory ──────────────────────────── */
function useMutation<TPayload, TData>(
  fn: (payload: TPayload) => Promise<ApiResponse<TData>>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (payload: TPayload, onSuccess?: (data: TData | null) => void) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fn(payload);
        if (res.error) {
          setError(res.error);
        } else {
          onSuccess?.(res.data);
        }
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    },
    [fn]
  );

  return { mutate, isLoading, error };
}

/* ─── useSignUp ───────────────────────────────────────────────── */
export function useSignUp() {
  return useMutation<
    Parameters<typeof authApi.signUp>[0],
    authApi.AuthSuccessResponse
  >(authApi.signUp);
}

/* ─── useSignIn ───────────────────────────────────────────────── */
export function useSignIn() {
  return useMutation<authApi.LoginPayload, authApi.AuthSuccessResponse>(
    authApi.signIn
  );
}

/* ─── useForgotPassword ───────────────────────────────────────── */
export function useForgotPassword() {
  return useMutation<authApi.ForgotPasswordPayload, { message: string }>(
    authApi.forgotPassword
  );
}

/* ─── useResetPassword ────────────────────────────────────────── */
export function useResetPassword() {
  return useMutation<
    Parameters<typeof authApi.resetPassword>[0],
    { message: string }
  >(authApi.resetPassword);
}

/* ─── useVerifyOtp ────────────────────────────────────────────── */
/**
 * No standalone verify-otp endpoint exists in the collection yet.
 * For the reset flow the token is forwarded to reset-password.
 * For signup, verification appears to be automatic server-side.
 * TODO: confirm with backend team.
 */
export function useVerifyOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      _payload: { email: string; otp: string },
      onSuccess?: () => void
    ) => {
      setIsLoading(true);
      onSuccess?.();
      setIsLoading(false);
    },
    []
  );

  return { mutate, isLoading, error };
}

/* ─── useResendOtp ────────────────────────────────────────────── */
/**
 * TODO: confirm POST /resend-otp endpoint with backend team.
 */
export function useResendOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const trigger = useCallback(
    async (_email: string, onSuccess?: () => void) => {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      onSuccess?.();
      setIsLoading(false);
    },
    []
  );

  return { trigger, isLoading, error };
}

/* ─── useGoogleSignIn ─────────────────────────────────────────── */
/**
 * TODO: Backend team needs to provide the Google OAuth endpoint.
 * Expected: GET /auth/google → { url: string }
 * Then swap the stub below for the real redirect.
 */
export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    // Replace with: const res = await authApi.getGoogleAuthUrl();
    // if (res?.data?.url) window.location.href = res.data.url;
    console.warn("Google OAuth endpoint not yet configured.");
    setIsLoading(false);
  }, []);

  return { trigger, isLoading };
}

/* ─── useChangePassword ───────────────────────────────────────── */
export function useChangePassword() {
  return useMutation<authApi.ChangePasswordPayload, { message: string }>(
    authApi.changePassword
  );
}

/* ─── useLogout ───────────────────────────────────────────────── */
export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async (onDone?: () => void) => {
    setIsLoading(true);
    await authApi.logout();
    setIsLoading(false);
    onDone?.();
  }, []);

  return { logout, isLoading };
}

/* ─── useCurrentUser ──────────────────────────────────────────── */
export function useCurrentUser() {
  const [user, setUser] = useState<authApi.AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    const res = await authApi.getUser();
    if (res.error) {
      setError(res.error);
    } else {
      setUser(res.data);
    }
    setIsLoading(false);
  }, []);

  return { user, fetchUser, isLoading, error };
}