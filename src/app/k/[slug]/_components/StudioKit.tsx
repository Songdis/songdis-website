import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, HeartHandshake, Mail, Pencil, Play } from "lucide-react";
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
  type PressKitSectionKey,
  type PublicPressKit,
} from "@/lib/api/press-kit-public";
import { EPK_ORIGIN } from "@/lib/epk";
import { PRESS_KIT_THEMES } from "../_theme";
import { bookingMailto } from "../_format";
import { studioBody, studioDisplay } from "../_studioFonts";
import BioCard from "./BioCard";
import CoSignCard from "./CoSignCard";
import JoinCard from "./JoinCard";
import { EpkWordmark } from "./PressKitChrome";
import ShareButton from "./ShareButton";
import SpotlightRail from "./SpotlightRail";
import StudioReleases, { type StudioRelease } from "./StudioReleases";

/*
 * "Studio": the press kit design (the classic one is still at ?look=classic). Same content, same order and the same Co-sign / Stay close / booking parts —
 * only the styling differs: light and airy, an expressive display face, the artist's own
 * colour as the accent, the photo as a tilted print, music as a swipeable row of covers.
 */

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Light-page palette from the artist's theme: deep shade for ink-on-white, light one for tints. */
function studioVars(theme: string): CSSProperties {
  const t = PRESS_KIT_THEMES[theme as keyof typeof PRESS_KIT_THEMES] ?? PRESS_KIT_THEMES.blaze;
  const strong = theme === "mono" ? "#151515" : theme === "blaze" ? t.accent : t.accentDeep;
  return {
    "--pk-bg": "#F5F4F1",
    "--pk-bg-deep": "#EAE8E3",
    "--pk-tint": hexToRgba(t.accent, 0.16),
    "--pk-accent": strong,
    "--pk-accent-deep": strong,
    "--pk-glow": hexToRgba(strong, 0.22),
    "--pk-gold": strong,
    "--pk-text": "#151515",
    "--pk-text-soft": "#3A3A3A",
    "--pk-muted": "#5E5E5E",
    "--pk-muted-2": "#767676",
    "--pk-surface": "#FFFFFF",
    "--pk-line": "rgba(0,0,0,0.09)",
    "--pk-headline": "var(--font-studio-display)",
  } as CSSProperties;
}

const display: CSSProperties = { fontFamily: "var(--font-studio-display)" };

function Label({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2.5 text-[15px] font-bold lowercase tracking-[-0.01em] text-[var(--pk-text)]" style={display}>
      <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[var(--pk-accent)]" />
      {children}
    </h2>
  );
}

function ReleaseLink({
  slug,
  id,
  url,
  className,
  children,
}: {
  slug: string | null;
  id: number;
  url: string | null;
  className?: string;
  children: ReactNode;
}) {
  // Added releases link out; SongDis releases have their own page (see PressKitView).
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={`/k/${slug}/r/${id}`} className={className}>
      {children}
    </Link>
  );
}

function resolveOrder(kit: PublicPressKit): PressKitSectionKey[] {
  const ordered = kit.kit.section_order.length > 0 ? kit.kit.section_order : [...DEFAULT_SECTION_ORDER];
  const hidden = new Set(kit.kit.hidden_sections);
  const out = ordered.filter((k) => !hidden.has(k));
  if (!out.includes("join") && !hidden.has("join") && !ordered.includes("join")) {
    const at = out.indexOf("cosign");
    out.splice(at < 0 ? out.length : at, 0, "join");
  }
  if (!out.includes("cosign") && !hidden.has("cosign")) out.push("cosign");
  // The facts live in the hero here, so the separate "at a glance" block is not repeated.
  return out.filter((k) => k !== "glance");
}

