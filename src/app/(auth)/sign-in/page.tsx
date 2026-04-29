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
import { useSignIn, useGoogleSignIn } from "@/lib/hooks/useAuth";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

export default function SignInPage() {
  const router = useRouter();
  const { mutate, isLoading, error } = useSignIn();
  const { isLoading: googleLoading, trigger: googleSignIn } = useGoogleSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    mutate({ email, password }, () => {
      router.push("/dashboard");
    });
  };

  return (
    <AuthLayout heroImage="guitar">
      <p className="font-heading text-[#C30100] uppercase text-xs text-center  mb-3">
        Welcome Back
      </p>

      <h1 className="font-heading text-white text-center uppercase text-xl sm:text-2xl leading-[36px] mb-8">
        Manage Your Music, Track Performance, and Get Guidance from Ayo, Your
        Built-in AI Assistant.
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
            setFieldErrors((fe) => ({ ...fe, email: undefined }));
          }}
          error={fieldErrors.email}
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, password: undefined }));
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="font-body text-[#C30100] text-xs hover:text-red-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="mt-2">
          <AuthButton type="submit" isLoading={isLoading}>
            Sign In
          </AuthButton>
        </div>

        <p className="font-body text-white/50 text-sm text-center">
          First time using Songdis?{" "}
          <Link
            href="/sign-up"
            className="text-[#C30100] hover:text-red-400 transition-colors"
          >
            Sign up
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