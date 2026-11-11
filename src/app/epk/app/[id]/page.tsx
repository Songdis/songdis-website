"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PressKitEditorFor } from "@/components/dashboard/press-kit/PressKitEditor";
import { AppShell } from "../../_components/AppShell";
import { useEpkArtists } from "../../_components/useEpkArtists";
import { DeleteKit } from "../../_components/DeleteKit";

export default function EpkEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, remove } = useEpkArtists();
  const artist = data?.artists.find((a) => a.id === Number(id)) ?? null;

  return (
    <AppShell>
      {error ? (
        <p className="text-white/60">{error}</p>
      ) : !data ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : !artist ? (
        <p className="text-white/60">That artist isn&apos;t on your account.</p>
      ) : (
        <>
          <PressKitEditorFor
            key={artist.id}
            profileId={artist.id}
            name={artist.stage_name}
            image={artist.image}
            onBack={data.artists.length > 1 || data.can_create ? () => router.push("/app") : undefined}
          />
          <DeleteKit
            name={artist.stage_name}
            songdis={artist.source === "songdis"}
            onDelete={async () => {
              const res = await remove(artist.id);
              if (res.ok) window.location.href = "/app";
              return res;
            }}
          />
        </>
      )}
    </AppShell>
  );
}
