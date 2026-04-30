"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { OtpInput, AuthButton, FormError } from "@/components/auth/AuthPrimitives";
import { useVerifyOtp, useResendOtp } from "@/lib/hooks/useAuth";

const RESEND_COOLDOWN = 60;

/* ─── Inner component — safe to call useSearchParams here ──────── */
function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const flow = params.get("flow") ?? "signup";

  const { mutate: verify, isLoading, error } = useVerifyOtp();
  const { isLoading: resendLoading, error: resendError, trigger: resend } = useResendOtp();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string>();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setOtpError("Enter the full 6-digit code.");
      return;
    }
    setOtpError(undefined);
    verify({ email, otp }, () => {
      if (flow === "reset") {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
      } else {
        router.push("/sign-in?verified=true");
      }
    });
  };

  const handleResend = useCallback(() => {
    resend(email, () => setCooldown(RESEND_COOLDOWN));
  }, [email, resend]);

  return (
    <AuthLayout heroImage="guitar">
      <p className="font-heading text-[#C30100] uppercase text-xs tracking-[0.3em] mb-3">
        Verify Email
      </p>

      <h1 className="font-heading text-white uppercase text-2xl sm:text-3xl leading-tight mb-4">
        Enter Verification Code
      </h1>

      <p className="font-body text-white/60 text-sm leading-relaxed mb-8 max-w-xs">
        We've sent a 6-digit verification code to{" "}
        <span className="text-white">{email || "your email"}</span>. Can't find
        it? Please check your spam.
      </p>

      <form onSubmit={handleVerify} noValidate className="flex flex-col gap-6">
        <FormError message={error ?? resendError} />

        <OtpInput
          value={otp}
          onChange={(val) => {
            setOtp(val);
            setOtpError(undefined);
          }}
          error={otpError}
        />

        <AuthButton type="submit" isLoading={isLoading}>
          Verify
        </AuthButton>

        <p className="font-body text-white/50 text-sm text-center">
          Didn't receive a code?{" "}
          {cooldown > 0 ? (
            <span className="text-white/30">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-[#C30100] hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Resend code"}
            </button>
          )}
        </p>

        <div className="flex justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-body text-[#C30100] text-sm hover:text-red-400 transition-colors"
          >
            <ArrowLeftIcon />
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

/* ─── Page shell — wraps inner component in Suspense ──────────── */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);