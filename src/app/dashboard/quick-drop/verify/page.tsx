"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BASE_URL, getToken } from "@/lib/api/core";

type Status = "loading" | "success" | "pending" | "error";

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

function QuickDropVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [paymentData, setPaymentData] = useState<Record<string, unknown> | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  const verifyPayment = useCallback(async (reference: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/quick-drop/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json();

      if (json.success) {
        setStatus("success");
        setPaymentData(json.data?.quick_drop_payment ?? null);
        return;
      }

      if (attemptsRef.current < MAX_RETRIES) {
        setStatus("pending");
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        retryRef.current = setTimeout(() => verifyPayment(reference), RETRY_DELAY);
      } else {
        setStatus("error");
        setMessage(json.message || "Payment is still processing. Please check again shortly.");
      }
    } catch {
      if (attemptsRef.current < MAX_RETRIES) {
        setStatus("pending");
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        retryRef.current = setTimeout(() => verifyPayment(reference), RETRY_DELAY);
      } else {
        setStatus("error");
        setMessage("Failed to verify payment. Please try again.");
      }
    }
  }, []);

  useEffect(() => {
    const ref = searchParams.get("reference") || searchParams.get("ref");
    if (!ref) {
      setStatus("error");
      setMessage("Payment reference not found.");
      return;
    }
    attemptsRef.current = 0;
    verifyPayment(ref);
    return () => { if (retryRef.current) clearTimeout(retryRef.current); };
  }, [searchParams, verifyPayment]);

  const continueToUpload = () => {
    // Restore upload context from localStorage if available
    const raw = localStorage.getItem("resume_upload");
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.resumeUpload) {
          router.push("/dashboard?resume=true");
          return;
        }
      } catch { /* ignore */ }
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0A0505] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
        {/* Loading / Verifying */}
        {status === "loading" && (
          <>
            <svg className="animate-spin mx-auto mb-6" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Verifying Payment</h2>
            <p className="font-body text-white/60 text-sm">Please wait while we confirm your Quick Drop payment...</p>
          </>
        )}

        {/* Pending / Retrying */}
        {status === "pending" && (
          <>
            <svg className="animate-spin mx-auto mb-6" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Processing Payment</h2>
            <p className="font-body text-white/60 text-sm mb-3">Payment detected. Waiting for confirmation...</p>
            <p className="font-body text-white/30 text-xs">Attempt {attempts} of {MAX_RETRIES}</p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full blur-xl" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0) 70%)" }} />
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="relative">
                <circle cx="32" cy="32" r="30" stroke="#22c55e" strokeWidth="2" />
                <path d="M20 32L28 40L44 24" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Quick Drop Activated!</h2>
            <p className="font-body text-white/60 text-sm mb-6">Your payment has been confirmed. Continue your upload to complete the release.</p>
            <div className="flex flex-col gap-3">
              <button onClick={continueToUpload} className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all">
                Continue Upload
              </button>
              <button onClick={() => router.push("/dashboard")} className="w-full font-heading text-white/60 uppercase text-xs tracking-widest rounded-full border border-white/20 py-4 hover:border-white/40 transition-colors">
                Go to Dashboard
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
              <circle cx="32" cy="32" r="30" stroke="#C30100" strokeWidth="2" opacity="0.5" />
              <path d="M24 24L40 40M40 24L24 40" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Verification Failed</h2>
            <p className="font-body text-white/60 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button onClick={continueToUpload} className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all">
                Continue Upload Anyway
              </button>
              <button onClick={() => router.push("/dashboard")} className="w-full font-heading text-white/60 uppercase text-xs tracking-widest rounded-full border border-white/20 py-4 hover:border-white/40 transition-colors">
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function QuickDropVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0505] flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    }>
      <QuickDropVerifyContent />
    </Suspense>
  );
}
