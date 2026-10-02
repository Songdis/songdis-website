"use client";

import { useState } from "react";

import type { LinkVisibility, PrivateLink } from "@/lib/api/privateLinks";

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
