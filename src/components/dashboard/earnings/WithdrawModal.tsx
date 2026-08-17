"use client";

import { useState, useEffect, useRef } from "react";
import { useWithdrawal, useBanks } from "@/lib/hooks/useEarnings";
import { getPayoutStatus, type PayoutStatus } from "@/lib/api/payout";
import { getBalance, pauseFromBalance, type BalanceData } from "@/lib/api/earnings";
import BankSelect from "./BankSelect";

type Step = "amount" | "otp" | "done";

interface Props {
  availableBalance: number;
  pausedMessage?: string | null;
  onPaused?: (message: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawModal({
  availableBalance,
  pausedMessage: pausedFromPage = null,
  onPaused,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [otp, setOtp] = useState("");

  const {
    preview, fetchPreview, clearPreview, isLoadingPreview, previewError,
    fetchOtp, isLoadingOtp, otpError,
    withdraw, isLoadingWithdraw, withdrawError,
    accountName, verifyBankAccount, isVerifying,
    pausedMessage: pausedFromServer,
  } = useWithdrawal();

  const { banks, isLoading: banksLoading } = useBanks(currency);

  const [pausedOnOpen, setPausedOnOpen] = useState<string | null>(null);
  const paused = pausedFromServer ?? pausedOnOpen ?? pausedFromPage;

  useEffect(() => {
    let cancelled = false;

    getBalance().then((res) => {
      if (cancelled || res.error) return;
      const raw = res.data as Record<string, unknown> | null;
      const data = (raw?.data as BalanceData) ?? (raw as BalanceData | null);
      const message = pauseFromBalance(data);
      if (message) setPausedOnOpen(message);
    });

    return () => { cancelled = true; };
  }, []);

  const reportedPause = useRef<string | null>(null);
  const pauseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paused || reportedPause.current === paused) return;
    reportedPause.current = paused;
    onPaused?.(paused);
    pauseRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [paused, onPaused]);

 
  const [payout, setPayout] = useState<PayoutStatus | null>(null);
  const [payoutChecked, setPayoutChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPayoutStatus().then((res) => {
      if (cancelled) return;
      if (!res.error && res.data) setPayout(res.data);
      setPayoutChecked(true);
    });

    return () => { cancelled = true; };
  }, []);

  /*
   * No verified destination, no form.
   *
   * This used to also require `payout.enforced` (DOJAH_ENFORCE_WITHDRAWAL), which is off —
   * so the block never fired and the artist got the whole form, filled it in, and only
   * then found out. The server refuses a bank transfer without a saved account whatever
   * that flag says, so the UI should too.
   *
   * A failed status lookup leaves `payout` null and does NOT block: better to let the
   * request through and surface the server's answer than to lock someone out on a
   * network blip.
   */
  const blockedByIdentity = payout !== null && !payout.account;

  /*
   * The verified destination, when there is one.
   *
   * The server pays into this account and ignores whatever bank_code/account_number the
   * request carries (RoyaltyWithdrawalController builds payout_details from the saved
   * row). Asking for them again was therefore not just repetition — the artist could type
   * a different account, watch it verify, and still be paid somewhere else.
   */
  const savedAccount = payout?.account ?? null;

  /* Auto-verify account when bank + 10-digit number selected */
  useEffect(() => {
    if (bankCode && accountNumber.length === 10) {
      verifyBankAccount(bankCode, accountNumber);
    }
  }, [bankCode, accountNumber, verifyBankAccount]);

  const amountNum = parseFloat(amount) || 0;
  const belowMinimum = amountNum > 0 && amountNum < 50;

  /** With a verified account there is nothing left to fill in but the amount. */
  const destinationReady = savedAccount
    ? true
    : payoutChecked && Boolean(bankCode) && accountNumber.length === 10;

  /*
   * Who the money is going to.
   *
   * `accountName` is only ever set by the live bank lookup, which needs a bank code and a
   * ten-digit number typed into the form. A saved account never triggers it, so gating
   * anything on `accountName` alone leaves the artist stuck with a valid preview and a
   * dead Continue button. The saved name is already verified — prefer it.
   */
  const destinationName = savedAccount?.account_name ?? accountName;

  const handlePreview = async () => {
    if (!amountNum || !destinationReady) return;
    await fetchPreview(amountNum, currency);
  };

  const handleSendOtp = async () => {
    await fetchOtp(amountNum, currency, () => setStep("otp"));
  };

