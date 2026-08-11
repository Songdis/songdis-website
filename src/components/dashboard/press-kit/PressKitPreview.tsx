"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";

import PressKitView from "@/app/k/[slug]/_components/PressKitView";
import { pressKitThemeVars } from "@/app/k/[slug]/_theme";
import { CO_SIGN_DISABLED } from "@/lib/api/co-sign";
import type { PressKitEditorState } from "@/lib/api/press-kit";
import {
  getPublicPressKit,
  type PublicPressKit,
} from "@/lib/api/press-kit-public";
import type { UsePressKit } from "@/lib/hooks/usePressKit";
import { Panel } from "./primitives";

const EMPTY_SOCIALS: PublicPressKit["artist"]["socials"] = {
  instagram: null,
  twitter: null,
  facebook: null,
  spotify: null,
  apple_music: null,
  tiktok: null,
  youtube: null,
};


function buildPreviewPressKit(
  draft: PressKitEditorState,
  published: PublicPressKit | null
): PublicPressKit {
  const first = draft.releases[0] ?? null;

  return {
    artist: {
      name: draft.artist.name || published?.artist.name || "Your artist name",
      slug: draft.artist.slug || published?.artist.slug || "",
      eyebrow: draft.kit.eyebrow ?? published?.artist.eyebrow ?? null,
      bio: draft.artist.bio ?? published?.artist.bio ?? null,
      cover_image_url:
        draft.kit.cover_image_url ||
        published?.artist.cover_image_url ||
        null,
      avatar_url: draft.artist.avatar_url || published?.artist.avatar_url || null,
      socials: published?.artist.socials ?? EMPTY_SOCIALS,
    },
    kit: {
      theme: draft.kit.theme,
      headline_font: draft.kit.headline_font,
      facts: draft.kit.facts,
      contacts: draft.kit.contacts,
      quotes: draft.kit.quotes.map((q) => ({
        quote: q.quote,
        source: q.source || null,
        year: q.year || null,
      })),
      placements: draft.kit.placements,
      section_order: draft.kit.section_order,
      hidden_sections: draft.kit.hidden_sections,
    },
    photos: draft.photos.map((p) => ({ id: p.id, url: p.url })),
    spotlights: draft.spotlights.map((s) => ({
      id: s.id,
      url: s.url,
      title: s.title,
      description: s.description,
    })),
    releases: {
      featured: first
        ? {
            id: first.id,
            title: first.title,
            cover: first.cover,
            released_on: null,
            type: null,
          }
        : null,
      others: draft.releases.slice(1).map((r) => ({
        id: r.id,
        title: r.title,
        cover: r.cover,
        year: r.year,
      })),
    },
    cosign: published?.cosign ?? CO_SIGN_DISABLED,
  };
}

export function PressKitPreview({ kit }: { kit: UsePressKit }) {
  const slug = kit.draft.artist.slug;

  const [fetched, setFetched] = useState<{
    slug: string;
    kit: PublicPressKit | null;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getPublicPressKit(slug).then((k) => {
      if (!cancelled) setFetched({ slug, kit: k });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const published = fetched && fetched.slug === slug ? fetched.kit : null;

  const preview = useMemo(
    () => buildPreviewPressKit(kit.draft, published),
    [kit.draft, published]
  );

  const isPublished = kit.draft.kit.published_at !== null;

  return (
    <Panel>
      <div className="p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#E5342F]/10 text-[#E5342F]">
              <Eye size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="font-heading text-white uppercase text-[12px] tracking-[0.14em]">
                Preview
              </p>
              <p className="font-body text-white/35 text-[11px]">
                This is exactly what a visitor sees. Edits below apply instantly.
              </p>
            </div>
          </div>
          <span
            className={`font-body text-[10px] uppercase tracking-wider rounded-full px-2.5 py-1 border shrink-0 ${
              isPublished
                ? "text-[#0ca30c] border-[#0ca30c55] bg-[rgba(12,163,12,0.1)]"
                : "text-white/50 border-white/12"
            }`}
          >
            {isPublished ? "Live" : "Draft — not public yet"}
          </span>
        </div>

        <div className="mx-auto w-full max-w-[400px] rounded-[1.8rem] bg-black/50 p-2 ring-1 ring-white/10">
          <div
            className="h-[62vh] min-h-[380px] max-h-[720px] overflow-y-auto rounded-[1.35rem] bg-[var(--pk-bg)]"
            style={pressKitThemeVars(preview.kit.theme, preview.kit.headline_font)}
          >
            <PressKitView kit={preview} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
