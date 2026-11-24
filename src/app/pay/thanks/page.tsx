"use client";

/**
 * Where someone who paid on an artist's behalf ("Pay for me") lands after Bachs. They are
 * usually not a SongDis user, so this is a plain thank-you, not the artist's dashboard.
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Thanks() {
  const params = useSearchParams();
  const cancelled = params.get("status") === "cancelled";
  const who = (params.get("for") ?? "").slice(0, 40) || "the artist";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0707] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-7 text-center">
        <p className="text-4xl" aria-hidden>{cancelled ? "↩︎" : "🎉"}</p>
        <h1 className="mt-3 font-heading text-white uppercase text-lg tracking-wide">
          {cancelled ? "Payment not completed" : "Thank you!"}
        </h1>
        <p className="mt-2 font-body text-sm leading-relaxed text-white/60">
          {cancelled
            ? `Nothing was charged. You can open ${who}'s link again to pay while it is still valid.`
            : `Your payment for ${who} went through. It turns on for them straight away, and they can see it in their SongDis dashboard.`}
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#C30100] px-6 font-heading text-[11px] uppercase tracking-widest text-white hover:bg-[#a80000]">
          Discover SongDis
        </Link>
      </div>
    </main>
  );
}

export default function PayThanksPage() {
  return (
    <Suspense fallback={null}>
      <Thanks />
    </Suspense>
  );
}
