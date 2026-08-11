"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WithdrawModal from "@/components/dashboard/earnings/WithdrawModal";
import PayoutAccountCard from "@/components/dashboard/earnings/PayoutAccountCard";
import { useEarningsBalance, useWithdrawalHistory } from "@/lib/hooks/useEarnings";
import { useSplitEarnings } from "@/lib/hooks/useSplit";
import { WITHDRAWALS_PAUSED_FALLBACK } from "@/lib/api/earnings";
import type { PayoutStatus } from "@/lib/api/payout";
import { MOCK_EARNINGS } from "@/app/mock/earnings";


function StatCard({ label, value, icon, highlight }: {
  label: string; value: string; icon: string; highlight?: boolean;
}) {
  return (
    <div className={["rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center relative">
          <Image src={icon} alt={label} width={66} height={66} unoptimized />
        </div>
      </div>
      <p className="font-heading text-white text-2xl font-bold">{value}</p>
      {highlight && (
        <div aria-hidden className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)", filter: "blur(12px)" }} />
      )}
    </div>
  );
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function EarningsPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const {
    availableBalance, totalEarnings, thisMonth, fromSplits,
    withdrawalsPaused: balanceSaysPaused,
    withdrawalsPausedMessage,
    isLoading: balanceLoading,
    refresh: refreshBalance,
  } = useEarningsBalance();


  const [pausedMidFlow, setPausedMidFlow] = useState<string | null>(null);

  const withdrawalsPaused = balanceSaysPaused || pausedMidFlow !== null;

  const pauseMessage =
    pausedMidFlow ?? withdrawalsPausedMessage ?? WITHDRAWALS_PAUSED_FALLBACK;

  const handlePaused = (message: string) => {
    setPausedMidFlow(message);
    refreshBalance();
  };

  /*
   * Reported up by PayoutAccountCard rather than fetched again here, so the button and the
   * card can never disagree — and so adding an account enables the button immediately
   * instead of on the next page load.
   */
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus | null>(null);

  /**
   * Why the Withdraw button is closed, or undefined if it is open.
   *
   * There is no point opening a form that cannot end in a payout: the server refuses a
   * bank transfer with no saved account. An unknown status (the lookup failed) does not
   * block — a network blip should not lock someone out of their own money.
   */
  const payoutBlockReason = ((): string | undefined => {
    if (!payoutStatus || payoutStatus.account) return undefined;

    if (payoutStatus.pending_review) {
      return "Your payout account is being reviewed. We will email you as soon as it is approved.";
    }

    // Nowhere to send them — the card hides itself in this state, so do not point at it.
    if (!payoutStatus.provider_ready && !payoutStatus.identity_verified) {
      return "Identity checks are unavailable right now. Please try again shortly.";
    }

    return payoutStatus.identity_verified
      ? "Add the payout account your royalties go to, under Payout Account below."
      : "Verify your identity under Payout Account below, then add the account your royalties go to.";
  })();

  const withdrawBlocked = withdrawalsPaused || payoutBlockReason !== undefined;
  const { history, isLoading: historyLoading, page: txPage, totalPages: txTotalPages, goToPage: txGoToPage } = useWithdrawalHistory(10);

  const { withdrawalInfo } = MOCK_EARNINGS;
  const { earnings: splitEarningsData, isLoading: splitsLoading } = useSplitEarnings();

  return (
    <DashboardLayout
      pageTitle="Earnings"
      customCta={{
        label: "Withdraw Funds",
        onClick: () => { if (!withdrawBlocked) setWithdrawOpen(true); },
        disabled: withdrawBlocked,
        disabledReason: withdrawalsPaused
          ? `Withdrawals are paused. ${pauseMessage}`
          : payoutBlockReason,
      }}
    >
      <div className="flex flex-col gap-5">

        <div role="status" aria-live="polite">
          {withdrawalsPaused && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-4 sm:p-5 flex items-start gap-3">
              <span aria-hidden className="text-amber-400 shrink-0 mt-0.5">
                <PauseNoticeIcon />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-white uppercase text-xs sm:text-sm tracking-wide mb-1.5">
                  Withdrawals are paused
                </p>
                <p className="font-body text-white/75 text-xs sm:text-sm leading-relaxed">
                  {pauseMessage}
                </p>
                <p className="font-body text-white/40 text-[11px] sm:text-xs leading-relaxed mt-2">
                  Your balance and transaction history are unchanged. Withdrawing switches
                  back on by itself as soon as the pause is lifted.
                </p>
              </div>
            </div>
          )}

          {/* A dimmed button carries no reason on a phone, where there is no hover title.
              Say it on the page instead, or the button just looks broken. Only one notice
              at a time — a pause outranks a missing account, since it blocks either way. */}
          {!withdrawalsPaused && payoutBlockReason && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#180F0F] p-4 sm:p-5 flex items-start gap-3">
              <span aria-hidden className="text-[#E5342F] shrink-0 mt-0.5">
                <PauseNoticeIcon />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-white uppercase text-xs sm:text-sm tracking-wide mb-1.5">
                  Before you can withdraw
                </p>
                <p className="font-body text-white/75 text-xs sm:text-sm leading-relaxed">
                  {payoutBlockReason}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
           <StatCard label="Available Balance"  value={balanceLoading ? "..." : fmt(availableBalance)}  icon="/images/balance.svg"  highlight />
           <StatCard label="Total Earnings"  value={balanceLoading ? "..." : fmt(totalEarnings)}  icon="/images/releases.svg" />
          <StatCard label="From Splits"    value={balanceLoading ? "..." : fmt(fromSplits)}    icon="/images/splits.svg" />
        </div>

        <PayoutAccountCard onStatusChange={setPayoutStatus} />

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <span className="font-heading text-white text-sm uppercase tracking-wide">Ayo AI · Earnings Insight</span>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
            {balanceLoading
              ? "Loading your earnings data..."
              : totalEarnings > 0
                ? `You've earned a total of ${fmt(totalEarnings)} from your releases${fromSplits > 0 ? `, plus ${fmt(fromSplits)} from splits` : ""}. Your available balance is ${fmt(availableBalance)} — ${
                    availableBalance > 0
                      ? withdrawalsPaused
                        ? "it is safe where it is while withdrawals are paused."
                        : "you can withdraw anytime from the Wallet."
                      : "keep releasing music to start earning."
                  }`
              : "Start releasing music to see your earnings grow. Every stream counts towards your balance."
            }
          </p>
          <Link href="/dashboard/ayo" className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors inline-block">
            Chat with Ayo
          </Link>
        </div>

        {/* Withdrawal Information */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <p className="font-body text-white/70 text-xs font-semibold mb-3">Withdrawal Information:</p>
          <ul className="space-y-2">
            {withdrawalInfo.map((item, i) => (
              <li key={i} className="flex items-start gap-2 font-body text-white/50 text-xs">
                <span className="text-[#C30100] shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Split Earnings — real API */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex flex-wrap items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-2">
              <p className="font-body text-white text-sm font-medium">Split Earnings</p>
              <span className="font-body text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                {splitsLoading ? "..." : `${splitEarningsData.length} Active`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-body text-white/50 text-xs">
                Your Earnings: <span className="text-[#C30100] font-semibold">
                  ${splitEarningsData.reduce((sum, e) => sum + ((e.your_earnings as number) ?? 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
          </div>
          <p className="font-body text-white/40 text-xs mb-5">
            Revenue shared with collaborators across your catalog. Your portion is paid directly to your wallet.
          </p>

          {splitsLoading ? (
            <p className="font-body text-white/30 text-sm text-center py-6">Loading split earnings...</p>
          ) : splitEarningsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="font-body text-white/30 text-sm">No split earnings yet.</p>
              <p className="font-body text-white/20 text-xs">Create a split agreement in the Splitr page to start sharing royalties.</p>
            </div>
          ) : (
            splitEarningsData.map((earning, i) => {
              const yourEarnings = (earning.your_earnings as number) ?? 0;
              const yourPct = (earning.your_percentage as number) ?? 0;
              const splitName = (earning.split_name as string) ?? `Split #${earning.split_id}`;
              return (
                <div key={earning.split_id ?? i} className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 mb-3 last:mb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-white text-sm font-medium">{splitName}</p>
                      <p className="font-body text-white/40 text-xs mt-0.5">Your share: {yourPct}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-[#C30100] text-sm font-bold">
                        ${yourEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-body text-white/40 text-xs">Your {yourPct}%</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-white text-sm font-medium">Transaction History</p>
            {txTotalPages > 1 && (
              <p className="font-body text-white/40 text-xs">Page {txPage} of {txTotalPages}</p>
            )}
          </div>
          {historyLoading ? (
            <p className="font-body text-white/30 text-sm text-center py-6">Loading transactions...</p>
          ) : history.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-6">No transactions yet.</p>
          ) : (
            <>
              <div className="flex flex-col">
                {history.map((tx, i) => (
                  <div key={tx.id}
                    className={["flex items-center justify-between py-4",
                      i < history.length - 1 ? "border-b border-white/[0.05]" : ""].join(" ")}>
                    <div>
                      <p className="font-body text-white text-sm">
                        Withdrawal — {tx.target_currency}
                      </p>
                      <p className="font-body text-white/40 text-xs mt-0.5">
                        {new Date(tx.created_at as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}
                        <span className={(tx.status as string) === "completed" ? "text-green-400" : "text-yellow-400"}>
                          {tx.status as string}
                        </span>
                      </p>
                    </div>
                    <p className="font-heading text-[#C30100] text-sm font-bold">
                      {fmt((tx.amount_usd as number) ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
              {txTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/[0.05]">
                  <button
                    onClick={() => txGoToPage(txPage - 1)}
                    disabled={txPage === 1}
                    className="font-body text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-1.5 transition-colors disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <span className="font-body text-white/30 text-xs">{txPage} / {txTotalPages}</span>
                  <button
                    onClick={() => txGoToPage(txPage + 1)}
                    disabled={txPage === txTotalPages}
                    className="font-body text-white/50 text-xs border border-white/10 hover:border-white/25 rounded-full px-4 py-1.5 transition-colors disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {withdrawOpen && (
        <WithdrawModal
          availableBalance={availableBalance}
          pausedMessage={withdrawalsPaused ? pauseMessage : null}
          onPaused={handlePaused}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={() => {
            setWithdrawOpen(false);
            setWithdrawSuccess(true);
            refreshBalance();
          }}
        />
      )}

      {withdrawSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setWithdrawSuccess(false)} />
          <div className="relative z-10 w-full max-w-[440px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-6 sm:p-8 text-center mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full border-2 border-[#C30100] flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="font-body text-white text-xl font-bold mb-3">Withdrawal Initiated!</h2>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6">
              Your withdrawal is being processed. Funds will be credited to your bank account within 1-3 business days.
            </p>
            <button
              onClick={() => setWithdrawSuccess(false)}
              className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function PauseNoticeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="10" y1="9" x2="10" y2="15" />
      <line x1="14" y1="9" x2="14" y2="15" />
    </svg>
  );
}

function ChevronRightIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
}