import { EPK_DOMAIN } from "@/lib/epk";

/**
 * getepk.si/sitemap.xml: the landing and sign-up pages, plus every published artist kit at its
 * own address (msjorji.getepk.si). Rebuilt at most hourly.
 */
export const revalidate = 3600;

interface Entry {
  slug: string;
  updated_at: string | null;
}

export async function GET() {
  let kits: Entry[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/press-kit-index`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) kits = ((await res.json()) as { data?: Entry[] }).data ?? [];
  } catch {
    // API down: still serve the core pages.
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const url = (loc: string, lastmod?: string | null, priority?: string) =>
    `  <url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${esc(lastmod)}</lastmod>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url(`https://${EPK_DOMAIN}/`, null, "1.0"),
    url(`https://${EPK_DOMAIN}/sign-up`, null, "0.6"),
    ...kits.filter((k) => /^[a-z0-9-]+$/.test(k.slug)).map((k) => url(`https://${k.slug}.${EPK_DOMAIN}/`, k.updated_at, "0.8")),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
