"use client";

import { useState } from "react";

interface WithdrawModalProps {
  availableBalance: number;
  onClose: () => void;
  onRequestOtp: () => void;
}

const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "Stanbic IBTC", "Wema Bank", "FCMB", "Ecobank", "Keystone Bank",
];

const CURRENCIES = ["Nigerian Naira", "US Dollar", "British Pounds", "Euro"];

export default function WithdrawModal({
  availableBalance,
  onClose,
  onRequestOtp,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState("50");
  const [currency, setCurrency] = useState("Nigerian Naira");
  const [bank, setBank] = useState("Access Bank");
  const [accountNumber, setAccountNumber] = useState("9087643219");
  const [previewed, setPreviewed] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const conversionFee = amountNum * 0.01;
  const afterFee = amountNum - conversionFee;
  const exchangeRate = 1500;
  const convertedAmount = afterFee * exchangeRate;
  const transferFee = 14000;
  const willReceive = convertedAmount - transferFee;

  const isNGN = currency === "Nigerian Naira";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[620px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10">
          <CloseIcon />
        </button>

        <div className="p-7">
          <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-6">
            Withdraw Funds
          </h2>

          <div className="flex flex-col gap-4">
            {/* Amount */}
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setPreviewed(false); }}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
              />
              <p className="font-body text-white/30 text-xs mt-1">
                Available: ${availableBalance.toLocaleString()} · Minimum withdrawal is $50.00
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Receive in currency</label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => { setCurrency(e.target.value); setPreviewed(false); }}
                  className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
                >
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <ChevronIcon />
              </div>
            </div>

            {/* Instant transfer notice */}
            {isNGN && (
              <div className="border border-dashed border-[#C30100]/30 rounded-xl px-4 py-3">
                <p className="font-body text-white text-xs font-semibold mb-1">Instant Transfer</p>
                <p className="font-body text-white/50 text-xs">
                  NGN (Naira) withdrawals are processed instantly (subject to network conditions)
                </p>
              </div>
            )}

            {/* Bank */}
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Select Bank</label>
              <div className="relative">
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
                >
                  {NIGERIAN_BANKS.map((b) => <option key={b}>{b}</option>)}
                </select>
                <ChevronIcon />
              </div>
            </div>

            {/* Account number */}
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter account number"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
              />
            </div>

            {/* Preview button */}
            <button
              onClick={() => setPreviewed(true)}
              className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-3.5 transition-all"
            >
              Preview Exchange
            </button>

            {/* Withdrawal summary */}
            {previewed && (
              <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <p className="font-body text-white/60 text-xs font-semibold">Withdrawal Summary</p>
                </div>
                {[
                  { label: "Amount (USD)",        value: `$${amountNum.toFixed(2)}`,              highlight: false },
                  { label: "Conversion fee (1%)", value: `$${conversionFee.toFixed(2)}`,          highlight: true  },
                  { label: "After conversion fee",value: `$${afterFee.toFixed(2)}`,               highlight: false },
                  { label: "Exchange rate",        value: `X ${exchangeRate.toLocaleString()}.00 NGN`, highlight: false },
                  { label: "Converted amount",     value: `₦${convertedAmount.toLocaleString()}`, highlight: false },
                  { label: "Transfer fee",         value: `₦${transferFee.toLocaleString()}`,     highlight: true  },
                  { label: "You will receive",     value: `₦${Math.max(willReceive, 0).toLocaleString()}`, highlight: false, bold: true },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className={`font-body text-xs ${row.bold ? "text-white font-semibold" : "text-white/50"}`}>{row.label}</span>
                    <span className={`font-body text-xs font-medium ${row.highlight ? "text-[#C30100]" : row.bold ? "text-white text-sm font-bold" : "text-white"}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
                <p className="font-body text-white/30 text-[10px] px-4 py-2">
                  Exchange rate is current as of now. Final amount determined at processing time
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onRequestOtp}
                disabled={!previewed || amountNum < 50}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Request OTP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }