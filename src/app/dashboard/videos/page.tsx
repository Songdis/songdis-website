"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/components/ui/Toast";
import { fetchVideos, getMusic, submitVideo, type VideoRecord, type VideoStats } from "@/lib/api/music";
import type { Release } from "@/lib/api/music";

/* ─── Constants ─────────────────────────────────────────────── */

const VIDEO_TYPES = [
  { id: "official-video", name: "Official Video", description: "The main music video for your song." },
  { id: "lyric-video", name: "Lyric Video", description: "Animated video with the song's lyrics on screen." },
  { id: "concert-video", name: "Concert Video", description: "Live performance recorded at a concert." },
  { id: "music-documentary", name: "Music Documentary", description: "Long-form storytelling about the song or artist." },
  { id: "behind-the-scenes", name: "Behind the Scenes", description: "Footage from the shoot or creative process." },
  { id: "visualizer", name: "Visualizer", description: "Looping visuals synced to the song." },
  { id: "track-video", name: "Track Video", description: "Static image or simple animation." },
];

const PLANS = [
  { id: "vevo-essentials", name: "VEVO Essentials", price: "₦29,999", platforms: ["VEVO", "Vimeo"] },
  { id: "everywhere", name: "Everywhere", price: "₦49,999", platforms: ["VEVO", "TIDAL", "Apple Music", "Spotify *", "Vimeo", "XITE", "Promo Only"], popular: true },
];

const LIMITED_TYPES = ["behind-the-scenes", "visualizer", "track-video"];

const PRE_SUBMIT_NOTES = [
  { title: "One fee, one video", text: "Each payment covers exactly one video. Plans start at ₦29,999.", color: "default" as const },
  { title: "Not every video type goes everywhere", text: "Visualizers, BTS, and Track Videos go to fewer platforms.", color: "default" as const },
  { title: "Royalties take time", text: "Video royalties arrive 2–3 months after release, reported monthly.", color: "default" as const },
  { title: "Royalty split: 70% to you", text: "SongDis keeps 30%.", color: "default" as const },
  { title: "No refunds after delivery", text: "No refunds once delivered to platforms.", color: "warning" as const },
  { title: "Spotify US needs publishing rights", text: "Must be registered with MLC, all songwriters listed.", color: "default" as const },
  { title: "Need help?", text: "Contact via email reply or WhatsApp, 24h response M–F.", color: "muted" as const },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-white/10 text-white/50",
  in_review: "bg-amber-500/20 text-amber-400",
  live: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

/* ─── Helpers ───────────────────────────────────────────────── */

function getPlatforms(plan: string, videoType: string): string[] {
  if (plan === "vevo-essentials") return ["VEVO", "Vimeo"];
  if (LIMITED_TYPES.includes(videoType)) return ["VEVO", "Vimeo", "XITE", "Promo Only"];
  return ["VEVO", "TIDAL", "Apple Music", "Spotify *", "Vimeo", "XITE", "Promo Only"];
}

function detectProvider(url: string): string | null {
  if (url.includes("drive.google.com")) return "Google Drive";
  if (url.includes("wetransfer.com")) return "WeTransfer";
  if (url.includes("dropbox.com")) return "Dropbox";
  return null;
}

function formatDate(d?: string): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
}

function typeName(id: string): string {
  return VIDEO_TYPES.find((t) => t.id === id)?.name ?? id;
}

interface FormData {
  linkedSong: Release | null;
  videoType: string;
  plan: string;
  videoTitle: string;
  versionSubtitle: string;
  releaseDate: string;
  director: string;
  producer: string;
  productionCompany: string;
  dop: string;
  owns100Percent: boolean | null;
  audioMatchesSongDis: boolean;
  noUnlicensedContent: boolean;
  shortDescription: string;
  hasYouTubeOAC: string;
  videoFileLink: string;
  thumbnailFile: File | null;
  thumbnailUploaded: boolean;
  confirmAccurate: boolean;
  agreeTerms: boolean;
}

