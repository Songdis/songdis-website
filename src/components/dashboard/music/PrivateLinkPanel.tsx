"use client";

import { useEffect, useRef, useState } from "react";

import { getLinkLive } from "@/lib/api/privateLinks";
import type { LinkListens, LinkLive, LinkVisibility, PrivateLink } from "@/lib/api/privateLinks";

/** "2 hours ago" / "3 days ago", or an empty string when we have nothing to show. */
function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (!Number.isFinite(diff) || diff < 0) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Who actually listened.
 *
 * Kept deliberately to one line plus a short tail. The artist's question is "did anyone
 * play it, and where from" — a table would answer a question nobody asked and would not
 * fit beside the link anyway.
 *
 * Says nothing at all until there is a listen. An empty "0 listens" sitting under a link
 * the artist has only just created reads as a verdict on the music rather than a count
 * that has not started, and the opens line above already covers the quiet case.
 */
/**
 * Someone is listening at this moment.
 *
 * Says only what is true. Nobody is named, because a private link is unlisted and the
 * listener has no account - the honest report is that a person is playing the record,
 * which track, and the country it is coming from.
 *
 * Disappears on its own about a minute after they stop, because the badge is driven by
 * the listener's player still saying it is running. A live indicator that lingers is
 * worse than none: the artist learns to distrust it.
 */
function LiveNow({ live }: { live?: LinkLive }) {
  if (!live || live.count === 0) return null;

  const countries = Array.from(
    new Set(live.listeners.map((l) => l.country).filter(Boolean) as string[])
  );

  return (
    <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-2.5 flex items-start gap-2.5">
      {/* The pulse is the point: it is the one thing on the page that says "now". */}
      <span className="relative flex h-2 w-2 mt-1 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <div className="min-w-0">
        <p className="font-body text-emerald-200 text-[11px] font-medium">
          {live.count === 1
            ? "Someone is listening right now"
            : `${live.count} people are listening right now`}
          {countries.length > 0 ? ` - ${countries.join(", ")}` : ""}
        </p>
        <p className="font-body text-emerald-200/50 text-[10px] mt-0.5">
          Updates on its own while they play.
        </p>
      </div>
    </div>
  );
}

function ListenSummary({ listens }: { listens?: LinkListens }) {
  if (!listens || listens.total === 0) return null;

  const { total, people, countries, last_at } = listens;
  const when = timeAgo(last_at);

  return (
    <div className="rounded-lg border border-[#C30100]/20 bg-[#C30100]/[0.06] px-3 py-2.5 flex flex-col gap-1">
      <p className="font-body text-white text-[11px]">
        <span className="font-medium">
          {total} {total === 1 ? "listen" : "listens"}
        </span>
        <span className="text-white/45">
          {" · "}
          {people} {people === 1 ? "person" : "people"}
          {countries.length > 0 ? ` · ${countries.slice(0, 4).join(", ")}` : ""}
          {countries.length > 4 ? ` +${countries.length - 4}` : ""}
          {when ? ` · ${when}` : ""}
        </span>
      </p>
      {/* The distinction that matters, said once rather than inferred from two numbers. */}
      <p className="font-body text-white/30 text-[10px]">
        Someone played at least 30 seconds — not just opened the page.
      </p>
    </div>
  );
}

/**
 * Create and manage the private listening link for one release.
 *
 * Lives in the release detail rather than on the card: creating one is a decision with a
 * passcode attached, and the card has room for a headphone icon and nothing else.
 */
