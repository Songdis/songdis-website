"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useToast as useStepToast, Toaster as StepToaster } from "@/components/dashboard/press-kit/primitives";
import SelectUploadType from "./steps/SelectUploadType";
import ReleaseDetails from "./steps/ReleaseDetails";
import UploadTrack from "./steps/UploadTrack";
import ReleaseAvailability from "./steps/ReleaseAvailability";
import SubmittedModal from "./steps/SubmittedModal";
import QuickDropModal from "./steps/QuickDropModal";
import { uploadMusic, saveDraft, getDraft, getDrafts } from "@/lib/api/music";
import { DRAFTS_CHANGED_EVENT } from "@/lib/hooks/useMusic";
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


function normaliseCoverArtAiUse(value: unknown): string {
  const raw = String(value ?? "None");

  const legacy: Record<string, string> = {
    "Partial AI": "Some",
    "Fully AI Generated": "All",
    "No AI used": "None",
  };

  const mapped = legacy[raw] ?? raw;

  return ["None", "Some", "All"].includes(mapped) ? mapped : "None";
}


/** Stereo AI Use as the API stores it: None, Some (partial) or All (full). */
export function normaliseStereoAiUse(value: unknown): "None" | "Some" | "All" {
  const raw = String(value ?? "None");
  const mapped = ({ Partial: "Some", Full: "All" } as Record<string, string>)[raw] ?? raw;

  return mapped === "Some" || mapped === "All" ? mapped : "None";
}


function normaliseTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (value && typeof value === "object") {
    const v = value as { minutes?: unknown; seconds?: unknown };
    const minutes = Number(v.minutes ?? 0);
    const seconds = Number(v.seconds ?? 0);

    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return Math.max(0, Math.floor(minutes * 60 + seconds));
    }
  }

  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? Math.max(0, Math.floor(asNumber)) : 0;
}

interface SubmitProblem {
  field: string;
  message: string;
  step: "Release details" | "Tracks" | "Distribution" | null;
}


