import Image from "next/image";
import Link from "next/link";

/** Shared pieces of the getepk look: the arrow-block button and a phone showing a real kit. */

export function Arrow({ color = "#FFFFFF", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Black arrow block + coloured label: the getepk button. */
export function PosterButton({
  href,
  children,
  tone = "blue",
  external,
}: {
  href: string;
  children: React.ReactNode;
  tone?: "blue" | "pink" | "white";
  external?: boolean;
}) {
  const label =
    tone === "blue" ? "bg-[#0038FF] text-white" : tone === "pink" ? "bg-[#FF77CD] text-[#101010]" : "bg-white text-[#101010]";
  const inner = (
    <>
      <span className="grid w-12 place-items-center bg-[#101010]">
        <Arrow />
      </span>
      <span className={`el flex items-center px-5 text-[13px] group-hover:underline ${label}`}>{children}</span>
    </>
  );
  const cls = "group inline-flex min-h-[48px] items-stretch";
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export const KITS = [
  { slug: "msjorji", name: "MsJorji", image: "/epk/msjorji.jpg", line: "Afro Trap · Texas" },
  { slug: "kdiv-coco", name: "Kdiv Coco", image: "/epk/kdiv-coco.jpg", line: "Afrobeats · Lagos" },
  { slug: "mollythevibe", name: "Mollythevibe", image: "/epk/mollythevibe.jpg", line: "Afro R&B · Lagos" },
  { slug: "r33nzo", name: "R33NZO", image: "/epk/r33nzo.jpg", line: "Afro-fusion" },
] as const;

/** A phone with a kit's first screen: cover, name, address, booking button. */
export function KitPhone({
  kit,
  priority,
  className = "",
}: {
  kit: (typeof KITS)[number];
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-[34px] bg-[#101010] p-[7px] shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] ${className}`}>
      <div className="relative overflow-hidden rounded-[28px] bg-[#101010]">
        <div className="relative aspect-[9/14]">
          <Image src={kit.image} alt={`${kit.name}'s press kit`} fill sizes="260px" className="object-cover" priority={priority} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,16,16,0)_35%,rgba(16,16,16,.92)_88%)]" />
          <div className="absolute inset-x-3 bottom-3">
            <p className="el text-[9px] text-white/60">{kit.line}</p>
            <p className="ed mt-1 truncate text-[26px] text-white">{kit.name}</p>
            <p className="el mt-3 flex min-h-[34px] items-center justify-center truncate bg-[#FF77CD] px-2 text-[10px] text-[#101010]">
              Book {kit.name}
            </p>
          </div>
        </div>
        <p className="truncate px-3 py-2.5 text-[11px] text-white/80">
          {kit.slug}
          <span className="text-[#FF77CD]">.getepk.si</span>
        </p>
      </div>
    </div>
  );
}
