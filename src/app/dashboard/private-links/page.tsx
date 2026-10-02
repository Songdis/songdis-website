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
  const { links, isLoading, error, update } = usePrivateLinks();
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
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

                  {link.last_viewed_at && (
                    <>
                      <span className="text-white/15">·</span>
                      <span className="font-body text-white/30 text-[11px]">
                        Last opened {new Date(link.last_viewed_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
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
