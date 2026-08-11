import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";

import { getPublicPressKit } from "@/lib/api/press-kit-public";
import { headlineStyle, pressKitThemeVars } from "./_theme";
import { SITE_ORIGIN, bookingMailto, summarise } from "./_format";
import PressKitView from "./_components/PressKitView";
import ShareButton from "./_components/ShareButton";

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

export default async function PressKitPage({ params }: Params) {
  const { slug } = await params;
  const kit = await getPublicPressKit(slug);

  if (!kit) notFound();

  const { artist, kit: cfg } = kit;
  const bookingEmail =
    cfg.contacts.bookings ?? cfg.contacts.management ?? cfg.contacts.press;

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

      <PressKitView kit={kit} />

      <div className="mx-auto max-w-[1080px] px-5 pb-24 sm:px-8 lg:pb-16">
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
