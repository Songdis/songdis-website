"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { Release } from "@/lib/api/music";
import {
  AI_OPTIONS,
  GENERATE_SENTINEL,
  PLATFORMS,
  TRAVEL_CITIES,
  VIDEO_TYPES,
  earliestGoLive,
  type VideoFormData,
} from "./videoForm";
import {
  CheckRow,
  ChoiceRow,
  CodeField,
  Field,
  PillGroup,
  SectionHead,
  TextAreaField,
  TextField,
  YesNo,
} from "./VideoFormFields";

interface StepProps {
  step: number;
  form: VideoFormData;
  update: (patch: Partial<VideoFormData>) => void;
  releases: Release[];
  loadingReleases: boolean;
  releasesTruncated?: boolean;
  thumbRef: React.RefObject<HTMLInputElement | null>;
}

function detectProvider(url: string): string | null {
  if (url.includes("drive.google.com")) return "Google Drive";
  if (url.includes("wetransfer.com")) return "WeTransfer";
  if (url.includes("dropbox.com")) return "Dropbox";
  return null;
}

/**
 * What picking a release fills in for the artist.
 *
 * Every one of these is already on the audio release, and the form says the video metadata
 * must match the audio release "where applicable" — so re-typing it is not just tedious, it
 * is the most likely way for the two to disagree. Only blank fields are touched, so an artist
 * who has already answered something never has it overwritten underneath them.
 */
function prefillFromRelease(release: Release, form: VideoFormData): Partial<VideoFormData> {
  const keepExisting = (current: string, incoming?: string) =>
    current.trim() !== "" ? current : (incoming ?? "").trim();

  // A single's ISRC is on its one track; an album has many and none of them is "the" one.
  const singleIsrc =
    release.tracks?.length === 1 ? (release.tracks[0]?.isrc_code ?? "") : "";

  // C-line and P-line are conventionally "2024 Some Label", so the year is already in there.
  const yearIn = (line?: string) => line?.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "";

  return {
    video_title: keepExisting(form.video_title, release.track_title ?? release.release_title),
    primary_artists: keepExisting(form.primary_artists, release.primary_artist),
    primary_genre: keepExisting(form.primary_genre, release.primary_genre),
    video_language: keepExisting(form.video_language, release.metadata_language),
    label_name: keepExisting(form.label_name, release.label),
    copyright_text: keepExisting(form.copyright_text, release.c_line),
    publishing_text: keepExisting(form.publishing_text, release.p_line),
    copyright_year: keepExisting(form.copyright_year, yearIn(release.c_line)),
    publishing_year: keepExisting(form.publishing_year, yearIn(release.p_line)),
    audio_isrc: keepExisting(form.audio_isrc, singleIsrc),
    // It is a Songdis release by definition, which is also what makes Spotify possible.
    audio_through_songdis: form.audio_through_songdis ?? true,
  };
}

