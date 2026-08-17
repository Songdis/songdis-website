import { request } from "./core";

export interface Spotlight {
  id: number;
  headline: string;
  subtitle: string | null;
  image_url: string;
  article_url: string;
  /** Admin-set button text. Null keeps the dashboard's own default wording. */
  cta_label: string | null;
}

export async function getSpotlight() {
  return request<Spotlight | null>("/v2/spotlight", { method: "GET" }, true);
}

/**
 * Every published spotlight, newest first, for the dashboard carousel.
 *
 * Its own endpoint rather than an extra key on /v2/spotlight: the shared API
 * client only forwards `data`, so a second key would be dropped silently.
 */
export async function getSpotlights() {
  return request<Spotlight[]>("/v2/spotlights", { method: "GET" }, true);
}
