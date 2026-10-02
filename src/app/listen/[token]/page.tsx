import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getListenPage } from "@/lib/api/privateLinks";
import ListenView from "./_components/ListenView";

type Params = { params: Promise<{ token: string }> };

/**
 * A private listening page for unreleased music.
 *
 * Never indexed, under any visibility. A public link is "public" only in the sense that it
 * needs no passcode — the music on it is not out yet, and a search engine finding it would
 * defeat the entire point. noindex/nofollow/noarchive, and no title or artwork in the
 * metadata either: link previews in Slack, WhatsApp and iMessage are built from these, and
 * an unreleased title should not leak into a group chat someone forwards it to.
 */
export const metadata: Metadata = {
  title: "Private listening link — Songdis",
  description: "A private listening link.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function ListenPage({ params }: Params) {
  const { token } = await params;
  const page = await getListenPage(token);

  // A deleted link, an unknown token and a backend that is down all land here. The visitor
  // is told the link is not available; which of the three it was is not their business and
  // telling them apart is how a token gets confirmed by guessing.
  if (!page) notFound();

  return <ListenView token={token} initial={page} />;
}
