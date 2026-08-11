"use client";

/**
 * lib/hooks/usePressKit.ts
 *
 * The data layer behind the press-kit editor.
 *
 * Two pieces of state, deliberately separate:
 *
 *   `saved`  — what the server last told us the kit is.
 *   `draft`  — what the artist has typed since.
 *
 * Every edit touches `draft` only, `isDirty` is a comparison of the two, and a save
 * replaces `saved` from the RESPONSE rather than from `draft`. That last part matters:
 * `bio` and `cover_image_url` have no documented write path (see press-kit.ts), so if
 * the backend drops them the editor shows the value that actually persisted instead of
 * the one the artist thinks they saved.
 *
 * Media and the slug are NOT part of the draft — each is its own immediate request,
 * because "add photo" and "change my address" are not things you queue up behind a
 * Save button.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  blankPressKit,
  classifySlugError,
  deletePressKitMedia,
  getPressKit,
  inspectSlug,
  normalisePressKit,
  publishPressKit,
  readMediaUrlFromResponse,
  readSlugFromResponse,
  sectionOrderAllows,
  unpublishPressKit,
  updatePressKit,
  updatePressKitSlug,
  uploadPressKitCover,
  uploadPressKitMedia,
  type HeadlineFont,
  type PressKitEditorState,
  type PressKitMediaItem,
  type PressKitRecord,
  type PressKitTheme,
  type PressKitUpdate,
  type SectionKey,
  type SlugProblem,
} from "@/lib/api/press-kit";

/* ─── Errors ──────────────────────────────────────────────────── */

/**
 * A failure as the UI needs it.
 *
 * `errors` is the Laravel field map and is the ONLY place per-field validation
 * messages live — a surface that renders `error` alone shows one problem at a time and
 * hides the rest, which on a form this wide means three round trips to fix three
 * fields. Every consumer of this hook gets the map.
 */
export interface PressKitFailure {
  error: string;
  errors: Record<string, string[]> | null;
  status: number;
}

function failure(
  error: string | null,
  errors: Record<string, string[]> | null | undefined,
  status: number
): PressKitFailure {
  return { error: error ?? "Something went wrong.", errors: errors ?? null, status };
}

/** True when the backend simply is not there yet — a missing route, not a bad edit. */
export function isUnavailable(f: PressKitFailure | null): boolean {
  return f !== null && (f.status === 404 || f.status === 405 || f.status === 501);
}

/* ─── Slug state ──────────────────────────────────────────────── */

export interface SlugState {
  /** Server truth. */
  current: string | null;
  saving: boolean;
  problem: SlugProblem | null;
  /** The sentence to show. The server's own wording where there is one. */
  message: string | null;
  savedAt: number | null;
}

/* ─── Media state ─────────────────────────────────────────────── */

export interface MediaState {
  /** Which media ids are mid-delete, so their tiles can dim rather than vanish. */
  removing: number[];
  uploading: boolean;
  failure: PressKitFailure | null;
}

/* ─── The hook ────────────────────────────────────────────────── */

export interface UsePressKit {
  /** Server truth. Null until the first load resolves. */
  saved: PressKitEditorState | null;
  /** What the artist is editing. Always present once a profile is chosen. */
  draft: PressKitEditorState;
  isLoading: boolean;
  loadFailure: PressKitFailure | null;
  reload: () => void;

  isDirty: boolean;
  isSaving: boolean;
  saveFailure: PressKitFailure | null;
  savedAt: number | null;
  save: () => Promise<boolean>;
  discard: () => void;

  /* Field-level draft edits */
  patchKit: (patch: Partial<PressKitRecord>) => void;
  setBio: (bio: string) => void;
  setTheme: (theme: PressKitTheme) => void;
  setHeadlineFont: (font: HeadlineFont) => void;

  /* Sections */
  moveSection: (key: SectionKey, direction: -1 | 1) => void;
  toggleSection: (key: SectionKey) => void;
  isHidden: (key: SectionKey) => boolean;

  /* Publish */
  isPublished: boolean;
  isPublishing: boolean;
  publishFailure: PressKitFailure | null;
  publish: () => Promise<boolean>;
  unpublish: () => Promise<boolean>;

  /* Media */
  media: MediaState;
  addPhoto: (file: File) => Promise<boolean>;
  addSpotlight: (file: File, title: string, description: string) => Promise<boolean>;
  removeMedia: (id: number) => Promise<boolean>;
  replaceCover: (file: File) => Promise<boolean>;
  removeCover: () => void;
  coverFailure: PressKitFailure | null;

  /* Address */
  slug: SlugState;
  checkSlug: (value: string) => SlugState;
  changeSlug: (value: string) => Promise<boolean>;
}

