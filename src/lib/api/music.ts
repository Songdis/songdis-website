import { request, BASE_URL } from "./core";


export type ReleaseStatus =
  | "live"
  | "pending"
  | "delivered"
  | "distributed"
  | "need_documentation"
  | "draft"
  | "takedown"
  | "rejected"
  | "under_review"
  | "approved";

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
  /**
   * Server-assigned identifier for the submission this row belongs to. An Album/EP is one
   * row per track, and two submissions of the same album share title, artist, date and UPC,
   * so this is the only thing that separates them. Group on it; never on the title.
   */
  submission_key?: string;
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
  /** Rows per page. The API defaults to 15 and caps this at 100. */
  per_page?: number;
  /**
   * Narrow the catalogue to one artist profile. Omit for the pooled view — every artist
   * on the account, which is what a solo artist always sees and what a label sees until
   * it picks someone.
   */
  artist_profile_id?: number | null;
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
  idempotency_key?: string;  // Prevents duplicate submissions on retry
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
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.artist_profile_id) query.set("artist_profile_id", String(params.artist_profile_id));
  const qs = query.toString() ? `?${query.toString()}` : "";
  return request<Release[]>(`/music${qs}`, { method: "GET" }, true);
}

/**
 * Every release on the account, not just the first page.
 *
 * `/music` is paginated and defaults to 15 rows. Anything that needs the whole catalogue —
 * a picker, for instance — has to walk the pages: the video form called getMusic() once and
 * offered the artist only their fifteen newest releases, so an older one could not be
 * chosen at all.
 *
 * Pages are fetched in order and stop at the paginator's own last_page, with a hard ceiling
 * so a bad `total` can never turn this into an unbounded loop. Returns what it managed to
 * collect, plus whether anything was left behind.
 */
export async function getAllMusic(
  params: Omit<MusicListParams, "page" | "per_page"> = {},
  maxPages = 25
): Promise<{ releases: Release[]; complete: boolean; error: string | null }> {
  const PER_PAGE = 100;
  const releases: Release[] = [];

  // The listing answers { count, data: <paginator> }, and request() unwraps the outer
  // `data` — so what arrives here is either the paginator or a plain array.
  const readPage = (payload: unknown): { rows: Release[]; lastPage: number } => {
    if (Array.isArray(payload)) return { rows: payload as Release[], lastPage: 1 };

    const page = (payload ?? {}) as { data?: unknown; last_page?: number };
    const rows = Array.isArray(page.data) ? (page.data as Release[]) : [];

    return { rows, lastPage: Number(page.last_page ?? 1) || 1 };
  };

  let lastPage = 1;

  for (let page = 1; page <= Math.min(lastPage, maxPages); page++) {
    const res = await getMusic({ ...params, page, per_page: PER_PAGE });

    if (res.error) {
      // Whatever arrived is still worth showing; the caller is told it is partial.
      return { releases, complete: false, error: res.error };
    }

    const { rows, lastPage: total } = readPage(res.data);
    releases.push(...rows);
    lastPage = total;

    if (rows.length === 0) break;
  }

  return { releases, complete: lastPage <= maxPages, error: null };
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
  /** "uploading" while bytes are moving; "processing" once they have all arrived and the file is being checked. */
  phase?: "uploading" | "processing";
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("songdis_token");
}

/* -- Direct-to-S3 uploads ---------------------------------------------------
 * The browser asks the API for a presigned PUT URL, uploads the file to object
 * storage (Contabo, S3-compatible) itself,
 * then asks the API to check what landed. The file crosses the network once,
 * and the progress bar measures the whole upload instead of only the first leg.
 *
 * If the direct route is not there (API not deployed yet, or the bucket's CORS
 * does not allow this site) the old through-the-server upload is used instead,
 * so an upload never fails just because of the route it took.
 */

class DirectUploadUnavailable extends Error {}

type DirectKind = "audio" | "artwork";

async function postJson(path: string, body: Record<string, unknown>) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { res, json: json as Record<string, unknown> };
}

