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
import { GoogleIcon } from "@/components/auth/GoogleIcon";

/* ─── Field-level validation ──────────────────────────────────── */
interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(fields: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
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

  return errors;
}

/* ─── Page ────────────────────────────────────────────────────── */
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

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    // Clear field error on change
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(fields);
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
        // On success — redirect to OTP verification with email in query
        router.push(
          `/auth/verify-email?email=${encodeURIComponent(fields.email)}&flow=signup`
        );
      }
    );
  };

  return (
    <AuthLayout heroImage="singer">
      {/* Label */}
      <p className="font-heading text-[#C30100] uppercase text-xs mb-3 text-center">
        A Smarter Operating System
      </p>

      {/* Heading */}
      <h1 className="font-heading text-white text-center uppercase text-xl sm:text-2xl leading-[36px] mb-8">
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
          placeholder="e.g hjdsgfhnd"
          value={fields.referralCode}
          onChange={set("referralCode")}
        />

        <div className="mt-2">
          <AuthButton type="submit" isLoading={isLoading}>
            Sign Up
          </AuthButton>
        </div>

        <p className="font-body text-white/50 text-sm text-center">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[#C30100] hover:text-red-400 transition-colors"
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