import Link from "next/link";
import Image from "next/image";

export default function PressKitNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#170F0F] px-6 py-16 text-center font-body text-white">
      <Image
        src="/images/logo.svg"
        alt="Songdis"
        width={108}
        height={39}
        className="mb-10 h-9 w-auto object-contain"
      />

      <h1 className="font-heading text-2xl uppercase leading-tight sm:text-3xl">
        Press kit unavailable
      </h1>

      <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/65">
        This link doesn&apos;t point to a published press kit. The address may be
        mistyped, or the artist may have taken the page down.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[linear-gradient(180deg,#E5342F,#C30100)] px-7 py-3.5 font-heading text-[12.5px] uppercase tracking-[0.1em] text-white transition hover:brightness-110"
        >
          Go to Songdis
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full border border-white/15 px-7 py-3.5 font-heading text-[12.5px] uppercase tracking-[0.1em] text-white transition hover:border-[#E5342F]"
        >
          Create your own
        </Link>
      </div>
    </main>
  );
}
