"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BASE_URL, getToken } from "@/lib/api/core";

type Status = "verifying" | "success" | "pending" | "error";

function VideoVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");

  const verify = useCallback(async (ref: string) => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/videos/payment/verify?reference=${encodeURIComponent(ref)}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const json = await res.json();
      const data = json?.data;

      if (data?.payment_status === "paid") {
        setStatus("success");
        setTimeout(() => router.push("/dashboard/videos"), 2500);
      } else {
        setStatus("pending");
        setMessage("Your payment is still being processed. It usually completes within a few minutes — your video will appear once confirmed.");
      }
    } catch {
      setStatus("error");
      setMessage(`We couldn't reach the payment server. Your submission is saved. Please refresh in a minute, or contact support with reference: ${ref}`);
    }
  }, [router]);

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No payment reference found. Please go back to your videos.");
      return;
    }
    verify(reference);
  }, [reference, verify]);

  return (
    <div className="min-h-screen bg-[#0A0505] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
        {/* Verifying */}
        {status === "verifying" && (
          <>
            <svg className="animate-spin mx-auto mb-6" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Verifying Payment</h2>
            <p className="font-body text-white/60 text-sm">Just a moment while we confirm with the payment gateway...</p>
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
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Payment Confirmed!</h2>
            <p className="font-body text-white/60 text-sm mb-6">Your video submission has been received. Our team will review it and get it to the platforms.</p>
            <p className="font-body text-white/30 text-xs flex items-center justify-center gap-2">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Redirecting to your videos...
            </p>
          </>
        )}

        {/* Pending */}
        {status === "pending" && (
          <>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
              <circle cx="32" cy="32" r="30" stroke="#eab308" strokeWidth="2" />
              <path d="M32 20V34L40 38" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Payment Processing</h2>
            <p className="font-body text-white/60 text-sm mb-6">{message}</p>
            <button onClick={() => router.push("/dashboard/videos")} className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all">
              Go to My Videos
            </button>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-6">
              <circle cx="32" cy="32" r="30" stroke="#C30100" strokeWidth="2" opacity="0.5" />
              <path d="M24 24L40 40M40 24L24 40" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h2 className="font-heading text-white uppercase text-xl tracking-wide mb-2">Something Went Wrong</h2>
            <p className="font-body text-white/60 text-sm mb-6">{message}</p>
            <button onClick={() => router.push("/dashboard/videos")} className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-4 transition-all">
              Go to My Videos
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VideoVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0505] flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    }>
      <VideoVerifyContent />
    </Suspense>
  );
}
