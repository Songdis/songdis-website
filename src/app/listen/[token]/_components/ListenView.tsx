"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import {
  unlockListenPage,
  type ListenPage,
  type ListenTrack,
} from "@/lib/api/privateLinks";

/*
 * The listening page.
 *
 * What this does about leaking, honestly:
 *
 *   - audio is served from short-lived signed URLs, never the storage URL, so a link lifted
 *     from the network tab is dead within minutes;
 *   - the player exposes no download control and the <audio> element is not reachable by
 *     right-click, so the casual "save audio as" route is closed;
 *   - every page carries a line naming who it was issued to, so a leaked recording can be
 *     traced back.
 *
 * What it does NOT do is stop a screen recording. No web page can — there is no browser API
 * for it, and anyone claiming otherwise is selling something. The watermark is the answer to
 * that, not a blocked shortcut.
 */

function formatDuration(seconds: number | null): string {
  if (!seconds || Number.isNaN(seconds)) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

export default function ListenView({
  token,
  initial,
}: {
  token: string;
  initial: ListenPage;
}) {
  const [page, setPage] = useState<ListenPage>(initial);
  const [passcode, setPasscode] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tracks = useMemo<ListenTrack[]>(() => page.tracks ?? [], [page.tracks]);

  const [activeId, setActiveId] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const active = tracks.find((t) => t.id === activeId) ?? null;

  const unlock = useCallback(async () => {
    if (!passcode.trim() || unlocking) return;

    setUnlocking(true);
    setError(null);

    const { page: unlocked, error: failed } = await unlockListenPage(token, passcode.trim());

    if (unlocked) {
      setPage(unlocked);
    } else {
      setError(failed);
    }

    setUnlocking(false);
  }, [passcode, token, unlocking]);

  const play = useCallback((track: ListenTrack) => {
    if (!track.stream_url) return;

    if (track.id === activeId) {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) el.play().catch(() => setPlaying(false));
      else el.pause();
      return;
    }

    setActiveId(track.id);
    setPosition(0);
  }, [activeId]);

  // Autoplay the newly chosen track once its source has actually changed.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !active?.stream_url) return;
    el.load();
    el.play().catch(() => setPlaying(false));
  }, [active?.id, active?.stream_url]);

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    if (!el || !length) return;
    el.currentTime = (Number(e.target.value) / 100) * length;
  };

  /* ─── Locked ─────────────────────────────────────────────────────────── */

  if (page.locked) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center gap-5 max-w-sm mx-auto">
          <Artwork
            url={page.release.artwork_url}
            title={page.release.title}
            className="w-40 h-40 sm:w-44 sm:h-44"
          />

          <div>
            <h1 className="font-heading text-white uppercase text-xl tracking-wide">
              {page.release.title ?? "Private listening link"}
            </h1>
            {page.release.artist && (
              <p className="font-body text-white/50 text-sm mt-1">{page.release.artist}</p>
            )}
          </div>

          <p className="font-body text-white/40 text-sm leading-relaxed">
            This link is private. Enter the passcode you were given to listen.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); unlock(); }}
            className="w-full flex flex-col gap-3"
          >
            <input
              type="password"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError(null); }}
              placeholder="Passcode"
              autoComplete="off"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm text-center placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />

            {error && <p className="font-body text-[#C30100] text-xs">{error}</p>}

            <button
              type="submit"
              disabled={unlocking || !passcode.trim()}
              className="w-full min-h-[48px] font-heading text-white uppercase text-xs tracking-widest bg-[#C30100] hover:bg-[#C30100]/80 disabled:opacity-40 rounded-full px-6 py-3 transition-colors"
            >
              {unlocking ? "Checking…" : "Listen"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  /* ─── Unlocked ───────────────────────────────────────────────────────── */

  const { release } = page;
  const isAlbum = tracks.length > 1;

  /*
   * Out yet, or not?
   *
   * A release date in the future means the music is embargoed. No date at all is treated as
   * unreleased: the cautious reading, since a release with no date set has certainly not
   * come out.
   */
  const isUnreleased = (() => {
    if (!release.release_date) return true;

    const out = new Date(release.release_date);

    if (Number.isNaN(out.getTime())) return true;

    // Compared by day, not by instant: a release dated today is out today, wherever the
    // person reading this happens to be.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    out.setHours(0, 0, 0, 0);

    return out.getTime() > today.getTime();
  })();

  return (
    <Shell>
      <div className="flex flex-col gap-7 sm:gap-8 pb-28 sm:pb-24">
        {/*
          Two layouts, not one scaled down.
          On a phone the artwork is the page: full width, centred, with the title under it the
          way every music app does it. From sm up it becomes the sleeve-beside-details row
          that reads better when there is width to spare.
        */}
        <header className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start text-center sm:text-left">
          <Artwork
            url={release.artwork_url}
            title={release.title}
            className="w-full max-w-[280px] aspect-square sm:w-[200px] sm:h-[200px] sm:max-w-none sm:aspect-auto"
          />

          <div className="w-full flex-1 min-w-0 sm:pt-1">
            <p className="font-heading text-[#C30100] uppercase text-[10px] tracking-widest mb-2">
              {release.type ?? "Release"} · {isUnreleased ? "Private listen" : "Private link"}
            </p>

            <h1 className="font-heading text-white uppercase text-xl sm:text-3xl leading-tight break-words">
              {release.title}
            </h1>

            <p className="font-body text-white/60 text-sm mt-2">{release.artist}</p>

            {/*
              The facts, as a card on a phone.
              Loose two-column text looked like debris on a narrow screen; boxed and evenly
              divided, it reads as a spec sheet — which is what an editor is scanning for.
            */}
            <dl className="grid grid-cols-2 gap-px mt-5 rounded-xl overflow-hidden bg-white/[0.06] sm:bg-transparent sm:gap-x-6 sm:gap-y-3 sm:mt-6 sm:max-w-md sm:rounded-none">
              <Fact label="Release date" value={formatDate(release.release_date) || "Not set"} />
              <Fact label="Tracks" value={String(release.track_count ?? tracks.length)} />
              <Fact label="Label" value={release.label_name || "—"} />
              <Fact label="Genre" value={release.genre || "—"} />
              {/*
                UPC is shown whether or not it exists. An editor wants the barcode; an artist
                wants to know one is coming. "Assigned before release" is the truth when it is
                missing — a blank would read as "this release has no barcode". Full width: a
                13-digit barcode does not fit in half a phone screen.
              */}
              <Fact
                label="UPC"
                value={release.upc ?? "Assigned before release"}
                mono={!!release.upc}
                wide
              />
            </dl>
          </div>
        </header>

        <section className="flex flex-col gap-1.5">
          {isAlbum && (
            <h2 className="font-heading text-white/70 uppercase text-[11px] tracking-widest mb-1.5">
              Tracklist
            </h2>
          )}

          {tracks.map((track) => {
            const isActive = track.id === activeId;

            return (
              <div
                key={track.id}
                className={[
                  "flex items-center gap-3 rounded-xl border p-3 sm:p-3.5 transition-colors",
                  isActive
                    ? "border-[#C30100]/50 bg-[#C30100]/[0.07]"
                    : "border-white/[0.06] bg-[#120B0B] hover:border-white/15",
                ].join(" ")}
              >
                <button
                  onClick={() => play(track)}
                  disabled={!track.stream_url}
                  aria-label={isActive && playing ? `Pause ${track.title}` : `Play ${track.title}`}
                  // 44px on a phone: the minimum a thumb can hit reliably.
                  className="w-11 h-11 sm:w-9 sm:h-9 shrink-0 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  {isActive && playing ? <PauseIcon /> : <PlayIcon />}
                </button>

                {isAlbum && (
                  <span className="font-body text-white/25 text-xs w-5 text-right shrink-0">
                    {track.number}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-body text-white text-sm truncate">
                    {track.title}
                    {track.mix_version ? (
                      <span className="text-white/40"> ({track.mix_version})</span>
                    ) : null}
                    {track.explicit && (
                      <span className="ml-2 align-middle text-[9px] font-heading tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/50">
                        E
                      </span>
                    )}
                  </p>

                  <p className="font-body text-white/30 text-[11px] mt-0.5">
                    <span className="text-white/20 mr-1">ISRC</span>
                    {track.isrc ? (
                      <span className="font-mono select-all">{track.isrc}</span>
                    ) : (
                      "Assigned before release"
                    )}
                  </p>
                </div>

                {track.duration ? (
                  <span className="font-body text-white/30 text-xs shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* The player. Seek and play only — no download control, and the element itself is
            never exposed, so there is no right-click "save audio as". */}
        {active && (
          /*
            Pinned to the bottom of the screen on a phone, where a floating card inset by 16px
            just loses width the seek bar needs. On a wider screen it stays a card.
          */
          <div className="fixed sm:sticky bottom-0 sm:bottom-4 left-0 right-0 sm:left-auto sm:right-auto z-20 border-t sm:border border-white/10 bg-[#1A0D0D]/95 backdrop-blur px-4 py-3 sm:p-4 sm:rounded-2xl flex items-center gap-3 sm:gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4">
            <button
              onClick={() => play(active)}
              className="w-12 h-12 sm:w-11 sm:h-11 shrink-0 rounded-full bg-[#C30100] flex items-center justify-center text-white"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            <div className="flex-1 min-w-0">
              <p className="font-body text-white text-sm truncate mb-1.5">{active.title}</p>

              <div className="flex items-center gap-2">
                <span className="font-body text-white/40 text-[10px] tabular-nums w-9">
                  {formatDuration(Math.floor(position))}
                </span>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={length ? (position / length) * 100 : 0}
                  onChange={seek}
                  aria-label="Seek"
                  className="flex-1 h-1 accent-[#C30100] cursor-pointer"
                />

                <span className="font-body text-white/40 text-[10px] tabular-nums w-9 text-right">
                  {formatDuration(Math.floor(length))}
                </span>
              </div>
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          src={active?.stream_url ?? undefined}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
          onContextMenu={(e) => e.preventDefault()}
          controlsList="nodownload noplaybackrate"
          preload="none"
          className="hidden"
        />

        {/*
          Who the artist is. A playlist editor opening this has usually never heard of them,
          and the bio is what turns a file drop into a pitch. Omitted entirely when the
          account has no profile behind it rather than left as an empty heading.
        */}
        {page.artist?.bio && (
          <section className="rounded-2xl border border-white/[0.06] bg-[#120B0B] p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4">
            {page.artist.image_url && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white/[0.04] shrink-0">
                <Image
                  src={page.artist.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                  draggable={false}
                />
              </div>
            )}

            <div className="min-w-0">
              <p className="font-heading text-white uppercase text-xs tracking-wide">
                About {page.artist.name ?? release.artist}
              </p>

              {page.artist.location && (
                <p className="font-body text-white/35 text-[11px] mt-0.5">{page.artist.location}</p>
              )}

              <p className="font-body text-white/55 text-[13px] leading-relaxed mt-2 whitespace-pre-line">
                {page.artist.bio}
              </p>
            </div>
          </section>
        )}

        {/*
          The watermark. Not decoration: it is the only thing that makes a leak traceable,
          since a screen recording cannot be prevented.
        */}
        <footer className="border-t border-white/[0.06] pt-5 flex flex-col gap-2">
          <p className="font-body text-white/30 text-[11px] leading-relaxed">
            Shared privately by {release.artist} through Songdis
            {page.label ? ` · ${page.label}` : ""}.{" "}
            {/*
              "Unreleased" only when it actually is. The date decides: calling a record that
              came out last month unreleased is wrong in front of the exact people — editors,
              press — this page is built to impress, and it devalues the warning on the ones
              that really are embargoed.
            */}
            {isUnreleased
              ? "Unreleased — please do not share, copy or re-post this link or its contents."
              : "Please do not re-post this link or its contents."}
          </p>
          <p className="font-body text-white/20 text-[10px]">
            Opened {new Date().toLocaleString()} · songdis.com
          </p>
        </footer>
      </div>
    </Shell>
  );
}

/* ─── Bits ──────────────────────────────────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0A0606] px-4 py-8 sm:py-16">
      <div className="max-w-2xl mx-auto">{children}</div>
    </main>
  );
}

function Artwork({
  url,
  title,
  className = "",
}: {
  url: string | null | undefined;
  title: string | null | undefined;
  /**
   * Sized by the caller, in classes rather than pixels.
   *
   * It used to take a fixed pixel size, which is what made the phone layout look like a
   * squeezed desktop: a 200px square pinned to the left of a 360px screen, with the title
   * crammed into what was left.
   */
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-white/[0.04] shrink-0 ${className}`}
      // Artwork for unreleased music: not worth making it a one-click save.
      onContextMenu={(e) => e.preventDefault()}
    >
      {url ? (
        <Image src={url} alt={title ?? ""} fill className="object-cover" unoptimized draggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  /** Spans both columns on a phone — for values too long to share a row, like a UPC. */
  wide?: boolean;
}) {
  return (
    <div
      className={[
        // The background paints the cell inside the grid's 1px gaps, which is what draws the
        // dividing lines on a phone. Above sm the card dissolves back into plain text.
        "bg-[#120B0B] px-3 py-2.5 text-left sm:bg-transparent sm:p-0",
        wide ? "col-span-2 sm:col-span-1" : "",
      ].join(" ")}
    >
      <dt className="font-body text-white/30 text-[10px] uppercase tracking-wider">{label}</dt>
      <dd className={`font-body text-white/70 text-xs mt-1 break-all sm:break-normal ${mono ? "font-mono select-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

const PlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);
