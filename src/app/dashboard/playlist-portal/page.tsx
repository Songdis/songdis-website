"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import { useMusic } from "@/lib/hooks/useMusic";
import { useToast } from "@/components/ui/Toast";
import {
  getCurators,
  getPitches,
  createPitch,
  submitPitch,
  checkEligibility,
  type Curator,
  type Pitch,
  type CreatePitchPayload,
} from "@/lib/api/pitches";


type TabType = "available" | "approved" | "submissions";

const MOOD_OPTIONS   = ["chill", "energetic", "romantic", "sad", "uplifting", "party", "spiritual", "afrobeats"];
const ATTR_OPTIONS   = ["original", "cover", "remix", "live", "acoustic", "instrumental"];
const STYLE_OPTIONS  = ["acoustic", "afrobeats", "afropop", "highlife", "amapiano", "afrosoul", "dancehall", "pop"];


function PitchPortalHero({ onSubmitClick }: { onSubmitClick: () => void }) {
  const partners = [
    { name: "TIDAL Rising", sub: "TIDAL Editorial", color: "#1C2B4A", accent: "#3B6FE0", icon: <TidalIcon /> },
    { name: "Fresh Finds", sub: "Spotify Editorial", color: "#0F3D28", accent: "#1ED760", icon: <SpotifyIcon /> },
    { name: "New Music Daily", sub: "Apple Music", color: "#1A0808", accent: "#FA243C", icon: <AppleMusicIcon /> },
    { name: "Sync Placements", sub: "Netflix", color: "#1A0808", accent: "#C30100", icon: <NetflixIcon /> },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-6 sm:p-8">
      <h2 className="font-heading text-white text-2xl sm:text-3xl leading-tight mb-6">
        Get your music<br />featured
      </h2>

      {/* Stacked partner cards */}
      <div className="relative h-[180px] sm:h-[160px] mb-6">
        {partners.map((p, i) => (
          <div
            key={p.name}
            className="absolute left-0 right-0 rounded-xl border p-3.5 flex items-center gap-3 shadow-lg"
            style={{
              backgroundColor: p.color,
              borderColor: `${p.accent}55`,
              top: `${i * 34}px`,
              transform: `translateX(${i * 16}px)`,
              zIndex: i,
              maxWidth: `calc(100% - ${i * 32}px)`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: p.accent }}
            >
              {p.icon}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-white text-sm font-semibold truncate">{p.name}</p>
              <p className="font-body text-white/50 text-xs truncate">{p.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="font-body text-white/50 text-sm leading-relaxed max-w-md mb-6">
        Submit your tracks to top editorial playlists, sync opportunities, brand
        partnerships, and media placements — all in one place.
      </p>

      <div className="rounded-xl border border-dashed border-white/15 px-5 py-5 flex flex-col items-center gap-4">
        <p className="font-body text-white/50 text-sm">Best shot is 4–6 weeks before release.</p>
        <button
          onClick={onSubmitClick}
          className="font-heading text-white uppercase text-xs tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80100] px-8 py-3.5 transition-colors min-h-[48px]"
        >
          Submit Release
        </button>
      </div>
    </div>
  );
}

function TidalIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2l4 4-4 4-4-4 4-4zm-8 8l4 4-4 4-4-4 4-4zm16 0l4 4-4 4-4-4 4-4zm-8 8l4 4-4 4-4-4 4-4z"/></svg>; }
function SpotifyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.6.6 0 01-.83.2c-2.27-1.4-5.15-1.7-8.53-.93a.6.6 0 11-.27-1.17c3.7-.85 6.87-.48 9.43 1.07a.6.6 0 01.2.83zm1.2-2.7a.75.75 0 01-1.04.25c-2.6-1.6-6.56-2.07-9.63-1.13a.75.75 0 11-.44-1.44c3.53-1.07 7.9-.55 10.86 1.28a.75.75 0 01.25 1.04zm.1-2.8C15.3 9.1 9.9 8.9 6.75 9.87a.9.9 0 11-.53-1.72c3.63-1.1 9.6-.87 13.4 1.4a.9.9 0 01-.92 1.55z"/></svg>; }
function AppleMusicIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z"/></svg>; }
function NetflixIcon() { return <span className="font-heading text-white text-sm font-bold">N</span>; }


function SubmitPitchModal({
  curator,
  musicUploadId,
  onClose,
  onSuccess,
}: {
  curator: Curator;
  musicUploadId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"eligibility" | "form" | "submitting">("eligibility");
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState("");
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  const [story, setStory] = useState("");
  const [similarArtists, setSimilarArtists] = useState("");
  const [moods, setMoods] = useState<string[]>([]);
  const [attrs, setAttrs] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [hasPress, setHasPress] = useState(false);
  const [hasShows, setHasShows] = useState(false);
  const [hasVisuals, setHasVisuals] = useState(false);
  const [visualUrl, setVisualUrl] = useState("");
  const [hasAdCampaign, setHasAdCampaign] = useState(false);
  const [hasRadio, setHasRadio] = useState(false);
  const [isPartOfSchedule, setIsPartOfSchedule] = useState(false);
  const [scheduleNote, setScheduleNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { error: toastError } = useToast();

  const toggle = <T extends string>(arr: T[], val: T, set: (v: T[]) => void) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleCheckEligibility = async () => {
    setIsCheckingEligibility(true);
    const res = await checkEligibility(musicUploadId);
    setIsCheckingEligibility(false);
    if (res.error) {
      toastError("Eligibility check failed", res.error);
      return;
    }
    const d = res.data as { eligible?: boolean; reason?: string } ?? {};
    setEligible(d.eligible ?? true);
    setEligibilityReason(d.reason ?? "");
    if (d.eligible !== false) setStep("form");
  };

  const handleSubmit = async () => {
    if (!story.trim()) { toastError("Missing info", "Please write your release story."); return; }
    setIsLoading(true);

    const payload: CreatePitchPayload = {
      music_upload_id: musicUploadId,
      curator_id: curator.id,
      release_story: story,
      is_part_of_larger_schedule: isPartOfSchedule,
      larger_schedule_note: scheduleNote,
      similar_artists: similarArtists.split(",").map((s) => s.trim()).filter(Boolean),
      track_moods: moods,
      track_attributes: attrs,
      track_style: styles,
      has_press: hasPress,
      has_shows: hasShows,
      has_visual_assets: hasVisuals,
      visual_assets_url: visualUrl || undefined,
      has_ad_campaign: hasAdCampaign,
      has_radio_campaign: hasRadio,
      has_physical_product: false,
      has_other_press: false,
    };

    const createRes = await createPitch(payload);
    if (createRes.error) {
      toastError("Submission failed", createRes.error);
      setIsLoading(false);
      return;
    }

    const pitchId = (createRes.data as Pitch)?.id;
    if (pitchId) {
      await submitPitch(pitchId, {
        release_story: story,
        similar_artists: payload.similar_artists,
        track_moods: moods,
      });
    }

    setIsLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[740px] rounded-2xl bg-[#1A0808] border border-white/[0.07] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10">
          <CloseIcon />
        </button>

        <div className="p-8">
          <div className="text-center mb-7">
            <h2 className="font-heading text-white uppercase text-xl tracking-wide">Submit to {curator.name}</h2>
            <p className="font-body text-white/50 text-sm mt-2">Submit your release for editorial playlist consideration</p>
          </div>

          {/* Eligibility gate */}
          {step === "eligibility" && (
            <div className="flex flex-col items-center gap-5 py-6">
              {eligible === false ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-[#C30100]/10 border border-[#C30100]/30 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="font-heading text-white uppercase text-sm tracking-wide mb-2">Not Eligible Yet</p>
                    <p className="font-body text-white/50 text-sm leading-relaxed max-w-md">{eligibilityReason || "Your release does not meet the eligibility criteria for this curator at this time."}</p>
                  </div>
                  <button onClick={onClose} className="font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 px-8 py-3.5 hover:border-white/40 transition-colors">
                    Close
                  </button>
                </>
              ) : (
                <>
                  <p className="font-body text-white/60 text-sm text-center leading-relaxed max-w-md">
                    We&apos;ll first check if your release meets this curator&apos;s requirements before opening the submission form.
                  </p>
                  <button
                    onClick={handleCheckEligibility}
                    disabled={isCheckingEligibility}
                    className="font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-8 py-3.5 transition-all disabled:opacity-40 flex items-center gap-2"
                  >
                    {isCheckingEligibility ? <><SpinIcon /> Checking...</> : "Check Eligibility"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Pitch form */}
          {step === "form" && (
            <div className="flex flex-col gap-5">
              <Field label="Release Story" hint="Share the journey and meaning behind your music (required)">
                <textarea value={story} onChange={(e) => setStory(e.target.value.slice(0, 1000))}
                  placeholder="Share the journey behind your music..."
                  rows={4}
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none" />
                <p className="font-body text-white/30 text-[11px] mt-1">{story.length}/1000</p>
              </Field>

              <Field label="Similar Artists" hint="Comma separated — e.g. Burna Boy, Wizkid, Tems">
                <input value={similarArtists} onChange={(e) => setSimilarArtists(e.target.value)}
                  placeholder="e.g. Burna Boy, Wizkid, Tems"
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
              </Field>

              <TagSelect label="Track Moods" options={MOOD_OPTIONS} selected={moods} onToggle={(v) => toggle(moods, v, setMoods)} />
              <TagSelect label="Track Attributes" options={ATTR_OPTIONS} selected={attrs} onToggle={(v) => toggle(attrs, v, setAttrs)} />
              <TagSelect label="Track Style" options={STYLE_OPTIONS} selected={styles} onToggle={(v) => toggle(styles, v, setStyles)} />

              <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] p-4">
                <p className="font-body text-white text-xs font-semibold mb-3">Promotional Activity</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Press coverage", hasPress, setHasPress],
                    ["Upcoming shows", hasShows, setHasShows],
                    ["Visual assets", hasVisuals, setHasVisuals],
                    ["Ad campaign", hasAdCampaign, setHasAdCampaign],
                    ["Radio campaign", hasRadio, setHasRadio],
                    ["Part of a schedule", isPartOfSchedule, setIsPartOfSchedule],
                  ].map(([label, val, setter]) => (
                    <label key={label as string} className="flex items-center gap-2.5 cursor-pointer">
                      <div
                        onClick={() => (setter as (v: boolean) => void)(!(val as boolean))}
                        className={["w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          val ? "border-[#C30100] bg-[#C30100]" : "border-white/20 hover:border-white/40"].join(" ")}
                      >
                        {val && <CheckIcon />}
                      </div>
                      <span className="font-body text-white/60 text-xs">{label as string}</span>
                    </label>
                  ))}
                </div>

                {hasVisuals && (
                  <div className="mt-3">
                    <input value={visualUrl} onChange={(e) => setVisualUrl(e.target.value)}
                      placeholder="Visual assets URL"
                      className="w-full bg-[#140C0C] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors mt-2" />
                  </div>
                )}

                {isPartOfSchedule && (
                  <div className="mt-3">
                    <textarea value={scheduleNote} onChange={(e) => setScheduleNote(e.target.value)}
                      placeholder="Describe the larger campaign or schedule..."
                      rows={2}
                      className="w-full bg-[#140C0C] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors min-h-[48px]">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={isLoading || !story.trim()}
                  className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 min-h-[48px] flex items-center justify-center gap-2">
                  {isLoading ? <><SpinIcon /> Submitting...</> : "Submit Pitch"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TagSelect({ label, options, selected, onToggle }: {
  label: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div>
      <p className="font-body text-white/70 text-xs mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} onClick={() => onToggle(o)}
            className={["font-body text-xs rounded-full px-3 py-1.5 border transition-colors",
              selected.includes(o) ? "border-[#C30100] bg-[#C30100]/20 text-white" : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"].join(" ")}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    approved:     { label: "Approved",     color: "#22c55e", bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.25)" },
    submitted:    { label: "Submitted",    color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.25)" },
    under_review: { label: "Under Review", color: "#f97316", bg: "rgba(249,115,22,0.10)",  border: "rgba(249,115,22,0.25)" },
    rejected:     { label: "Rejected",     color: "#C30100", bg: "rgba(195,1,0,0.10)",     border: "rgba(195,1,0,0.25)" },
    draft:        { label: "Draft",        color: "#ffffff", bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.15)" },
  };
  const s = map[status] ?? map.draft;
  return (
    <span className="font-body text-[10px] rounded-full px-3 py-1 shrink-0 border"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

export default function AmplifyPage() {
  const [tab, setTab] = useState<TabType>("available");
  const [curators, setCurators] = useState<Curator[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCurator, setActiveCurator] = useState<Curator | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const { releases } = useMusic();

  const load = useCallback(async () => {
    setIsLoading(true);
    const [curatorsRes, pitchesRes] = await Promise.all([
      getCurators(),
      getPitches(),
    ]);
    if (!curatorsRes.error) {
      const raw = curatorsRes.data as unknown;
      const list = Array.isArray(raw) ? raw
        : Array.isArray((raw as Record<string, unknown>)?.data) ? (raw as Record<string, unknown>).data as Curator[]
        : [];
      setCurators(list);
    }
    if (!pitchesRes.error) {
      const raw = pitchesRes.data as unknown;
      const list = Array.isArray(raw) ? raw
        : Array.isArray((raw as Record<string, unknown>)?.data) ? (raw as Record<string, unknown>).data as Pitch[]
        : [];
      setPitches(list);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-select first release if available
  useEffect(() => {
    if (releases.length > 0 && !selectedUploadId) {
      setSelectedUploadId(releases[0].id);
    }
  }, [releases, selectedUploadId]);

  const approvedPitches  = pitches.filter((p) => p.status === "approved");
  const submittedPitches = pitches.filter((p) => ["submitted", "under_review", "rejected"].includes(p.status));

  return (
    <DashboardLayout
      pageTitle="Pitch Portal"
      customCta={{ label: "+ Submit Track", onClick: () => setTab("available") }}
    >
      <div className="flex flex-col gap-5">

        {/* Hero / landing section — always visible */}
        <PitchPortalHero onSubmitClick={() => setTab("available")} />

        {/* Release selector */}
        {releases.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-body text-white/60 text-xs whitespace-nowrap">Pitching for:</p>
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <select
                  value={selectedUploadId}
                  onChange={(e) => setSelectedUploadId(Number(e.target.value))}
                  className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-2.5 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
                >
                  {releases.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
        )}

        {/* Tab nav + content */}
        <div className="rounded-2xl border border-dashed border-[#C30100]/30 bg-[#180F0F] p-5">
          <div className="flex gap-6 mb-5 border-b border-white/[0.05] pb-3 overflow-x-auto">
            {(["available", "approved", "submissions"] as TabType[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={["font-heading uppercase text-sm tracking-wide pb-1 border-b-2 transition-all whitespace-nowrap",
                  tab === t ? "text-white border-white" : "text-white/40 border-transparent hover:text-white/70"].join(" ")}>
                {t === "available" ? "Available Curators" : t === "approved" ? `Approved (${approvedPitches.length})` : `My Submissions (${submittedPitches.length})`}
              </button>
            ))}
          </div>

          {/* AVAILABLE CURATORS */}
          {tab === "available" && (
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <p className="font-body text-white/30 text-sm text-center py-8">Loading curators...</p>
              ) : curators.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <p className="font-body text-white/30 text-sm">No curators available right now.</p>
                </div>
              ) : curators.map((curator) => (
                <div key={curator.id} className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#C30100]/10 border border-[#C30100]/20 flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-white text-sm font-medium truncate">{curator.name}</p>
                      <p className="font-body text-white/40 text-xs mt-0.5">
                        {curator.genre ?? "Music"}{curator.followers ? ` · ${curator.followers} followers` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveCurator(curator); }}
                    disabled={!selectedUploadId}
                    className="font-body text-white text-xs border border-[#C30100]/50 bg-[#C30100]/10 hover:bg-[#C30100]/30 rounded-full px-4 py-2 transition-colors shrink-0 disabled:opacity-40"
                  >
                    Submit
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* APPROVED */}
          {tab === "approved" && (
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <p className="font-body text-white/30 text-sm text-center py-8">Loading...</p>
              ) : approvedPitches.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <p className="font-body text-white/30 text-sm">No approved placements yet.</p>
                  <p className="font-body text-white/20 text-xs">Submit to curators to get your music on playlists.</p>
                </div>
              ) : approvedPitches.map((pitch) => (
                <PitchCard key={pitch.id} pitch={pitch} />
              ))}
            </div>
          )}

          {/* SUBMISSIONS */}
          {tab === "submissions" && (
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <p className="font-body text-white/30 text-sm text-center py-8">Loading...</p>
              ) : submittedPitches.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2">
                  <p className="font-body text-white/30 text-sm">No submissions yet.</p>
                  <p className="font-body text-white/20 text-xs">Go to Available Curators and submit your first pitch.</p>
                </div>
              ) : submittedPitches.map((pitch) => (
                <PitchCard key={pitch.id} pitch={pitch} />
              ))}
            </div>
          )}
        </div>
      </div>

      {activeCurator && (
        <SubmitPitchModal
          curator={activeCurator}
          musicUploadId={selectedUploadId}
          onClose={() => setActiveCurator(null)}
          onSuccess={() => { setActiveCurator(null); setShowSuccess(true); load(); }}
        />
      )}

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Pitch Submitted!"
        description="Your pitch has been submitted to the curator. You'll be notified once it's reviewed."
        ctaLabel="Done"
        onCta={() => { setShowSuccess(false); setTab("submissions"); }}
      />
    </DashboardLayout>
  );
}

function PitchCard({ pitch }: { pitch: Pitch }) {
  const title  = pitch.music_upload?.release_title ?? pitch.music_upload?.track_title ?? `Release #${pitch.music_upload_id}`;
  const artist = pitch.music_upload?.primary_artist ?? "";
  const cover  = pitch.music_upload?.album_art_url ?? "";
  const curatorName = pitch.curator?.name ?? `Curator #${pitch.curator_id}`;

  return (
    <div className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-4">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#140C0C]">
          {cover ? (
            <Image src={cover} alt={title} fill className="object-cover" unoptimized />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-white text-sm font-medium truncate">{title}</p>
          <p className="font-body text-white/40 text-xs mt-0.5 truncate">
            {artist && `${artist} · `}Submitted to {curatorName}
          </p>
        </div>
        <StatusBadge status={pitch.status} />
      </div>
      {pitch.created_at && (
        <p className="font-body text-white/30 text-xs mt-3">
          Submitted {new Date(pitch.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px]">{hint}</p>}
    </div>
  );
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function SpinIcon() { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>; }