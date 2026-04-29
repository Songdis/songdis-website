"use client";

interface SubmittedProps {
  onClose: () => void;
  onPitchDSPs: () => void;
}

export default function SubmittedModal({ onClose, onPitchDSPs }: SubmittedProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-10 text-center">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        {/* Check circle */}
        <div className="flex justify-center mb-6">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <circle cx="45" cy="45" r="43" stroke="#C30100" strokeWidth="2"/>
            <path d="M28 45L40 57L62 33" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="font-body text-white text-xl font-bold mb-3">Release Submitted!</h2>
        <p className="font-body text-white/60 text-sm mb-3">
          Your single has been successfully submitted for distribution.
        </p>
        <p className="font-body text-white/40 text-sm mb-6">Next step — Pitch to DSPs</p>

        {/* Platform cards mock */}
        <div className="relative h-28 mb-6 flex items-center justify-center">
          {[
            { label: "TIDAL Rising", x: "-60px", rotate: "-12deg", z: 1 },
            { label: "Fresh Finds", x: "-20px", rotate: "-6deg", z: 2 },
            { label: "New Music Daily", x: "20px", rotate: "4deg", z: 3 },
          ].map((card, i) => (
            <div
              key={i}
              className="absolute w-40 rounded-xl bg-[#0E0808] border border-white/[0.08] p-3 text-left"
              style={{ transform: `translateX(${card.x}) rotate(${card.rotate})`, zIndex: card.z }}
            >
              <p className="font-body text-white text-xs font-semibold">{card.label}</p>
              <p className="font-body text-white/30 text-[10px]">editorial</p>
            </div>
          ))}
        </div>

        <p className="font-body text-white/50 text-sm mb-8">
          Submit your track directly to curators on Apple Music, Spotify, TIDAL and more.
        </p>

        <button
          onClick={onPitchDSPs}
          className="w-full font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] bg-transparent hover:bg-[#C30100] py-4 transition-all"
        >
          Submit to DSP Pitching
        </button>
        <p className="font-body text-white/30 text-xs mt-3">
          You can always do this later from the pitch portal
        </p>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}