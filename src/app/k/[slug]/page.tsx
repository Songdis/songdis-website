import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicPressKit } from "@/lib/api/press-kit-public";
import { SITE_ORIGIN, summarise } from "./_format";
import PressKitChrome from "./_components/PressKitChrome";
import PressKitView from "./_components/PressKitView";

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

  return (
    <PressKitChrome kit={kit}>
      <PressKitView kit={kit} />
    </PressKitChrome>
  );
}