  const handleWithdraw = async () => {
    await withdraw(
      {
        otp_code: otp,
        amount_usd: amountNum,
        target_currency: currency,
        payout_method: "bank_transfer",
        /*
         * Echoed from the saved account, not collected. The server overwrites these with
         * the saved row anyway; sending them keeps the request valid against a backend
         * that has not yet relaxed `required_if` — deploy skew, not a real input.
         */
        bank_code: savedAccount?.bank_code ?? bankCode,
        account_number: savedAccount?.account_number ?? accountNumber,
        account_name: destinationName ?? "",
        country: "NG",
      },
      onSuccess
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[620px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10">
          <CloseIcon />
        </button>

        <div className="p-7">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-1">
            Withdraw Funds
          </h2>
          <p className="font-body text-white/40 text-xs text-center mb-6">
            Available: <span className="text-white font-semibold">${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </p>

          {/*
            Paused: the whole form goes, replaced by the reason. Amber and not
            red — this is not a failed withdrawal, it is a withdrawal that
            cannot start yet, and the balance above is still theirs.
          */}
          {paused && (
            <div ref={pauseRef} role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
              <div className="flex items-start gap-3">
                <span aria-hidden className="text-amber-400 shrink-0 mt-0.5">
                  <PauseNoticeIcon />
                </span>
                <div className="min-w-0">
                  <p className="font-body text-white text-sm font-medium mb-1.5">
                    Withdrawals are paused
                  </p>
                  {/* The server's wording, unchanged. */}
                  <p className="font-body text-white/70 text-xs leading-relaxed">
                    {paused}
                  </p>
                  <p className="font-body text-white/40 text-[11px] leading-relaxed mt-2">
                    Nothing you entered has been sent and no money has moved.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full sm:w-auto mt-4 font-body text-xs text-white border border-white/20 rounded-full px-5 py-2.5 hover:border-white/40 transition-colors min-h-[44px]"
              >
                Close
              </button>
            </div>
          )}

          {/* Verification stands in the way — say so before they fill in a
              form the server is going to refuse. */}
          {!paused && blockedByIdentity && (
            <div className="rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] p-5 text-center">
              <p className="font-body text-white text-sm font-medium mb-2">
                {payout?.identity_verified
                  ? "Add your payout account first"
                  : "Verify your identity first"}
              </p>
              <p className="font-body text-white/55 text-xs leading-relaxed mb-4">
                {payout?.pending_review
                  ? "Your account is being reviewed by our team. We will email you as soon as it is approved."
                  : payout?.identity_verified
                    ? "Add the bank account you want to be paid into, on the Earnings page."
                    : "For your security, royalties are only paid to a verified account. It takes about two minutes, on the Earnings page."}
              </p>
              <button
                onClick={onClose}
                className="font-body text-xs text-white bg-[#C30100] rounded-full px-5 py-2.5 hover:bg-[#a80000] transition-colors min-h-[44px]"
              >
                Take me there
              </button>
            </div>
          )}

          {/* ── Step 1: Amount + Bank details ── */}
          {!paused && !blockedByIdentity && step === "amount" && (
            <div className="flex flex-col gap-4">

              {/* Amount */}
              <Field label="Amount (USD)">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); clearPreview(); }}
                  placeholder="Enter amount"
                  className={inputCls}
                />
              </Field>

              {/* Target currency.
                  Changing either this or the amount discards the preview. The OTP and the
                  withdrawal below are sent with the CURRENT amount/currency, so leaving a
                  stale preview up means the artist confirms one figure and we submit
                  another — switching NGN → USD kept the naira numbers on screen. */}
              <Field label="Target Currency">
                <select
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value); clearPreview(); }}
                  className={selectCls}
                >
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="GBP">British Pounds (GBP)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </Field>

              {/* The destination. Shown, not asked for, once an account is verified —
                  it is the whole point of having added one. */}
              {savedAccount ? (
                <Field label="Paid into">
                  <div className="rounded-xl border border-white/[0.08] bg-[#0E0808] px-4 py-3">
                    <p className="font-body text-white text-sm font-medium">
                      {savedAccount.account_name}
                    </p>
                    <p className="font-body text-white/50 text-xs mt-0.5">
                      {savedAccount.bank_name} · ••••{savedAccount.account_number.slice(-4)}
                    </p>
                  </div>
                  <p className="font-body text-white/30 text-[11px] mt-1.5">
                    Change this on the Earnings page, under Payout Account.
                  </p>
                </Field>
              ) : !payoutChecked ? (
                <div className="h-[92px] rounded-xl border border-white/[0.06] bg-[#0E0808] animate-pulse" aria-hidden />
              ) : (
                <>
                  {/* Bank — searchable, because the Nigerian list runs past a
                      hundred entries once microfinance banks are included. */}
                  <BankSelect
                    banks={banks}
                    value={bankCode}
                    onChange={setBankCode}
                    isLoading={banksLoading}
                  />

                  {/* Account number */}
                  <Field label="Account Number">
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="10-digit account number"
                      className={inputCls}
                    />
                    {isVerifying && <p className="font-body text-white/30 text-xs mt-1">Verifying account...</p>}
                    {accountName && (
                      <p className="font-body text-green-400 text-xs mt-1">{accountName}</p>
                    )}
                  </Field>
                </>
              )}

