"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ArrowRight, Infinity as InfinityIcon, AlertTriangle } from "lucide-react";
import { INK, STATUS } from "@/components/dashboard/analytics-v2/theme";
import { getUpgradeQuote, type UpgradeQuote } from "@/lib/api/billing-upgrade";

export interface UpgradeTrigger {
  message: string;
  artist_limit: number | null;
  artists_used: number;
  upgrade_plan: { key: string; name: string; tier: number } | null;
  priceId?: number;
}

function Money({ currency, amount }: { currency: string; amount: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function UpgradeSheet({
  trigger,
  onClose,
  onCheckout,
}: {
  trigger: UpgradeTrigger;
  onClose: () => void;
  onCheckout?: (priceId: number) => void;
}) {
  const [quote, setQuote] = useState<UpgradeQuote | null>(null);
  const [loading, setLoading] = useState(Boolean(trigger.priceId));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const priceId = trigger.priceId;
    if (!priceId) return;

    let cancelled = false;

    (async () => {
      const res = await getUpgradeQuote(priceId);
      if (cancelled) return;

      if (res.error) setError(res.error);
      else setQuote(res.data ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [trigger.priceId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const planName = trigger.upgrade_plan?.name ?? "the next plan";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Upgrade to ${planName}`}
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain p-3 sm:p-4"
    >
      <div aria-hidden onClick={onClose} className="fixed inset-0 bg-black/72 backdrop-blur-sm animate-fade-in" />

      <div className="av2-module relative z-[1] my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#140C0C]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 h-60 w-60"
          style={{ background: "radial-gradient(circle, #C3010038 0%, transparent 70%)", filter: "blur(40px)" }}
        />

        <div className="relative z-[1] p-4 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="font-heading text-base uppercase tracking-wide text-white sm:text-lg">
                Upgrade to {planName}
              </h2>
              <p className="mt-1 break-words font-body text-xs leading-relaxed" style={{ color: INK.muted }}>
                {trigger.message}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-m-1.5 shrink-0 rounded p-1.5 text-white/40 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-lg border border-white/[0.06] px-3 py-2.5">
            <InfinityIcon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#E5342F" }} aria-hidden />
            <span className="min-w-0 font-body text-[13px] leading-relaxed sm:text-sm" style={{ color: INK.secondary }}>
              Unlimited artist profiles — you have{" "}
              <strong style={{ color: INK.primary }}>{trigger.artists_used}</strong>
              {trigger.artist_limit !== null && ` of ${trigger.artist_limit}`}
            </span>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: INK.faint }} aria-hidden />
              <span className="font-body text-xs" style={{ color: INK.muted }}>
                Working out your price…
              </span>
            </div>
          )}

          {error && (
            <p
              className="mb-3 flex items-start gap-1.5 font-body text-xs leading-relaxed"
              style={{ color: STATUS.critical }}
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{error}</span>
            </p>
          )}

          {quote && (
            <div className="mb-4 rounded-lg border border-white/[0.06]">
              <Row label={`${quote.plan.name} (${quote.interval})`}>
                <Money currency={quote.currency} amount={quote.list_amount} />
              </Row>

              {quote.credit_applied > 0 && (
                <Row
                  label={`Credit for ${quote.credit_detail?.days_remaining ?? 0} unused days`}
                  tone={STATUS.good}
                  bordered
                >
                  &minus; <Money currency={quote.currency} amount={quote.credit_applied} />
                </Row>
              )}

              <Row label="Due today" bordered strong>
                <Money currency={quote.currency} amount={quote.amount_due} />
              </Row>
            </div>
          )}

          {(quote?.one_way ?? true) && (
            <p className="mb-4 font-body text-[11px] leading-relaxed" style={{ color: INK.muted }}>
              {quote?.one_way_notice ?? `${planName} cannot be downgraded to a lower plan later.`}
            </p>
          )}

          <div className="flex flex-col gap-2 xs:flex-row xs:flex-wrap xs:items-center">
            <button
              type="button"
              onClick={() => trigger.priceId && onCheckout?.(trigger.priceId)}
              disabled={!trigger.priceId || loading}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#C30100] px-4 py-2.5 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-40 xs:w-auto"
            >
              Continue to payment
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full whitespace-nowrap rounded-lg px-4 py-2.5 font-body text-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white xs:w-auto"
              style={{ color: INK.muted }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  tone,
  bordered = false,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  tone?: string;
  bordered?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-2.5"
      style={bordered ? { borderTop: "1px solid rgba(255,255,255,0.06)" } : undefined}
    >
      <span
        className={`min-w-0 break-words font-body ${strong ? "text-sm font-semibold" : "text-xs"}`}
        style={{ color: strong ? INK.primary : INK.secondary }}
      >
        {label}
      </span>
      <span
        className={`ml-auto shrink-0 font-body ${strong ? "text-sm font-semibold" : "text-xs"}`}
        style={{ color: tone ?? INK.primary }}
      >
        {children}
      </span>
    </div>
  );
}
