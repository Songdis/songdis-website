/**
 * The printable press kit — `/k/<slug>/pdf`.
 *
 * A properly paginated document a promoter can attach to an email, not a screenshot of the
 * web page and not everything crushed onto one sheet. Each major section gets its own page
 * so nothing straddles a fold, in roughly the order a booker reads: who they are, what they
 * sound like, proof, pictures, how to reach them.
 *
 * Three deliberate differences from `/k/<slug>`:
 *
 *   1. It is LIGHT. The site's dark theme prints as a solid black rectangle — it drains a
 *      printer, and "Save as PDF" keeps the background, so the result is unusable in the
 *      exact context a press kit exists for. The cover page keeps the dark treatment
 *      because it is the one page that should look like a poster.
 *   2. CO-SIGN IS ABSENT. A tip jar does not belong in a document sent to a booker or a
 *      journalist, and a bank account number in a file that gets forwarded around is worse
 *      than merely off-message.
 *   3. Page order follows `section_order`/`hidden_sections`, so what the artist arranged is
 *      what they hand over.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DEFAULT_SECTION_ORDER,
  getPublicPressKit,
  type PressKitSectionKey,
} from "@/lib/api/press-kit-public";
import { SITE_ORIGIN, formatReleaseDate, releaseYear } from "../_format";
import PrintTrigger from "./PrintTrigger";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);

  return {
    title: kit ? `${kit.artist.name} — Press Kit` : "Press kit not found — Songdis",
    // Never index the print view: it would compete with the real page for the same terms,
    // and it is the wrong thing to land on from a search result.
    robots: { index: false, follow: false },
  };
}

export default async function PressKitPdfPage({ params }: Params) {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);

  if (!kit) notFound();

  const { artist, kit: cfg, photos, spotlights, releases } = kit;

  const hidden = new Set(cfg.hidden_sections);
  const order = (cfg.section_order.length > 0 ? cfg.section_order : [...DEFAULT_SECTION_ORDER])
    .filter((k) => !hidden.has(k));
  const show = (k: PressKitSectionKey) => order.includes(k);

  const facts = [
    { label: "Genre", value: cfg.facts.genre },
    { label: "Based in", value: cfg.facts.based_in },
    { label: "For fans of", value: cfg.facts.for_fans_of },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const contacts = [
    { label: "Bookings", email: cfg.contacts.bookings },
    { label: "Management", email: cfg.contacts.management },
    { label: "Press / Sync", email: cfg.contacts.press },
  ].filter((c): c is { label: string; email: string } => Boolean(c.email));

  const socials = [
    { label: "Instagram", href: artist.socials.instagram },
    { label: "TikTok", href: artist.socials.tiktok },
    { label: "YouTube", href: artist.socials.youtube },
    { label: "X", href: artist.socials.twitter },
    { label: "Spotify", href: artist.socials.spotify },
    { label: "Apple Music", href: artist.socials.apple_music },
  ].filter((s): s is { label: string; href: string } => Boolean(s.href));

  const allReleases = [
    ...(releases.featured ? [releases.featured] : []),
    ...releases.others,
  ];

  const cover = artist.cover_image_url ?? artist.avatar_url;
  const kitUrl = `${SITE_ORIGIN}/k/${artist.slug}`;

  // Built as a list so page breaks fall BETWEEN sections rather than being hardcoded onto
  // the first one — a hidden Bio must not leave page 2 blank.
  const pages: { key: string; node: React.ReactNode }[] = [];

  if (show("bio") && artist.bio) {
    pages.push({
      key: "bio",
      node: (
        <Page title="Biography" artist={artist.name}>
          {facts.length > 0 && (
            <div className="mb-8 grid grid-cols-3 gap-6 border-b border-neutral-200 pb-6">
              {facts.map((f) => (
                <div key={f.label}>
                  <div className="mb-1.5 text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
                    {f.label}
                  </div>
                  <div className="text-[14px] font-semibold leading-snug">{f.value}</div>
                </div>
              ))}
            </div>
          )}
          <p className="whitespace-pre-line text-[13.5px] leading-[1.85] text-neutral-800">
            {artist.bio}
          </p>
        </Page>
      ),
    });
  }

  if (show("listen") && allReleases.length > 0) {
    pages.push({
      key: "listen",
      node: (
        <Page title="Music" artist={artist.name}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {allReleases.slice(0, 24).map((r) => (
              <div key={r.id} className="pk-keep flex items-center gap-3.5">
                {r.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element -- next/image routes
                  // through the optimiser, which the print renderer may not have fetched in
                  // time; a plain <img> is what reliably appears in the output.
                  <img
                    src={r.cover}
                    alt=""
                    className="h-[46px] w-[46px] shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-[46px] w-[46px] shrink-0 rounded bg-neutral-200" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">{r.title}</span>
                  <span className="block text-[10.5px] text-neutral-500">
                    {"released_on" in r
                      ? formatReleaseDate(r.released_on) ?? ""
                      : releaseYear(r.year) ?? ""}
                  </span>
                </span>
              </div>
            ))}
          </div>
          {allReleases.length > 24 && (
            <p className="mt-6 text-[11px] text-neutral-500">
              + {allReleases.length - 24} more releases at {kitUrl}
            </p>
          )}
        </Page>
      ),
    });
  }

  if (show("press") && (cfg.quotes.length > 0 || cfg.placements.length > 0)) {
    pages.push({
      key: "press",
      node: (
        <Page title="Press &amp; accolades" artist={artist.name}>
          {cfg.quotes.map((q, i) => (
            <blockquote key={i} className="pk-keep mb-7 border-l-[3px] border-[#C30100] pl-5">
              <p className="text-[16px] font-semibold italic leading-[1.5]">“{q.quote}”</p>
              {(q.source || q.year) && (
                <cite className="mt-2 block text-[11.5px] not-italic text-neutral-500">
                  — {[q.source, q.year].filter(Boolean).join(", ")}
                </cite>
              )}
            </blockquote>
          ))}
          {cfg.placements.length > 0 && (
            <div className="mt-8 border-t border-neutral-200 pt-5">
              <div className="mb-2.5 text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
                Placements
              </div>
              <div className="flex flex-wrap gap-2">
                {cfg.placements.map((p, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-neutral-300 px-3 py-1.5 text-[11.5px]"
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Page>
      ),
    });
  }

  if (show("live") && spotlights.length > 0) {
    pages.push({
      key: "live",
      node: (
        <Page title="Live &amp; spotlights" artist={artist.name}>
          <div className="space-y-5">
            {spotlights.map((s) => (
              <div key={s.id} className="pk-keep flex gap-4">
                {s.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.url} alt="" className="h-[64px] w-[64px] shrink-0 rounded object-cover" />
                )}
                <div className="min-w-0">
                  {s.title && <div className="text-[13.5px] font-semibold">{s.title}</div>}
                  {s.description && (
                    <p className="mt-1 text-[12px] leading-relaxed text-neutral-700">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Page>
      ),
    });
  }

  if (show("photos") && photos.length > 0) {
    pages.push({
      key: "photos",
      node: (
        <Page title="Press photos" artist={artist.name}>
          <div className="grid grid-cols-2 gap-4">
            {photos.slice(0, 6).map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt=""
                className="pk-keep aspect-[4/3] w-full rounded object-cover"
              />
            ))}
          </div>
          <p className="mt-5 text-[11px] text-neutral-500">
            Hi-res originals available at {kitUrl}
          </p>
        </Page>
      ),
    });
  }

  if (show("contact") && (contacts.length > 0 || socials.length > 0)) {
    pages.push({
      key: "contact",
      node: (
        <Page title="Contact &amp; booking" artist={artist.name}>
          {contacts.length > 0 && (
            <div className="mb-9 space-y-5">
              {contacts.map((c) => (
                <div key={c.label} className="pk-keep border-b border-neutral-200 pb-4">
                  <div className="mb-1 text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
                    {c.label}
                  </div>
                  <div className="break-words text-[15px] font-semibold">{c.email}</div>
                </div>
              ))}
            </div>
          )}
          {socials.length > 0 && (
            <div>
              <div className="mb-2.5 text-[9.5px] uppercase tracking-[0.16em] text-neutral-500">
                Online
              </div>
              <div className="space-y-1.5">
                {socials.map((s) => (
                  <div key={s.label} className="flex gap-3 text-[11.5px]">
                    <span className="w-[92px] shrink-0 text-neutral-500">{s.label}</span>
                    <span className="min-w-0 break-all text-neutral-800">{s.href}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Page>
      ),
    });
  }

  return (
    <>
      {/*
        Print rules live here rather than in globals.css: they must not leak into the app,
        and `@page` cannot be expressed in Tailwind. `print-color-adjust: exact` is what
        stops browsers helpfully stripping backgrounds and leaving the cover page white.
      */}
      <style>{`
        @page { size: A4; margin: 0; }
        .pk-page { width: 210mm; min-height: 297mm; padding: 20mm 18mm; }
        .pk-keep { break-inside: avoid; page-break-inside: avoid; }
        @media print {
          html, body { background: #fff !important; }
          .pk-shell { background: #fff !important; padding: 0 !important; }
          .pk-page { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .pk-page:last-child { break-after: auto; page-break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
        @media screen {
          .pk-page { margin: 0 auto 24px; box-shadow: 0 8px 30px rgba(0,0,0,.13); }
        }
      `}</style>

      <PrintTrigger />

      <main className="pk-shell min-h-screen bg-neutral-200 py-8">

        {/* ── COVER — the one page that should look like a poster ──── */}
        <section className="pk-page relative flex flex-col justify-end overflow-hidden bg-[#170D0E] text-white">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(14,7,8,.45) 0%, rgba(14,7,8,.15) 38%, rgba(14,7,8,.88) 74%, #170D0E 100%)",
            }}
          />
          <div className="relative">
            {artist.eyebrow && (
              <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-white/75">
                {artist.eyebrow}
              </p>
            )}
            <h1 className="font-heading text-[52px] uppercase leading-[0.95] tracking-wide">
              {artist.name}
            </h1>
            <p className="mt-5 text-[12px] uppercase tracking-[0.16em] text-white/60">
              Press Kit
            </p>
            {facts.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/20 pt-5">
                {facts.map((f) => (
                  <div key={f.label}>
                    <div className="text-[9px] uppercase tracking-[0.16em] text-white/50">
                      {f.label}
                    </div>
                    <div className="mt-0.5 text-[13px] font-semibold">{f.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {pages.map((p) => (
          <div key={p.key}>{p.node}</div>
        ))}
      </main>
    </>
  );
}

/** One A4 page with a running header and footer, so a printed stack stays identifiable. */
function Page({
  title,
  artist,
  children,
}: {
  title: string;
  artist: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pk-page flex flex-col bg-white text-[#141013]">
      <header className="mb-8 flex items-baseline justify-between border-b-2 border-[#C30100] pb-3">
        <h2
          className="font-heading text-[13px] uppercase tracking-[0.2em] text-[#C30100]"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
          {artist}
        </span>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-8 border-t border-neutral-200 pt-3 text-[9.5px] text-neutral-400">
        Distributed by Songdis
      </footer>
    </section>
  );
}
