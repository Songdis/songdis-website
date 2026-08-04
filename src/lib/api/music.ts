import { request, BASE_URL } from "./core";


export type ReleaseStatus =
  | "live"
  | "pending"
  | "delivered"
  | "distributed"
  | "need_documentation"
  | "draft"
  | "takedown"
  | "rejected";

export type ReleaseType = "single" | "album_ep";

export interface ReleaseContributor {
  name: string;
  role: string;
  type: "producer" | "writer" | "performer" | string;
}

export interface ReleaseTrack {
  id?: number;
  track_title?: string;
  isrc_code?: string;
  metadata?: string;         
  contributors?: string;     
  audio_url?: string;
  audio_file_path?: string[]; 
  explicit_content?: boolean;
  [key: string]: unknown;
}

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
  platforms?: string;          
  created_at: string;
  upc_code?: string;
  label?: string;
  metadata_language?: string;
  c_line?: string;
  p_line?: string;
  tracks?: ReleaseTrack[];
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


export async function getMusic(params: MusicListParams = {}) {
  const query = new URLSearchParams();
  if (params.filter) query.set("filter", params.filter);
  if (params.page)   query.set("page", String(params.page));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<Release[]>(`/music${qs}`, { method: "GET" }, true);
}

export async function getSingleRelease(uploadId: number) {
  return request<Release>(`/music/${uploadId}`, { method: "GET" }, true);
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


export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("songdis_token");
}

/**
 * Send undersized artwork to be cropped and scaled to 3000x3000.
 *
 * Used when an upload is rejected for being too small: the file never reached
 * S3, so the server has to do the whole job from the file itself.
 */
export function fitArtworkToSpec(
  file: File
): Promise<{ file_url: string; s3_key: string; was_cropped: boolean; upscale_factor: number }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("artwork", file);

    const xhr = new XMLHttpRequest();

    xhr.addEventListener("load", () => {
      let json: Record<string, unknown> = {};
      try { json = JSON.parse(xhr.responseText); } catch { /* handled below */ }

      if (xhr.status >= 200 && xhr.status < 300) {
        const d = (json.data ?? json) as Record<string, unknown>;
        resolve({
          file_url: (d.file_url ?? d.url ?? "") as string,
          s3_key: (d.s3_key ?? d.file_path ?? "") as string,
          was_cropped: Boolean(d.was_cropped),
          upscale_factor: Number(d.upscale_factor ?? 1),
        });
      } else {
        reject(new Error((json.message as string) || `Could not resize artwork (${xhr.status})`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error while resizing artwork")));
    xhr.addEventListener("timeout", () => reject(new Error("Resizing timed out")));
    xhr.timeout = 5 * 60 * 1000;

    xhr.open("POST", `${BASE_URL}/upload/artwork-fit`);
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  });
}

export function uploadArtwork(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<{ file_url: string; s3_key: string; sizes?: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("artwork", file);
    form.append("generate_sizes", "true");

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) });
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          const d = json.data ?? json;
          resolve({ file_url: d.file_url ?? d.url ?? "", s3_key: d.s3_key ?? d.file_path ?? "", sizes: d.sizes });
        } catch { reject(new Error("Invalid artwork upload response")); }
      } else {
        try { const e = JSON.parse(xhr.responseText); reject(new Error(e.message || `Artwork upload failed (${xhr.status})`)); }
        catch { reject(new Error(`Artwork upload failed (${xhr.status})`)); }
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during artwork upload")));
    xhr.addEventListener("timeout", () => reject(new Error("Artwork upload timed out")));
    xhr.timeout = 5 * 60 * 1000;
    xhr.open("POST", `${BASE_URL}/upload/artwork`);
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  });
}

function uploadAudioSingle(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<{ file_url: string; s3_key: string; s3_bucket: string; metadata?: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("audio_file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) });
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          const d = json.data ?? json;
          resolve({
            file_url: d.file_url ?? d.url ?? "",
            s3_key: d.s3_key ?? d.file_path ?? "",
            s3_bucket: d.s3_bucket ?? d.bucket ?? "songdis-file",
            metadata: d.metadata,
          });
        } catch { reject(new Error("Invalid audio upload response")); }
      } else {
        try { const e = JSON.parse(xhr.responseText); reject(new Error(e.message || `Audio upload failed (${xhr.status})`)); }
        catch { reject(new Error(`Audio upload failed (${xhr.status})`)); }
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during audio upload")));
    xhr.addEventListener("timeout", () => reject(new Error("Audio upload timed out")));
    xhr.timeout = 10 * 60 * 1000;
    xhr.open("POST", `${BASE_URL}/upload/audio`);
    const token = getAuthToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  });
}

async function uploadAudioChunked(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<{ file_url: string; s3_key: string; s3_bucket: string; metadata?: Record<string, unknown> }> {
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let uploadedBytes = 0;

  for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
    const start = chunkNumber * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const form = new FormData();
    form.append("chunk", chunk);
    form.append("chunk_number", chunkNumber.toString());
    form.append("total_chunks", totalChunks.toString());
    form.append("upload_id", uploadId);
    form.append("file_name", file.name);
    form.append("file_type", file.type);

    const token = getAuthToken();
    const res = await fetch(`${BASE_URL}/upload/chunk`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Chunk ${chunkNumber} upload failed`);
    }

    const result = await res.json();
    uploadedBytes += chunk.size;
    if (onProgress) {
      onProgress({ loaded: uploadedBytes, total: file.size, percentage: Math.round((uploadedBytes / file.size) * 100) });
    }

    if (result.data?.upload_complete) {
      const d = result.data;
      return {
        file_url: d.file_url ?? d.url ?? "",
        s3_key: d.s3_key ?? d.file_path ?? "",
        s3_bucket: d.s3_bucket ?? d.bucket ?? "songdis-file",
        metadata: d.metadata,
      };
    }
  }

  throw new Error("Chunked upload completed but no final result received");
}

export async function uploadAudio(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<{ file_url: string; s3_key: string; s3_bucket: string; metadata?: Record<string, unknown> }> {
  const LARGE_THRESHOLD = 50 * 1024 * 1024;
  if (file.size > LARGE_THRESHOLD) {
    return uploadAudioChunked(file, onProgress);
  }
  return uploadAudioSingle(file, onProgress);
}


export async function uploadMusic(payload: UploadSinglePayload | Record<string, unknown>) {
  return request<{ message: string; id?: number }>(
    "/upload-music",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}


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

/**
 * Delete a draft.
 *
 * Guards against a non-numeric id: an undefined value stringifies into the
 * URL as "undefined", which reached Postgres as a bigint and raised a type
 * error rather than a clean 404.
 */
export async function deleteDraft(id: number) {
  if (!Number.isFinite(id)) {
    return { data: null, message: null, error: "Could not identify that draft.", errors: null, status: 400 };
  }

  return request<{ message: string }>(
    `/drafts/${id}`,
    { method: "DELETE" },
    true
  );
}


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

export interface LabelPermission {
  can_edit_label: boolean;
  plan_name: string;
}

export async function getLabelPermission() {
  return request<LabelPermission>(
    "/label/permission",
    { method: "GET" },
    true
  );
}



export interface Migration {
  id: number;
  status: string;
  upload_type: string;
  created_at: string;
  music_upload?: {
    id: number;
    release_title: string;
    primary_artist: string;
    album_art_url?: string;
    status: string;
  };
  draft?: {
    id: number;
    upload_type: string;
    form_data: unknown;
  };
}

export interface SpotifyArtist {
  spotify_id: string;
  name: string;
  image_url?: string;
  followers: number;
  genres: string[];
}

export interface SpotifyRelease {
  id: string;
  name: string;
  type: string;
  release_date: string;
  total_tracks: number;
  image_url?: string;
}

export interface SpotifyTrack {
  track_title: string;
  track_number: number;
  isrc_code?: string;
  duration?: string;
  explicit_content?: boolean;
  audio_file_path?: string;
  s3_key?: string;
}

export interface ReleaseDetail {
  upload_type: string;
  release_title: string;
  primary_artist: string;
  release_date?: string;
  upc_code?: string;
  album_art_url?: string;
  isrc_code?: string;
  total_tracks?: number;
  tracks?: SpotifyTrack[];
  spotify_album_id?: string;
  spotify_metadata?: unknown;
  metadata_source?: unknown;
}

export async function fetchMigrations() {
  return request<Migration[]>("/migration", { method: "GET" }, true);
}

export async function searchMigrationArtists(query: string) {
  return request<SpotifyArtist[]>(
    `/migration/search-artist?q=${encodeURIComponent(query)}`,
    { method: "GET" },
    true
  );
}

export async function fetchArtistReleases(spotifyId: string) {
  return request<{ releases: SpotifyRelease[] }>(
    `/migration/artist-releases/${spotifyId}`,
    { method: "GET" },
    true
  );
}

export async function previewRelease(spotifyId: string) {
  return request<ReleaseDetail>(
    `/migration/preview-release/${spotifyId}`,
    { method: "GET" },
    true
  );
}

export async function identifyTrack(audioUrl: string) {
  return request<{ found: boolean; isrc?: string }>(
    "/migration/identify-track",
    { method: "POST", body: JSON.stringify({ audio_url: audioUrl }) },
    true
  );
}

export async function initiateMigration(payload: {
  releases: {
    spotify_album_id: string;
    upload_type: string;
    release_title: string;
    primary_artist: string;
    release_date?: string;
    upc_code?: string;
    album_art_url?: string;
    isrc_code?: string;
    spotify_metadata?: unknown;
    metadata_source?: unknown;
    label: string;
    c_line: string;
    p_line: string;
    cover_art_ai_use: string;
    stereo_ai_use: string;
    primary_genre: string;
    secondary_genre: string;
    metadata_language: string;
    territory_rights: string;
    platforms: string[];
    audio_file_path?: string;
    s3_key?: string;
    featured_artists?: { name: string; spotify_id?: string }[];
    collaborators?: { id: string; name: string; role: string; type: string }[];
    tracks?: {
      track_title: string;
      isrc_code?: string;
      audio_file_path?: string;
      s3_key?: string;
      explicit_content?: boolean;
      duration?: string;
      track_number: number;
      featured_artists?: { name: string; spotify_id?: string }[];
      collaborators?: { id: string; name: string; role: string; type: string }[];
    }[];
  }[];
}) {
  return request<{ message: string }>(
    "/migration/initiate",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}



export interface VideoStats {
  total_videos: number;
  in_review: number;
  live: number;
  total_plays: number;
}

export interface VideoRecord {
  id: number;
  video_title: string;
  video_type: string;
  plan: string;
  status: string;
  release_date: string;
  thumbnail_url?: string;
  platforms: string[];
  total_plays: number;
  release_title?: string;
  release_artist?: string;
  created_at: string;
}

export async function fetchVideos() {
  return request<{ stats: VideoStats; videos: VideoRecord[] }>(
    "/videos",
    { method: "GET" },
    true
  );
}

export async function submitVideo(formData: FormData) {
  return request<{ payment_url?: string; payment_reference?: string }>(
    "/videos",
    { method: "POST", body: formData },
    true
  );
}