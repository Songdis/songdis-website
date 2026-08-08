"use client";

/**
 * components/dashboard/label/InvitePanel.tsx
 *
 * The label's side of L4: invite an artist to view their own data, see who is outstanding,
 * withdraw access.
 *
 * Two things this deliberately makes visible rather than hiding:
 *
 *  - **`expired` is separate from `status`.** A row stays `pending` in the database until
 *    something touches it, so a stale invitation would otherwise read as outstanding
 *    forever. The API returns a computed `expired`, and it wins in the badge.
 *  - **Revoking after acceptance removes access.** The label is told that in the confirm
 *    step, because "revoke" on an accepted invitation is a different act from cancelling
 *    one that was never used.
 */

import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2, X, UserPlus, AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/dashboard/analytics-v2/primitives";
import { INK, STATUS, formatGrantedAt } from "@/components/dashboard/analytics-v2/theme";
import {
  listInvitations,
  sendInvitation,
  revokeInvitation,
  type ArtistInvitation,
} from "@/lib/api/label";
import type { ProfileSummary } from "@/lib/api/analytics-v2";

function StatusBadge({ invitation }: { invitation: ArtistInvitation }) {
  // `expired` beats `status`: a row is only flipped to expired lazily, server-side.
  const [label, color] = invitation.expired && invitation.status === "pending"
    ? ["Expired", INK.muted]
    : invitation.status === "accepted"
      ? ["Accepted", STATUS.good]
      : invitation.status === "revoked"
        ? ["Revoked", INK.muted]
        : ["Pending", STATUS.warning];

  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color, background: "rgba(255,255,255,0.05)" }}
    >
      {label}
    </span>
  );
}

export function InvitePanel({ profiles }: { profiles: ProfileSummary[] }) {
  const [invitations, setInvitations] = useState<ArtistInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<number | "">("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Only profiles the account OWNS can be invited to — a grant conveys sight, not the
  // authority to hand that sight to someone else. The API enforces this; the form should
  // not offer what the API will refuse.
  const ownProfiles = profiles.filter((p) => p.role === "owner");

  const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(() => setRefreshKey((n) => n + 1), []);

  // The first state change happens AFTER the await, never synchronously in the effect
  // body, and the cancel flag stops a late response writing to an unmounted component.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await listInvitations();
      if (cancelled) return;

      if (res.error) setError(res.error);
      else setInvitations(res.data ?? []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const submit = async () => {
    if (profileId === "" || !email.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    const res = await sendInvitation(Number(profileId), email.trim());

    if (res.error) {
      setError(res.error);
    } else {
      setNotice(`Invitation sent to ${email.trim()}.`);
      setEmail("");
      load();
    }
    setBusy(false);
  };

  const revoke = async (invitation: ArtistInvitation) => {
    const warning = invitation.status === "accepted"
      ? `${invitation.email} will immediately lose access to ${invitation.artist_name ?? "this artist"}'s data. Continue?`
      : `Cancel the invitation to ${invitation.email}?`;

    if (!window.confirm(warning)) return;

    setBusy(true);
    const res = await revokeInvitation(invitation.id);
    if (res.error) setError(res.error);
    else load();
    setBusy(false);
  };

  return (
    <Card index={4}>
      <div className="p-4 sm:p-5">
        <CardHeader
          title="Artist access"
          subtitle="Invite an artist to see their own performance data"
        />

        {ownProfiles.length === 0 ? (
          <p className="font-body text-sm" style={{ color: INK.muted }}>
            You have no artist profiles to invite anyone to yet.
          </p>
        ) : (
          /* Stacked until `md`. At `sm` the three controls side by side leave the
             email field around 150px wide, which is narrower than the addresses
             going into it — one row of full-width fields is the honest layout. */
          <div className="flex flex-col gap-2 md:flex-row">
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value === "" ? "" : Number(e.target.value))}
              aria-label="Artist profile"
              className="w-full min-w-0 truncate rounded-lg border border-white/10 bg-[#0E0808] px-3 py-2 font-body text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-[#C30100] md:w-44 md:shrink-0 lg:w-52"
            >
              <option value="">Choose artist…</option>
              {ownProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? `Profile ${p.id}`}
                </option>
              ))}
            </select>

            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="artist@email.com"
              aria-label="Artist email"
              className="w-full min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0E0808] px-3 py-2 font-body text-sm text-white placeholder:text-white/25 outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]"
            />

            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy || profileId === "" || !email.trim()}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C30100] px-4 py-2 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
              Invite
            </button>
          </div>
        )}

        {error && (
          <p
            className="mt-3 flex items-start gap-1.5 font-body text-xs leading-relaxed"
            style={{ color: STATUS.critical }}
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{error}</span>
          </p>
        )}
        {notice && (
          <p
            className="mt-3 min-w-0 break-words font-body text-xs leading-relaxed"
            style={{ color: STATUS.good }}
          >
            {notice}
          </p>
        )}

        <div className="mt-5">
          {loading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: INK.faint }} aria-hidden />
              <span className="font-body text-xs" style={{ color: INK.muted }}>
                Loading invitations…
              </span>
            </div>
          ) : invitations.length === 0 ? (
            <p className="py-2 font-body text-xs" style={{ color: INK.faint }}>
              No invitations sent yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.04]">
              {invitations.map((i) => (
                /* Below `sm` the badge and the revoke control drop onto their own
                   line rather than competing with the address for the same ~160px.
                   Email and artist name both truncate — an address is exactly the
                   kind of long unbroken string that otherwise widens the page. */
                <li key={i.id} className="flex items-start gap-3 py-2.5">
                  <Mail
                    className="mt-1 h-3.5 w-3.5 shrink-0"
                    style={{ color: INK.faint }}
                    aria-hidden
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body text-sm" style={{ color: INK.primary }}>
                        {i.email}
                      </div>
                      <div className="truncate font-body text-[11px]" style={{ color: INK.muted }}>
                        {i.artist_name ?? `Profile ${i.artist_profile_id}`}
                        {i.expires_at && i.status === "pending" && !i.expired
                          ? ` · expires ${formatGrantedAt(i.expires_at)}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge invitation={i} />

                      {(i.status === "pending" || i.status === "accepted") && (
                        <button
                          type="button"
                          onClick={() => void revoke(i)}
                          disabled={busy}
                          title={i.status === "accepted" ? "Remove access" : "Cancel invitation"}
                          aria-label={i.status === "accepted" ? "Remove access" : "Cancel invitation"}
                          className="shrink-0 rounded p-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100] disabled:opacity-40"
                        >
                          <X className="h-4 w-4" style={{ color: INK.muted }} aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
