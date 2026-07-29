"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getQuickDropOptions,
  createQuickDropCheckout,
  applyQuickDropCredit,
  rescheduleQuickDropCredit,
  formatQuickDropDate,
  type QuickDropOptions,
  type QuickDropCredit,
} from "@/lib/api/quickDrop";
import { openBachsOverlay, type BachsEvent } from "@/lib/bachs";
import { formatMoney } from "@/lib/api/billing";
import { useToast } from "@/components/ui/Toast";

interface QuickDropProps {
  onClose: () => void;
  /** Called once a Quick Drop is secured, with the date it applies to. */
  onActivated: (releaseDate: string) => void;
  /** Persists the in-progress release server-side and returns its draft id.
   *  Saving before payment is what stops a purchase being stranded. */
  saveDraft?: () => Promise<number | undefined>;
  releaseData: {
    releaseTitle: string;
    primaryArtist: string;
    uploadType: "Single" | "Album/EP";
    trackCount?: number;
  };
}

export default function QuickDropModal({ onClose, onActivated, saveDraft }: QuickDropProps) {
  const [options, setOptions] = useState<QuickDropOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success, error: toastError, info } = useToast();

  const load = useCallback(async () => {
    const res = await getQuickDropOptions();

    if (res.data && !res.error) {
      setOptions(res.data);
      // Default to the earliest date they can actually have.
      setDate((prev) => prev || res.data!.min_date);
    } else {
      setError(res.error ?? "Quick Drop is unavailable right now.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* An already-paid Quick Drop is spent instead of charging again. */
  const applyExistingCredit = async (credit: QuickDropCredit) => {
    setIsProcessing(true);
    setError(null);

    try {
      let target = credit;

      // The date they paid for has gone by; move it rather than lose it.
      if (credit.date_passed) {
        const moved = await rescheduleQuickDropCredit(credit.id, date || options!.min_date);

        if (moved.error || !moved.data) {
          setError(moved.error ?? "Could not move that Quick Drop to a new date.");
          return;
        }

        target = moved.data;
      }

      const applied = await applyQuickDropCredit(target.id);

      if (applied.error) {
        setError(applied.error);
        return;
      }

      success("Quick Drop applied", `Your release is set for ${formatQuickDropDate(target.release_date)}.`);
      onActivated(target.release_date);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!date) {
      setError("Please select a release date");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Save the release first. If anything goes wrong from here on, the work
      // is on the server and the credit can be applied to it later.
      let draftId: number | undefined;

      if (saveDraft) {
        try {
          draftId = await saveDraft();
        } catch {
          // A failed draft save is not fatal — the credit still lands on the
          // account — but warn, because recovery is smoother with a draft.
          info("Heads up", "We could not save your draft first. Your payment will still be kept.");
        }
      }

      const res = await createQuickDropCheckout({ release_date: date, draft_id: draftId });

      if (res.error || !res.data?.checkout_url) {
        setError(res.error ?? "Could not start the payment.");
        return;
      }

      const creditId = res.data.credit_id;
      const paidDate = res.data.release_date;

      // Overlay, not a redirect. The page never unloads, so the release being
      // built stays exactly where it is. This is the core of the old bug.
      await openBachsOverlay(res.data.checkout_url, (event: BachsEvent) => {
        switch (event.type) {
          case "checkout.completed":
            // Never fulfil here — the webhook is the source of truth.
            setAwaitingWebhook(true);
            pollForCredit(creditId, paidDate);
            break;

          case "checkout.failed":
            toastError("Payment failed", "Your payment did not go through. Please try again.");
            break;

          case "checkout.expired":
            toastError("Session expired", "That checkout expired. Please start again.");
            break;

          case "checkout.error":
            toastError("Checkout error", String(event.data?.message ?? "Something went wrong."));
            break;
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the payment window.");
    } finally {
      setIsProcessing(false);
    }
  };

  /** Wait for the webhook to make the credit spendable, then apply it. */
  const pollForCredit = useCallback(
    (creditId: number, paidDate: string) => {
      let attempts = 0;

      const tick = async () => {
        attempts += 1;

        const res = await getQuickDropOptions();
        const credit = res.data?.credits.find((c) => c.id === creditId);

        if (credit) {
          const applied = await applyQuickDropCredit(credit.id);
          setAwaitingWebhook(false);

          if (!applied.error) {
            success("Quick Drop activated", `Your release is set for ${formatQuickDropDate(paidDate)}.`);
            onActivated(paidDate);
            onClose();
            return;
          }
        }

        if (attempts >= 10) {
          setAwaitingWebhook(false);

          info(
            "Payment received",
            "We are still confirming it. Your Quick Drop will appear here shortly."
          );
          load();
          return;
        }

        setTimeout(tick, 2000);
      };

      setTimeout(tick, 2000);
    },
    [success, info, onActivated, onClose, load]
  );

  const credits = options?.credits ?? [];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-[560px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-5 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <div className="text-center mb-6">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide">Quick Drop</h2>
          <p className="font-body text-white/50 text-sm mt-1">Fast-track your release</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          </div>
        ) : !options?.available ? (
          <p className="font-body text-white/50 text-sm text-center py-10">
            {error ?? "Quick Drop is unavailable right now. Please try again shortly."}
          </p>
        ) : (
          <>
            {/* Already paid — offer it before asking for money again. */}
            {credits.length > 0 && (
              <div className="border border-[#C30100]/40 bg-[#C30100]/[0.07] rounded-xl p-4 mb-5">
                <p className="font-body text-white text-sm font-semibold mb-1">
                  You already have a Quick Drop
                </p>
                <p className="font-body text-white/50 text-xs mb-3">
                  {credits[0].date_passed
                    ? `Paid for ${formatQuickDropDate(credits[0].release_date)}, which has passed. Pick a new date below and use it — you will not be charged again.`
                    : `Paid for ${formatQuickDropDate(credits[0].release_date)}. Apply it to this release at no extra cost.`}
                </p>
                <button
                  onClick={() => applyExistingCredit(credits[0])}
                  disabled={isProcessing}
                  className="w-full font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/20 hover:bg-[#C30100] py-3 transition-all disabled:opacity-40 min-h-[44px]"
                >
                  {isProcessing ? "Applying..." : "Use It For This Release"}
                </button>
              </div>
            )}

            {/* Info box */}
            <div className="border border-dashed border-[#C30100]/30 rounded-xl p-4 sm:p-5 mb-4 sm:mb-5">
              <p className="font-body text-white text-sm font-semibold mb-2 sm:mb-3">Release sooner</p>
              <p className="font-body text-white/50 text-xs mb-3 sm:mb-4">
                Skip the standard waiting period and get your music out faster
              </p>
              {[
                { label: "Priority Processing", desc: "Your release jumps the queue and gets reviewed first by our distribution team." },
                { label: "Time-Sensitive Releases", desc: "Ideal for launches tied to events, tours, campaigns, or viral moments that can't wait." },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2 mb-2">
                  <svg className="text-[#C30100] shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="font-body text-white/60 text-xs">
                    <span className="text-white font-medium">{item.label}</span> - {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="font-body text-white/70 text-xs block mb-1.5">
                Select Quick Drop Release Date
              </label>
              <input
                type="date"
                value={date}
                min={options.min_date}
                max={options.max_date}
                onChange={(e) => { setDate(e.target.value); setError(null); }}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors [color-scheme:dark]"
              />
              <p className="font-body text-white/30 text-xs mt-1">
                Any date from {formatQuickDropDate(options.min_date)} to {formatQuickDropDate(options.max_date)}.
                Later than that and you can set your release date normally, free.
              </p>
            </div>

            {error && (
              <p className="font-body text-[#C30100] text-xs mb-4 text-center">{error}</p>
            )}

            {awaitingWebhook && (
              <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 flex items-center gap-3">
                <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                <p className="font-body text-white text-xs">
                  Confirming your payment, this usually takes a few seconds.
                </p>
              </div>
            )}

            {/* Fee */}
            <div className="bg-[#0E0808] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="font-body text-white/40 text-xs mb-1">Quick Drop Fee</p>
              <p className="font-heading text-white text-2xl sm:text-3xl font-bold">
                {options.amount !== null && options.currency
                  ? formatMoney(options.amount, options.currency)
                  : "—"}
              </p>
              <p className="font-body text-white/30 text-xs mt-1">
                One-time payment · Card, bank transfer or mobile money
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 font-heading text-white uppercase text-[10px] sm:text-xs tracking-widest rounded-full border border-white/20 py-3 sm:py-4 hover:border-white/40 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={!date || isProcessing || awaitingWebhook}
                className="flex-1 font-heading text-white uppercase text-[10px] sm:text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3 sm:py-4 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isProcessing && (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                )}
                {isProcessing
                  ? "Processing..."
                  : options.amount !== null && options.currency
                    ? `Pay ${formatMoney(options.amount, options.currency)}`
                    : "Pay"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
