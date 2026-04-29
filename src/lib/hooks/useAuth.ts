"use client";

/**
 * lib/hooks/useAuth.ts
 * ─────────────────────────────────────────────────────────────────
 * Thin hook layer over the API functions.
 * Components call these hooks — they never import from lib/api/auth directly.
 * This keeps components clean and makes the API layer easy to mock in tests.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { forgotPassword, ForgotPasswordPayload, resendOtp, resetPassword, ResetPasswordPayload, signIn, SignInPayload, signInWithGoogle, signUp, SignUpPayload, verifyOtp, VerifyOtpPayload } from "../api/auth.mock";


/* ─── Shared hook shape ───────────────────────────────────────── */
interface MutationState {
  isLoading: boolean;
  error: string | null;
}

function useMutation<TPayload, TResult>(
  fn: (payload: TPayload) => Promise<{ data: TResult | null; error: string | null }>
) {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = async (
    payload: TPayload,
    onSuccess?: (data: TResult) => void,
    onError?: (error: string) => void
  ) => {
    setState({ isLoading: true, error: null });

    const { data, error } = await fn(payload);

    if (error || !data) {
      const msg = error ?? "An unexpected error occurred.";
      setState({ isLoading: false, error: msg });
      onError?.(msg);
      return;
    }

    setState({ isLoading: false, error: null });
    onSuccess?.(data);
  };

  const clearError = () => setState((s) => ({ ...s, error: null }));

  return { ...state, mutate, clearError };
}

/* ─── Exported hooks ──────────────────────────────────────────── */

export function useSignUp() {
  return useMutation<SignUpPayload, { user: unknown; tokens: unknown }>(signUp);
}

export function useSignIn() {
  return useMutation<SignInPayload, { user: unknown; tokens: unknown }>(signIn);
}

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const trigger = () => {
    setIsLoading(true);
    signInWithGoogle(); // redirects, so loading stays true
  };

  return { isLoading, trigger };
}

export function useForgotPassword() {
  return useMutation<ForgotPasswordPayload, { message: string }>(forgotPassword);
}

export function useVerifyOtp() {
  return useMutation<VerifyOtpPayload, { message: string }>(verifyOtp);
}

export function useResendOtp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trigger = async (email: string, onSuccess?: () => void) => {
    setIsLoading(true);
    setError(null);
    const { error: err } = await resendOtp(email);
    setIsLoading(false);
    if (err) { setError(err); return; }
    onSuccess?.();
  };

  return { isLoading, error, trigger };
}

export function useResetPassword() {
  return useMutation<ResetPasswordPayload, { message: string }>(resetPassword);
}