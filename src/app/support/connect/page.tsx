"use client";

/**
 * "Let SongDis support see my account" — where the support AI (Eusate's Sate) sends an
 * artist so it can answer about their own releases, plan, earnings and payouts.
 *
 * Sate puts a `state` in the link. A signed-in artist confirms here; the API mints a
 * read-only pass and gives it to Eusate with that state, which ties it to their chat.
 * Not signed in: sign in first, then come straight back.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { request, getToken } from "@/lib/api/core";

type Phase = "ready" | "working" | "done" | "error";

function ConnectInner() {
  const router = useRouter();
  const params = useSearchParams();
  const state = params.get("state") ?? "";
  const [phase, setPhase] = useState<Phase>(state ? "ready" : "error");
  const [error, setError] = useState<string | null>(
    state ? null : "This link is missing its code. Go back to the support chat and ask for a new one."
  );

  // Not signed in: sign in first, then come straight back here.
  useEffect(() => {
    if (state && !getToken()) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(`/support/connect?state=${encodeURIComponent(state)}`)}`);
    }
  }, [state, router]);

  const allow = async () => {
    setPhase("working");
    setError(null);
    const res = await request<{ expires_at: string }>(
      "/support/agent/connect",
      { method: "POST", body: JSON.stringify({ state }) },
      true
    );
    if (res.status === 401) {
      router.replace(`/sign-in?redirect=${encodeURIComponent(`/support/connect?state=${encodeURIComponent(state)}`)}`);
      return;
    }
    if (res.error) {
      setError(res.error);
      setPhase("error");
      return;
    }
    setPhase("done");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0707] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-6 sm:p-7">

        {phase === "ready" || phase === "working" ? (
          <>
            <h1 className="font-heading text-white uppercase text-lg tracking-wide">Let support see your account?</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/60">
              So SongDis support can answer about <span className="text-white">your</span> releases, plan, earnings, payouts and splits.
            </p>
            <ul className="mt-4 space-y-1.5 font-body text-xs text-white/50">
              <li>• Read only. Support can&apos;t change anything or move money.</li>
              <li>• Only your account, and only for the next 24 hours.</li>
              <li>• Bank details stay hidden apart from the last 4 digits.</li>
            </ul>
            <button
              onClick={allow}
              disabled={phase === "working"}
              className="mt-6 flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:opacity-50"
            >
              {phase === "working" ? "Connecting…" : "Allow"}
            </button>
            <a href="/dashboard" className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/12 font-heading text-[11px] uppercase tracking-widest text-white/60 hover:text-white">
              Not now
            </a>
          </>
        ) : null}

        {phase === "done" && (
          <div className="text-center">
            <h1 className="font-heading text-white uppercase text-lg tracking-wide">You&apos;re connected</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/60">
              Go back to the support chat and carry on. You can close this page.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center">
            <h1 className="font-heading text-white uppercase text-lg tracking-wide">That didn&apos;t work</h1>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/60">{error}</p>
            {state && (
              <button onClick={allow} className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-full bg-[#C30100] font-heading text-xs uppercase tracking-widest text-white">
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SupportConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectInner />
    </Suspense>
  );
}
