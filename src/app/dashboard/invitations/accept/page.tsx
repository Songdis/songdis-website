"use client";

/**
 * The target of the invitation email's "Accept invitation" button.
 *
 * Deliberately a dashboard route: accepting binds a grant to an ACCOUNT, so the artist has
 * to be signed in. An unauthenticated visitor is bounced to sign-in with a return path, so
 * the token survives the round trip rather than being lost on the login redirect — the
 * single most common way invitation links get wasted.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { STATUS } from "@/components/dashboard/analytics-v2/theme";
import { acceptInvitation, type ArtistInvitation } from "@/lib/api/label";
import { getToken } from "@/lib/api/core";

type State =
  | { phase: "working" }
  | { phase: "done"; invitation: ArtistInvitation | null }
  | { phase: "failed"; message: string };

function AcceptInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ phase: "working" });

  const [attempt, setAttempt] = useState(0);
  const run = useCallback(() => setAttempt((n) => n + 1), []);

  // Nothing is set synchronously in the effect body — the token/auth checks resolve to a
  // redirect or fall through to an awaited request. The cancel flag prevents a late
  // response writing state after navigation.
  useEffect(() => {
    if (!token) {
      queueMicrotask(() =>
        setState({ phase: "failed", message: "This link is missing its invitation code." })
      );
      return;
    }

    // Carry the token through sign-in. Without this the artist lands on the dashboard and
    // the invitation is silently lost — the commonest way invite links get wasted.
    if (!getToken()) {
      const back = encodeURIComponent(`/dashboard/invitations/accept?token=${token}`);
      router.replace(`/sign-in?redirect=${back}`);
      return;
    }

    let cancelled = false;

    (async () => {
      const res = await acceptInvitation(token);
      if (cancelled) return;

      setState(
        res.error
          ? { phase: "failed", message: res.error }
          : { phase: "done", invitation: res.data ?? null }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router, attempt]);

  return (
    <DashboardLayout pageTitle="Invitation">
      <div className="mx-auto w-full max-w-lg py-6 sm:py-10">
        <div className="rounded-xl border border-white/[0.06] bg-[#180F0F] p-4 sm:p-6 md:p-8">
          {state.phase === "working" && (
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-white/40" aria-hidden />
              <p className="min-w-0 font-body text-sm text-white/70">
                Accepting your invitation…
              </p>
            </div>
          )}

          {state.phase === "done" && (
            <>
              <CheckCircle2 className="mb-3 h-8 w-8" style={{ color: STATUS.good }} aria-hidden />
              <h1 className="font-heading text-base uppercase tracking-wide text-white sm:text-lg">
                You&rsquo;re in
              </h1>
              <p className="mt-2 break-words font-body text-sm leading-relaxed text-white/70">
                You can now see performance data for{" "}
                <strong className="text-white">
                  {state.invitation?.artist_name ?? "this artist"}
                </strong>
                .
              </p>
              {/* Said again here, not only in the email. An artist who expects to control
                  their catalogue and finds a read-only dashboard contacts support. */}
              <p className="mt-3 font-body text-xs leading-relaxed text-white/40">
                This gives you view access to streaming data. Your releases stay managed by
                the label that invited you.
              </p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/analytics-v2")}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C30100] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 xs:w-auto"
              >
                View your analytics
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </>
          )}

          {state.phase === "failed" && (
            <>
              <AlertTriangle className="mb-3 h-8 w-8" style={{ color: STATUS.warning }} aria-hidden />
              <h1 className="font-heading text-base uppercase tracking-wide text-white sm:text-lg">
                We couldn&rsquo;t accept this invitation
              </h1>
              {/* The API messages are written to be shown: they name the invited address on
                  a mismatch, and say plainly when a link has expired. An address is a long
                  unbroken string, so it has to be allowed to break rather than widen the page. */}
              <p className="mt-2 break-words font-body text-sm leading-relaxed text-white/70">
                {state.message}
              </p>
              <div className="mt-5 flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:items-center">
                <button
                  type="button"
                  onClick={run}
                  className="w-full whitespace-nowrap rounded-lg border border-white/10 px-4 py-2.5 font-body text-sm text-white/80 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:border-white/40 xs:w-auto"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="w-full whitespace-nowrap rounded-lg px-4 py-2.5 font-body text-sm text-white/50 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white xs:w-auto"
                >
                  Go to dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AcceptInvitationPage() {
  // useSearchParams needs a Suspense boundary under the App Router.
  return (
    <Suspense fallback={null}>
      <AcceptInner />
    </Suspense>
  );
}
