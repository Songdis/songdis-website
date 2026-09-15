"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PartnerLayout from "@/components/partner/PartnerLayout";
import StatTile from "@/components/partner/StatTile";
import { fetchPartnerOverview, type PartnerOverview } from "@/lib/api/partner";

export default function PartnerOverviewPage() {
  const [overview, setOverview] = useState<PartnerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPartnerOverview();

    if (res.error) {
      setError(res.error);
    } else {
      setOverview(res.data);
      setError(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerLayout pageTitle="Overview" partnerName={overview?.partner.name}>
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5 h-[92px] animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#1A0808] border border-[#C30100]/40 rounded-2xl p-5">
          <p className="font-body text-white text-sm">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-3 font-heading uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] px-4 py-2 text-white hover:bg-[#C30100] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && overview && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatTile label="Releases" value={overview.release_count} />
            <StatTile label="Tracks" value={overview.track_count} />
            <StatTile label="Artists" value={overview.artist_count} />
            <StatTile label="Live" value={overview.live_release_count} />
          </div>

          {/*
            A release without a UPC has no reporting identifier yet, so nothing will match
            it in the royalty or stream feeds. Saying so here is the difference between
            "not reported yet" and an apparent zero — the latter reads as failure.
          */}
          {overview.awaiting_identifiers_count > 0 && (
            <div className="mt-4 bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-5">
              <p className="font-heading text-white/40 uppercase text-[11px] tracking-[0.18em]">
                Awaiting reporting identifiers
              </p>
              <p className="font-body text-white/70 text-sm mt-2">
                {overview.awaiting_identifiers_count}{" "}
                {overview.awaiting_identifiers_count === 1 ? "release has" : "releases have"} no
                UPC assigned yet. Streams and earnings cannot be reported against{" "}
                {overview.awaiting_identifiers_count === 1 ? "it" : "them"} until one is
                issued — this is not the same as having earned nothing.
              </p>
            </div>
          )}

          {overview.release_count === 0 && (
            <div className="mt-4 bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 sm:p-10 text-center">
              <h2 className="font-heading text-white uppercase text-base sm:text-lg tracking-wide">
                No releases yet
              </h2>
              <p className="font-body text-white/50 text-sm mt-2 max-w-md mx-auto">
                Nothing has been shared with you so far. Releases appear here as soon as the
                Songdis team assigns them to your account.
              </p>
            </div>
          )}

          {overview.release_count > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/partner/releases"
                className="flex-1 sm:flex-none text-center font-heading uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#140C0C] px-5 py-3 text-white hover:bg-[#C30100] transition-colors"
              >
                View releases
              </Link>
              <Link
                href="/partner/analytics"
                className="flex-1 sm:flex-none text-center font-heading uppercase text-[10px] tracking-widest rounded-full border border-white/15 px-5 py-3 text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                View analytics
              </Link>
            </div>
          )}
        </>
      )}
    </PartnerLayout>
  );
}
