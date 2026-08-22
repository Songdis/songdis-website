"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackSubscribe } from "@/lib/analytics/meta";

type Status = "loading" | "success" | "processing" | "error";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);
  // This page polls every 3s and can also be re-entered from the payment provider, so the
  // conversion is latched — Meta must not be told about the same subscription twice.
  const trackedRef = useRef(false);
  const MAX_ATTEMPTS = 20;

  const verifySubscription = useCallback(async () => {
    try {

      const { getBillingStatus } = await import("@/lib/api/billing");
      const res = await getBillingStatus();
      if (res.data && !res.error) {
        if (res.data.is_active) {
          // The moment the subscription is confirmed active by the API — not when the
          // provider redirected back, which happens before the payment has settled.
          if (!trackedRef.current) {
            trackedRef.current = true;
            trackSubscribe(res.data.plan?.name, res.data.interval);
          }

          setStatus("success");
          setMessage("Your subscription is now active!");
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => router.push("/dashboard/settings?tab=subscription"), 3000);
          return;
        }
      }
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setStatus("processing");
        setMessage("Payment is being verified. This may take a few minutes. You can safely close this page.");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
  }, [router]);

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const msg = searchParams.get("message");
    const ref = searchParams.get("ref");

    if (paymentStatus === "success") {
      setStatus("success");
      setMessage(msg ?? "Payment confirmed! Activating your subscription...");
      pollRef.current = setInterval(verifySubscription, 3000);
      verifySubscription();
    } else if (paymentStatus === "processing") {
      setStatus("processing");
      setMessage(msg ?? "Payment is being processed. Verifying...");
      pollRef.current = setInterval(verifySubscription, 3000);
    } else {
      setStatus("error");
      setMessage(msg ?? ref ? `Payment reference: ${ref}` : "Payment could not be verified. Please try again.");
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [searchParams, verifySubscription]);

  return (
    <div className="min-h-screen bg-[#0A0505] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
        <div className="flex justify-center mb-6">
          {status === "loading" && (
            <svg className="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          )}
          {status === "success" && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl" style={{ background: "radial-gradient(circle, rgba(195,1,0,0.35) 0%, rgba(195,1,0,0) 70%)" }} />
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="relative">
                <circle cx="32" cy="32" r="30" stroke="#C30100" strokeWidth="2" />
                <path d="M20 32L28 40L44 24" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {status === "processing" && (
            <svg className="animate-spin" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
          )}
          {status === "error" && (
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#C30100" strokeWidth="2" opacity="0.5" />
              <path d="M24 24L40 40M40 24L24 40" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h1 className="font-heading text-white uppercase text-xl tracking-wide mb-3">
          {status === "success" && "Payment Successful"}
          {status === "processing" && "Processing Payment"}
          {status === "error" && "Payment Issue"}
          {status === "loading" && "Verifying Payment..."}
        </h1>

        <p className="font-body text-white/60 text-sm mb-8">{message}</p>

        {status === "success" && (
          <p className="font-body text-white/30 text-xs mb-6">
            Redirecting to settings in a few seconds...
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/settings?tab=subscription"
            className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all text-center"
          >
            {status === "success" ? "Go to Settings" : "Back to Settings"}
          </Link>
          {status === "error" && (
            <Link
              href="/dashboard"
              className="w-full font-heading text-white/60 uppercase text-xs tracking-widest rounded-full border border-white/20 py-4 hover:border-white/40 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0505] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
            <svg className="animate-spin mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <p className="font-body text-white/40 text-sm mt-6">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