function errorMessage(json: Record<string, unknown>, fallback: string): string {
  if (typeof json.message === "string" && json.message) return json.message;
  const errors = json.errors as Record<string, string[]> | undefined;
  const first = errors && Object.values(errors)[0]?.[0];
  return first || fallback;
}

function putToStorage(
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100), phase: "uploading" });
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new DirectUploadUnavailable(`Storage refused the upload (${xhr.status})`));
    });
    // A CORS refusal shows up as a plain network error; treat it as "route unavailable".
    xhr.addEventListener("error", () => reject(new DirectUploadUnavailable("Network error uploading to storage")));
    xhr.addEventListener("timeout", () => reject(new Error("Upload timed out")));
    xhr.timeout = 30 * 60 * 1000;
    xhr.open("PUT", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.send(file);
  });
}

async function uploadDirect(
  kind: DirectKind,
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<Record<string, unknown>> {
  let start;
  try {
    start = await postJson("/upload/direct/start", {
      kind,
      file_name: file.name,
      content_type: file.type,
      size: file.size,
    });
  } catch {
    throw new DirectUploadUnavailable("Could not reach the upload service");
  }
  if (start.res.status === 404 || start.res.status === 405 || start.res.status >= 500) {
    throw new DirectUploadUnavailable(`Direct upload unavailable (${start.res.status})`);
  }
  if (!start.res.ok) throw new Error(errorMessage(start.json, `Upload failed (${start.res.status})`));

  const s = start.json.data as { url: string; headers?: Record<string, string>; key: string };
  await putToStorage(s.url, s.headers ?? {}, file, onProgress);

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, phase: "processing" });

  const done = await postJson("/upload/direct/complete", { key: s.key });
  if (!done.res.ok) throw new Error(errorMessage(done.json, `Upload failed (${done.res.status})`));
  return (done.json.data ?? {}) as Record<string, unknown>;
}

/** Runs `fn` over `items`, at most `limit` at a time; results keep the input order. */
export async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
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

type ArtworkResult = { file_url: string; s3_key: string; sizes?: Record<string, unknown> };

/** `file` must already be a JPEG; ReleaseDetails converts PNG covers before calling this. */
export async function uploadArtwork(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<ArtworkResult> {
  try {
    const d = await uploadDirect("artwork", file, onProgress);
    return { file_url: (d.file_url ?? d.url ?? "") as string, s3_key: (d.s3_key ?? d.file_path ?? "") as string };
  } catch (err) {
    if (!(err instanceof DirectUploadUnavailable)) throw err;
    console.warn("Direct artwork upload unavailable, using server upload:", err.message);
    return uploadArtworkViaServer(file, onProgress);
  }
}

function uploadArtworkViaServer(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<ArtworkResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("artwork", file);
    // Thumbnails were never used and were most of this endpoint's wait.
    form.append("generate_sizes", "false");

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100), phase: e.loaded >= e.total ? "processing" : "uploading" });
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
        onProgress({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100), phase: e.loaded >= e.total ? "processing" : "uploading" });
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
  try {
    const d = await uploadDirect("audio", file, onProgress);
    return {
      file_url: (d.file_url ?? d.url ?? "") as string,
      s3_key: (d.s3_key ?? d.file_path ?? "") as string,
      s3_bucket: (d.s3_bucket ?? d.bucket ?? "songdis-file") as string,
      metadata: d.metadata as Record<string, unknown> | undefined,
    };
  } catch (err) {
    if (!(err instanceof DirectUploadUnavailable)) throw err;
    console.warn("Direct audio upload unavailable, using server upload:", err.message);
  }

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
  /**
   * 'paid' | 'unpaid' | 'failed'.
   *
   * Unpaid rows are returned now. They used to be filtered out server-side, which meant a
   * submission whose payment never completed vanished after the app said it succeeded.
   */
  payment_status?: string;
  /** Needed to re-check a payment whose webhook never arrived. */
  payment_reference?: string | null;
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