export default function PrivateLinkPanel({
  releaseId,
  link,
  onCreate,
  onUpdate,
}: {
  releaseId: number;
  link?: PrivateLink;
  onCreate: (payload: { music_upload_id: number; visibility: LinkVisibility; passcode?: string; label?: string }) => Promise<{ error: string | null }>;
  onUpdate: (id: number, payload: { visibility?: LinkVisibility; passcode?: string }) => Promise<{ error: string | null }>;
}) {
  const [visibility, setVisibility] = useState<LinkVisibility>("public");
  const [passcode, setPasscode] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /*
   * Poll the live listener count.
   *
   * Without this the badge renders whatever the page happened to fetch when it loaded,
   * which for a "listening right now" indicator is worse than showing nothing: the artist
   * opens the panel while someone is playing and sees an empty box, or sees a listener who
   * left ten minutes ago. Presence only lasts a minute server-side, so it has to be re-read
   * on roughly that cadence to mean anything.
   *
   * Fifteen seconds against a sixty-second window, so a listener is picked up well within
   * the first beat and disappears promptly once they stop. Only while a link exists, and
   * the interval is cleared on unmount so closing the modal stops the requests.
   */
  const [livePresence, setLivePresence] = useState<LinkLive | undefined>(link?.live);
  const liveSeedRef = useRef<number | undefined>(link?.id);

  useEffect(() => {
    if (!link?.id) return;

    // A different link means the seeded value belongs to the previous one.
    if (liveSeedRef.current !== link.id) {
      liveSeedRef.current = link.id;
      setLivePresence(link.live);
    }

    let cancelled = false;

    const poll = async () => {
      const res = await getLinkLive(link.id);
      // Failures are left alone rather than blanking the badge: a dropped request is not
      // evidence that everybody stopped listening.
      if (!cancelled && !res.error && res.data) setLivePresence(res.data);
    };

    void poll();
    const timer = setInterval(poll, 15_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [link?.id, link?.live]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the link and copy it by hand.");
    }
  };

  const create = async () => {
    if (visibility === "private" && passcode.trim().length < 4) {
      setError("Choose a passcode of at least 4 characters, or make the link public.");
      return;
    }

    setBusy(true);
    setError(null);

    const res = await onCreate({
      music_upload_id: releaseId,
      visibility,
      ...(visibility === "private" ? { passcode: passcode.trim() } : {}),
      ...(label.trim() ? { label: label.trim() } : {}),
    });

    if (res.error) setError(res.error);
    else { setPasscode(""); setLabel(""); }

    setBusy(false);
  };

  /* ─── Nothing yet ─────────────────────────────────────────────────────── */

  if (!link) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] p-4 flex flex-col gap-3">
        <div>
          <p className="font-heading text-white uppercase text-xs tracking-wide">Private listening link</p>
          <p className="font-body text-white/40 text-[11px] mt-1 leading-relaxed">
            A page where someone can hear this release before it is out — for a playlist
            editor, a blog or your manager. No downloads, and you can delete it at any time.
          </p>
        </div>

        <div className="flex gap-2">
          {(["public", "private"] as LinkVisibility[]).map((v) => (
            <button
              key={v}
              onClick={() => { setVisibility(v); setError(null); }}
              className={[
                "flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                visibility === v ? "border-[#C30100] bg-[#C30100]/10" : "border-white/10 hover:border-white/25",
              ].join(" ")}
            >
              <span className="font-body text-white text-xs block">
                {v === "public" ? "Anyone with the link" : "Passcode"}
              </span>
              <span className="font-body text-white/35 text-[10px] block mt-0.5">
                {v === "public" ? "Opens straight away" : "They must type a code"}
              </span>
            </button>
          ))}
        </div>

        {visibility === "private" && (
          <input
            type="text"
            value={passcode}
            onChange={(e) => { setPasscode(e.target.value); setError(null); }}
            placeholder="Passcode you will give them"
            className="w-full bg-[#180F0F] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-xs placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        )}

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What is it for? e.g. Spotify editorial (optional)"
          className="w-full bg-[#180F0F] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-xs placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
        />

        {error && <p className="font-body text-[#C30100] text-[11px]">{error}</p>}

        <button
          onClick={create}
          disabled={busy}
          className="w-full min-h-[44px] font-heading text-white uppercase text-[11px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] disabled:opacity-40 py-2.5 transition-colors"
        >
          {busy ? "Creating…" : "Create link"}
        </button>
      </div>
    );
  }

  /* ─── One exists ──────────────────────────────────────────────────────── */

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0E0808] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-white uppercase text-xs tracking-wide">Private listening link</p>
        <span className="font-body text-[10px] rounded-full px-2 py-0.5 bg-white/10 text-white/50">
          {link.has_passcode ? "Passcode" : "Anyone with the link"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link.url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-[#180F0F] border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white/70 text-[11px] outline-none"
        />
        <button
          onClick={() => copy(link.url)}
          className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-lg border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-3 py-2.5 transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="font-body text-white/35 text-[11px]">
        {link.view_count} {link.view_count === 1 ? "open" : "opens"}
        {link.label ? ` · ${link.label}` : ""}
      </p>

      <LiveNow live={livePresence} />
      <ListenSummary listens={link.listens} />

      {/* No delete here on purpose: a link may already be with a playlist editor, and it
          must not stop working from this screen. Support can take one down. */}
      <p className="font-body text-white/25 text-[10px] leading-relaxed">
        This link stays live so anyone you have sent it to keeps access. Contact support if it
        needs taking down.
      </p>

      {error && <p className="font-body text-[#C30100] text-[11px]">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2"
        >
          Open it
        </a>

        <span className="text-white/15">·</span>

        {/* Switching to public drops the passcode server-side, so this is not a toggle that
            leaves a dormant code behind. Going the other way needs a new one. */}
        {link.has_passcode ? (
          <button
            onClick={async () => {
              setBusy(true);
              const res = await onUpdate(link.id, { visibility: "public" });
              if (res.error) setError(res.error);
              setBusy(false);
            }}
            disabled={busy}
            className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2 disabled:opacity-40"
          >
            Remove passcode
          </button>
        ) : (
          <button
            onClick={async () => {
              const code = window.prompt("Passcode for this link (at least 4 characters)");
              if (!code || code.trim().length < 4) return;
              setBusy(true);
              const res = await onUpdate(link.id, { visibility: "private", passcode: code.trim() });
              if (res.error) setError(res.error);
              setBusy(false);
            }}
            disabled={busy}
            className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2 disabled:opacity-40"
          >
            Add a passcode
          </button>
        )}

      </div>

    </div>
  );
}
