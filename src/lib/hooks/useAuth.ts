import { useState, useCallback } from "react";
import * as authApi from "@/lib/api/auth";
import type { ApiResponse } from "@/lib/api/core";

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

export function useSignUp() {
  return useMutation<
    Parameters<typeof authApi.signUp>[0],
    authApi.AuthSuccessResponse
  >(authApi.signUp);
}

export function useSignIn() {
  return useMutation<authApi.LoginPayload, authApi.AuthSuccessResponse>(
    authApi.signIn
  );
}

export function useForgotPassword() {
  return useMutation<authApi.ForgotPasswordPayload, { message: string }>(
    authApi.forgotPassword
  );
}

export function useResetPassword() {
  return useMutation<
    Parameters<typeof authApi.resetPassword>[0],
    { message: string }
  >(authApi.resetPassword);
}

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

export function useChangePassword() {
  return useMutation<authApi.ChangePasswordPayload, { message: string }>(
    authApi.changePassword
  );
}

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