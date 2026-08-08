/**
 * Vanity press-kit subdomains: `<slug>.songdis.com/*` → `/k/<slug>/*`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE RUNS ON EVERY REQUEST IN THE APP. Read the matching rules before
 * changing anything here — a mistake takes down /dashboard, not just press kits.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The safety property that matters most: **without `PRESS_KIT_BASE_DOMAIN` set,
 * this middleware is a no-op.** It returns on the first line, so `localhost:3000`,
 * every Vercel preview URL (`*.vercel.app`), and any other host behave exactly as
 * they did before this file existed. The variable is deliberately NOT `NEXT_PUBLIC_`:
 * it is only ever read on the server, and keeping it private means a stray client
 * bundle can't come to depend on it.
 *
 *   PRESS_KIT_BASE_DOMAIN=songdis.com     # production, once DNS + wildcard cert exist
 *   (unset)                                # everywhere else — no rewriting at all
 *
 * The matching logic, in order. Every step FALLS THROUGH to the normal app; the
 * rewrite only happens when all of them pass:
 *
 *  1. No base domain configured               → app as normal.
 *  2. Host is the apex (`songdis.com`)        → app as normal. The canonical
 *     `songdis.com/k/<slug>` URL must keep working, and the apex serves the whole
 *     product.
 *  3. Host is not `<something>.<base>`        → app as normal. Covers localhost,
 *     preview deploys, custom domains and any staging host.
 *  4. The label contains a dot                → app as normal. Only a single level
 *     (`r33nzo.songdis.com`), never `preview.staging.songdis.com`.
 *  5. The label is reserved (`www`, `api`,
 *     `dashboard`, `admin`, …)                → app as normal. Same list the backend
 *     refuses at slug-generation time (PK3), so a reserved host can never have been
 *     handed out as a kit anyway.
 *  6. The label is not slug-shaped, or is
 *     all digits                              → app as normal.
 *  7. The path is infrastructure (`/_next`,
 *     `/api`, a file with an extension) or is
 *     already under `/k/`                     → app as normal. The `/k/` check is
 *     load-bearing: links inside the page are absolute (`/k/<slug>/r/<id>`), so
 *     without it a click on a subdomain would rewrite to `/k/<slug>/k/<slug>/r/<id>`.
 *
 * Only then: rewrite (not redirect) to `/k/<label><path>`. A rewrite keeps the
 * pretty URL in the address bar, which is the entire point of the subdomain.
 */

import { NextResponse, type NextRequest } from "next/server";

/** Empty in every environment that has not opted in. Empty ⇒ middleware does nothing. */
const BASE_DOMAIN = (process.env.PRESS_KIT_BASE_DOMAIN ?? "")
  .trim()
  .toLowerCase()
  .replace(/^\.+|\.+$/g, "");

/**
 * Hosts that must never be treated as an artist slug. Mirrors the reserved list in
 * the build contract; the backend refuses these at slug-generation time, this is the
 * second lock on the same door.
 */
const RESERVED_SUBDOMAINS = new Set([
  "www", "api", "admin", "app", "backstage", "dashboard", "songdis", "ayo",
  "splitr", "amplify", "quickdrop", "quick-drop", "migrations", "analytics",
  "mail", "email", "smtp", "ftp", "cdn", "assets", "static", "media", "img",
  "images", "files", "download", "downloads", "s3", "storage", "ns", "ns1",
  "ns2", "dns", "mx", "vpn", "proxy", "gateway", "dev", "development",
  "staging", "stage", "test", "testing", "qa", "sandbox", "preview", "demo",
  "local", "localhost", "beta", "alpha", "help", "support", "status", "blog",
  "news", "press", "about", "legal", "terms", "privacy", "security", "billing",
  "pay", "payment", "payments", "account", "accounts", "auth", "login",
  "signin", "signup", "register", "link", "links", "go", "k", "kit",
  "presskit", "epk", "apk", "cosign", "co-sign",
]);

/** Same shape the backend generates: 2–40 chars, a–z/0–9/hyphen, no leading or trailing hyphen. */
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

/** Paths that must always reach the app untouched, whatever the host. */
function isInfrastructurePath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__next") ||
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/k/") ||
    pathname === "/k" ||
    // Anything that looks like a static file: /favicon.ico, /images/logo.svg,
    // /fonts/Nulshock Bd.otf, /robots.txt …
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

export function proxy(request: NextRequest) {
  // 1. Not configured → do nothing at all.
  if (!BASE_DOMAIN) return NextResponse.next();

  // Behind Vercel / any proxy the original host is in x-forwarded-host; `host`
  // may be the internal one. Prefer the forwarded value, fall back to host.
  const rawHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = rawHost
    .split(",")[0] // x-forwarded-host can be a list; the first entry is the client's
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "") // strip :3000
    .replace(/\.$/, ""); // strip the FQDN trailing dot

  // 2 + 3. Apex, or a host that is not under the base domain.
  if (!host || host === BASE_DOMAIN) return NextResponse.next();
  if (!host.endsWith(`.${BASE_DOMAIN}`)) return NextResponse.next();

  const label = host.slice(0, host.length - BASE_DOMAIN.length - 1);

  // 4. Multi-level host — not a kit.
  if (!label || label.includes(".")) return NextResponse.next();

  // 5 + 6. Reserved, or not slug-shaped, or all digits (reads as an account number).
  if (RESERVED_SUBDOMAINS.has(label)) return NextResponse.next();
  if (!SLUG_PATTERN.test(label)) return NextResponse.next();
  if (/^\d+$/.test(label)) return NextResponse.next();

  // 7. Infrastructure and already-rewritten paths.
  const { pathname } = request.nextUrl;
  if (isInfrastructurePath(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/k/${label}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Keeps the middleware off static assets and API routes entirely, so it is not even
 * invoked for them. Belt and braces: `isInfrastructurePath` checks the same things,
 * because the matcher is a single string and a typo in it is silent.
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
