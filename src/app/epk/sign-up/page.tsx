"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { request, setToken } from "@/lib/api/core";
import { AuthShell, Field, FormError, GoogleButton, PENDING_NAME_KEY, SubmitButton } from "../_components/AuthShell";

type Registered = { token: string };

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const artist = params.get("name") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[]> | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields(null);

    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0] ?? "";
    const last = parts.slice(1).join(" ") || first;

    const res = await request<Registered>("/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: first,
        last_name: last,
        email: email.trim(),
        password,
        password_confirmation: password,
        signup_source: "getepk",
      }),
    });

    if (res.error || !res.data?.token) {
      setError(res.errors ? null : res.error ?? "We could not create your account.");
      setFields(res.errors ?? null);
      setBusy(false);
      return;
    }

    setToken(res.data.token);
    try {
      if (artist.trim()) sessionStorage.setItem(PENDING_NAME_KEY, artist.trim());
    } catch {}
    router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
  };

  const fieldError = (...keys: string[]) => {
    for (const k of keys) if (fields?.[k]?.[0]) return fields[k][0];
    return null;
  };

  return (
    <AuthShell
      title={artist ? `${artist}'s EPK,` : "Your EPK"}
      accent={artist ? "in a minute." : "in a minute."}
      subtitle={<>Free. No card. <Link href="/sign-in" className="font-bold underline underline-offset-4">Already on SongDis? Sign in</Link> with the same account.</>}
      footer={
        <>
          Have an account?{" "}
          <Link href="/sign-in" className="font-bold text-[#101010] underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your real name, not your artist name"
          error={fieldError("first_name", "last_name")}
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          error={fieldError("email")}
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          error={fieldError("password")}
          required
        />
        <SubmitButton busy={busy}>Continue</SubmitButton>
      </form>
      <GoogleButton />
      <p className="mt-6 text-[12.5px] leading-relaxed text-[#6B6B6B]">
        By signing up you agree to the SongDis{" "}
        <a href="https://songdis.com/terms" className="underline">terms</a> and{" "}
        <a href="https://songdis.com/privacy-policy" className="underline">privacy policy</a>. getepk is made by SongDis.
      </p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}
