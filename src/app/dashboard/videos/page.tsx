"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/components/ui/Toast";
import { useBilling } from "@/lib/hooks/useBilling";
import { useCurrentUser } from "@/lib/hooks/useAuth";
import { fetchVideos, getAllMusic, submitVideo, type VideoRecord, type VideoStats } from "@/lib/api/music";
import type { Release } from "@/lib/api/music";
import VideoFormSteps from "@/components/dashboard/videos/VideoFormSteps";
import {
  EMPTY_VIDEO_FORM,
  SECTIONS,
  TOTAL_STEPS,
  buildSubmission,
  describeProblems,
  platformName,
  stepComplete,
  videoTypeName,
  type FieldProblem,
  type VideoFormData,
} from "@/components/dashboard/videos/videoForm";

const PRE_SUBMIT_NOTES = [
  { title: "Included with Growth", text: "Video distribution is part of your Growth plan. There is nothing to pay for a submission.", color: "default" as const },
  { title: "Twelve sections", text: "The form covers your account, the video, its identifiers, credits, promotion and delivery. Have your UPC, ISRC and follower counts to hand.", color: "default" as const },
  { title: "Submit 3 weeks ahead", text: "Your go-live date has to be at least 3 weeks away, to leave time for review, corrections, delivery, platform processing and pitching.", color: "warning" as const },
  { title: "Review is not a guarantee", text: "Submitting does not guarantee approval, platform placement, playlist pitching, or a specific release date.", color: "default" as const },
  { title: "Royalties take time", text: "Video royalties arrive 2-3 months after release, reported monthly. The split is 70% to you.", color: "default" as const },
  { title: "Need help?", text: "Contact via email reply or WhatsApp, 24h response M-F.", color: "muted" as const },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-white/10 text-white/50",
  in_review: "bg-amber-500/20 text-amber-400",
  live: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

export default function VideosPage() {
  const [view, setView] = useState<"list" | "pre-submit" | "form">("list");
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  const [form, setForm] = useState<VideoFormData>(EMPTY_VIDEO_FORM);
  const [releases, setReleases] = useState<Release[]>([]);
  /** True when the catalogue is larger than the page walk would fetch — say so rather than
   *  letting the artist believe a missing release does not exist. */
  const [releasesTruncated, setReleasesTruncated] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [stats, setStats] = useState<VideoStats>({ total_videos: 0, in_review: 0, live: 0, total_plays: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [problems, setProblems] = useState<FieldProblem[]>([]);
  const thumbRef = useRef<HTMLInputElement>(null);
  const problemsRef = useRef<HTMLDivElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  const { can } = useBilling();
  const isGrowthPlan = can("videos");

  const { user, fetchUser } = useCurrentUser();

  const update = useCallback(
    (patch: Partial<VideoFormData>) => setForm((f) => ({ ...f, ...patch })),
    [],
  );

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

  useEffect(() => { void fetchUser(); }, [fetchUser]);

  /*
   * Releases are fetched when the form opens, not when section 3 is reached.
   *
   * The picker is on section 3 but it prefills nine fields across sections 1, 3, 4 and 6, so
   * the artist has to be able to use it before typing those by hand — waiting until they are
   * already on the step means they have often filled them in first.
   */
  useEffect(() => {
    if (view === "form" && releases.length === 0) {
      setLoadingReleases(true);
      /*
       * Every page, not just the first.
       *
       * /music is paginated at 15 by default, and this used to take page one and stop — so
       * an artist with more than fifteen releases could not pick an older one at all. It was
       * not a missing release; it was a missing page.
       */
      getAllMusic().then(({ releases: all, complete }) => {
        setReleases(all);
        setReleasesTruncated(!complete);
        setLoadingReleases(false);
      });
    }
  }, [view, releases.length]);

  /**
   * Prefill what the account already knows.
   *
   * Section 1 asks for a legal name and an email that Songdis holds already, and "Submitted
   * by" is almost always the same person. Pre-filling it is not a convenience — the form says
   * the details have to match, and the surest way to get a mismatch is to make someone retype
   * what we could have filled in. Only blank fields are touched.
   */
  const startSubmission = useCallback(() => {
    setForm({
      ...EMPTY_VIDEO_FORM,
      legal_first_name: user?.first_name ?? "",
      legal_last_name: user?.last_name ?? "",
      primary_email: user?.email ?? "",
      submitted_by_name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
    });
    setStep(1);
    setProblems([]);
    setAcknowledged(false);
    setView("pre-submit");
  }, [user]);

  const goBack = () => {
    if (view === "pre-submit") { setView("list"); return; }
    if (step === 1) { setView("pre-submit"); return; }
    setStep((s) => s - 1);
  };

  const goNext = () => {
    if (step === TOTAL_STEPS) { void handleSubmit(); return; }
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setProblems([]);

    try {
      const res = await submitVideo(buildSubmission(form));

      if (res.error || res.errors) {
        /*
         * `errors` is the field map and the only place per-field messages live.
         *
         * Reading just `error` would show one problem and hide the rest, which on a
         * twelve-section form means twelve submits to find out about twelve fields. Each
         * problem is shown with the section it came from and a way to jump straight there.
         */
        const found = describeProblems(res.errors);
        setProblems(found);

        if (found.length === 0) {
          toastError("Submission failed", res.error ?? "Please try again.");
        } else {
          // The button is at the bottom of a long page. Without this the artist sees nothing
          // change and concludes the button is dead.
          requestAnimationFrame(() =>
            problemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
          );
        }
        return;
      }

      setForm(EMPTY_VIDEO_FORM);
      setStep(1);
      setAcknowledged(false);
      toastSuccess("Video submitted", "It is with our team for review. You will see its status here.");
      setView("list");
    } catch {
      toastError("Something went wrong", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {/*
        Responsive padding, and no scroll container of its own.
        p-8 is 32px a side on a 412px phone, which is most of the width gone before any
        content. max-h-[90vh] + overflow-y-auto also made this a second scrolling area
        inside <main>, which already scrolls — two nested scrollbars on one page.
      */}
      <div className="p-4 sm:p-6 lg:p-8">
        {view === "list" && (
          <VideosList
            videos={videos} stats={stats} loading={listLoading}
            isGrowthPlan={isGrowthPlan}
            onStartNew={startSubmission}
          />
        )}
        {view === "pre-submit" && (
          <PreSubmit
            onBack={() => setView("list")}
            onStart={() => setView("form")}
            acknowledged={acknowledged}
            setAcknowledged={setAcknowledged}
          />
        )}
        {view === "form" && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {/* Progress */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C30100] rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button onClick={goBack} className="font-body text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <span className="font-body text-white/30 text-xs truncate">
                Step {step} of {TOTAL_STEPS}
              </span>
            </div>

            {problems.length > 0 && (
              <ProblemPanel
                ref={problemsRef}
                problems={problems}
                onGoToStep={(s) => { setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              />
            )}

            <VideoFormSteps
              step={step}
              form={form}
              update={update}
              releases={releases}
              loadingReleases={loadingReleases}
              releasesTruncated={releasesTruncated}
              thumbRef={thumbRef}
            />

            <button
              onClick={goNext}
              disabled={!stepComplete(step, form) || submitting}
              className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full py-3.5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              )}
              {step === TOTAL_STEPS ? "Submit video" : "Continue"}
            </button>

            {/* Why the button is off, rather than leaving the artist to guess. */}
            {!stepComplete(step, form) && !submitting && (
              <p className="font-body text-white/30 text-[11px] text-center -mt-3">
                Fill in the required fields on this section to continue.
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/**
 * Every rejected field at once, each labelled with the section it belongs to.
 *
 * "Go back and fix these" is useless when three problems span three different sections, so
 * each one names its section and offers a jump. Sorted by section, so working down the list
 * walks the form forwards.
 */
const ProblemPanel = ({
  ref,
  problems,
  onGoToStep,
}: {
  ref: React.Ref<HTMLDivElement>;
  problems: FieldProblem[];
  onGoToStep: (step: number) => void;
}) => {
  // Grouped so a section with four problems is one heading, not four.
  const bySection = problems.reduce<Record<string, FieldProblem[]>>((acc, p) => {
    (acc[p.stepLabel] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div ref={ref} className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 flex flex-col gap-3">
      <p className="font-body text-red-400 text-sm">
        {problems.length === 1
          ? "One thing needs fixing before this can be submitted."
          : `${problems.length} things need fixing before this can be submitted.`}
      </p>

      {Object.entries(bySection).map(([label, items]) => (
        <div key={label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-white/70 uppercase text-[10px] tracking-widest">
              {label}
            </p>
            <button
              onClick={() => onGoToStep(items[0].step)}
              className="font-body text-[#C30100] text-[11px] hover:underline shrink-0"
            >
              Go to section {items[0].step}
            </button>
          </div>
          <ul className="flex flex-col gap-0.5">
            {items.map((p, i) => (
              <li key={`${p.field}-${i}`} className="font-body text-white/60 text-xs leading-relaxed">
                {p.message}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

function VideosList({ videos, stats, loading, isGrowthPlan, onStartNew }: {
  videos: VideoRecord[]; stats: VideoStats; loading: boolean; isGrowthPlan: boolean; onStartNew: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-white uppercase text-xl tracking-wide">Videos</h1>
          <p className="font-body text-white/50 text-sm mt-1">Distribute and track your music videos</p>
        </div>
        {/*
          Full width on mobile, natural width from sm up.
          These sat inside a flex-col at phone widths, so they shrank to fit their label and
          the text wrapped mid-phrase — which is what made the CTA look broken rather than
          deliberate. min-h-[48px] keeps them a comfortable tap target.
        */}
        {isGrowthPlan ? (
          <button onClick={onStartNew}
            className="w-full sm:w-auto min-h-[48px] font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-5 py-3 transition-colors flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Submit New Video
          </button>
        ) : (
          <Link href="/dashboard/settings?tab=subscription"
            className="w-full sm:w-auto min-h-[48px] text-center font-heading text-white uppercase text-xs tracking-widest bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-5 py-3 transition-colors flex items-center justify-center gap-2">
            Upgrade to Growth
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Videos", value: stats.total_videos },
          { label: "In Review", value: stats.in_review, color: "text-amber-400" },
          { label: "Live", value: stats.live, color: "text-green-400" },
          { label: "Total Plays", value: stats.total_plays.toLocaleString(), color: "text-[#C30100]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-3 sm:p-4">
            {/* [11px] on phones: "Total Videos" and "Total Plays" wrapped to two lines at
                text-xs in a half-width card, making the four tiles different heights. */}
            <p className="font-body text-white/40 text-[11px] sm:text-xs mb-1 truncate">{s.label}</p>
            {loading ? (
              <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
            ) : (
              <p className={["font-heading text-base sm:text-lg", s.color ?? "text-white"].join(" ")}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {/*
        p-12 is 48px a side, which on a 412px phone left the copy in a narrow column and
        pushed the button most of a screen down. The buttons also go full width here, for
        the same reason as the header CTA.
      */}
      {!loading && videos.length === 0 && (
        <div className="bg-[#1A0808] border border-white/[0.07] rounded-2xl p-6 sm:p-10 lg:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#C30100]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="1.5"><rect x="2" y="4" width="15" height="16" rx="2"/><polygon points="22 7 17 12 22 17"/></svg>
          </div>
          <h3 className="font-heading text-white uppercase text-sm tracking-widest mb-2">No videos yet</h3>
          <p className="font-body text-white/40 text-sm max-w-sm mx-auto mb-6">Submit your first music video for distribution across major platforms.</p>
          {isGrowthPlan ? (
            <button onClick={onStartNew} className="w-full sm:w-auto min-h-[48px] font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full px-6 py-3 transition-colors">
              Submit your first video
            </button>
          ) : (
            <Link href="/dashboard/settings?tab=subscription" className="w-full sm:w-auto min-h-[48px] font-heading text-white uppercase text-xs tracking-widest bg-[#C30100]/20 border border-[#C30100]/40 hover:bg-[#C30100]/40 rounded-full px-6 py-3 transition-colors inline-flex items-center justify-center">
              Upgrade to Growth
            </Link>
          )}
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
                  {/*
                    The badge is the video's status, full stop.
                    It used to be overridden by payment_status whenever that was not "paid",
                    so a video the admin had already taken live still read "Awaiting payment"
                    to the artist. Video distribution comes with the Growth plan now — nothing
                    is charged for, there is no payment for them to chase, and showing them a
                    payment state describes a flow they are not in.
                  */}
                  <span className={["text-[10px] font-heading tracking-wider px-2 py-0.5 rounded-full uppercase shrink-0", STATUS_COLORS[v.status] ?? "bg-white/10 text-white/50"].join(" ")}>
                    {v.status.replace("_", " ")}
                  </span>
                </div>
                <p className="font-body text-white/40 text-xs">{v.release_artist} · {videoTypeName(v.video_type)}</p>
                {v.platforms.length > 0 && (
                  <p className="font-body text-white/25 text-[10px] truncate">
                    {v.platforms.map(platformName).join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

      {/* What is coming, so nobody starts a twelve-section form expecting three fields. */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <p className="font-body text-white/50 text-xs mb-2">The form covers:</p>
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map((s, i) => (
            <span key={s} className="font-body text-white/40 text-[11px] bg-white/5 rounded px-2 py-1">
              {i + 1}. {s}
            </span>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer" onClick={() => setAcknowledged(!acknowledged)}>
        <div className={[
          "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
          acknowledged ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
        ].join(" ")}>
          {acknowledged && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <p className="font-body text-white/60 text-xs leading-relaxed">I understand the timelines and platform requirements for video distribution.</p>
      </label>
      <button onClick={onStart} disabled={!acknowledged}
        className="font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 rounded-full py-3.5 transition-colors disabled:opacity-40">
        Start submission
      </button>
    </div>
  );
}
