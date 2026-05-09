"use client";

import { useRef, useState, useEffect } from "react";
import type { UploadState } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-body text-white/70 text-xs">{label}</label>
      {children}
      {hint && <p className="font-body text-white/30 text-[11px] leading-relaxed">{hint}</p>}
    </div>
  );
}

function DashSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm outline-none focus:border-[#C30100] transition-colors pr-8"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}

interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
}

export default function UploadTrack({ state, update, onBack, onContinue, onSaveDraft }: Props) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tiktokStamp, setTiktokStamp] = useState("");

  /* Revoke old object URL when file changes to avoid memory leak */
  useEffect(() => {
    if (!audioFile) return;
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  /* Sync playing state with audio element */
  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing]);

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setAudioFile(file);
    update({ audioFile: file });
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioElRef.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  };

  const setTikTokStampFromCurrent = () => {
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const stamp = `${mins}:${String(secs).padStart(2, "0")}`;
    setTiktokStamp(stamp);
    update({ tiktokTimestamp: Math.floor(currentTime) });
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const titleLabel = state.releaseType === "single" ? "Upload Single" :
    state.releaseType === "album" ? "Upload Album" : "Upload Mixtape";

  return (
    <div className="p-8 max-h-[90vh] overflow-y-auto">
      <StepHeader
        title="Upload Track"
        subtitle="Upload your audio files and complete all track information"
      />
      <StepProgress current={2} />

      <div className="flex flex-col gap-5">
        <p className="font-body text-white text-sm font-medium">Track 1</p>

        {/* Info notice */}
        <div className="border border-dashed border-[#C30100]/30 rounded-xl p-4">
          <p className="font-body text-white/60 text-xs font-semibold mb-2">Track Information:</p>
          <ul className="space-y-1">
            {[
              "Each track requires complete metadata including writers and performers",
              "ISRC codes will be auto-generated if not provided",
              "Distributing artist (Vjazzy) is automatically added as a performer",
              "Singles can only have one track",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 font-body text-white/40 text-xs">
                <span className="text-[#C30100] shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Audio drop zone */}
        <button
          onClick={() => audioInputRef.current?.click()}
          className={[
            "w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 transition-colors",
            audioFile
              ? "border-[#C30100]/60 bg-[#C30100]/5"
              : "border-white/10 hover:border-white/25",
          ].join(" ")}
        >
          <AudioIcon />
          <p className="font-body text-white/50 text-sm">
            {audioFile ? audioFile.name : "Drop your audio file or click to browse"}
          </p>
          <p className="font-body text-white/25 text-xs">WAV, MP3, FLAC · Max 500MB · 24-bit recommended</p>
        </button>
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudio} />

        {/* Hidden audio element — controlled by our custom player UI */}
        {audioUrl && (
          <audio
            ref={audioElRef}
            src={audioUrl}
            onTimeUpdate={() => setCurrentTime(audioElRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => {
              const dur = audioElRef.current?.duration ?? 0;
              setDuration(dur);
              // Save formatted duration to UploadState for API submission
              const m = Math.floor(dur / 60);
              const s = Math.floor(dur % 60);
              update({ audioDuration: `${m}:${String(s).padStart(2, "0")}` });
            }}
            onEnded={() => setPlaying(false)}
            preload="metadata"
          />
        )}

        {/* Add track button (for albums) */}
        {state.releaseType !== "single" && (
          <button className="w-full flex items-center justify-center gap-2 font-heading text-white/50 uppercase text-xs tracking-widest rounded-full border border-white/10 py-3.5 hover:border-white/25 transition-colors">
            <span className="text-lg leading-none">+</span> Add Track
          </button>
        )}

        {/* Track Details */}
        <p className="font-body text-white text-sm font-medium mt-2">Track Details</p>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Track Title">
            <input
              value={state.trackTitle}
              onChange={(e) => update({ trackTitle: e.target.value })}
              placeholder="Enter track title"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>
          <Field label="Mixed Version">
            <input
              value={state.mixedVersion}
              onChange={(e) => update({ mixedVersion: e.target.value })}
              placeholder="eg radio edit"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
            />
          </Field>
        </div>

        {/* Artist Details */}
        <SectionBox label="Artist Details" noAction>
          <input
            value={state.artistDetails}
            onChange={(e) => update({ artistDetails: e.target.value })}
            placeholder="e.g. Vjazzy (Main Artist), Davido (Featured)"
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        </SectionBox>

        {/* Classification */}
        <SectionBox label="Classification" noAction>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="Explicit Content">
              <DashSelect value={state.explicitContent} onChange={(v) => update({ explicitContent: v })} options={["Yes", "No", "Clean"]} />
            </Field>
            <Field label="Genre">
              <DashSelect value={state.genre} onChange={(v) => update({ genre: v })} placeholder="Select genre" options={["Afrobeats", "Afropop", "Hip-Hop", "R&B", "Pop"]} />
            </Field>
            <Field label="Sub-genre">
              <DashSelect value={state.subGenre} onChange={(v) => update({ subGenre: v })} placeholder="Select sub-genre first" options={[]} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Recorded Year">
              <DashSelect value={state.recordedYear} onChange={(v) => update({ recordedYear: v })} options={["2026", "2025", "2024", "2023"]} />
            </Field>
            <Field label="ISRC">
              <input value={state.isrc} onChange={(e) => update({ isrc: e.target.value })} placeholder="Auto-generated if blank" className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            </Field>
            <Field label="Stereo AI Use">
              <DashSelect value="None" onChange={() => {}} options={["None", "Partial", "Full"]} />
            </Field>
          </div>
        </SectionBox>

        {/* Writers */}
        <SectionBox label="Writers" noAction>
          <input
            value={state.writers}
            onChange={(e) => update({ writers: e.target.value })}
            placeholder="e.g. John Doe (Composer), Jane Smith (Lyricist)"
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        </SectionBox>

        {/* Production */}
        <SectionBox label="Production" noAction>
          <input
            value={state.producers}
            onChange={(e) => update({ producers: e.target.value })}
            placeholder="e.g. Sarz (Producer), Krizbeatz (Co-producer)"
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        </SectionBox>

        {/* Performer */}
        <SectionBox label="Performer" noAction>
          <input
            value={state.performers}
            onChange={(e) => update({ performers: e.target.value })}
            placeholder="e.g. Vjazzy (Lead Vocals), Fireboy (Backing Vocal)"
            className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
          />
        </SectionBox>

        {/* Lyrics */}
        <SectionBox label="Lyrics" noAction rightLabel={<DashSelect value="English" onChange={() => {}} options={["English", "Yoruba", "French"]} />}>
          <textarea
            value={state.lyrics}
            onChange={(e) => update({ lyrics: e.target.value })}
            rows={4}
            className="w-full bg-transparent font-body text-white/50 text-sm outline-none resize-none placeholder:text-white/20"
            placeholder="Enter lyrics..."
          />
        </SectionBox>

        {/* Audio Preview */}
        <SectionBox label="Audio Preview" noAction>
          {!audioFile ? (
            <p className="font-body text-white/30 text-xs">Upload an audio file above to preview it here.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-body text-white/40 text-xs shrink-0 tabular-nums">
                    {fmt(currentTime)} / {fmt(duration)}
                  </span>
                  {/* Seekable progress bar */}
                  <div
                    className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-[#C30100] rounded-full pointer-events-none transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <button className="text-white/30 hover:text-white/50 transition-colors">
                  <VolumeIcon />
                </button>
              </div>
              <button
                onClick={setTikTokStampFromCurrent}
                className="w-full mt-4 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] py-3 hover:bg-[#C30100] transition-colors"
              >
                Set Current Time as TikTok Stamp
              </button>
            </>
          )}
        </SectionBox>

        {/* TikTok Timestamp */}
        <SectionBox label="TikTok Preview Timestamp (Optional)" noAction>
          <p className="font-body text-white/30 text-xs mb-2">
            Specify the start time for TikTok preview (format: mm:ss) · Use the audio player above to preview and select the best timestamp
          </p>
          <input
            value={tiktokStamp}
            onChange={(e) => setTiktokStamp(e.target.value)}
            placeholder="0:00"
            className="w-24 bg-transparent border-b border-white/20 font-body text-white text-sm outline-none pb-1 placeholder:text-white/25"
          />
        </SectionBox>
      </div>

      <div className="mt-8">
        <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
      </div>
    </div>
  );
}

function SectionBox({ label, actionLabel, noAction, rightLabel, children }: {
  label: string;
  actionLabel?: string;
  noAction?: boolean;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#C30100]/25 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-white/70 text-xs font-semibold">{label}</p>
        {!noAction && actionLabel && (
          <button className="font-body text-white/40 text-xs hover:text-white transition-colors">{actionLabel}</button>
        )}
        {rightLabel}
      </div>
      {children}
    </div>
  );
}

function AudioIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function PlayIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function PauseIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function VolumeIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>; }