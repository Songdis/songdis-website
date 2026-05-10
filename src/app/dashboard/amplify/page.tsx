"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────────────────── */
type CampaignStatus = "active" | "paused" | "completed";
type TabType = "active" | "paused" | "completed";

interface Campaign {
  id: string;
  platforms: string;
  trackTitle: string;
  campaignType: string;
  targeting: string;
  budgetUsed: number;
  budgetTotal: number;
  reach: number;
  status: CampaignStatus;
  cover: string;
  progress: number; // 0–100
}

/* ─── Mock data ───────────────────────────────────────────────── */
const TRACKS = ["Scatter the place", "Wisdom No Dey Old", "Gratitude"];
const GOALS = ["Streams", "Followers", "Playlists", "New markets"];
const DURATIONS = ["7 days", "14 days", "30 days", "60 days", "90 days"];

const makeCampaign = (id: string, status: CampaignStatus): Campaign => ({
  id,
  platforms: "Spotify + Apple Music",
  trackTitle: "Scatter the Place",
  campaignType: "Launch Push",
  targeting: "Nigeria + UK Afrobeats",
  budgetUsed: 120,
  budgetTotal: 150,
  reach: 2400,
  status,
  cover: "/images/small-blue-cover.svg",
  progress: status === "completed" ? 100 : status === "active" ? 72 : 45,
});

const MOCK_CAMPAIGNS: Campaign[] = [
  makeCampaign("1", "active"),
  makeCampaign("2", "active"),
  makeCampaign("3", "active"),
  makeCampaign("4", "active"),
  makeCampaign("5", "paused"),
  makeCampaign("6", "paused"),
  makeCampaign("7", "paused"),
  makeCampaign("8", "paused"),
  makeCampaign("9", "completed"),
  makeCampaign("10", "completed"),
  makeCampaign("11", "completed"),
  makeCampaign("12", "completed"),
];

/* ─── Status config ───────────────────────────────────────────── */
const STATUS_STYLE: Record<CampaignStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)" },
  paused:    { label: "Paused",    color: "#f97316", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.25)" },
  completed: { label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)" },
};

