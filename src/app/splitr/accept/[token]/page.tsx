"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  acceptInvitation,
  declineInvitation,
  viewInvitation,
  type SplitInvitation,
} from "@/lib/api/splitr";
import { getToken, setToken } from "@/lib/api/core";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; invitation: SplitInvitation }
  | { kind: "accepted"; signedIn: boolean }
  | { kind: "declined" };

const inputCls =
  "w-full min-h-[48px] rounded-xl border border-white/10 bg-[#0E0808] px-3.5 font-body text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C30100]/60";

export default function AcceptSplitPage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token ?? "");

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setPhase({ kind: "error", message: "This link is missing its invitation code." });
      return;
    }

    setSignedIn(Boolean(getToken()));

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

    if (res.data.status === "accepted") {
      setPhase({ kind: "accepted", signedIn: Boolean(getToken()) });
      return;
    }

    if (res.data.status === "declined") {
      setPhase({ kind: "declined" });
      return;
    }

    setPhase({ kind: "ready", invitation: res.data });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const invitation = phase.kind === "ready" ? phase.invitation : null;

  const needsSignIn = Boolean(invitation?.has_account) && !signedIn;
  const needsPassword = Boolean(invitation) && !invitation!.has_account && !signedIn;

  const accept = async () => {
    if (!invitation) return;

    if (needsPassword && password !== confirm) {
      setErr("Those passwords do not match.");
      return;
    }

    setBusy(true);
    setErr(null);

    const res = await acceptInvitation(
      token,
      needsPassword ? { password, password_confirmation: confirm } : undefined
    );

    setBusy(false);

    if (res.error) {
      setErr(res.error);
      return;
    }

    const fresh = res.data?.token;
    if (fresh) setToken(fresh);

    setPhase({ kind: "accepted", signedIn: Boolean(fresh) || signedIn });
  };

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
                ? "Your share is now linked to your account. You can follow the earnings from your dashboard."
                : "Your share is recorded. Sign in with this email to follow the earnings."
            }
            cta={
              phase.signedIn
                ? { label: "Go to my earnings", href: "/dashboard/splitr" }
                : { label: "Sign in", href: "/sign-in" }
            }
          />
        )}

        {phase.kind === "ready" && invitation && (
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
              Sent to {invitation.email}. Payments are made to whoever holds this share at
              each payout cycle.
            </p>

            {needsSignIn && (
              <div className="mt-5">
                <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 font-body text-xs leading-relaxed text-white/60">
                  You already have a Songdis account with this email. Sign in and this split
                  will be waiting for you.
                </p>
                <button
                  onClick={() =>
                    router.push(`/sign-in?redirect=${encodeURIComponent(`/splitr/accept/${token}`)}`)
                  }
                  className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
                >
                  Sign in to accept
                </button>
              </div>
            )}

            {needsPassword && (
              <div className="mt-5 space-y-3">
                <p className="font-body text-xs leading-relaxed text-white/50">
                  Choose a password to set up your Songdis account and track what this share
                  earns.
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
                onClick={accept}
                disabled={busy || (needsPassword && password.length < 8)}
                className="mt-5 flex min-h-[52px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Working…" : needsPassword ? "Create account & accept" : "Accept split"}
              </button>
            )}

            <button
              onClick={decline}
              disabled={busy}
              className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-full border border-white/12 font-heading text-[11px] uppercase tracking-widest text-white/60 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
            >
              Decline
            </button>
          </>
        )}
      </div>
    </main>
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
      <a
        href={cta.href}
        className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#C30100] px-6 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
      >
        {cta.label}
      </a>
    </div>
  );
}
