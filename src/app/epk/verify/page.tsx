"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resendOtp, verifyOtp } from "@/lib/api/auth";
import { AuthShell, Field, FormError, SubmitButton } from "../_components/AuthShell";

function VerifyInner() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await verifyOtp({ email, otp: otp.trim() });
    if (res.error) {
      setError(res.error);
      setBusy(false);
      return;
    }
    router.push("/app");
  };

  const resend = async () => {
    setError(null);
    const res = await resendOtp(email);
    if (res.error) setError(res.error);
    else setWait(60);
  };

  return (
    <AuthShell
      title="Check your email."
      subtitle={
        <>
          We sent a 6-digit code to <span className="font-medium text-black">{email || "your email"}</span>. It
          comes from SongDis, who make getepk.
        </>
      }
      footer={
        <button
          type="button"
          onClick={() => void resend()}
          disabled={wait > 0}
          className="underline underline-offset-4 disabled:no-underline disabled:opacity-60"
        >
          {wait > 0 ? `Send another in ${wait}s` : "Send the code again"}
        </button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field
          label="Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <SubmitButton busy={busy}>Continue</SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
