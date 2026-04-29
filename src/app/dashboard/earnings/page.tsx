"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WithdrawModal from "@/components/dashboard/earnings/WithdrawModal";
import { SuccessModal } from "@/components/auth/SuccessModal";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MOCK_EARNINGS } from "@/app/mock/earnings";

/* ─── Stat card ───────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string; // path to Figma SVG in /public/icons/earnings/
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 flex flex-col gap-3 relative overflow-hidden",
        highlight
          ? "border-[#C30100]/40 bg-[#C30100]/10"
          : "border-white/[0.06] bg-[#180F0F]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <p className="font-body text-white/60 text-xs">{label}</p>
       
        <div className="w-12 h-12 flex items-center justify-center relative">
          <Image src={icon} alt={label} width={66} height={66} unoptimized />
        </div>
      </div>
      <p className="font-heading text-white text-2xl font-bold">{value}</p>
      {highlight && (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{
            background: "radial-gradient(circle at bottom right, rgba(195,1,0,0.4) 0%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />
      )}
    </div>
  );
}

/* ─── Revenue bar ─────────────────────────────────────────────── */
function RevenueBar({
  platform,
  percentage,
  color,
}: {
  platform: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-body text-white/60 text-xs w-28 shrink-0">{platform}</p>
      <div className="flex-1 h-3 bg-white/[0.05] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="font-body text-white/50 text-xs w-8 text-right shrink-0">{percentage}%</p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function EarningsPage() {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const { totalBalance, thisMonth, fromReleases, fromSplits, splitEarnings, revenueByPlatform, transactions, withdrawalInfo } = MOCK_EARNINGS;

  return (
    <DashboardLayout userName="VJazzy" customCta={{ label: "Withdraw Funds", onClick: () => setWithdrawOpen(true) }}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Balance"  value={`$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}  icon="/images/balance.svg"  highlight />
          <StatCard label="This month"     value={`$${thisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}     icon="/images/month.svg" />
          <StatCard label="From Releases"  value={`$${fromReleases.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}  icon="/images/releases.svg" />
          <StatCard label="From Splits"    value={`${fromSplits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}     icon="/images/splits.svg" />
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-white text-sm uppercase tracking-wide">Ayo AI · Earnings Insight</span>
            </div>
          </div>
          <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
            Your per-stream rate of $0.00 reflects very early stage streaming. Once "Scatter the Place" hits a curated playlist, expect this to jump significantly. Spotify editorial placements average $0.003–$0.005/stream. At your current trajectory, a playlist placement could add $150–400 next month.
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

        {/* Split Earnings */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="font-body text-white text-sm font-medium">Split Earnings</p>
              <span className="font-body text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                {splitEarnings.releases.length} Active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-body text-white/50 text-xs">
                Total Shared: <span className="text-[#C30100] font-semibold">${splitEarnings.totalShared.toLocaleString()}</span>
              </p>
              <button className="font-body text-white/60 text-xs border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors hover:text-white">
                View Breakdown <ChevronRightIcon />
              </button>
            </div>
          </div>
          <p className="font-body text-white/40 text-xs mb-5">
            Revenue shared with collaborators across your catalog. Your portion is paid directly to your wallet
          </p>

          {splitEarnings.releases.map((release) => (
            <div key={release.id} className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
              {/* Release row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={release.cover} alt={release.title} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="font-body text-white text-sm font-medium">{release.title}</p>
                    <p className="font-body text-white/40 text-xs">{release.collaborators} Collaborators</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Donut chart */}
                  <div className="w-12 h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={release.breakdown}
                          dataKey="split"
                          cx="50%"
                          cy="50%"
                          innerRadius={14}
                          outerRadius={22}
                          strokeWidth={0}
                        >
                          {release.breakdown.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-right">
                    <p className="font-heading text-[#C30100] text-sm font-bold">${release.amount.toLocaleString()}</p>
                    <p className="font-body text-white/40 text-xs">Your {release.yourShare}%</p>
                  </div>
                </div>
              </div>

              {/* Collaborator table */}
              <div className="border-t border-white/[0.05] pt-3">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider">Collaborators</p>
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Role</p>
                  <p className="font-body text-white/30 text-[10px] uppercase tracking-wider text-right">Earned Split</p>
                </div>
                {release.breakdown.map((collab) => (
                  <div key={collab.name} className="grid grid-cols-3 gap-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: collab.color }} />
                      <span className="font-body text-white text-xs">
                        {collab.name} {collab.isYou && <span className="text-white/40">(You)</span>}
                      </span>
                    </div>
                    <p className="font-body text-white/60 text-xs text-right">{collab.role}</p>
                    <p className="font-body text-white/60 text-xs text-right">{collab.split}%</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Revenue by Platform */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-5">Revenue by platform</p>
          <div className="flex flex-col gap-3">
            {revenueByPlatform.map((p) => (
              <RevenueBar key={p.platform} {...p} />
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <p className="font-body text-white text-sm font-medium mb-4">Transaction History</p>
          <div className="flex flex-col">
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                className={[
                  "flex items-center justify-between py-4",
                  i < transactions.length - 1 ? "border-b border-white/[0.05]" : "",
                ].join(" ")}
              >
                <div>
                  <p className="font-body text-white text-sm">{tx.label}</p>
                  <p className="font-body text-white/40 text-xs mt-0.5">{tx.date}</p>
                </div>
                <p className="font-heading text-[#C30100] text-sm font-bold">
                  ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Withdraw modal */}
      {withdrawOpen && (
        <WithdrawModal
          availableBalance={totalBalance}
          onClose={() => setWithdrawOpen(false)}
          onRequestOtp={() => {
            setWithdrawOpen(false);
            setOtpSuccess(true);
          }}
        />
      )}

      <SuccessModal
        isOpen={otpSuccess}
        onClose={() => setOtpSuccess(false)}
        title="OTP Sent!"
        description="A one-time password has been sent to your registered phone number. Enter it to complete your withdrawal."
        ctaLabel="OK"
        onCta={() => setOtpSuccess(false)}
      />
    </DashboardLayout>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}