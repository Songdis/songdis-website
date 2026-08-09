/**
 * The downloadable press kit — `/k/<slug>/pdf`.
 *
 * Modelled on a real EPK (the Kdiv Coco reference): dark, full-bleed, bold condensed
 * headings, artwork doing the talking. NOT a light one-sheet — an EPK is a designed
 * document an artist is proud to attach, and a white A4 with small type reads like an
 * invoice.
 *
 * Page order, which is how a booker actually reads one:
 *   1. COVER          full-bleed portrait, name, "ELECTRONIC PRESS KIT", genre band
 *   2. BIOGRAPHY      the story, in the artist's own words
 *   3. MUSIC          artwork grid — the releases, with credits
 *   4. LIVE           spotlights and milestones, when the artist has any
 *   5. PRESS          quotes and placements, when the artist has any
 *   6. PRESS PHOTOS   large, download link back to the kit
 *   7. CONTACT        latest release, emails, socials, copyright line
 *
 * CO-SIGN IS ABSENT, deliberately and permanently. A tip jar does not belong in a document
 * sent to bookers and journalists, and a bank account number in a file that gets forwarded
 * around is worse than merely off-message.
 *
 * Sections follow `section_order`/`hidden_sections`, and a section with nothing in it is
 * dropped rather than printed empty — a blank "Press & accolades" page makes an artist look
 * like they have nothing, which is worse than not raising the subject.
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

const INK = "#0B0708";
const RED = "#E5342F";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);

  return {
    title: kit ? `${kit.artist.name} — Electronic Press Kit` : "Press kit not found — Songdis",
    // Never indexed: it would compete with the real page for the same terms and is the
    // wrong thing to land on from a search result.
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

  const featured = releases.featured;
  const allReleases = [...(featured ? [featured] : []), ...releases.others];

  const cover = artist.cover_image_url ?? artist.avatar_url;
  const kitUrl = `${SITE_ORIGIN}/k/${artist.slug}`;
  const year = new Date().getFullYear();

  const pages: React.ReactNode[] = [];

  /* ── BIOGRAPHY ──────────────────────────────────────────────────── */
  if (show("bio") && artist.bio) {
    pages.push(
      <Page key="bio" title="Biography">
        <p className="whitespace-pre-line text-[13px] leading-[1.9] text-white/85">
          {artist.bio}
        </p>
        {facts.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6">
            {facts.map((f) => (
              <div key={f.label}>
                <div className="mb-1.5 text-[9px] uppercase tracking-[0.2em] text-white/40">
                  {f.label}
                </div>
                <div className="text-[13.5px] font-semibold text-white">{f.value}</div>
              </div>
            ))}
          </div>
        )}
      </Page>
    );
  }

  /* ── MUSIC — the artwork grid the reference leads with ──────────── */
  if (show("listen") && allReleases.length > 0) {
    pages.push(
      <Page key="listen" title="Music">
        <div className="grid grid-cols-4 gap-x-5 gap-y-7">
          {allReleases.slice(0, 12).map((r) => (
            <div key={r.id} className="pk-keep">
              {r.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- next/image routes
                // through the optimiser, which the print renderer may not have fetched in
                // time; a plain <img> is what reliably appears in the output.
                <img src={r.cover} alt="" className="aspect-square w-full rounded object-cover" />
              ) : (
                <span className="block aspect-square w-full rounded bg-white/10" />
              )}
              <p className="mt-2.5 text-[10.5px] font-bold uppercase leading-tight text-white underline decoration-white/30 underline-offset-2">
                {r.title}
              </p>
              <p className="mt-0.5 text-[9.5px] text-white/45">
                {"released_on" in r
                  ? formatReleaseDate(r.released_on) ?? ""
                  : releaseYear(r.year) ?? ""}
              </p>
            </div>
          ))}
        </div>
        {allReleases.length > 12 && (
          <p className="mt-8 text-[10.5px] text-white/40">
            + {allReleases.length - 12} more releases at {kitUrl}
          </p>
        )}
      </Page>
    );
  }

  /* ── LIVE & MILESTONES ──────────────────────────────────────────── */
  if (show("live") && spotlights.length > 0) {
    pages.push(
      <Page key="live" title="Live &amp; Milestones">
        <div className="grid grid-cols-2 gap-6">
          {spotlights.slice(0, 8).map((s) => (
            <div key={s.id} className="pk-keep">
              {s.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.url} alt="" className="aspect-[4/3] w-full rounded object-cover" />
              )}
              {s.title && (
                <p className="mt-2.5 text-[12px] font-bold uppercase text-white">{s.title}</p>
              )}
              {s.description && (
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/60">{s.description}</p>
              )}
            </div>
          ))}
        </div>
      </Page>
    );
  }

  /* ── PRESS ──────────────────────────────────────────────────────── */
  if (show("press") && (cfg.quotes.length > 0 || cfg.placements.length > 0)) {
    pages.push(
      <Page key="press" title="Press &amp; Accolades">
        {cfg.quotes.map((q, i) => (
          <blockquote key={i} className="pk-keep mb-8 border-l-[3px] pl-6" style={{ borderColor: RED }}>
            <p className="text-[17px] font-semibold italic leading-[1.5] text-white">“{q.quote}”</p>
            {(q.source || q.year) && (
              <cite className="mt-2.5 block text-[11px] not-italic text-white/45">
                — {[q.source, q.year].filter(Boolean).join(", ")}
              </cite>
            )}
          </blockquote>
        ))}
        {cfg.placements.length > 0 && (
          <div className="mt-10 border-t border-white/15 pt-6">
            <div className="mb-3 text-[9px] uppercase tracking-[0.2em] text-white/40">
              Placements
            </div>
            <div className="flex flex-wrap gap-2.5">
              {cfg.placements.map((p, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/25 px-4 py-2 text-[11px] text-white/85"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </Page>
    );
  }

  /* ── PRESS PHOTOS ───────────────────────────────────────────────── */
  if (show("photos") && photos.length > 0) {
    pages.push(
      <Page key="photos" title="Press Photos" subtitle={`Download hi-res at ${kitUrl}`}>
        <div className="grid grid-cols-2 gap-4">
          {photos.slice(0, 6).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.url}
              alt=""
              className="pk-keep aspect-[3/4] w-full rounded object-cover"
            />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <>
      {/*
        Print rules live here, not globals.css: they must not leak into the app, and
        `@page` cannot be expressed in Tailwind. `print-color-adjust: exact` is what stops
        browsers stripping the dark backgrounds — without it every page prints white with
        white text, i.e. blank.
      */}
      <style>{`
        @page { size: A4; margin: 0; }
        .pk-page { width: 210mm; min-height: 297mm; }
        .pk-keep { break-inside: avoid; page-break-inside: avoid; }
        @media print {
          html, body { background: ${INK} !important; }
          .pk-shell { background: ${INK} !important; padding: 0 !important; }
          .pk-page { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .pk-page:last-child { break-after: auto; page-break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
        @media screen { .pk-page { margin: 0 auto 22px; box-shadow: 0 10px 34px rgba(0,0,0,.5); } }
      `}</style>

      <PrintTrigger />

      <main className="pk-shell min-h-screen py-8" style={{ background: "#1b1516" }}>

        {/* ── COVER ──────────────────────────────────────────────── */}
        <section className="pk-page relative overflow-hidden" style={{ background: INK }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                `linear-gradient(180deg, rgba(11,7,8,.72) 0%, rgba(11,7,8,.18) 34%, rgba(11,7,8,.52) 68%, ${INK} 100%)`,
            }}
          />

          <div className="absolute inset-x-0 top-0 px-[18mm] pt-[18mm]">
            <p className="font-heading text-[15px] uppercase leading-[1.1] tracking-[0.02em] text-white">
              Electronic Press Kit
            </p>
            <p className="mt-1 font-heading text-[13px] tracking-[0.2em] text-white/70">{year}</p>

            <h1
              className="mt-12 font-heading text-[46px] uppercase leading-[0.92] tracking-wide"
              style={{ color: RED }}
            >
              {artist.name}
            </h1>
          </div>

          {/* The red band the reference closes the cover with. */}
          {artist.eyebrow && (
            <div
              className="absolute inset-x-0 bottom-0 px-[18mm] py-5 text-center"
              style={{ background: RED }}
            >
              <p className="text-[14px] font-bold uppercase tracking-[0.06em] text-white">
                {artist.eyebrow}
              </p>
            </div>
          )}
        </section>

        {pages}

        {/* ── CONTACT — always last, always present ──────────────── */}
        <section
          className="pk-page relative flex flex-col justify-end overflow-hidden"
          style={{ background: INK }}
        >
          {featured?.cover && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-45"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(180deg, rgba(11,7,8,.55), ${INK} 72%)` }}
              />
            </>
          )}

          <div className="absolute inset-x-0 top-0 px-[18mm] pt-[18mm]">
            <h2 className="font-heading text-[30px] uppercase tracking-[0.06em] text-white">
              Latest Release
            </h2>
            {featured && (
              <div className="mt-7 flex items-center gap-5">
                {featured.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.cover} alt="" className="h-[110px] w-[110px] rounded object-cover" />
                )}
                <div className="min-w-0">
                  <p className="text-[17px] font-bold uppercase leading-tight text-white underline decoration-white/40 underline-offset-4">
                    {featured.title}
                  </p>
                  <p className="mt-1.5 text-[12px] text-white/60">
                    {formatReleaseDate(featured.released_on) ?? ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="relative px-[18mm] pb-[18mm]">
            {contacts.length > 0 && (
              <div className="mb-6 space-y-2">
                {contacts.map((c) => (
                  <p key={c.label} className="text-[13px] font-bold uppercase tracking-[0.04em] text-white">
                    {c.email}
                  </p>
                ))}
              </div>
            )}

            {socials.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/15 pt-5">
                {socials.map((s) => (
                  <span key={s.label} className="text-[10px] uppercase tracking-[0.14em] text-white/55">
                    {s.label}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[9.5px] uppercase tracking-[0.1em] text-white/40">
              © Songdis {year} · {kitUrl}
            </p>
            {contacts[0] && (
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-white/40">
                Press inquiries: {artist.name} · {contacts[0].email}
              </p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

/** One A4 page: big condensed title, optional subtitle, content, hairline footer. */
function Page({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pk-page flex flex-col px-[18mm] py-[18mm]" style={{ background: INK }}>
      <header className="mb-9">
        <h2
          className="font-heading text-[34px] uppercase leading-none tracking-[0.04em] text-white"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        {subtitle && (
          <p className="mt-2.5 text-[10.5px] uppercase tracking-[0.16em]" style={{ color: RED }}>
            {subtitle}
          </p>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-8 border-t border-white/12 pt-3 text-[8.5px] uppercase tracking-[0.16em] text-white/30">
        Distributed by Songdis
      </footer>
    </section>
  );
}
