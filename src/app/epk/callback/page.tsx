"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api/core";
import { AuthShell } from "../_components/AuthShell";

/** Google sends getepk sign-ins back here (the backend's /auth/google/callback, state=getepk). */
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const failed = !params.get("token") || Boolean(params.get("error"));

  useEffect(() => {
    const token = params.get("token");
    if (!token || failed) {
      const t = setTimeout(() => router.replace("/sign-in"), 3000);
      return () => clearTimeout(t);
    }
    setToken(token);
    router.replace("/app");
  }, [params, router, failed]);

  return (
    <AuthShell
      title={failed ? "That didn't work." : "Signing you in…"}
      subtitle={failed ? "Google sign-in was cancelled or failed. Taking you back to try again." : undefined}
    >
      {null}
    </AuthShell>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
