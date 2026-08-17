import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Mail, Pencil } from "lucide-react";

import type { PublicPressKit } from "@/lib/api/press-kit-public";
import { headlineStyle, pressKitThemeVars } from "../_theme";
import { bookingMailto } from "../_format";
import ShareButton from "./ShareButton";

interface PressKitChromeProps {
  kit: PublicPressKit;
  children: ReactNode;
  /**
   * Renders an "Edit" button in the nav and omits the fixed mobile booking bar.
   * Set when the page is being shown inside the editor's preview.
   */
  onEdit?: () => void;
  /** The public URL to share. Defaults to the current page — only pass this in the dashboard, where the current page is the editor, not the kit. */
  shareUrl?: string;
}

/**
 * The Songdis chrome that wraps a press kit: the top nav overlay, the
 * CTA/footer block and the mobile booking bar. Shared by the public route and the
 * dashboard's live preview so the preview is exactly the public page — the only
 * difference is an "Edit" button in the nav when `onEdit` is set.
 */
export default function PressKitChrome({
  kit,
  children,
  onEdit,
  shareUrl,
}: PressKitChromeProps) {
  const { artist, kit: cfg } = kit;
  const bookingEmail =
    cfg.contacts.bookings ?? cfg.contacts.management ?? cfg.contacts.press;

  // Mirrors CoSignCard's own guard: a kit with co-sign off renders no card, so the bar
  // must not offer a button that scrolls to nothing. Also respects the section being
  // hidden — the anchor would exist but the fan chose not to see it.
  const cosignEnabled =
    kit.cosign.enabled && !cfg.hidden_sections.includes("cosign");

  return (
    <div
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
          <div className="flex items-center gap-2.5">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--pk-accent)] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_6px_18px_var(--pk-glow)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={headlineStyle}
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                Edit
              </button>
            )}
            <ShareButton
              variant="icon"
              title={`${artist.name} — Press Kit`}
              url={shareUrl}
            />
          </div>
        </div>
      </div>

      {children}

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
              url={shareUrl}
            />
          </div>
          <p className="mt-5 text-[12.5px] text-[var(--pk-muted-2)]">
            Distributed by{" "}
            <Link
              href="/"
              className="font-semibold text-[var(--pk-muted)] hover:text-[var(--pk-text)]"
            >
              Songdis
            </Link>
          </p>
        </footer>
      </div>

      {/* The floating bar. Co-sign leads when it is enabled — it is the action a fan can
          complete on the spot, where booking is a promoter's job — and booking keeps the
          same bar as a compact secondary rather than being displaced by it. With co-sign
          off this is byte-for-byte the bar that shipped before. */}
      {(bookingEmail || cosignEnabled) && !onEdit && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2.5 bg-[linear-gradient(180deg,transparent,var(--pk-bg)_34%)] px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-6 lg:hidden">
          {cosignEnabled && (
            <a
              href="#cosign"
              className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[13.5px] uppercase tracking-[0.1em] text-white shadow-[0_10px_30px_var(--pk-glow)]"
              style={headlineStyle}
            >
              <HeartHandshake className="h-[18px] w-[18px]" strokeWidth={2} />
              Co-sign {artist.name}
            </a>
          )}

          {bookingEmail && (
            <a
              href={bookingMailto(bookingEmail, artist.name)}
              aria-label={`Book ${artist.name}`}
              className={
                cosignEnabled
                  ? "grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border border-[var(--pk-line)] bg-[var(--pk-surface)] text-[var(--pk-text)]"
                  : "flex flex-1 items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(180deg,var(--pk-accent),var(--pk-accent-deep))] px-6 py-4 text-[13.5px] uppercase tracking-[0.1em] text-white shadow-[0_10px_30px_var(--pk-glow)]"
              }
              style={cosignEnabled ? undefined : headlineStyle}
            >
              <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
              {!cosignEnabled && `Book ${artist.name}`}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