const EMPTY_FORM: FormData = {
  linkedSong: null, videoType: "", plan: "",
  videoTitle: "", versionSubtitle: "", releaseDate: "",
  director: "", producer: "", productionCompany: "", dop: "",
  owns100Percent: null, audioMatchesSongDis: false, noUnlicensedContent: false,
  shortDescription: "", hasYouTubeOAC: "",
  videoFileLink: "", thumbnailFile: null, thumbnailUploaded: false,
  confirmAccurate: false, agreeTerms: false,
};

/* ─── Page ──────────────────────────────────────────────────── */

export default function VideosPage() {
  const [view, setView] = useState<"list" | "pre-submit" | "form">("list");
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [stats, setStats] = useState<VideoStats>({ total_videos: 0, in_review: 0, live: 0, total_plays: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const update = useCallback((patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch })), []);

  /* Fetch videos list */
  const loadVideos = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchVideos();
      if (!res.error && res.data) {
        setStats(res.data.stats ?? { total_videos: 0, in_review: 0, live: 0, total_plays: 0 });
        setVideos(res.data.videos ?? []);
      }
    } catch { /* ignore */ }
    setListLoading(false);
  }, []);

  useEffect(() => { if (view === "list") loadVideos(); }, [view, loadVideos]);

  /* Fetch releases when reaching step 1 */
  useEffect(() => {
    if (view === "form" && step === 1 && releases.length === 0) {
      setLoadingReleases(true);
      getMusic().then((res) => {
        if (!res.error && res.data) {
          const raw = Array.isArray(res.data) ? res.data : (res.data as unknown as { data?: Release[] }).data ?? [];
          setReleases(raw);
        }
        setLoadingReleases(false);
      });
    }
  }, [view, step, releases.length]);

  const updateForm = update;

  const goBack = () => {
    if (view === "pre-submit") { setView("list"); return; }
    if (step === 1) { setView("pre-submit"); return; }
    setStep((s) => s - 1);
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1: return form.linkedSong !== null;
      case 2: return form.videoType !== "";
      case 3: return form.plan !== "";
      case 4: return form.videoTitle.trim() !== "" && form.releaseDate !== "";
      case 5: return form.director.trim() !== "";
      case 6: return form.owns100Percent === true && form.audioMatchesSongDis && form.noUnlicensedContent;
      case 7: return form.shortDescription.trim().length > 0;
      case 8: return true;
      case 9: return form.videoFileLink.trim() !== "" && form.thumbnailUploaded;
      case 10: return form.confirmAccurate && form.agreeTerms;
      default: return false;
    }
  };

  const goNext = () => {
    if (step === 1 && form.linkedSong && !form.videoTitle) {
      update({ videoTitle: form.linkedSong.track_title });
    }
    if (step === 10) { handleSubmit(); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (form.linkedSong) {
        fd.append("release_id", String(form.linkedSong.id));
        fd.append("release_title", form.linkedSong.release_title ?? form.linkedSong.track_title ?? "");
        fd.append("release_artist", form.linkedSong.primary_artist);
        fd.append("release_cover_url", form.linkedSong.album_art_url || "");
      }
      fd.append("video_type", form.videoType);
      fd.append("plan", form.plan);
      fd.append("video_title", form.videoTitle);
      fd.append("version_subtitle", form.versionSubtitle);
      fd.append("release_date", form.releaseDate);
      fd.append("director", form.director);
      fd.append("producer", form.producer);
      fd.append("production_company", form.productionCompany);
      fd.append("dop", form.dop);
      fd.append("owns_100_percent", form.owns100Percent ? "1" : "0");
      fd.append("audio_matches_songdis", form.audioMatchesSongDis ? "1" : "0");
      fd.append("no_unlicensed_content", form.noUnlicensedContent ? "1" : "0");
      fd.append("short_description", form.shortDescription);
      fd.append("has_youtube_oac", form.hasYouTubeOAC);
      fd.append("video_file_link", form.videoFileLink);
      if (form.thumbnailFile) fd.append("thumbnail", form.thumbnailFile);
      else if (form.linkedSong?.album_art_url) fd.append("thumbnail_url", form.linkedSong.album_art_url);
      const platforms = getPlatforms(form.plan, form.videoType);
      platforms.forEach((p) => fd.append("platforms[]", p));

      const res = await submitVideo(fd);
      if (res.error) {
        toastError("Submission failed", res.error);
      } else if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        toastSuccess("Video submitted!", "Payment reference received.");
        setForm(EMPTY_FORM); setStep(1); setAcknowledged(false); setView("list");
      }
    } catch {
      toastError("Something went wrong", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-h-[90vh] overflow-y-auto">
        {view === "list" && (
          <VideosList
            videos={videos} stats={stats} loading={listLoading}
            onStartNew={() => { setView("pre-submit"); setForm(EMPTY_FORM); setStep(1); setAcknowledged(false); }}
          />
        )}
        {view === "pre-submit" && (
          <PreSubmit onBack={() => setView("list")} onStart={() => setView("form")} acknowledged={acknowledged} setAcknowledged={setAcknowledged} />
        )}
        {view === "form" && (
          <VideoForm
            step={step} form={form} update={update} releases={releases} loadingReleases={loadingReleases}
            onBack={goBack} onNext={goNext} canContinue={canContinue()} submitting={submitting}
            thumbRef={thumbRef}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

/* ─── List View ─────────────────────────────────────────────── */

function VideosList({ videos, stats, loading, onStartNew }: {
  videos: VideoRecord[]; stats: VideoStats; loading: boolean; onStartNew: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-white uppercase text-xl tracking-wide">Videos</h1>
          <p className="font-body text-white/50 text-sm mt-1">Distribute and track your music videos</p>
        </div>
        <button onClick={onStartNew}
          className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-5 py-3 transition-colors flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Submit New Video
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Videos", value: stats.total_videos },
          { label: "In Review", value: stats.in_review, color: "text-amber-400" },
          { label: "Live", value: stats.live, color: "text-green-400" },
          { label: "Total Plays", value: stats.total_plays.toLocaleString(), color: "text-[#C30100]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4">
            <p className="font-body text-white/40 text-xs mb-1">{s.label}</p>
            {loading ? (
              <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className={["font-heading text-lg", s.color ?? "text-white"].join(" ")}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C30100]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5"><rect x="2" y="4" width="15" height="16" rx="2"/><polygon points="22 7 17 12 22 17"/></svg>
          </div>
          <h3 className="font-heading text-white uppercase text-sm tracking-widest mb-2">No videos yet</h3>
          <p className="font-body text-white/40 text-sm max-w-sm mx-auto mb-6">Submit your first music video for distribution across major platforms.</p>
          <button onClick={onStartNew} className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-6 py-3 transition-colors">
            Submit your first video
          </button>
        </div>
      )}

      {/* Video grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {videos.map((v) => (
            <div key={v.id} className="bg-[#1A0808] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="relative aspect-video bg-white/5">
                {v.thumbnail_url ? (
                  <Image src={v.thumbnail_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/10"><rect x="2" y="4" width="15" height="16" rx="2"/><polygon points="22 7 17 12 22 17"/></svg>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-white text-sm font-medium truncate">{v.video_title}</p>
                  <span className={["text-[10px] font-heading tracking-wider px-2 py-0.5 rounded-full uppercase shrink-0", STATUS_COLORS[v.status] ?? "bg-white/10 text-white/50"].join(" ")}>
                    {v.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-body text-white/40 text-xs">{v.release_artist} · {typeName(v.video_type)}</p>
                {v.platforms.length > 0 && (
                  <p className="font-body text-white/25 text-[10px] truncate">{v.platforms.join(", ")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Pre-Submit ────────────────────────────────────────────── */

function PreSubmit({ onBack, onStart, acknowledged, setAcknowledged }: {
  onBack: () => void; onStart: () => void; acknowledged: boolean; setAcknowledged: (v: boolean) => void;
}) {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <button onClick={onBack} className="font-body text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <div>
        <h1 className="font-heading text-white uppercase text-xl tracking-wide">Before you submit</h1>
        <p className="font-body text-white/50 text-sm mt-1">A few things to know about video distribution</p>
      </div>
      <div className="flex flex-col gap-3">
        {PRE_SUBMIT_NOTES.map((n) => (
          <div key={n.title} className={[
            "rounded-xl p-4 border",
            n.color === "warning" ? "bg-amber-500/5 border-amber-500/20" : n.color === "muted" ? "bg-white/[0.02] border-white/[0.06]" : "bg-[#1A0808] border-white/[0.07]",
          ].join(" ")}>
            <p className="font-body text-white text-sm font-medium mb-1">{n.title}</p>
            <p className={["font-body text-xs leading-relaxed", n.color === "warning" ? "text-amber-400/70" : "text-white/40"].join(" ")}>{n.text}</p>
          </div>
        ))}
      </div>
      <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAcknowledged(!acknowledged)}>
        <div className={[
          "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          acknowledged ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
        ].join(" ")}>
          {acknowledged && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <p className="font-body text-white/60 text-xs leading-relaxed">I understand the fees, timelines, and platform requirements for video distribution.</p>
      </label>
      <button onClick={onStart} disabled={!acknowledged}
        className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full py-3.5 transition-colors disabled:opacity-40">
        Start submission
      </button>
    </div>
  );
}

/* ─── Video Form (10 steps) ─────────────────────────────────── */

function VideoForm({ step, form, update, releases, loadingReleases, onBack, onNext, canContinue, submitting, thumbRef }: {
  step: number; form: FormData; update: (p: Partial<FormData>) => void;
  releases: Release[]; loadingReleases: boolean;
  onBack: () => void; onNext: () => void; canContinue: boolean; submitting: boolean;
  thumbRef: React.RefObject<HTMLInputElement | null>;
}) {
  const platforms = form.plan ? getPlatforms(form.plan, form.videoType) : [];
  const progress = (step / 10) * 100;
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 10);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-[#C30100] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="font-body text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <span className="font-body text-white/30 text-xs">Step {step} of 10</span>
      </div>

      {/* Step 1: Link song */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Link your song</h2>
          {loadingReleases ? (
            <div className="flex justify-center py-16"><svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></div>
          ) : releases.length === 0 ? (
            <p className="font-body text-white/30 text-sm text-center py-12">No releases found. Upload a song first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {releases.map((r) => {
                const sel = form.linkedSong?.id === r.id;
                return (
                  <button key={r.id} onClick={() => update({ linkedSong: r })}
                    className={[
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      sel ? "border-[#C30100] bg-[#C30100]/5" : "border-white/[0.06] hover:border-white/20",
                    ].join(" ")}>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {r.album_art_url ? (
                        <Image src={r.album_art_url} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-white text-sm font-medium truncate">{r.track_title}</p>
                      <p className="font-body text-white/30 text-xs truncate">{r.primary_artist} · {r.primary_genre || r.upload_type} · {formatDate(r.release_date)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Video type */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">What kind of video is this?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {VIDEO_TYPES.map((t) => (
              <button key={t.id} onClick={() => update({ videoType: t.id, plan: "" })}
                className={[
                  "p-4 rounded-xl border text-left transition-all",
                  form.videoType === t.id ? "border-[#C30100] bg-[#C30100]/5" : "border-white/[0.06] hover:border-white/20",
                ].join(" ")}>
                <p className="font-body text-white text-sm font-medium mb-1">{t.name}</p>
                <p className="font-body text-white/30 text-xs leading-relaxed">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Plan */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Pick your plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <button key={p.id} onClick={() => update({ plan: p.id })}
                className={[
                  "relative p-5 rounded-xl border text-left transition-all",
                  form.plan === p.id ? "border-[#C30100] bg-[#C30100]/5" : "border-white/[0.06] hover:border-white/20",
                ].join(" ")}>
                {p.popular && (
                  <span className="absolute top-3 right-3 text-[8px] font-heading tracking-widest px-2 py-0.5 rounded bg-[#C30100]/20 text-[#C30100]">MOST POPULAR</span>
                )}
                <p className="font-heading text-white text-lg mb-0.5">{p.price}</p>
                <p className="font-body text-white/30 text-xs mb-3">per video · {p.name}</p>
                <div className="flex flex-col gap-1">
                  {p.platforms.map((pl) => (
                    <div key={pl} className="flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span className="font-body text-white/50 text-xs">{pl}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Video details */}
      {step === 4 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Video details</h2>
          <Field label="Video title *">
            <input value={form.videoTitle} onChange={(e) => update({ videoTitle: e.target.value })}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
          <Field label="Version / subtitle">
            <input value={form.versionSubtitle} onChange={(e) => update({ versionSubtitle: e.target.value })} placeholder="Official Video"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            <p className="font-body text-white/25 text-[11px] mt-1">e.g. Official Video, Lyric Video</p>
          </Field>
          <Field label="Release date *">
            <input type="date" value={form.releaseDate} onChange={(e) => update({ releaseDate: e.target.value })}
              min={minDate.toISOString().split("T")[0]}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors [color-scheme:dark]" />
            <p className="font-body text-white/25 text-[11px] mt-1">Minimum 10 days from today</p>
          </Field>
        </div>
      )}

      {/* Step 5: Credits */}
      {step === 5 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Credits</h2>
          <Field label="Director *">
            <input value={form.director} onChange={(e) => update({ director: e.target.value })} placeholder="Full name"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
          <Field label="Producer">
            <input value={form.producer} onChange={(e) => update({ producer: e.target.value })}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
          <Field label="Production company">
            <input value={form.productionCompany} onChange={(e) => update({ productionCompany: e.target.value })}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
          <Field label="DOP / Cinematographer">
            <input value={form.dop} onChange={(e) => update({ dop: e.target.value })}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
        </div>
      )}

      {/* Step 6: Rights */}
      {step === 6 && (
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Rights check</h2>
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-4">
            <p className="font-body text-white text-sm">Do you own 100% of the rights to this video?</p>
            <div className="flex gap-3">
              <button onClick={() => update({ owns100Percent: true })}
                className={["flex-1 py-3 rounded-xl border text-sm font-heading transition-all", form.owns100Percent === true ? "border-green-500 bg-green-500/10 text-green-400" : "border-white/10 text-white/40 hover:border-white/25"].join(" ")}>Yes</button>
              <button onClick={() => update({ owns100Percent: false })}
                className={["flex-1 py-3 rounded-xl border text-sm font-heading transition-all", form.owns100Percent === false ? "border-red-500 bg-red-500/10 text-red-400" : "border-white/10 text-white/40 hover:border-white/25"].join(" ")}>No</button>
            </div>
            {form.owns100Percent === false && (
              <p className="font-body text-red-400/70 text-xs">You must own 100% of the rights to submit a video for distribution.</p>
            )}
          </div>
          <CheckRow checked={form.audioMatchesSongDis} onChange={() => update({ audioMatchesSongDis: !form.audioMatchesSongDis })}
            label="The audio in this video matches the version distributed through SongDis" />
          <CheckRow checked={form.noUnlicensedContent} onChange={() => update({ noUnlicensedContent: !form.noUnlicensedContent })}
            label="No unlicensed samples, logos, brands, or copyrighted footage appear in this video" />
        </div>
      )}

      {/* Step 7: Description */}
      {step === 7 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">How it shows on platforms</h2>
          <Field label="Short description *">
            <textarea value={form.shortDescription} onChange={(e) => update({ shortDescription: e.target.value.slice(0, 500) })} rows={4}
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none" />
            <p className="font-body text-white/25 text-[11px] mt-1">{form.shortDescription.length}/500 · Appears on YouTube, Apple Music, etc.</p>
          </Field>
        </div>
      )}

      {/* Step 8: Platform preview */}
      {step === 8 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Here&apos;s where your video will go</h2>
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-body text-white/50 text-sm">{PLANS.find((p) => p.id === form.plan)?.name}</span>
              <span className="font-heading text-white text-sm">{PLANS.find((p) => p.id === form.plan)?.price}</span>
            </div>
            <p className="font-body text-white/30 text-xs">{typeName(form.videoType)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <span key={p} className="flex items-center gap-1.5 bg-green-500/10 text-green-400 text-xs font-body px-3 py-1.5 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Step 9: File & thumbnail */}
      {step === 9 && (
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Your video file &amp; channel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Field label="YouTube Official Artist Channel?">
                <div className="flex gap-2">
                  {["yes", "no", "not-sure"].map((v) => (
                    <button key={v} onClick={() => update({ hasYouTubeOAC: v })}
                      className={["flex-1 py-2.5 rounded-lg border text-xs font-heading transition-all capitalize",
                        form.hasYouTubeOAC === v ? "border-[#C30100] bg-[#C30100]/10 text-[#C30100]" : "border-white/10 text-white/40 hover:border-white/25"
                      ].join(" ")}>{v === "not-sure" ? "Not sure" : v}</button>
                  ))}
                </div>
              </Field>
              <Field label="Video file link *">
                <input value={form.videoFileLink} onChange={(e) => update({ videoFileLink: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
                {detectProvider(form.videoFileLink) && (
                  <p className="font-body text-green-400/70 text-[11px] mt-1">{detectProvider(form.videoFileLink)} link detected</p>
                )}
                <p className="font-body text-white/25 text-[11px] mt-1">Paste a shareable link from Google Drive, WeTransfer, or Dropbox</p>
                <div className="flex gap-2 mt-2">
                  {["Google Drive", "WeTransfer", "Dropbox"].map((p) => (
                    <span key={p} className="text-[10px] font-body text-white/25 bg-white/5 rounded px-2 py-0.5">{p}</span>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Thumbnail / cover art *">
                <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { update({ thumbnailFile: f, thumbnailUploaded: true }); } }} />
                <button onClick={() => thumbRef.current?.click()}
                  className={[
                    "w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition-colors",
                    form.thumbnailUploaded ? "border-green-500/40 bg-green-500/5" : "border-white/10 hover:border-white/25",
                  ].join(" ")}>
                  {form.thumbnailUploaded ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="font-body text-green-400 text-xs">File uploaded</p></>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <p className="font-body text-white/40 text-xs">Click to upload</p>
                    <p className="font-body text-white/20 text-[10px]">1920×1080 or 1:1, under 5MB</p></>
                  )}
                </button>
                {form.linkedSong?.album_art_url && !form.thumbnailFile && (
                  <button onClick={() => update({ thumbnailUploaded: true, thumbnailFile: null })}
                    className="font-body text-[#C30100] text-xs hover:underline mt-1">Use song cover art instead</button>
                )}
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* Step 10: Review */}
      {step === 10 && (
        <div className="flex flex-col gap-5">
          <h2 className="font-heading text-white uppercase text-sm tracking-widest">Review &amp; submit</h2>
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-5 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Plan</p>
              <p className="font-body text-white">{PLANS.find((p) => p.id === form.plan)?.name} · {PLANS.find((p) => p.id === form.plan)?.price}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Video type</p>
              <p className="font-body text-white">{typeName(form.videoType)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Song</p>
              <p className="font-body text-white truncate">{form.linkedSong?.track_title}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Video title</p>
              <p className="font-body text-white truncate">{form.videoTitle}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Release date</p>
              <p className="font-body text-white">{formatDate(form.releaseDate)}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Director</p>
              <p className="font-body text-white">{form.director}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Video file</p>
              <p className="font-body text-white">{detectProvider(form.videoFileLink) || "External link"}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5">
              <p className="font-body text-white/30 text-[10px] uppercase tracking-wider mb-0.5">Platforms</p>
              <p className="font-body text-white">{platforms.length} confirmed</p>
            </div>
          </div>
          <CheckRow checked={form.confirmAccurate} onChange={() => update({ confirmAccurate: !form.confirmAccurate })}
            label="I confirm all information above is accurate" />
          <CheckRow checked={form.agreeTerms} onChange={() => update({ agreeTerms: !form.agreeTerms })}
            label="I agree to the SongDis Video Distribution Terms" />
        </div>
      )}

      {/* Continue / Pay */}
      <button onClick={onNext} disabled={!canContinue || submitting}
        className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full py-3.5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
        {submitting && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}
        {step === 10
          ? `Pay ${PLANS.find((p) => p.id === form.plan)?.price ?? ""}`
          : "Continue"}
      </button>
    </div>
  );
}

/* ─── Shared pieces ─────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-body text-white/50 text-xs block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer" onClick={onChange}>
      <div className={[
        "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
        checked ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
      ].join(" ")}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>
      <p className="font-body text-white/60 text-xs leading-relaxed">{label}</p>
    </label>
  );
}