export default function StudioKit({
  kit,
  brand,
  shareUrl,
  onEdit,
}: {
  kit: PublicPressKit;
  brand: "songdis" | "getepk";
  shareUrl?: string;
  /** Set in the editor's preview: shows an Edit button and leaves out the fixed phone bar. */
  onEdit?: () => void;
}) {
  const epk = brand === "getepk";
  const { artist, kit: cfg, photos, spotlights, releases } = kit;
  const cover = artist.cover_image_url ?? artist.avatar_url;
  const bookingEmail = cfg.contacts.bookings ?? cfg.contacts.management ?? cfg.contacts.press;
  const cosignEnabled = kit.cosign.enabled && !cfg.hidden_sections.includes("cosign");
  const featured = releases.featured;

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

  const chips = [cfg.facts.genre, cfg.facts.based_in].filter((v): v is string => Boolean(v));
  const contacts = [
    { label: "Bookings", email: cfg.contacts.bookings },
    { label: "Management", email: cfg.contacts.management },
    { label: "Press & sync", email: cfg.contacts.press },
  ].flatMap((c) => (c.email ? [{ label: c.label, email: c.email }] : []));

  const allReleases: StudioRelease[] = [
    ...(featured
      ? [{ id: featured.id, title: featured.title, cover: featured.cover, spotify_url: featured.spotify_url ?? null,
          type: featured.type ?? null, released_on: featured.released_on ?? null,
          year: featured.released_on?.slice(0, 4) ?? null, isFeatured: true }]
      : []),
    ...releases.others.map((r) => ({ id: r.id, title: r.title, cover: r.cover, spotify_url: r.spotify_url ?? null,
      type: null, released_on: null, year: r.year ?? null, isFeatured: false })),
  ];

  const sections: Partial<Record<PressKitSectionKey, ReactNode>> = {
    bio: !artist.bio ? null : (
      <section key="bio" className="pt-14 sm:pt-20">
        <Label>the story</Label>
        <div className="max-w-[760px] text-[17px] leading-[1.7] text-[var(--pk-text-soft)]">
          <BioCard bio={artist.bio} />
        </div>
      </section>
    ),

    listen: allReleases.length === 0 ? null : (
      <section key="listen" className="pt-14 sm:pt-20">
        <Label>listen</Label>
        <StudioReleases slug={artist.slug} releases={allReleases} />
      </section>
    ),

    press: cfg.quotes.length === 0 && cfg.placements.length === 0 ? null : (
      <section key="press" className="pt-14 sm:pt-20">
        <Label>what people say</Label>
        {cfg.quotes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {cfg.quotes.map((q, i) => (
              <blockquote
                key={`${q.quote.slice(0, 20)}-${i}`}
                className={`rounded-[26px] p-6 sm:p-7 ${i % 2 === 0 ? "bg-[var(--pk-tint)] text-[var(--pk-text)]" : "bg-[#151515] text-white"}`}
              >
                <p className="text-[20px] font-bold leading-snug tracking-[-0.01em] sm:text-[23px]" style={display}>
                  “{q.quote.trim().replace(/^["“”']+|["“”']+$/g, "")}”
                </p>
                {(q.source || q.year) && (
                  <footer className={`mt-4 text-[14px] ${i % 2 === 0 ? "text-[var(--pk-muted)]" : "text-white/65"}`}>
                    {[q.source, q.year].filter(Boolean).join(", ")}
                  </footer>
                )}
              </blockquote>
            ))}
          </div>
        )}
        {cfg.placements.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {cfg.placements.map((p, i) => (
              <span key={`${p.label}-${i}`} className="rounded-full border border-[var(--pk-line)] bg-white px-4 py-2 text-[13.5px] font-semibold text-[var(--pk-text-soft)]">
                {p.label}
              </span>
            ))}
          </div>
        )}
      </section>
    ),

    photos: photos.length === 0 ? null : (
      <section key="photos" className="pt-14 sm:pt-20">
        <Label>photos</Label>
        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
          {photos.map((p, i) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className={`mb-3 block overflow-hidden rounded-[20px] bg-[var(--pk-tint)] sm:mb-4 ${i % 3 === 1 ? "sm:rotate-[1.2deg]" : i % 3 === 2 ? "sm:-rotate-[1deg]" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${artist.name} press photo`} loading="lazy" referrerPolicy="no-referrer" className="w-full transition duration-500 hover:scale-[1.03]" />
            </a>
          ))}
        </div>
      </section>
    ),

    live: spotlights.length === 0 ? null : (
      <section key="live" className="pt-14 sm:pt-20">
        <Label>live & moments</Label>
        <SpotlightRail items={spotlights} />
      </section>
    ),

    contact: contacts.length === 0 ? null : (
      <section key="contact" className="pt-14 sm:pt-20">
        <Label>get in touch</Label>
        <div className="divide-y divide-[var(--pk-line)] overflow-hidden rounded-[24px] border border-[var(--pk-line)] bg-white">
          {contacts.map((c) => (
            <a key={c.label} href={bookingMailto(c.email, artist.name)} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--pk-tint)] sm:px-6 sm:py-5">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-[var(--pk-muted)]">{c.label}</span>
                <span className="block truncate text-[17px] font-semibold text-[var(--pk-text)]">{c.email}</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--pk-muted-2)] transition group-hover:text-[var(--pk-accent)]" />
            </a>
          ))}
        </div>
      </section>
    ),

    kit: (
      <section key="kit" className="pt-10">
        <a href={`/k/${artist.slug}/pdf`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-[var(--pk-line)] bg-white px-5 py-3 text-[14px] font-semibold text-[var(--pk-text)] transition hover:border-[var(--pk-accent)]">
          Download the full press kit <ArrowUpRight className="h-4 w-4" />
        </a>
      </section>
    ),

    join: (
      <div key="join" className="pt-6 [&_input:not([type=checkbox])]:!bg-white [&_input]:!text-[#151515] [&_input]:!border-[rgba(0,0,0,0.12)]">
        <JoinCard artistName={artist.name} artistSlug={artist.slug} />
      </div>
    ),

    cosign: (
      <div key="cosign" className="pt-6 [&_input]:!bg-white [&_input]:!text-[#151515] [&_input]:!border-[rgba(0,0,0,0.12)]">
        <CoSignCard artistName={artist.name} artistSlug={artist.slug} cosign={kit.cosign} />
      </div>
    ),
  };

  return (
    <div
      style={studioVars(cfg.theme)}
      className={`${studioDisplay.variable} ${studioBody.variable} relative min-h-screen overflow-x-clip bg-[var(--pk-bg)] text-[var(--pk-text)]`}
    >
      <div style={{ fontFamily: "var(--font-studio-body)" }} className="pt-3">
        {/* Floating top bar */}
        <div className={`${onEdit ? "relative" : "sticky top-3"} z-30 mx-auto flex max-w-[1080px] items-center justify-between rounded-full bg-[#151515]/90 px-4 py-2 text-white backdrop-blur sm:mx-auto sm:px-5`} style={{ marginInline: "max(12px, calc((100% - 1080px) / 2))" }}>
          {epk ? (
            <Link href={EPK_ORIGIN} aria-label="getepk home" className="text-white">
              <EpkWordmark className="text-[20px]" />
            </Link>
          ) : (
            <Link href="/" aria-label="Songdis home">
              <Image src="/images/logo.svg" alt="Songdis" width={90} height={32} className="h-7 w-auto" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#151515] hover:bg-[var(--pk-tint)]"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </button>
            )}
            <ShareButton
              variant="icon"
              title={`${artist.name}'s press kit`}
              url={shareUrl}
              className="!border-white/25 !bg-white/10 !text-white hover:!bg-white/20"
            />
          </div>
        </div>

        {/* Hero */}
        <header className="mx-auto grid max-w-[1080px] items-center gap-10 px-5 pb-6 pt-10 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:pt-16">
          <div className="order-2 md:order-1">
            {artist.eyebrow && (
              <p className="mb-4 inline-block rounded-full bg-[var(--pk-tint)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--pk-text-soft)]">
                {artist.eyebrow}
              </p>
            )}
            <h1 className="break-words text-[clamp(3rem,11vw,6rem)] font-extrabold leading-[0.92] tracking-[-0.03em] text-[var(--pk-text)]" style={display}>
              {artist.name}
            </h1>
            {(chips.length > 0 || cfg.facts.for_fans_of) && (
              <div className="mt-6 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <span key={c} className="rounded-full bg-white px-3.5 py-1.5 text-[14px] font-semibold text-[var(--pk-text)] shadow-[0_1px_0_rgba(0,0,0,.06)]">
                    {c}
                  </span>
                ))}
                {cfg.facts.for_fans_of && (
                  <span className="rounded-full border border-dashed border-[var(--pk-line)] px-3.5 py-1.5 text-[14px] text-[var(--pk-muted)]">
                    for fans of {cfg.facts.for_fans_of}
                  </span>
                )}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {bookingEmail && (
                <a
                  href={bookingMailto(bookingEmail, artist.name)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#151515] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:bg-[var(--pk-accent)]"
                >
                  <Mail className="h-4 w-4" /> Book {artist.name}
                </a>
              )}
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--pk-line)] bg-white text-[var(--pk-text)] transition hover:border-[var(--pk-accent)] hover:text-[var(--pk-accent)]"
                >
                  <Icon className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>
          </div>

          {/* The photo as a print, with the latest release pinned to it */}
          <div className="relative order-1 mx-auto w-full max-w-[440px] md:order-2">
            <div aria-hidden className="absolute -right-3 -top-3 h-full w-full rotate-[4deg] rounded-[34px] bg-[var(--pk-tint)]" />
            <div className="relative -rotate-[2deg] overflow-hidden rounded-[34px] bg-[#151515] shadow-[0_30px_60px_-30px_rgba(0,0,0,.55)]">
              <div className="relative aspect-[4/5]">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt={artist.name} referrerPolicy="no-referrer" className="h-full w-full object-cover object-[50%_25%]" />
                )}
              </div>
            </div>
            <span className="absolute -left-2 top-6 rotate-[-8deg] rounded-full bg-[var(--pk-accent)] px-4 py-2 text-[13px] font-bold text-white shadow" style={display}>
              press kit
            </span>
            {featured && (
              <ReleaseLink
                slug={artist.slug}
                id={featured.id}
                url={featured.spotify_url}
                className="absolute -bottom-5 left-3 right-10 flex items-center gap-3 rounded-[20px] bg-white p-2.5 pr-4 shadow-[0_16px_36px_-18px_rgba(0,0,0,.5)] transition hover:-translate-y-0.5 sm:left-6"
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--pk-tint)]">
                  {featured.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.cover} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] text-[var(--pk-muted)]">Now playing</span>
                  <span className="block truncate text-[15px] font-bold text-[var(--pk-text)]" style={display}>{featured.title}</span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--pk-accent)] text-white">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-current" strokeWidth={0} />
                </span>
              </ReleaseLink>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-[1080px] px-5 pb-28 sm:px-8 lg:pb-16">
          {resolveOrder(kit).map((key) => sections[key] ?? null)}

          {/* Promos */}
          <section className="grid gap-4 pt-16 sm:grid-cols-2">
            {epk && (
              <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,.05)]">
                <div>
                  <p className="text-[13px] text-[var(--pk-muted)]">Made with getepk</p>
                  <p className="mt-2 text-[26px] font-extrabold leading-[1.05] tracking-[-0.02em]" style={display}>
                    Your music deserves a page like this.
                  </p>
                </div>
                <a href={`${EPK_ORIGIN}/sign-up`} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#151515] px-5 py-3 text-[14px] font-semibold text-white hover:bg-[var(--pk-accent)]">
                  Make yours, free <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            )}
            <div className={`flex flex-col justify-between gap-6 rounded-[28px] bg-[#151515] p-7 text-white ${epk ? "" : "sm:col-span-2"}`}>
              <div>
                <Image src="/images/logo.svg" alt="Songdis" width={96} height={34} className="h-7 w-auto" />
                <p className="mt-4 text-[22px] font-bold leading-[1.15] tracking-[-0.01em]" style={display}>
                  Release on Spotify, Apple Music and 200+ stores. Keep 100%. Get paid in your currency.
                </p>
              </div>
              <a href={epk ? "https://songdis.com/sign-up" : "/sign-up"} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#151515] hover:bg-[var(--pk-tint)]">
                Release with SongDis <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>

          <footer className="pt-10 text-center text-[13px] text-[var(--pk-muted)]">
            <ShareButton title={`${artist.name}'s press kit`} label="Share this press kit" url={shareUrl} />
            <p className="mt-5">
              {epk ? (
                <>
                  Made with <a href={EPK_ORIGIN} className="text-[var(--pk-text)]"><EpkWordmark /></a> by{" "}
                  <a href="https://songdis.com" className="font-semibold text-[var(--pk-text)]">Songdis</a>
                </>
              ) : (
                <>
                  Distributed by <Link href="/" className="font-semibold text-[var(--pk-text)]">Songdis</Link>
                </>
              )}
            </p>
          </footer>
        </main>

        {/* Phone: booking and co-sign always within reach */}
        {(bookingEmail || cosignEnabled) && !onEdit && (
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 bg-[linear-gradient(180deg,transparent,var(--pk-bg)_38%)] px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6 lg:hidden">
            {cosignEnabled && (
              <a href="#cosign" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--pk-accent)] px-5 py-4 text-[15px] font-semibold text-white shadow-[0_10px_26px_var(--pk-glow)]">
                <HeartHandshake className="h-[18px] w-[18px]" /> Co-sign
              </a>
            )}
            {bookingEmail && (
              <a href={bookingMailto(bookingEmail, artist.name)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#151515] px-5 py-4 text-[15px] font-semibold text-white">
                <Mail className="h-[18px] w-[18px]" /> Book
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
