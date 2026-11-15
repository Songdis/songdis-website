/**
 * getepk.si/robots.txt (and every artist subdomain's — the proxy sends them all here).
 * Account pages stay out of search; kits and the landing page are in, via the sitemap.
 * Pointing every subdomain at the one sitemap is also what lets that sitemap list them.
 */
export const dynamic = "force-static";

export function GET() {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /sign-in",
    "Disallow: /verify",
    "Disallow: /callback",
    "Disallow: /app",
    "",
    "Sitemap: https://getepk.si/sitemap.xml",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
