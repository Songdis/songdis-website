"use client";

/**
 * The theme sheet: six palettes and three headline styles, applied live.
 *
 * "Live" means the choice lands in the draft the moment it is tapped and the preview
 * repaints underneath the sheet — the artist judges a theme by seeing their own page in
 * it, not by reading its name. It is still only persisted by Save, like every other
 * draft edit.
 */

import { Check } from "lucide-react";
import type { HeadlineFont, PressKitTheme } from "@/lib/api/press-kit";
import { PrimaryButton, Sheet } from "./primitives";
import { HEADLINE_OPTIONS, PAGE_THEMES } from "./theme";

export function ThemeSheet({
  open,
  onClose,
  theme,
  headlineFont,
  onTheme,
  onHeadlineFont,
}: {
  open: boolean;
  onClose: () => void;
  theme: PressKitTheme;
  headlineFont: HeadlineFont;
  onTheme: (theme: PressKitTheme) => void;
  onHeadlineFont: (font: HeadlineFont) => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Page theme"
      subtitle="Pick a look for your press kit. The preview updates as you tap — nothing is public until you save and publish."
      footer={
        <PrimaryButton full onClick={onClose}>
          Done
        </PrimaryButton>
      }
    >
      <div
        role="radiogroup"
        aria-label="Page theme"
        className="grid grid-cols-2 gap-2.5 sm:gap-3"
      >
        {PAGE_THEMES.map((t) => {
          const active = t.key === theme;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onTheme(t.key)}
              className={[
                "relative rounded-xl border p-3 text-left transition-colors overflow-hidden",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]",
                active ? "border-white" : "border-white/10 hover:border-white/30",
              ].join(" ")}
            >
              {active && (
                <span
                  className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-white grid place-items-center"
                  aria-hidden
                >
                  <Check size={10} className="text-black" strokeWidth={3.4} />
                </span>
              )}

              {/* The swatch carries the palette itself, so the name is a label and never
                  the only way to tell two themes apart. */}
              <span
                className="block h-12 rounded-lg mb-2.5 relative overflow-hidden"
                style={{ background: `linear-gradient(150deg, ${t.tint}, ${t.bgDeep})` }}
                aria-hidden
              >
                <span
                  className="absolute left-2.5 bottom-2.5 h-2 w-[52%] rounded-full"
                  style={{ background: t.accent }}
                />
                <span
                  className="absolute right-2.5 bottom-2 w-3 h-3 rounded-full"
                  style={{ background: t.gold }}
                />
              </span>

              <span className="font-heading text-white uppercase text-[11px] tracking-wide block">
                {t.name}
              </span>
              <span className="font-body text-white/35 text-[11px] block mt-0.5">
                {t.description}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="font-body text-[10px] uppercase tracking-[0.14em] text-white/40 mb-2.5">
          Headline style
        </p>
        <div role="radiogroup" aria-label="Headline style" className="flex gap-2">
          {HEADLINE_OPTIONS.map((option) => {
            const active = option.key === headlineFont;
            return (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onHeadlineFont(option.key)}
                style={option.preview}
                className={[
                  "flex-1 rounded-xl border py-3 px-2 text-white text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5342F]",
                  active ? "border-white" : "border-white/10 hover:border-white/30",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
