"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "@/lib/api/core";

interface Item {
  key: string;
  label: string;
  why?: string;
}

interface ArtistSetup {
  id: number;
  stage_name: string;
  important: Item[];
  optional: Item[];
}

const SNOOZE_KEY = "songdis_profile_setup_snoozed_until";

/**
 * "Finish your profile": creating an artist asks only for a legal name and WhatsApp number,
 * so this lists what is still missing per artist. Important items (date of birth, needed for
 * payouts) always show; if only nice-to-haves are left it can be put off for a week.
 */
export default function ProfileSetupNotice() {
  const [artists, setArtists] = useState<ArtistSetup[]>([]);
  const [snoozed, setSnoozed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let live = true;
    request<{ artists: ArtistSetup[] }>("/profiles/setup", { method: "GET" }, true).then((res) => {
      if (live && res.data?.artists) setArtists(res.data.artists);
    });
    return () => {
      live = false;
    };
  }, []);

  const hasImportant = artists.some((a) => a.important.length > 0);
  if (artists.length === 0 || (snoozed && !hasImportant)) return null;

  const shown = artists.slice(0, 3);

  return (
    <div className="rounded-2xl border border-[#C30100]/30 bg-[#180F0F] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-white uppercase text-sm tracking-wide">Finish your artist profile</p>
          <p className="font-body text-white/50 text-xs mt-1">
            {hasImportant ? "A couple of details are still needed before payouts." : "A few details will make your profile complete."}
          </p>
        </div>
        <Link
          href={`/dashboard/settings?tab=artist-profile&finish=${(artists.find((a) => a.important.length > 0) ?? artists[0]).id}`}
          className="font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-4 py-2.5 transition-all min-h-[40px] flex items-center"
        >
          Finish now
        </Link>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {shown.map((a) => (
          <li key={a.id} className="font-body text-xs text-white/70">
            <Link
              href={`/dashboard/settings?tab=artist-profile&finish=${a.id}`}
              className="group inline-flex flex-wrap items-baseline gap-x-1 hover:text-white"
            >
              <span className="text-white font-semibold group-hover:underline">{a.stage_name}</span>
              <span>
                {": "}
                {[
                  ...a.important.map((i) => `${i.label} (${i.why ?? "needed"})`),
                  ...a.optional.map((i) => i.label.toLowerCase()),
                ].join(", ")}
              </span>
              <span className="text-[#C30100]">Finish →</span>
            </Link>
          </li>
        ))}
        {artists.length > shown.length && (
          <li className="font-body text-xs text-white/40">and {artists.length - shown.length} more artists</li>
        )}
      </ul>

      {!hasImportant && (
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(SNOOZE_KEY, String(Date.now() + 7 * 86_400_000));
            } catch {}
            setSnoozed(true);
          }}
          className="mt-3 font-body text-[11px] text-white/40 underline underline-offset-4 hover:text-white"
        >
          Remind me next week
        </button>
      )}
    </div>
  );
}
