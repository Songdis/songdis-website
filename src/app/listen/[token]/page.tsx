import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getListenPage } from "@/lib/api/privateLinks";
import ListenView from "./_components/ListenView";

type Params = { params: Promise<{ token: string }> };

/**
 * What WhatsApp, Slack and iMessage show when this link is pasted.
 *
 * Built from the release rather than the site defaults, which were turning every private
 * link into "The Operating System for Artists & Labels" with the Songdis logo — three links
 * to three different records looked identical, and the person receiving one could not tell
 * what they had been sent.
 *
 * The page stays noindex/nofollow regardless. That covers search engines, which is what
 * matters: a link preview is only built when somebody who already holds the link pastes it
 * somewhere, so the title and artwork reach exactly the people the artist chose to send it
 * to. Robots never see it.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params;
  const page = await getListenPage(token);

  const robots: Metadata["robots"] = {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  };

  if (!page) {
    return { title: "Link not available — Songdis", robots };
  }

  const title = page.release.title ?? "Private listening link";
  const artist = page.release.artist ?? "";
  const heading = artist ? `${title} — ${artist}` : title;
  const description = artist
    ? `Listen to ${title} by ${artist} on Songdis.`
    : `Listen to ${title} on Songdis.`;

  const artwork = page.release.artwork_url;

  return {
    title: heading,
    description,
    robots,
    openGraph: {
      title: heading,
      description,
      siteName: "Songdis",
      type: "music.song",
      ...(artwork
        ? { images: [{ url: artwork, width: 1000, height: 1000, alt: `${title} artwork` }] }
        : {}),
    },
    twitter: {
      card: artwork ? "summary_large_image" : "summary",
      title: heading,
      description,
      ...(artwork ? { images: [artwork] } : {}),
    },
  };
}

export default async function ListenPage({ params }: Params) {
  const { token } = await params;
  const page = await getListenPage(token);

  // A deleted link, an unknown token and a backend that is down all land here. The visitor
  // is told the link is not available; which of the three it was is not their business and
  // telling them apart is how a token gets confirmed by guessing.
  if (!page) notFound();

  return <ListenView token={token} initial={page} />;
}