export function usePressKit(profileId: number | null, artistName = ""): UsePressKit {
  const [saved, setSaved] = useState<PressKitEditorState | null>(null);
  const [draft, setDraft] = useState<PressKitEditorState>(() =>
    blankPressKit(profileId ?? 0, artistName)
  );
  const [isLoading, setIsLoading] = useState(profileId !== null);
  const [loadFailure, setLoadFailure] = useState<PressKitFailure | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [saveFailure, setSaveFailure] = useState<PressKitFailure | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFailure, setPublishFailure] = useState<PressKitFailure | null>(null);

  const [media, setMedia] = useState<MediaState>({
    removing: [],
    uploading: false,
    failure: null,
  });
  const [coverFailure, setCoverFailure] = useState<PressKitFailure | null>(null);

  const [slug, setSlug] = useState<SlugState>({
    current: null,
    saving: false,
    problem: null,
    message: null,
    savedAt: null,
  });

  /* The draft the async handlers should read — state closures go stale. */
  const draftRef = useRef(draft);
  draftRef.current = draft;

  /* ── Load ────────────────────────────────────────────────────── */

  useEffect(() => {
    if (profileId === null) {
      setSaved(null);
      setIsLoading(false);
      setLoadFailure(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadFailure(null);
    setSaveFailure(null);
    setPublishFailure(null);

    (async () => {
      const res = await getPressKit(profileId);
      if (cancelled) return;

      if (res.error) {
        // A missing route is not a missing kit. Keep a blank, editable draft so the
        // artist can still see the editor while the backend is being built — and say
        // so rather than showing an empty page that looks like their kit was lost.
        const blank = blankPressKit(profileId, artistName);
        setSaved(null);
        setDraft(blank);
        setSlug((s) => ({ ...s, current: null }));
        setLoadFailure(failure(res.error, res.errors, res.status));
        setIsLoading(false);
        return;
      }

      const state = normalisePressKit(res.data, profileId);
      if (!state.artist.name && artistName) state.artist.name = artistName;
      setSaved(state);
      setDraft(state);
      setSlug({
        current: state.artist.slug,
        saving: false,
        problem: null,
        message: null,
        savedAt: null,
      });
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // artistName is display-only fallback; refetching when it arrives is pointless.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  /* ── Dirty ───────────────────────────────────────────────────── */

  /**
   * A structural comparison of the editable slice only. Media and slug are saved
   * immediately, so including them would leave the Save button lit after an action
   * that already completed.
   */
  const isDirty = useMemo(() => {
    if (!saved) return false;
    const a = { kit: saved.kit, bio: saved.artist.bio };
    const b = { kit: draft.kit, bio: draft.artist.bio };
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [saved, draft]);

  /* ── Draft edits ─────────────────────────────────────────────── */

  const patchKit = useCallback((patch: Partial<PressKitRecord>) => {
    setDraft((d) => ({ ...d, kit: { ...d.kit, ...patch } }));
  }, []);

  const setBio = useCallback((bio: string) => {
    setDraft((d) => ({ ...d, artist: { ...d.artist, bio: bio.trim() === "" ? null : bio } }));
  }, []);

  const setTheme = useCallback(
    (theme: PressKitTheme) => patchKit({ theme }),
    [patchKit]
  );

  const setHeadlineFont = useCallback(
    (headline_font: HeadlineFont) => patchKit({ headline_font }),
    [patchKit]
  );

  const moveSection = useCallback((key: SectionKey, direction: -1 | 1) => {
    setDraft((d) => {
      const order = [...d.kit.section_order];
      const from = order.indexOf(key);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= order.length) return d;
      [order[from], order[to]] = [order[to], order[from]];
      // Co-sign can be moved anywhere below the bio, never above it. The check is on the
      // WHOLE result so moving the bio down past the co-sign is blocked exactly the same
      // way moving the co-sign up is — either way it ends up leading the kit.
      if (!sectionOrderAllows(order)) return d;
      return { ...d, kit: { ...d.kit, section_order: order } };
    });
  }, []);

  const toggleSection = useCallback((key: SectionKey) => {
    setDraft((d) => {
      const hidden = d.kit.hidden_sections.includes(key)
        ? d.kit.hidden_sections.filter((k) => k !== key)
        : [...d.kit.hidden_sections, key];
      return { ...d, kit: { ...d.kit, hidden_sections: hidden } };
    });
  }, []);

  const isHidden = useCallback(
    (key: SectionKey) => draft.kit.hidden_sections.includes(key),
    [draft.kit.hidden_sections]
  );

  const discard = useCallback(() => {
    if (saved) setDraft(saved);
    setSaveFailure(null);
  }, [saved]);

  /* ── Save ────────────────────────────────────────────────────── */

  const save = useCallback(async (): Promise<boolean> => {
    if (profileId === null) return false;

    const current = draftRef.current;
    const payload: PressKitUpdate = {
      theme: current.kit.theme,
      headline_font: current.kit.headline_font,
      eyebrow: current.kit.eyebrow,
      facts: current.kit.facts,
      contacts: current.kit.contacts,
      quotes: current.kit.quotes,
      placements: current.kit.placements,
      section_order: current.kit.section_order,
      hidden_sections: current.kit.hidden_sections,
      // GAP — neither is in the contract's PUT list. See press-kit.ts.
      bio: current.artist.bio,
      cover_image_url: current.kit.cover_image_url,
    };

    setIsSaving(true);
    setSaveFailure(null);

    const res = await updatePressKit(profileId, payload);

    if (res.error) {
      setIsSaving(false);
      setSaveFailure(failure(res.error, res.errors, res.status));
      return false;
    }

    /*
     * Prefer the server's version of the kit. When the response carries no body
     * (a bare 200/204) fall back to the draft — the save did succeed, and pretending
     * otherwise would leave the Save button lit forever.
     */
    const echoed = res.data ? normalisePressKit(res.data, profileId) : null;
    const next: PressKitEditorState = echoed?.kit.id || echoed?.kit.theme ? echoed! : current;
    if (!next.artist.name && current.artist.name) next.artist.name = current.artist.name;
    // The echo is about the kit; media and releases were not part of this request.
    next.photos = current.photos;
    next.spotlights = current.spotlights;
    next.releases = current.releases;
    if (!next.artist.slug) next.artist.slug = current.artist.slug;

    setSaved(next);
    setDraft(next);
    setIsSaving(false);
    setSavedAt(Date.now());
    return true;
  }, [profileId]);

  /* ── Publish ─────────────────────────────────────────────────── */

  const isPublished = draft.kit.published_at !== null;

  const setPublishedAt = useCallback((value: string | null) => {
    setSaved((s) => (s ? { ...s, kit: { ...s.kit, published_at: value } } : s));
    setDraft((d) => ({ ...d, kit: { ...d.kit, published_at: value } }));
  }, []);

  const publish = useCallback(async (): Promise<boolean> => {
    if (profileId === null) return false;
    setIsPublishing(true);
    setPublishFailure(null);

    const res = await publishPressKit(profileId);
    setIsPublishing(false);

    if (res.error) {
      setPublishFailure(failure(res.error, res.errors, res.status));
      return false;
    }
    setPublishedAt(new Date().toISOString());
    return true;
  }, [profileId, setPublishedAt]);

  const unpublish = useCallback(async (): Promise<boolean> => {
    if (profileId === null) return false;
    setIsPublishing(true);
    setPublishFailure(null);

    const res = await unpublishPressKit(profileId);
    setIsPublishing(false);

    if (res.error) {
      setPublishFailure(failure(res.error, res.errors, res.status));
      return false;
    }
    setPublishedAt(null);
    return true;
  }, [profileId, setPublishedAt]);

  /* ── Media ───────────────────────────────────────────────────── */

  const applyMedia = useCallback(
    (mutate: (state: PressKitEditorState) => PressKitEditorState) => {
      setDraft((d) => mutate(d));
      setSaved((s) => (s ? mutate(s) : s));
    },
    []
  );

  const upload = useCallback(
    async (
      type: "photo" | "spotlight",
      file: File,
      title?: string,
      description?: string
    ): Promise<boolean> => {
      if (profileId === null) return false;

      setMedia((m) => ({ ...m, uploading: true, failure: null }));

      const list =
        type === "photo" ? draftRef.current.photos : draftRef.current.spotlights;

      const res = await uploadPressKitMedia(profileId, {
        type,
        file,
        title: title ?? null,
        description: description ?? null,
        position: list.length,
      });

      if (res.error) {
        setMedia((m) => ({
          ...m,
          uploading: false,
          failure: failure(res.error, res.errors, res.status),
        }));
        return false;
      }

      const url = readMediaUrlFromResponse(res.data);
      const raw = (res.data ?? {}) as Record<string, unknown>;
      const nested = (raw.data ?? raw.media ?? {}) as Record<string, unknown>;
      const id = Number(raw.id ?? nested.id ?? 0);

      const item: PressKitMediaItem = {
        // A server that echoes nothing still leaves a real upload behind, so the tile
        // is added with a negative placeholder id. Deleting it is disabled until a
        // reload gives it a real one — better than a delete aimed at id 0.
        id: id > 0 ? id : -Date.now(),
        type,
        url: url ?? "",
        title: title?.trim() ? title.trim() : null,
        description: description?.trim() ? description.trim() : null,
        position: list.length,
      };

      if (item.url) {
        applyMedia((s) =>
          type === "photo"
            ? { ...s, photos: [...s.photos, item] }
            : { ...s, spotlights: [...s.spotlights, item] }
        );
      } else {
        // The upload succeeded but we cannot show it without a URL — refetch rather
        // than render a broken tile.
        reload();
      }

      setMedia((m) => ({ ...m, uploading: false }));
      return true;
    },
    [profileId, applyMedia, reload]
  );

  const addPhoto = useCallback((file: File) => upload("photo", file), [upload]);

  const addSpotlight = useCallback(
    (file: File, title: string, description: string) =>
      upload("spotlight", file, title, description),
    [upload]
  );

  const removeMedia = useCallback(
    async (id: number): Promise<boolean> => {
      if (id <= 0) return false;
      setMedia((m) => ({ ...m, removing: [...m.removing, id], failure: null }));

      const res = await deletePressKitMedia(id);

      if (res.error) {
        setMedia((m) => ({
          ...m,
          removing: m.removing.filter((x) => x !== id),
          failure: failure(res.error, res.errors, res.status),
        }));
        return false;
      }

      applyMedia((s) => ({
        ...s,
        photos: s.photos.filter((p) => p.id !== id),
        spotlights: s.spotlights.filter((p) => p.id !== id),
      }));
      setMedia((m) => ({ ...m, removing: m.removing.filter((x) => x !== id) }));
      return true;
    },
    [applyMedia]
  );

  const replaceCover = useCallback(
    async (file: File): Promise<boolean> => {
      if (profileId === null) return false;
      setCoverFailure(null);

      const res = await uploadPressKitCover(profileId, file);

      if (res.error) {
        setCoverFailure(failure(res.error, res.errors, res.status));
        return false;
      }

      const url = readMediaUrlFromResponse(res.data);
      if (!url) {
        reload();
        return true;
      }

      // The URL exists on S3 now, but `cover_image_url` still has to be persisted by
      // the PUT — so this lands in the draft and the Save button lights up.
      setDraft((d) => ({ ...d, kit: { ...d.kit, cover_image_url: url } }));
      return true;
    },
    [profileId, reload]
  );

  const removeCover = useCallback(() => {
    setCoverFailure(null);
    setDraft((d) => ({ ...d, kit: { ...d.kit, cover_image_url: null } }));
  }, []);

  /* ── Address ─────────────────────────────────────────────────── */

  /** Local-only verdict, for typing feedback. Uniqueness needs the server. */
  const checkSlug = useCallback((value: string): SlugState => {
    const verdict = inspectSlug(value);
    const next: SlugState = {
      current: slug.current,
      saving: false,
      problem: verdict.problem,
      message: verdict.message,
      savedAt: null,
    };
    setSlug(next);
    return next;
  }, [slug.current]);

  const changeSlug = useCallback(
    async (value: string): Promise<boolean> => {
      if (profileId === null) return false;

      const candidate = value.trim().toLowerCase();
      const local = inspectSlug(candidate);
      if (local.problem) {
        setSlug((s) => ({ ...s, problem: local.problem, message: local.message }));
        return false;
      }

      setSlug((s) => ({ ...s, saving: true, problem: null, message: null }));

      const res = await updatePressKitSlug(profileId, candidate);

      if (res.error) {
        // The server's sentence is what the artist reads. `classifySlugError` only
        // decides which kind of help sits beside it — "taken" and "reserved" need
        // different next steps and must never collapse into one message.
        //
        // Every message in the field map is shown, not just `errors.slug`. The key the
        // server validates under is not guaranteed to be `slug` — a nested rule would
        // report as `profile.slug` — and reading one key only would hide the sentence
        // that names the actual problem, which is precisely how "taken" and "reserved"
        // collapse into an unhelpful generic error.
        const fieldMessages = Object.values(res.errors ?? {}).flat();
        setSlug((s) => ({
          ...s,
          saving: false,
          problem: classifySlugError(res.error, res.errors),
          message: fieldMessages.length > 0 ? fieldMessages.join(" ") : res.error,
        }));
        return false;
      }

      const applied = readSlugFromResponse(res.data) ?? candidate;
      setSlug({
        current: applied,
        saving: false,
        problem: null,
        message: null,
        savedAt: Date.now(),
      });
      setSaved((s) => (s ? { ...s, artist: { ...s.artist, slug: applied } } : s));
      setDraft((d) => ({ ...d, artist: { ...d.artist, slug: applied } }));
      return true;
    },
    [profileId]
  );

  return {
    saved,
    draft,
    isLoading,
    loadFailure,
    reload,

    isDirty,
    isSaving,
    saveFailure,
    savedAt,
    save,
    discard,

    patchKit,
    setBio,
    setTheme,
    setHeadlineFont,

    moveSection,
    toggleSection,
    isHidden,

    isPublished,
    isPublishing,
    publishFailure,
    publish,
    unpublish,

    media,
    addPhoto,
    addSpotlight,
    removeMedia,
    replaceCover,
    removeCover,
    coverFailure,

    slug,
    checkSlug,
    changeSlug,
  };
}
