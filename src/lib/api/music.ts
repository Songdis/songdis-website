/**
 * lib/api/music.ts
 *
 * Endpoint mapping (from Postman collection):
 *   GET  /music                          — list releases (filter, page)
 *   GET  /albums-ep                      — albums/EPs only
 *   GET  /albums/{title}/tracks          — tracks for a specific album
 *   POST /upload/artwork                 — upload artwork to S3
 *   POST /upload/audio                   — upload audio to S3
 *   POST /upload-music                   — submit single or album release
 *   POST /drafts/save                    — create or update draft
 *   GET  /drafts                         — all drafts
 *   GET  /drafts/{id}                    — single draft
 *   DELETE /drafts/{id}                  — delete draft
 *   POST /request/music/{id}/edit        — request edit
 *   POST /request/music/{id}/takedown    — request takedown
 *   GET  /request/music                  — all requests
 *   GET  /request/music/{id}             — single request
 *   DELETE /request/music/{id}           — cancel request
 */

import { request } from "./core";

/* ─── Types ───────────────────────────────────────────────────── */

export type ReleaseStatus =
  | "live"
  | "pending"
  | "delivered"
  | "distributed"
  | "need_documentation"
  | "draft";

export type ReleaseType = "single" | "album_ep";

export interface Release {
  id: number;
  upload_type: string;
  release_title: string;
  track_title?: string;
  primary_artist: string;
  album_art_url: string;
  status: string;
  release_date?: string;
  primary_genre?: string;
  platforms?: string[];
  created_at: string;
}

export interface Draft {
  id: number;
  upload_type: string;
  current_step: number;
  form_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EditRequest {
  id: number;
  music_upload_id: number;
  status: string;
  reason: string;
  requested_changes: Array<{
    field: string;
    current_value: string;
    new_value: string;
  }>;
  created_at: string;
}

export interface MusicListParams {
  filter?: "single" | "album_ep";
  page?: number;
}

export interface UploadSinglePayload {
  upload_type: "Single";
  release_title: string;
  track_title: string;
  metadata_language: string;
  primary_artist: string;
  primary_artist_id?: string | null;
  composer?: string;
  audio_file_path: string;
  s3_key: string;
  s3_bucket: string;
  album_art_url: string;
  album_art_key: string;
  cover_art_ai_use?: string;
  label?: string;
  catalog_number?: string;
  c_line?: string;
  p_line?: string;
  explicit_content?: boolean;
  primary_genre?: string;
  secondary_genre?: string;
  genre?: string;
  subgenre?: string;
  recorded_year?: string;
  isrc?: string | null;
  stereo_ai_use?: string;
  release_date?: string;
  pre_order_date?: string | null;
  is_previously_released?: boolean;
  platforms?: string[];
  territory_rights?: string;
  upc_code?: string | null;
  lyrics?: string;
  lyrics_language?: string;
  duration?: string;
  social_media_timestamp?: number;
  single_track_contributors?: string | null;
  single_track_additional_artists?: string | null;
}

export interface DraftPayload {
  draft_id?: number;
  upload_type: string;
  current_step: number;
  form_data: Record<string, unknown>;
}

export interface EditRequestPayload {
  reason: string;
  requested_changes: Array<{
    field: string;
    current_value: string;
    new_value: string;
  }>;
}

export interface TakedownPayload {
  reason: string;
}

/* ─── Music list ──────────────────────────────────────────────── */

export async function getMusic(params: MusicListParams = {}) {
  const query = new URLSearchParams();
  if (params.filter) query.set("filter", params.filter);
  if (params.page)   query.set("page", String(params.page));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<Release[]>(`/music${qs}`, { method: "GET" }, true);
}

export async function getAlbumsEp() {
  return request<Release[]>("/albums-ep", { method: "GET" }, true);
}

export async function getAlbumTracks(title: string) {
  return request<Release[]>(
    `/albums/${encodeURIComponent(title)}/tracks`,
    { method: "GET" },
    true
  );
}

/* ─── File uploads ────────────────────────────────────────────── */

export async function uploadArtwork(file: File) {
  const form = new FormData();
  form.append("artwork", file);
  form.append("generate_sizes", "true");
  return request<{
    url: string;
    key: string;
    sizes?: Record<string, unknown>;
  }>("/upload/artwork", { method: "POST", body: form }, true);
}

export async function uploadAudio(file: File, sessionId?: string) {
  const form = new FormData();
  form.append("audio_file", file);
  if (sessionId) form.append("upload_session_id", sessionId);
  return request<{
    url: string;
    key: string;
    bucket: string;
    duration?: string;
  }>("/upload/audio", { method: "POST", body: form }, true);
}

/* ─── Release submission ──────────────────────────────────────── */

export async function uploadMusic(payload: UploadSinglePayload | Record<string, unknown>) {
  return request<{ message: string; id?: number }>(
    "/upload-music",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/* ─── Drafts ──────────────────────────────────────────────────── */

export async function saveDraft(payload: DraftPayload) {
  return request<Draft>(
    "/drafts/save",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getDrafts() {
  return request<Draft[]>("/drafts", { method: "GET" }, true);
}

export async function getDraft(id: number) {
  return request<Draft>(`/drafts/${id}`, { method: "GET" }, true);
}

export async function deleteDraft(id: number) {
  return request<{ message: string }>(
    `/drafts/${id}`,
    { method: "DELETE" },
    true
  );
}

/* ─── Edit / Takedown requests ────────────────────────────────── */

export async function requestEdit(musicUploadId: number, payload: EditRequestPayload) {
  return request<{ message: string }>(
    `/request/music/${musicUploadId}/edit`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function requestTakedown(musicUploadId: number, payload: TakedownPayload) {
  return request<{ message: string }>(
    `/request/music/${musicUploadId}/takedown`,
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

export async function getMusicRequests() {
  return request<EditRequest[]>("/request/music", { method: "GET" }, true);
}

export async function getMusicRequest(id: number) {
  return request<EditRequest>(`/request/music/${id}`, { method: "GET" }, true);
}

export async function cancelMusicRequest(id: number) {
  return request<{ message: string }>(
    `/request/music/${id}`,
    { method: "DELETE" },
    true
  );
}