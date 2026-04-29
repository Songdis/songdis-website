"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput, AuthButton, FormError } from "@/components/auth/AuthPrimitives";
import { useResetPassword } from "@/lib/hooks/useAuth";
import { SuccessModal } from "@/components/auth/SuccessModal";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const otp = params.get("otp") ?? "";

  const { mutate, isLoading, error } = useResetPassword();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: typeof fieldErrors = {};
    if (!newPassword) {
      errors.newPassword = "Password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    mutate(
      { email, otp, newPassword, confirmPassword },
      () => setShowSuccess(true)
    );
  };

  return (
    <>
      <AuthLayout heroImage="guitar">
        <p className="font-heading text-[#C30100] uppercase text-xs mb-3 text-center">
          Reset Password
        </p>

        <h1 className="font-heading text-white text-center uppercase text-xl sm:text-2xl leading-[36px] mb-8">
          Your New Password Must Be Different from Your Previously Used Password
        </h1>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormError message={error} />

          <PasswordInput
            label="New Password"
            placeholder="Enter password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, newPassword: undefined }));
            }}
            error={fieldErrors.newPassword}
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Enter password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, confirmPassword: undefined }));
            }}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="mt-2">
            <AuthButton type="submit" isLoading={isLoading}>
              Reset Password
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

      {/* Success modal — renders above the layout */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push("/sign-in");
        }}
        title="Password Changed Successfully!"
        description="Your password has been updated. You can now log in with your new credentials."
        ctaLabel="Back to Login"
        onCta={() => router.push("/sign-in")}
      />
    </>
  );
}

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);