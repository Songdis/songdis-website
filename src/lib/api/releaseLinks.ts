import { request } from "./core";


export interface ReleaseLink {
  smart_link: string;
  resolution_status: "RESOLVED" | "PENDING" | "FAILED";
  resolved_platforms: string[];
}

export async function getReleaseLinks() {
  return request<Record<string, ReleaseLink>>(
    "/v2/releases/links",
    { method: "GET" },
    true
  );
}

export async function getReleaseLink(releaseId: number) {
  return request<ReleaseLink | null>(
    `/v2/releases/${releaseId}/link`,
    { method: "GET" },
    true
  );
}

/** Removes the link. It can be rebuilt with createReleaseLink(). */
export async function deleteReleaseLink(releaseId: number) {
  return request<{ message?: string }>(
    `/v2/releases/${releaseId}/link`,
    { method: "DELETE" },
    true
  );
}

/**
 * Rebuilds the link after a delete.
 *
 * Queued server-side, so a 202 means "on its way", not "here it is" — the
 * caller re-fetches a moment later.
 */
export async function createReleaseLink(releaseId: number) {
  return request<ReleaseLink | { message?: string }>(
    `/v2/releases/${releaseId}/link`,
    { method: "POST" },
    true
  );
}