/* ─── New Campaign Modal ──────────────────────────────────────── */
function NewCampaignModal({
  onClose,
  onLaunch,
}: {
  onClose: () => void;
  onLaunch: () => void;
}) {
  const [track, setTrack] = useState("Scatter the place");
  const [goals, setGoals] = useState<string[]>(["Streams"]);
  const [budget, setBudget] = useState("");
  const [duration, setDuration] = useState("7 days");

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[600px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-8">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        <h2 className="font-heading text-white uppercase text-xl tracking-wide text-center mb-7">
          New Campaign
        </h2>

        <div className="flex flex-col gap-5">
          {/* Track */}
          <div>
            <label className="font-body text-white/70 text-xs block mb-1.5">Track</label>
            <div className="relative">
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
              >
                {TRACKS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <ChevronIcon />
            </div>
          </div>

          {/* Goals (multi-select chips) */}
          <div>
            <label className="font-body text-white/70 text-xs block mb-2">Goal</label>
            <div className="flex gap-2 flex-wrap">
              {GOALS.map((goal) => {
                const active = goals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={[
                      "font-body text-sm rounded-full px-4 py-2 border transition-all",
                      active
                        ? "border-[#C30100] bg-[#C30100]/10 text-white"
                        : "border-white/15 text-white/50 hover:border-white/30",
                    ].join(" ")}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Budget (USD)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Enter budget"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
              />
            </div>
            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Duration</label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
                >
                  {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
                <ChevronIcon />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onLaunch}
              disabled={!budget || goals.length === 0}
              className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Campaign card ───────────────────────────────────────────── */
function CampaignCard({
  campaign,
  onPause,
  onResume,
  onCancel,
  onRerun,
}: {
  campaign: Campaign;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRerun?: () => void;
}) {
  const style = STATUS_STYLE[campaign.status];

  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      {/* Platforms */}
      <p className="font-body text-white/40 text-xs mb-3">{campaign.platforms}</p>

      {/* Track + cover */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <Image src={campaign.cover} alt={campaign.trackTitle} fill className="object-cover" unoptimized />
        </div>
        <div>
          <p className="font-body text-white text-sm font-medium">{campaign.trackTitle}</p>
          <p className="font-body text-white/40 text-xs">{campaign.campaignType}</p>
        </div>
      </div>

      {/* Targeting */}
      <p className="font-body text-white/50 text-xs mb-1">{campaign.targeting}</p>

      {/* Budget */}
      <p className="font-body text-white/50 text-xs mb-3">
        Budget: ${campaign.budgetUsed}/${campaign.budgetTotal}
      </p>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${campaign.progress}%`,
            backgroundColor: style.color,
          }}
        />
      </div>

      {/* Status + actions row */}
      <div className="flex items-center justify-between">
        <span
          className="font-body text-[10px] rounded-full px-2.5 py-1 border"
          style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
        >
          {style.label}
        </span>

        <div className="flex items-center gap-2">
          {/* Reach */}
          <span className="font-body text-white/30 text-[10px] mr-2">
            Reach: {campaign.reach.toLocaleString()}
          </span>

          {/* Active: Pause + Cancel */}
          {campaign.status === "active" && (
            <>
              <button
                onClick={onPause}
                className="flex items-center gap-1 font-body text-white/60 text-[10px] border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white"
              >
                <PauseIcon /> Pause
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-1 font-body text-[10px] rounded-full px-3 py-1.5 transition-colors border"
                style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.08)", borderColor: "rgba(195,1,0,0.25)" }}
              >
                <XIcon /> Cancel
              </button>
            </>
          )}

          {/* Paused: Resume + Cancel */}
          {campaign.status === "paused" && (
            <>
              <button
                onClick={onResume}
                className="flex items-center gap-1 font-body text-white/60 text-[10px] border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white"
              >
                <PlayIcon /> Resume
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-1 font-body text-[10px] rounded-full px-3 py-1.5 transition-colors border"
                style={{ color: "#C30100", backgroundColor: "rgba(195,1,0,0.08)", borderColor: "rgba(195,1,0,0.25)" }}
              >
                <XIcon /> Cancel
              </button>
            </>
          )}

          {/* Completed: Re-run */}
          {campaign.status === "completed" && (
            <button
              onClick={onRerun}
              className="flex items-center gap-1 font-body text-white/60 text-[10px] border border-white/10 hover:border-white/25 rounded-full px-3 py-1.5 transition-colors hover:text-white"
            >
              <RerunIcon /> Re-run
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function AmplifyPage() {
  const [tab, setTab] = useState<TabType>("active");
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [showNew, setShowNew] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filtered = campaigns.filter((c) => c.status === tab);

  const updateStatus = (id: string, status: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const cancelCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const stats = {
    active: campaigns.filter((c) => c.status === "active").length,
    totalReach: campaigns.reduce((sum, c) => sum + c.reach, 0),
    budgetUsed: campaigns.reduce((sum, c) => sum + c.budgetUsed, 0),
  };

  return (
    <DashboardLayout
      customCta={{ label: "+ New Campaign", onClick: () => setShowNew(true) }}
    >
      <div className="flex flex-col gap-5">

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Active Campaigns",
              value: stats.active,
              icon: "/images/active.svg",
              highlight: true,
            },
            {
              label: "Total Reach",
              value: `${(stats.totalReach / 1000).toFixed(1)}K`,
              icon: "/images/total-reach.svg",
            },
            {
              label: "Budget Used",
              value: `$${stats.budgetUsed}`,
              icon: "/images/budget.svg",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={[
                "rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden",
                s.highlight
                  ? "border-[#C30100]/40 bg-[#C30100]/10"
                  : "border-white/[0.06] bg-[#180F0F]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <p className="font-body text-white/60 text-xs">{s.label}</p>
               
                <div className="w-12 h-12 rounded-lg  flex items-center justify-center">
                  <Image src={s.icon} alt={s.label} width={66} height={66} unoptimized />
                </div>
              </div>
              <p className="font-heading text-white text-3xl font-bold">{s.value}</p>
              {s.highlight && (
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
          ))}
        </div>

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div>
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">
                Ayo AI · Promotion Insight
              </p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                Based on your streaming data, your Nigerian audience is your strongest segment. A targeted $50 TikTok campaign for "Scatter the Place" aimed at Lagos + UK Afrobeats listeners would likely yield 800–1,400 new listeners this week. This is your highest ROI opportunity right now.
              </p>
              <Link href="/dashboard/ayo" className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                Launch recommended campaign
              </Link>
            </div>
          </div>
        </div>

        {/* Tab nav + campaign list */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          {/* Tabs */}
          <div className="flex gap-6 mb-5 border-b border-white/[0.05] pb-3">
            {(["active", "paused", "completed"] as TabType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "font-heading uppercase text-sm tracking-wide pb-1 border-b-2 transition-all",
                  tab === t
                    ? "text-white border-white"
                    : "text-white/40 border-transparent hover:text-white/70",
                ].join(" ")}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Campaign list */}
          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <p className="font-body text-white/30 text-sm text-center py-8">
                No {tab} campaigns.
              </p>
            ) : (
              filtered.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onPause={() => updateStatus(campaign.id, "paused")}
                  onResume={() => updateStatus(campaign.id, "active")}
                  onCancel={() => cancelCampaign(campaign.id)}
                  onRerun={() => setShowNew(true)}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* New Campaign Modal */}
      {showNew && (
        <NewCampaignModal
          onClose={() => setShowNew(false)}
          onLaunch={() => {
            setShowNew(false);
            setShowSuccess(true);
          }}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Campaign launched successfully"
        description="Your campaign is now active. Monitor results in real time"
        ctaLabel="Done"
        onCta={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function ChevronIcon() { return <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>; }
function PauseIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function PlayIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function XIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function RerunIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>; }