function stepForField(field: string): SubmitProblem["step"] {
  const base = field.replace(/^tracks\.\d+\./, "");

  if (base.startsWith("tracks")) return "Tracks";

  const details = [
    "release_title", "track_title", "primary_artist", "composer", "label",
    "album_art_url", "album_art_key", "album_art_sizes", "cover_art_ai_use",
    "c_line", "p_line", "explicit_content", "primary_genre", "secondary_genre",
    "genre", "subgenre", "recorded_year", "metadata_language", "upc_code",
  ];

  const tracks = [
    "audio_file_path", "s3_key", "s3_bucket", "isrc", "lyrics",
    "lyrics_language", "duration", "social_media_timestamp",
    "stereo_ai_use", "contributors", "additional_artists",
    "single_track_contributors", "single_track_additional_artists",
  ];

  const distribution = [
    "release_date", "pre_order_date", "is_previously_released",
    "original_release_date", "platforms", "territory_rights",
  ];

  if (details.includes(base)) return "Release details";
  if (tracks.includes(base)) return "Tracks";
  if (distribution.includes(base)) return "Distribution";

  return null;
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
  noOfTracks: number;
  explicitContent: string;
  coverArtAiUse: string;
  /** "None" | "Some" | "All". The single's answer, and the default for an album's tracks. */
  stereoAiUse: string;
  trackTitle: string;
  mixedVersion: string;
  genre: string;
  subGenre: string;
  recordedYear: string;
  /**
   * C/P line. Only the year and the owner are collected; the API appends
   * ", Distributed by Songdis" and that part is neither shown nor editable here.
   * An empty owner means the primary artist.
   */
  cLine: string;
  cLineOwner: string;
  pLine: string;
  pLineOwner: string;
  /** ISO 3166-1 alpha-2. Symphonic: optional at import, required before release. */
  recordingCountry: string;
  /** Singles answer Is Cover Song here; album tracks each answer for themselves. */
  isCoverSong: string;
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
    /** "Yes" | "No" | "" — Symphonic's Is Cover Song, which is per track. */
    isCoverSong: string;
    /** Overrides the release's Stereo AI Use for this track; empty means the same as the release. */
    stereoAiUse?: string;
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
  metaLanguage: "English", upcCode: "",
  noOfTracks: 1, explicitContent: "Yes", coverArtAiUse: "None", stereoAiUse: "None",
  trackTitle: "", mixedVersion: "", genre: "", subGenre: "", recordedYear: String(new Date().getFullYear()),
  cLine: String(new Date().getFullYear()), cLineOwner: "", pLine: String(new Date().getFullYear()), pLineOwner: "",
  recordingCountry: "", isCoverSong: "",
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

function formatReviewValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "string" && value.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return formatReviewValue(parsed);
    } catch { /* not JSON after all — fall through */ }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    const names = value.map((v) =>
      typeof v === "string" ? v : (v as { name?: string })?.name ?? String(v)
    );
    return names.length > 6
      ? `${names.slice(0, 6).join(", ")} +${names.length - 6} more`
      : names.join(", ");
  }

  const text = String(value);
  return text.length > 200 ? `${text.slice(0, 200)}…` : text;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftId?: number;
  editReleaseId?: number;
  /** The track being edited, when the request was opened from one row of an album. */
  editTrackTitle?: string;
  onRevisionSubmitted?: () => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  draftId: initialDraftId,
  editReleaseId,
  editTrackTitle,
  onRevisionSubmitted,
}: UploadModalProps) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [quickDropOpen, setQuickDropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  /** A draft chosen from the "continue a draft" list shown when an upload starts. */
  const [pickedDraftId, setPickedDraftId] = useState<number | undefined>(undefined);
  const draftToLoad = initialDraftId ?? pickedDraftId;
  /** Drafts offered at the start of a new upload; null until loaded, cleared once answered. */
  const [draftChoices, setDraftChoices] = useState<DraftChoice[] | null>(null);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null);
  const [fieldErrors, setFieldErrors] = useState<StepFieldErrors>({});
  const [submitErrors, setSubmitErrors] = useState<SubmitProblem[]>([]);

  const submitErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitErrors.length === 0) return;
    submitErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [submitErrors]);
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();
  /*
   * Telling someone why Continue did nothing.
   *
   * The step validators set field errors and stop. Those errors render beside their fields,
   * which on this form are below the fold — so an artist missing a songwriter pressed
   * Continue, saw the page not move, and concluded the button was broken. The toast is the
   * same one the press kit uses, and it is the only part of the failure they are guaranteed
   * to see.
   */
  const { toast: stepToast, show: showStepToast } = useStepToast();

  /** Say what is missing, naming the fields rather than counting them. */
  const announceMissing = useCallback((errors: StepFieldErrors) => {
    const LABELS: Record<string, string> = {
      releaseTitle: "release title",
      artwork: "artwork",
      audio: "audio file",
      genre: "genre",
      subGenre: "sub-genre",
      explicit: "explicit content",
      // Worded as the form words them, so the toast points at a field they can see rather
      // than at an internal name.
      writers: "songwriter's full name",
      producers: "production credit",
      performers: "performer credit",
      tracks: "track details",
    };

    const missing = Object.keys(errors).map((key) => LABELS[key] ?? key);

    if (missing.length === 0) return;

    // One name reads better than a list of one, and the tracks error already explains itself.
    const text = errors.tracks
      ? String(errors.tracks)
      : missing.length === 1
        ? `Add the ${missing[0]} before continuing`
        : `Still needed: ${missing.join(", ")}`;

    showStepToast(text, "bad");

    // The field itself is somewhere below; bring the first one into view so the toast is not
    // the only thing they have to go on.
    requestAnimationFrame(() => {
      document
        .querySelector('[data-step-error="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [showStepToast]);

  const isEditing = Boolean(editReleaseId);

  /*
   * While editing, the wizard works on ONE music_uploads row — the one the request is
   * attached to — even when that row belongs to an album.
   *
   * The multi-track editor writes to state.tracks, and nothing in state.tracks is sent:
   * proposedFromState() builds the payload from the top-level fields only. Leaving the album
   * editor on screen during an edit meant an artist could change a track, see it accepted,
   * and have the change silently dropped while the diff was taken against the row the modal
   * had been opened with — the cause of "I edited the feature on one song and it recorded a
   * writers credit change on another".
   *
   * Release-level fields still reach every track: the API propagates them across siblings.
   */
  const editsOneTrack = isEditing;
  const [original, setOriginal] = useState<Record<string, unknown> | null>(null);
  const [lockedFields, setLockedFields] = useState<Record<string, string | null>>({});
  const [originalTracks, setOriginalTracks] = useState<Array<{ id: number; track_title: string | null; s3_key: string | null }>>([]);
  const [editReason, setEditReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !editReleaseId) return;

    let cancelled = false;

    (async () => {
      setIsLoadingDraft(true);

      const { getEditForm } = await import("@/lib/api/editRequests");
      const res = await getEditForm(editReleaseId);

      if (cancelled) return;

      if (res.error || !res.data) {
        toastError("Could not open this release", res.error ?? "Release not found");
        setIsLoadingDraft(false);
        return;
      }

      const v = res.data.values as Record<string, string | null>;
      const asList = (raw: unknown): unknown[] => {
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string" && raw.trim()) {
          try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
        }
        return [];
      };

      setOriginal(res.data.values);
      setLockedFields(res.data.locked_fields);
      setOriginalTracks((res.data.tracks ?? []).map((t) => ({ id: t.id, track_title: t.track_title, s3_key: t.s3_key })));

      setState((prev) => ({
        ...prev,
        step: "release-details",
        releaseType: String(res.data!.release.upload_type ?? "").toLowerCase().includes("album")
          ? "album" : "single",
        releaseTitle: v.release_title || v.track_title || "",
        releaseVersion: v.release_version ?? "",
        primaryArtist: v.primary_artist ?? "",
        label: v.label ?? "",
        metaLanguage: v.metadata_language ?? "English",
        genre: v.primary_genre ?? "",
        subGenre: v.secondary_genre ?? "",
        recordedYear: v.recorded_year ?? String(new Date().getFullYear()),
        releaseDate: v.release_date ? String(v.release_date).slice(0, 10) : "",
        preOrderDate: v.pre_order_date ? String(v.pre_order_date).slice(0, 10) : "",
        explicitContent: v.explicit_content ? "Yes" : "No",
        coverArtAiUse: normaliseCoverArtAiUse(v.cover_art_ai_use),
        stereoAiUse: normaliseStereoAiUse(v.stereo_ai_use),
        trackTitle: v.track_title ?? "",
        mixedVersion: v.mix_version ?? "",
        lyrics: v.lyrics ?? "",
        artworkUrl: (v.album_art_url as string) ?? "",
        artworkKey: v.album_art_key ?? "",
        artwork: (v.album_art_url as string) ?? null,
        audioUrl: (v.audio_file_path as string) ?? "",
        audioKey: v.s3_key ?? "",
        audioBucket: (v.s3_bucket as string) ?? "songdis-file",
        upcCode: res.data!.locked_fields.upc_code ?? "",
        isrc: res.data!.locked_fields.isrc_code ?? "",
        tracks: (res.data!.tracks ?? []).map((t) => ({
          isCoverSong: "",
          id: String(t.id),
          trackTitle: t.track_title ?? "",
          audioUrl: t.audio_file_path ?? "",
          audioKey: t.s3_key ?? "",
          audioBucket: t.s3_bucket ?? "songdis-file",
          audioDuration: "",
          isrc: t.isrc_code ?? "",
          lyrics: t.lyrics ?? "",
          genre: t.primary_genre ?? "",
          subGenre: t.secondary_genre ?? "",
          explicitContent: t.explicit_content ? "Yes" : "No",
          contributors: { writers: [], producers: [], performers: [] },
          additionalArtists: [],
          tiktokTimestamp: 0,
          mixedVersion: t.mix_version ?? "",
        })),
        noOfTracks: Math.max(1, res.data!.tracks?.length ?? 1),
        selectedDSPs: asList(v.platforms) as string[],
        territory: v.territory_rights === "custom" ? "custom" : "worldwide",
        additionalArtists: asList(v.additional_artists).map((raw, i) => {
          const a = (raw ?? {}) as Record<string, unknown>;
          return {
            id: String(a.id ?? `existing-${i}`),
            name: String(a.name ?? ""),
            artistId: String(a.artistId ?? a.artist_id ?? ""),
            role: (a.role as "primary" | "featuring" | "remixer") ?? "featuring",
          };
        }),
        isPreviouslyReleased: Boolean(v.is_previously_released),
        originalReleaseDate: v.original_release_date ? String(v.original_release_date).slice(0, 10) : "",

        contributors: asList(v.contributors).reduce<UploadState["contributors"]>(
          (acc, raw, i) => {
            const c = (raw ?? {}) as Record<string, unknown>;
            const name = String(c.name ?? "").trim();
            const bucket =
              c.type === "writer" ? "writers"
              : c.type === "producer" ? "producers"
              : c.type === "performer" ? "performers"
              : null;

            if (name && bucket) {
              acc[bucket].push({
                id: `existing-${bucket}-${i}`,
                name,
                role: String(c.role ?? ""),
                type: c.type as Contributor["type"],
              });
            }

            return acc;
          },
          { writers: [], producers: [], performers: [] }
        ),
        tiktokTimestamp: normaliseTimestamp(v.social_media_timestamp),
      }));

      setIsLoadingDraft(false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, editReleaseId, toastError]);

  useEffect(() => {
    if (!isOpen || !draftToLoad) return;

    const loadDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const res = await getDraft(draftToLoad);
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

        draftIdRef.current = draftToLoad;

        // upload_type only knows Single and Album/EP; a mixtape was saved as Album/EP and
        // came back as an album. form_data has kept the real type since tracks were added.
        const savedType = fd.releaseType as ReleaseType | undefined;
        const releaseType: ReleaseType =
          savedType === "single" || savedType === "album" || savedType === "mixtape"
            ? savedType
            : uploadType.includes("single") ? "single" : "album";

        // Tracks saved by older versions of the form lack fields the form now reads
        // (contributors, additionalArtists, isCoverSong); without defaults, submitting a
        // resumed album threw on the first such track.
        const savedTracks = Array.isArray(fd.tracks) ? (fd.tracks as Partial<UploadState["tracks"][number]>[]) : [];
        const tracks: UploadState["tracks"] = savedTracks.map((t, i) => ({
          id: t.id ?? `track_restored_${i}`,
          trackTitle: t.trackTitle ?? "",
          audioUrl: t.audioUrl ?? "",
          audioKey: t.audioKey ?? "",
          audioBucket: t.audioBucket ?? "",
          audioDuration: t.audioDuration ?? "",
          isrc: t.isrc ?? "",
          lyrics: t.lyrics ?? "",
          genre: t.genre ?? "",
          subGenre: t.subGenre ?? "",
          explicitContent: t.explicitContent ?? "Yes",
          isCoverSong: t.isCoverSong ?? "",
          stereoAiUse: t.stereoAiUse ? normaliseStereoAiUse(t.stereoAiUse) : "",
          contributors: {
            writers: t.contributors?.writers ?? [],
            producers: t.contributors?.producers ?? [],
            performers: t.contributors?.performers ?? [],
          },
          additionalArtists: t.additionalArtists ?? [],
          tiktokTimestamp: normaliseTimestamp(t.tiktokTimestamp),
          mixedVersion: t.mixedVersion ?? "",
        }));

        const artworkUrl = (fd.artworkUrl as string) ?? "";
        const preview = fd.albumArtPreview as string | null | undefined;

        setState({
          ...INITIAL_STATE,
          draftId: draftToLoad,
          releaseType,
          step: targetStep,
          // Drafts saved before this fix stored a blob: URL here, dead once that tab closed.
          artwork: artworkUrl || (preview && !preview.startsWith("blob:") ? preview : null),
          artworkUrl: (fd.artworkUrl as string) ?? "",
          artworkKey: (fd.artworkKey as string) ?? "",
          artworkSizes: (fd.artworkSizes as Record<string, unknown>) ?? null,
          releaseTitle: (fd.releaseTitle as string) ?? "",
          releaseVersion: (fd.releaseVersion as string) ?? "",
          primaryArtist: (fd.primaryArtist as string) ?? "",
          label: (fd.label as string) ?? "",
          metaLanguage: (fd.metaLanguage as string) ?? "English",
          upcCode: (fd.upcCode as string) ?? "",
          noOfTracks: (fd.noOfTracks as number) ?? 1,
          explicitContent: (fd.explicitContent as string) ?? "Yes",
          coverArtAiUse: normaliseCoverArtAiUse(fd.coverArtAiUse),
          stereoAiUse: normaliseStereoAiUse(fd.stereoAiUse),
          // Track details
          trackTitle: (fd.trackTitle as string) ?? "",
          genre: (fd.genre as string) ?? "",
          subGenre: (fd.subGenre as string) ?? "",
          recordedYear: (fd.recordedYear as string) ?? String(new Date().getFullYear()),
          cLine: (fd.cLine as string) ?? String(new Date().getFullYear()),
          cLineOwner: (fd.cLineOwner as string) ?? "",
          pLine: (fd.pLine as string) ?? String(new Date().getFullYear()),
          pLineOwner: (fd.pLineOwner as string) ?? "",
          recordingCountry: (fd.recordingCountry as string) ?? "",
          isCoverSong: (fd.isCoverSong as string) ?? "",
          isrc: (fd.isrc as string) ?? "",
          lyrics: (fd.lyrics as string) ?? "",
          audioUrl: (fd.audioFileUrl as string) ?? "",
          tiktokTimestamp: normaliseTimestamp(fd.tiktokTimestamp),
          audioDuration: (fd.audioDuration as string) ?? "",
          contributors: (fd.contributors as UploadState["contributors"]) ?? { writers: [], producers: [], performers: [] },
          artistDetails: (fd.artistDetails as string) ?? "",
          // Distribution
          releaseDate: (fd.releaseDate as string) ?? "",
          preOrderDate: (fd.preOrderDate as string) ?? "",
          territory: (fd.territory as "worldwide" | "custom") ?? "worldwide",
          selectedDSPs: (fd.selectedDSPs as string[]) ?? [],
          tracks,
          artworkFile: null, audioFile: null,
          mixedVersion: (fd.mixedVersion as string) ?? "",
          additionalArtists: Array.isArray(fd.additionalArtists) ? (fd.additionalArtists as AdditionalArtist[]) : [],
          // Restored alongside the url: the submit sends s3_key from here, and without it a
          // resumed draft uploaded fine and then failed validation for a missing file.
          audioKey: (fd.audioKey as string) ?? "",
          audioBucket: (fd.audioBucket as string) ?? "", agreedToTerms: false,
          quickDropDate: "", quickDropPaid: false,
          // Saved all along, but reset to blank on every resume.
          isPreviouslyReleased: Boolean(fd.isPreviouslyReleased),
          originalReleaseDate: (fd.originalReleaseDate as string) ?? "",
        });
      } catch {
        toastError("Could not load draft", "Something went wrong");
      } finally {
        setIsLoadingDraft(false);
      }
    };

    loadDraft();
  }, [isOpen, draftToLoad]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const draftIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || initialDraftId || editReleaseId) return;
    let cancelled = false;
    getDrafts().then((res) => {
      if (cancelled) return;
      const raw = res.data as unknown;
      const list = (Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown })?.data) ? (raw as { data: unknown[] }).data : []) as Record<string, unknown>[];
      setDraftChoices(list.map((d) => ({
        id: Number(d.draft_id ?? d.id),
        title: String(d.release_title ?? "Untitled"),
        type: String(d.upload_type ?? ""),
        artist: String(d.primary_artist ?? ""),
        artwork: (d.artwork_url as string | null) ?? null,
        updatedAt: String(d.updated_at ?? ""),
      })).filter((d) => Number.isFinite(d.id)));
    });
    return () => { cancelled = true; };
  }, [isOpen, initialDraftId, editReleaseId]);
  const idempotencyKeyRef = useRef<string | undefined>(undefined);

  const update = useCallback((patch: Partial<UploadState>) => {
    if (patch.draftId !== undefined) draftIdRef.current = patch.draftId;
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
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); announceMissing(errors); return; }
    setFieldErrors({});
    if (state.releaseType === "single") {
      // A single's track title is its release title.
      update({ trackTitle: state.releaseTitle, artistDetails: state.primaryArtist });

      /*
       * Seed one blank writer and the primary artist as performer — but only when there are
       * no credits yet. This used to run on every Continue, including while editing a live
       * release, so opening the edit form wiped the saved writers, producers and performers
       * and the artist had to retype them (or sent a request that deleted them).
       */
      const c = state.contributors;
      const hasCredits = c.writers.length + c.producers.length + c.performers.length > 0;

      if (!isEditing && !hasCredits) {
        const writer: Contributor = { id: `writer_auto_${Date.now()}`, name: "", role: "Songwriter", type: "writer" };
        const performer: Contributor = { id: `performer_auto_${Date.now()}`, name: state.primaryArtist, role: "Lead Vocals", type: "performer" };
        update({ contributors: { writers: [writer], producers: [], performers: [performer] } });
      }
    }
    goNext();
  }, [state.releaseTitle, state.artworkUrl, state.releaseType, state.primaryArtist, state.contributors, isEditing, update, goNext, announceMissing]);

  const handleStep2Continue = useCallback(() => {
    const errors: StepFieldErrors = {};
    const isMultiTrack = !editsOneTrack
      && (state.releaseType === "album" || state.releaseType === "mixtape");

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

    if (Object.keys(errors).length > 0) { setFieldErrors(errors); announceMissing(errors); return; }
    setFieldErrors({});
    goNext();
  }, [state.audioUrl, state.genre, state.subGenre, state.explicitContent, state.contributors, state.releaseType, state.tracks, editsOneTrack, goNext, announceMissing]);

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


  const proposedFromState = useCallback((): Record<string, unknown> => ({
    release_title: state.releaseTitle,
    release_version: state.releaseVersion,
    primary_artist: state.primaryArtist,
    label: state.label,
    metadata_language: state.metaLanguage,
    primary_genre: state.genre,
    secondary_genre: state.subGenre,
    recorded_year: state.recordedYear,
    recording_country: state.recordingCountry || null,
    is_cover_song: state.isCoverSong === "Yes" ? true : state.isCoverSong === "No" ? false : null,
    release_date: state.releaseDate,
    pre_order_date: state.preOrderDate || null,
    explicit_content: state.explicitContent === "Yes",
    cover_art_ai_use: normaliseCoverArtAiUse(state.coverArtAiUse),
    stereo_ai_use: normaliseStereoAiUse(state.stereoAiUse),
    track_title: state.trackTitle,
    mix_version: state.mixedVersion,
    lyrics: state.lyrics,
    platforms: state.selectedDSPs,
    territory_rights: state.territory,
    additional_artists: state.additionalArtists,
    is_previously_released: state.isPreviouslyReleased,
    original_release_date: state.isPreviouslyReleased ? state.originalReleaseDate : null,
    album_art_key: state.artworkKey,
    album_art_url: state.artworkUrl,
    album_art_sizes: state.artworkSizes ? JSON.stringify(state.artworkSizes) : null,
    s3_key: state.audioKey,
    audio_file_path: state.audioUrl,
    s3_bucket: state.audioBucket,
    social_media_timestamp: normaliseTimestamp(state.tiktokTimestamp),
    composer: state.contributors.writers.map((w) => w.name).join(", ") || state.primaryArtist,
    contributors: formatContributorsForBackend(state.contributors),
  }), [state, formatContributorsForBackend]);


  const pendingChanges = useMemo(() => {
    if (!original) return [];

    const proposed = proposedFromState();
    const labels: Record<string, string> = {
      release_title: "Release title", release_version: "Release version",
      primary_artist: "Primary artist", label: "Label",
      metadata_language: "Metadata language", primary_genre: "Genre",
      secondary_genre: "Sub-genre", recorded_year: "Recorded year",
      c_line: "C-line", p_line: "P-line", release_date: "Release date",
      pre_order_date: "Pre-order date", explicit_content: "Explicit content",
      cover_art_ai_use: "Cover art AI use", stereo_ai_use: "Stereo AI use", track_title: "Track title",
      mix_version: "Mix version", lyrics: "Lyrics", platforms: "Platforms",
      territory_rights: "Territory rights", additional_artists: "Additional artists",
      is_previously_released: "Previously released",
      original_release_date: "Original release date",
      album_art_key: "Artwork", s3_key: "Audio file",
      social_media_timestamp: "Social clip start", composer: "Composer",
      contributors: "Contributors",
    };

    const asArray = (v: unknown): unknown[] | null => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.trim().startsWith("[")) {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
      }
      return null;
    };

    /*
     * Compare credits by what they say, not how they were stored. A saved artist is
     * {id, name, role, artistId: null} and the form's copy is {id, name, artistId: "", role}:
     * same person, different key order and an empty id — which showed "Fimi → Fimi" as a
     * change and sent it for review.
     */
    const creditKey = (x: unknown): string => {
      if (typeof x === "string") return x.trim().toLowerCase();
      const o = (x ?? {}) as Record<string, unknown>;
      return [o.name, o.role, o.type]
        .map((part) => String(part ?? "").trim().toLowerCase())
        .join("|");
    };

    const same = (a: unknown, b: unknown) => {
      const aList = asArray(a);
      const bList = asArray(b);

      if (aList || bList) {
        const norm = (v: unknown[] | null) => JSON.stringify((v ?? []).map(creditKey).sort());
        return norm(aList) === norm(bList);
      }
      if (typeof a === "boolean" || typeof b === "boolean") return Boolean(a) === Boolean(b);
      return String(a ?? "") === String(b ?? "");
    };

    return Object.entries(labels)
      .filter(([field]) => {
        const before = (original as Record<string, unknown>)[field];
        const after = proposed[field];
        if (field.endsWith("_date")) {
          return String(before ?? "").slice(0, 10) !== String(after ?? "").slice(0, 10);
        }
        return !same(before, after);
      })
      .map(([field, label]) => ({
        field,
        label,
        from: (original as Record<string, unknown>)[field],
        to: proposed[field],
        isFile: field === "album_art_key" || field === "s3_key",
      }));
  }, [original, proposedFromState]);

  const trackChanges = useMemo(() => {
    if (!originalTracks.length) return [];

    return state.tracks
      .map((t) => {
        const before = originalTracks.find((o) => String(o.id) === t.id);
        if (!before) return { id: t.id, title: t.trackTitle, kind: "added" as const };
        if ((before.s3_key ?? "") !== t.audioKey) {
          return { id: t.id, title: t.trackTitle || before.track_title || "Untitled", kind: "audio" as const };
        }
        return null;
      })
      .filter((c): c is { id: string; title: string; kind: "added" | "audio" } => c !== null);
  }, [state.tracks, originalTracks]);

  const incompleteTracks = useMemo(
    () =>
      state.tracks
        .map((t, i) => ({
          n: i + 1,
          title: t.trackTitle,
          missing: !t.audioKey && !t.audioUrl ? "audio" : !t.trackTitle.trim() ? "a title" : null,
        }))
        .filter((t) => t.missing !== null),
    [state.tracks]
  );

  const handleSubmitRevision = useCallback(async () => {
    if (!editReleaseId) return;

    setIsSubmitting(true);
    const t = toastLoading("Sending your changes...");

    try {
      const { submitRevision } = await import("@/lib/api/editRequests");
      const res = await submitRevision(editReleaseId, {
        reason: editReason.trim(),
        proposed: proposedFromState(),
      });

      dismiss(t);

      if (res.error) {
        toastError("Could not send your changes", res.error);
        return;
      }

      success("Changes sent for review", "We'll email you once they've been looked at.");
      setReviewOpen(false);
      onRevisionSubmitted?.();
      onClose();
    } catch {
      dismiss(t);
      toastError("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [editReleaseId, editReason, proposedFromState, toastLoading, dismiss, toastError, success, onRevisionSubmitted, onClose]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const t = toastLoading("Submitting release...");
      const isSingle = state.releaseType === "single";
      const formattedContributors = formatContributorsForBackend(state.contributors);
      // Kept stable across retries of the same release so a timed-out request that
      // actually succeeded server-side cannot create a second release.
      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }
      const base = {
        idempotency_key: idempotencyKeyRef.current,
        // The API deletes this draft once the release is in. It used to stay in the Drafts
        // tab after submitting, and resuming it later created the same release a second time.
        draft_id: draftIdRef.current ?? null,
        release_title: state.releaseTitle, metadata_language: state.metaLanguage,
        primary_artist: state.primaryArtist, primary_artist_id: null,
        composer: state.contributors.writers.map((w) => w.name).filter(Boolean).join(", "),
        album_art_url: state.artworkUrl, album_art_key: state.artworkKey,
        album_art_sizes: state.artworkSizes ? JSON.stringify(state.artworkSizes) : null,
        cover_art_ai_use: normaliseCoverArtAiUse(state.coverArtAiUse),
        label: state.label || "Songdis Ltd",
        explicit_content: state.explicitContent === "Yes",
        primary_genre: state.genre, secondary_genre: state.subGenre,
        genre: state.genre, subgenre: state.subGenre, recorded_year: state.recordedYear,
        // Year and owner only. The API composes the stored c_line/p_line from these and
        // ignores them for plans that cannot customise the rights lines.
        c_line_year: state.cLine || null, c_line_owner: state.cLineOwner.trim() || null,
        p_line_year: state.pLine || null, p_line_owner: state.pLineOwner.trim() || null,
        release_date: state.releaseDate, pre_order_date: state.preOrderDate || null,
        is_previously_released: state.isPreviouslyReleased,
        original_release_date: state.isPreviouslyReleased ? state.originalReleaseDate : null,
        platforms: state.selectedDSPs,
        territory_rights: state.territory === "worldwide" ? "worldwide" : "custom",
        upc_code: state.upcCode || null, stereo_ai_use: normaliseStereoAiUse(state.stereoAiUse),
      };
      const payload = isSingle
        ? { ...base, upload_type: "Single", track_title: state.trackTitle || state.releaseTitle,
            audio_file_path: state.audioUrl, s3_key: state.audioKey, s3_bucket: state.audioBucket,
            isrc: state.isrc || null, lyrics: state.lyrics, lyrics_language: state.metaLanguage,
            duration: state.audioDuration, social_media_timestamp: normaliseTimestamp(state.tiktokTimestamp),
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
              recorded_year: state.recordedYear, isrc: tr.isrc || null,
              stereo_ai_use: normaliseStereoAiUse(tr.stereoAiUse || state.stereoAiUse),
              recording_country: state.recordingCountry || null,
              is_cover_song: tr.isCoverSong === "Yes" ? true : tr.isCoverSong === "No" ? false : null,
              lyrics: tr.lyrics || "", lyrics_language: state.metaLanguage,
              duration: tr.audioDuration || "", social_media_timestamp: normaliseTimestamp(tr.tiktokTimestamp),
              contributors: JSON.stringify(formatContributorsForBackend(tr.contributors)),
              additional_artists: tr.additionalArtists && tr.additionalArtists.length > 0
                ? JSON.stringify(formatAdditionalArtistsForBackend(tr.additionalArtists))
                : null,
            })) };

      const res = await uploadMusic(payload);
      dismiss(t);

      if (res.error) {
        const fieldErrors = res.errors ?? null;

        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          const lines: SubmitProblem[] = Object.entries(fieldErrors).flatMap(
            ([field, messages]) =>
              (messages ?? []).filter(Boolean).map((message) => ({
                field,
                message,
                step: stepForField(field),
              }))
          );

          setSubmitErrors(lines);
          toastError(
            lines.length === 1 ? "One thing to fix" : `${lines.length} things to fix`,
            lines[0]?.message ?? res.error
          );
        } else {
          setSubmitErrors([{ field: "", message: res.error, step: null }]);
          toastError("Submission failed", res.error);
        }

        setIsSubmitting(false);
        return;
      }

      setSubmitErrors([]);

      const isDuplicate = (res.data as { duplicate?: boolean } | null)?.duplicate === true;

      if (isDuplicate) {
        toastError(
          "Already submitted",
          res.message ??
            "This release was already submitted in the last 5 minutes. To re-submit a corrected version, please wait 5 minutes and try again."
        );
        setIsSubmitting(false);
        return;
      }

      idempotencyKeyRef.current = undefined;
      if (draftIdRef.current) {
        // The API has deleted it; stop this modal from writing it back.
        draftIdRef.current = undefined;
        window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
      }
      success("Release submitted!", "Your release is now under review.");
      goTo("submitted");
    } catch {
      toastError("Something went wrong", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [state, toastLoading, toastError, success, dismiss, goTo, formatContributorsForBackend]);

  const handleStep3Submit = useCallback(() => {
    const errors: StepFieldErrors = {};
    if (!state.releaseDate) errors.releaseDate = "Release date is required";
    if (state.selectedDSPs.length === 0) errors.platforms = "Select at least one provider";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    handleSubmit();
  }, [state.releaseDate, state.selectedDSPs, handleSubmit]);

  const buildDraftPayload = useCallback(() => ({
    draft_id: draftIdRef.current ?? state.draftId,
    upload_type: state.releaseType === "single" ? "Single" as const : "Album/EP" as const,
    current_step: Math.max(1, stepIndex(state.step)),
    form_data: {
      releaseTitle: state.releaseTitle, trackTitle: state.trackTitle,
      releaseVersion: state.releaseVersion, primaryArtist: state.primaryArtist,
      label: state.label, metaLanguage: state.metaLanguage, upcCode: state.upcCode,
      explicitContent: state.explicitContent,
      coverArtAiUse: state.coverArtAiUse, stereoAiUse: state.stereoAiUse,
      genre: state.genre, subGenre: state.subGenre,
      recordedYear: state.recordedYear, recordingCountry: state.recordingCountry,
      cLine: state.cLine, cLineOwner: state.cLineOwner,
      pLine: state.pLine, pLineOwner: state.pLineOwner,
      isCoverSong: state.isCoverSong,
      isrc: state.isrc, lyrics: state.lyrics,
      contributors: state.contributors,
      artistDetails: state.artistDetails, releaseDate: state.releaseDate,
      preOrderDate: state.preOrderDate, territory: state.territory,
      selectedDSPs: state.selectedDSPs, noOfTracks: state.noOfTracks,
      // state.artwork is a blob: URL while a cover is on screen from the artist's own disk.
      // That URL dies with the tab, so a resumed draft showed a broken cover; only a real
      // URL is worth keeping, and the stored artwork URL is the better one anyway.
      albumArtPreview: state.artworkUrl || (state.artwork?.startsWith("blob:") ? null : state.artwork),
      audioFileUrl: state.audioUrl,
      artworkUrl: state.artworkUrl, artworkKey: state.artworkKey,
      artworkSizes: state.artworkSizes,
      tiktokTimestamp: state.tiktokTimestamp, audioDuration: state.audioDuration,
      isPreviouslyReleased: state.isPreviouslyReleased, originalReleaseDate: state.originalReleaseDate,

      // The album track list, and the single's S3 identifiers. None of this was saved
      // before: form_data carried only the single-track fields, so resuming an album draft
      // restored an empty tracklist and every uploaded audio file was lost. The track
      // objects hold no File instances, only strings, so they serialise as they are.
      tracks: state.tracks,
      audioKey: state.audioKey,
      audioBucket: state.audioBucket,
      releaseType: state.releaseType,
      // Also never saved before, so they came back blank on resume.
      mixedVersion: state.mixedVersion,
      additionalArtists: state.additionalArtists,
    },
  }), [state]);


  /*
   * Every draft save goes through one queue.
   *
   * Two saves used to be able to run at once — a double-tapped Save Draft, or the quick-drop
   * save alongside a manual one — and when neither had a draft id yet, both created a draft.
   * That is the "it saved as a fresh upload" duplicate. Queued, the second save waits for the
   * first and reads the id it got back. The id is read when the save is sent, not when it is
   * queued, for the same reason.
   */
  const saveQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const persistDraft = useCallback((): Promise<{ id?: number; error?: string }> => {
    const payload = buildDraftPayload();

    const run = saveQueueRef.current.then(async () => {
      try {
        const res = await saveDraft({ ...payload, draft_id: draftIdRef.current ?? payload.draft_id });
        if (res.error) return { error: res.error };

        const raw = res.data as unknown as Record<string, unknown> | null;
        const id = (raw?.draft_id as number | undefined) ?? (raw?.id as number | undefined);
        if (id) {
          draftIdRef.current = id;
          setState((s) => (s.draftId === id ? s : { ...s, draftId: id }));
        }
        window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
        return { id: id ?? draftIdRef.current };
      } catch {
        return { error: "Something went wrong." };
      }
    });

    saveQueueRef.current = run;
    return run;
  }, [buildDraftPayload]);

  const saveDraftQuietly = useCallback(async (): Promise<number | undefined> => {
    const r = await persistDraft();
    return r.id ?? draftIdRef.current;
  }, [persistDraft]);

  const handleSaveDraft = useCallback(async () => {
    const t = toastLoading("Saving draft...");
    const r = await persistDraft();
    dismiss(t);
    if (r.error) toastError("Draft not saved", r.error);
    else success("Draft saved!", "You can continue editing from the Drafts tab.");
  }, [persistDraft, toastLoading, dismiss, success, toastError]);

  /*
   * Auto-save. Once the upload has something worth keeping (a title or a file), it is saved
   * as a draft a few seconds after every change; the first save creates the draft. Closing
   * the tab, losing signal or a crash no longer loses the work. Edits of a live release are
   * not drafts and are never auto-saved.
   */
  const autosaveFingerprint = JSON.stringify(buildDraftPayload().form_data) + "|" + state.step;
  const lastAutosavedRef = useRef<string>("");

  useEffect(() => {
    if (!isOpen || isEditing || isLoadingDraft || isSubmitting) return;
    if (state.step === "select-type" || state.step === "submitted") return;
    const worthKeeping = Boolean(
      state.releaseTitle.trim() || state.trackTitle.trim() || state.audioKey || state.artworkKey || state.tracks.length
    );
    if (!worthKeeping || lastAutosavedRef.current === autosaveFingerprint) return;

    const t = setTimeout(async () => {
      lastAutosavedRef.current = autosaveFingerprint;
      const r = await persistDraft();
      if (!r.error) setLastAutoSavedAt(new Date());
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autosaveFingerprint, isOpen, isEditing, isLoadingDraft, isSubmitting, persistDraft]);

  const handleClose = useCallback(() => {
    draftIdRef.current = undefined;
    lastAutosavedRef.current = "";
    setPickedDraftId(undefined);
    setDraftChoices(null);
    setLastAutoSavedAt(null);
    idempotencyKeyRef.current = undefined;
    setState(INITIAL_STATE);
    onClose();
  }, [onClose]);

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
          <StepToaster toast={stepToast} />
          {lastAutoSavedAt && !isEditing && state.step !== "select-type" && (
            <p className="absolute top-6 right-14 z-10 hidden sm:block font-body text-[11px] text-white/35">
              Draft saved automatically
            </p>
          )}

          {state.step === "select-type" && !draftToLoad && draftChoices && draftChoices.length > 0 && (
            <DraftPicker
              drafts={draftChoices}
              onPick={(id) => { setDraftChoices(null); setPickedDraftId(id); }}
              onStartNew={() => setDraftChoices([])}
            />
          )}
          {state.step === "select-type" && !(draftChoices && draftChoices.length > 0) && (
            <SelectUploadType selected={state.releaseType} onSelect={(t) => update({ releaseType: t })} onContinue={() => { if (state.releaseType) goNext(); }} />
          )}
          {state.step === "release-details" && (
            <ReleaseDetails state={state} update={update} onBack={goBack} onContinue={handleStep1Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} isEditing={isEditing} />
          )}
          {state.step === "upload-track" && (
            <UploadTrack state={state} update={update} updateTrack={updateTrack} removeTrack={removeTrack} reorderTrack={reorderTrack} onBack={goBack} onContinue={handleStep2Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} singleTrackOnly={editsOneTrack} trackLabel={editTrackTitle} />
          )}

          {state.step === "distribution" && submitErrors.length > 0 && (
            <div
              ref={submitErrorRef}
              role="alert"
              aria-live="assertive"
              className="mx-7 mb-4 rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] p-4 scroll-mt-4"
            >
              <p className="font-body text-white text-sm font-medium mb-2">
                {submitErrors.length === 1
                  ? "One thing needs fixing before this can be submitted"
                  : `${submitErrors.length} things need fixing before this can be submitted`}
              </p>

              <ul className="flex flex-col gap-2">
                {submitErrors.map((problem, i) => (
                  <li key={`${problem.field}-${i}`} className="flex items-start gap-2">
                    <span aria-hidden className="text-[#C30100] text-xs mt-0.5">•</span>
                    <span className="font-body text-white/70 text-xs leading-relaxed">
                      {problem.message}
                      {problem.step && (
                        <span className="text-white/35"> — {problem.step}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="font-body text-white/35 text-[11px] mt-3 leading-relaxed">
                Your uploaded files are still here. Go back to the step named
                beside each item, correct it, then submit again.
              </p>
            </div>
          )}

          {state.step === "distribution" && (
            <ReleaseAvailability state={state} update={update} onBack={goBack} onSubmit={isEditing ? () => setReviewOpen(true) : handleStep3Submit} onQuickDrop={() => setQuickDropOpen(true)} onSaveDraft={handleSaveDraft} isSubmitting={isSubmitting} fieldErrors={fieldErrors} clearFieldError={clearFieldError} submitLabel={isEditing ? "Review Changes" : undefined} />
          )}
        </div>
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div aria-hidden className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !isSubmitting && setReviewOpen(false)} />

          <div className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#1A0808] p-6">
            <h2 className="font-heading text-white uppercase text-lg tracking-wide mb-1">
              Review your changes
            </h2>
            <p className="font-body text-white/50 text-sm mb-5">
              {pendingChanges.length + trackChanges.length === 0
                ? "You have not changed anything yet."
                : `${pendingChanges.length + trackChanges.length} change${pendingChanges.length + trackChanges.length === 1 ? "" : "s"} will be sent for review.`}
            </p>

            {incompleteTracks.length > 0 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 mb-4">
                <p className="font-body text-amber-200 text-xs font-semibold mb-1">
                  {incompleteTracks.length} track{incompleteTracks.length === 1 ? "" : "s"} still need attention
                </p>
                <ul className="font-body text-amber-100/70 text-xs space-y-0.5">
                  {incompleteTracks.slice(0, 5).map((t) => (
                    <li key={t.n}>
                      Track {t.n}
                      {t.title ? ` — ${t.title}` : ""} is missing {t.missing}
                    </li>
                  ))}
                  {incompleteTracks.length > 5 && (
                    <li>and {incompleteTracks.length - 5} more…</li>
                  )}
                </ul>
              </div>
            )}

            {trackChanges.length > 0 && (
              <ul className="flex flex-col gap-2 mb-4">
                {trackChanges.map((t) => (
                  <li key={t.id} className="rounded-xl border border-white/[0.06] bg-[#140C0C] px-4 py-3 min-w-0">
                    <p className="font-body text-white text-xs font-semibold mb-1 break-words">
                      {t.title || "Untitled track"}
                    </p>
                    <p className="font-body text-white/50 text-xs">
                      {t.kind === "added" ? "New track added" : "Audio replaced with a new file"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {pendingChanges.length > 0 && (
              <ul className="flex flex-col gap-2 mb-5">
                {pendingChanges.map((c) => (
                  <li key={c.field} className="rounded-xl border border-white/[0.06] bg-[#140C0C] px-4 py-3 min-w-0">
                    <p className="font-body text-white text-xs font-semibold mb-1">{c.label}</p>
                    {c.isFile ? (
                      <p className="font-body text-white/50 text-xs">Replaced with a new file</p>
                    ) : (
                      <div className="font-body text-xs leading-relaxed min-w-0 space-y-0.5">
                        <p className="text-white/40 line-through break-words whitespace-pre-wrap">
                          {formatReviewValue(c.from)}
                        </p>
                        <p className="text-white break-words whitespace-pre-wrap">
                          <span className="text-white/30 mr-1.5">→</span>
                          {formatReviewValue(c.to)}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <label className="font-body text-white/70 text-xs block mb-1.5">
              Why are you making these changes?
            </label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="This helps our team review it faster."
              className="w-full bg-[#0E0808] border border-white/10 rounded-xl px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
            />
            <p className="font-body text-white/30 text-xs mt-1 mb-5">
              {editReason.length}/1000
              {!editReason.trim() && (pendingChanges.length + trackChanges.length) > 0 && (
                <span className="text-white/50"> · Add a short reason to send this for review.</span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setReviewOpen(false)}
                disabled={isSubmitting}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/20 py-3.5 hover:border-white/40 transition-colors disabled:opacity-40"
              >
                Keep editing
              </button>
              <button
                onClick={handleSubmitRevision}
                disabled={isSubmitting || (pendingChanges.length + trackChanges.length) === 0 || incompleteTracks.length > 0 || !editReason.trim()}
                className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] py-3.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send for review"}
              </button>
            </div>
          </div>
        </div>
      )}
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


interface DraftChoice {
  id: number;
  title: string;
  type: string;
  artist: string;
  artwork: string | null;
  updatedAt: string;
}

function draftAge(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** Shown when a new upload starts and there are saved drafts: carry on with one, or start fresh. */
function DraftPicker({ drafts, onPick, onStartNew }: { drafts: DraftChoice[]; onPick: (id: number) => void; onStartNew: () => void }) {
  return (
    <div className="p-5 sm:p-8">
      <p className="font-heading text-white uppercase text-lg tracking-wide pr-8">Continue where you left off?</p>
      <p className="font-body text-white/45 text-sm mt-1">
        You have {drafts.length === 1 ? "an unfinished upload" : `${drafts.length} unfinished uploads`}. Pick one to carry on, or start a new upload.
      </p>

      <ul className="mt-6 flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {drafts.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onPick(d.id)}
              className="w-full flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-colors hover:border-[#C30100]/50 hover:bg-[#C30100]/[0.06]"
            >
              {d.artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.artwork} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-white/[0.06]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold text-white">{d.title}</p>
                <p className="truncate font-body text-xs text-white/45">
                  {[d.type === "Single" ? "Single" : "Album / EP", d.artist !== "Unknown Artist" ? d.artist : "", draftAge(d.updatedAt)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span className="shrink-0 font-heading text-[10px] uppercase tracking-widest text-[#ff6b6b]">Continue</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStartNew}
        className="mt-5 w-full min-h-[48px] rounded-full bg-[#C30100] font-heading text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#a80000]"
      >
        Start a new upload
      </button>
    </div>
  );
}
