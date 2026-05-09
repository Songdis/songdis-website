"use client";

import { useState, useCallback, useEffect } from "react";
import SelectUploadType from "./steps/SelectUploadType";
import ReleaseDetails from "./steps/ReleaseDetails";
import UploadTrack from "./steps/UploadTrack";
import ReleaseAvailability from "./steps/ReleaseAvailability";
import SubmittedModal from "./steps/SubmittedModal";
import QuickDropModal from "./steps/QuickDropModal";
import { uploadMusic, uploadArtwork, uploadAudio, saveDraft } from "@/lib/api/music";
import { useToast } from "@/components/ui/Toast";

/* ─── Types ───────────────────────────────────────────────────── */
export type ReleaseType = "single" | "album" | "mixtape";

export type UploadStep =
  | "select-type"
  | "release-details"
  | "upload-track"
  | "distribution"
  | "submitted";

export interface UploadState {
  releaseType: ReleaseType | null;
  step: UploadStep;
  // Release details
  artwork: string | null;
  artworkFile: File | null;      // raw file for upload
  artworkUrl: string;            // S3 URL after upload
  artworkKey: string;
  releaseTitle: string;
  releaseVersion: string;
  primaryArtist: string;
  label: string;
  metaLanguage: string;
  upcCode: string;
  cLine: string;
  pLine: string;
  releaseTypeAuto: string;
  noOfTracks: number;
  explicitContent: string;
  coverArtAiUse: string;
  // Track details
  trackTitle: string;
  mixedVersion: string;
  genre: string;
  subGenre: string;
  recordedYear: string;
  isrc: string;
  lyrics: string;
  audioFile: File | null;        // raw file for upload
  audioUrl: string;              // S3 URL after upload
  audioKey: string;
  audioBucket: string;
  audioDuration: string;
  tiktokTimestamp: number;
  // Contributors (free text)
  artistDetails: string;
  writers: string;
  producers: string;
  performers: string;
  // Album tracks — each track mirrors the single track fields
  tracks: Array<{
    trackTitle: string;
    audioFile: File | null;
    audioUrl: string;
    audioKey: string;
    audioBucket: string;
    audioDuration: string;
    isrc: string;
    lyrics: string;
    genre: string;
    subGenre: string;
    explicitContent: string;
    writers: string;
    producers: string;
    performers: string;
    tiktokTimestamp: number;
  }>;
  // Distribution
  releaseDate: string;
  preOrderDate: string;
  territory: "worldwide" | "custom";
  selectedDSPs: string[];
  agreedToTerms: boolean;
  // Quick drop
  quickDropDate: string;
  quickDropPaid: boolean;
}

