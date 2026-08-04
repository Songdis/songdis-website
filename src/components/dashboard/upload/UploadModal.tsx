"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  onRevisionSubmitted?: () => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  draftId: initialDraftId,
  editReleaseId,
  onRevisionSubmitted,
}: UploadModalProps) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);
  const [quickDropOpen, setQuickDropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<StepFieldErrors>({});
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const { success, error: toastError, loading: toastLoading, dismiss } = useToast();
  const isEditing = Boolean(editReleaseId);
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
        recordedYear: v.recorded_year ?? "2026",
        cLine: v.c_line ?? "",
        pLine: v.p_line ?? "",
        releaseDate: v.release_date ? String(v.release_date).slice(0, 10) : "",
        preOrderDate: v.pre_order_date ? String(v.pre_order_date).slice(0, 10) : "",
        explicitContent: v.explicit_content ? "Yes" : "No",
        coverArtAiUse: normaliseCoverArtAiUse(v.cover_art_ai_use),
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
      }));

      setIsLoadingDraft(false);
    })();

    return () => { cancelled = true; };
  }, [isOpen, editReleaseId, toastError]);

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

        draftIdRef.current = initialDraftId;

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
          coverArtAiUse: normaliseCoverArtAiUse(fd.coverArtAiUse),
          // Track details
          trackTitle: (fd.trackTitle as string) ?? "",
          genre: (fd.genre as string) ?? "",
          subGenre: (fd.subGenre as string) ?? "",
          recordedYear: (fd.recordedYear as string) ?? "2026",
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

  const draftIdRef = useRef<number | undefined>(undefined);

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


  const proposedFromState = useCallback((): Record<string, unknown> => ({
    release_title: state.releaseTitle,
    release_version: state.releaseVersion,
    primary_artist: state.primaryArtist,
    label: state.label,
    metadata_language: state.metaLanguage,
    primary_genre: state.genre,
    secondary_genre: state.subGenre,
    recorded_year: state.recordedYear,
    c_line: state.cLine,
    p_line: state.pLine,
    release_date: state.releaseDate,
    pre_order_date: state.preOrderDate || null,
    explicit_content: state.explicitContent === "Yes",
    cover_art_ai_use: normaliseCoverArtAiUse(state.coverArtAiUse),
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
  }), [state]);


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
      cover_art_ai_use: "Cover art AI use", track_title: "Track title",
      mix_version: "Mix version", lyrics: "Lyrics", platforms: "Platforms",
      territory_rights: "Territory rights", additional_artists: "Additional artists",
      is_previously_released: "Previously released",
      original_release_date: "Original release date",
      album_art_key: "Artwork", s3_key: "Audio file",
    };

    const asArray = (v: unknown): unknown[] | null => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string" && v.trim().startsWith("[")) {
        try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
      }
      return null;
    };

    const same = (a: unknown, b: unknown) => {
      const aList = asArray(a);
      const bList = asArray(b);

      if (aList || bList) {
        const norm = (v: unknown[] | null) => JSON.stringify(
          (v ?? []).map((x) => (typeof x === "string" ? x : JSON.stringify(x))).sort()
        );
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
      const base = {
        release_title: state.releaseTitle, metadata_language: state.metaLanguage,
        primary_artist: state.primaryArtist, primary_artist_id: null,
        composer: state.contributors.writers.map((w) => w.name).join(", ") || state.primaryArtist,
        album_art_url: state.artworkUrl, album_art_key: state.artworkKey,
        album_art_sizes: state.artworkSizes ? JSON.stringify(state.artworkSizes) : null,
        cover_art_ai_use: normaliseCoverArtAiUse(state.coverArtAiUse),
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
              recorded_year: state.recordedYear, isrc: tr.isrc || null, stereo_ai_use: "None",
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
          const lines = Object.values(fieldErrors)
            .flat()
            .filter(Boolean) as string[];

          setSubmitErrors(lines);
          toastError(
            lines.length === 1 ? "One thing to fix" : `${lines.length} things to fix`,
            lines[0]
          );
        } else {
          setSubmitErrors([res.error]);
          toastError("Submission failed", res.error);
        }

        setIsSubmitting(false);
        return;
      }

      setSubmitErrors([]);
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
    if (!state.agreedToTerms) errors.terms = "You must accept the terms";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    handleSubmit();
  }, [state.releaseDate, state.selectedDSPs, state.agreedToTerms, handleSubmit]);

  const buildDraftPayload = useCallback(() => ({
    draft_id: draftIdRef.current ?? state.draftId,
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

    if (newDraftId) {
      draftIdRef.current = newDraftId;
      if (!state.draftId) update({ draftId: newDraftId });
    }

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

        if (newDraftId) {
          draftIdRef.current = newDraftId;
          if (!state.draftId) update({ draftId: newDraftId });
        }
        success("Draft saved!", "You can continue editing from the Drafts tab.");
      }
    } catch {
      dismiss(t);
      toastError("Draft not saved", "Something went wrong.");
    }
  }, [buildDraftPayload, state.draftId, toastLoading, dismiss, success, toastError, update]);

  const handleClose = useCallback(() => {
    draftIdRef.current = undefined;
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
          {state.step === "select-type" && (
            <SelectUploadType selected={state.releaseType} onSelect={(t) => update({ releaseType: t })} onContinue={() => { if (state.releaseType) goNext(); }} />
          )}
          {state.step === "release-details" && (
            <ReleaseDetails state={state} update={update} onBack={goBack} onContinue={handleStep1Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} isEditing={isEditing} />
          )}
          {state.step === "upload-track" && (
            <UploadTrack state={state} update={update} updateTrack={updateTrack} removeTrack={removeTrack} reorderTrack={reorderTrack} onBack={goBack} onContinue={handleStep2Continue} onSaveDraft={handleSaveDraft} fieldErrors={fieldErrors} clearFieldError={clearFieldError} />
          )}

          {state.step === "distribution" && submitErrors.length > 0 && (
            <div className="mx-7 mb-4 rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] p-4">
              <p className="font-body text-white text-sm font-medium mb-2">
                {submitErrors.length === 1
                  ? "One thing needs fixing before this can be submitted"
                  : `${submitErrors.length} things need fixing before this can be submitted`}
              </p>

              <ul className="flex flex-col gap-1.5">
                {submitErrors.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <span aria-hidden className="text-[#C30100] text-xs mt-0.5">•</span>
                    <span className="font-body text-white/70 text-xs leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>

              <p className="font-body text-white/35 text-[11px] mt-3 leading-relaxed">
                Your uploaded files are still here — go back and correct these,
                then submit again.
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
            <p className="font-body text-white/30 text-xs mt-1 mb-5">{editReason.length}/1000</p>

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