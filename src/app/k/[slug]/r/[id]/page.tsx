import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { FaApple, FaSpotify, FaYoutube } from "react-icons/fa6";

import {
  getPublicPressKit,
  getPublicPressKitRelease,
} from "@/lib/api/press-kit-public";
import { headlineStyle, pressKitThemeVars } from "../../_theme";
import {
  SITE_ORIGIN,
  formatReleaseDate,
  formatReleaseType,
  summarise,
} from "../../_format";
import PreviewPlayer from "../../_components/PreviewPlayer";
import ShareButton from "../../_components/ShareButton";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, id } = await params;
  const [kit, release] = await Promise.all([
    getPublicPressKit(slug),
    getPublicPressKitRelease(slug, id),
  ]);

  if (!kit || !release) {
    return {
      title: "Release not found — Songdis",
      robots: { index: false, follow: false },
    };
  }

  const title = `${release.title} — ${kit.artist.name}`;
  const meta = [
    formatReleaseType(release.type),
    formatReleaseDate(release.released_on),
  ]
    .filter(Boolean)
    .join(" · ");
  const description =
    summarise([release.credits, meta].filter(Boolean).join(" — ")) ??
    `${release.title} by ${kit.artist.name}.`;
  const image = release.cover ?? kit.artist.cover_image_url ?? null;
  const url = `${SITE_ORIGIN}/k/${kit.artist.slug}/r/${release.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "music.album",
      siteName: "Songdis",
      url,
      title,
      description,
      images: image ? [{ url: image, alt: release.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ReleaseDetailPage({ params }: Params) {
  const { slug, id } = await params;
  const [kit, release] = await Promise.all([
    getPublicPressKit(slug),
    getPublicPressKitRelease(slug, id),
  ]);

  if (!kit || !release) notFound();

  const { artist } = kit;
  const dateLine = [
    formatReleaseType(release.type),
    formatReleaseDate(release.released_on),
  ]
    .filter(Boolean)
    .join(" · ");

  const dsps = (
    [
      {
        href: release.links.spotify,
        name: "Spotify",
        Icon: FaSpotify,
        chip: "bg-[#1DB954] text-black",
      },
      {
        href: release.links.apple_music,
        name: "Apple Music",
        Icon: FaApple,
        chip: "bg-[linear-gradient(135deg,#FA57C1,#E5342F)] text-white",
      },
      {
        href: release.links.youtube_music,
        name: "YouTube Music",
        Icon: FaYoutube,
        chip: "bg-[#FF0000] text-white",
      },
    ] as const
  ).filter((d): d is typeof d & { href: string } => Boolean(d.href));

  return (
    <main
      style={pressKitThemeVars(kit.kit.theme, kit.kit.headline_font)}
      className="relative min-h-screen overflow-x-clip bg-[var(--pk-bg)] font-body text-[var(--pk-text)]"
    >
      <div className="sticky top-0 z-20 bg-[linear-gradient(180deg,var(--pk-bg)_72%,transparent)] backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-[1080px] items-center gap-3.5 px-5 py-4 sm:px-8">
          <Link
            href={`/k/${artist.slug}`}
            aria-label={`Back to ${artist.name}`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--pk-line)] bg-[var(--pk-surface)] text-[var(--pk-text)] transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
          >
            <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
          <div
            className="min-w-0 flex-1 truncate text-[14px] uppercase tracking-wide text-[var(--pk-text)] sm:text-[15px]"
            style={headlineStyle}
          >
            {release.title}
          </div>
          <ShareButton
            variant="icon"
            title={`${release.title} — ${artist.name}`}
          />
        </div>
      </div>

      <div className="mx-auto max-w-[1080px] px-5 pb-20 pt-2 sm:px-8 lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-12 lg:pt-6">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="aspect-square w-full overflow-hidden rounded-3xl bg-[var(--pk-tint)] shadow-[0_24px_60px_rgba(0,0,0,.55)]">
            {release.cover && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={release.cover}
                alt={release.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="mt-7 lg:mt-0">
          <h1
            className="text-[clamp(1.6rem,6vw,2.6rem)] uppercase leading-[1.02] text-[var(--pk-text)]"
            style={headlineStyle}
          >
            {release.title}
          </h1>

          <p className="mt-3 text-[15px] text-[var(--pk-text-soft)]">
            {release.credits ?? artist.name}
          </p>
          {dateLine && (
            <p className="mt-1 text-[13.5px] text-[var(--pk-muted-2)]">
              {dateLine}
            </p>
          )}

          {release.preview_url && (
            <div className="mt-6">
              <PreviewPlayer src={release.preview_url} title={release.title} />
            </div>
          )}

          {release.release_link && (
            <a
              href={release.release_link}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[13.5px] uppercase tracking-[0.1em] text-white shadow-[0_10px_30px_var(--pk-glow)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={headlineStyle}
            >
              <Play className="h-[17px] w-[17px] fill-current" strokeWidth={0} aria-hidden />
              Stream here
            </a>
          )}

          {dsps.length > 0 && (
            <section className="mt-8">
              <h2
                className="mb-3.5 text-[11px] uppercase tracking-[0.24em] text-[var(--pk-muted)]"
                style={headlineStyle}
              >
                Listen on
              </h2>
              <div className="flex flex-col gap-2.5">
                {dsps.map(({ href, name, Icon, chip }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3.5 rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)] px-4 py-3.5 transition hover:border-[var(--pk-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pk-accent)]"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${chip}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-[var(--pk-text)] min-w-0">
                      {name}
                    </span>
                    <span className="text-[13px] font-semibold text-[var(--pk-muted)]">
                      Open ›
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {release.tracks.length > 0 && (
            <section className="mt-9">
              <h2
                className="mb-3.5 text-[11px] uppercase tracking-[0.24em] text-[var(--pk-muted)]"
                style={headlineStyle}
              >
                Tracks
              </h2>
              <ol className="overflow-hidden rounded-2xl border border-[var(--pk-line)] bg-[var(--pk-surface)]">
                {release.tracks.map((t, i) => (
                  <li
                    key={`${t.title}-${i}`}
                    className="flex items-center gap-3.5 border-b border-[var(--pk-line)] px-4 py-3.5 last:border-b-0"
                  >
                    <span className="w-5 shrink-0 text-[13px] tabular-nums text-[var(--pk-muted-2)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold text-[var(--pk-text)]">
                        {t.title}
                      </span>
                    </span>
                    {t.duration && (
                      <span className="shrink-0 text-[13px] tabular-nums text-[var(--pk-muted)]">
                        {t.duration}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}


          <div className="mt-9">
            <ShareButton
              title={`${release.title} — ${artist.name}`}
              label="Share this release"
              url={release.release_link ?? undefined}
            />
          </div>

          <p className="mt-6 text-center text-[12.5px] text-[var(--pk-muted-2)] lg:text-left">
            From the{" "}
            <Link
              href={`/k/${artist.slug}`}
              className="font-semibold text-[var(--pk-accent)] hover:underline"
            >
              {artist.name} press kit
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
