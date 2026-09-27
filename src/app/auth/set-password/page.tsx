"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { PasswordInput, AuthButton, FormError } from "@/components/auth/AuthPrimitives";
import { useSetInvitedPassword } from "@/lib/hooks/useAuth";
import { SuccessModal } from "@/components/auth/SuccessModal";

/*
 * Where an invited artist lands from their invitation email.
 *
 * The path is /auth/set-password, not /set-password, because that is the URL the backend has
 * been putting in invitation emails all along (InvitationController::sendInvitationEmail).
 * The page simply did not exist, so every invitation link led to a 404 — the artist could
 * never set a password, and nothing was logged because no request was ever made. Links
 * already sitting in inboxes work against this route as-is; do not "tidy" the path.
 */
function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const token = params.get("token") ?? params.get("invitation_token") ?? "";

  const { mutate, isLoading, error } = useSetInvitedPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !token) {
      setFieldErrors({
        password:
          "This invitation link is incomplete. Ask Songdis to send it again — the link must be opened exactly as it arrived.",
      });
      return;
    }

    const errors: typeof fieldErrors = {};

    // The API enforces 8 characters on this endpoint; checked here too so the artist is not
    // made to wait for a round trip to learn it.
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    mutate({ email, token, password, confirmPassword }, () => setShowSuccess(true));
  };

  return (
    <>
      <AuthLayout heroImage="guitar">
        <p className="font-heading text-[#C30100] uppercase text-xs mb-3 text-center">
          Set Your Password
        </p>

        <h1 className="font-heading text-white text-center uppercase text-xl sm:text-2xl leading-[36px] mb-4">
          Welcome to Songdis
        </h1>

        <p className="font-body text-white/50 text-sm text-center mb-8">
          {email
            ? <>Choose a password for <span className="text-white">{email}</span> and your account is ready.</>
            : "Choose a password and your account is ready."}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FormError message={error} />

          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((fe) => ({ ...fe, password: undefined }));
            }}
            error={fieldErrors.password}
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
              Set Password
            </AuthButton>
          </div>

          <div className="flex justify-center">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 font-body text-[#C30100] text-sm hover:text-red-400 transition-colors min-h-[44px] px-3"
            >
              <ArrowLeftIcon />
              Already set it? Sign in
            </Link>
          </div>
        </form>
      </AuthLayout>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          router.push("/sign-in");
        }}
        title="You're all set!"
        description="Your password is saved and your account is active. Sign in to start uploading your music."
        ctaLabel="Go to Sign In"
        onCta={() => router.push("/sign-in")}
      />
    </>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
