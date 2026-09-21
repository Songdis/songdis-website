"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SuccessModal } from "@/components/auth/SuccessModal";
import { useBilling } from "@/lib/hooks/useBilling";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import {
  getPitches,
  getEligibleReleases,
  createPitch,
  submitPitch,
  type EligibleRelease,
  type Pitch,
  type CreatePitchPayload,
} from "@/lib/api/pitches";



const MOOD_OPTIONS   = ["chill", "energetic", "romantic", "sad", "uplifting", "party", "spiritual", "afrobeats"];
const ATTR_OPTIONS   = ["original", "cover", "remix", "live", "acoustic", "instrumental"];
const STYLE_OPTIONS  = ["acoustic", "afrobeats", "afropop", "highlife", "amapiano", "afrosoul", "dancehall", "pop"];


function PitchPortalHero({ onSubmitClick }: { onSubmitClick: () => void }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-6 sm:p-8">
      <h2 className="font-heading text-white text-2xl sm:text-3xl leading-tight mb-6">
        Get your music<br />featured
      </h2>

      <div className="relative h-40 mb-6 sm:mb-8 flex items-center justify-center scale-75 sm:scale-100">
        {/* Back card: TIDAL */}
        <div
          className="absolute w-56 rounded-xl bg-[#0E1420] border border-blue-400/[0.15] p-4 text-left shadow-lg"
          style={{ transform: "translate(-64px, -18px) rotate(-10deg)", zIndex: 1 }}
        >
          <div className="flex items-center gap-2.5 mb-8">
            <TidalIcon />
            <div>
              <p className="font-body text-white text-sm font-semibold leading-tight">TIDAL Rising</p>
              <p className="font-body text-white/30 text-xs mt-0.5">TIDAL · Editorial</p>
            </div>
          </div>
        </div>

        <div
          className="absolute w-56 rounded-xl bg-[#0E1410] border border-green-400/[0.15] p-4 text-left shadow-lg"
          style={{ transform: "translate(-24px, -6px) rotate(-5deg)", zIndex: 2 }}
        >
          <div className="flex items-center gap-2.5 mb-8">
            <SpotifyIcon />
            <div>
              <p className="font-body text-white text-sm font-semibold leading-tight">Fresh Finds</p>
              <p className="font-body text-white/30 text-xs mt-0.5">Spotify · Editorial</p>
            </div>
          </div>
        </div>

        <div
          className="absolute w-52 rounded-xl bg-[#150808] border border-white/[0.08] p-3 text-left shadow-2xl"
          style={{ transform: "translate(20px, 8px) rotate(3deg)", zIndex: 3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AppleMusicIcon />
            <div>
              <p className="font-body text-white text-xs font-semibold leading-tight">New Music Daily</p>
              <p className="font-body text-white/30 text-[10px]">Apple Music · Editorial</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="relative flex-1 aspect-square rounded-md overflow-hidden">
              <Image src="/images/pitch-thumb-1.png" alt="Africa Now" fill className="object-cover" />
            </div>
            <div className="relative flex-1 aspect-square rounded-md overflow-hidden">
              <Image src="/images/pitch-thumb-2.png" alt="Playlist cover" fill className="object-cover" />
            </div>
            <div className="relative flex-1 aspect-square rounded-md overflow-hidden">
              <Image src="/images/pitch-thumb-3.png" alt="Heat" fill className="object-cover" />
            </div>
          </div>
        </div>
      </div>

      <p className="font-body text-white/50 text-sm leading-relaxed max-w-md mb-6">
        Submit your tracks to top editorial playlists, sync opportunities, brand
        partnerships, and media placements — all in one place.
      </p>

      <div className="rounded-xl border border-dashed border-white/15 px-5 py-5 flex flex-col items-center gap-4">
        {/* Matches the backend window exactly. This used to say 4–6 weeks, which is the
            opposite of what the portal now accepts. */}
        <p className="font-body text-white/50 text-sm text-center">
          Pitch between 4 and 3 weeks before your release date.
        </p>
        <button
          onClick={onSubmitClick}
          className="w-full sm:w-auto font-heading text-white uppercase text-xs tracking-widest rounded-full bg-[#C30100] hover:bg-[#a80100] px-8 py-3.5 transition-colors min-h-[48px]"
        >
          Submit a Release
        </button>
      </div>
    </div>
  );
}

function TidalIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
        <path d="M12 3.5L8.25 7.25 12 11 15.75 7.25 12 3.5zM4.5 7.25L.75 11l3.75 3.75L8.25 11 4.5 7.25zm15 0L15.75 11l3.75 3.75L23.25 11l-3.75-3.75zM12 11l-3.75 3.75L12 18.5l3.75-3.75L12 11z" />
      </svg>
    </div>
  );
}

function SpotifyIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.6-1.6-5.9-2-9.8-1.1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4.2-1 7.9-.5 10.8 1.3.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.1.3-3-1.8-7.5-2.4-11-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4-1.2 9-.6 12.4 1.5.4.2.5.7.2 1zm.1-3.4c-3.5-2.1-9.4-2.3-12.8-1.3-.5.1-1-.2-1.1-.6-.1-.5.2-1 .6-1.1 3.9-1.2 10.3-.9 14.4 1.5.4.3.6.9.3 1.3-.3.4-.9.5-1.4.2z" />
      </svg>
    </div>
  );
}

function AppleMusicIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FA233B] to-[#FB5C74] flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M23 3.6v13.2c0 1.5-1 2.7-2.5 3-.3 0-.6.1-.9.1-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7c.5 0 .9.1 1.3.3V6.4L11 8.2v10.6c0 1.5-1 2.7-2.5 3-.3 0-.6.1-.9.1-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7c.5 0 .9.1 1.3.3V6.9c0-.4.3-.8.7-.9L21.5 3c.5-.1 1 .1 1.3.4.2.1.2.3.2.2z" />
      </svg>
    </div>
  );
}


function SubmitPitchModal({
  release,
  onClose,
  onSuccess,
}: {
  release: EligibleRelease;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // No eligibility step: the release came from the eligible list, which the backend builds
  // with the same rule it enforces on creation. Checking again only added a click.
  const musicUploadId = release.id;

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


  const handleSubmit = async () => {
    if (!story.trim()) { toastError("Missing info", "Please write your release story."); return; }
    setIsLoading(true);

    const payload: CreatePitchPayload = {
      music_upload_id: musicUploadId,
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
            <h2 className="font-heading text-white uppercase text-xl tracking-wide">Pitch &ldquo;{release.title}&rdquo;</h2>
            <p className="font-body text-white/50 text-sm mt-2">
              Out {new Date(release.release_date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
              {" · "}for editorial playlist consideration
            </p>
          </div>


          {/* Pitch form */}
          {(
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
  const [releases, setReleases] = useState<EligibleRelease[]>([]);
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRelease, setActiveRelease] = useState<EligibleRelease | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  const { can } = useBilling(0);
  const isGrowthPlan = can("playlist_pitching");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    setIsLoading(true);
    const [releasesRes, pitchesRes] = await Promise.all([getEligibleReleases(), getPitches()]);

    const unwrap = <T,>(raw: unknown): T[] =>
      Array.isArray(raw)
        ? (raw as T[])
        : Array.isArray((raw as Record<string, unknown>)?.data)
          ? ((raw as Record<string, unknown>).data as T[])
          : [];

    if (!releasesRes.error) setReleases(unwrap<EligibleRelease>(releasesRes.data));
    if (!pitchesRes.error) setPitches(unwrap<Pitch>(pitchesRes.data));
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startSubmitting = () => {
    if (!isGrowthPlan) { setShowUpgrade(true); return; }
    setHeroVisible(false);
  };

  // Drafts are unfinished work, not submissions, so they stay out of the status list.
  const submitted = pitches.filter((p) => p.status !== "draft");

  return (
    <DashboardLayout
      pageTitle="Pitch Portal"
      customCta={heroVisible ? undefined : { label: "Back", onClick: () => setHeroVisible(true) }}
    >
      {heroVisible ? (
        <PitchPortalHero onSubmitClick={startSubmitting} />
      ) : (
        /*
          Releases to pitch on the left, what has already been pitched on the right. The old
          flow started from a curator list, but Spotify's editors choose the playlist — the
          artist only ever chooses the release, so that is where it starts.
        */
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          <section className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
            <h2 className="font-heading text-white uppercase text-base tracking-wide">Releases you can pitch</h2>
            <p className="font-body text-white/45 text-xs mt-1 mb-4 leading-relaxed">
              Pitching opens 4 weeks before a release date and closes 3 weeks before it.
              Releases further out will appear here once their window opens.
            </p>

            {isLoading ? (
              <p className="font-body text-white/30 text-sm text-center py-10">Loading releases…</p>
            ) : releases.length === 0 ? (
              <div className="flex flex-col items-center text-center py-10 gap-2">
                <p className="font-body text-white/50 text-sm">No releases are in the pitch window right now.</p>
                <p className="font-body text-white/30 text-xs max-w-sm">
                  A release becomes pitchable when its release date is between 3 and 4 weeks away,
                  and each release can be pitched once.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {releases.map((release) => (
                  <li
                    key={release.id}
                    className="rounded-xl bg-[#0E0808] border border-white/[0.06] p-3 sm:p-4 flex items-center gap-3"
                  >
                    <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/[0.04]">
                      {release.artwork && (
                        <Image src={release.artwork} alt="" fill className="object-cover" unoptimized />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-body text-white text-sm font-medium truncate">{release.title}</p>
                      <p className="font-body text-white/40 text-xs truncate mt-0.5">
                        {release.artist ? `${release.artist} · ` : ""}
                        {release.upload_type}
                        {release.track_count > 1 ? ` · ${release.track_count} tracks` : ""}
                      </p>
                      <p className="font-body text-white/40 text-xs mt-0.5">
                        Out {new Date(release.release_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        {" · "}
                        <span className="text-amber-300/80">{release.days_until} days away</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveRelease(release)}
                      className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-4 py-2.5 transition-colors"
                    >
                      {release.draft_pitch_id ? "Continue" : "Pitch"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-5">
            <h2 className="font-heading text-white uppercase text-base tracking-wide mb-4">Your pitches</h2>

            {isLoading ? (
              <p className="font-body text-white/30 text-sm text-center py-6">Loading…</p>
            ) : submitted.length === 0 ? (
              <p className="font-body text-white/30 text-sm text-center py-6">Nothing pitched yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {submitted.map((pitch) => (
                  <li key={pitch.id}>
                    <PitchCard pitch={pitch} />
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}

      {activeRelease && (
        <SubmitPitchModal
          release={activeRelease}
          onClose={() => setActiveRelease(null)}
          onSuccess={() => { setActiveRelease(null); setShowSuccess(true); load(); }}
        />
      )}

      <ConfirmDialog
        open={showUpgrade}
        title="Pitching is on the Growth plan"
        confirmLabel="See Growth"
        cancelLabel="Not now"
        onConfirm={() => {
          setShowUpgrade(false);
          router.push("/dashboard/settings?tab=subscription");
        }}
        onCancel={() => setShowUpgrade(false)}
        message={
          <p>
            Growth lets you pitch releases for editorial playlist consideration and track each
            pitch. Your releases and everything else on your plan stay exactly as they are.
          </p>
        }
      />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Pitch Submitted!"
        description="Your release has been submitted for editorial consideration. You'll see its status under Your pitches."
        ctaLabel="Done"
        onCta={() => setShowSuccess(false)}
      />
    </DashboardLayout>
  );
}

function PitchCard({ pitch }: { pitch: Pitch }) {
  const title  = pitch.music_upload?.release_title ?? pitch.music_upload?.track_title ?? `Release #${pitch.music_upload_id}`;
  const artist = pitch.music_upload?.primary_artist ?? "";
  const cover  = pitch.music_upload?.album_art_url ?? "";

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
            {artist}
            {pitch.curator?.name ? ` · ${pitch.curator.name}` : ""}
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