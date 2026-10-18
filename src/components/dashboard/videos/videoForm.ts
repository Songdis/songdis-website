import type { Release } from "@/lib/api/music";

/**
 * The Songdis Music Video Distribution Submission Form, sections 1-12.
 *
 * Field names are snake_case and identical to the API's, deliberately. There are around sixty
 * of them, and a camelCase form state would need a sixty-line translation table on the way out
 * — which is exactly the kind of list where one missing line means one silently undelivered
 * answer. Here `buildSubmission()` can walk the object instead.
 */

export const SECTIONS = [
  "Artist & account",
  "Profile & social links",
  "Video information",
  "Identifiers & audio",
  "AI disclosure",
  "Video credits",
  "Promotion & marketing",
  "Release date",
  "Platform delivery",
  "Vevo information",
  "YouTube description",
  "Final confirmation",
] as const;

export const TOTAL_STEPS = SECTIONS.length;

/** Section 3. Slugs match StoreVideoRequest::VIDEO_TYPES. */
export const VIDEO_TYPES = [
  { id: "official-video", name: "Official Music Video", description: "The main music video for your song." },
  { id: "lyric-video", name: "Lyric Video", description: "The song's lyrics on screen." },
  { id: "live-video", name: "Live Video", description: "A live or concert performance." },
  { id: "visualizer", name: "Visualizer", description: "Looping visuals synced to the song." },
  { id: "track-video", name: "Track Video", description: "Static image or simple animation." },
  { id: "animated-video", name: "Animated Video", description: "Animation or motion graphics throughout." },
  { id: "documentary", name: "Documentary / Making Of", description: "Long-form story, or footage from the shoot." },
] as const;

/**
 * Labels for a stored video_type, including the three the old wizard used.
 *
 * `concert-video`, `music-documentary` and `behind-the-scenes` are no longer offered, but
 * submissions made with them are still in the list and still have to read as words.
 */
const LEGACY_TYPE_NAMES: Record<string, string> = {
  "concert-video": "Concert Video",
  "music-documentary": "Music Documentary",
  "behind-the-scenes": "Behind the Scenes",
};

export function videoTypeName(id: string): string {
  return (
    VIDEO_TYPES.find((t) => t.id === id)?.name ??
    LEGACY_TYPE_NAMES[id] ??
    id
  );
}

/** Section 9. Slugs match StoreVideoRequest::PLATFORMS. */
export const PLATFORMS = [
  { id: "vevo-youtube", name: "Vevo / YouTube" },
  { id: "apple-music", name: "Apple Music" },
  { id: "spotify", name: "Spotify" },
  { id: "tidal", name: "TIDAL" },
  { id: "xite", name: "XITE" },
  { id: "vimeo", name: "Vimeo" },
  { id: "promo-only", name: "Promo Only" },
] as const;

export function platformName(id: string): string {
  // Falls back to the raw value so rows stored before slugs ("VEVO", "Spotify *") still read.
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}

export const AI_OPTIONS = [
  { id: "none", name: "None" },
  { id: "some", name: "Some" },
  { id: "all", name: "All" },
] as const;

export const TRAVEL_CITIES = [
  { id: "los-angeles", name: "Los Angeles" },
  { id: "new-york", name: "New York" },
  { id: "london", name: "London" },
] as const;

/** Section 8: "at least 3 weeks before the requested go-live date". */
export const MIN_LEAD_DAYS = 21;

/** The sentinel the form tells artists to use when they have no code of their own. */
export const GENERATE_SENTINEL = "SONGDIS GENERATE";

export interface VideoFormData {
  // Not a form field: the audio release this video belongs to, used to prefill and to link.
  linkedSong: Release | null;

  // 1. Artist & account information
  age_confirmed: boolean;
  agreement_accepted: boolean;
  legal_first_name: string;
  legal_last_name: string;
  primary_email: string;
  additional_email: string;
  account_name: string;
  label_name: string;
  artist_location: string;

  // 2. Artist profile & social links
  social_spotify: string;
  social_soundcloud: string;
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  social_x: string;
  social_youtube: string;
  artist_website: string;

  // 3. Video information
  video_title: string;
  video_type: string;
  primary_artists: string;
  featured_artists: string;
  remixers: string;
  writers: string;
  production_credits: string;
  video_language: string;
  primary_genre: string;

  // 4. Video identifiers & audio information
  video_upc: string;
  video_isrc: string;
  audio_isrc: string;
  audio_through_songdis: boolean | null;
  explicit_content: boolean | null;
  already_released: boolean | null;
  original_release_date: string;
  thumbnail_timestamp: string;
  // Not on the form, but nothing can be delivered without them.
  video_file_link: string;
  thumbnailFile: File | null;
  thumbnailUploaded: boolean;

