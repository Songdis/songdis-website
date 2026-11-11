"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/api/auth";
import { AuthShell, Field, FormError, GoogleButton, SubmitButton } from "../_components/AuthShell";

export default function EpkSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await signIn({ email: email.trim(), password });
    if (res.error || !res.data?.token) {
      setError(res.error === "Invalid credentials" ? "That email and password don't match." : res.error);
      setBusy(false);
      return;
    }
    router.push("/app");
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="SongDis artists: same email, same password."
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          <span>
            New here?{" "}
            <Link href="/sign-up" className="font-medium text-black underline underline-offset-4">
              Make your EPK
            </Link>
          </span>
          <a href="https://songdis.com/forgot-password" className="underline underline-offset-4">
            Forgot password?
          </a>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <GoogleButton />
    </AuthShell>
  );
}
