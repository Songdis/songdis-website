"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { formatNaira, parseNairaToKobo } from "@/lib/api/co-sign";
import type { PayoutAccount } from "@/lib/api/payout";
import type { CoSignFailure } from "@/lib/hooks/useCoSign";
import { FailureNotice, Notice, PrimaryButton, Sheet } from "./primitives";
import { ACCENT_TEXT } from "./theme";


interface Props {
  onClose: () => void;
  availableKobo: number;
  destination: PayoutAccount | null;
  busy: boolean;
  failure: CoSignFailure | null;
  onSubmit: (amountKobo: number) => Promise<boolean>;
  /** SongDis's transfer fee, taken from the amount withdrawn. */
  feeKobo?: number;
  /** The smallest withdrawal allowed. */
  minKobo?: number;
}

function maskAccount(number: string): string {
  const tail = number.slice(-4);
  return tail ? `••••${tail}` : number;
}

export function CoSignPayoutSheet({
  onClose,
  availableKobo,
  destination,
  busy,
  failure,
  onSubmit,
  feeKobo = 0,
  minKobo = 0,
}: Props) {
  const [amountText, setAmountText] = useState(() =>
    formatNaira(availableKobo, { withSymbol: false })
  );
  const [touched, setTouched] = useState(false);

  const amountKobo = useMemo(() => parseNairaToKobo(amountText), [amountText]);

  const problem =
    amountKobo === null || amountKobo <= 0
      ? "Enter an amount."
      : amountKobo > availableKobo
        ? `That is more than your available balance of ${formatNaira(availableKobo)}.`
        : amountKobo < minKobo
          ? `The smallest withdrawal is ${formatNaira(minKobo)}.`
          : null;

  const netKobo = amountKobo !== null ? Math.max(0, amountKobo - feeKobo) : 0;

  const submit = async () => {
    setTouched(true);
    if (problem || amountKobo === null) return;
    const ok = await onSubmit(amountKobo);
    if (ok) onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Withdraw co-sign money"
      subtitle="Sent to your bank account straight away. It usually arrives within minutes."
      footer={
        <div className="flex flex-col gap-3">
          {failure && (
            <FailureNotice
              title="Your withdrawal did not go through"
              error={failure.error}
              errors={failure.errors}
            />
          )}
          <PrimaryButton
            onClick={() => void submit()}
            disabled={busy || !destination || availableKobo <= 0}
            full
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" aria-hidden />
                Sending…
              </span>
            ) : (
              "Withdraw"
            )}
          </PrimaryButton>
        </div>
      }
    >
      {!destination ? (
        <Notice tone="warning">
          You have no verified bank account yet, and a co-sign payout lands in the same
          account as your royalties.{" "}
          <a
            href="#payout-account"
            className="underline underline-offset-2"
            style={{ color: ACCENT_TEXT }}
          >
            Add one under Payout Account
          </a>{" "}
          on this page first.
        </Notice>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cosign-payout-amount"
              className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40"
            >
              Amount
            </label>
            <div
              className={[
                "flex items-center rounded-md border border-dashed px-2.5 transition-colors",
                touched && problem ? "border-solid border-[#d03b3b]" : "border-white/20",
              ].join(" ")}
            >
              <span className="font-heading text-white/70 text-lg mr-1.5" aria-hidden>
                ₦
              </span>
              <input
                id="cosign-payout-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amountText}
                onChange={(e) => {
                  setAmountText(e.target.value);
                  setTouched(true);
                }}
                aria-label="Payout amount in naira"
                aria-invalid={touched && problem ? true : undefined}
                className="w-full bg-transparent py-2.5 font-heading text-white text-xl outline-none placeholder:text-white/25"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => {
                  setAmountText(formatNaira(availableKobo, { withSymbol: false }));
                  setTouched(true);
                }}
                className="shrink-0 font-body text-[11px] px-2 py-1 rounded-full border border-white/12 text-white/60 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]"
              >
                All
              </button>
            </div>
            {touched && problem ? (
              <p className="font-body text-[11px]" style={{ color: ACCENT_TEXT }}>
                {problem}
              </p>
            ) : (
              <p className="font-body text-[11px] text-white/30">
                {formatNaira(availableKobo)} available.
              </p>
            )}
          </div>

          {feeKobo > 0 && (
            <dl className="rounded-xl border border-white/[0.07] p-3.5 font-body text-[13px]">
              <div className="flex justify-between text-white/55">
                <dt>Transfer fee</dt>
                <dd className="tabular-nums">−{formatNaira(feeKobo)}</dd>
              </div>
              <div className="mt-1.5 flex justify-between text-white">
                <dt className="font-semibold">You receive</dt>
                <dd className="font-heading tabular-nums">{formatNaira(netKobo)}</dd>
              </div>
            </dl>
          )}

          <div className="rounded-xl border border-white/[0.07] p-3.5">
            <p className="font-body text-[10px] uppercase tracking-[0.12em] text-white/40 mb-1.5">
              Paid into
            </p>
            <p className="font-body text-white text-sm">
              {destination.account_name}
            </p>
            <p className="font-body text-white/45 text-xs mt-0.5">
              {[destination.bank_name, maskAccount(destination.account_number)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <a
              href="#payout-account"
              className="font-body text-[11px] underline underline-offset-2 mt-2 inline-block"
              style={{ color: ACCENT_TEXT }}
            >
              Change this account
            </a>
          </div>

          <Notice>
            The amount leaves your co-sign balance straight away. If the bank ever turns it
            down, the money comes back to your balance.
          </Notice>
        </>
      )}
    </Sheet>
  );
}
