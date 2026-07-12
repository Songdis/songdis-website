"use client";

import { useRef, useState, useEffect } from "react";
import type { UploadState, Contributor, StepFieldErrors } from "../UploadModal";
import { StepHeader, StepProgress, StepActions } from "../UploadModal";

/* ─── Genre / Sub-genre data (matches old app) ─────────────── */

const GENRE_DATA: Record<string, string[]> = {
  Afrobeats: ["Afropop", "Afro-fusion", "Alté (Alternative)", "Afro-swing / Afro-bashment", "Afro-house", "Amapiano-infused Afrobeats"],
  "Hip Hop/Rap": ["Alternative Rap", "East Coast Rap", "West Coast Rap", "Gangsta Rap", "Trap", "Drill"],
  Pop: ["Dance Pop", "Electropop", "Teen Pop", "K-Pop", "J-Pop", "Indie Pop"],
  "R&B/Soul": ["Contemporary R&B", "Neo-Soul", "Soul", "Funk"],
  Rock: ["Alternative Rock", "Hard Rock", "Indie Rock", "Pop Rock"],
  Electronic: ["House", "Techno", "Trance", "Dubstep", "EDM"],
  Jazz: ["Smooth Jazz", "Contemporary Jazz", "Fusion"],
  Classical: ["Orchestral", "Chamber Music", "Opera"],
  Country: ["Contemporary Country", "Country Pop"],
  Reggae: ["Dancehall", "Roots Reggae", "Dub"],
  World: ["Afro-Beat", "Latin", "Reggaeton", "Highlife", "Fuji"],
  Gospel: ["Contemporary Gospel", "Traditional Gospel", "Gospel Rap"],
};

const GENRE_OPTIONS = Object.keys(GENRE_DATA);

/* ─── Role constants ───────────────────────────────────────── */

const WRITER_ROLES = ["Adapter", "Arranger", "Composer", "Librettist", "Lyricist", "Songwriter", "Transcriber", "Vocal Adaptation"];

const PRODUCTION_ROLES = ["Assistant Engineer", "Co-Producer", "Graphic Design", "Guitar Technician", "Mastering Engineer", "Mixing Engineer", "Producer", "Production Assistant", "Recording Engineer", "Sound Engineer", "Vocal Engineer"];

const PERFORMER_ROLES = [
  "12-String Guitar", "Accordion", "Acoustic Guitar", "Actor", "Alto Saxophone", "Alto Solo",
  "Background Vocals", "Banjo", "Baritone Saxophone", "Baritone Solo", "Bass Clarinet",
  "Bass Guitar", "Bass Trombone", "Bassoon", "Bells", "Bongos", "Cajon", "Cello", "Choir",
  "Choir Master", "Chorus", "Clarinet", "Classical Guitar", "Clavier", "Conductor", "Congas",
  "Cornet", "Countertenor Solo", "DJ", "Djembe", "Double Bass", "Drums", "Electric Guitar",
  "Ensemble", "Fiddle", "First Violin", "Flugelhorn", "Flute", "Guitar", "Hammond Organ",
  "Harmonica", "Harmony Vocals", "Harp", "Harpsichord", "Horn", "Keyboards", "Kora",
  "Lead Guitar", "Lead Vocals", "Lute", "Mandolin", "Metallophone", "Mezzo-Soprano Solo",
  "Mixed Artist", "Music Director", "Oboe", "Orchestra", "Organ", "Pedal Steel Guitar",
  "Percussion", "Piano", "Piccolo", "Programming", "Rap", "Recorder", "Rhodes Piano",
  "Rhythm Guitar", "Sampled Artist", "Saxophone", "Second Violin", "Sitar",
  "Soprano Saxophone", "Soprano Solo", "Steel Guitar", "Synthesizer", "Tabla", "Tambourine",
  "Tenor Saxophone", "Tenor Solo", "Timbales", "Timpani", "Trombone", "Trumpet", "Tuba",
  "Ukulele", "Upright Bass", "Viola", "Viola de Gamba", "Violin", "Vocal Ensemble",
  "Vocal Solo", "Vocals", "Whistle", "Xylophone",
];

