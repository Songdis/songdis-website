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
