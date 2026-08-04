"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthInput, AuthButton, FormError } from "@/components/auth/AuthPrimitives";
import { useForgotPassword } from "@/lib/hooks/useAuth";

export default function ForgotPasswordPage() {
  const { mutate, isLoading, error } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();

  // The reset arrives as a link in the email, not a code typed here, so the
  // page ends on a confirmation rather than sending anyone onward. It used to
  // redirect to the OTP screen, which waited for a code that is never sent.
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    mutate({ email }, () => setSent(true));
  };

  if (sent) {
    return (
      <AuthLayout heroImage="guitar">
        <p className="font-heading text-[#C30100] uppercase text-xs tracking-[0.3em] mb-3">
          Check Your Email
        </p>

        <h1 className="font-heading text-white uppercase text-2xl sm:text-3xl leading-tight mb-6">
          We&apos;ve Sent a Reset Link
        </h1>

        <p className="font-body text-white/60 text-sm leading-relaxed mb-2">
          If an account exists for <span className="text-white">{email}</span>,
          a link to reset your password is on its way.
        </p>

        <p className="font-body text-white/40 text-xs leading-relaxed mb-8">
          The link works for 24 hours. If it does not arrive within a few
          minutes, check your spam folder.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setSent(false)}
            className="font-body text-[#C30100] text-sm hover:text-red-400 transition-colors self-start min-h-[44px] px-3 -ml-3"
          >
            Use a different email address
          </button>

          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-body text-white/60 text-sm hover:text-white transition-colors self-start min-h-[44px] px-3 -ml-3"
          >
            <ArrowLeftIcon />
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heroImage="guitar">
      <p className="font-heading text-[#C30100] uppercase text-xs tracking-[0.3em] mb-3">
        Forgot Password
      </p>

      <h1 className="font-heading text-white uppercase text-2xl sm:text-3xl leading-tight mb-8">
        Enter Your Email Address and We&apos;ll Send You a Link to Reset Your
        Password
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={error} />
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="you@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(undefined);
          }}
          error={emailError}
          autoComplete="email"
        />
        <div className="mt-2">
          <AuthButton type="submit" isLoading={isLoading}>
            Send Reset Link
          </AuthButton>
        </div>

        <div className="flex justify-center">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-body text-[#C30100] text-sm hover:text-red-400 transition-colors min-h-[44px] px-3"
          >
            <ArrowLeftIcon />
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);