  // 5. AI content disclosure
  ai_images: string;
  ai_audio: string;

  // 6. Video credits
  director: string;
  producer: string;
  editor: string;
  composer: string;
  other_credits: string;
  copyright_year: string;
  copyright_text: string;
  publishing_year: string;
  publishing_text: string;

  // 7. Video promotion & marketing
  followers_x: string;
  followers_facebook: string;
  followers_instagram: string;
  story: string;
  confirmed_press: string;
  brand_affiliations: string;
  artist_bio: string;
  smart_link: string;
  travel_planned: boolean | null;
  travel_cities: string[];
  travel_dates: string;

  // 8. Video release date
  release_date: string;

  // 9. Video platform delivery
  platforms: string[];
  spotify_eligibility_confirmed: boolean;
  apple_music_profile_url: string;

  // 10. Vevo information
  vevo_channel_name: string;
  vevo_collaborator_channel: string;
  vevo_channel_status: string;
  vevo_channel_description: string;

  // 11. YouTube / Vevo video description
  video_description: string;
  youtube_keywords: string;

  // 12. Final submission confirmation
  confirm_accurate: boolean;
  confirm_names_spelled: boolean;
  confirm_ai_disclosed: boolean;
  confirm_no_guarantee: boolean;
  confirm_corrections: boolean;
  owns_100_percent: boolean;
  no_unlicensed_content: boolean;
  additional_notes: string;
  submitted_by_name: string;
}

export const EMPTY_VIDEO_FORM: VideoFormData = {
  linkedSong: null,

  age_confirmed: false,
  agreement_accepted: false,
  legal_first_name: "",
  legal_last_name: "",
  primary_email: "",
  additional_email: "",
  account_name: "",
  label_name: "",
  artist_location: "",

  social_spotify: "",
  social_soundcloud: "",
  social_facebook: "",
  social_instagram: "",
  social_tiktok: "",
  social_x: "",
  social_youtube: "",
  artist_website: "",

  video_title: "",
  video_type: "",
  primary_artists: "",
  featured_artists: "",
  remixers: "",
  writers: "",
  production_credits: "",
  video_language: "",
  primary_genre: "",

  video_upc: "",
  video_isrc: "",
  audio_isrc: "",
  audio_through_songdis: null,
  explicit_content: null,
  already_released: null,
  original_release_date: "",
  thumbnail_timestamp: "",
  video_file_link: "",
  thumbnailFile: null,
  thumbnailUploaded: false,

  ai_images: "",
  ai_audio: "",

  director: "",
  producer: "",
  editor: "",
  composer: "",
  other_credits: "",
  copyright_year: "",
  copyright_text: "",
  publishing_year: "",
  publishing_text: "",

  followers_x: "",
  followers_facebook: "",
  followers_instagram: "",
  story: "",
  confirmed_press: "",
  brand_affiliations: "",
  artist_bio: "",
  smart_link: "",
  travel_planned: null,
  travel_cities: [],
  travel_dates: "",

  release_date: "",

  platforms: [],
  spotify_eligibility_confirmed: false,
  apple_music_profile_url: "",

  vevo_channel_name: "",
  vevo_collaborator_channel: "",
  vevo_channel_status: "",
  vevo_channel_description: "",

  video_description: "",
  youtube_keywords: "",

  confirm_accurate: false,
  confirm_names_spelled: false,
  confirm_ai_disclosed: false,
  confirm_no_guarantee: false,
  confirm_corrections: false,
  owns_100_percent: false,
  no_unlicensed_content: false,
  additional_notes: "",
  submitted_by_name: "",
};

/**
 * Which step a server-side field error belongs to.
 *
 * The submit button sits at the bottom of step 12, and a 422 can name fields from any of the
 * twelve. "Go back and fix these" is useless when three problems span three sections, so every
 * error is shown with the step it came from and a way to jump there.
 */
