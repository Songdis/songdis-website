"use client";

/**
 * Splitr — accept a royalty split invitation.
 *
 * The email sends people here (ZeptoMailService::sendSplitInvitationEmail builds
 * FRONTEND_URL . '/splitr/accept/' . $token), so the path is fixed by every invitation
 * already sitting in an inbox. Public and outside /dashboard on purpose: the person
 * accepting is often a collaborator who has never used Songdis.
 *
 * The flow is built around one rule: SIGNING IN MUST FINISH THE JOB.
 *
 * Telling someone "sign in and this split will be waiting for you" is a promise the
 * product cannot keep — there is no pending-invitations screen in the dashboard, so they
 * sign in, land on /dashboard, and see nothing. So instead of sending them away with an
 * instruction, we send them to sign in with `?redirect=` back to this page and `accept=1`,
 * and on return the acceptance happens on its own.
 *
 * The other trap is a STALE TOKEN. `getToken()` only proves localStorage holds something,
 * not that the server still honours it. When the client thinks it is signed in and the
 * server disagrees, the API answers `requires_sign_in` — that is treated as "not signed
 * in", the dead token is cleared, and the sign-in path is offered. Without that the page
 * shows an Accept button that can only ever fail.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  acceptInvitation,
  declineInvitation,
  viewInvitation,
  type SplitInvitation,
} from "@/lib/api/splitr";
import { getToken, removeToken, setToken } from "@/lib/api/core";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; invitation: SplitInvitation }
  | { kind: "working"; invitation: SplitInvitation }
  | { kind: "mismatch"; invitation: SplitInvitation; message: string }
  | { kind: "accepted"; signedIn: boolean }
  | { kind: "declined" };

const inputCls =
  "w-full min-h-[48px] rounded-xl border border-white/10 bg-[#0E0808] px-3.5 font-body text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C30100]/60";

const primaryBtn =
  "flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-40";

const ghostBtn =
  "flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/12 font-heading text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40";

function AcceptSplitInner() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const token = String(params?.token ?? "");
  /** Set when we sent them to sign in — the signal to finish the job on return. */
  const autoAccept = search.get("accept") === "1";

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Guards the auto-accept so a re-render cannot fire a second acceptance. */
  const autoFired = useRef(false);

  const backHere = `/splitr/accept/${token}?accept=1`;

  /** Hand off to sign-in, carrying the return trip so signing in completes the accept. */
  const goSignIn = useCallback(
    (clearFirst: boolean) => {
      // A mismatched or dead token must go before the redirect, or sign-in reads it and
      // bounces straight back into the same wall.
      if (clearFirst) removeToken();
      router.push(`/sign-in?redirect=${encodeURIComponent(backHere)}`);
    },
    [router, backHere]
  );

  /**
   * Accept, and route the outcome.
   *
   * The server is the authority on who the caller is, so its answer drives the screen
   * rather than anything the client believed beforehand.
   */
  const runAccept = useCallback(
    async (invitation: SplitInvitation, withPassword?: { password: string; password_confirmation: string }) => {
      setBusy(true);
      setErr(null);
      setPhase({ kind: "working", invitation });

      const res = await acceptInvitation(token, withPassword);
      setBusy(false);

      if (!res.error) {
        // Accepting can create the account; sign them in here rather than sending them to
        // a login screen holding a password they set ten seconds ago.
        const fresh = res.data?.token;
        if (fresh) setToken(fresh);

        setPhase({ kind: "accepted", signedIn: Boolean(fresh) || Boolean(getToken()) });
        return;
      }

      // Signed in as somebody else. Needs an action, not just an explanation.
      if (res.status === 403) {
        setPhase({ kind: "mismatch", invitation, message: res.error });
        return;
      }

      // The server does not accept our token — expired, revoked, or from another
      // environment. The client only thought it was signed in.
      if (res.status === 409) {
        removeToken();
        setSignedIn(false);
        setPhase({ kind: "ready", invitation });
        return;
      }

      setPhase({ kind: "ready", invitation });
      setErr(res.error);
    },
    [token]
  );

  const load = useCallback(async () => {
    if (!token) {
      setPhase({ kind: "error", message: "This link is missing its invitation code." });
      return;
    }

    const hasToken = Boolean(getToken());
    setSignedIn(hasToken);

    const res = await viewInvitation(token);

    if (res.error || !res.data) {
      setPhase({
        kind: "error",
        message:
          res.status === 404
            ? "We could not find this invitation. The link may be out of date."
            : res.error ?? "We could not load this invitation.",
      });
      return;
    }

    const invitation = res.data;

    if (invitation.status === "accepted") {
      setPhase({ kind: "accepted", signedIn: hasToken });
      return;
    }

    if (invitation.status === "declined") {
      setPhase({ kind: "declined" });
      return;
    }

    // Returning from sign-in: finish what they came to do. Only on this return trip —
    // someone who simply opens the link while signed in still gets to choose, because
    // accepting a royalty share is an agreement, not a page view.
    if (autoAccept && hasToken && !autoFired.current) {
      autoFired.current = true;
      void runAccept(invitation);
      return;
    }

    setPhase({ kind: "ready", invitation });
  }, [token, autoAccept, runAccept]);

  useEffect(() => {
    void load();
  }, [load]);

  const decline = async () => {
    setBusy(true);
    setErr(null);
    const res = await declineInvitation(token);
    setBusy(false);

    if (res.error) {
      setErr(res.error);
      return;
    }

    setPhase({ kind: "declined" });
  };

  const invitation =
    phase.kind === "ready" || phase.kind === "working" || phase.kind === "mismatch"
      ? phase.invitation
      : null;

  const hasAccount = Boolean(invitation?.has_account);
  const needsSignIn = Boolean(invitation) && !signedIn && hasAccount;
  const needsPassword = Boolean(invitation) && !signedIn && !hasAccount;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0707] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-7">
        {phase.kind === "loading" && (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
            <div className="h-10 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        )}

        {phase.kind === "error" && (
          <Outcome
            title="This invitation could not be opened"
            body={phase.message}
            cta={{ label: "Go to Songdis", href: "/" }}
          />
        )}

        {phase.kind === "declined" && (
          <Outcome
            title="Invitation declined"
            body="We have let the sender know. Nothing else is needed from you."
            cta={{ label: "Go to Songdis", href: "/" }}
          />
        )}

        {phase.kind === "accepted" && (
          <Outcome
            title="Split accepted"
            body={
              phase.signedIn
                ? "Your share is linked to your account. You can follow what it earns from your dashboard."
                : "Your share is recorded. Sign in with this email to follow what it earns."
            }
            cta={
              phase.signedIn
                ? { label: "Go to my earnings", href: "/dashboard/splitr" }
                : { label: "Sign in", href: "/sign-in" }
            }
          />
        )}

        {invitation && (
          <>
            <Header invitation={invitation} />

            {/* Signed in as the wrong person. The only useful move is switching account,
                so that is the button — an Accept here could never succeed. */}
            {phase.kind === "mismatch" && (
              <div className="mt-5">
                <p className="rounded-lg border border-[#C30100]/25 bg-[#C30100]/[0.06] px-3 py-2.5 font-body text-xs leading-relaxed text-white/75">
                  {phase.message}
                </p>
                <button onClick={() => goSignIn(true)} className={`${primaryBtn} mt-3`}>
                  Sign in as {invitation.email}
                </button>
              </div>
            )}

            {phase.kind === "working" && (
              <p className="mt-5 text-center font-body text-sm text-white/55">
                Accepting your split…
              </p>
            )}

            {phase.kind === "ready" && (
              <>
                {needsSignIn && (
                  <div className="mt-5">
                    <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 font-body text-xs leading-relaxed text-white/60">
                      You already have a Songdis account with this email. Sign in and we will
                      accept this split for you straight away.
                    </p>
                    <button onClick={() => goSignIn(true)} className={`${primaryBtn} mt-3`}>
                      Sign in &amp; accept
                    </button>
                  </div>
                )}

                {needsPassword && (
                  <div className="mt-5 space-y-3">
                    <p className="font-body text-xs leading-relaxed text-white/50">
                      Choose a password to set up your Songdis account and track what this
                      share earns.
                    </p>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (at least 8 characters)"
                      className={inputCls}
                      autoComplete="new-password"
                    />
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirm password"
                      className={inputCls}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {err && (
                  <p className="mt-4 rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
                    {err}
                  </p>
                )}

                {!needsSignIn && (
                  <button
                    onClick={() => {
                      if (needsPassword && password !== confirm) {
                        setErr("Those passwords do not match.");
                        return;
                      }
                      void runAccept(
                        invitation,
                        needsPassword
                          ? { password, password_confirmation: confirm }
                          : undefined
                      );
                    }}
                    disabled={busy || (needsPassword && password.length < 8)}
                    className={`${primaryBtn} mt-5`}
                  >
                    {needsPassword ? "Create account & accept" : "Accept split"}
                  </button>
                )}

                <button onClick={decline} disabled={busy} className={`${ghostBtn} mt-2.5`}>
                  Decline
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Header({ invitation }: { invitation: SplitInvitation }) {
  return (
    <>
      <div className="flex items-center gap-3.5">
        {invitation.release.album_art_url ? (
          <Image
            src={invitation.release.album_art_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-lg bg-white/[0.05]" />
        )}
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold text-white">
            {invitation.release.track_title}
          </p>
          <p className="truncate font-body text-xs text-white/45">
            {invitation.release.primary_artist}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
        <p className="font-body text-xs text-white/50">
          {invitation.invited_by.name} is giving you
        </p>
        <p className="mt-1 font-heading text-3xl text-white">{invitation.percentage}%</p>
        <p className="mt-1 font-body text-xs text-white/50">
          of the royalties from this release
        </p>
      </div>

      <p className="mt-4 font-body text-[11px] leading-relaxed text-white/40">
        Sent to {invitation.email}. Payments are made to whoever holds this share at each
        payout cycle.
      </p>
    </>
  );
}

function Outcome({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="py-4 text-center">
      <h1 className="font-heading text-lg uppercase tracking-wide text-white">{title}</h1>
      <p className="mt-2 font-body text-sm leading-relaxed text-white/55">{body}</p>
      <a href={cta.href} className={`${primaryBtn} mt-5`}>
        {cta.label}
      </a>
    </div>
  );
}

export default function AcceptSplitPage() {
  return (
    <Suspense fallback={null}>
      <AcceptSplitInner />
    </Suspense>
  );
}
