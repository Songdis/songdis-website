"use client";

/**
 * The one filter row.
 *
 * Every chart on the page renders against this slice — filters never live
 * inside a chart card, because two cards showing different ranges is a bug the
 * reader has no way to detect. Range changes are optimistic: the hooks swap
 * synchronously on a cache hit and otherwise dim the previous slice rather than
 * collapsing it to a skeleton.
 */

import { useEffect, useState } from "react";
import { RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { PLATFORMS, platformLabel } from "@/lib/api/analytics-v2";
import {
  RANGE_PRESETS,
  useAnalyticsV2,
  type RangePreset,
} from "@/lib/hooks/useAnalyticsV2";
import { platformColor } from "./theme";
import { GhostButton, SegmentedControl } from "./primitives";

export function FilterBar() {
  const {
    preset,
    range,
    setPreset,
    setCustomRange,
    platforms,
    setPlatforms,
    refreshAll,
  } = useAnalyticsV2();

  const [showPlatforms, setShowPlatforms] = useState(false);
  const [draft, setDraft] = useState(range);

  // Seed the custom fields from whichever preset was last active, so opening
  // "Custom" starts from what the artist is currently looking at.
  useEffect(() => {
    setDraft(range);
  }, [range]);

  const togglePlatform = (key: string) => {
    setPlatforms(
      platforms.includes(key) ? platforms.filter((p) => p !== key) : [...platforms, key]
    );
  };

  return (
    <div className="av2-enter rounded-xl border border-white/[0.06] bg-[#180F0F] p-3 sm:p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SegmentedControl<RangePreset>
          ariaLabel="Date range"
          value={preset}
          options={RANGE_PRESETS}
          onChange={setPreset}
        />

        <div className="flex items-center gap-2">
          <GhostButton
            active={platforms.length > 0 || showPlatforms}
            onClick={() => setShowPlatforms((s) => !s)}
            title="Filter by platform"
          >
            <SlidersHorizontal size={12} aria-hidden />
            {platforms.length > 0 ? `${platforms.length} platform${platforms.length > 1 ? "s" : ""}` : "Platforms"}
          </GhostButton>

          <GhostButton onClick={refreshAll} title="Refetch this range">
            <RefreshCw size={12} aria-hidden />
            <span className="hidden sm:inline">Refresh</span>
          </GhostButton>
        </div>
      </div>

      {preset === "custom" && (
        <div className="av2-module flex items-end gap-3 flex-wrap border-t border-white/[0.05] pt-3">
          <label className="flex flex-col gap-1">
            <span className="font-body text-white/40 text-[10px] uppercase tracking-wider">From</span>
            <input
              type="date"
              value={draft.from}
              max={draft.to}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-body text-white/40 text-[10px] uppercase tracking-wider">To</span>
            <input
              type="date"
              value={draft.to}
              min={draft.from}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              className="bg-[#140C0C] border border-white/10 rounded-lg px-3 py-1.5 font-body text-white text-xs outline-none focus:border-[#C30100] transition-colors"
            />
          </label>

          <GhostButton
            active
            onClick={() => {
              if (draft.from && draft.to && draft.from <= draft.to) setCustomRange(draft);
            }}
          >
            Apply
          </GhostButton>
        </div>
      )}

      {showPlatforms && (
        <div className="av2-module border-t border-white/[0.05] pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-body text-white/40 text-[10px] uppercase tracking-wider">
              Platforms
            </p>
            {platforms.length > 0 && (
              <button
                onClick={() => setPlatforms([])}
                className="font-body text-white/40 hover:text-white text-[11px] flex items-center gap-1 transition-colors"
              >
                <X size={11} aria-hidden />
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((key) => {
              const on = platforms.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  aria-pressed={on}
                  className={[
                    "font-body text-[11px] rounded-full px-2.5 py-1 border transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C30100]",
                    on
                      ? "text-white border-white/25 bg-white/[0.07]"
                      : "text-white/45 border-white/[0.08] hover:text-white/80 hover:border-white/20",
                  ].join(" ")}
                >
                  <span
                    className="w-2 h-2 rounded-[2px] shrink-0"
                    style={{
                      backgroundColor: platformColor(key),
                      opacity: on ? 1 : 0.45,
                    }}
                    aria-hidden
                  />
                  {platformLabel(key)}
                </button>
              );
            })}
          </div>

          <p className="font-body text-white/25 text-[10px]">
            Filtering platforms narrows every chart on this page. It does not change a
            platform&apos;s colour anywhere.
          </p>
        </div>
      )}

      <p className="font-body text-white/25 text-[10px]">
        {range.from} to {range.to}
      </p>
    </div>
  );
}
