import Image from "next/image";
import Link from "next/link";
import { EpkWordmark } from "@/app/k/[slug]/_components/PressKitChrome";
import { epkKitUrl } from "@/lib/epk";
import ClaimLink from "./_components/ClaimLink";
import { Arrow, KITS, KitPhone, PosterButton } from "./_components/Poster";

/*
 * getepk.si landing. Built from real kits: every artist shown has a live EPK and agreed to
 * be featured. Claims match what the product does today — Spotify import, SongDis releases
 * appearing on their own, a nightly check for new Spotify drops, co-signs by card or transfer.
 */

const Tick = () => (
  <span className="grid h-6 w-6 shrink-0 place-items-center bg-[#FF77CD]">
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#101010" strokeWidth="3">
      <path d="M5 12l5 5 9-10" />
    </svg>
  </span>
);

const Squiggle = ({ color }: { color: string }) => (
  <svg aria-hidden="true" viewBox="0 0 300 30" preserveAspectRatio="none" className="absolute -bottom-3 left-0 h-[0.28em] w-full">
    <path d="M4 20 C 60 4, 110 28, 160 14 S 250 6, 296 16" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const INSIDE = [
  ["The music", "Every release, newest first, with covers. Pulled in for you and kept current."],
  ["The photos", "Press shots at full size, one tap to open and save."],
  ["Story + receipts", "Your bio, press quotes, playlist placements and wins. Ayo can draft the bio."],
  ["The button", "One tap to email you about a show. Pinned to the bottom on phones."],
  ["Your own link", "yourname.getepk.si for free, or put it on your own domain."],
  ["Stay close", "Fans leave their email or WhatsApp, and land in your Shout Out list."],
] as const;

const FAQ = [
  ["Is it really free?", "Yes. Your EPK and your getepk.si link are free. No card needed."],
  ["How do you find my music?", "Search your artist name like you would on Spotify and tap “That's me”. We pull in your releases, photo and links. Anything not on Spotify, add with a link."],
  ["Do I have to update it when I drop?", "No. Releases through SongDis appear the day they go live, and we check Spotify every night for new ones."],
  ["Can I use my own domain?", "Yes. Keep your free yourname.getepk.si link, or connect a domain you own, like www.yourname.com."],
  ["How do fans co-sign me?", "They tap Co-sign on your EPK, pick an amount and pay by card or bank transfer. No account needed. The money goes to you."],
  ["I haven't released anything yet", "Start with just your name. When you release with SongDis, your music lands on your EPK by itself."],
] as const;

export default function EpkLanding() {
  return (
    <main className="bg-[#F4F4F4] text-[#101010] selection:bg-[#FF77CD]">
      {/* Nav */}
      <header className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" aria-label="getepk home">
          <EpkWordmark className="text-[26px]" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[14px] font-semibold lg:flex">
          <a href="#how" className="hover:text-[#0038FF]">How it works</a>
          <a href="#inside" className="hover:text-[#0038FF]">What&apos;s inside</a>
          <a href="#cosign" className="hover:text-[#0038FF]">Co-sign</a>
          <a href="#examples" className="hover:text-[#0038FF]">Examples</a>
          <a href="#songdis" className="hover:text-[#0038FF]">SongDis</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-[14px] font-semibold hover:text-[#0038FF]">Sign in</Link>
          <span className="hidden sm:inline-flex">
            <PosterButton href="/sign-up">Get your EPK free</PosterButton>
          </span>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="mx-auto grid max-w-[1280px] gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:pb-24 lg:pt-14">
        <div>
          <p className="el mb-6 text-[12px] text-[#3A3A3A]">Search your name. Your press kit builds itself.</p>
          <h1 className="ed text-[64px] sm:text-[96px] lg:text-[112px]">
            A pro EPK
            <br />
            <span className="whitespace-nowrap">
              in{" "}
              <span className="relative inline-block text-[#0038FF]">
                60 seconds.
                <Squiggle color="#FF77CD" />
              </span>
            </span>
          </h1>
          <p className="mt-9 max-w-[520px] text-[18px] leading-relaxed text-[#3A3A3A]">
            Sign up free, search your artist name, and get an EPK with your releases, photo and links
            already on it. Drop a new song? It shows up by itself.
          </p>
          <div className="mt-8">
            <ClaimLink />
          </div>
          <div className="el mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#3A3A3A]">
            <span>Free</span><span className="text-[#FF77CD]">/</span>
            <span>No card needed</span><span className="text-[#FF77CD]">/</span>
            <span>Updates itself</span><span className="text-[#FF77CD]">/</span>
            <span>Fan co-signs</span>
          </div>
        </div>

        {/* Three real kits, stacked like flyers */}
        <div className="relative mx-auto h-[440px] w-full max-w-[520px] sm:h-[560px]">
          <div aria-hidden className="absolute left-[8%] top-[6%] h-[70%] w-[46%] -rotate-6 bg-[#FF4A2B]" />
          <div aria-hidden className="absolute right-[4%] top-[2%] h-[64%] w-[42%] rotate-6 bg-[#0038FF]" />
          <div aria-hidden className="absolute bottom-[4%] left-[30%] h-[40%] w-[44%] rotate-2 bg-[#FFE08A]" />
          {KITS.slice(0, 3).map((k, i) => (
            <a
              key={k.slug}
              href={epkKitUrl(k.slug)}
              className="group absolute w-[44%] hover:z-10"
              style={{ left: ["2%", "52%", "27%"][i], top: ["10%", "6%", "22%"][i], transform: `rotate(${[-5, 5, -1][i]}deg)`, zIndex: [1, 2, 3][i] }}
            >
              <KitPhone kit={k} priority={i === 2} className="transition-transform duration-300 group-hover:-translate-y-2" />
            </a>
          ))}
          <div className="absolute -left-1 bottom-[10%] z-10 rotate-[-4deg] bg-[#101010] px-4 py-3 text-white sm:left-[-4%]">
            <p className="el text-[10px] text-white/60">Ready in</p>
            <p className="ed text-[40px]">0:42</p>
          </div>
          <div className="absolute right-0 bottom-[2%] z-10 rotate-[3deg] bg-[#FF77CD] px-4 py-3 sm:right-[-2%]">
            <p className="text-[14px] font-bold">New release added</p>
            <p className="text-[12px]">automatically, overnight</p>
          </div>
        </div>
      </section>

      {/* Source strip */}
      <div className="bg-[#101010] py-5 text-[#F4F4F4]">
        <p className="ed mx-auto max-w-[1280px] px-5 text-[28px] sm:px-8 sm:text-[36px]">
          Pulls from <span className="text-[#1ED760]">Spotify</span> <span className="text-white/40">+</span> every release on{" "}
          <span className="text-[#FF77CD]">SongDis</span> <span className="text-white/40">+</span> anything else, by link
        </p>
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
        <p className="el text-[12px] text-[#3A3A3A]">No templates. No uploading songs one by one.</p>
        <h2 className="ed mt-3 text-[64px] sm:text-[92px]">
          Three steps. <span className="text-[#0038FF]">One minute.</span>
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01", t: "0:00", title: "Sign up free", body: "A few seconds. Already on SongDis? Use the same login.",
              art: (
                <div className="flex flex-col gap-2 bg-white p-5">
                  <div className="border-2 border-[#101010] px-3 py-2.5 text-[14px] text-[#6B6B6B]">you@email.com</div>
                  <div className="el flex min-h-[42px] items-center justify-center bg-[#0038FF] text-[12px] text-white">Continue</div>
                  <p className="text-center text-[12px] text-[#6B6B6B]">or Google · or your SongDis login</p>
                </div>
              ),
            },
            {
              n: "02", t: "0:10", title: "Search your name", body: "Just like Spotify search. Tap “That's me” and we pull in your releases, photo and links.",
              art: (
                <div className="bg-[#121212] p-5 text-white">
                  <div className="flex items-center gap-2 rounded-full bg-[#2A2A2A] px-4 py-2.5 text-[14px]">
                    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                    Kdiv Coco
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="relative h-12 w-12 overflow-hidden rounded-full"><Image src="/epk/kdiv-coco.jpg" alt="" fill sizes="48px" className="object-cover" /></span>
                    <span className="flex-1"><span className="block font-bold">Kdiv Coco</span><span className="block text-[12px] text-white/50">On Spotify</span></span>
                    <span className="el rounded-full bg-white px-3 py-1.5 text-[10px] text-[#101010]">That&apos;s me</span>
                  </div>
                </div>
              ),
            },
            {
              n: "03", t: "1:00", title: "Send the link", body: "Ready for bookers, blogs and curators. Add your bio and photos whenever you like.",
              art: (
                <div className="bg-[#101010] p-5 text-[#F4F4F4]">
                  <p className="el text-[10px] text-white/50">Your EPK is live</p>
                  <p className="mt-2 flex items-center justify-between bg-[#F4F4F4] px-3 py-2.5 text-[14px] text-[#101010]">
                    <span>kdiv-coco<span className="text-[#0038FF]">.getepk.si</span></span>
                    <Arrow color="#101010" size={16} />
                  </p>
                  <p className="mt-3 text-[12px] text-white/60">or on your own domain, like <strong className="text-white">www.kdivcoco.com</strong></p>
                </div>
              ),
            },
          ].map((s) => (
            <div key={s.n} className="flex flex-col gap-4 border-2 border-[#101010] bg-[#F4F4F4] p-5">
              <div className="flex items-baseline justify-between">
                <span className="ed text-[44px] text-[#0038FF]">{s.n}</span>
                <span className="el text-[11px] text-[#6B6B6B]">{s.t}</span>
              </div>
              {s.art}
              <div>
                <h3 className="ed text-[34px]">{s.title}</h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-[#3A3A3A]">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Updates itself */}
      <section className="bg-[#0038FF] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="el text-[12px] text-white/70">Always up to date</p>
            <h2 className="ed mt-3 text-[64px] sm:text-[92px]">
              You drop it. <span className="text-[#FFE08A]">It shows up.</span>
            </h2>
            <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-white/80">
              Release through SongDis and it&apos;s on your EPK the day it goes live. Released elsewhere? We
              check Spotify every night and add the new one. The link you sent last month is still current.
            </p>
            <div className="mt-8">
              <PosterButton href="/sign-up" tone="pink">Get your EPK free</PosterButton>
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {[
              ["Friday · 00:00", "Kdiv Coco's new single goes live on Spotify", null],
              ["Saturday · 04:30", "Added to kdiv-coco.getepk.si", "Top of the list. You didn't touch a thing."],
              ["Saturday · 10:30", "A promoter opens the EPK", "And hears the new song first."],
            ].map(([when, what, note], i) => (
              <li key={when} className={`p-5 ${i === 1 ? "bg-[#FF77CD] text-[#101010]" : "bg-[#101010] text-white"}`}>
                <p className={`el text-[10px] ${i === 1 ? "text-[#101010]/70" : "text-white/50"}`}>{when}</p>
                <p className="mt-1.5 text-[18px] font-bold">{what}</p>
                {note && <p className="mt-1 text-[14px] opacity-80">{note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What's inside */}
      <section id="inside" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
        <p className="el text-[12px] text-[#3A3A3A]">Hide any. Reorder all.</p>
        <h2 className="ed mt-3 text-[64px] sm:text-[92px]">
          What&apos;s on <span className="text-[#FF4A2B]">the page.</span>
        </h2>
        <div className="mt-12 grid border-l-2 border-t-2 border-[#101010] sm:grid-cols-2 lg:grid-cols-3">
          {INSIDE.map(([title, body], i) => (
            <div key={title} className="border-b-2 border-r-2 border-[#101010] p-6">
              <p className="ed text-[40px] text-[#0038FF]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="ed mt-3 text-[32px]">{title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-[#3A3A3A]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Co-sign */}
      <section id="cosign" className="bg-[#101010] text-[#F4F4F4]">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="el text-[12px] text-white/60">Fans can do more than stream</p>
            <h2 className="ed mt-3 text-[64px] sm:text-[92px]">
              Co-sign. <span className="text-[#FF77CD]">Get backed by your fans.</span>
            </h2>
            <p className="mt-6 max-w-[480px] text-[17px] leading-relaxed text-white/75">
              Every EPK has a Co-sign button. Fans pick an amount and send money straight to you. They can
              put their name on your page, or back you quietly.
            </p>
            <ul className="mt-7 flex flex-col gap-3 text-[16px]">
              <li className="flex items-center gap-3"><Tick />Card or bank transfer, on a secure payment page</li>
              <li className="flex items-center gap-3"><Tick />No sign-up for fans. Tap, pay, done</li>
              <li className="flex items-center gap-3"><Tick />Every naira goes to the artist</li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[420px]">
            <div aria-hidden className="absolute -right-4 -top-4 h-full w-full bg-[#FF77CD]" />
            <div className="relative bg-[#F4F4F4] p-6 text-[#101010]">
              <div className="flex items-center gap-3">
                <span className="relative h-11 w-11 overflow-hidden rounded-full"><Image src="/epk/kdiv-coco.jpg" alt="" fill sizes="44px" className="object-cover" /></span>
                <p className="ed text-[30px]">Co-sign Kdiv Coco</p>
              </div>
              <p className="mt-3 text-[14px] text-[#3A3A3A]">Put your name behind the movement. Card or bank transfer, no sign-up.</p>
              <p className="el mt-5 text-[11px] text-[#6B6B6B]">How much?</p>
              <p className="ed mt-1 border-2 border-[#101010] bg-white px-4 py-3 text-[36px]">₦5,000</p>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[14px] font-bold">
                {["₦500", "₦1,000", "₦2,000", "₦5,000"].map((a, i) => (
                  <span key={a} className={`py-2 ${i === 3 ? "bg-[#101010] text-white" : "border-2 border-[#101010]"}`}>{a}</span>
                ))}
              </div>
              <p className="el mt-4 flex min-h-[48px] items-center justify-center bg-[#0038FF] text-[13px] text-white">Co-sign ₦5,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section id="examples" className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:py-28">
        <p className="el text-[12px] text-[#3A3A3A]">Live EPKs from real artists. Tap one.</p>
        <h2 className="ed mt-3 text-[64px] sm:text-[92px]">
          Open a <span className="text-[#0038FF]">real one.</span>
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {KITS.map((k) => (
            <a key={k.slug} href={epkKitUrl(k.slug)} className="group">
              <KitPhone kit={k} className="transition-transform duration-300 group-hover:-translate-y-1.5" />
              <p className="ed mt-4 text-[30px]">{k.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] text-[#3A3A3A] group-hover:text-[#0038FF]">
                {k.slug}.getepk.si <Arrow color="currentColor" size={14} />
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* SongDis */}
      <section id="songdis" className="bg-[#FFE08A]">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:py-28">
          <div>
            <Image src="/images/logo.svg" alt="SongDis" width={108} height={39} className="mb-6 h-9 w-auto rounded bg-[#140C0C] p-1.5" />
            <p className="el text-[12px] text-[#3A3A3A]">getepk is made by SongDis</p>
            <h2 className="ed mt-3 text-[60px] sm:text-[88px]">
              Not on Spotify yet? <span className="text-[#FF4A2B]">Start here.</span>
            </h2>
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-[#3A3A3A]">
              Release with SongDis and your music goes to every major store, and onto your EPK, the same day.
            </p>
            <div className="mt-8 grid max-w-[560px] grid-cols-3 gap-4">
              {[["200+", "Stores, incl. Spotify & Apple Music"], ["100%", "Your masters stay yours"], ["₦ $ £", "Paid in your own currency"]].map(([big, small]) => (
                <div key={big} className="border-t-2 border-[#101010] pt-3">
                  <p className="ed text-[44px]">{big}</p>
                  <p className="mt-1 text-[13.5px] leading-snug text-[#3A3A3A]">{small}</p>
                </div>
              ))}
            </div>
            <div className="mt-9">
              <PosterButton href="https://songdis.com/sign-up" external>Release with SongDis</PosterButton>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[380px]">
            <div aria-hidden className="absolute -left-4 -top-4 h-full w-full bg-[#0038FF]" />
            <Image src="/epk/mollythevibe.jpg" alt="Mollythevibe" fill sizes="380px" className="relative object-cover" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-[960px] px-5 py-20 sm:px-8 lg:py-28">
        <h2 className="ed text-[64px] sm:text-[92px]">
          Quick <span className="text-[#0038FF]">answers.</span>
        </h2>
        <div className="mt-10 border-t-2 border-[#101010]">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-b-2 border-[#101010] py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[20px] font-bold">
                {q}
                <span aria-hidden className="ed text-[34px] text-[#0038FF] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-[720px] text-[16px] leading-relaxed text-[#3A3A3A]">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final call */}
      <section id="start" className="bg-[#101010] text-[#F4F4F4]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-8 px-5 py-20 sm:px-8 lg:py-28">
          <p className="el text-[12px] text-white/60">Search your name. We&apos;ll do the rest.</p>
          <h2 className="ed text-[60px] sm:text-[104px]">
            Your EPK is
            <br />
            <span className="relative inline-block text-[#FF77CD]">
              60 seconds away.
              <Squiggle color="#0038FF" />
            </span>
          </h2>
          <ClaimLink tone="dark" id="cta-search" />
          <p className="el text-[11px] text-white/50">Free <span className="text-[#FF77CD]">/</span> No card needed</p>
        </div>
        <footer className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-7 text-[13px] text-white/50 sm:px-8">
          <Link href="/" aria-label="getepk home" className="text-white">
            <EpkWordmark className="text-[22px]" />
          </Link>
          <div className="flex flex-wrap items-center gap-5">
            <a href="https://songdis.com/privacy-policy" className="hover:text-white">Privacy</a>
            <a href="https://songdis.com/terms" className="hover:text-white">Terms</a>
            <Link href="/sign-in" className="hover:text-white">Sign in</Link>
            <a href="https://songdis.com" className="hover:text-white">A SongDis product</a>
          </div>
        </footer>
      </section>
    </main>
  );
}
