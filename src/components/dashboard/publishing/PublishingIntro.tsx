"use client";

/**
 * Publishing — the first screen an artist sees.
 *
 * This is the pitch, not the product. Most artists do not know that a song earns TWICE:
 * the recording (which Songdis already pays them for) and the composition (which nobody
 * has been collecting). That gap is the entire proposition, so the page leads with it
 * rather than with a form asking for an IPI number they have never heard of.
 *
 * Layout: one column on a phone, two on a desktop — the pitch on the left, the price and
 * the call to action pinned on the right so the number stays on screen while the reasons
 * scroll past. Everything is real content at both sizes; nothing is hidden on mobile.
 */

import { Radio, Building2, AudioLines, Clapperboard, Lock, Zap } from "lucide-react";

/** What the writer share actually earns from, in the order an artist recognises it. */
const EARNINGS = [
  { icon: Radio, title: "Radio and TV", body: "Every spin, anywhere." },
  { icon: Building2, title: "Clubs, bars, shops, shows", body: "If it plays, it pays." },
  { icon: AudioLines, title: "Streaming", body: "The writer share — a second cheque." },
  { icon: Clapperboard, title: "Film, ads, games", body: "Sync fees when your song is placed." },
  { icon: Lock, title: "Your splits, locked", body: "Nobody can claim what is yours." },
];

/** The three years an artist can still back-claim, plus today. */
const YEARS = ["2023", "2024", "2025"];

export default function PublishingIntro({
  onStart,
  sharePercent,
}: {
  onStart: () => void;
  /** Songdis's cut of what is collected. Shown plainly — see the note by the price. */
  sharePercent?: number;
}) {
  return (
    <div className="pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        {/* ── The pitch ────────────────────────────────────────────── */}
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full border border-amber-400/40 px-3 py-1 font-heading text-[10px] uppercase tracking-widest text-amber-300">
            For songwriters
          </span>

          {/* max-w in ch so the line length stays readable as the column grows — nulshock
              is a wide face and a full-width line of it is hard to scan. */}
          <h1 className="mt-4 max-w-[16ch] font-heading text-[26px] uppercase leading-[1.1] text-white sm:text-4xl lg:text-[44px] lg:leading-[1.05]">
            There is money in your name you never collected
          </h1>

          {/* The back-claim window. Concrete years rather than "up to three years",
              because a year an artist recognises lands harder than a number. */}
          <div className="mt-5 rounded-2xl border border-[#C30100]/35 bg-gradient-to-b from-[#C30100]/[0.12] to-transparent p-5">
            <p className="font-heading text-[10px] uppercase tracking-widest text-[#ff6b68]">
              Already earned
            </p>
            <p className="mt-2 font-heading text-xl uppercase leading-tight text-white sm:text-2xl">
              Claim up to
              <br />3 years back
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {YEARS.map((y) => (
                <span
                  key={y}
                  className="rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.08] px-3.5 py-1.5 font-body text-xs text-white/70"
                >
                  {y}
                </span>
              ))}
              <span className="rounded-lg bg-[#C30100] px-3.5 py-1.5 font-body text-xs font-semibold text-white">
                Today
              </span>
            </div>

            <p className="mt-4 font-body text-xs leading-relaxed text-white/55">
              Your old songs have been earning writer royalties all this time.
            </p>
          </div>

          {/* The core idea, in one line and then shown rather than explained. */}
          <p className="mt-7 font-body text-sm text-white/60">Every play makes two cheques.</p>

          <div className="mt-3 grid grid-cols-2 gap-3 lg:gap-4">
            <div className="rounded-xl border border-green-500/25 bg-green-500/[0.04] p-4">
              <p className="font-heading text-[10px] uppercase tracking-widest text-white/40">
                The recording
              </p>
              <p className="mt-1.5 font-heading text-lg text-green-400">Paid</p>
              <p className="mt-1 font-body text-[11px] leading-relaxed text-white/45">
                You already get this one.
              </p>
            </div>

            <div className="rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.05] p-4">
              <p className="font-heading text-[10px] uppercase tracking-widest text-white/40">
                The song
              </p>
              <p className="mt-1.5 font-heading text-lg text-[#ff6b68]">Sitting there</p>
              <p className="mt-1 font-body text-[11px] leading-relaxed text-white/45">
                Nobody has claimed it.
              </p>
            </div>
          </div>

          <p className="mt-6 font-body text-sm leading-relaxed text-white/60">
            You wrote it. You own it.{" "}
            <span className="font-semibold text-white">We go and get it.</span>
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3 lg:gap-4">
            {[
              ["5", "ways it earns"],
              ["100+", "territories"],
              ["3 yrs", "back-claim"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-4 text-center"
              >
                <p className="font-heading text-lg text-white sm:text-xl">{value}</p>
                <p className="mt-1 font-body text-[10px] leading-tight text-white/40">{label}</p>
              </div>
            ))}
          </div>

          <ul className="mt-7 grid divide-y divide-white/[0.06] border-y border-white/[0.06] sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 sm:border-y-0">
            {EARNINGS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-3 border-b border-white/[0.06] py-3.5 sm:border-b-0">
                <Icon size={15} className="mt-0.5 shrink-0 text-[#C30100]" aria-hidden />
                <p className="font-body text-xs leading-relaxed text-white/55">
                  <span className="font-semibold text-white">{title}.</span> {body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Price and call to action ─────────────────────────────────
            Sticky from lg up so the price stays visible while the reasons
            scroll. On a phone it simply follows the pitch, which is the
            order the argument is made in. */}
        <div className="lg:sticky lg:top-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#140C0C] p-5">
            <div className="rounded-xl border border-dashed border-white/15 p-4">
              <p className="font-heading text-xl text-white sm:text-2xl">₦70,000</p>
              <p className="mt-1 font-body text-xs font-semibold text-white/80">
                One time. Unlimited songs.
              </p>
              <p className="mt-2 font-body text-[11px] leading-relaxed text-white/45">
                Not per release. Everything you have written, and everything next.
              </p>

              {/*
                The commission, stated before payment rather than discovered on the first
                statement. It is charged on money COLLECTED, so it costs nothing until the
                artist is actually paid — saying that plainly is more reassuring than
                leaving it out and being asked about it later.
              */}
              {typeof sharePercent === "number" && sharePercent > 0 && (
                <p className="mt-3 border-t border-white/10 pt-3 font-body text-[11px] leading-relaxed text-white/45">
                  Songdis keeps{" "}
                  <span className="font-semibold text-white/75">{sharePercent}%</span> of the
                  writer royalties we collect for you. Nothing is taken until you are paid.
                </p>
              )}
            </div>

            {/* Invites, does not charge. Payment comes later, once the artist has said
                they hold an IPI — billing someone who cannot be registered yet would be
                taking money for something we cannot deliver. */}
            <button
              onClick={onStart}
              className="mt-4 flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#C30100] px-5 text-center font-heading text-xs uppercase leading-tight tracking-widest text-white transition-colors hover:bg-[#a80000]"
            >
              Start collecting
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 font-body text-[11px] text-white/40">
              <Zap size={12} className="shrink-0 text-amber-400" aria-hidden />
              5 minutes. No PRO yet? We sort it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
