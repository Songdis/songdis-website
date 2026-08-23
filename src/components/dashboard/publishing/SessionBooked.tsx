"use client";

/**
 * Confirmation after an IPI session is paid for.
 *
 * Answers the two things an artist actually worries about at this moment, in this order:
 * when is the call, and is my music still going out. The second is not obvious — they
 * have just been told their publishing profile is incomplete, and it is a short step from
 * there to assuming distribution is blocked. It is not, and saying so plainly here saves
 * a support ticket.
 */

import { Check, Video } from "lucide-react";
import type { BookedSession } from "@/lib/api/publishing";

export default function SessionBooked({
  session,
  onDone,
}: {
  session: BookedSession;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto max-w-[520px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 text-center sm:p-7">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500/40 bg-green-500/[0.08]">
        <Check size={28} className="text-green-400" aria-hidden />
      </div>

      <h2 className="mt-5 font-heading text-xl uppercase tracking-wide text-white sm:text-2xl">
        You&rsquo;re booked
      </h2>

      <p className="mt-3 font-body text-sm leading-relaxed text-white/60">
        Session on{" "}
        <span className="font-semibold text-white">{session.label_full}</span>. The link is
        in your email and your Songdis notifications.
      </p>

      {/* Present only once the team has created it by hand, so it appears on a revisit
          rather than immediately after payment. */}
      {session.meeting_url && (
        <a
          href={session.meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/15 px-5 font-heading text-[11px] uppercase tracking-widest text-white transition-colors hover:border-white/35"
        >
          <Video size={13} aria-hidden />
          Join the call
        </a>
      )}

      <dl className="mt-6 space-y-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-body text-xs text-white/45">Publishing profile</dt>
          <dd className="font-body text-xs font-semibold text-amber-400">Pending IPI</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-body text-xs text-white/45">Your releases</dt>
          <dd className="font-body text-xs font-semibold text-green-400">Still going out</dd>
        </div>
      </dl>

      <p className="mt-4 font-body text-xs leading-relaxed text-white/45">
        We&rsquo;ll open your registration back up the moment your number is issued — and
        fill it in for you.
      </p>

      <button
        onClick={onDone}
        className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/20 px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:border-white/40"
      >
        Back to publishing
      </button>
    </div>
  );
}
