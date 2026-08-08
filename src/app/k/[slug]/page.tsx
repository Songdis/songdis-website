import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Mail,
  Play,
  Users,
} from "lucide-react";
import {
  FaApple,
  FaFacebookF,
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import {
  DEFAULT_SECTION_ORDER,
  getPublicPressKit,
  type PressKitSectionKey,
  type PublicPressKit,
} from "@/lib/api/press-kit-public";
import { headlineStyle, pressKitThemeVars } from "./_theme";
import {
  SITE_ORIGIN,
  bookingMailto,
  formatReleaseDate,
  formatReleaseType,
  releaseYear,
  summarise,
} from "./_format";
import BioCard from "./_components/BioCard";
import CoSignCard from "./_components/CoSignCard";
import ShareButton from "./_components/ShareButton";
import SpotlightRail from "./_components/SpotlightRail";

type Params = { params: Promise<{ slug: string }> };


export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);

  if (!kit) {
    return {
      title: "Press kit not found — Songdis",
      robots: { index: false, follow: false },
    };
  }

  const { artist } = kit;
  const title = `${artist.name} — Press Kit`;
  const description =
    summarise(artist.bio) ??
    `Bio, music, photos and booking contacts for ${artist.name}.`;
  const image = artist.cover_image_url ?? artist.avatar_url ?? null;
  const url = `${SITE_ORIGIN}/k/${artist.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      siteName: "Songdis",
      url,
      title,
      description,
      images: image ? [{ url: image, alt: artist.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}


function resolveOrder(kit: PublicPressKit): PressKitSectionKey[] {
  const ordered =
    kit.kit.section_order.length > 0
      ? kit.kit.section_order
      : [...DEFAULT_SECTION_ORDER];
  const hidden = new Set(kit.kit.hidden_sections);
  return ordered.filter((k) => !hidden.has(k));
}


function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-heading text-[10.5px] uppercase leading-none tracking-[0.24em] text-[var(--pk-muted)] sm:text-[11.5px]">
        {children}
      </h2>
      {action ? <div className="ml-auto">{action}</div> : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--pk-bg)] p-4 sm:p-5">
      <div className="mb-1.5 text-[10.5px] uppercase tracking-[0.12em] text-[var(--pk-muted-2)]">
        {label}
      </div>
      <div className="text-[15px] font-semibold leading-snug text-[var(--pk-text)]">
        {value}
      </div>
    </div>
  );
}

function ContactRow({
  label,
  email,
  icon,
  artistName,
}: {
  label: string;
  email: string;
  icon: ReactNode;
  artistName: string;
}) {
  return (
    <a
      href={bookingMailto(email, artistName)}
      className="flex items-center gap-3.5 border-b border-[var(--pk-line)] py-4 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--pk-line)] bg-[var(--pk-surface)] text-[var(--pk-text-soft)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[10.5px] uppercase tracking-[0.12em] text-[var(--pk-muted-2)]">
          {label}
        </span>
        <span className="block truncate text-[15px] font-semibold text-[var(--pk-text)]">
          {email}
        </span>
      </span>
      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-[var(--pk-muted-2)]" />
    </a>
  );
}


export default async function PressKitPage({ params }: Params) {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);


  if (!kit) notFound();

  const { artist, kit: cfg, photos, spotlights, releases } = kit;
  const order = resolveOrder(kit);

  const bookingEmail =
    cfg.contacts.bookings ?? cfg.contacts.management ?? cfg.contacts.press;
  const cover = artist.cover_image_url ?? artist.avatar_url;

  const socials = (
    [

      { href: artist.socials.instagram, label: "Instagram", Icon: FaInstagram },
      { href: artist.socials.tiktok, label: "TikTok", Icon: FaTiktok },
      { href: artist.socials.youtube, label: "YouTube", Icon: FaYoutube },
      { href: artist.socials.twitter, label: "X", Icon: FaXTwitter },
      { href: artist.socials.facebook, label: "Facebook", Icon: FaFacebookF },
      { href: artist.socials.spotify, label: "Spotify", Icon: FaSpotify },
      { href: artist.socials.apple_music, label: "Apple Music", Icon: FaApple },
    ] as const
  ).filter((s): s is typeof s & { href: string } => Boolean(s.href));

  const facts = [
    { label: "Genre", value: cfg.facts.genre },
    { label: "Based in", value: cfg.facts.based_in },
    { label: "For fans of", value: cfg.facts.for_fans_of },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  const contacts: { label: string; email: string; icon: ReactNode }[] = [
    { label: "Bookings", email: cfg.contacts.bookings, icon: <Mail className="h-[18px] w-[18px]" strokeWidth={1.8} /> },
    { label: "Management", email: cfg.contacts.management, icon: <Users className="h-[18px] w-[18px]" strokeWidth={1.8} /> },
    { label: "Press / Sync", email: cfg.contacts.press, icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} /> },
  ].flatMap((c) => (c.email ? [{ ...c, email: c.email }] : []));

  const featured = releases.featured;
  const featuredType = formatReleaseType(featured?.type ?? null);
  const featuredTag = featuredType
    ? `Latest ${featuredType.toLowerCase()}`
    : "Latest release";
  const hasListen = Boolean(featured) || releases.others.length > 0;
  const hasPress = cfg.quotes.length > 0 || cfg.placements.length > 0;


  const sections: Record<PressKitSectionKey, ReactNode> = {
    glance:
      facts.length === 0 ? null : (
        <section key="glance" className="pt-10 sm:pt-12">
          <SectionLabel>At a glance</SectionLabel>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-line)] sm:grid-cols-2 lg:grid-cols-3">
            {facts.map((f) => (
              <Fact key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </section>
      ),

    bio: !artist.bio ? null : (
      <section key="bio" className="pt-10 sm:pt-12">
        <SectionLabel>Bio</SectionLabel>
        <BioCard bio={artist.bio} />
      </section>
    ),

    listen: !hasListen ? null : (
      <section key="listen" className="pt-10 sm:pt-12">
        <SectionLabel>Listen</SectionLabel>

        {featured && (
          <Link
            href={`/k/${artist.slug}/r/${featured.id}`}
            className="group relative mb-4 block overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--pk-tint),var(--pk-bg-deep))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)] sm:rounded-3xl"
          >
            <div className="relative aspect-[10/7] w-full sm:aspect-[16/8] lg:aspect-[16/7]">
              {featured.cover && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={featured.cover}
                  alt={featured.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,.82))]" />
            </div>
            <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-6">
              <div className="min-w-0">
                <div
                  className="mb-2 text-[9.5px] uppercase tracking-[0.24em] text-white/80"
                  style={headlineStyle}
                >
                  {featuredTag}
                </div>
                <h3
                  className="truncate text-[22px] uppercase leading-none text-white sm:text-[30px]"
                  style={headlineStyle}
                >
                  {featured.title}
                </h3>
                {featured.released_on && (
                  <div className="mt-2 text-[13px] text-white/70">
                    {formatReleaseDate(featured.released_on)}
                  </div>
                )}
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white sm:h-14 sm:w-14">
                <Play
                  className="ml-0.5 h-[18px] w-[18px] fill-[#120A0C] text-[#120A0C]"
                  strokeWidth={0}
                />
              </span>
            </div>
          </Link>
        )}

        {releases.others.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
            {releases.others.map((r) => (
              <Link
                key={r.id}
                href={`/k/${artist.slug}/r/${r.id}`}
                className="group focus-visible:outline-none"
              >
                <span className="block aspect-square overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--pk-tint),var(--pk-bg-deep))] ring-1 ring-[var(--pk-line)] transition group-hover:ring-[var(--pk-accent)]">
                  {r.cover && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={r.cover}
                      alt={r.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <span className="mt-2 block truncate text-[12.5px] font-semibold text-[var(--pk-text)]">
                  {r.title}
                </span>
                {r.year && (
                  <span className="mt-0.5 block text-[11px] text-[var(--pk-muted-2)]">
                    {releaseYear(r.year)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    ),

    press: !hasPress ? null : (
      <section key="press" className="pt-10 sm:pt-12">
        <SectionLabel>Press &amp; accolades</SectionLabel>

        {cfg.quotes.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {cfg.quotes.map((q, i) => (
              <blockquote
                key={`${q.quote.slice(0, 24)}-${i}`}
                className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-5"
              >
                <p
                  className="text-[16px] font-bold leading-snug text-[var(--pk-text)] sm:text-[17px]"
                  style={headlineStyle}
                >
                  &ldquo;{q.quote}&rdquo;
                </p>
                {(q.source || q.year) && (
                  <footer className="mt-3 text-[13px] text-[var(--pk-muted)]">
                    {q.source && (
                      <span className="text-[var(--pk-text-soft)]">
                        — {q.source}
                      </span>
                    )}
                    {q.source && q.year ? ", " : null}
                    {q.year}
                  </footer>
                )}
              </blockquote>
            ))}
          </div>
        )}

        {cfg.placements.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {cfg.placements.map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className="rounded-full border border-[var(--pk-line)] bg-white/[0.03] px-4 py-2 text-[12.5px] font-semibold text-[var(--pk-text-soft)]"
              >
                {p.label}
              </span>
            ))}
          </div>
        )}
      </section>
    ),

    photos:
      photos.length === 0 ? null : (
        <section key="photos" className="pt-10 sm:pt-12">
          <SectionLabel>Press photos</SectionLabel>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
            {photos.map((p) => (

              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-square overflow-hidden rounded-xl bg-[var(--pk-tint)] ring-1 ring-[var(--pk-line)] transition hover:ring-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`${artist.name} press photo`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </section>
      ),

    live:
      spotlights.length === 0 ? null : (
        <section key="live" className="pt-10 sm:pt-12">
          <SectionLabel>Live &amp; spotlights</SectionLabel>
          <SpotlightRail items={spotlights} />
        </section>
      ),

    contact:
      contacts.length === 0 ? null : (
        <section key="contact" className="pt-10 sm:pt-12">
          <SectionLabel>Contact &amp; booking</SectionLabel>
          <div className="rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] px-5 py-1 sm:px-6">
            {contacts.map((c) => (
              <ContactRow
                key={c.label}
                label={c.label}
                email={c.email}
                icon={c.icon}
                artistName={artist.name}
              />
            ))}
          </div>
        </section>
      ),

    /*
     * Full press kit — the printable document at /k/<slug>/pdf.
     *
     * Deliberately NOT a co-sign surface: the PDF omits it entirely. A tip jar does not
     * belong in a file that gets forwarded to bookers and journalists.
     */
    kit: (
      <section key="kit" className="pt-10 sm:pt-12">
        <a
          href={`/k/${artist.slug}/pdf`}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-4 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] p-5 transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)] sm:p-6"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[var(--pk-accent)]/30 bg-[var(--pk-accent)]/10 text-[var(--pk-accent)]">
            <FileText className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-[15px] uppercase tracking-wide text-[var(--pk-text)]">
              Full press kit
            </span>
            <span className="block text-[12.5px] text-[var(--pk-muted)]">
              Bio, music, photos and contacts — ready to print or attach
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--pk-muted-2)]" />
        </a>
      </section>
    ),
    join: null,
  };

  return (
    <main
      style={pressKitThemeVars(cfg.theme, cfg.headline_font)}
      className="relative min-h-screen overflow-x-clip bg-[var(--pk-bg)] font-body text-[var(--pk-text)]"
    >
      <div className="absolute inset-x-0 top-0 z-20 bg-[linear-gradient(180deg,rgba(10,6,7,.85),transparent)]">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
          <Link href="/" aria-label="Songdis home" className="shrink-0">
            <Image
              src="/images/logo.svg"
              alt="Songdis"
              width={108}
              height={39}
              className="h-8 w-auto object-contain sm:h-9"
              priority
            />
          </Link>
          <ShareButton
            variant="icon"
            title={`${artist.name} — Press Kit`}
          />
        </div>
      </div>


      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--pk-tint),var(--pk-bg-deep)_60%,var(--pk-bg))]" />
        {cover && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cover}
            alt={artist.name}
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover object-[50%_22%]"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,7,.6)_0%,rgba(10,6,7,.12)_30%,rgba(10,6,7,.72)_68%,var(--pk-bg)_100%)]" />

        <div className="relative mx-auto flex min-h-[76svh] max-w-[1080px] flex-col justify-end px-5 pb-10 pt-32 sm:px-8 lg:min-h-[82svh] lg:max-h-[860px] lg:pb-14">
          {artist.eyebrow && (
            <p
              className="mb-3 text-[10.5px] uppercase tracking-[0.3em] text-white/75 sm:text-[11px]"
              style={headlineStyle}
            >
              {artist.eyebrow}
            </p>
          )}

          <h1
            className="mb-6 break-words text-[clamp(1.9rem,8vw,4.25rem)] uppercase leading-[0.95] text-white"
            style={headlineStyle}
          >
            {artist.name}
          </h1>

          {bookingEmail && (
            <div className="mb-5 flex flex-wrap gap-3">
              <a
                href={bookingMailto(bookingEmail, artist.name)}
                className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-7 py-4 text-[13px] uppercase tracking-[0.1em] text-white shadow-[0_10px_28px_var(--pk-glow)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex-none min-w-0"
                style={headlineStyle}
              >
                <Mail className="h-[17px] w-[17px]" strokeWidth={2} />
                Book {artist.name}
              </a>
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex flex-wrap gap-2.5">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Icon className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>
          )}
        </div>
      </header>


      <div className="mx-auto max-w-[1080px] px-5 pb-24 sm:px-8 lg:pb-16">
        {order.map((key) => sections[key])}

        <CoSignCard artistName={artist.name} cosign={kit.cosign} />

        <section className="pt-12 sm:pt-16">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_100%_at_100%_0%,rgba(245,166,35,.13),transparent_55%),radial-gradient(120%_100%_at_0%_100%,var(--pk-glow),transparent_55%),linear-gradient(180deg,var(--pk-tint),var(--pk-bg-deep))] p-7 sm:p-10">
            <div className="max-w-[560px]">
              <Image
                src="/images/logo.svg"
                alt="Songdis"
                width={108}
                height={39}
                className="mb-5 h-7 w-auto object-contain"
              />
              <h3
                className="mb-3 text-[21px] uppercase leading-tight text-white sm:text-[26px]"
                style={headlineStyle}
              >
                The operating system for artists &amp; labels.
              </h3>
              <p className="mb-6 text-[14.5px] leading-relaxed text-[var(--pk-text-soft)]">
                Upload your music to Spotify, Apple Music &amp; more, access pro
                tools, keep 100% ownership, and earn in any currency.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[var(--pk-accent)] px-6 py-3.5 text-[13px] uppercase tracking-[0.14em] text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
                style={headlineStyle}
              >
                Get started
                <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center sm:pt-12">
          <div className="mx-auto max-w-[420px]">
            <ShareButton
              title={`${artist.name} — Press Kit`}
              label="Share this press kit"
            />
          </div>
          <p className="mt-5 text-[12.5px] text-[var(--pk-muted-2)]">
            Distributed by{" "}
            <Link href="/" className="font-semibold text-[var(--pk-muted)] hover:text-[var(--pk-text)]">
              Songdis
            </Link>
          </p>
        </footer>
      </div>

      {bookingEmail && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-[linear-gradient(180deg,transparent,var(--pk-bg)_34%)] px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6 lg:hidden">
          <a
            href={bookingMailto(bookingEmail, artist.name)}
            className="flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[13.5px] uppercase tracking-[0.1em] text-white shadow-[0_10px_30px_var(--pk-glow)]"
            style={headlineStyle}
          >
            <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
            Book {artist.name}
          </a>
        </div>
      )}
    </main>
  );
}
