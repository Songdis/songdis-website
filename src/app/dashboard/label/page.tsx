"use client";

/**
 * app/dashboard/label/page.tsx — the label roster.
 *
 * A control room rather than a personal dashboard: the same tokens as the artist
 * view, deliberately different density and hierarchy. One headline number, then
 * every artist in a scannable list.
 *
 * The whole page renders inside the existing AnalyticsV2Shell, so it inherits the
 * shared filter row, the freshness bar, and the crossfade — a label changing date
 * range sees the roster and an artist view move together, because they are the
 * same state.
 */

import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
import { AnalyticsV2Shell } from "@/components/dashboard/analytics-v2/Shell";
import { Card, CardHeader, CountUp, ErrorPanel } from "@/components/dashboard/analytics-v2/primitives";
import { RosterTable } from "@/components/dashboard/label/RosterTable";
import { InvitePanel } from "@/components/dashboard/label/InvitePanel";
import { useAnalyticsV2, useRoster } from "@/lib/hooks/useAnalyticsV2";
import { useBilling } from "@/lib/hooks/useBilling";
import { BRAND, INK, formatCompact, formatFull } from "@/components/dashboard/analytics-v2/theme";

function RosterContent() {
  const router = useRouter();
  const { profiles, select } = useAnalyticsV2();
  const { data: roster, isLoading, error, errors, refresh } = useRoster();

  /*
   * Inviting an outside artist is a Label entitlement; seeing your own roster is not.
   * An account that reaches this page by owning more profiles than the standard cap —
   * grandfathered from before the Label plan existed — gets the roster but not the invite
   * form, because ArtistInvitationService checks `can_invite_artists` and would 403 on
   * send. Showing a form that cannot succeed is worse than not showing it.
   */
  const { can } = useBilling(0);
  const canInvite = can("can_invite_artists");

  const total = roster?.totals.streams ?? 0;
  const rowSum = (roster?.artists ?? []).reduce((n, a) => n + (a.streams ?? 0), 0);

  // The two figures are computed differently on purpose: the total comes from the
  // fact table, the rows from a per-artist grouping. A feed that cannot attribute
  // to one artist still counts toward the account. Saying so is more useful than
  // quietly showing a total that does not match the rows above it.
  const unattributed = Math.max(total - rowSum, 0);

  // "Top artist" is a claim, and a claim needs something to stand on. Sorting a
  // roster where every artist has 0 streams still returns a name, and naming an
  // artist with no streams at all is simply wrong. Both the account total and the
  // leader's own figure have to be non-zero before anyone is called top.
  const topArtist = (() => {
    if (!roster?.artists?.length || total <= 0) return null;
    const leader = [...roster.artists].sort((a, b) => b.streams - a.streams)[0];
    return leader && leader.streams > 0 ? leader : null;
  })();

  // Zero across the range is usually a true answer, not a broken one — the default
  // window is the last 28 days and a catalogue can simply have nothing in it. The
  // roster says so in words rather than leaving three dashes to be read as failure.
  const emptyRange = !isLoading && !!roster && total <= 0;

  const openArtist = (id: number) => {
    select(id);
    router.push("/dashboard/analytics-v2");
  };

  if (error) {
    return <ErrorPanel error={error} errors={errors} onRetry={refresh} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* One column on a phone, two on a tablet with the headline spanning both,
          three once there is genuinely room. */}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        <Card index={0} glow className="sm:col-span-2 lg:col-span-1">
          <div className="p-4 sm:p-5">
            <CardHeader title="Roster streams" subtitle="All artists, selected range" />
            <div
              className="truncate font-heading text-3xl leading-none tabular-nums sm:text-4xl"
              style={{ color: INK.primary }}
              title={formatFull(total)}
            >
              <CountUp value={total} format={formatCompact} />
            </div>
            {emptyRange && (
              <p className="mt-2 font-body text-[11px] leading-relaxed" style={{ color: INK.muted }}>
                No streams reported for the selected range. Widen the range if your releases are
                older than it.
              </p>
            )}
            {unattributed > 0 && (
              <p className="mt-2 font-body text-[11px] leading-relaxed" style={{ color: INK.muted }}>
                {formatCompact(unattributed)} not attributable to a single artist — counted here,
                not in the rows below.
              </p>
            )}
          </div>
        </Card>

        <Card index={1}>
          <div className="p-4 sm:p-5">
            <CardHeader title="Artists" subtitle="On your roster" />
            <div
              className="truncate font-heading text-3xl leading-none tabular-nums sm:text-4xl"
              style={{ color: INK.primary }}
            >
              {profiles.length}
            </div>
          </div>
        </Card>

        <Card index={2}>
          <div className="p-4 sm:p-5">
            <CardHeader title="Top artist" subtitle="By streams in range" />
            {topArtist ? (
              <button
                type="button"
                onClick={() => openArtist(topArtist.artist_profile_id)}
                className="group flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
              >
                <span
                  className="min-w-0 flex-1 truncate font-heading text-xl leading-tight sm:text-2xl"
                  style={{ color: INK.primary }}
                  title={topArtist.name ?? undefined}
                >
                  {topArtist.name ?? `Profile ${topArtist.artist_profile_id}`}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-80"
                  style={{ color: INK.secondary }}
                  aria-hidden
                />
              </button>
            ) : (
              <div>
                <span
                  className="block font-heading text-xl leading-tight sm:text-2xl"
                  style={{ color: INK.faint }}
                >
                  —
                </span>
                {emptyRange && (
                  <p className="mt-2 font-body text-[11px] leading-relaxed" style={{ color: INK.muted }}>
                    No streams in this range, so no artist leads it.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card index={3}>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader
            title="Your artists"
            subtitle="Select an artist to open their full dashboard"
          />
        </div>
        <RosterTable roster={roster} isLoading={isLoading} onOpenArtist={openArtist} />
      </Card>

      {canInvite && <InvitePanel profiles={profiles} />}
    </div>
  );
}

export default function LabelRosterPage() {
  return (
    <AnalyticsV2Shell pageTitle="Label Statistics">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "rgba(195,1,0,0.12)", border: `1px solid ${BRAND}33` }}
        >
          <Users className="h-3.5 w-3.5" style={{ color: BRAND }} aria-hidden />
        </span>
        <h1
          className="truncate font-heading text-base uppercase tracking-wide sm:text-lg"
          style={{ color: INK.primary }}
        >
          Roster
        </h1>
      </div>
      <RosterContent />
    </AnalyticsV2Shell>
  );
}
