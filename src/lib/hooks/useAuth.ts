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
export function useVerifyOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      payload: { email: string; otp: string },
      onSuccess?: () => void
    ) => {
      setIsLoading(true);
      setError(null);
      const res = await authApi.verifyOtp(payload);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
      setIsLoading(false);
    },
    []
  );

  return { mutate, isLoading, error };
}

/* ─── useResendOtp ────────────────────────────────────────────── */
export function useResendOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(
    async (email: string, onSuccess?: () => void) => {
      setIsLoading(true);
      setError(null);
      const res = await authApi.resendOtp(email);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess?.();
      }
      setIsLoading(false);
    },
    []
  );

  return { trigger, isLoading, error };
}

/* ─── useGoogleSignIn ─────────────────────────────────────────── */
export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await authApi.getGoogleAuthUrl();
    if (res.error) {
      setError(res.error);
      setIsLoading(false);
      return;
    }
    // Backend returns a redirect URL — navigate to it
    const url = res.data?.url ?? (res.data as unknown as string);
    if (url) {
      window.location.href = url;
    } else {
      setError("Google sign-in is not available right now.");
      setIsLoading(false);
    }
  }, []);

  return { trigger, isLoading, error };
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