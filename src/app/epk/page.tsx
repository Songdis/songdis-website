import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EpkWordmark } from "@/app/k/[slug]/_components/PressKitChrome";
import { EPK_DOMAIN, epkKitUrl } from "@/lib/epk";
import ClaimLink from "./_components/ClaimLink";

/*
 * getepk.si landing.
 *
 * The page is built out of real press kits, not illustrations of one: every artist here
 * has a live kit and agreed to be shown. Their facts are copied from those kits.
 */

const ARTISTS = [
  {
    slug: "msjorji",
    name: "MsJorji",
    image: "/epk/msjorji.jpg",
    line: "Afro Trap · Texas",
    note: "Spotify New Music Friday. Apple Music Rap Central.",
  },
  {
    slug: "mollythevibe",
    name: "Mollythevibe",
    image: "/epk/mollythevibe.jpg",
    line: "Afro R&B · Lagos",
    note: "284K monthly listeners on Spotify.",
  },
  {
    slug: "kdiv-coco",
    name: "Kdiv Coco",
    image: "/epk/kdiv-coco.jpg",
    line: "Afrobeats · Lagos",
    note: "For fans of Rema, Omah Lay, Victony.",
  },
  {
    slug: "r33nzo",
    name: "R33NZO",
    image: "/epk/r33nzo.jpg",
    line: "Afro-fusion",
    note: "“2016”, with bigaj!",
  },
] as const;

const PARTS = [
  ["The story", "A bio written for press, in the third person, with where you're from and who you sound like."],
  ["The music", "Every release, newest first. Songs on SongDis appear on their own; anything else, paste a link."],
  ["The photos", "Press shots a blog can download at full size, without asking you on WhatsApp."],
  ["The receipts", "Quotes, playlists and placements. The things that make a booker say yes."],
  ["The button", "One tap to email you about a show. It's at the bottom of every screen on a phone."],
  ["The fans", "Co-sign: supporters can back you with money, straight from your kit."],
] as const;