              {/* Preview button */}
              <button
                onClick={handlePreview}
                disabled={!amountNum || belowMinimum || !destinationReady || isLoadingPreview}
                className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3 hover:border-white/40 transition-colors disabled:opacity-40"
              >
                {isLoadingPreview ? "Loading preview..." : "Preview Withdrawal"}
              </button>

              {belowMinimum && <p className="font-body text-[#C30100] text-xs text-center">Minimum withdrawal amount is $50 USD</p>}

              {previewError && <p className="font-body text-[#C30100] text-xs text-center">{previewError}</p>}

              {/* Preview breakdown */}
              {preview && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] p-4 flex flex-col gap-2">
                  {(() => {
                    const money = (n?: number) =>
                      typeof n === "number" ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

                    // Label from the response, never from the live dropdown. These figures
                    // were computed for preview.target_currency; tagging them with whatever
                    // the select happens to hold is how naira amounts ended up labelled USD.
                    const cur = preview.target_currency ?? currency;

                    const rows: { label: string; value: string; muted?: boolean }[] = [
                      { label: "Amount", value: `$${money(preview.amount_usd)}` },
                      {
                        label: `Conversion fee (${preview.conversion_fee_percentage ?? 1}%)`,
                        value: `-$${money(preview.conversion_fee_usd)}`,
                      },
                      {
                        label: "Exchange rate",
                        value: `1 USD = ${money(preview.exchange_rate)} ${cur}`,
                      },
                      {
                        label: "Converted amount",
                        value: `${money(preview.estimated_amount)} ${cur}`,
                      },
                    ];


                    if ((preview.transfer_fee_vat ?? 0) > 0) {
                      rows.push(
                        {
                          label: "Transfer fee",
                          value: `-${money(preview.transfer_fee_base)} ${cur}`,
                        },
                        {
                          label: `VAT on transfer fee (${preview.transfer_fee_vat_rate}%)`,
                          value: `-${money(preview.transfer_fee_vat)} ${cur}`,
                          muted: true,
                        },
                        {
                          label: "Transfer fee total",
                          value: `-${money(preview.transfer_fee_local)} ${cur}`,
                        },
                      );
                    } else {
                      rows.push({
                        label: "Transfer fee",
                        value: `-${money(preview.transfer_fee_local)} ${cur}`,
                      });
                    }

                    return rows.map(({ label, value, muted }) => (
                      <div key={label} className="flex items-center justify-between">
                        <p className={muted ? "font-body text-white/35 text-[11px] pl-3" : "font-body text-white/50 text-xs"}>
                          {label}
                        </p>
                        <p className={muted ? "font-body text-white/60 text-[11px]" : "font-body text-white text-xs font-medium"}>
                          {value}
                        </p>
                      </div>
                    ));
                  })()}
                  <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between">
                    <p className="font-body text-white/70 text-xs font-semibold">You Receive</p>
                    {/* Green: this is the one line in the breakdown that is money arriving,
                        not money leaving. Brand red read as a deduction like the rows above
                        it — and #C30100 is 2.98:1 on this background besides. */}
                    <p className="font-heading text-green-400 text-sm font-bold">
                      {typeof preview.estimated_amount_after_transfer_fee === "number"
                        ? preview.estimated_amount_after_transfer_fee.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "—"} {preview.target_currency ?? currency}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={!preview || isLoadingOtp || !destinationName}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
                >
                  {isLoadingOtp ? "Sending OTP..." : "Continue"}
                </button>
              </div>
              {otpError && <p className="font-body text-[#C30100] text-xs text-center">{otpError}</p>}
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {!paused && step === "otp" && (
            <div className="flex flex-col gap-4">
              <p className="font-body text-white/60 text-sm text-center leading-relaxed">
                A one-time password has been sent to your registered email/phone. Enter it below to complete your withdrawal.
              </p>

              <Field label="OTP Code">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className={inputCls}
                />
              </Field>

              {withdrawError && <p className="font-body text-[#C30100] text-xs text-center">{withdrawError}</p>}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep("amount")} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={otp.length < 6 || isLoadingWithdraw}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
                >
                  {isLoadingWithdraw ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors";
const selectCls = "w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors";

/* Pause bars, not a warning triangle — nothing has gone wrong here. */
function PauseNoticeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="10" y1="9" x2="10" y2="15" />
      <line x1="14" y1="9" x2="14" y2="15" />
    </svg>
  );
}

function CloseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}