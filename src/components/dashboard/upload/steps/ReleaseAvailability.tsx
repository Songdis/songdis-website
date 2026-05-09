"use client";

import { useState } from "react";
import type { UploadState } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";

const DSP_LIST = [
  { id: "spotify", label: "Spotify", description: "Leading global streaming platform", color: "#1DB954" },
  { id: "apple", label: "Apple Music", description: "Apple's premium streaming service", color: "#FC3C44" },
  { id: "youtube", label: "YouTube Music", description: "Google's music streaming platform", color: "#FF0000" },
  { id: "7digital", label: "7Digital", description: "Digital music store", color: "#fff" },
  { id: "acrcloud", label: "ACRCloud", description: "Music recognition service", color: "#fff" },
  { id: "alibaba", label: "Alibaba Music", description: "Chinese music platform", color: "#FF6A00" },
  { id: "amazon", label: "Amazon Music", description: "Amazon's streaming service", color: "#00A8E1" },
  { id: "tidal", label: "Tidal", description: "High-fidelity streaming", color: "#fff" },
  { id: "deezer", label: "Deezer", description: "Global music streaming", color: "#A238FF" },
  { id: "soundcloud", label: "SoundCloud", description: "Creator-focused platform", color: "#FF5500" },
  { id: "audiomack", label: "Audiomack", description: "African & global music", color: "#FFA200" },
  { id: "boomplay", label: "Boomplay", description: "Leading African platform", color: "#1890FF" },
  { id: "tiktok", label: "TikTok", description: "Short-form video platform", color: "#fff" },
];

interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  onQuickDrop: () => void;
  isSubmitting?: boolean;
}