/* ─── Helpers ──────────────────────────────────────────────── */

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

function SearchableRoleSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-sm outline-none focus:border-[#C30100] transition-colors pr-8 truncate"
      >
        {value || <span className="text-white/25">{placeholder}</span>}
      </button>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg bg-[#1A0808] border border-white/10 shadow-xl">
          <div className="sticky top-0 p-2 bg-[#1A0808]">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#0E0808] border border-white/10 rounded px-3 py-1.5 font-body text-white text-xs outline-none"
            />
          </div>
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => { onChange(o); setOpen(false); setSearch(""); }}
              className="w-full text-left px-4 py-2 font-body text-white/70 text-xs hover:bg-white/5 hover:text-white transition-colors"
            >
              {o}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-2 font-body text-white/30 text-xs">No matches</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Contributor Row ──────────────────────────────────────── */

function ContributorRow({ contributor, roleOptions, onChange, onRemove, canRemove }: {
  contributor: Contributor;
  roleOptions: string[];
  onChange: (patch: Partial<Contributor>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <input
        value={contributor.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Name"
        className="flex-1 min-w-0 bg-[#0E0808] border border-white/10 rounded-lg px-3 py-2.5 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors"
      />
      <div className="w-full sm:w-44 shrink-0">
        <SearchableRoleSelect value={contributor.role} onChange={(v) => onChange({ role: v })} options={roleOptions} placeholder="Select role" />
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors shrink-0 p-1 self-end sm:self-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

/* ─── Contributor Section ──────────────────────────────────── */

function ContributorSection({ label, type, contributors, roleOptions, updateContributors }: {
  label: string;
  type: "writers" | "producers" | "performers";
  contributors: Contributor[];
  roleOptions: string[];
  updateContributors: (type: "writers" | "producers" | "performers", list: Contributor[]) => void;
}) {
  const add = () => {
    const newC: Contributor = { id: `${type}_${Date.now()}`, name: "", role: "", type: type.slice(0, -1) as Contributor["type"] };
    updateContributors(type, [...contributors, newC]);
  };

  const update = (idx: number, patch: Partial<Contributor>) => {
    const list = contributors.map((c, i) => i === idx ? { ...c, ...patch } : c);
    updateContributors(type, list);
  };

  const remove = (idx: number) => {
    updateContributors(type, contributors.filter((_, i) => i !== idx));
  };

  return (
    <SectionBox
      label={label}
      actionLabel="+ Add"
      onAction={add}
    >
      {contributors.length === 0 ? (
        <p className="font-body text-white/30 text-xs">No {label.toLowerCase()} added yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {contributors.map((c, i) => (
            <ContributorRow
              key={c.id}
              contributor={c}
              roleOptions={roleOptions}
              onChange={(patch) => update(i, patch)}
              onRemove={() => remove(i)}
              canRemove={true}
            />
          ))}
        </div>
      )}
    </SectionBox>
  );
}

/* ─── Main Component ───────────────────────────────────────── */

interface Props {
  state: UploadState;
  update: (patch: Partial<UploadState>) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft?: () => void;
  fieldErrors?: StepFieldErrors;
  clearFieldError?: (key: string) => void;
}

export default function UploadTrack({ state, update, onBack, onContinue, onSaveDraft, fieldErrors = {}, clearFieldError }: Props) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioElRef = useRef<HTMLAudioElement>(null);
  const isSingle = state.releaseType === "single";

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tiktokStamp, setTiktokStamp] = useState("");

  useEffect(() => {
    if (!audioFile) return;
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (playing) { el.play().catch(() => setPlaying(false)); } else { el.pause(); }
  }, [playing]);

  const handleAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setTiktokStamp(`${mins}:${String(secs).padStart(2, "0")}`);
    update({ tiktokTimestamp: Math.floor(currentTime) });
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const subGenres = state.genre ? (GENRE_DATA[state.genre] ?? []) : [];

  const updateContributors = (type: "writers" | "producers" | "performers", list: Contributor[]) => {
    update({ contributors: { ...state.contributors, [type]: list } });
  };

  return (
    <div className="p-8 max-h-[90vh] overflow-y-auto">
      <StepHeader title="Upload Track" subtitle="Upload your audio files and complete all track information" />
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
            fieldErrors.audio ? "border-[#C30100] bg-[#C30100]/5" : audioFile ? "border-[#C30100]/60 bg-[#C30100]/5" : "border-white/10 hover:border-white/25",
          ].join(" ")}
        >
          <AudioIcon />
          <p className="font-body text-white/50 text-sm">
            {audioFile ? audioFile.name : "Drop your audio file or click to browse"}
          </p>
          <p className="font-body text-white/25 text-xs">WAV, MP3, FLAC · Max 500MB · 24-bit recommended</p>
        </button>
        {fieldErrors.audio && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.audio}</p>}
        <input ref={audioInputRef} type="file" accept=".mp3,.wav,.flac,.aac,.ogg,.m4a,audio/mpeg,audio/wav,audio/flac,audio/aac,audio/ogg,audio/mp4" className="hidden" onChange={handleAudio} />

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioElRef}
            src={audioUrl}
            onTimeUpdate={() => setCurrentTime(audioElRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => {
              const dur = audioElRef.current?.duration ?? 0;
              setDuration(dur);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Track Title">
            {isSingle ? (
              <input value={state.trackTitle} readOnly
                className="w-full bg-[#0E0808]/50 border border-white/5 rounded-lg px-4 py-3 font-body text-white/50 text-sm cursor-not-allowed" />
            ) : (
              <input value={state.trackTitle} onChange={(e) => { update({ trackTitle: e.target.value }); clearFieldError?.("trackTitle"); }} placeholder="Enter track title"
                className={`w-full bg-[#0E0808] border rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none transition-colors ${
                  fieldErrors.trackTitle ? "border-[#C30100]" : "border-white/10 focus:border-[#C30100]"
                }`} />
            )}
            {fieldErrors.trackTitle && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.trackTitle}</p>}
          </Field>
          <Field label="Mixed Version">
            <input value={state.mixedVersion} onChange={(e) => update({ mixedVersion: e.target.value })} placeholder="eg radio edit"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          </Field>
        </div>

        {/* Artist Details */}
        <SectionBox label="Artist Details" noAction>
          {isSingle ? (
            <input value={state.artistDetails} readOnly
              className="w-full bg-[#0E0808]/50 border border-white/5 rounded-lg px-4 py-3 font-body text-white/50 text-sm cursor-not-allowed" />
          ) : (
            <input value={state.artistDetails} onChange={(e) => update({ artistDetails: e.target.value })}
              placeholder="e.g. Vjazzy (Main Artist), Davido (Featured)"
              className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
          )}
        </SectionBox>

        {/* Classification */}
        <SectionBox label="Classification" noAction>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Field label="Explicit Content">
              <DashSelect value={state.explicitContent} onChange={(v) => { update({ explicitContent: v }); clearFieldError?.("explicit"); }} options={["Yes", "No", "Clean"]} />
              {fieldErrors.explicit && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.explicit}</p>}
            </Field>
            <Field label="Genre">
              <DashSelect value={state.genre} onChange={(v) => { update({ genre: v, subGenre: "" }); clearFieldError?.("genre"); }} placeholder="Select genre" options={GENRE_OPTIONS} />
              {fieldErrors.genre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.genre}</p>}
            </Field>
            <Field label="Sub-genre">
              <DashSelect value={state.subGenre} onChange={(v) => { update({ subGenre: v }); clearFieldError?.("subGenre"); }} placeholder={subGenres.length ? "Select sub-genre" : "Select genre first"} options={subGenres} />
              {fieldErrors.subGenre && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.subGenre}</p>}
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Recorded Year">
              <DashSelect value={state.recordedYear} onChange={(v) => update({ recordedYear: v })} options={["2026", "2025", "2024", "2023"]} />
            </Field>
            <Field label="ISRC">
              <input value={state.isrc} onChange={(e) => update({ isrc: e.target.value })} placeholder="Auto-generated if blank"
                className="w-full bg-[#0E0808] border border-white/10 rounded-lg px-4 py-3 font-body text-white text-sm placeholder:text-white/25 outline-none focus:border-[#C30100] transition-colors" />
            </Field>
            <Field label="Stereo AI Use">
              <DashSelect value="None" onChange={() => {}} options={["None", "Partial", "Full"]} />
            </Field>
          </div>
        </SectionBox>

        {/* Writers */}
        <ContributorSection label="Writers" type="writers" contributors={state.contributors.writers} roleOptions={WRITER_ROLES} updateContributors={updateContributors} />
        {fieldErrors.writers && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.writers}</p>}

        {/* Production */}
        <ContributorSection label="Production" type="producers" contributors={state.contributors.producers} roleOptions={PRODUCTION_ROLES} updateContributors={updateContributors} />

        {/* Performers */}
        <ContributorSection label="Performers" type="performers" contributors={state.contributors.performers} roleOptions={PERFORMER_ROLES} updateContributors={updateContributors} />
        {fieldErrors.performers && <p className="font-body text-[#C30100] text-xs mt-1">{fieldErrors.performers}</p>}

        {/* Lyrics */}
        <SectionBox label="Lyrics" noAction rightLabel={<DashSelect value="English" onChange={() => {}} options={["English", "Yoruba", "French"]} />}>
          <textarea value={state.lyrics} onChange={(e) => update({ lyrics: e.target.value })} rows={4}
            className="w-full bg-transparent font-body text-white/50 text-sm outline-none resize-none placeholder:text-white/20"
            placeholder="Enter lyrics..." />
        </SectionBox>

        {/* Audio Preview */}
        <SectionBox label="Audio Preview" noAction>
          {!audioFile ? (
            <p className="font-body text-white/30 text-xs">Upload an audio file above to preview it here.</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={() => setPlaying(!playing)}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0">
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-body text-white/40 text-xs shrink-0 tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative" onClick={handleSeek}>
                    <div className="h-full bg-[#C30100] rounded-full pointer-events-none transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <button className="text-white/30 hover:text-white/50 transition-colors"><VolumeIcon /></button>
              </div>
              <button onClick={setTikTokStampFromCurrent}
                className="w-full mt-4 font-heading text-white uppercase text-xs tracking-widest rounded-full border border-[#C30100] py-3 hover:bg-[#C30100] transition-colors">
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
          <input value={tiktokStamp} onChange={(e) => setTiktokStamp(e.target.value)} placeholder="0:00"
            className="w-24 bg-transparent border-b border-white/20 font-body text-white text-sm outline-none pb-1 placeholder:text-white/25" />
        </SectionBox>
      </div>

      <div className="mt-8">
        <StepActions onBack={onBack} onSaveDraft={onSaveDraft} onContinue={onContinue} />
      </div>
    </div>
  );
}

/* ─── Shared UI primitives ──────────────────────────────────── */

function SectionBox({ label, actionLabel, onAction, noAction, rightLabel, children }: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  noAction?: boolean;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#C30100]/25 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-white/70 text-xs font-semibold">{label}</p>
        {!noAction && actionLabel && (
          <button onClick={onAction} className="font-body text-[#C30100] text-xs hover:text-red-400 transition-colors">{actionLabel}</button>
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
