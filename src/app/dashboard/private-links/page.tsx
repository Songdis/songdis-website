"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { usePrivateLinks } from "@/lib/hooks/usePrivateLinks";
import type { PrivateLink } from "@/lib/api/privateLinks";

/**
 * Every private listening link the artist has, in one place.
 *
 * The release detail modal can create one and manage that one. This page is for the artist
 * who has a dozen of them and wants to see which are open to anyone, which need a passcode,
 * and which are actually being listened to.
 */
export default function PrivateLinksPage() {
  const { links, isLoading, error, update, reply } = usePrivateLinks();
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [openComments, setOpenComments] = useState<number | null>(null);
  /** Which links are showing their whole thread rather than the first two. */
  const [expanded, setExpanded] = useState<number | null>(null);
  /** The comment being answered, and what has been typed so far. */
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) return links;

    return links.filter((l) =>
      [l.release?.title, l.label].some((field) => (field ?? "").toLowerCase().includes(needle))
    );
  }, [links, query]);

  const copy = async (link: PrivateLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setActionError("Could not copy. Select the link and copy it by hand.");
    }
  };

  const sendReply = async (commentId: number) => {
    if (!replyBody.trim() || replying) return;

    setReplying(true);
    setActionError(null);

    const res = await reply(commentId, replyBody.trim());

    if (res.error) setActionError(res.error);
    else { setReplyTo(null); setReplyBody(""); }

    setReplying(false);
  };

  const makePublic = async (link: PrivateLink) => {
    setBusyId(link.id);
    setActionError(null);
    const res = await update(link.id, { visibility: "public" });
    if (res.error) setActionError(res.error);
    setBusyId(null);
  };

  const makePrivate = async (link: PrivateLink) => {
    const code = window.prompt("Passcode for this link (at least 4 characters)");
    if (!code || code.trim().length < 4) return;

    setBusyId(link.id);
    setActionError(null);
    const res = await update(link.id, { visibility: "private", passcode: code.trim() });
    if (res.error) setActionError(res.error);
    setBusyId(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-white uppercase text-xl tracking-wide">Private Links</h1>
          <p className="font-body text-white/50 text-sm mt-1">
            Share a release before it is out — with a playlist editor, a blog or your manager.
            No downloads.
          </p>
        </div>

        {actionError && (
          <div className="rounded-xl border border-[#C30100]/30 bg-[#C30100]/[0.07] p-4">
            <p className="font-body text-white/80 text-sm">{actionError}</p>
          </div>
        )}

        {links.length > 4 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${links.length} links by release or purpose`}
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        )}

        {isLoading ? (
          <p className="font-body text-white/30 text-sm text-center py-16">Loading your links…</p>
        ) : error ? (
          <p className="font-body text-white/40 text-sm text-center py-16">{error}</p>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-10 text-center">
            <p className="font-heading text-white uppercase text-sm tracking-widest mb-2">
              No private links yet
            </p>
            <p className="font-body text-white/40 text-sm max-w-md mx-auto leading-relaxed">
              One is created for you when a release is approved, and you can make your own from
              any release — open it under Your Music and look for the private listening link.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="font-body text-white/30 text-sm text-center py-16">
            Nothing matches “{query}”.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((link) => (
              <div
                key={link.id}
                className="rounded-2xl border border-white/[0.06] bg-[#180F0F] p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                    {link.release?.artwork_url && (
                      <Image
                        src={link.release.artwork_url}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-body text-white text-sm truncate">
                      {link.release?.title ?? "Release"}
                    </p>
                    <p className="font-body text-white/35 text-[11px] truncate mt-0.5">
                      {link.release?.upload_type ?? "Release"}
                      {link.label ? ` · ${link.label}` : ""}
                      {` · ${link.view_count} ${link.view_count === 1 ? "open" : "opens"}`}
                      {link.comments?.length
                        ? ` · ${link.comments.length} ${link.comments.length === 1 ? "comment" : "comments"}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={[
                      "shrink-0 font-body text-[10px] rounded-full px-2.5 py-1",
                      link.has_passcode
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-300",
                    ].join(" ")}
                  >
                    {link.has_passcode ? "Passcode" : "Anyone with the link"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={link.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2.5 font-mono text-white/70 text-[11px] outline-none"
                  />
                  <button
                    onClick={() => copy(link)}
                    className="shrink-0 font-heading text-white uppercase text-[10px] tracking-widest rounded-lg border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] px-3 py-2.5 transition-colors"
                  >
                    {copiedId === link.id ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2"
                  >
                    Open it
                  </a>

                  <span className="text-white/15">·</span>

                  {link.has_passcode ? (
                    <button
                      onClick={() => makePublic(link)}
                      disabled={busyId === link.id}
                      className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2 disabled:opacity-40"
                    >
                      Make it open to anyone
                    </button>
                  ) : (
                    <button
                      onClick={() => makePrivate(link)}
                      disabled={busyId === link.id}
                      className="font-body text-white/50 hover:text-white text-[11px] underline underline-offset-2 disabled:opacity-40"
                    >
                      Add a passcode
                    </button>
                  )}

                  {link.comments && link.comments.length > 0 && (
                    <>
                      <span className="text-white/15">·</span>
                      <button
                        onClick={() => setOpenComments(openComments === link.id ? null : link.id)}
                        aria-expanded={openComments === link.id}
                        className="font-body text-[#C30100] hover:text-white text-[11px] underline underline-offset-2"
                      >
                        {openComments === link.id ? "Hide feedback" : `Read ${link.comments.length} comment${link.comments.length === 1 ? "" : "s"}`}
                      </button>
                    </>
                  )}

                  {link.last_viewed_at && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="font-body text-white/30 text-[11px]">
                        Last opened {new Date(link.last_viewed_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>

                {/*
                  What people actually said.
                  The track is named on every comment: an album's link covers several songs,
                  and "the hook needs work" is useless without knowing which one.
                */}
                {openComments === link.id && link.comments && (
                  <div className="flex flex-col gap-2 pt-1">
                    {(expanded === link.id ? link.comments : link.comments.slice(0, 2)).map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-xl bg-[#0E0808] border border-white/[0.05] px-3.5 py-3"
                      >
                        <p className="font-body text-[12px]">
                          <span className="text-white">{comment.author_name}</span>
                          {comment.track_title && (
                            <span className="text-white/40"> on {comment.track_title}</span>
                          )}
                          {comment.at_seconds !== null && (
                            <span className="text-[#C30100]">
                              {" "}at {Math.floor(comment.at_seconds / 60)}:
                              {String(comment.at_seconds % 60).padStart(2, "0")}
                            </span>
                          )}
                        </p>

                        <p className="font-body text-white/60 text-[12px] leading-relaxed mt-1.5 whitespace-pre-line">
                          {comment.body}
                        </p>

                        {comment.created_at && (
                          <p className="font-body text-white/25 text-[10px] mt-1.5">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        )}

                        {/* Your answer, which whoever left the comment sees on the link. */}
                        {comment.reply_body && replyTo !== comment.id && (
                          <div className="mt-2.5 pl-3 border-l-2 border-[#C30100]/40">
                            <p className="font-body text-[#C30100] text-[11px]">You replied</p>
                            <p className="font-body text-white/60 text-[12px] leading-relaxed mt-0.5 whitespace-pre-line">
                              {comment.reply_body}
                            </p>
                          </div>
                        )}

                        {replyTo === comment.id ? (
                          <div className="mt-2.5 flex flex-col gap-2">
                            <textarea
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              rows={2}
                              maxLength={2000}
                              placeholder={`Reply to ${comment.author_name}`}
                              className="w-full bg-[#180F0F] border border-white/10 rounded-lg px-3 py-2 font-body text-white text-[12px] placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors resize-none"
                            />
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => sendReply(comment.id)}
                                disabled={replying || !replyBody.trim()}
                                className="font-heading text-white uppercase text-[10px] tracking-widest rounded-full border border-[#C30100] bg-[#C30100]/10 hover:bg-[#C30100] disabled:opacity-40 px-3.5 py-1.5 transition-colors"
                              >
                                {replying ? "Sending…" : "Reply"}
                              </button>
                              <button
                                onClick={() => { setReplyTo(null); setReplyBody(""); }}
                                className="font-body text-white/40 hover:text-white/70 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setReplyTo(comment.id); setReplyBody(comment.reply_body ?? ""); }}
                            className="mt-2 font-body text-white/45 hover:text-white text-[11px] underline underline-offset-2"
                          >
                            {comment.reply_body ? "Edit your reply" : "Reply"}
                          </button>
                        )}
                      </div>
                    ))}

                    {link.comments.length > 2 && (
                      <button
                        onClick={() => setExpanded(expanded === link.id ? null : link.id)}
                        className="self-start font-body text-white/45 hover:text-white text-[11px] underline underline-offset-2"
                      >
                        {expanded === link.id ? "Show less" : `Show ${link.comments.length - 2} more`}
                      </button>
                    )}

                    <p className="font-body text-white/25 text-[10px] leading-relaxed">
                      Anyone you send the link to can leave feedback — the name is whatever they
                      typed. Contact support if something here should not be.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Said once, at the bottom, rather than on every row. */}
        {links.length > 0 && (
          <p className="font-body text-white/25 text-[11px] leading-relaxed">
            These links stay live so anyone you have sent them to keeps access. Contact support
            if one needs taking down.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
