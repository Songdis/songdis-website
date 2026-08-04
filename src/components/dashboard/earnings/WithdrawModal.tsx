"use client";

import { useState, useEffect } from "react";
import { useWithdrawal, useBanks } from "@/lib/hooks/useEarnings";
import { getPayoutStatus, type PayoutStatus } from "@/lib/api/payout";
import BankSelect from "./BankSelect";

type Step = "amount" | "otp" | "done";

interface Props {
  availableBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawModal({ availableBalance, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [otp, setOtp] = useState("");

  const {
    preview, fetchPreview, isLoadingPreview, previewError,
    fetchOtp, isLoadingOtp, otpError,
    withdraw, isLoadingWithdraw, withdrawError,
    accountName, verifyBankAccount, isVerifying,
  } = useWithdrawal();

  const { banks, isLoading: banksLoading } = useBanks(currency);

  /*
   * Whether identity verification stands between them and a payout.
   *
   * Checked here as well as on the server so an artist is told before filling
   * the form in, rather than after entering an amount and a bank account.
   */
  const [payout, setPayout] = useState<PayoutStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPayoutStatus().then((res) => {
      if (!cancelled && !res.error && res.data) setPayout(res.data);
    });

    return () => { cancelled = true; };
  }, []);

  const blockedByIdentity = payout !== null && payout.enforced && !payout.can_withdraw;

  /* Auto-verify account when bank + 10-digit number selected */
  useEffect(() => {
    if (bankCode && accountNumber.length === 10) {
      verifyBankAccount(bankCode, accountNumber);
    }
  }, [bankCode, accountNumber, verifyBankAccount]);

  const amountNum = parseFloat(amount) || 0;
  const belowMinimum = amountNum > 0 && amountNum < 50;

  const handlePreview = async () => {
    if (!amountNum || !bankCode || !accountNumber) return;
    await fetchPreview(amountNum, currency);
  };

  const handleSendOtp = async () => {
    await fetchOtp(amountNum, currency, () => setStep("otp"));
  };

  const handleWithdraw = async () => {
    const selectedBank = banks.find((b) => b.code === bankCode);
    await withdraw(
      {
        otp_code: otp,
        amount_usd: amountNum,
        target_currency: currency,
        payout_method: "bank_transfer",
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName ?? "",
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

          {/* Verification stands in the way — say so before they fill in a
              form the server is going to refuse. */}
          {blockedByIdentity && (
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
          {!blockedByIdentity && step === "amount" && (
            <div className="flex flex-col gap-4">

              {/* Amount */}
              <Field label="Amount (USD)">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); }}
                  placeholder="Enter amount"
                  className={inputCls}
                />
              </Field>

              {/* Target currency */}
              <Field label="Target Currency">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="GBP">British Pounds (GBP)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                </select>
              </Field>

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

              {/* Preview button */}
              <button
                onClick={handlePreview}
                disabled={!amountNum || belowMinimum || !bankCode || accountNumber.length < 10 || isLoadingPreview}
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

                    const rows: { label: string; value: string; muted?: boolean }[] = [
                      { label: "Amount", value: `$${money(preview.amount_usd)}` },
                      {
                        label: `Conversion fee (${preview.conversion_fee_percentage ?? 1}%)`,
                        value: `-$${money(preview.conversion_fee_usd)}`,
                      },
                      {
                        label: "Exchange rate",
                        value: `1 USD = ${money(preview.exchange_rate)} ${currency}`,
                      },
                      {
                        label: "Converted amount",
                        value: `${money(preview.estimated_amount)} ${currency}`,
                      },
                    ];


                    if ((preview.transfer_fee_vat ?? 0) > 0) {
                      rows.push(
                        {
                          label: "Transfer fee",
                          value: `-${money(preview.transfer_fee_base)} ${currency}`,
                        },
                        {
                          label: `VAT on transfer fee (${preview.transfer_fee_vat_rate}%)`,
                          value: `-${money(preview.transfer_fee_vat)} ${currency}`,
                          muted: true,
                        },
                        {
                          label: "Transfer fee total",
                          value: `-${money(preview.transfer_fee_local)} ${currency}`,
                        },
                      );
                    } else {
                      rows.push({
                        label: "Transfer fee",
                        value: `-${money(preview.transfer_fee_local)} ${currency}`,
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
                    <p className="font-heading text-[#C30100] text-sm font-bold">
                      {typeof preview.estimated_amount_after_transfer_fee === "number"
                        ? preview.estimated_amount_after_transfer_fee.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "—"} {currency}
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
                  disabled={!preview || isLoadingOtp || !accountName}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40"
                >
                  {isLoadingOtp ? "Sending OTP..." : "Continue"}
                </button>
              </div>
              {otpError && <p className="font-body text-[#C30100] text-xs text-center">{otpError}</p>}
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
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

function CloseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}