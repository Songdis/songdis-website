"use client";

import { useState } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────────────────── */
type TabType = "available" | "approved" | "submissions";

interface PlaylistItem {
  id: string;
  trackTitle: string;
  cover: string;
  playlistName: string;
  curatorName: string;
  addedDate?: string;
  followers?: string;
  streams?: number;
  submittedDate?: string;
  status?: "under_review" | "approved" | "rejected";
}

/* ─── Mock data ───────────────────────────────────────────────── */
const TRACKS = ["Scatter the place", "Wisdom No Dey Old", "Gratitude"];

const CURATORS = [
  "Afrobeats Daily",
  "Discovery Africa",
  "Naija Hits Now",
  "Afropop Central",
  "African Rhythms",
];

const PROMO_STRATEGIES = [
  "Social Media Campaigns",
  "Playlist Pitching",
  "Influencer Collaborations",
  "Radio Promotion",
  "Press Releases",
];

const MOCK_APPROVED: PlaylistItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `approved-${i}`,
  trackTitle: "Scatter the Place",
  cover: "/images/smallest-blue-cover.svg",
  playlistName: "Emerging Artists",
  curatorName: "Discovery Africa",
  addedDate: "Mar 8, 2026",
  followers: "44K",
  streams: 3,
}));

const MOCK_SUBMISSIONS: PlaylistItem[] = Array.from({ length: 5 }, (_, i) => ({
  id: `sub-${i}`,
  trackTitle: "Scatter the Place",
  cover: "/images/smallest-blue-cover.svg",
  playlistName: "Emerging Artists",
  curatorName: "Discovery Africa",
  submittedDate: "Mar 10, 2026",
  status: "under_review" as const,
}));

