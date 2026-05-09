"use client";

import { useState, useEffect } from "react";
import { useWithdrawal, useBanks } from "@/lib/hooks/useEarnings";

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

  /* Auto-verify account when bank + 10-digit number selected */
  useEffect(() => {
    if (bankCode && accountNumber.length === 10) {
      verifyBankAccount(bankCode, accountNumber);
    }
  }, [bankCode, accountNumber, verifyBankAccount]);

  const amountNum = parseFloat(amount) || 0;

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

          {/* ── Step 1: Amount + Bank details ── */}
          {step === "amount" && (
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

              {/* Bank */}
              <Field label="Bank">
                {banksLoading ? (
                  <p className="font-body text-white/30 text-xs py-3">Loading banks...</p>
                ) : (
                  <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className={selectCls}>
                    <option value="">Select bank</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                )}
              </Field>

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
                disabled={!amountNum || !bankCode || accountNumber.length < 10 || isLoadingPreview}
                className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3 hover:border-white/40 transition-colors disabled:opacity-40"
              >
                {isLoadingPreview ? "Loading preview..." : "Preview Withdrawal"}
              </button>

              {previewError && <p className="font-body text-[#C30100] text-xs text-center">{previewError}</p>}

              {/* Preview breakdown */}
              {preview && (
                <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] p-4 flex flex-col gap-2">
                  {[
                    { label: "Amount (USD)",      value: `$${preview.amount_usd}` },
                    { label: "Exchange Rate",      value: `1 USD = ${preview.exchange_rate?.toLocaleString()} ${currency}` },
                    { label: "Converted Amount",   value: `${preview.converted_amount?.toLocaleString()} ${currency}` },
                    { label: "Conversion Fee",     value: `${preview.conversion_fee?.toLocaleString()} ${currency}` },
                    { label: "Transfer Fee",       value: `${preview.transfer_fee?.toLocaleString()} ${currency}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <p className="font-body text-white/50 text-xs">{label}</p>
                      <p className="font-body text-white text-xs font-medium">{value}</p>
                    </div>
                  ))}
                  <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between">
                    <p className="font-body text-white/70 text-xs font-semibold">You Receive</p>
                    <p className="font-heading text-[#C30100] text-sm font-bold">
                      {preview.will_receive?.toLocaleString()} {currency}
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

/* ─── Helpers ─────────────────────────────────────────────────── */
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