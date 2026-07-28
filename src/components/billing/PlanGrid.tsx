"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBillingPlans,
  createCheckout,
  formatMoney,
  intervalLabel,
  type BillingPlan,
  type BillingPrice,
  type BillingInterval,
  type BillingStatus,
  type BillingTrack,
  type TrackOption,
  type PromoPreview,
} from "@/lib/api/billing";
import { openBachsOverlay, type BachsEvent } from "@/lib/bachs";
import { useToast } from "@/components/ui/Toast";
import PromoInput from "./PromoInput";

interface PlanGridProps {
  onChanged: () => void;
}

export default function PlanGrid({ onChanged }: PlanGridProps) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>("year");
  const [track, setTrack] = useState<BillingTrack>("local_transfer");
  const [promo, setPromo] = useState<PromoPreview | null>(null);
  const [busyPriceId, setBusyPriceId] = useState<number | null>(null);
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);

  const { success, error: toastError, info } = useToast();

  const load = useCallback(async () => {
    const res = await getBillingPlans();

    if (res.data && !res.error) {
      setPlans(res.data.plans ?? []);
      setTracks(res.data.tracks ?? []);
      setStatus(res.data.subscription ?? null);

      const sub = res.data.subscription;
      if (sub?.interval) setInterval(sub.interval);
      if (sub?.track) setTrack(sub.track);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(
    () =>
      plans
        .map((plan) => ({
          plan,
          price: plan.prices.find((p) => p.interval === interval && p.track === track),
        }))
        .filter((c): c is { plan: BillingPlan; price: BillingPrice } => Boolean(c.price)),
    [plans, interval, track]
  );

  useEffect(() => {
    setPromo(null);
  }, [interval, track]);

  const handleSubscribe = async (price: BillingPrice) => {
    setBusyPriceId(price.id);

    try {
      const res = await createCheckout({
        price_id: price.id,
        promo_code: promo?.valid && !promo.grants_access ? promo.code : undefined,
      });

      if (res.error || !res.data?.checkout_url) {
        toastError("Checkout failed", res.error ?? "No checkout URL was returned.");
        return;
      }

      await openBachsOverlay(res.data.checkout_url, (event: BachsEvent) => {
        switch (event.type) {
          case "checkout.completed":

            setAwaitingWebhook(true);
            success("Payment received", "Activating your plan…");
            pollUntilActive();
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
      toastError(
        "Checkout unavailable",
        e instanceof Error ? e.message : "Could not open the payment window."
      );
    } finally {
      setBusyPriceId(null);
    }
  };


  const pollUntilActive = useCallback(() => {
    let attempts = 0;

    const tick = async () => {
      attempts += 1;
      const res = await getBillingPlans();
      const sub = res.data?.subscription;

      if (sub?.is_active && sub.current_price_id !== status?.current_price_id) {
        setAwaitingWebhook(false);
        await load();
        onChanged();
        success("You're all set", `Your ${sub.plan?.name ?? ""} plan is active.`);
        return;
      }

      if (attempts >= 10) {
        setAwaitingWebhook(false);
        await load();
        onChanged();
        info(
          "Still processing",
          "Your payment is confirmed. Your plan will activate shortly: refresh in a moment."
        );
        return;
      }

      setTimeout(tick, 2000);
    };

    setTimeout(tick, 2000);
  }, [load, onChanged, status?.current_price_id, success, info]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-montserrat text-white/40 text-sm">
          No plans are available right now. Please try again later.
        </p>
      </div>
    );
  }

  const activeTrack = tracks.find((t) => t.key === track);

  return (
    <div>
      {/* Billing cycle */}
      <div className="flex justify-center mb-4">
        <div className="flex bg-[#0E0808] border border-white/[0.06] rounded-full p-1">
          {(["month", "year"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setInterval(value)}
              className={[
                "font-nulshock uppercase text-xs tracking-widest px-5 py-2 rounded-full transition-all",
                interval === value
                  ? value === "year"
                    ? "bg-[#C30100] text-white"
                    : "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {value === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      {/* Payment rail */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="flex bg-[#0E0808] border border-white/[0.06] rounded-full p-1">
          {tracks.map((t) => (
            <button
              key={t.key}
              onClick={() => setTrack(t.key)}
              className={[
                "font-montserrat text-[11px] tracking-wide px-4 py-2 rounded-full transition-all",
                track === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTrack && (
          <p className="font-montserrat text-white/35 text-[11px] text-center max-w-md">
            {activeTrack.description}
          </p>
        )}
      </div>

      {awaitingWebhook && (
        <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 flex items-center gap-3">
          <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <p className="font-montserrat text-white text-xs">
            Confirming your payment — this usually takes a few seconds.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ plan, price }) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            price={price}
            promo={promo}
            busy={busyPriceId === price.id}
            onSubscribe={() => handleSubscribe(price)}
          />
        ))}
      </div>

      <PromoInput
        priceId={cards[0]?.price.id}
        applied={promo}
        onApplied={setPromo}
        onRedeemed={() => {
          load();
          onChanged();
        }}
      />
    </div>
  );
}

function PlanCard({
  plan,
  price,
  promo,
  busy,
  onSubscribe,
}: {
  plan: BillingPlan;
  price: BillingPrice;
  promo: PromoPreview | null;
  busy: boolean;
  onSubscribe: () => void;
}) {
  const discounted =
    promo?.valid && !promo.grants_access && promo.discounted_amount !== undefined
      ? promo.discounted_amount
      : null;

  const disabled = price.is_current || !price.available || !price.ready || busy;

  const label = price.is_current
    ? "Current Plan"
    : !price.ready
      ? "Unavailable"
      : !price.available
        ? "Not available"
        : promo?.valid && !promo.grants_access
          ? `Get ${plan.name} — ${promo.discount_label}`
          : `Get ${plan.name}`;

  return (
    <div
      className={[
        "rounded-2xl p-5 flex flex-col border transition-colors relative",
        price.is_current ? "bg-[#1A0808] border-[#C30100]" : "bg-[#0E0808] border-white/[0.06]",
        !price.available && !price.is_current ? "opacity-60" : "",
      ].join(" ")}
    >
      {price.is_current && (
        <div className="flex justify-center mb-3">
          <span className="font-montserrat text-white text-[10px] border border-white/20 rounded-full px-3 py-1">
            Current Plan
          </span>
        </div>
      )}

      {plan.is_popular && !price.is_current && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span className="font-nulshock uppercase text-[9px] tracking-widest bg-[#C30100] text-white rounded-full px-3 py-1">
            Most Popular
          </span>
        </div>
      )}

      <p className="font-nulshock text-white uppercase text-sm tracking-wide">{plan.name}</p>

      {plan.description && (
        <p className="font-montserrat text-white/40 text-[11px] mt-1 mb-3 leading-relaxed">
          {plan.description}
        </p>
      )}

      <div className="mb-1 flex items-baseline gap-2 flex-wrap">
        {discounted !== null && (
          <span className="font-nulshock text-white/30 text-base line-through whitespace-nowrap">
            {formatMoney(price.amount, price.currency)}
          </span>
        )}
        <span className="font-nulshock text-white text-xl whitespace-nowrap">
          {formatMoney(discounted ?? price.amount, price.currency)}
        </span>
        <span className="font-montserrat text-white/30 text-xs">
          /{intervalLabel(price.interval)}
        </span>
      </div>

      <p className="font-montserrat text-white/30 text-[10px] mb-1">
        {price.auto_renews ? "Renews automatically" : "Renew manually each period"}
        {price.trial_days ? ` · ${price.trial_days}-day free trial` : ""}
      </p>

      {discounted !== null && promo?.applies_to === "first_cycle" && (
        <p className="font-montserrat text-green-400/80 text-[10px] mb-2">
          First {intervalLabel(price.interval)} only, then {formatMoney(price.amount, price.currency)}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-3 flex-1">
        {price.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#C30100]/20 border border-[#C30100]/40 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="font-montserrat text-white/60 text-xs">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSubscribe}
        disabled={disabled}
        title={price.unavailable_reason ?? undefined}
        className={[
          "mt-5 w-full font-nulshock uppercase text-[10px] tracking-widest rounded-full py-3 transition-all min-h-[44px] flex items-center justify-center gap-2",
          disabled
            ? "border border-white/10 text-white/30 cursor-not-allowed"
            : "border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] text-white",
        ].join(" ")}
      >
        {busy && (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        )}
        {busy ? "Opening..." : label}
      </button>

      {price.unavailable_reason && !price.is_current && (
        <p className="font-montserrat text-white/35 text-[10px] mt-2 leading-relaxed text-center">
          {price.unavailable_reason}
        </p>
      )}
    </div>
  );
}
