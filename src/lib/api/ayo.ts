import { request } from "./core";

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

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  usage?: Record<string, unknown>;
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

export interface AyoAccessResponse {
  has_access: boolean;
  [key: string]: unknown;
}

/* ─── API functions ───────────────────────────────────────────── */

/** Send a chat message to Ayo (DeepSeek via backend) */
export async function chat(messages: ChatMessage[]) {
  return request<ChatResponse>(
    "/ayo/chat",
    { method: "POST", body: JSON.stringify({ messages }) },
    true
  );
}

/** Generate an artist bio */
export async function generateBio(payload: BioPayload) {
  return request<BioResponse>(
    "/ayo/bio/generate",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** Save generated bio to the user's profile */
export async function saveBio(bio: string) {
  return request<{ bio: string }>(
    "/ayo/bio/save",
    { method: "POST", body: JSON.stringify({ bio }) },
    true
  );
}

/** Get artwork prompt suggestions */
export async function getArtSuggestions(payload: ArtSuggestionsPayload) {
  return request<ArtSuggestionsResponse>(
    "/ayo/artwork/suggestions",
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
}

/** Check if the user has Ayo AI access */
export async function checkAyoAccess() {
  return request<AyoAccessResponse>("/ai-access/check", { method: "GET" }, true);
}
