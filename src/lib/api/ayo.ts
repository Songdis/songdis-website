import { request, BASE_URL, getToken, forceLogout } from "./core";

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
  /**
   * True when the model ran out of room and the reply stops mid-sentence.
   *
   * Sent so a severed answer can be told apart from a finished one - without it a half
   * sentence arrives looking exactly like a complete reply.
   */
  truncated?: boolean;
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


/** Send a chat message to Ayo (DeepSeek via backend) */
export async function chat(messages: ChatMessage[]) {
  return request<ChatResponse>(
    "/ayo/chat",
    { method: "POST", body: JSON.stringify({ messages }) },
    true
  );
}

/**
 * Stream a chat reply, calling onDelta with each fragment as it arrives.
 *
 * Ayo's answers run to a couple of thousand tokens, which the model writes at about 170 a
 * second. Awaiting the whole thing (chat(), above) means ten to fifteen seconds of nothing
 * followed by a wall of text; streamed, the first words land in about a second.
 *
 * SSE over POST rather than EventSource, because the request carries the conversation in its
 * body and the bearer token in a header, and EventSource can do neither.
 *
 * Resolves to the same shape as chat() so the caller can treat a finished stream the same
 * way, with `error` set when the answer ended badly — possibly after some text arrived.
 */
export async function chatStream(
  messages: ChatMessage[],
  onDelta: (delta: string) => void,
  signal?: AbortSignal
): Promise<{ reply: string; truncated: boolean; error: string | null }> {
  const token = getToken();
  let reply = "";

  try {
    const res = await fetch(`${BASE_URL}/ayo/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (res.status === 401) {
      forceLogout();
      return { reply, truncated: false, error: "Session expired" };
    }

    if (!res.ok || !res.body) {
      return { reply, truncated: false, error: "Ayo is having trouble responding." };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let truncated = false;
    let failed: string | null = null;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Frames are separated by a blank line, and a chunk can split one in half, so only
      // whole frames are taken and the remainder waits for the next read.
      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        const frame = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);

        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;

          const raw = line.slice(5).trim();
          if (raw === "") continue;

          try {
            const event = JSON.parse(raw) as {
              delta?: string;
              done?: boolean;
              truncated?: boolean;
              error?: string;
            };

            if (event.delta) {
              reply += event.delta;
              onDelta(event.delta);
            }
            if (event.truncated) truncated = true;
            if (event.error) failed = event.error;
          } catch {
            // A frame we can't parse is not worth abandoning the answer over.
          }
        }

        split = buffer.indexOf("\n\n");
      }
    }

    return { reply, truncated, error: failed };
  } catch (e) {
    // An abort is the user's own doing, so whatever arrived is kept and nothing is reported.
    if (e instanceof DOMException && e.name === "AbortError") {
      return { reply, truncated: false, error: null };
    }

    return { reply, truncated: false, error: "Network error. Please check your connection." };
  }
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