const FIELD_STEPS: Record<string, number> = {
  age_confirmed: 1, agreement_accepted: 1, legal_first_name: 1, legal_last_name: 1,
  primary_email: 1, additional_email: 1, account_name: 1, label_name: 1, artist_location: 1,

  social_spotify: 2, social_soundcloud: 2, social_facebook: 2, social_instagram: 2,
  social_tiktok: 2, social_x: 2, social_youtube: 2, artist_website: 2,

  video_title: 3, video_type: 3, primary_artists: 3, featured_artists: 3, remixers: 3,
  writers: 3, production_credits: 3, video_language: 3, primary_genre: 3,

  video_upc: 4, video_isrc: 4, audio_isrc: 4, audio_through_songdis: 4, explicit_content: 4,
  already_released: 4, original_release_date: 4, thumbnail_timestamp: 4, video_file_link: 4,
  thumbnail: 4,

  ai_images: 5, ai_audio: 5,

  director: 6, producer: 6, editor: 6, composer: 6, other_credits: 6,
  copyright_year: 6, copyright_text: 6, publishing_year: 6, publishing_text: 6,

  followers_x: 7, followers_facebook: 7, followers_instagram: 7, story: 7, confirmed_press: 7,
  brand_affiliations: 7, artist_bio: 7, smart_link: 7, travel_planned: 7, travel_cities: 7,
  travel_dates: 7,

  release_date: 8,

  platforms: 9, spotify_eligibility_confirmed: 9, apple_music_profile_url: 9,

  vevo_channel_name: 10, vevo_collaborator_channel: 10, vevo_channel_status: 10,
  vevo_channel_description: 10,

  video_description: 11, youtube_keywords: 11,

  confirm_accurate: 12, confirm_names_spelled: 12, confirm_ai_disclosed: 12,
  confirm_no_guarantee: 12, confirm_corrections: 12, owns_100_percent: 12,
  no_unlicensed_content: 12, additional_notes: 12, submitted_by_name: 12,
};

export interface FieldProblem {
  field: string;
  step: number;
  /** "4. Identifiers & audio", ready to print. */
  stepLabel: string;
  message: string;
}

/**
 * Flatten a Laravel field-error map into something that can be shown all at once.
 *
 * `errors` is the only place per-field validation messages live — code that reads just
 * `error` shows one problem at a time and hides the rest, which on a twelve-section form
 * means twelve round trips to submit once.
 */
export function describeProblems(
  errors?: Record<string, string[]> | null,
): FieldProblem[] {
  if (!errors) return [];

  return Object.entries(errors)
    .flatMap(([field, messages]) => {
      // "travel_cities.0" and "platforms.2" belong to their parent field's step.
      const root = field.split(".")[0];
      const step = FIELD_STEPS[root] ?? TOTAL_STEPS;

      return (messages ?? []).map((message) => ({
        field: root,
        step,
        stepLabel: `${step}. ${SECTIONS[step - 1]}`,
        message,
      }));
    })
    .sort((a, b) => a.step - b.step);
}

/** The earliest go-live date the API will accept, as a yyyy-mm-dd string for `min`. */
export function earliestGoLive(): string {
  const d = new Date();
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return d.toISOString().slice(0, 10);
}

/**
 * Every key that is sent as a plain scalar, in section order.
 *
 * Listed rather than derived from the object, because `linkedSong`, `thumbnailFile`,
 * `thumbnailUploaded`, `platforms` and `travel_cities` each need their own handling and a
 * blanket loop would post "[object Object]" for the first one.
 */
const SCALAR_KEYS: (keyof VideoFormData)[] = [
  "legal_first_name", "legal_last_name", "primary_email", "additional_email",
  "account_name", "label_name", "artist_location",

  "social_spotify", "social_soundcloud", "social_facebook", "social_instagram",
  "social_tiktok", "social_x", "social_youtube", "artist_website",

  "video_title", "video_type", "primary_artists", "featured_artists", "remixers",
  "writers", "production_credits", "video_language", "primary_genre",

  "video_upc", "video_isrc", "audio_isrc", "original_release_date", "thumbnail_timestamp",
  "video_file_link",

  "ai_images", "ai_audio",

  "director", "producer", "editor", "composer", "other_credits",
  "copyright_year", "copyright_text", "publishing_year", "publishing_text",

  "followers_x", "followers_facebook", "followers_instagram", "story", "confirmed_press",
  "brand_affiliations", "artist_bio", "smart_link", "travel_dates",

  "release_date",

  "apple_music_profile_url",

  "vevo_channel_name", "vevo_collaborator_channel", "vevo_channel_status",
  "vevo_channel_description",

  "video_description", "youtube_keywords",

  "additional_notes", "submitted_by_name",
];

/** Booleans, which have to go over the wire as "1"/"0" for Laravel's `boolean` rule. */
const BOOLEAN_KEYS: (keyof VideoFormData)[] = [
  "age_confirmed", "agreement_accepted",
  "audio_through_songdis", "explicit_content", "already_released",
  "travel_planned",
  "spotify_eligibility_confirmed",
  "confirm_accurate", "confirm_names_spelled", "confirm_ai_disclosed",
  "confirm_no_guarantee", "confirm_corrections",
  "owns_100_percent", "no_unlicensed_content",
];

