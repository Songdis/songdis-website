import { request } from "./core";

export interface Curator {
  id: number;
  name: string;
  genre?: string;
  followers?: string | number;
  platform?: string;
  description?: string;
  [key: string]: unknown;
}

export interface Pitch {
  id: number;
  music_upload_id: number;
  /** Null for every pitch from now on: a pitch is for the release, not a chosen playlist. */
  curator_id?: number | null;
  status: "draft" | "submitted" | "approved" | "rejected" | "under_review";
  release_story?: string;
  similar_artists?: string[];
  track_moods?: string[];
  track_attributes?: string[];
  track_style?: string[];
  has_press?: boolean;
  has_shows?: boolean;
  has_visual_assets?: boolean;
  visual_assets_url?: string;
  has_ad_campaign?: boolean;
  has_radio_campaign?: boolean;
  has_physical_product?: boolean;
  has_other_press?: boolean;
  is_part_of_larger_schedule?: boolean;
  larger_schedule_note?: string;
  curator?: Curator;
  music_upload?: { release_title?: string; track_title?: string; album_art_url?: string; primary_artist?: string };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CreatePitchPayload {
  music_upload_id: number;
  curator_id?: number | null;
  release_story: string;
  is_part_of_larger_schedule: boolean;
  larger_schedule_note?: string;
  similar_artists: string[];
  track_moods: string[];
  track_attributes: string[];
  track_style: string[];
  has_press: boolean;
  has_shows: boolean;
  has_visual_assets: boolean;
  visual_assets_url?: string;
  has_ad_campaign: boolean;
  has_radio_campaign: boolean;
  has_physical_product: boolean;
  has_other_press: boolean;
}


/**
 * A release the artist can pitch right now — its release date is 3 to 4 weeks away and it
 * has not already been pitched. The backend decides this with the same rule it enforces on
 * creation, so anything listed here will be accepted.
 */
export interface EligibleRelease {
  id: number;
  title: string;
  artist: string | null;
  artwork: string | null;
  upload_type: string;
  track_count: number;
  release_date: string;
  days_until: number;
  /** Set when a half-finished pitch already exists for this release. */
  draft_pitch_id: number | null;
}

export async function getEligibleReleases() {
  return request<EligibleRelease[]>("/v1/pitches/eligible-releases", { method: "GET" }, true);
}

export async function getCurators(musicUploadId?: number) {
  const qs = musicUploadId ? `?music_upload_id=${musicUploadId}` : "";
  return request<Curator[]>(`/v1/pitches/curators${qs}`, { method: "GET" }, true);
}


export async function checkEligibility(musicUploadId: number) {
  return request<{ eligible: boolean; reason?: string }>(
    "/v1/pitches/check-eligibility",
    { method: "POST", body: JSON.stringify({ music_upload_id: musicUploadId }) },
    true
  );
}

export async function getPitches(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return request<Pitch[]>(`/v1/pitches${qs}`, { method: "GET" }, true);
}

export async function getPitch(id: number) {
  return request<Pitch>(`/v1/pitches/${id}`, { method: "GET" }, true);
}

export async function createPitch(payload: CreatePitchPayload) {
  return request<Pitch>(
    "/v1/pitches",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function updatePitch(id: number, payload: Partial<CreatePitchPayload>) {
  return request<Pitch>(
    `/v1/pitches/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    true
  );
}


export async function submitPitch(id: number, payload: {
  release_story: string;
  similar_artists: string[];
  track_moods: string[];
}) {
  return request<Pitch>(
    `/v1/pitches/${id}/submit`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}