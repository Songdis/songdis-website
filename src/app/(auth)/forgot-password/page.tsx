"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { AuthInput, AuthButton, FormError } from "@/components/auth/AuthPrimitives";
import { useForgotPassword } from "@/lib/hooks/useAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { mutate, isLoading, error } = useForgotPassword();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();

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

    mutate({ email }, () => {
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(email)}&flow=reset`
      );
    });
  };

  return (
    <AuthLayout heroImage="guitar">
      <p className="font-heading text-[#C30100] uppercase text-xs tracking-[0.3em] mb-3 text-center">
        Forgot Password
      </p>

      <h1 className="font-heading text-white text-center uppercase text-xl sm:text-2xl leading-[36px] mb-8">
        Enter Your Email Address and We'll Send You a Code to Reset Your
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

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);