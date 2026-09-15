"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { fetchPartnerReleases, type PartnerRelease } from "@/lib/api/partner";

function StatusPill({ status }: { status: string }) {
  const tone =
    status?.toLowerCase() === "live"
      ? "bg-emerald-500/15 text-emerald-300"
      : status?.toLowerCase() === "rejected"
        ? "bg-[#C30100]/20 text-[#E5342F]"
        : "bg-white/[0.06] text-white/60";

  return (
    <span className={`font-heading uppercase text-[9px] tracking-[0.16em] px-2 py-1 rounded-md ${tone}`}>
      {status || "unknown"}
    </span>
  );
}

export default function PartnerReleasesPage() {
  const [releases, setReleases] = useState<PartnerRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchPartnerReleases();

    if (res.error) {
      setError(res.error);
    } else {
      setReleases(res.data ?? []);
      setError(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerLayout pageTitle="Releases">
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#1A0808] border border-white/[0.07] rounded-2xl h-[104px] animate-pulse"
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

      {!loading && !error && releases.length === 0 && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 sm:p-10 text-center">
          <h2 className="font-heading text-white uppercase text-base sm:text-lg tracking-wide">
            No releases assigned
          </h2>
          <p className="font-body text-white/50 text-sm mt-2 max-w-md mx-auto">
            Releases appear here as soon as the Songdis team assigns them to your account.
          </p>
        </div>
      )}

      {!loading && !error && releases.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {releases.map((release) => (
            <Link
              key={release.id}
              href={`/partner/releases/${release.id}`}
              className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 flex gap-4 hover:border-white/20 transition-colors"
            >
              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-white/[0.04]">
                {release.album_art_url && (
                  <Image
                    src={release.album_art_url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-body text-white text-sm truncate">{release.release_title}</p>
                <p className="font-body text-white/50 text-xs truncate mt-0.5">
                  {release.artist_name}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusPill status={release.status} />
                  <span className="font-body text-white/30 text-[11px]">
                    {release.upload_type}
                  </span>
                </div>

                {/*
                  Assignment is stored per track, so a partner can hold part of an album.
                  Saying "3 of 5 tracks" is the difference between an incomplete view and a
                  record that looks shorter than it is.
                */}
                {release.assigned_track_count < release.total_track_count && (
                  <p className="font-body text-amber-300/70 text-[11px] mt-1.5">
                    {release.assigned_track_count} of {release.total_track_count} tracks shared
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PartnerLayout>
  );
}
