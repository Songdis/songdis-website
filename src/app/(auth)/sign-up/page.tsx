"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  AuthInput,
  PasswordInput,
  AuthButton,
  FormError,
} from "@/components/auth/AuthPrimitives";
import { useSignUp, useGoogleSignIn } from "@/lib/hooks/useAuth";
import { trackSignUp } from "@/lib/analytics/meta";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

function validate(fields: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.fullName.trim()) errors.fullName = "Full name is required.";

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!fields.agreedToTerms) {
    errors.agreedToTerms =
      "You must accept the Distribution Agreement and Terms of Service to continue.";
  }

  return errors;
}

export default function SignUpPage() {
  const router = useRouter();
  const { mutate, isLoading, error } = useSignUp();
  const { isLoading: googleLoading, trigger: googleSignIn } = useGoogleSignIn();

  const [fields, setFields] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const toggleAgreedToTerms = () => {
    setAgreedToTerms((v) => !v);
    setFieldErrors((fe) => ({ ...fe, agreedToTerms: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate({ ...fields, agreedToTerms });
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    mutate(
      {
        fullName: fields.fullName,
        email: fields.email,
        password: fields.password,
        confirmPassword: fields.confirmPassword,
        referralCode: fields.referralCode || undefined,
      },
      () => {
        // Fired here, inside the success callback, so a failed sign-up never counts as a
        // conversion. trackSignUp cannot throw — see lib/analytics/meta.
        trackSignUp();

        router.push(
          `/verify-email?email=${encodeURIComponent(fields.email)}&flow=signup`
        );
      }
    );
  };

  return (
    <AuthLayout heroImage="singer">
      {/* Label */}
      <p className="font-heading text-[#C30100] uppercase text-xs tracking-[0.3em] mb-3">
        A Smarter Operating System
      </p>

      {/* Heading */}
      <h1 className="font-heading text-white uppercase text-2xl sm:text-3xl leading-tight mb-8">
        Distribute Your Music Globally, Track Earnings, and Create with Ayo AI.
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={error} />

        <AuthInput
          label="Full Name"
          type="text"
          placeholder="e.g John Doe"
          value={fields.fullName}
          onChange={set("fullName")}
          error={fieldErrors.fullName}
          autoComplete="name"
        />

        <AuthInput
          label="Email Address"
          type="email"
          placeholder="you@gmail.com"
          value={fields.email}
          onChange={set("email")}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <PasswordInput
          label="Password"
          placeholder="Enter password"
          value={fields.password}
          onChange={set("password")}
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Enter password"
          value={fields.confirmPassword}
          onChange={set("confirmPassword")}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <AuthInput
          label="Referral Code (Optional)"
          type="text"
          placeholder="e.g songdisrocks"
          value={fields.referralCode}
          onChange={set("referralCode")}
        />

        {/* Distribution Agreement consent */}
        <div className="mt-1">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={agreedToTerms}
              tabIndex={0}
              onClick={toggleAgreedToTerms}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleAgreedToTerms();
                }
              }}
              className={[
                "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                agreedToTerms
                  ? "border-[#C30100] bg-[#C30100]"
                  : fieldErrors.agreedToTerms
                    ? "border-red-500"
                    : "border-white/25 bg-[#1A0808] hover:border-white/40",
              ].join(" ")}
            >
              {agreedToTerms && <CheckIcon />}
            </div>
            <p className="font-body text-white/60 text-xs leading-relaxed">
              I have read and agree to the{" "}
              <a
                href="/agreements/songdis-distribution-agreement.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C30100] hover:text-red-400 underline underline-offset-2 transition-colors"
              >
                Songdis Distribution Agreement
              </a>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-[#C30100] hover:text-red-400 underline underline-offset-2 transition-colors"
              >
                Terms of Service
              </Link>
              . By creating an account, I confirm that I have read and understood the agreement, including content ownership, revenue sharing, and distribution policies.
            </p>
          </label>
          {fieldErrors.agreedToTerms && (
            <p className="font-body text-red-400 text-xs mt-2">
              {fieldErrors.agreedToTerms}
            </p>
          )}
        </div>

        <div className="mt-2">
          <AuthButton type="submit" isLoading={isLoading}>
            Sign Up
          </AuthButton>
        </div>

        <p className="font-body text-white/50 text-sm text-center">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[#C30100] hover:text-red-400 transition-colors inline-flex items-center min-h-[44px] px-2"
          >
            Sign in
          </Link>
        </p>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="font-body text-white/30 text-xs uppercase tracking-widest">
            Or continue with
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <AuthButton
          type="button"
          variant="outline"
          isLoading={googleLoading}
          onClick={googleSignIn}
        >
          <GoogleIcon />
          Continue with Google
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}