export function buildSubmission(form: VideoFormData): FormData {
  const fd = new FormData();

  for (const key of SCALAR_KEYS) {
    const value = form[key];
    /*
     * Empty optional fields are omitted rather than sent as "".
     *
     * `nullable|url` rejects an empty string, so posting every blank social link would fail
     * validation on fields the artist was never asked to fill in.
     */
    if (value !== "" && value !== null && value !== undefined) {
      fd.append(key, String(value));
    }
  }

  for (const key of BOOLEAN_KEYS) {
    const value = form[key];
    // A null tri-state is "unanswered"; let the server's `required` rule name it.
    if (value !== null && value !== undefined) {
      fd.append(key, value ? "1" : "0");
    }
  }

  form.platforms.forEach((p) => fd.append("platforms[]", p));
  form.travel_cities.forEach((c) => fd.append("travel_cities[]", c));

  if (form.linkedSong) {
    fd.append("release_id", String(form.linkedSong.id));
    fd.append(
      "release_title",
      form.linkedSong.release_title ?? form.linkedSong.track_title ?? "",
    );
    fd.append("release_artist", form.linkedSong.primary_artist ?? "");
    fd.append("release_cover_url", form.linkedSong.album_art_url || "");
  }

  if (form.thumbnailFile) {
    fd.append("thumbnail", form.thumbnailFile);
  } else if (form.linkedSong?.album_art_url) {
    fd.append("thumbnail_url", form.linkedSong.album_art_url);
  }

  return fd;
}

/**
 * Whether a step has everything it needs to move on.
 *
 * Only the required fields are checked, and only the ones that can be judged locally. The
 * server is still the authority — this exists so an artist is stopped on the step that is
 * short of something, rather than at the end with a list.
 */
export function stepComplete(step: number, form: VideoFormData): boolean {
  const filled = (...values: string[]) => values.every((v) => v.trim() !== "");
  const wantsSpotify = form.platforms.includes("spotify");
  const wantsVevo = form.platforms.includes("vevo-youtube");

  switch (step) {
    case 1:
      return (
        form.age_confirmed &&
        form.agreement_accepted &&
        filled(
          form.legal_first_name, form.legal_last_name, form.primary_email,
          form.account_name, form.label_name, form.artist_location,
        )
      );
    case 2:
      return true; // "Please provide all available links" — none is a valid answer.
    case 3:
      return filled(
        form.video_title, form.video_type, form.primary_artists, form.writers,
        form.production_credits, form.video_language, form.primary_genre,
      );
    case 4:
      return (
        filled(form.video_upc, form.video_isrc, form.audio_isrc, form.thumbnail_timestamp, form.video_file_link) &&
        form.audio_through_songdis !== null &&
        form.explicit_content !== null &&
        form.already_released !== null &&
        (form.already_released === false || filled(form.original_release_date)) &&
        form.thumbnailUploaded
      );
    case 5:
      return filled(form.ai_images, form.ai_audio);
    case 6:
      return filled(
        form.copyright_year, form.copyright_text,
        form.publishing_year, form.publishing_text,
      );
    case 7:
      return (
        filled(form.followers_x, form.followers_facebook, form.followers_instagram,
          form.story, form.artist_bio) &&
        form.travel_planned !== null &&
        (form.travel_planned === false ||
          (form.travel_cities.length > 0 && filled(form.travel_dates)))
      );
    case 8:
      return filled(form.release_date);
    case 9:
      return (
        form.platforms.length > 0 &&
        filled(form.apple_music_profile_url) &&
        // Mirrors the server: Spotify takes Official Music Videos only, and needs the
        // eligibility confirmation plus a real Audio ISRC.
        (!wantsSpotify ||
          (form.video_type === "official-video" &&
            form.spotify_eligibility_confirmed &&
            form.audio_through_songdis === true &&
            form.audio_isrc.trim().toUpperCase() !== "N/A"))
      );
    case 10:
      return !wantsVevo || filled(form.vevo_channel_name, form.vevo_channel_status);
    case 11:
      // The form asks for at least 3 hashtags, and the server enforces it.
      return (
        filled(form.video_description) &&
        (form.video_description.match(/#[\p{L}\p{N}_]+/gu) ?? []).length >= 3
      );
    case 12:
      return (
        form.confirm_accurate &&
        form.confirm_names_spelled &&
        form.confirm_ai_disclosed &&
        form.confirm_no_guarantee &&
        form.confirm_corrections &&
        form.owns_100_percent &&
        form.no_unlicensed_content &&
        filled(form.submitted_by_name)
      );
    default:
      return false;
  }
}
