"use client";

import { useState, useCallback, useEffect } from "react";
import SelectUploadType from "./steps/SelectUploadType";
import ReleaseDetails from "./steps/ReleaseDetails";
import UploadTrack from "./steps/UploadTrack";
import ReleaseAvailability from "./steps/ReleaseAvailability";
import SubmittedModal from "./steps/SubmittedModal";
import QuickDropModal from "./steps/QuickDropModal";
import { uploadMusic, saveDraft, getDraft } from "@/lib/api/music";
import { useToast } from "@/components/ui/Toast";

export type ReleaseType = "single" | "album" | "mixtape";
export type UploadStep = "select-type" | "release-details" | "upload-track" | "distribution" | "submitted";

export interface Contributor {
  id: string;
  name: string;
  role: string;
  type: "writer" | "producer" | "performer";
}

export interface AdditionalArtist {
  id: string;
  name: string;
  artistId: string;
  role: "primary" | "featuring" | "remixer";
}

export interface UploadState {
  releaseType: ReleaseType | null;
  step: UploadStep;
  draftId?: number;          
  artwork: string | null;
  artworkFile: File | null;
  artworkUrl: string;
  artworkKey: string;
  artworkSizes: Record<string, unknown> | null;
  releaseTitle: string;
  releaseVersion: string;
  primaryArtist: string;
  label: string;
  metaLanguage: string;
  upcCode: string;
  cLine: string;
  pLine: string;
  noOfTracks: number;
  explicitContent: string;
  coverArtAiUse: string;
  trackTitle: string;
  mixedVersion: string;
  genre: string;
  subGenre: string;
  recordedYear: string;
  isrc: string;
  lyrics: string;
  audioFile: File | null;
  audioUrl: string;
  audioKey: string;
  audioBucket: string;
  audioDuration: string;
  tiktokTimestamp: number;
  artistDetails: string;
  additionalArtists: AdditionalArtist[];
  contributors: {
    writers: Contributor[];
    producers: Contributor[];
    performers: Contributor[];
  };
  tracks: Array<{
    id: string; trackTitle: string; audioUrl: string; audioKey: string;
    audioBucket: string; audioDuration: string; isrc: string; lyrics: string;
    genre: string; subGenre: string; explicitContent: string;
    contributors: { writers: Contributor[]; producers: Contributor[]; performers: Contributor[] };
    additionalArtists: AdditionalArtist[];
    tiktokTimestamp: number; mixedVersion: string;
  }>;
  releaseDate: string;
  preOrderDate: string;
  territory: "worldwide" | "custom";
  selectedDSPs: string[];
  agreedToTerms: boolean;
  quickDropDate: string;
  quickDropPaid: boolean;
  isPreviouslyReleased: boolean;
  originalReleaseDate: string;
}

export type StepFieldErrors = Record<string, string>;

const INITIAL_STATE: UploadState = {
  releaseType: null, step: "select-type", draftId: undefined,
  artwork: null, artworkFile: null, artworkUrl: "", artworkKey: "", artworkSizes: null,
  releaseTitle: "", releaseVersion: "", primaryArtist: "", label: "",
  metaLanguage: "English", upcCode: "", cLine: "2026", pLine: "2026",
  noOfTracks: 1, explicitContent: "Yes", coverArtAiUse: "None",
  trackTitle: "", mixedVersion: "", genre: "", subGenre: "", recordedYear: "2026",
  isrc: "", lyrics: "", audioFile: null, audioUrl: "", audioKey: "", audioBucket: "",
  audioDuration: "", tiktokTimestamp: 0, artistDetails: "",
  additionalArtists: [],
  contributors: { writers: [], producers: [], performers: [] },
  tracks: [], releaseDate: "", preOrderDate: "", territory: "worldwide",
  selectedDSPs: [], agreedToTerms: false, quickDropDate: "", quickDropPaid: false,
  isPreviouslyReleased: false, originalReleaseDate: "",
};

