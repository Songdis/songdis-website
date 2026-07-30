import { request } from "./core";

export interface Spotlight {
  id: number;
  headline: string;
  subtitle: string | null;
  image_url: string;
  article_url: string;
}

export async function getSpotlight() {
  return request<Spotlight | null>("/v2/spotlight", { method: "GET" }, true);
}
