"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { fetchPartnerRelease, type PartnerRelease } from "@/lib/api/partner";

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.2em]">{label}</p>
      <p className="font-body text-white/80 text-sm mt-1 break-words">{value || "—"}</p>
    </div>
  );
}

export default function PartnerReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const releaseId = Number(params?.id);

  const [release, setRelease] = useState<PartnerRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(releaseId)) {
      setError("Release not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetchPartnerRelease(releaseId);

    if (res.error) {
      setError(res.error);
    } else {
      setRelease(res.data);
      setError(null);
    }

    setLoading(false);
  }, [releaseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PartnerLayout pageTitle={release?.release_title ?? "Release"}>
      <Link
        href="/partner/releases"
        className="inline-block font-body text-white/40 hover:text-white text-xs mb-4 transition-colors"
      >
        ← Back to releases
      </Link>

      {loading && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl h-64 animate-pulse" />
      )}

      {!loading && error && (
        <div className="bg-[#1A0808] border border-[#C30100]/40 rounded-2xl p-5">
          <p className="font-body text-white text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && release && (
        <>
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative w-full sm:w-40 aspect-square max-w-[160px] shrink-0 rounded-xl overflow-hidden bg-white/[0.04]">
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
                <h2 className="font-heading text-white uppercase text-lg sm:text-xl tracking-wide break-words">
                  {release.release_title}
                </h2>
                <p className="font-body text-white/50 text-sm mt-1">{release.artist_name}</p>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  <Detail label="Type" value={release.upload_type} />
                  <Detail label="Status" value={release.status} />
                  <Detail label="Release date" value={release.release_date} />
                  <Detail label="Genre" value={release.primary_genre} />
                  <Detail label="Label" value={release.label} />
                  <Detail label="UPC" value={release.upc_code} />
                </div>

                {/*
                  A missing UPC is why a delivered release can show no streams and no
                  earnings. Stating it on the release itself stops that reading as a
                  reporting failure.
                */}
                {!release.upc_code && (
                  <p className="font-body text-amber-300/70 text-xs mt-4">
                    This release has no UPC yet, so streaming and royalty reporting cannot be
                    matched to it.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mt-4">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className="font-heading text-white uppercase text-sm tracking-[0.18em]">
                Tracks
              </h3>
              {release.assigned_track_count < release.total_track_count && (
                <span className="font-body text-amber-300/70 text-[11px]">
                  {release.assigned_track_count} of {release.total_track_count} shared with you
                </span>
              )}
            </div>

            <ul className="mt-4 flex flex-col gap-px">
              {release.tracks.map((track, index) => (
                <li
                  key={track.id}
                  className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0"
                >
                  <span className="font-body text-white/25 text-xs w-5 shrink-0">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-body text-white text-sm truncate">
                      {track.track_title || "Untitled"}
                    </p>
                    <p className="font-body text-white/30 text-[11px] mt-0.5">
                      {track.isrc_code || "ISRC pending"}
                    </p>
                  </div>

                  {track.explicit_content && (
                    <span className="font-heading text-[8px] tracking-widest px-1.5 py-0.5 rounded-sm bg-white/[0.06] text-white/50 shrink-0">
                      E
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PartnerLayout>
  );
}