const INITIAL_STATE: UploadState = {
  releaseType: null,
  step: "select-type",
  artwork: null,
  artworkFile: null,
  artworkUrl: "",
  artworkKey: "",
  releaseTitle: "",
  releaseVersion: "",
  primaryArtist: "",
  label: "",
  metaLanguage: "English",
  upcCode: "",
  cLine: "2026",
  pLine: "2026",
  releaseTypeAuto: "Single",
  noOfTracks: 1,
  explicitContent: "Yes",
  coverArtAiUse: "None",
  trackTitle: "",
  mixedVersion: "",
  genre: "",
  subGenre: "",
  recordedYear: "2026",
  isrc: "",
  lyrics: "",
  audioFile: null,
  audioUrl: "",
  audioKey: "",
  audioBucket: "",
  audioDuration: "",
  tiktokTimestamp: 0,
  artistDetails: "",
  writers: "",
  producers: "",
  performers: "",
  tracks: [],
  releaseDate: "",
  preOrderDate: "",
  territory: "worldwide",
  selectedDSPs: [],
  agreedToTerms: false,
  quickDropDate: "",
  quickDropPaid: false,
};

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_ORDER: UploadStep[] = [
  "select-type",
  "release-details",
  "upload-track",
  "distribution",
  "submitted",
];

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [quickDropOpen, setQuickDropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();

  /* Lock body scroll */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Escape to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const update = useCallback((patch: Partial<UploadState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const goTo = useCallback((step: UploadStep) => {
    setState((s) => ({ ...s, step }));
  }, []);

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx < STEP_ORDER.length - 1) goTo(STEP_ORDER[idx + 1]);
  }, [state.step, goTo]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(state.step);
    if (idx > 0) goTo(STEP_ORDER[idx - 1]);
  }, [state.step, goTo]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    let artworkUrl = state.artworkUrl;
    let artworkKey = state.artworkKey;
    let audioUrl = state.audioUrl;
    let audioKey = state.audioKey;
    let audioBucket = state.audioBucket;

    const toastId = toastLoading("Submitting release...", "Uploading your files");

    try {
      // Step 1 — upload artwork
      if (state.artworkFile && !artworkUrl) {
        dismiss(toastId);
        const artworkToastId = toastLoading("Uploading artwork...");
        const res = await uploadArtwork(state.artworkFile);
        dismiss(artworkToastId);
        if (res.error) {
          toastError("Artwork upload failed", res.error);
          setIsSubmitting(false);
          return;
        }
        const d = res.data as Record<string, unknown>;
        artworkUrl = (d?.file_url ?? d?.url ?? "") as string;
        artworkKey = (d?.s3_key ?? d?.file_path ?? d?.key ?? "") as string;
        if (!artworkUrl) {
          toastError("Artwork upload failed", "No URL returned from server.");
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2 — upload audio
      if (state.audioFile && !audioUrl) {
        const audioToastId = toastLoading("Uploading audio...");
        const res = await uploadAudio(state.audioFile);
        dismiss(audioToastId);
        if (res.error) {
          toastError("Audio upload failed", res.error);
          setIsSubmitting(false);
          return;
        }
        const d = res.data as Record<string, unknown>;
        audioUrl = (d?.file_url ?? d?.url ?? "") as string;
        audioKey = (d?.s3_key ?? d?.file_path ?? "") as string;
        audioBucket = (d?.s3_bucket ?? "songdis-file") as string;
        if (!audioUrl) {
          toastError("Audio upload failed", "No URL returned from server.");
          setIsSubmitting(false);
          return;
        }
      }

      // Step 3 — build payload based on release type
      const releaseToastId = toastLoading("Submitting release...");

      const basePayload = {
        release_title: state.releaseTitle,
        metadata_language: state.metaLanguage,
        primary_artist: state.primaryArtist,
        primary_artist_id: null,
        composer: state.writers || state.primaryArtist,
        album_art_url: artworkUrl,
        album_art_key: artworkKey,
        cover_art_ai_use: state.coverArtAiUse || "None",
        label: state.label || "Independent",
        c_line: `© ${state.cLine} ${state.primaryArtist}`,
        p_line: `℗ ${state.pLine} ${state.primaryArtist}`,
        explicit_content: state.explicitContent === "Yes",
        primary_genre: state.genre,
        secondary_genre: state.subGenre,
        genre: state.genre,
        subgenre: state.subGenre,
        recorded_year: state.recordedYear,
        release_date: state.releaseDate,
        pre_order_date: state.preOrderDate || null,
        is_previously_released: false,
        platforms: state.selectedDSPs,
        territory_rights: state.territory === "worldwide" ? "worldwide" : "custom",
        upc_code: state.upcCode || null,
        stereo_ai_use: "None",
      };

      const isSingle = state.releaseType === "single";

      const payload = isSingle
        ? {
            ...basePayload,
            upload_type: "Single",
            track_title: state.trackTitle || state.releaseTitle,
            audio_file_path: audioUrl,
            s3_key: audioKey,
            s3_bucket: audioBucket,
            isrc: state.isrc || null,
            lyrics: state.lyrics,
            lyrics_language: state.metaLanguage,
            duration: state.audioDuration,
            social_media_timestamp: state.tiktokTimestamp,
            single_track_contributors: null,
            single_track_additional_artists: null,
          }
        : {
            ...basePayload,
            upload_type: "Album/EP",
            release_version: state.releaseVersion || "",
            tracks: state.tracks.map((t, i) => ({
              track_title: t.trackTitle || `Track ${i + 1}`,
              mix_version: "",
              metadata_language: state.metaLanguage,
              primary_artist: state.primaryArtist,
              primary_artist_id: null,
              audio_file_path: t.audioUrl,
              s3_key: t.audioKey,
              s3_bucket: t.audioBucket || "songdis-file",
              explicit_status: t.explicitContent === "Yes" ? "Yes" : "No",
              genre: t.genre || state.genre,
              subgenre: t.subGenre || state.subGenre,
              recorded_year: state.recordedYear,
              isrc: t.isrc || null,
              stereo_ai_use: "None",
              lyrics: t.lyrics || "",
              lyrics_language: state.metaLanguage,
              duration: t.audioDuration || "",
              social_media_timestamp: t.tiktokTimestamp || 0,
              contributors: null,
              additional_artists: null,
            })),
          };

      const res = await uploadMusic(payload);

      dismiss(releaseToastId);

      if (res.error) {
        toastError("Submission failed", res.error);
        setIsSubmitting(false);
        return;
      }

      success("Release submitted!", "Your release is now under review.");
      goTo("submitted");
    } catch {
      toastError("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [state, toastLoading, toastError, success, dismiss]);

  const handleClose = useCallback(() => {
    setState(INITIAL_STATE);
    onClose();
  }, [onClose]);

  const handleSaveDraft = useCallback(async () => {
    const draftToastId = toastLoading("Saving draft...");
    try {
      const res = await saveDraft({
        upload_type: state.releaseType === "single" ? "Single" : "Album/EP",
        current_step: ["select-type","release-details","upload-track","distribution"].indexOf(state.step) + 1,
        form_data: {
          releaseTitle: state.releaseTitle,
          trackTitle: state.trackTitle,
          releaseVersion: state.releaseVersion,
          primaryArtist: state.primaryArtist,
          label: state.label,
          metaLanguage: state.metaLanguage,
          upcCode: state.upcCode,
          cLine: state.cLine,
          pLine: state.pLine,
          explicitContent: state.explicitContent,
          coverArtAiUse: state.coverArtAiUse,
          genre: state.genre,
          subGenre: state.subGenre,
          recordedYear: state.recordedYear,
          isrc: state.isrc,
          lyrics: state.lyrics,
          writers: state.writers,
          producers: state.producers,
          performers: state.performers,
          artistDetails: state.artistDetails,
          releaseDate: state.releaseDate,
          preOrderDate: state.preOrderDate,
          territory: state.territory,
          selectedDSPs: state.selectedDSPs,
          noOfTracks: state.noOfTracks,
          albumArtPreview: state.artwork,
          audioFileUrl: state.audioUrl,
          tiktokTimestamp: state.tiktokTimestamp,
          audioDuration: state.audioDuration,
        },
      });
      dismiss(draftToastId);
      if (res.error) {
        toastError("Draft not saved", res.error);
      } else {
        success("Draft saved!", "You can continue editing from the Drafts tab.");
      }
    } catch {
      dismiss(draftToastId);
      toastError("Draft not saved", "Something went wrong.");
    }
  }, [state, toastLoading, dismiss, success, toastError]);

  if (!isOpen) return null;

  /* Submitted — special full modal */
  if (state.step === "submitted") {
    return (
      <SubmittedModal
        onClose={handleClose}
        onPitchDSPs={() => { handleClose(); }}
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal shell */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
      >
        <div
          className="relative w-full max-w-[900px] rounded-2xl bg-[#1A0808] border border-white/[0.07] my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-5 right-5 z-10 text-white/40 hover:text-white transition-colors focus-visible:outline-none"
          >
            <CloseIcon />
          </button>

          {/* Step content */}
          {state.step === "select-type" && (
            <SelectUploadType
              selected={state.releaseType}
              onSelect={(t) => update({ releaseType: t })}
              onContinue={() => {
                if (state.releaseType) goNext();
              }}
            />
          )}

          {state.step === "release-details" && (
            <ReleaseDetails
              state={state}
              update={update}
              onBack={goBack}
              onContinue={goNext}
              onSaveDraft={handleSaveDraft}
            />
          )}

          {state.step === "upload-track" && (
            <UploadTrack
              state={state}
              update={update}
              onBack={goBack}
              onContinue={goNext}
              onSaveDraft={handleSaveDraft}
            />
          )}

          {state.step === "distribution" && (
            <ReleaseAvailability
              state={state}
              update={update}
              onBack={goBack}
              onSubmit={handleSubmit}
              onQuickDrop={() => setQuickDropOpen(true)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>

      {/* Quick drop nested modal */}
      {quickDropOpen && (
        <QuickDropModal
          onClose={() => setQuickDropOpen(false)}
          onPay={(date) => {
            update({ quickDropDate: date, quickDropPaid: true });
            setQuickDropOpen(false);
          }}
        />
      )}
    </>
  );
}

/* ─── Shared step header ──────────────────────────────────────── */
export function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-6">
      <h2 className="font-heading text-white uppercase text-xl tracking-wide">{title}</h2>
      {subtitle && (
        <p className="font-body text-white/50 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}

/* ─── Shared step progress bar ────────────────────────────────── */
export function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Release details", sub: "Artwork & metadata" },
    { n: 2, label: "Tracks", sub: "Upload your music" },
    { n: 3, label: "Distribution", sub: "Timeline, territory & providers" },
  ];

  return (
    <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={[
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-heading text-xs font-bold border-2 transition-all",
              current >= s.n
                ? "border-[#C30100] bg-[#C30100]/20 text-[#C30100]"
                : "border-white/20 text-white/30",
            ].join(" ")}>
              {s.n}
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className={`font-body text-xs font-medium truncate ${current >= s.n ? "text-white" : "text-white/30"}`}>{s.label}</p>
              <p className="font-body text-[10px] text-white/30 truncate">{s.sub}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-3 ${current > s.n ? "bg-[#C30100]/40" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Shared bottom action bar ───────────────────────────────── */
export function StepActions({
  onBack,
  onSaveDraft,
  onContinue,
  continueLabel = "Continue",
  isSubmit = false,
  isLoading = false,
}: {
  onBack?: () => void;
  onSaveDraft?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  isSubmit?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-6 border-t border-white/[0.06]">
      {onBack && (
        <button
          onClick={onBack}
          className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors"
        >
          Back
        </button>
      )}
      {onSaveDraft && (
        <button
          onClick={onSaveDraft}
          className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors flex items-center justify-center gap-2"
        >
          <SaveIcon /> Save Draft
        </button>
      )}
      <button
        onClick={onContinue}
        disabled={isLoading}
        className={[
          "flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full py-3.5 transition-all",
          isSubmit
            ? "bg-[#C30100] hover:bg-red-700 border border-[#C30100]"
            : "border border-[#C30100] bg-transparent hover:bg-[#C30100]",
        ].join(" ")}
      >
        {isLoading ? "..." : continueLabel}
      </button>
    </div>
  );
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SaveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }