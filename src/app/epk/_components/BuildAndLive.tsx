"use client";

import { useEffect, useState } from "react";
import { epkKitUrl } from "@/lib/epk";
import type { Created } from "./useEpkArtists";
import { Arrow, PosterButton } from "./Poster";

const Check = ({ on }: { on: boolean }) =>
  on ? (
    <span className="grid h-6 w-6 shrink-0 place-items-center bg-[#FF77CD]">
      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="3">
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  ) : (
    <span className="h-6 w-6 shrink-0 border-2 border-white/30" />
  );

/**
 * Shown while the kit is being made. The steps tick over as time passes because the server
 * does them in one request; the last one waits for the real answer.
 */
export function Building({ name, image }: { name: string; image: string | null }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 1100);
    return () => clearInterval(t);
  }, []);

  const steps = ["Finding your releases", "Pulling artwork, photo and links", "Writing a starter bio", "Reserving your link"];

  return (
    <div className="mx-auto max-w-[520px] py-8" aria-live="polite">
      <div className="relative pt-10">
        <div aria-hidden className="absolute left-[12%] right-[12%] top-0 h-16 bg-[#FF4A2B]" />
        <div aria-hidden className="absolute left-[6%] right-[6%] top-3.5 h-16 bg-[#0038FF]" />
        <div aria-hidden className="absolute left-[2%] right-[2%] top-7 h-16 bg-[#FF77CD]" />
        <div className="relative bg-[#FFE08A] p-2">
          <div className="relative h-[190px] overflow-hidden bg-[#101010]">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover object-[center_25%]" />
            )}
            <p className="ed absolute bottom-3 left-4 text-[40px] text-white drop-shadow">{name}</p>
          </div>
        </div>
      </div>
      <h1 className="ed mt-8 text-[56px]">
        Building <span className="text-[#FF77CD]">your EPK.</span>
      </h1>
      <ul className="mt-6 flex flex-col gap-3.5 text-[15.5px]">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i > step ? "text-white/40" : ""}`}>
            <Check on={i < step} />
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-8 h-2 bg-white/10">
        <div className="h-full bg-[#0038FF] transition-[width] duration-700" style={{ width: `${25 + step * 22}%` }} />
      </div>
    </div>
  );
}

/** The kit is up: its link, copy and share, and what to do next. */
export function Live({ created, image, onEdit }: { created: Created; image: string | null; onEdit: () => void }) {
  const url = created.slug ? epkKitUrl(created.slug) : null;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${created.stage_name} — EPK`, url });
        return;
      } catch {
        /* closed the sheet: fall through to copy */
      }
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-[520px] py-8">
      <h1 className="ed text-center text-[72px]">
        You&apos;re <span className="text-[#FF77CD]">live.</span>
      </h1>
      <div className="mt-6 bg-[#FFE08A] p-2">
        <div className="relative h-[220px] overflow-hidden bg-[#101010]">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover object-[center_25%]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(16,16,16,.85))]" />
          <p className="ed absolute bottom-3 left-4 text-[44px] text-white">{created.stage_name}</p>
        </div>
        {url && (
          <div className="flex items-center gap-2 bg-[#101010] px-3 py-3 text-[15px] text-[#F4F4F4]">
            <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate hover:underline">
              {created.slug}
              <span className="text-[#FF77CD]">.getepk.si</span>
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(url).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                });
              }}
              className="el bg-[#FF77CD] px-3 py-1.5 text-[11px] text-[#101010]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[13.5px] text-white/60">
        {created.releases_queued
          ? "Spotify is busy, so your releases will appear in a few minutes. No need to wait here."
          : created.releases_imported > 0
            ? `${created.releases_imported} release${created.releases_imported === 1 ? "" : "s"} added · Co-sign and Stay close are on`
            : "Co-sign and Stay close are on"}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <button type="button" onClick={() => void share()} className="group flex min-h-[52px] items-stretch">
          <span className="grid w-[52px] place-items-center bg-[#F4F4F4]">
            <Arrow color="#101010" />
          </span>
          <span className="el flex flex-1 items-center justify-center bg-[#FF77CD] text-[13px] text-[#101010] group-hover:underline">
            Share my EPK
          </span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="el min-h-[52px] border-2 border-white/30 text-[13px] text-white hover:border-white"
        >
          Add photos, bio and more
        </button>
      </div>
      <div className="mt-8 bg-[#0038FF] p-5 text-white">
        <p className="ed text-[32px]">New song coming?</p>
        <p className="mt-2 text-[14px] leading-relaxed text-white/85">
          Release with SongDis. It reaches 200+ stores and lands on your EPK the same day.
        </p>
        <div className="mt-4">
          <PosterButton href="https://songdis.com/sign-up" tone="white" external>
            Release with SongDis
          </PosterButton>
        </div>
      </div>
    </div>
  );
}
