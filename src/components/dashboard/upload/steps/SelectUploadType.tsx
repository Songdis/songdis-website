"use client";

import type { ReleaseType } from "../UploadModal";
import { StepHeader } from "../UploadModal";

const TYPES: {
  id: ReleaseType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "single",
    label: "Single",
    description: "1 track. Perfect for momentum between albums or testing new sounds.",
    icon: <SingleIcon />,
  },
  {
    id: "album",
    label: "Album/EP",
    description: "7+ tracks. A full artistic statement for established artists.",
    icon: <AlbumIcon />,
  },
  {
    id: "mixtape",
    label: "Mixtape",
    description: "Free-form collection. Great for building buzz and loyalty.",
    icon: <MixtapeIcon />,
  },
];

interface Props {
  selected: ReleaseType | null;
  onSelect: (t: ReleaseType) => void;
  onContinue: () => void;
}

export default function SelectUploadType({ selected, onSelect, onContinue }: Props) {
  return (
    <div className="p-8">
      <StepHeader
        title="Select Upload Type"
        subtitle="What kind of release are you creating?"
      />

      {/* Type cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TYPES.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={[
                "flex flex-col items-center text-center p-6 rounded-xl border transition-all duration-200 focus-visible:outline-none",
                isSelected
                  ? "border-[#C30100] bg-[#C30100]/10"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/20",
              ].join(" ")}
            >
              <div className={[
                "w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors",
                isSelected ? "bg-[#C30100]/30 text-[#C30100]" : "bg-white/10 text-white/40",
              ].join(" ")}>
                {t.icon}
              </div>
              <p className="font-body text-white text-sm font-medium mb-2">{t.label}</p>
              <p className="font-body text-white/40 text-xs leading-relaxed">{t.description}</p>
            </button>
          );
        })}
      </div>

      {/* Supported formats */}
      <p className="font-body text-white/30 text-xs text-center mb-6">
        Supported: MP3, WAV, FLAC, M4A, OGG &nbsp;·&nbsp; Max 250MB
      </p>

      {/* Ayo tip */}
      <div className="flex items-start gap-3 rounded-xl border border-[#C30100]/20 bg-[#C30100]/5 px-4 py-4 mb-8">
        <div className="w-8 h-8 rounded-full bg-[#C30100]/20 flex items-center justify-center shrink-0 mt-0.5">
          <AyoIcon />
        </div>
        <div>
          <p className="font-body text-[#C30100] text-xs font-semibold mb-0.5">Ayo AI · Ayo on Singles</p>
          <p className="font-body text-white/60 text-xs leading-relaxed">
            Singles are ideal for your stage. They build algorithmic momentum faster than EPs. Release consistently, one single every 4–6 weeks is the sweet spot for Afrobeats right now
          </p>
        </div>
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        disabled={!selected}
        className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] py-4 hover:bg-[#C30100] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

function SingleIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 9V3M15 12h6M12 15v6M9 12H3"/></svg>; }
function AlbumIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>; }
function MixtapeIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><circle cx="9" cy="13" r="2"/><circle cx="15" cy="13" r="2"/><path d="M11 13h2"/></svg>; }
function AyoIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="#C30100"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>; }