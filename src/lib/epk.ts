/**
 * getepk.si — the public press kit product, served by this same app on its own domain.
 *
 * src/proxy.ts maps the domain onto routes: `/` and the account pages to `/epk/*`, and
 * every other single path segment (`getepk.si/r33nzo`) to the kit at `/k/<slug>`.
 */

export const EPK_DOMAIN = (process.env.NEXT_PUBLIC_EPK_DOMAIN ?? "getepk.si").trim().toLowerCase();

export const EPK_ORIGIN = `https://${EPK_DOMAIN}`;

/** A request host, normalised: first forwarded value, no port, no trailing dot. */
export function cleanHost(raw: string | null | undefined): string {
  return (raw ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function isEpkHost(host: string | null | undefined): boolean {
  const h = cleanHost(host);
  return h === EPK_DOMAIN || h === `www.${EPK_DOMAIN}`;
}

/** True in the browser when the page is being viewed on getepk.si. */
export function onEpk(): boolean {
  return typeof window !== "undefined" && isEpkHost(window.location.hostname);
}

/** getepk.si paths that are pages, not artist slugs. Mirrored in the backend's reserved slugs. */
export const EPK_PAGES = new Set([
  "sign-in",
  "sign-up",
  "verify",
  "callback",
  "app",
  "privacy",
  "terms",
]);
