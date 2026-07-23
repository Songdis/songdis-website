"use client";

interface SubmittedProps {
  onClose: () => void;
  onPitchDSPs: () => void;
}

export default function SubmittedModal({ onClose, onPitchDSPs }: SubmittedProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div aria-hidden className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] rounded-2xl bg-[#1A0808] border border-white/[0.07] p-6 sm:p-10 text-center overflow-hidden max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors">
          <CloseIcon />
        </button>

        {/* Check circle with glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ background: "radial-gradient(circle, rgba(195,1,0,0.35) 0%, rgba(195,1,0,0) 70%)" }}
            />
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none" className="relative">
              <circle cx="45" cy="45" r="43" stroke="#C30100" strokeWidth="2" />
              <path d="M28 45L40 57L62 33" stroke="#C30100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h2 className="font-body text-white text-xl font-bold mb-3">Release Submitted!</h2>
        <p className="font-body text-white/60 text-sm mb-3">
          Your release has been successfully submitted for distribution.
        </p>
        <p className="font-body text-white/40 text-sm mb-8">Next step — Pitch to DSPs</p>

        {/* Platform cards mock */}
        <div className="relative h-40 mb-6 sm:mb-8 flex items-center justify-center scale-75 sm:scale-100">
          {/* Back card: TIDAL */}
          <div
            className="absolute w-44 rounded-xl bg-[#0E1420] border border-blue-400/[0.15] p-3 text-left shadow-lg"
            style={{ transform: "translate(-64px, -18px) rotate(-10deg)", zIndex: 1 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <TidalIcon />
              <div>
                <p className="font-body text-white text-xs font-semibold leading-tight">TIDAL Rising</p>
                <p className="font-body text-white/30 text-[10px]">TIDAL · Editorial</p>
              </div>
            </div>
          </div>

          {/* Middle card: Spotify */}
          <div
            className="absolute w-44 rounded-xl bg-[#0E1410] border border-green-400/[0.15] p-3 text-left shadow-lg"
            style={{ transform: "translate(-24px, -6px) rotate(-5deg)", zIndex: 2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <SpotifyIcon />
              <div>
                <p className="font-body text-white text-xs font-semibold leading-tight">Fresh Finds</p>
                <p className="font-body text-white/30 text-[10px]">Spotify · Editorial</p>
              </div>
            </div>
          </div>

          {/* Front card: Apple Music, with thumbnails */}
          <div
            className="absolute w-52 rounded-xl bg-[#150808] border border-white/[0.08] p-3 text-left shadow-2xl"
            style={{ transform: "translate(20px, 8px) rotate(3deg)", zIndex: 3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AppleMusicIcon />
              <div>
                <p className="font-body text-white text-xs font-semibold leading-tight">New Music Daily</p>
                <p className="font-body text-white/30 text-[10px]">Apple Music · Editorial</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-orange-400 to-red-600" />
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-fuchsia-400 to-indigo-600" />
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-sky-400 to-blue-700" />
            </div>
          </div>
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#1DB954] flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.6-1.6-5.9-2-9.8-1.1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4.2-1 7.9-.5 10.8 1.3.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.1.3-3-1.8-7.5-2.4-11-1.3-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 4-1.2 9-.6 12.4 1.5.4.2.5.7.2 1zm.1-3.4c-3.5-2.1-9.4-2.3-12.8-1.3-.5.1-1-.2-1.1-.6-.1-.5.2-1 .6-1.1 3.9-1.2 10.3-.9 14.4 1.5.4.3.6.9.3 1.3-.3.4-.9.5-1.4.2z" />
      </svg>
    </div>
  );
}

function AppleMusicIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FA233B] to-[#FB5C74] flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
        <path d="M23 3.6v13.2c0 1.5-1 2.7-2.5 3-.3 0-.6.1-.9.1-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7c.5 0 .9.1 1.3.3V6.4L11 8.2v10.6c0 1.5-1 2.7-2.5 3-.3 0-.6.1-.9.1-1.5 0-2.7-1.2-2.7-2.7s1.2-2.7 2.7-2.7c.5 0 .9.1 1.3.3V6.9c0-.4.3-.8.7-.9L21.5 3c.5-.1 1 .1 1.3.4.2.1.2.3.2.2z" />
      </svg>
    </div>
  );
}

function TidalIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
        <path d="M12 3.5L8.25 7.25 12 11 15.75 7.25 12 3.5zM4.5 7.25L.75 11l3.75 3.75L8.25 11 4.5 7.25zm15 0L15.75 11l3.75 3.75L23.25 11l-3.75-3.75zM12 11l-3.75 3.75L12 18.5l3.75-3.75L12 11z" />
      </svg>
    </div>
  );
}