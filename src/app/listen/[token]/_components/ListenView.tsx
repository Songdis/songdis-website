"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import {
  postListenComment,
  unlockListenPage,
  type ListenComment,
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

  /*
   * Feedback.
   *
   * The name is remembered in this tab only, so somebody leaving notes on four tracks types
   * it once. Deliberately sessionStorage and not a cookie: it is a convenience, not an
   * identity, and it should not follow them to the next link they are sent.
   */
  const [comments, setComments] = useState<ListenComment[]>(initial.comments ?? []);
  const [commentFor, setCommentFor] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [withTimestamp, setWithTimestamp] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  /** off → the album ends; all → back to the top; one → this track again. */
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [shuffle, setShuffle] = useState(false);

  const active = tracks.find((t) => t.id === activeId) ?? null;

  /*
   * The order tracks actually play in.
   *
   * Shuffled once per toggle rather than picking a random track at each change: a fresh
   * random pick can repeat the song that just played, and cannot support a working Previous.
   * This keeps a real queue, so next and previous stay coherent and every track is heard once
   * before any repeats.
   */
  const [order, setOrder] = useState<number[]>([]);

  useEffect(() => {
    const ids = tracks.map((t) => t.id);

    if (!shuffle) {
      setOrder(ids);
      return;
    }

    // Fisher-Yates, with whatever is playing pinned to the front so turning shuffle on does
    // not interrupt the current track.
    const rest = ids.filter((id) => id !== activeId);

    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    setOrder(activeId !== null && ids.includes(activeId) ? [activeId, ...rest] : rest);
    // activeId is deliberately not a dependency: re-shuffling on every track change would
    // scramble the queue mid-listen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffle, tracks]);

  const step = useCallback(
    (delta: 1 | -1): ListenTrack | null => {
      const queue = order.length ? order : tracks.map((t) => t.id);

      if (queue.length === 0) return null;

      const at = activeId === null ? -1 : queue.indexOf(activeId);
      let next = at + delta;

      if (next >= queue.length) {
        if (repeat !== "all") return null;
        next = 0;
      }

      if (next < 0) {
        if (repeat !== "all") return null;
        next = queue.length - 1;
      }

      return tracks.find((t) => t.id === queue[next]) ?? null;
    },
    [order, tracks, activeId, repeat]
  );

  const unlock = useCallback(async () => {
    if (!passcode.trim() || unlocking) return;

    setUnlocking(true);
    setError(null);

    const { page: unlocked, error: failed } = await unlockListenPage(token, passcode.trim());

    if (unlocked) {
      setPage(unlocked);
      setComments(unlocked.comments ?? []);
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

  const goTo = useCallback(
    (track: ListenTrack | null) => {
      if (!track?.stream_url) return;
      setActiveId(track.id);
      setPosition(0);
    },
    []
  );

  const next = useCallback(() => goTo(step(1)), [goTo, step]);

  /*
   * Previous means "start this track again" until a few seconds in, then it means the one
   * before — the behaviour every music player has, and the one a thumb expects.
   */
  const previous = useCallback(() => {
    const el = audioRef.current;

    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }

    goTo(step(-1));
  }, [goTo, step]);

  const handleEnded = useCallback(() => {
    const el = audioRef.current;

    if (repeat === "one" && el) {
      el.currentTime = 0;
      el.play().catch(() => setPlaying(false));
      return;
    }

    const following = step(1);

    if (following) {
      goTo(following);
      return;
    }

    setPlaying(false);
  }, [repeat, step, goTo]);

  /*
   * The lock screen, the Dynamic Island, CarPlay, the Mac's Now Playing widget and the
   * Android notification shade — all of them, from one browser API.
   *
   * navigator.mediaSession is what fills them in. Without it iOS shows the page title and a
   * generic globe next to a playing track; with it the artwork, title and artist appear as
   * though the music were playing in a native app, and the hardware buttons work.
   *
   * Two things it depends on, both of which hold here:
   *   - audio has to be playing from a real media element, which it is;
   *   - artwork has to be an absolute https URL. Several sizes are declared pointing at the
   *     same file: iOS picks the nearest and scales, and declaring only one often gets the
   *     artwork ignored entirely.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!active) return;

    // page.release rather than the destructured `release`: these hooks run above the point
    // where the locked state returns, and must not depend on anything declared after it.
    const artwork = page.release.artwork_url;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: active.title ?? page.release.title ?? "Untitled",
      artist: page.release.artist ?? "",
      album: page.release.title ?? "",
      artwork: artwork
        ? ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"].map((sizes) => ({
            src: artwork,
            sizes,
            type: "image/jpeg",
          }))
        : [],
    });
  }, [active, page.release.artwork_url, page.release.artist, page.release.title]);

  /*
   * The buttons on the lock screen, and the ones on a pair of headphones.
   *
   * Next and previous are only offered when there is somewhere to go, because iOS greys out
   * an unhandled action rather than hiding it — and a dead Next button on a single is worse
   * than no Next button.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const session = navigator.mediaSession;
    const el = audioRef.current;

    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Not every browser supports every action; an unsupported one throws rather than
        // being ignored, and must not take the page with it.
      }
    };

    set("play", () => el?.play().catch(() => setPlaying(false)));
    set("pause", () => el?.pause());
    set("seekto", (details) => {
      if (el && typeof details.seekTime === "number") el.currentTime = details.seekTime;
    });
    set("seekbackward", (details) => {
      if (el) el.currentTime = Math.max(0, el.currentTime - (details.seekOffset ?? 10));
    });
    set("seekforward", (details) => {
      if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + (details.seekOffset ?? 10));
    });
    set("nexttrack", step(1) ? () => next() : null);
    set("previoustrack", tracks.length > 1 ? () => previous() : null);

    return () => {
      for (const action of [
        "play", "pause", "seekto", "seekbackward", "seekforward", "nexttrack", "previoustrack",
      ] as MediaSessionAction[]) {
        set(action, null);
      }
    };
  }, [next, previous, step, tracks.length]);

  /*
   * Keeps the lock screen's scrubber in step with the page.
   *
   * Without position state the bar on the lock screen sits at zero and cannot be dragged,
   * even while the audio plays.
   */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!("setPositionState" in navigator.mediaSession)) return;
    if (!length || Number.isNaN(length)) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: length,
        position: Math.min(position, length),
        playbackRate: 1,
      });
    } catch {
      // Safari throws if position exceeds duration during a seek; harmless, and the next
      // timeupdate corrects it.
    }
  }, [position, length]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("songdis_listen_name");
      if (saved) setAuthorName(saved);
    } catch {
      // Private mode and locked-down browsers throw on access. A remembered name is a
      // nicety; losing it must not stop anyone leaving feedback.
    }
  }, []);

  const submitComment = useCallback(
    async (trackId: number) => {
      if (!authorName.trim() || !commentBody.trim() || posting) return;

      setPosting(true);
      setCommentError(null);

      const { comment, error: failed } = await postListenComment(
        token,
        {
          music_upload_id: trackId,
          author_name: authorName.trim(),
          body: commentBody.trim(),
          // Only when they are actually listening to the track they are writing about —
          // "at 0:00" on a track they have not played is noise, not feedback.
          ...(withTimestamp && trackId === activeId && position > 0
            ? { at_seconds: Math.floor(position) }
            : {}),
        },
        passcode || null
      );

      if (comment) {
        setComments((prev) => [...prev, comment]);
        setCommentBody("");
        setCommentFor(null);

        try {
          sessionStorage.setItem("songdis_listen_name", authorName.trim());
        } catch {
          // See above.
        }
      } else {
        setCommentError(failed);
      }

      setPosting(false);
    },
    [authorName, commentBody, posting, token, withTimestamp, activeId, position, passcode]
  );

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
            const mine = comments.filter((c) => c.music_upload_id === track.id);
            const open = commentFor === track.id;

            return (
              <div key={track.id} className="flex flex-col gap-1.5">
              <div
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

                {/* Feedback lives on the track, not in one pile at the bottom. The count is
                    the affordance: an empty one still invites the first comment. */}
                <button
                  onClick={() => { setCommentFor(open ? null : track.id); setCommentError(null); }}
                  aria-expanded={open}
                  aria-label={mine.length ? `${mine.length} comments on ${track.title}` : `Comment on ${track.title}`}
                  className={`shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-1.5 transition-colors ${
                    open || mine.length
                      ? "border-[#C30100]/40 text-white/80"
                      : "border-white/10 text-white/35 hover:text-white/70 hover:border-white/25"
                  }`}
                >
                  <CommentIcon />
                  {mine.length > 0 && <span className="font-body text-[10px]">{mine.length}</span>}
                </button>
              </div>

              {(open || mine.length > 0) && (
                <div className="ml-0 sm:ml-14 flex flex-col gap-2 pb-1">
                  {mine.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-[#160D0D] border border-white/[0.05] px-3 py-2.5">
                      <p className="font-body text-white/80 text-[12px]">
                        <span className="text-white">{comment.author_name}</span>
                        {comment.at_seconds !== null && (
                          <button
                            onClick={() => {
                              // Jump to the moment they were talking about.
                              if (track.id !== activeId) goTo(track);
                              const el = audioRef.current;
                              if (el && track.id === activeId) el.currentTime = comment.at_seconds ?? 0;
                            }}
                            className="ml-2 text-[#C30100] hover:underline"
                          >
                            at {formatDuration(comment.at_seconds)}
                          </button>
                        )}
                      </p>
                      <p className="font-body text-white/55 text-[12px] leading-relaxed mt-1 whitespace-pre-line">
                        {comment.body}
                      </p>
                    </div>
                  ))}

                  {open && (
                    <form
                      onSubmit={(e) => { e.preventDefault(); submitComment(track.id); }}
                      className="rounded-lg bg-[#160D0D] border border-white/[0.07] p-3 flex flex-col gap-2"
                    >
                      <input
                        value={authorName}
                        onChange={(e) => { setAuthorName(e.target.value); setCommentError(null); }}
                        placeholder="Your name"
                        maxLength={80}
                        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-[12px] placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
                      />

                      <textarea
                        value={commentBody}
                        onChange={(e) => { setCommentBody(e.target.value); setCommentError(null); }}
                        placeholder={`What did you think of "${track.title}"?`}
                        rows={3}
                        maxLength={2000}
                        className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-[12px] placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
                      />

                      {/* Only offered while they are actually listening to this track —
                          "at 0:00" on a track nobody played is noise. */}
                      {track.id === activeId && position > 0 && (
                        <label className="flex items-center gap-2 font-body text-white/40 text-[11px]">
                          <input
                            type="checkbox"
                            checked={withTimestamp}
                            onChange={(e) => setWithTimestamp(e.target.checked)}
                          />
                          Mark this at {formatDuration(Math.floor(position))}
                        </label>
                      )}

                      {commentError && (
                        <p className="font-body text-[#C30100] text-[11px]">{commentError}</p>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={posting || !authorName.trim() || !commentBody.trim()}
                          className="font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] disabled:opacity-40 px-4 py-2 transition-colors"
                        >
                          {posting ? "Sending…" : "Send to the artist"}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setCommentFor(null); setCommentError(null); }}
                          className="font-body text-white/40 hover:text-white/70 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
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
            {/* Previous only earns its space on a release with more than one track. */}
            {isAlbum && (
              <button
                onClick={previous}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Previous track"
              >
                <PrevIcon />
              </button>
            )}

            <button
              onClick={() => play(active)}
              className="w-12 h-12 sm:w-11 sm:h-11 shrink-0 rounded-full bg-[#C30100] flex items-center justify-center text-white"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>

            {isAlbum && (
              <button
                onClick={next}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                aria-label="Next track"
              >
                <NextIcon />
              </button>
            )}

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

            {/*
              Shuffle and repeat. Shuffle is only meaningful on a release with more than one
              track; repeat-one is useful even on a single, so repeat always shows.
            */}
            <div className="flex items-center gap-1 shrink-0">
              {isAlbum && (
                <button
                  onClick={() => setShuffle((on) => !on)}
                  aria-pressed={shuffle}
                  aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
                  title={shuffle ? "Shuffle on" : "Shuffle off"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    shuffle ? "text-[#C30100]" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <ShuffleIcon />
                </button>
              )}

              <button
                onClick={() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
                aria-label={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat this track"}
                title={repeat === "off" ? "Repeat off" : repeat === "all" ? "Repeat all" : "Repeat this track"}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  repeat === "off" ? "text-white/40 hover:text-white/70" : "text-[#C30100]"
                }`}
              >
                <RepeatIcon />
                {/* The 1 is how every player distinguishes repeat-one from repeat-all. */}
                {repeat === "one" && (
                  <span className="absolute -top-0.5 -right-0.5 text-[8px] font-heading bg-[#C30100] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    1
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          src={active?.stream_url ?? undefined}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
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
        {(page.artist?.bio || page.artist?.socials?.length || page.artist?.press_kit_url) && (
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
                {page.artist.bio ? "About " : ""}{page.artist.name ?? release.artist}
              </p>

              {page.artist.location && (
                <p className="font-body text-white/35 text-[11px] mt-0.5">{page.artist.location}</p>
              )}

              {page.artist.bio && (
                <p className="font-body text-white/55 text-[13px] leading-relaxed mt-2 whitespace-pre-line">
                  {page.artist.bio}
                </p>
              )}

              {/*
                Where to go next after listening.
                An editor's move after a track lands is to check the artist's numbers and
                socials, and a press kit answers the rest in one page — so both sit here
                rather than leaving them to search for the name.
              */}
              {(page.artist.socials?.length || page.artist.press_kit_url) && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3.5">
                  {page.artist.press_kit_url && (
                    <a
                      href={page.artist.press_kit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] text-white px-3 py-1.5 transition-colors"
                    >
                      Press kit
                    </a>
                  )}

                  {page.artist.socials?.map((social) => (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-[11px] rounded-full border border-white/10 hover:border-white/30 text-white/55 hover:text-white px-3 py-1.5 transition-colors"
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              )}
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
      <div className="max-w-2xl mx-auto">
      {/*
        Whose page this is.
        A link arrives with no context beyond the artwork, so the mark and the line say who
        sent it and what Songdis does — the only pitch for us the page makes, kept above the
        record rather than competing with it.
      */}
      <div className="flex flex-col items-center gap-1.5 mb-7 sm:mb-9">
        <a href="https://songdis.com" target="_blank" rel="noopener noreferrer" aria-label="Songdis">
          <Image
            src="/images/logo.svg"
            alt="Songdis"
            width={120}
            height={32}
            className="h-7 sm:h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
          />
        </a>
        <p className="font-body text-white/35 text-[11px] tracking-wide">Get your music everywhere</p>
      </div>

        {children}
      </div>
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

const CommentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

const PrevIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="19 20 9 12 19 4 19 20" />
    <rect x="4" y="4" width="2.5" height="16" rx="1" />
  </svg>
);

const NextIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 4 15 12 5 20 5 4" />
    <rect x="17.5" y="4" width="2.5" height="16" rx="1" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </svg>
);

const RepeatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);

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