export default function EpkLanding() {
  return (
    <main className="bg-[#F4F1EA] text-[#121110] selection:bg-[#FF5A1F] selection:text-black">
      {/* Nav */}
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="getepk home">
          <EpkWordmark className="text-[26px]" />
        </Link>
        <nav className="flex items-center gap-1.5 text-[14px]">
          <Link href="/sign-in" className="rounded-full px-4 py-2 text-black/65 hover:text-black">
            Sign in
          </Link>
          <Link href="/sign-up" className="rounded-full bg-[#121110] px-4 py-2 font-medium text-white hover:bg-black">
            Make your EPK
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1180px] gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-16">
        <div>
          <p className="mb-6 text-[13px] font-medium uppercase tracking-[0.16em] text-black/45">
            Electronic press kits for artists
          </p>
          <h1 className="text-[56px] leading-[0.95] tracking-[-0.02em] sm:text-[80px] lg:text-[96px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            Stop sending a <span className="italic text-black/35 line-through decoration-[#FF5A1F] decoration-[3px]">Drive folder</span>.{" "}
            Send <span className="italic">a link.</span>
          </h1>
          <p className="mt-7 max-w-[470px] text-[18px] leading-relaxed text-black/65">
            Your bio, your music, your photos, your press and a booking button. On one page a
            blogger will actually open. Made in about ten minutes, and free.
          </p>
          <div className="mt-9">
            <ClaimLink />
            <p className="mt-3 pl-5 text-[13px] text-black/45">
              Already on SongDis? Sign in with the same account. Your releases are already there.
            </p>
          </div>
        </div>

        {/* Real kits, stacked like printouts on a desk */}
        <div className="relative mx-auto h-[330px] w-full max-w-[520px] sm:h-[420px]">
          {ARTISTS.slice(0, 3).map((a, i) => (
            <Link
              key={a.slug}
              href={epkKitUrl(a.slug)}
              className="group absolute w-[50%] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_60px_-25px_rgba(0,0,0,.45)] ring-1 ring-black/5 transition-transform duration-300 hover:z-10 hover:-translate-y-2"
              style={{
                left: ["0%", "25%", "50%"][i],
                top: ["9%", "0%", "13%"][i],
                transform: `rotate(${[-6, 1.5, 7][i]}deg)`,
                zIndex: [1, 2, 3][i],
              }}
            >
              <div className="relative aspect-[4/5]">
                <Image src={a.image} alt={a.name} fill sizes="300px" className="object-cover" priority={i === 2} />
              </div>
              <div className="flex items-end justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">{a.name}</p>
                  <p className="truncate text-[12.5px] text-black/50">{a.line}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-black/30 transition group-hover:text-[#FF5A1F]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* The problem, said plainly */}
      <section className="bg-[#121110] text-[#F4F1EA]">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
          <h2 className="text-[40px] leading-[1.02] tracking-[-0.01em] sm:text-[56px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            “Send me your EPK.”
            <br />
            <span className="italic text-white/40">You have twelve minutes.</span>
          </h2>
          <div className="space-y-5 text-[17px] leading-relaxed text-white/65 lg:pt-3">
            <p>
              A promoter in Accra liked your set. A blog in London wants to feature you. A
              playlist curator asked for “something with your story”. Each of them gets a
              Google Drive link with eleven files named IMG_4471.
            </p>
            <p>
              Nobody downloads a folder. They open a link, scroll for thirty seconds, and decide.
              getepk is that link: everything they need, on their phone, in the order they need it.
            </p>
          </div>
        </div>
      </section>

      {/* Anatomy of a kit */}
      <section className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-[640px] text-[40px] leading-[1.02] sm:text-[56px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            What&apos;s on the page.
          </h2>
          <p className="max-w-[340px] text-[15px] text-black/55">
            Six parts, in the order a booker reads them. Hide any you don&apos;t need; reorder the rest.
          </p>
        </div>
        <ol className="grid border-t border-black/15 sm:grid-cols-2 lg:grid-cols-3">
          {PARTS.map(([title, body], i) => (
            <li key={title} className="border-b border-black/15 py-7 sm:pr-10 lg:[&:nth-child(3n+2)]:px-8 lg:[&:nth-child(3n)]:pl-8">
              <p className="mb-4 font-mono text-[12px] text-black/40">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mb-2 text-[22px] font-semibold tracking-[-0.015em]">{title}</h3>
              <p className="text-[15.5px] leading-relaxed text-black/60">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Wall of real kits */}
      <section className="mx-auto max-w-[1180px] px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="text-[40px] leading-[1.02] sm:text-[56px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            Open a real one.
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ARTISTS.map((a) => (
            <Link key={a.slug} href={epkKitUrl(a.slug)} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-black/5">
                <Image
                  src={a.image}
                  alt={a.name}
                  fill
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold tracking-[-0.01em]">{a.name}</p>
                  <p className="text-[13.5px] text-black/55">{a.note}</p>
                  <p className="mt-1 text-[12.5px] text-black/35 group-hover:text-[#FF5A1F]">
                    {a.slug}.{EPK_DOMAIN}
                  </p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-black/30 transition group-hover:text-[#FF5A1F]" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SongDis */}
      <section className="mx-auto max-w-[1180px] px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="grid gap-8 rounded-[28px] bg-[#140C0C] p-8 text-white sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-[620px]">
            <Image src="/images/logo.svg" alt="SongDis" width={108} height={39} className="mb-6 h-8 w-auto" />
            <h2 className="text-[34px] leading-[1.05] sm:text-[44px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
              getepk is made by SongDis. <span className="italic text-white/45">The music part is too.</span>
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-white/60">
              Put your songs on Spotify, Apple Music and 200+ stores, keep 100% of your
              ownership, and get paid in your own currency. Everything you release lands on
              your press kit by itself.
            </p>
          </div>
          <a
            href="https://songdis.com/sign-up"
            className="inline-flex items-center gap-2 self-start rounded-full bg-[#C30100] px-6 py-3.5 text-[14px] font-semibold text-white transition hover:brightness-110 lg:self-end"
          >
            Release with SongDis
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Close */}
      <section className="bg-[#121110] text-white">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="text-[48px] leading-[0.98] sm:text-[72px]" style={{ fontFamily: "var(--font-epk-serif)" }}>
            Your name is <span className="italic">still free.</span>
          </h2>
          <ClaimLink tone="dark" />
        </div>
        <footer className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-7 text-[13px] text-white/45 sm:px-8">
          <p>
            <EpkWordmark className="text-white" /> by{" "}
            <a href="https://songdis.com" className="text-white/70 hover:text-white">
              SongDis
            </a>
          </p>
          <div className="flex gap-5">
            <a href="https://songdis.com/privacy-policy" className="hover:text-white">Privacy</a>
            <a href="https://songdis.com/terms" className="hover:text-white">Terms</a>
            <Link href="/sign-in" className="hover:text-white">Sign in</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