const STEP_ORDER: UploadStep[] = ["select-type", "release-details", "upload-track", "distribution", "submitted"];

function stepIndex(step: UploadStep): number { return STEP_ORDER.indexOf(step); }

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: number;
}

export default function UploadModal({ isOpen, onClose, draftId: initialDraftId }: UploadModalProps) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [quickDropOpen, setQuickDropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<StepFieldErrors>({});
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !initialDraftId) return;

    const loadDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const res = await getDraft(initialDraftId);
        if (res.error || !res.data) {
          toastError("Could not load draft", res.error ?? "Draft not found");
          setIsLoadingDraft(false);
          return;
        }


        const raw = res.data as unknown as Record<string, unknown>;
        const fd  = (raw.form_data as Record<string, unknown>) ?? {};
        const uploadType = String(raw.upload_type ?? "Single").toLowerCase();
        const currentStep = (raw.current_step as number) ?? 1;

        const stepMap: Record<number, UploadStep> = {
          1: "release-details",
          2: "upload-track",
          3: "distribution",
        };
        const targetStep = stepMap[currentStep] ?? "release-details";

        setState({
          ...INITIAL_STATE,
          draftId: initialDraftId,
          releaseType: uploadType.includes("single") ? "single" : "album",
          step: targetStep,
          artwork: (fd.albumArtPreview as string) ?? null,
          artworkUrl: (fd.artworkUrl as string) ?? "",
          artworkKey: (fd.artworkKey as string) ?? "",
          artworkSizes: (fd.artworkSizes as Record<string, unknown>) ?? null,
          releaseTitle: (fd.releaseTitle as string) ?? "",
          releaseVersion: (fd.releaseVersion as string) ?? "",
          primaryArtist: (fd.primaryArtist as string) ?? "",
          label: (fd.label as string) ?? "",
          metaLanguage: (fd.metaLanguage as string) ?? "English",
          upcCode: (fd.upcCode as string) ?? "",
          cLine: (fd.cLine as string) ?? "2026",
          pLine: (fd.pLine as string) ?? "2026",
          noOfTracks: (fd.noOfTracks as number) ?? 1,
          explicitContent: (fd.explicitContent as string) ?? "Yes",
          coverArtAiUse: (fd.coverArtAiUse as string) ?? "None",
          // Track details
          trackTitle: (fd.trackTitle as string) ?? "",
          genre: (fd.genre as string) ?? "",
          subGenre: (fd.subGenre as string) ?? "",
          recordedYear: (fd.recordedYear as string) ?? "2026",
          isrc: (fd.isrc as string) ?? "",
          lyrics: (fd.lyrics as string) ?? "",
          audioUrl: (fd.audioFileUrl as string) ?? "",
          tiktokTimestamp: (fd.tiktokTimestamp as number) ?? 0,
          audioDuration: (fd.audioDuration as string) ?? "",
          contributors: (fd.contributors as UploadState["contributors"]) ?? { writers: [], producers: [], performers: [] },
          artistDetails: (fd.artistDetails as string) ?? "",
          // Distribution
          releaseDate: (fd.releaseDate as string) ?? "",
          preOrderDate: (fd.preOrderDate as string) ?? "",
          territory: (fd.territory as "worldwide" | "custom") ?? "worldwide",
          selectedDSPs: (fd.selectedDSPs as string[]) ?? [],
          tracks: [],
          artworkFile: null, audioFile: null,
          mixedVersion: "",
          audioBucket: "", agreedToTerms: false,
          quickDropDate: "", quickDropPaid: false,
          isPreviouslyReleased: false, originalReleaseDate: "",
        });
      } catch {
        toastError("Could not load draft", "Something went wrong");
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [isOpen, initialDraftId]);

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

  const updateTrack = useCallback((trackId: string, patch: Partial<UploadState["tracks"][number]>) => {
    setState((s) => ({
      ...s,
      tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, ...patch } : t)),
    }));
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setState((s) => ({
      ...s,
      tracks: s.tracks.filter((t) => t.id !== trackId),
    }));
  }, []);

  const reorderTrack = useCallback((fromIndex: number, toIndex: number) => {
    setState((s) => {
      const tracks = [...s.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);
      return { ...s, tracks };
    });
  }, []);

  const goTo = useCallback((step: UploadStep) => setState((s) => ({ ...s, step })), []);
  const goNext = useCallback(() => {
    const idx = stepIndex(state.step);
    if (idx < STEP_ORDER.length - 1) goTo(STEP_ORDER[idx + 1]);
  }, [state.step, goTo]);
  const goBack = useCallback(() => {
    const idx = stepIndex(state.step);
    if (idx > 0) goTo(STEP_ORDER[idx - 1]);
  }, [state.step, goTo]);




  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const handleStep1Continue = useCallback(() => {
    const errors: StepFieldErrors = {};
    if (!state.releaseTitle.trim()) errors.releaseTitle = "Release title is required";
    if (!state.artworkUrl) errors.artwork = "Artwork must be uploaded before continuing";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    if (state.releaseType === "single") {
      update({ trackTitle: state.releaseTitle, artistDetails: state.primaryArtist });
      const writer: Contributor = { id: `writer_auto_${Date.now()}`, name: state.primaryArtist, role: "Songwriter", type: "writer" };
      const performer: Contributor = { id: `performer_auto_${Date.now()}`, name: state.primaryArtist, role: "Lead Vocals", type: "performer" };
      update({ contributors: { writers: [writer], producers: [], performers: [performer] } });
    }
    goNext();
  }, [state.releaseTitle, state.artworkUrl, state.releaseType, state.primaryArtist, update, goNext]);

  const handleStep2Continue = useCallback(() => {
    const errors: StepFieldErrors = {};
    const isMultiTrack = state.releaseType === "album" || state.releaseType === "mixtape";

    if (isMultiTrack) {
      if (state.tracks.length < 2) {
        errors.tracks = "Album/EP or Mixtape must have at least 2 tracks. Add more tracks before continuing.";
      } else {
        const incompleteTracks: { index: number; missing: string[] }[] = [];
        state.tracks.forEach((track, i) => {
          const missing: string[] = [];
          if (!track.trackTitle?.trim()) missing.push("Title");
          if (!track.genre) missing.push("Genre");
          if (!track.subGenre) missing.push("Sub-genre");
          if (!track.explicitContent) missing.push("Explicit content");
          if (missing.length > 0) incompleteTracks.push({ index: i + 1, missing });
        });
        if (incompleteTracks.length > 0) {
          const details = incompleteTracks.map((t) => `Track ${t.index}: ${t.missing.join(", ")}`).join(" · ");
          errors.tracks = `Missing required info on tracks — ${details}. Click edit on each track to fill in.`;
        }
      }
    } else {
      if (!state.audioUrl) errors.audio = "Audio must be uploaded before continuing";
      if (!state.genre) errors.genre = "Genre is required";
      if (!state.subGenre) errors.subGenre = "Sub-genre is required";
      if (!state.explicitContent) errors.explicit = "Explicit content is required";
      if (state.contributors.writers.length === 0 || state.contributors.writers.every((w) => !w.name.trim())) errors.writers = "At least one writer is required";
      if (state.contributors.performers.length === 0 || state.contributors.performers.every((p) => !p.name.trim())) errors.performers = "At least one performer is required";
    }

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    goNext();
  }, [state.audioUrl, state.genre, state.subGenre, state.explicitContent, state.contributors, state.releaseType, state.tracks, goNext]);

  const formatContributorsForBackend = useCallback((contributors: { writers: Contributor[]; producers: Contributor[]; performers: Contributor[] }) => {
    const all: { name: string; role: string; type: string }[] = [];
    for (const [type, list] of Object.entries(contributors)) {
      for (const c of list) {
        if (c.name && c.role) {
          all.push({ name: c.name, role: c.role, type: type.slice(0, -1) });
        }
      }
    }
    return all;
  }, []);

  const formatAdditionalArtistsForBackend = useCallback((artists: AdditionalArtist[]) => {
    return artists
      .filter((a) => a.name && a.role)
      .map((a) => ({ name: a.name, artist_id: a.artistId || "", role: a.role }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const t = toastLoading("Submitting release...");
      const isSingle = state.releaseType === "single";
      const formattedContributors = formatContributorsForBackend(state.contributors);
      const base = {
        release_title: state.releaseTitle, metadata_language: state.metaLanguage,
        primary_artist: state.primaryArtist, primary_artist_id: null,
        composer: state.contributors.writers.map((w) => w.name).join(", ") || state.primaryArtist,
        album_art_url: state.artworkUrl, album_art_key: state.artworkKey,
        album_art_sizes: state.artworkSizes ? JSON.stringify(state.artworkSizes) : null,
        cover_art_ai_use: state.coverArtAiUse || "None",
        label: state.label || "Independent",
        c_line: `© ${state.cLine} ${state.primaryArtist}`,
        p_line: `℗ ${state.pLine} ${state.primaryArtist}`,
        explicit_content: state.explicitContent === "Yes",
        primary_genre: state.genre, secondary_genre: state.subGenre,
        genre: state.genre, subgenre: state.subGenre, recorded_year: state.recordedYear,
        release_date: state.releaseDate, pre_order_date: state.preOrderDate || null,
        is_previously_released: state.isPreviouslyReleased,
        original_release_date: state.isPreviouslyReleased ? state.originalReleaseDate : null,
        platforms: state.selectedDSPs,
        territory_rights: state.territory === "worldwide" ? "worldwide" : "custom",
        upc_code: state.upcCode || null, stereo_ai_use: "None",
      };
      const payload = isSingle
        ? { ...base, upload_type: "Single", track_title: state.trackTitle || state.releaseTitle,
            audio_file_path: state.audioUrl, s3_key: state.audioKey, s3_bucket: state.audioBucket,
            isrc: state.isrc || null, lyrics: state.lyrics, lyrics_language: state.metaLanguage,
            duration: state.audioDuration, social_media_timestamp: state.tiktokTimestamp,
            single_track_contributors: JSON.stringify(formattedContributors),
            single_track_additional_artists: state.additionalArtists.length > 0 ? JSON.stringify(formatAdditionalArtistsForBackend(state.additionalArtists)) : null }
        : { ...base, upload_type: "Album/EP", release_version: state.releaseVersion || "",
            additional_artists: state.additionalArtists.length > 0 ? JSON.stringify(formatAdditionalArtistsForBackend(state.additionalArtists)) : null,
            tracks: state.tracks.map((tr, i) => ({
              track_title: tr.trackTitle || `Track ${i + 1}`, mix_version: tr.mixedVersion || "",
              metadata_language: state.metaLanguage, primary_artist: state.primaryArtist,
              primary_artist_id: null, audio_file_path: tr.audioUrl,
              s3_key: tr.audioKey, s3_bucket: tr.audioBucket || "songdis-file",
              explicit_status: tr.explicitContent === "Yes" ? "Yes" : "No",
              genre: tr.genre || state.genre, subgenre: tr.subGenre || state.subGenre,
              recorded_year: state.recordedYear, isrc: tr.isrc || null, stereo_ai_use: "None",
              lyrics: tr.lyrics || "", lyrics_language: state.metaLanguage,
              duration: tr.audioDuration || "", social_media_timestamp: tr.tiktokTimestamp || 0,
              contributors: JSON.stringify(formatContributorsForBackend(tr.contributors)),
              additional_artists: tr.additionalArtists && tr.additionalArtists.length > 0
                ? JSON.stringify(formatAdditionalArtistsForBackend(tr.additionalArtists))
                : null,
            })) };

      const res = await uploadMusic(payload);
      dismiss(t);
      if (res.error) { toastError("Submission failed", res.error); setIsSubmitting(false); return; }
      success("Release submitted!", "Your release is now under review.");
      goTo("submitted");
    } catch {
      toastError("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [state, toastLoading, toastError, success, dismiss, goTo, formatContributorsForBackend]);

  /* Step 3 validation: releaseDate + providers required */
  const handleStep3Submit = useCallback(() => {
    const errors: StepFieldErrors = {};
    if (!state.releaseDate) errors.releaseDate = "Release date is required";
    if (state.selectedDSPs.length === 0) errors.platforms = "Select at least one provider";
    if (!state.agreedToTerms) errors.terms = "You must accept the terms";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    handleSubmit();
  }, [state.releaseDate, state.selectedDSPs, state.agreedToTerms, handleSubmit]);

  /** The draft payload, shared by the manual "Save draft" button and the
   *  silent save Quick Drop performs before taking payment. */
  const buildDraftPayload = useCallback(() => ({
    draft_id: state.draftId,
    upload_type: state.releaseType === "single" ? "Single" as const : "Album/EP" as const,
    current_step: Math.max(1, stepIndex(state.step)),
    form_data: {
      releaseTitle: state.releaseTitle, trackTitle: state.trackTitle,
      releaseVersion: state.releaseVersion, primaryArtist: state.primaryArtist,
      label: state.label, metaLanguage: state.metaLanguage, upcCode: state.upcCode,
      cLine: state.cLine, pLine: state.pLine, explicitContent: state.explicitContent,
      coverArtAiUse: state.coverArtAiUse, genre: state.genre, subGenre: state.subGenre,
      recordedYear: state.recordedYear, isrc: state.isrc, lyrics: state.lyrics,
      contributors: state.contributors,
      artistDetails: state.artistDetails, releaseDate: state.releaseDate,
      preOrderDate: state.preOrderDate, territory: state.territory,
      selectedDSPs: state.selectedDSPs, noOfTracks: state.noOfTracks,
      albumArtPreview: state.artwork, audioFileUrl: state.audioUrl,
      artworkUrl: state.artworkUrl, artworkKey: state.artworkKey,
      artworkSizes: state.artworkSizes,
      tiktokTimestamp: state.tiktokTimestamp, audioDuration: state.audioDuration,
      isPreviouslyReleased: state.isPreviouslyReleased, originalReleaseDate: state.originalReleaseDate,
    },
  }), [state]);


  const saveDraftQuietly = useCallback(async (): Promise<number | undefined> => {
    const res = await saveDraft(buildDraftPayload());

    if (res.error) return state.draftId;

    const raw = res.data as unknown as Record<string, unknown> | null;
    const newDraftId = (raw?.draft_id as number | undefined) ?? (raw?.id as number | undefined);

    if (newDraftId && !state.draftId) update({ draftId: newDraftId });

    return newDraftId ?? state.draftId;
  }, [buildDraftPayload, state.draftId, update]);

  const handleSaveDraft = useCallback(async () => {
    const t = toastLoading("Saving draft...");
    try {
      const res = await saveDraft(buildDraftPayload());
      dismiss(t);
      if (res.error) {
        toastError("Draft not saved", res.error);
      } else {
        const newDraftId = (res.data as unknown as Record<string, unknown>)?.draft_id as number | undefined
          ?? (res.data as unknown as Record<string, unknown>)?.id as number | undefined;
        if (newDraftId && !state.draftId) update({ draftId: newDraftId });
        success("Draft saved!", "You can continue editing from the Drafts tab.");
      }
    } catch {
      dismiss(t);
      toastError("Draft not saved", "Something went wrong.");
    }
  }, [buildDraftPayload, state.draftId, toastLoading, dismiss, success, toastError, update]);

  const handleClose = useCallback(() => { setState(INITIAL_STATE); onClose(); }, [onClose]);

  if (!isOpen) return null;

  if (state.step === "submitted") {
    return <SubmittedModal onClose={handleClose} onPitchDSPs={() => handleClose()} />;
  }

  if (isLoadingDraft) {
    return (
      <>
        <div aria-hidden className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-2xl bg-[#1A0808] border border-white/[0.07] p-12 flex flex-col items-center gap-4">
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C30100" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <p className="font-body text-white/60 text-sm">Loading draft...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
        <div className="relative w-full max-w-[900px] rounded-2xl bg-[#1A0808] border border-white/[0.07] my-auto" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleClose} aria-label="Close" className="absolute top-5 right-5 z-10 text-white/40 hover:text-white transition-colors">
            <CloseIcon />
          </button>
          {state.step === "select-type" && (
            <SelectUploadType selected={state.releaseType} onSelect={(t) => update({ releaseType: t })} onContinue={() => { if (state.releaseType) goNext(); }} />
          )}
          {state.step === "release-details" && (
            <ReleaseDetails state={state} update={update} onBack={goBack} onContinue={handleStep1Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} />
          )}
          {state.step === "upload-track" && (
            <UploadTrack state={state} update={update} updateTrack={updateTrack} removeTrack={removeTrack} reorderTrack={reorderTrack} onBack={goBack} onContinue={handleStep2Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} />
          )}
          {state.step === "distribution" && (
            <ReleaseAvailability state={state} update={update} onBack={goBack} onSubmit={handleStep3Submit} onQuickDrop={() => setQuickDropOpen(true)} onSaveDraft={handleSaveDraft} isSubmitting={isSubmitting} fieldErrors={fieldErrors} clearFieldError={clearFieldError} />
          )}
        </div>
      </div>
      {quickDropOpen && (
        <QuickDropModal
          onClose={() => setQuickDropOpen(false)}
          saveDraft={saveDraftQuietly}
          onActivated={(releaseDate) =>
            update({ quickDropDate: releaseDate, releaseDate, quickDropPaid: true })
          }
          releaseData={{
            releaseTitle: state.releaseTitle,
            primaryArtist: state.primaryArtist,
            uploadType: state.releaseType === "single" ? "Single" : "Album/EP",
            trackCount: 1,
          }}
        />
      )}
    </>
  );
}

export function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-6">
      <h2 className="font-heading text-white uppercase text-xl tracking-wide">{title}</h2>
      {subtitle && <p className="font-body text-white/50 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

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
            <div className={["w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-heading text-xs font-bold border-2 transition-all",
              current >= s.n ? "border-[#C30100] bg-[#C30100]/20 text-[#C30100]" : "border-white/20 text-white/30"].join(" ")}>
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

export function StepActions({ onBack, onSaveDraft, onContinue, continueLabel = "Continue", isSubmit = false, isLoading = false }: {
  onBack?: () => void; onSaveDraft?: () => void; onContinue: () => void;
  continueLabel?: string; isSubmit?: boolean; isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-6 border-t border-white/[0.06]">
      {onBack && (
        <button onClick={onBack} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors min-h-[48px]">Back</button>
      )}
      {onSaveDraft && (
        <button onClick={onSaveDraft} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors flex items-center justify-center gap-2 min-h-[48px]">
          <SaveIcon /> Save Draft
        </button>
      )}
      <button onClick={onContinue} disabled={isLoading}
        className={["flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full py-3.5 transition-all min-h-[48px]",
          isSubmit ? "bg-[#C30100] hover:bg-red-700 border border-[#C30100]" : "border border-[#C30100] bg-transparent hover:bg-[#C30100]"].join(" ")}>
        {isLoading ? "..." : continueLabel}
      </button>
    </div>
  );
}

function CloseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function SaveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }