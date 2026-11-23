import { request, type ApiResponse } from "./core";

/**
 * Identity for the in-app support widget.
 *
 * `configured` is false when support is not set up on this environment. The widget treats
 * that as "no support button" rather than an error — support is a convenience and must never
 * be able to break the dashboard.
 *
 * `token` can be null even when configured: the widget still loads and someone can still
 * raise a ticket, they just are not recognised automatically.
 */
export interface SupportIdentity {
  /** "eusate" when the Eusate chat is set up; otherwise the Zoho Desk fields below apply. */
  provider?: "eusate";
  api_key?: string;
  sdk_url?: string;
  environment?: string;
  configured: boolean;
  token: string | null;
  /**
   * The help-desk script, served by the API rather than read from a NEXT_PUBLIC_ variable.
   * Those are inlined at build time, so changing one would mean a frontend rebuild instead
   * of an environment change.
   */
  script_url: string | null;
  context: Record<string, string | number | boolean | null>;
}

export async function getSupportIdentity(): Promise<ApiResponse<SupportIdentity>> {
  return request<SupportIdentity>("/support/identity", { method: "GET" }, true);
}

/** The chat for visitors who are not signed in (public site). */
export async function getPublicSupportWidget(): Promise<ApiResponse<SupportIdentity>> {
  return request<SupportIdentity>("/support/widget", { method: "GET" }, false);
}