export default function ReleaseAvailability({ state, update, onBack, onSubmit, onQuickDrop, isSubmitting }: Props) {
  const [search, setSearch] = useState("");

  const toggleDSP = (id: string) => {
    const current = state.selectedDSPs;
    update({
      selectedDSPs: current.includes(id)
        ? current.filter((d) => d !== id)
        : [...current, id],
    });
  };

  const selectAll = () => update({ selectedDSPs: DSP_LIST.map((d) => d.id) });
  const clearAll = () => update({ selectedDSPs: [] });

  const filtered = DSP_LIST.filter((d) =>
    d.label.toLowerCase().includes(search.toLowerCase())
  );

  const canSubmit = state.releaseDate && state.agreedToTerms;

  return (
    <div className="p-8 max-h-[90vh] overflow-y-auto">
      <StepHeader
        title="Release Availability"
        subtitle="Configure distribution settings, territories, and platforms"
      />
      <StepProgress current={3} />

      <div className="flex flex-col gap-5">
        {/* Timeline */}
        <div className="border border-dashed border-[#C30100]/25 rounded-xl p-5">
          <p className="font-body text-white/70 text-xs font-semibold mb-4">Timeline</p>

          <label className="flex items-center gap-3 mb-5 cursor-pointer group">
            <div className={[
              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
              "border-white/20 bg-transparent",
            ].join(" ")}>
            </div>
            <div>
              <p className="font-body text-white text-sm">This content has been previously released</p>
              <p className="font-body text-white/30 text-xs">Check this if the content was previously available on streaming platforms or physical releases</p>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-white/70 text-xs">Release Date</label>
                <button
                  onClick={onQuickDrop}
                  className="font-heading text-white uppercase text-[10px] tracking-widest bg-[#C30100]/20 hover:bg-[#C30100]/40 border border-[#C30100]/50 rounded-full px-3 py-1 transition-colors"
                >
                  Quick Drop
                </button>
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={state.releaseDate}
                  onChange={(e) => update({ releaseDate: e.target.value })}
                  className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors [color-scheme:dark]"
                />
              </div>
              <p className="font-body text-white/30 text-[11px] mt-1">
                Minimum 7-14 days from today. Need it faster? Try{" "}
                <button onClick={onQuickDrop} className="text-[#C30100] hover:underline">Quick Drop</button>
              </p>
            </div>

            <div>
              <label className="font-body text-white/70 text-xs block mb-1.5">Pre-Order Date (Optional)</label>
              <input
                type="date"
                value={state.preOrderDate}
                onChange={(e) => update({ preOrderDate: e.target.value })}
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors [color-scheme:dark]"
              />
              <p className="font-body text-white/30 text-[11px] mt-1">Must be before release date</p>
            </div>
          </div>
        </div>

        {/* Territory */}
        <div className="border border-dashed border-[#C30100]/25 rounded-xl p-5">
          <p className="font-body text-white/70 text-xs font-semibold mb-3">Territory Rights</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={[
              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
              state.territory === "worldwide"
                ? "border-[#C30100] bg-[#C30100]"
                : "border-white/20",
            ].join(" ")}>
              {state.territory === "worldwide" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <p className="font-body text-white text-sm">World Wide</p>
              <p className="font-body text-white/30 text-xs">All territories globally</p>
            </div>
          </label>
        </div>

        {/* Providers */}
        <div className="border border-dashed border-[#C30100]/25 rounded-xl p-5">
          <p className="font-body text-white/70 text-xs font-semibold mb-1">Providers</p>
          <p className="font-body text-white/30 text-xs mb-4">Select distribution service providers (DSPs) where your music will be delivered</p>

          {/* Search */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-[#0E0808] border border-white/10 rounded-lg px-4 py-2">
              <SearchIcon />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="flex-1 bg-transparent font-body text-white text-sm placeholder:text-white/25 outline-none"
              />
            </div>
            <button className="font-heading text-white uppercase text-[10px] tracking-widest bg-[#C30100]/20 hover:bg-[#C30100]/40 border border-[#C30100]/50 rounded-lg px-4 transition-colors">
              Search
            </button>
            <button className="w-9 h-9 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors" />
          </div>

          {/* DSP grid */}
          <div className="grid grid-cols-3 gap-y-4 gap-x-4 mb-4">
            {filtered.map((dsp) => {
              const checked = state.selectedDSPs.includes(dsp.id);
              return (
                <label key={dsp.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={[
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                    checked ? "border-[#C30100] bg-[#C30100]" : "border-white/20 group-hover:border-white/40",
                  ].join(" ")} onClick={() => toggleDSP(dsp.id)}>
                    {checked && <CheckIcon />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-white text-xs font-medium truncate">{dsp.label}</p>
                    <p className="font-body text-white/30 text-[10px] truncate">{dsp.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Bulk actions */}
          <div className="flex gap-3">
            <button onClick={clearAll} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-white/15 py-3 hover:border-white/30 transition-colors">
              Clear All
            </button>
            <button onClick={selectAll} className="flex-1 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] py-3 hover:bg-[#C30100] transition-all">
              Select All Partners
            </button>
          </div>

          <p className="font-body text-white/40 text-xs text-center mt-3">
            {state.selectedDSPs.length} and 200+ DSPs selected · Your music will be delivered to all selected platforms on your release date
          </p>
        </div>

        {/* Terms */}
        <div>
          <p className="font-body text-white/70 text-xs font-semibold mb-1">Terms & Conditions</p>
          <p className="font-body text-white/30 text-xs mb-3">Required to proceed with distribution</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => update({ agreedToTerms: !state.agreedToTerms })}
              className={[
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                state.agreedToTerms ? "border-[#C30100] bg-[#C30100]" : "border-white/20",
              ].join(" ")}
            >
              {state.agreedToTerms && <CheckIcon />}
            </div>
            <p className="font-body text-white/60 text-xs leading-relaxed">
              I agree to the terms and conditions of Songdis distribution service. By checking this box, I confirm that I have read and understood all terms, including content ownership rights, revenue sharing, and distribution policies.
            </p>
          </label>
          {!state.agreedToTerms && (
            <p className="font-body text-[#C30100] text-xs mt-2">You must accept the terms and conditions to proceed</p>
          )}
        </div>

        {/* Distribution Summary */}
        <div className="border border-white/[0.06] rounded-xl p-4">
          <p className="font-body text-white text-xs font-semibold mb-3">Distribution Summary</p>
          {[
            { label: "Release Type", value: state.releaseTypeAuto || "Single" },
            { label: "Territory Rights", value: "World Wide" },
            { label: "Release Date", value: state.releaseDate || "Not selected" },
            { label: "Distribution Partners", value: `${state.selectedDSPs.length > 0 ? "200+" : "0"} DSPs selected` },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
              <span className="font-body text-white/40 text-xs">{row.label}</span>
              <span className="font-body text-white text-xs">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <StepActions
          onBack={onBack}
          onSaveDraft={() => {}}
          onContinue={onSubmit}
          continueLabel="Submit Release"
          isSubmit
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}

function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function CheckIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }