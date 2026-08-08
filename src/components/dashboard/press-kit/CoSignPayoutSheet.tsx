"use client";

/**
 * Request a co-sign payout.
 *
 * CS5 — this REQUESTS. It does not send. The backend writes a `requested` row and
 * nothing on this path can reach the transfer call; a human approves and an operator
 * sends. So the button says "Request", the confirmation says "requested", and nothing
 * in this file tells an artist their money is on its way. Telling someone their money
 * has been sent when it is sitting in a queue is the complaint that follows on the day
 * it matters.
 *
 * The destination is the artist's existing verified payout account — the same one
 * royalty withdrawals use. Co-sign does not collect bank details a second time, and
 * this sheet cannot change them: it names the account and links to where it is managed.
 */

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { formatNaira, parseNairaToKobo } from "@/lib/api/co-sign";
import type { PayoutAccount } from "@/lib/api/payout";
import type { CoSignFailure } from "@/lib/hooks/useCoSign";
import { FailureNotice, Notice, PrimaryButton, Sheet } from "./primitives";
import { ACCENT_TEXT } from "./theme";

/**
 * Mounted only while it is open (see `CoSignPanel`), so the amount resets by unmounting
 * rather than by a setState-in-effect that cascades a render every time the sheet is
 * toggled.
 */
interface Props {
  onClose: () => void;
  availableKobo: number;
  destination: PayoutAccount | null;
  busy: boolean;
  failure: CoSignFailure | null;
  onSubmit: (amountKobo: number) => Promise<boolean>;
}

/** "0123456789" → "••••6789". The artist only needs to recognise it, not read it. */
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
}: Props) {
  // Pre-filled with the whole balance: taking all of it is what an artist means most of
  // the time, and it is still editable.
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
        : null;

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
      title="Request a payout"
      subtitle="Co-sign money is paid out on request — it is never sent automatically."
      footer={
        <div className="flex flex-col gap-3">
          {failure && (
            <FailureNotice
              title="Your payout was not requested"
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
                Requesting…
              </span>
            ) : (
              "Request payout"
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
            href="/dashboard/earnings"
            className="underline underline-offset-2"
            style={{ color: ACCENT_TEXT }}
          >
            Add one under Earnings
          </a>{" "}
          first.
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
              href="/dashboard/earnings"
              className="font-body text-[11px] underline underline-offset-2 mt-2 inline-block"
              style={{ color: ACCENT_TEXT }}
            >
              Change this account
            </a>
          </div>

          <Notice>
            Requesting holds the amount out of your available balance straight away. It is
            reviewed before it is sent, and if it ever fails the money returns to your
            balance rather than disappearing.
          </Notice>
        </>
      )}
    </Sheet>
  );
}
