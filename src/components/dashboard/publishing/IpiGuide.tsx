"use client";

/**
 * The free route to an IPI.
 *
 * Offered before the paid session, deliberately. Getting a PRO membership is genuinely
 * something an artist can do alone, and hiding that behind ₦50,000 would be selling
 * paperwork rather than a service. The paid option is for people who read this and decide
 * they would rather not — which is a real choice, not a trick.
 *
 * The fees line at the bottom matters: PRO membership costs money that is nothing to do
 * with Songdis, and an artist who finds that out later feels misled.
 */

import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    title: "Pick your PRO",
    body: "Go with the country you live and perform in. If you're in Nigeria, that's the national PRO here.",
  },
  {
    title: "Gather your documents",
    body: "Valid ID, proof of address, bank details, and a list of songs you've written.",
  },
  {
    title: "Apply and pay their fee",
    body: "The PRO charges its own membership fee, separate from Songdis.",
  },
  {
    title: "Wait for your IPI",
    body: "It appears on your membership profile once you're approved.",
  },
];

export default function IpiGuide({
  onHaveIpi,
  onDoItForMe,
  onBack,
}: {
  onHaveIpi: () => void;
  onDoItForMe: () => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto max-w-[560px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <button
        onClick={onBack}
        className="font-body text-xs text-white/40 transition-colors hover:text-white"
      >
        ← Back
      </button>

      <h2 className="mt-5 font-heading text-xl uppercase leading-[1.2] tracking-wide text-white sm:text-2xl">
        Getting your IPI yourself
      </h2>

      <p className="mt-3 font-body text-sm leading-relaxed text-white/55">
        Four steps. Most artists finish the paperwork in a day and wait a few weeks for the
        number.
      </p>

      <ol className="mt-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Connector, stopping at the last step so the list reads as finished. */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-white/10"
              />
            )}

            <span className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#C30100] font-body text-[11px] font-semibold text-white">
              {i + 1}
            </span>

            <p className="pt-0.5 font-body text-xs leading-relaxed text-white/55">
              <span className="font-semibold text-white">{step.title}.</span> {step.body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-2 space-y-2.5">
        <button
          onClick={onHaveIpi}
          className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
        >
          I have my IPI now
        </button>

        <button
          onClick={onDoItForMe}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-center font-heading text-xs uppercase leading-tight tracking-widest text-white transition-colors hover:border-white/40"
        >
          This is too much — do it for me
          <ArrowRight size={13} className="shrink-0" aria-hidden />
        </button>
      </div>

      <p className="mt-4 font-body text-[11px] leading-relaxed text-white/35">
        Fees and timelines change. Confirm the current ones with the PRO before you apply.
      </p>
    </div>
  );
}
