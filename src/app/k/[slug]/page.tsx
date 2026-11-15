import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { epkKitUrl, isAnyEpkHost } from "@/lib/epk";

import { getPublicPressKit } from "@/lib/api/press-kit-public";
import { SITE_ORIGIN, summarise } from "./_format";
import PressKitChrome from "./_components/PressKitChrome";
import PressKitView from "./_components/PressKitView";
import StudioKit from "./_components/StudioKit";

type Params = { params: Promise<{ slug: string }> };
type PageProps = Params & { searchParams: Promise<{ look?: string }> };

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
  const hasImage = Boolean(artist.cover_image_url ?? artist.avatar_url);
  const epk = await viewedOnEpk();
  const domain = await ownDomain();
  const url = domain ? `https://${domain}` : epk ? epkKitUrl(artist.slug) : `${SITE_ORIGIN}/k/${artist.slug}`;
  // A small 1200×630 share picture made from the cover (see ./og/route.ts), on the same host.
  const image = hasImage ? `${url.replace(/\/$/, "")}/og` : null;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      siteName: epk ? "getepk" : "Songdis",
      url,
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: artist.name, type: "image/jpeg" }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PressKitPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { look } = await searchParams;
  const kit = await getPublicPressKit(slug);

  if (!kit) notFound();

  const epk = await viewedOnEpk();
  const domain = await ownDomain();
  const shareUrl = domain ? `https://${domain}` : epk ? epkKitUrl(kit.artist.slug) : undefined;

  // Studio is the design; the classic one stays reachable at ?look=classic for comparison.
  if (look !== "classic") {
    return <StudioKit kit={kit} brand={epk ? "getepk" : "songdis"} shareUrl={shareUrl} />;
  }

  return (
    <PressKitChrome
      kit={kit}
      brand={epk ? "getepk" : "songdis"}
      shareUrl={shareUrl}
    >
      <PressKitView kit={kit} />
    </PressKitChrome>
  );
}

async function viewedOnEpk(): Promise<boolean> {
  const h = await headers();
  return Boolean(h.get("x-pk-domain")) || isAnyEpkHost(h.get("x-forwarded-host") ?? h.get("host"));
}

/** The artist's own domain, when the kit is being viewed on it. */
async function ownDomain(): Promise<string | null> {
  return (await headers()).get("x-pk-domain");
}
