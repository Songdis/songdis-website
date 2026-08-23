"use client";

/**
 * Paying for registration (₦70,000), for an artist who already holds an IPI.
 *
 * Sits between "yes I have my IPI" and the writer form. The price has been visible since
 * the intro, so this screen is a confirmation rather than a reveal — it restates what is
 * being bought, for which artist, and then leaves for the payment page.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatNaira, startAccessCheckout } from "@/lib/api/publishing";

const ACCESS_PRICE = 70000;

export default function AccessCheckout({
  artist,
  artistProfileId,
  onBack,
}: {
  artist: string;
  artistProfileId: number;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);

    const res = await startAccessCheckout(artistProfileId);

    if (res.error || !res.data?.checkout_url) {
      setBusy(false);
      setError(res.error ?? "Could not start payment.");
      return;
    }

    // Leaves the app. Access is granted by the Bachs webhook, not by coming back.
    window.location.href = res.data.checkout_url;
  };

  return (
    <div className="mx-auto max-w-[520px] rounded-2xl border border-white/[0.07] bg-[#140C0C] p-5 sm:p-6">
      <button
        onClick={onBack}
        className="font-body text-xs text-white/40 transition-colors hover:text-white"
      >
        ← Back
      </button>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full ${i <= 1 ? "bg-[#C30100]" : "bg-white/12"}`}
          />
        ))}
      </div>

      <h2 className="mt-5 font-heading text-xl uppercase leading-[1.2] tracking-wide text-white sm:text-2xl">
        Confirm and pay
      </h2>

      <dl className="mt-5 rounded-xl border border-dashed border-white/15 p-4">
        <div className="flex items-center justify-between gap-3 py-1.5">
          <dt className="font-body text-xs text-white/45">Service</dt>
          <dd className="text-right font-body text-sm font-medium text-white">
            Songwriter registration
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5">
          <dt className="font-body text-xs text-white/45">Artist</dt>
          <dd className="min-w-0 truncate text-right font-body text-sm font-medium text-white">
            {artist}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-1.5">
          <dt className="font-body text-xs text-white/45">Covers</dt>
          <dd className="text-right font-body text-sm font-medium text-white">
            Unlimited songs
          </dd>
        </div>

        <div className="mt-3 border-t border-white/[0.08] pt-3">
          <div className="flex items-center justify-between gap-3">
            <dt className="font-body text-xs text-white/45">One-time</dt>
            <dd className="font-body text-sm font-semibold text-[#ff6b68]">
              {formatNaira(ACCESS_PRICE)}
            </dd>
          </div>
        </div>
      </dl>

      {/* Per artist, said before paying rather than discovered afterwards by a label
          wondering why their second artist is asking for money again. */}
      <p className="mt-4 font-body text-xs leading-relaxed text-white/50">
        This registers <span className="font-semibold text-white/85">{artist}</span> as a
        songwriter and covers every song they have written and everything next. Each artist
        is registered separately.
      </p>

      {error && (
        <p className="mt-4 rounded-lg border border-[#C30100]/30 bg-[#C30100]/[0.07] px-3 py-2 font-body text-xs text-white">
          {error}
        </p>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#C30100] px-5 font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000] disabled:opacity-50"
      >
        {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
        {busy ? "Taking you to payment…" : `Pay ${formatNaira(ACCESS_PRICE)}`}
      </button>
    </div>
  );
}
