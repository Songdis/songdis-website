"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api/core";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const errorParam = params.get("error");

    if (errorParam) {
      setError("Google sign-in was cancelled or failed. Please try again.");
      setTimeout(() => router.replace("/sign-in"), 3000);
      return;
    }

    if (!token) {
      setError("No token received. Redirecting to sign in...");
      setTimeout(() => router.replace("/sign-in"), 3000);
      return;
    }

    // Store the token exactly like a normal login
    setToken(token);

    // Redirect to dashboard — useUser will fetch the real user via GET /user
    router.replace("/dashboard");
  }, [params, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#140C0C] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border border-[#C30100]/50 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p className="font-body text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#140C0C] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-5">
          <svg className="animate-spin text-[#C30100]" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
        <p className="font-body text-white/60 text-sm">Signing you in with Google...</p>
        <p className="font-body text-white/30 text-xs mt-1">You'll be redirected to your dashboard shortly</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#140C0C] flex items-center justify-center">
        <svg className="animate-spin text-[#C30100]" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}