export default function VideoFormSteps({
  step,
  form,
  update,
  releases,
  loadingReleases,
  releasesTruncated,
  thumbRef,
}: StepProps) {
  const [releaseQuery, setReleaseQuery] = useState("");

  /** Title, artist or release name — whichever the artist happens to remember. */
  const visibleReleases = useMemo(() => {
    const needle = releaseQuery.trim().toLowerCase();
    if (!needle) return releases;

    return releases.filter((r) =>
      [r.track_title, r.release_title, r.primary_artist].some((f) =>
        (f ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [releases, releaseQuery]);

  const toggle = (key: "platforms" | "travel_cities", id: string) => {
    const current = form[key];
    update({
      [key]: current.includes(id) ? current.filter((v) => v !== id) : [...current, id],
    } as Partial<VideoFormData>);
  };

  const wantsSpotify = form.platforms.includes("spotify");
  const wantsVevo = form.platforms.includes("vevo-youtube");

  // ---- 1. Artist & account information ----
  if (step === 1) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead
          index={1}
          title="Artist & account information"
          note="Please make sure this matches the audio release metadata where applicable. Songdis reviews every submission before delivery."
        />

        <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3">
          <CheckRow
            checked={form.age_confirmed}
            onChange={() => update({ age_confirmed: !form.age_confirmed })}
            label="Yes — I confirm I am at least 18 years old."
          />
          <CheckRow
            checked={form.agreement_accepted}
            onChange={() => update({ agreement_accepted: !form.agreement_accepted })}
            label="Yes, I understand — by submitting this form I am opting into Songdis Music Video Distribution services under my Digital Distribution Agreement."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="First name" required value={form.legal_first_name} onChange={(v) => update({ legal_first_name: v })} />
          <TextField label="Last name" required value={form.legal_last_name} onChange={(v) => update({ legal_last_name: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Primary email address" required type="email" inputMode="email" value={form.primary_email} onChange={(v) => update({ primary_email: v })} />
          <TextField label="Additional email address" type="email" inputMode="email" value={form.additional_email} onChange={(v) => update({ additional_email: v })} />
        </div>

        <TextField label="Songdis account name" required value={form.account_name} onChange={(v) => update({ account_name: v })} />
        <TextField
          label="Label name"
          required
          hint="If you are not under a label, enter your artist name."
          value={form.label_name}
          onChange={(v) => update({ label_name: v })}
        />
        <TextField
          label="Artist location"
          required
          placeholder="City / State / Province / Country"
          value={form.artist_location}
          onChange={(v) => update({ artist_location: v })}
        />
      </div>
    );
  }

  // ---- 2. Artist profile & social links ----
  if (step === 2) {
    const socials: { key: keyof VideoFormData; label: string; placeholder: string }[] = [
      { key: "social_spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
      { key: "social_soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/..." },
      { key: "social_facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
      { key: "social_instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
      { key: "social_tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
      { key: "social_x", label: "X / Twitter", placeholder: "https://x.com/..." },
      { key: "social_youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
      { key: "artist_website", label: "Artist website", placeholder: "https://..." },
    ];

    return (
      <div className="flex flex-col gap-5">
        <SectionHead
          index={2}
          title="Artist profile & social links"
          note="Please provide all available links. These are used when your video is pitched, so the more there are, the stronger the pitch."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {socials.map((s) => (
            <TextField
              key={s.key}
              label={s.label}
              type="url"
              inputMode="url"
              placeholder={s.placeholder}
              value={form[s.key] as string}
              onChange={(v) => update({ [s.key]: v } as Partial<VideoFormData>)}
            />
          ))}
        </div>
        <p className="font-body text-white/25 text-[11px]">
          Leave anything you do not have blank — none of these are required.
        </p>
      </div>
    );
  }

  // ---- 3. Video information ----
  if (step === 3) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={3} title="Video information" />

        {/* The release picker lives here because everything it fills in is on this screen
            and the next: title, artists, genre, language, credits and the audio ISRC. */}
        <Field
          label="Which release is this video for?"
          hint="Optional, but picking it fills in the metadata from your audio release so the two cannot disagree."
        >
          {loadingReleases ? (
            <p className="font-body text-white/30 text-xs py-3">Loading your releases…</p>
          ) : releases.length === 0 ? (
            <p className="font-body text-white/30 text-xs py-3">
              No releases found on your account. You can still fill this in by hand.
            </p>
          ) : (
            <>
              {releases.length > 6 && (
                <input
                  value={releaseQuery}
                  onChange={(e) => setReleaseQuery(e.target.value)}
                  placeholder={`Search ${releases.length} releases by title or artist`}
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors mb-2"
                />
              )}
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {visibleReleases.map((r) => {
                  const on = form.linkedSong?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        update({ linkedSong: r, ...prefillFromRelease(r, form) })
                      }
                      className={[
                        "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                        on ? "border-[#C30100] bg-[#C30100]/10" : "border-white/[0.07] hover:border-white/20",
                      ].join(" ")}
                    >
                      {r.album_art_url ? (
                        <Image
                          src={r.album_art_url}
                          alt=""
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover shrink-0"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-white/5 shrink-0" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-body text-white text-xs truncate">
                          {r.track_title || r.release_title}
                        </span>
                        <span className="block font-body text-white/35 text-[11px] truncate">
                          {r.primary_artist}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {visibleReleases.length === 0 && (
                  <p className="font-body text-white/30 text-xs py-2">
                    Nothing matches “{releaseQuery}”.
                  </p>
                )}
              </div>
              {releasesTruncated && (
                <p className="font-body text-amber-400/60 text-[11px] mt-1.5">
                  Your catalogue is larger than this list. Search to narrow it, or fill the
                  fields in by hand.
                </p>
              )}
            </>
          )}
        </Field>

        <TextField
          label="Video title"
          required
          hint="Video title only — do not include the artist name."
          value={form.video_title}
          onChange={(v) => update({ video_title: v })}
        />

        <Field label="Video type" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {VIDEO_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => update({ video_type: t.id })}
                className={[
                  "p-3 rounded-lg border text-left transition-all",
                  form.video_type === t.id
                    ? "border-[#C30100] bg-[#C30100]/10"
                    : "border-white/10 hover:border-white/25",
                ].join(" ")}
              >
                <p className={["font-heading text-xs", form.video_type === t.id ? "text-[#C30100]" : "text-white/70"].join(" ")}>
                  {t.name}
                </p>
                <p className="font-body text-white/30 text-[10px] mt-0.5 leading-snug">{t.description}</p>
              </button>
            ))}
          </div>
          {/* Said here, where the type is chosen, rather than only on the delivery step —
              by then the artist has to come back and change this to fix it. */}
          {wantsSpotify && form.video_type !== "official-video" && (
            <p className="font-body text-amber-400/80 text-[11px] mt-2 leading-relaxed">
              You selected Spotify for delivery, and Spotify only accepts Official Music
              Videos. Either pick Official Music Video here, or remove Spotify in section 9.
            </p>
          )}
        </Field>

        <TextField
          label="Primary artist(s)"
          required
          hint="For multiple artists, separate names with a comma."
          value={form.primary_artists}
          onChange={(v) => update({ primary_artists: v })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Featured artist(s)" value={form.featured_artists} onChange={(v) => update({ featured_artists: v })} />
          <TextField label="Remixer(s)" value={form.remixers} onChange={(v) => update({ remixers: v })} />
        </div>

        <TextAreaField
          label="Writer(s)"
          required
          rows={3}
          hint="Full name + role, e.g. John Doe — Songwriter. One per line."
          value={form.writers}
          onChange={(v) => update({ writers: v })}
        />
        <TextAreaField
          label="Production & engineering credits"
          required
          rows={3}
          hint="Full name + role, e.g. Jane Doe — Producer. One per line."
          value={form.production_credits}
          onChange={(v) => update({ production_credits: v })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Video language" required value={form.video_language} onChange={(v) => update({ video_language: v })} />
          <TextField label="Primary genre" required value={form.primary_genre} onChange={(v) => update({ primary_genre: v })} />
        </div>
      </div>
    );
  }

  // ---- 4. Video identifiers & audio information ----
  if (step === 4) {
    const isrcIsNA = form.audio_isrc.trim().toUpperCase() === "N/A";

    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={4} title="Video identifiers & audio information" />

        <CodeField
          label="Video UPC"
          required
          value={form.video_upc}
          onChange={(v) => update({ video_upc: v })}
          sentinel={GENERATE_SENTINEL}
          sentinelLabel="I don't have one — Songdis should generate it"
          placeholder="e.g. 123456789012"
        />
        <CodeField
          label="Video ISRC"
          required
          value={form.video_isrc}
          onChange={(v) => update({ video_isrc: v })}
          sentinel={GENERATE_SENTINEL}
          sentinelLabel="I don't have one — Songdis should generate it"
          placeholder="e.g. NGA123456789"
        />

        <Field
          label="Audio ISRC"
          required
          hint="The ISRC of the audio track this video is for. Only mark it N/A if the video is not going to Spotify."
        >
          <input
            value={isrcIsNA ? "" : form.audio_isrc}
            disabled={isrcIsNA}
            onChange={(e) => update({ audio_isrc: e.target.value })}
            placeholder={isrcIsNA ? "N/A" : "e.g. NGA123456789"}
            className={
              "w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" +
              (isrcIsNA ? " opacity-40" : "")
            }
          />
          <button
            type="button"
            onClick={() => update({ audio_isrc: isrcIsNA ? "" : "N/A" })}
            className="font-body text-[#C30100] text-[11px] hover:underline mt-1.5"
          >
            {isrcIsNA ? "I have the audio ISRC" : "Not eligible for Spotify — mark N/A"}
          </button>
          {isrcIsNA && wantsSpotify && (
            <p className="font-body text-amber-400/80 text-[11px] mt-1.5 leading-relaxed">
              Spotify needs the audio ISRC to match the video to your track. Either add it, or
              remove Spotify in section 9.
            </p>
          )}
        </Field>

        <YesNo
          label="Is the audio distributed through Songdis?"
          required
          value={form.audio_through_songdis}
          onChange={(v) => update({ audio_through_songdis: v })}
        />
        <YesNo
          label="Does this contain explicit audio or video content?"
          required
          value={form.explicit_content}
          onChange={(v) => update({ explicit_content: v })}
        />
        <YesNo
          label="Has this video already been released elsewhere?"
          required
          value={form.already_released}
          onChange={(v) => update({ already_released: v })}
        />
        {form.already_released === true && (
          <TextField
            label="Original video release date"
            required
            type="date"
            value={form.original_release_date}
            onChange={(v) => update({ original_release_date: v })}
          />
        )}

        <TextField
          label="Video thumbnail / artwork"
          required
          hint="Which timestamp or section of the video to use. The thumbnail may be changed if it does not meet platform requirements."
          placeholder="e.g. 00:42, or the wide shot in the final chorus"
          value={form.thumbnail_timestamp}
          onChange={(v) => update({ thumbnail_timestamp: v })}
        />

        {/*
          The video file and a cover image are not on the paper form, which is metadata only.
          They are asked for here because nothing can be delivered without them.
        */}
        <div className="border-t border-white/[0.07] pt-5 flex flex-col gap-4">
          <p className="font-heading text-white/70 uppercase text-[11px] tracking-widest">
            Your video file
          </p>

          <Field label="Video file link" required hint="Paste a shareable link from Google Drive, WeTransfer or Dropbox.">
            <input
              value={form.video_file_link}
              onChange={(e) => update({ video_file_link: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
            {detectProvider(form.video_file_link) && (
              <p className="font-body text-green-400/70 text-[11px] mt-1">
                {detectProvider(form.video_file_link)} link detected
              </p>
            )}
          </Field>

          <Field label="Cover image" required hint="1920×1080 or 1:1, under 5MB.">
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) update({ thumbnailFile: f, thumbnailUploaded: true });
              }}
            />
            <button
              type="button"
              onClick={() => thumbRef.current?.click()}
              className={[
                "w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-colors",
                form.thumbnailUploaded
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-white/10 hover:border-white/25",
              ].join(" ")}
            >
              {form.thumbnailUploaded ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="font-body text-green-400 text-xs">
                    {form.thumbnailFile ? form.thumbnailFile.name : "Using your release cover art"}
                  </p>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="font-body text-white/40 text-xs">Click to upload</p>
                </>
              )}
            </button>
            {form.linkedSong?.album_art_url && !form.thumbnailFile && (
              <button
                type="button"
                onClick={() => update({ thumbnailUploaded: true, thumbnailFile: null })}
                className="font-body text-[#C30100] text-xs hover:underline mt-1"
              >
                Use the release cover art instead
              </button>
            )}
          </Field>
        </div>
      </div>
    );
  }

  // ---- 5. AI content disclosure ----
  if (step === 5) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead
          index={5}
          title="AI content disclosure"
          note="Platforms require this to be declared. An undisclosed AI element found later can get a video taken down, so answer it as it actually is."
        />
        <ChoiceRow
          label="AI-generated images in the video"
          required
          options={AI_OPTIONS}
          value={form.ai_images as "" | "none" | "some" | "all"}
          onChange={(v) => update({ ai_images: v })}
        />
        <ChoiceRow
          label="AI-generated audio in the video"
          required
          options={AI_OPTIONS}
          value={form.ai_audio as "" | "none" | "some" | "all"}
          onChange={(v) => update({ ai_audio: v })}
        />
      </div>
    );
  }

  // ---- 6. Video credits ----
  if (step === 6) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={6} title="Video credits" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField label="Director(s)" value={form.director} onChange={(v) => update({ director: v })} />
          <TextField label="Producer(s)" value={form.producer} onChange={(v) => update({ producer: v })} />
          <TextField label="Editor(s)" value={form.editor} onChange={(v) => update({ editor: v })} />
          <TextField label="Composer(s)" value={form.composer} onChange={(v) => update({ composer: v })} />
        </div>

        <TextAreaField
          label="Other credits"
          rows={3}
          hint="Production company, actors, cinematographer, creative director, choreographer, and so on."
          value={form.other_credits}
          onChange={(v) => update({ other_credits: v })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField
            label="Copyright year"
            required
            inputMode="numeric"
            max={4}
            placeholder={String(new Date().getFullYear())}
            value={form.copyright_year}
            onChange={(v) => update({ copyright_year: v.replace(/\D/g, "") })}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Copyright text"
              required
              hint="If unsure, put your artist name or label name."
              value={form.copyright_text}
              onChange={(v) => update({ copyright_text: v })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TextField
            label="Publishing year"
            required
            inputMode="numeric"
            max={4}
            placeholder={String(new Date().getFullYear())}
            value={form.publishing_year}
            onChange={(v) => update({ publishing_year: v.replace(/\D/g, "") })}
          />
          <div className="sm:col-span-2">
            <TextField
              label="Publishing text"
              required
              hint="If unsure, put your artist name or label name."
              value={form.publishing_text}
              onChange={(v) => update({ publishing_text: v })}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---- 7. Video promotion & marketing ----
  if (step === 7) {
    const followers = (
      key: "followers_x" | "followers_facebook" | "followers_instagram",
      label: string,
    ) => (
      <TextField
        label={label}
        required
        inputMode="numeric"
        hint="Whole numbers only — no letters, commas or periods."
        placeholder="0"
        value={form[key]}
        onChange={(v) => update({ [key]: v.replace(/\D/g, "") } as Partial<VideoFormData>)}
      />
    );

    return (
      <div className="flex flex-col gap-5">
        <SectionHead
          index={7}
          title="Video promotion & marketing"
          note="This is what a pitch is built from. Enter N/A where something does not apply rather than leaving it empty."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {followers("followers_x", "X / Twitter followers")}
          {followers("followers_facebook", "Facebook followers")}
          {followers("followers_instagram", "Instagram followers")}
        </div>

        <TextAreaField
          label="What's the story?"
          required
          rows={4}
          hint="Anything that helps us pitch this video. Enter N/A if not applicable."
          value={form.story}
          onChange={(v) => update({ story: v })}
        />
        <TextAreaField
          label="Confirmed press"
          rows={3}
          hint="Enter N/A if not applicable."
          value={form.confirmed_press}
          onChange={(v) => update({ confirmed_press: v })}
        />
        <TextAreaField
          label="Brand affiliations"
          rows={2}
          hint="Enter N/A if not applicable."
          value={form.brand_affiliations}
          onChange={(v) => update({ brand_affiliations: v })}
        />
        <TextAreaField
          label="Artist bio"
          required
          rows={5}
          max={1000}
          value={form.artist_bio}
          onChange={(v) => update({ artist_bio: v })}
        />
        <TextField
          label="Audio pre-save / smart link"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={form.smart_link}
          onChange={(v) => update({ smart_link: v })}
        />

        <YesNo
          label="Artist travel — LA / NY / London"
          required
          hint="Are you going to be in any of these cities around the release?"
          value={form.travel_planned}
          onChange={(v) => update({ travel_planned: v })}
        />
        {form.travel_planned === true && (
          <>
            <PillGroup
              label="Cities"
              required
              options={TRAVEL_CITIES}
              selected={form.travel_cities}
              onToggle={(id) => toggle("travel_cities", id)}
            />
            <TextField
              label="Dates"
              required
              placeholder="e.g. 12–19 November"
              value={form.travel_dates}
              onChange={(v) => update({ travel_dates: v })}
            />
          </>
        )}
      </div>
    );
  }

  // ---- 8. Video release date ----
  if (step === 8) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={8} title="Video release date" />

        <TextField
          label="Video go-live date"
          required
          type="date"
          min={earliestGoLive()}
          value={form.release_date}
          onChange={(v) => update({ release_date: v })}
        />

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="font-body text-white text-sm font-medium mb-1">
            Submit at least 3 weeks ahead
          </p>
          <p className="font-body text-amber-400/70 text-xs leading-relaxed">
            Your go-live date needs to be at least 3 weeks away. That time goes on review,
            corrections, delivery, platform processing and pitching where applicable — the
            earliest date you can pick is {new Date(earliestGoLive()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
        </div>
      </div>
    );
  }

  // ---- 9. Video platform delivery ----
  if (step === 9) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={9} title="Video platform delivery" />

        <PillGroup
          label="Send my music video to"
          required
          options={PLATFORMS}
          selected={form.platforms}
          onToggle={(id) => toggle("platforms", id)}
          noteFor={(id) => {
            if (id === "spotify" && form.video_type && form.video_type !== "official-video") {
              return "Official Music Videos only — change the video type in section 3 to use this.";
            }
            if (id === "promo-only") return "Curated: delivery does not guarantee placement.";
            return null;
          }}
        />

        {wantsSpotify && (
          <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4">
            <CheckRow
              checked={form.spotify_eligibility_confirmed}
              onChange={() =>
                update({ spotify_eligibility_confirmed: !form.spotify_eligibility_confirmed })
              }
              label="I confirm that the audio track for this video is also distributed through Songdis and is eligible for Spotify Music Video delivery."
            />
          </div>
        )}

        <TextField
          label="Apple Music artist profile URL"
          required
          type="url"
          inputMode="url"
          hint="If you do not have one, enter https://music.apple.com/"
          placeholder="https://music.apple.com/..."
          value={form.apple_music_profile_url}
          onChange={(v) => update({ apple_music_profile_url: v })}
        />

        <p className="font-body text-white/25 text-[11px] leading-relaxed">
          Spotify currently accepts Official Music Videos only. Promo Only is curated, so
          delivery there does not guarantee placement.
        </p>
      </div>
    );
  }

  // ---- 10. Vevo information ----
  if (step === 10) {
    if (!wantsVevo) {
      return (
        <div className="flex flex-col gap-5">
          <SectionHead index={10} title="Vevo information" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <p className="font-body text-white text-sm mb-1">Nothing needed here</p>
            <p className="font-body text-white/40 text-xs leading-relaxed">
              You did not select Vevo / YouTube in section 9, so there is no channel to set up.
              Go back to section 9 if you meant to include it.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5">
        <SectionHead index={10} title="Vevo information" />

        <TextField
          label="Vevo channel name"
          required
          max={20}
          hint="Maximum 20 characters including VEVO, and no special characters."
          placeholder="e.g. BURNABOYVEVO"
          value={form.vevo_channel_name}
          onChange={(v) => update({ vevo_channel_name: v.replace(/[^A-Za-z0-9 ]/g, "") })}
        />
        <TextField
          label="Collaborator Vevo channel"
          value={form.vevo_collaborator_channel}
          onChange={(v) => update({ vevo_collaborator_channel: v })}
        />
        <ChoiceRow
          label="Vevo channel status"
          required
          options={[
            { id: "new", name: "NEW — needs to be created" },
            { id: "active", name: "ACTIVE — already created" },
          ]}
          value={form.vevo_channel_status as "" | "new" | "active"}
          onChange={(v) => update({ vevo_channel_status: v })}
        />
        <TextAreaField
          label="Vevo channel description"
          rows={5}
          max={1000}
          value={form.vevo_channel_description}
          onChange={(v) => update({ vevo_channel_description: v })}
        />
      </div>
    );
  }

  // ---- 11. YouTube / Vevo video description ----
  if (step === 11) {
    const hashtags = (form.video_description.match(/#[\p{L}\p{N}_]+/gu) ?? []).length;

    return (
      <div className="flex flex-col gap-5">
        <SectionHead
          index={11}
          title="YouTube / Vevo video description"
          note="This is published word for word as the description under your video."
        />

        <TextAreaField
          label="Video description"
          required
          rows={9}
          max={5000}
          hint="Include your smart link, social links, video credits, lyrics where applicable, and at least 3 hashtags."
          value={form.video_description}
          onChange={(v) => update({ video_description: v })}
        />

        {/*
          Counted as they type. The hashtag requirement is the most-skipped instruction on
          the form, and the server rejects a description without three — finding that out on
          submit means coming back eleven sections.
        */}
        <div
          className={[
            "rounded-lg px-4 py-3 border",
            hashtags >= 3
              ? "bg-green-500/5 border-green-500/20"
              : "bg-amber-500/5 border-amber-500/20",
          ].join(" ")}
        >
          <p className={["font-body text-xs", hashtags >= 3 ? "text-green-400/80" : "text-amber-400/80"].join(" ")}>
            {hashtags >= 3
              ? `${hashtags} hashtags — that meets the requirement.`
              : `${hashtags} of 3 hashtags. Add ${3 - hashtags} more, e.g. #afrobeats.`}
          </p>
        </div>

        <TextAreaField
          label="YouTube keywords"
          rows={3}
          max={500}
          hint="Separate keywords with a comma and a space."
          value={form.youtube_keywords}
          onChange={(v) => update({ youtube_keywords: v })}
        />
      </div>
    );
  }

  // ---- 12. Final submission confirmation ----
  return (
    <div className="flex flex-col gap-5">
      <SectionHead index={12} title="Final submission confirmation" />

      <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3.5">
        <CheckRow
          checked={form.confirm_accurate}
          onChange={() => update({ confirm_accurate: !form.confirm_accurate })}
          label="Information provided is accurate and complete."
        />
        <CheckRow
          checked={form.confirm_names_spelled}
          onChange={() => update({ confirm_names_spelled: !form.confirm_names_spelled })}
          label="Artist and contributor names are correctly spelled."
        />
        <CheckRow
          checked={form.confirm_ai_disclosed}
          onChange={() => update({ confirm_ai_disclosed: !form.confirm_ai_disclosed })}
          label="AI-generated content has been properly disclosed."
        />
        <CheckRow
          checked={form.confirm_no_guarantee}
          onChange={() => update({ confirm_no_guarantee: !form.confirm_no_guarantee })}
          label="I understand submission does not guarantee approval, platform placement, playlist pitching, or a specific release date."
        />
        <CheckRow
          checked={form.confirm_corrections}
          onChange={() => update({ confirm_corrections: !form.confirm_corrections })}
          label="I understand Songdis may request corrections or additional information."
        />
      </div>

      {/* Rights. Not on the paper form, but it is the only place the artist states that the
          video is theirs to distribute. */}
      <div className="bg-[#1A0808] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3.5">
        <CheckRow
          checked={form.owns_100_percent}
          onChange={() => update({ owns_100_percent: !form.owns_100_percent })}
          label="I own 100% of the rights to this video, or have permission from everyone who does."
        />
        <CheckRow
          checked={form.no_unlicensed_content}
          onChange={() => update({ no_unlicensed_content: !form.no_unlicensed_content })}
          label="No unlicensed samples, logos, brands or copyrighted footage appear in this video."
        />
      </div>

      <TextAreaField
        label="Additional notes"
        rows={3}
        value={form.additional_notes}
        onChange={(v) => update({ additional_notes: v })}
      />
      <TextField
        label="Submitted by"
        required
        value={form.submitted_by_name}
        onChange={(v) => update({ submitted_by_name: v })}
      />
    </div>
  );
}
