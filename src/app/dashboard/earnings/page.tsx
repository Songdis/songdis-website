"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WithdrawModal from "@/components/dashboard/earnings/WithdrawModal";
import { useEarningsBalance, useWithdrawalHistory } from "@/lib/hooks/useEarnings";
import { useSplitEarnings } from "@/lib/hooks/useSplit";
import { MOCK_EARNINGS } from "@/app/mock/earnings";


/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, icon, highlight }: {
  label: string; value: string; icon: string; highlight?: boolean;
}) {
  return (
    <div className={["rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
      highlight ? "border-[#C30100]/40 bg-[#C30100]/10" : "border-white/[0.06] bg-[#180F0F]"].join(" ")}>
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center relative">
          <Image src={icon} alt={label} width={16} height={16} unoptimized />
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

/* ─── Revenue bar ─────────────────────────────────────────────── */
function RevenueBar({ platform, percentage, color }: { platform: string; percentage: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-body text-white/60 text-xs w-28 shrink-0">{platform}</p>
      <div className="flex-1 h-3 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
      <p className="font-body text-white/50 text-xs w-8 text-right shrink-0">{percentage}%</p>
    </div>
  );
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

/* ─── Page ────────────────────────────────────────────────────── */
export default function EarningsPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  /* Real API data */
  const { totalBalance, thisMonth, fromReleases, fromSplits, isLoading: balanceLoading, refresh: refreshBalance } = useEarningsBalance();
  const { history, isLoading: historyLoading } = useWithdrawalHistory();

  /* Still mock — split earnings and revenue by platform need dedicated endpoints */
  const { revenueByPlatform, withdrawalInfo } = MOCK_EARNINGS;
  const { earnings: splitEarningsData, isLoading: splitsLoading } = useSplitEarnings();

  return (
    <DashboardLayout customCta={{ label: "Withdraw Funds", onClick: () => setWithdrawOpen(true) }}>
      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Balance"  value={balanceLoading ? "..." : fmt(totalBalance)}  icon="/images/balance.svg"  highlight />
          <StatCard label="This Month"     value={balanceLoading ? "..." : fmt(thisMonth)}     icon="/images/month.svg" />
          <StatCard label="From Releases"  value={balanceLoading ? "..." : fmt(fromReleases)}  icon="/images/releases.svg" />
          <StatCard label="From Splits"    value={balanceLoading ? "..." : fmt(fromSplits)}    icon="/images/splits.svg" />
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <span className="font-heading text-white text-sm uppercase tracking-wide">Ayo AI · Earnings Insight</span>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
            Your per-stream rate reflects early stage streaming. Once your releases hit curated playlists, expect significant growth. Spotify editorial placements average $0.003–$0.005/stream.
          </p>
          <button className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
            Get playlist placement
          </button>
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
          <div className="flex items-center justify-between mb-1">
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

        {/* Revenue by Platform — still mock */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-5">Revenue by platform</p>
          <div className="flex flex-col gap-3">
            {revenueByPlatform.map((p) => <RevenueBar key={p.platform} {...p} />)}
          </div>
        </div>

        {/* Transaction History — real API */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-4">Transaction History</p>
          {historyLoading ? (
            <p className="font-body text-white/30 text-sm text-center py-6">Loading transactions...</p>
          ) : history.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-6">No transactions yet.</p>
          ) : (
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
                      {new Date(tx.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}
                      <span className={tx.status === "completed" ? "text-green-400" : "text-yellow-400"}>
                        {tx.status}
                      </span>
                    </p>
                  </div>
                  <p className="font-heading text-[#C30100] text-sm font-bold">
                    {fmt(tx.amount_usd)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {withdrawOpen && (
        <WithdrawModal
          availableBalance={totalBalance}
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
          <div className="relative z-10 w-full max-w-[440px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8 text-center">
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

function ChevronRightIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
}