/* ─── Submit Track Modal ──────────────────────────────────────── */
function SubmitTrackModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [track, setTrack] = useState("Scatter the place");
  const [curator, setCurator] = useState("Afrobeats Daily");
  const [story, setStory] = useState("");
  const [spotify, setSpotify] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [strategies, setStrategies] = useState<string[]>([]);
  const [milestones, setMilestones] = useState("");
  const [tourDate, setTourDate] = useState("");

  const toggleStrategy = (s: string) =>
    setStrategies((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[740px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10">
          <CloseIcon />
        </button>

        <div className="p-8">
          <div className="text-center mb-7">
            <h2 className="font-heading text-white uppercase text-xl tracking-wide">Playlist Hub</h2>
            <p className="font-body text-white/50 text-sm mt-2 leading-relaxed">
              Submit your upcoming releases for priority promotion, editorial playlisting,<br />
              and partnerships on top streaming platforms.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            <Field label="Track"><SelectField value={track} onChange={setTrack} options={TRACKS} /></Field>
            <Field label="Curator"><SelectField value={curator} onChange={setCurator} options={CURATORS} /></Field>

            <Field label="Tell your story">
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value.slice(0, 1000))}
                placeholder="Share the journey behind your music..."
                rows={4}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
              />
              <p className="font-body text-white/30 text-[11px] mt-1">{story.length}/1000 Characters</p>
            </Field>

            <Field label="Spotify">
              <TextInput value={spotify} onChange={setSpotify} placeholder="Please paste your Spotify artist profile link" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Instagram"><TextInput value={instagram} onChange={setInstagram} placeholder="Instagram profile url" /></Field>
              <Field label="X (Formerly Twitter)"><TextInput value={twitter} onChange={setTwitter} placeholder="X Profile url" /></Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Facebook"><TextInput value={facebook} onChange={setFacebook} placeholder="Facebook profile url" /></Field>
              <Field label="TikTok"><TextInput value={tiktok} onChange={setTiktok} placeholder="TikTok Profile url" /></Field>
            </div>

            <div>
              <label className="font-body text-white/70 text-xs block mb-2.5">Promotional Strategies</label>
              <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                {PROMO_STRATEGIES.map((s) => (
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      onClick={() => toggleStrategy(s)}
                      className={[
                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                        strategies.includes(s) ? "border-[#C30100] bg-[#C30100]" : "border-white/20 group-hover:border-white/40",
                      ].join(" ")}
                    >
                      {strategies.includes(s) && <CheckIcon />}
                    </div>
                    <span className="font-body text-white/60 text-xs group-hover:text-white transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <Field label="Your Milestones">
              <textarea
                value={milestones}
                onChange={(e) => setMilestones(e.target.value.slice(0, 1000))}
                placeholder="Highlight your musical journey's key moments"
                rows={4}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
              />
              <p className="font-body text-white/30 text-[11px] mt-1">{milestones.length}/1000 Characters</p>
            </Field>

            <div className="border border-dashed border-[#C30100]/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-white/70 text-xs font-semibold">Upcoming Tour Date</p>
                <button className="font-body text-white/50 text-xs hover:text-white transition-colors flex items-center gap-1">
                  + Add Date
                </button>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={tourDate}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                  <CalendarIcon />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors">Cancel</button>
              <button onClick={onSubmit} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all">Submit</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="font-body text-white/70 text-xs">{label}</label>{children}</div>;
}
function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />;
}
function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

/* ─── Rows ────────────────────────────────────────────────────── */
function ApprovedRow({ item }: { item: PlaylistItem }) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <Image src={item.cover} alt={item.trackTitle} fill className="object-cover" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-white text-sm font-medium">{item.trackTitle}</p>
          <p className="font-body text-white/40 text-xs mt-0.5">Added to {item.playlistName} by {item.curatorName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-heading text-green-500 text-xl font-bold">{item.streams}</p>
          <p className="font-body text-white/30 text-[10px]">Streams</p>
        </div>
      </div>
      <p className="font-body text-white/30 text-xs mt-3">
        Added {item.addedDate} · {item.followers} playlist followers · {item.streams} streams from this placement
      </p>
    </div>
  );
}

function SubmissionRow({ item }: { item: PlaylistItem }) {
  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <Image src={item.cover} alt={item.trackTitle} fill className="object-cover" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-white text-sm font-medium">{item.trackTitle}</p>
          <p className="font-body text-white/40 text-xs mt-0.5">Added to {item.playlistName} by {item.curatorName}</p>
        </div>
        <span className="font-body text-[10px] rounded-full px-3 py-1 shrink-0 border" style={{ color: "#f97316", backgroundColor: "rgba(249,115,22,0.10)", borderColor: "rgba(249,115,22,0.25)" }}>
          Under Review
        </span>
      </div>
      <p className="font-body text-white/30 text-xs mt-3">Submitted {item.submittedDate}</p>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function PlaylistPortalPage() {
  const [tab, setTab] = useState<TabType>("approved");
  const [showSubmit, setShowSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <DashboardLayout userName="VJazzy" customCta={{ label: "+ Submit Track", onClick: () => setShowSubmit(true) }}>
      <div className="flex flex-col gap-5">

        {/* Ayo insight */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Image src="/images/ayo.svg" alt="Ayo" width={20} height={20} unoptimized />
            </div>
            <div>
              <p className="font-body text-[#C30100] text-xs font-semibold mb-2">Ayo AI · Curator Matches</p>
              <p className="font-body text-white/60 text-sm leading-relaxed mb-4">
                I found 3 high-priority curators for "Scatter the Place" — AfroBeats Daily (95% match), Discovery Africa (96% match), and Naija Hits Now (92% match). Submit to all 3 this week. I've pre-written pitches for each
              </p>
              <Link href='/dashboard/ayo' className="font-body text-white text-xs bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-4 py-2 transition-colors">
                View Ayo's pitches
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs + content */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex gap-6 mb-5 border-b border-white/[0.05] pb-3">
            {(["available","approved","submissions"] as TabType[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={["font-heading uppercase text-sm tracking-wide pb-1 border-b-2 transition-all",
                  tab === t ? "text-white border-white" : "text-white/40 border-transparent hover:text-white/70"].join(" ")}>
                {t === "available" ? "Available Curators" : t === "approved" ? "Approved" : "My Submissions"}
              </button>
            ))}
          </div>

          {tab === "available" && (
            <div className="flex flex-col gap-3">
              {CURATORS.map((curator, i) => (
                <div key={i} className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                    <div>
                      <p className="font-body text-white text-sm font-medium">{curator}</p>
                      <p className="font-body text-white/40 text-xs mt-0.5">Afrobeats · 44K followers</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSubmit(true)} className="font-body text-white text-xs border border-[#C30100]/50 bg-[#C30100]/10 hover:bg-[#C30100]/30 rounded-full px-4 py-2 transition-colors shrink-0">
                    Submit
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "approved" && (
            <div className="flex flex-col gap-3">
              {MOCK_APPROVED.map((item) => <ApprovedRow key={item.id} item={item} />)}
            </div>
          )}

          {tab === "submissions" && (
            <div className="flex flex-col gap-3">
              {MOCK_SUBMISSIONS.map((item) => <SubmissionRow key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>

      {showSubmit && (
        <SubmitTrackModal
          onClose={() => setShowSubmit(false)}
          onSubmit={() => { setShowSubmit(false); setShowSuccess(true); }}
        />
      )}

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Track Submitted!"
        description="Your track has been submitted to the curator. You'll be notified once it's been reviewed."
        ctaLabel="Done"
        onCta={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}

/* ─── Icons ───────────────────────────────────────────────────── */
function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }