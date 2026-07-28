"use client";

import { useState } from "react";
import { previewPromo, redeemPromo, formatMoney, type PromoPreview } from "@/lib/api/billing";
import { useToast } from "@/components/ui/Toast";

interface PromoInputProps {
  priceId?: number;
  applied: PromoPreview | null;
  onApplied: (promo: PromoPreview | null) => void;
  onRedeemed: () => void;
}


export default function PromoInput({
  priceId,
  applied,
  onApplied,
  onRedeemed,
}: PromoInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await previewPromo(trimmed, priceId);
      const preview = res.data;

      if (!preview?.valid) {
        setError(preview?.message ?? res.error ?? "That promo code is not valid.");
        onApplied(null);
        return;
      }

      if (preview.grants_access) {
        const redeem = await redeemPromo(trimmed);

        if (redeem.error) {
          setError(redeem.error);
          return;
        }

        success("Promo applied", redeem.message ?? "Your plan is now active.");
        setCode("");
        onApplied(null);
        onRedeemed();
        return;
      }

      onApplied(preview);
      success("Promo applied", `${preview.discount_label} will be applied at checkout.`);
    } catch {
      toastError("Promo failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setCode("");
    setError(null);
    onApplied(null);
  };

  if (applied?.valid && !applied.grants_access) {
    return (
      <div className="mt-6 rounded-xl border border-green-500/25 bg-green-500/[0.07] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 font-nulshock text-[10px] tracking-widest uppercase rounded-full bg-green-500/20 text-green-300 px-3 py-1">
            {applied.discount_label}
          </span>
          <div className="min-w-0">
            <p className="font-montserrat text-white text-xs">
              Code <span className="font-semibold">{applied.code}</span> applied
              {applied.saving !== undefined && applied.currency
                ? ` — you save ${formatMoney(applied.saving, applied.currency)}`
                : ""}
            </p>
            <p className="font-montserrat text-white/40 text-[11px] mt-0.5">
              {applied.applies_to === "lifetime"
                ? "Applies to every renewal."
                : "Applies to your first payment only."}
            </p>
          </div>
        </div>

        <button
          onClick={clear}
          className="shrink-0 font-montserrat text-white/40 hover:text-white text-[11px] underline underline-offset-2 transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Enter promo code"
          className={[
            "flex-1 bg-[#0E0808] border rounded-lg px-4 py-2.5 font-montserrat text-white text-sm placeholder:text-white/25 outline-none transition-colors",
            error ? "border-[#C30100]/60" : "border-white/10 focus:border-[#C30100]",
          ].join(" ")}
        />
        <button
          onClick={apply}
          disabled={!code.trim() || loading}
          className="font-nulshock uppercase text-[10px] tracking-widest rounded-full border border-white/20 px-5 py-2.5 text-white hover:border-white/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
        >
          {loading && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          )}
          {loading ? "Checking..." : "Apply"}
        </button>
      </div>

      {error && (
        <p className="font-montserrat text-[#C30100] text-[11px] mt-2">{error}</p>
      )}
    </div>
  );
}
