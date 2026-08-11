"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Lock, ShieldAlert } from "lucide-react";
import { publicKitLabel, publicKitOrigin, slugify } from "@/lib/api/press-kit";
import type { SlugState } from "@/lib/hooks/usePressKit";
import { PrimaryButton, SecondaryButton, Sheet } from "./primitives";
import { ACCENT_TEXT } from "./theme";

export function AddressSheet({
  open,
  onClose,
  slug,
  suggestedFrom,
  onCheck,
  onSave,
  onCopy,
  isPublished,
}: {
  open: boolean;
  onClose: () => void;
  slug: SlugState;
  suggestedFrom: string;
  onCheck: (value: string) => void;
  onSave: (value: string) => Promise<boolean>;
  onCopy: () => void;
  isPublished: boolean;
}) {
  const [value, setValue] = useState(slug.current ?? "");

  useEffect(() => {
    if (open) setValue(slug.current ?? slugify(suggestedFrom));
  }, [open, slug.current, suggestedFrom]);

  const currentLabel = publicKitLabel(slug.current);
  const origin = publicKitOrigin().replace(/^https?:\/\//, "");
  const changed = value.trim().toLowerCase() !== (slug.current ?? "");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your web address"
      subtitle="This is the link you send to a blog, a promoter or a playlist curator."
    >
      {/* Current address */}
      <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 flex items-center gap-3">
        <Link2 size={16} className="text-white/35 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 min-w-0">
          <p className="font-body text-[10px] uppercase tracking-[0.12em] text-white/35">
            Current
          </p>
          <p className="font-body text-white text-sm font-medium truncate mt-0.5">
            {currentLabel ?? "Not set yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!currentLabel}
          className="shrink-0 font-body text-[12px] font-semibold flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F] rounded px-1"
          style={{ color: ACCENT_TEXT }}
        >
          <Copy size={13} aria-hidden />
          Copy
        </button>
      </div>

      {!isPublished && currentLabel && (
        <p className="font-body text-[11px] text-white/40 flex items-start gap-2 -mt-1">
          <Lock size={12} className="mt-px shrink-0" aria-hidden />
          <span>
            The link works only once the kit is published. Until then it returns
            &ldquo;not found&rdquo; — which is deliberate, so an unpublished address
            cannot be probed for.
          </span>
        </p>
      )}

      {/* Editor */}
      <div>
        <label
          htmlFor="pk-slug"
          className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40 block mb-2"
        >
          Change the address
        </label>

        <div
          className={[
            "flex items-center rounded-xl border bg-black/25 pl-3 pr-1.5 py-1 gap-1",
            slug.problem ? "border-[#d03b3b]/60" : "border-white/[0.08] focus-within:border-white/25",
          ].join(" ")}
        >
          <span className="font-body text-white/35 text-sm shrink-0 hidden xs:inline">
            {origin}/k/
          </span>
          <span className="font-body text-white/35 text-sm shrink-0 xs:hidden">/k/</span>
          <input
            id="pk-slug"
            value={value}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="url"
            aria-invalid={slug.problem ? true : undefined}
            aria-describedby="pk-slug-msg"
            onChange={(e) => {
              const next = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
              setValue(next);
              onCheck(next);
            }}
            className="flex-1 min-w-0 bg-transparent border-none outline-none font-body text-white text-sm py-2"
            placeholder="your-name"
          />
        </div>

        <div id="pk-slug-msg" className="mt-2 min-h-[18px]">
          {slug.problem === "taken" && (
            <SlugProblemNote
              icon={<ShieldAlert size={12} aria-hidden />}
              headline="That address is already taken"
              body={
                slug.message ??
                "Another artist claimed it first. Stage names are not unique on Songdis, so the earliest claim keeps the clean address."
              }
              suggestion={`Try ${value}-music, ${value}-official, or ${value}2.`}
            />
          )}

          {slug.problem === "reserved" && (
            <SlugProblemNote
              icon={<Lock size={12} aria-hidden />}
              headline="That word is reserved by Songdis"
              body={
                slug.message ??
                "It is used by the platform itself, so it can never be an artist address."
              }
              suggestion="Add a word to it, or use your full artist name."
            />
          )}

          {slug.problem &&
            slug.problem !== "taken" &&
            slug.problem !== "reserved" && (
              <p className="font-body text-[11px]" style={{ color: ACCENT_TEXT }}>
                {slug.message ?? "That address cannot be used."}
              </p>
            )}

          {!slug.problem && slug.savedAt && !changed && (
            <p className="font-body text-[11px] text-white/45">Address updated.</p>
          )}
        </div>
      </div>

      {changed && (
        <p className="font-body text-[11px] text-white/45 leading-relaxed">
          Changing this breaks any link you have already shared — the old address stops
          working immediately and does not redirect.
        </p>
      )}

      <div className="flex items-center gap-2.5">
        <PrimaryButton
          onClick={() => void onSave(value)}
          disabled={!changed || slug.saving || value.trim() === ""}
        >
          {slug.saving ? "Saving…" : "Save address"}
        </PrimaryButton>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
      </div>
    </Sheet>
  );
}

function SlugProblemNote({
  icon,
  headline,
  body,
  suggestion,
}: {
  icon: React.ReactNode;
  headline: string;
  body: string;
  suggestion: string;
}) {
  return (
    <div className="rounded-lg border border-[#d03b3b]/35 bg-[#d03b3b]/[0.08] px-3 py-2.5 flex flex-col gap-1">
      <p
        className="font-body text-[11.5px] font-semibold flex items-center gap-1.5"
        style={{ color: ACCENT_TEXT }}
      >
        {icon}
        {headline}
      </p>
      <p className="font-body text-white/65 text-[11px] leading-relaxed">{body}</p>
      <p className="font-body text-white/40 text-[11px]">{suggestion}</p>
    </div>
  );
}
