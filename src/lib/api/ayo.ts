import { AYO_BASE_URL, getToken } from "./core";
import type { ApiResponse } from "./core";

/* ─── Ayo-specific request helper ─────────────────────────────── */
async function ayoRequest<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${AYO_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return { data: null, message: "Success", error: null, status: 204 };
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage =
        json?.message ?? json?.error ?? "Something went wrong.";
      return { data: null, message: null, error: String(errorMessage), status: res.status };
    }

    return {
      data: json?.data ?? json,
      message: json?.message ?? null,
      error: null,
      status: res.status,
    };
  } catch {
    return {
      data: null,
      message: null,
      error: "Network error. Please check your connection.",
      status: 0,
    };
  }
}

/* ─── Types ───────────────────────────────────────────────────── */
export interface BioPayload {
  artist_name: string;
  genre: string;
  popular_work: string;
  uniqueness: string;
}

export interface BioResponse {
  bio?: string;
  short_bio?: string;
  long_bio?: string;
  [key: string]: unknown;
}

export interface ArtSuggestionsPayload {
  themes: string;
  imagery: string;
}

export interface ArtSuggestionsResponse {
  suggestions?: string[];
  prompts?: string[];
  [key: string]: unknown;
}

export interface ArtGeneratePayload {
  prompt: string;
}

export interface ArtGenerateResponse {
  job_id?: string;
  jobId?: string;
  image_url?: string;
  s3_key?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ArtStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl?: string;
  image_url?: string;
  s3_key?: string;
  progress?: number;
  [key: string]: unknown;
}

export interface AyoAccessResponse {
  has_access: boolean;
  [key: string]: unknown;
}

/* ─── API functions ───────────────────────────────────────────── */

export async function generateBio(payload: BioPayload) {
  return ayoRequest<BioResponse>(
    "/bio/generate",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function getArtSuggestions(payload: ArtSuggestionsPayload) {
  return ayoRequest<ArtSuggestionsResponse>(
    "/art/suggestions",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function generateArt(payload: ArtGeneratePayload) {
  return ayoRequest<ArtGenerateResponse>(
    "/art/generate",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function getArtStatus(jobId: string) {
  return ayoRequest<ArtStatusResponse>(`/art/status/${jobId}`, { method: "GET" });
}

export async function checkAyoAccess() {
  // This one hits the main API, not the Ayo service
  const { request } = await import("./core");
  return request<AyoAccessResponse>("/ai-access/check", { method: "GET" }, true);
}